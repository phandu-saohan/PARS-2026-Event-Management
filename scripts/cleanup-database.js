import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function uploadToStorage(filePath, base64Data) {
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length < 2) return null;
    const header = parts[0];
    const rawData = parts[1];
    const contentType = header.split(':')[1] || 'image/png';
    
    const buffer = Buffer.from(rawData, 'base64');
    
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading ${filePath}:`, error);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`Error uploading ${filePath}:`, err);
    return null;
  }
}

async function cleanup() {
  console.log('Fetching speakers...');
  const { data: speakers, error: spkError } = await supabase
    .from('speakers')
    .select('id, full_name, avatar_url, document_url');
    
  if (spkError) {
    console.error('Error fetching speakers:', spkError);
  } else {
    console.log(`Fetched ${speakers.length} speakers`);
    for (const speaker of speakers) {
      if (speaker.avatar_url && speaker.avatar_url.startsWith('data:')) {
        console.log(`Speaker ${speaker.full_name || speaker.id} has base64 avatar. Uploading to storage...`);
        const ext = speaker.avatar_url.split(';')[0].split('/')[1] || 'png';
        const filePath = `avatars/migrated-${speaker.id}-${Date.now()}.${ext}`;
        const publicUrl = await uploadToStorage(filePath, speaker.avatar_url);
        
        if (publicUrl) {
          const { error: updateError } = await supabase
            .from('speakers')
            .update({ avatar_url: publicUrl })
            .eq('id', speaker.id);
            
          if (updateError) {
            console.error(`Failed to update speaker ${speaker.id} in DB:`, updateError);
          } else {
            console.log(`✅ Migrated speaker ${speaker.id} to ${publicUrl}`);
          }
        } else {
          console.warn(`Failed to upload avatar for speaker ${speaker.id}. Setting avatar_url to null to avoid local storage crash.`);
          await supabase
            .from('speakers')
            .update({ avatar_url: null })
            .eq('id', speaker.id);
        }
      }

      if (speaker.document_url && speaker.document_url.includes('data:')) {
        const urls = speaker.document_url.split('|');
        const uploadedUrls = [];
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          if (url.startsWith('data:')) {
            console.log(`Speaker ${speaker.full_name || speaker.id} has base64 document. Uploading to storage...`);
            let ext = 'pdf';
            const mimeMatch = url.match(/^data:([^;]+);base64,/);
            if (mimeMatch) {
              const mime = mimeMatch[1];
              if (mime.includes('pdf')) ext = 'pdf';
              else if (mime.includes('word') || mime.includes('document')) ext = 'docx';
              else if (mime.includes('sheet') || mime.includes('excel')) ext = 'xlsx';
              else {
                const parts = mime.split('/');
                ext = parts[parts.length - 1] || 'pdf';
              }
            }
            const filePath = `documents/migrated-${speaker.id}-${i}-${Date.now()}.${ext}`;
            const publicUrl = await uploadToStorage(filePath, url);
            if (publicUrl) {
              uploadedUrls.push(publicUrl);
            }
          } else {
            uploadedUrls.push(url);
          }
        }
        
        if (uploadedUrls.length > 0) {
          const newDocUrl = uploadedUrls.join('|');
          const { error: updateError } = await supabase
            .from('speakers')
            .update({ document_url: newDocUrl })
            .eq('id', speaker.id);
            
          if (updateError) {
            console.error(`Failed to update speaker doc ${speaker.id} in DB:`, updateError);
          } else {
            console.log(`✅ Migrated speaker doc ${speaker.id} to ${newDocUrl}`);
          }
        }
      }
    }
  }

  console.log('Fetching attendees...');
  const { data: attendees, error: attError } = await supabase
    .from('attendees')
    .select('id, full_name, avatar_url, transaction_proof_url');
    
  if (attError) {
    console.error('Error fetching attendees:', attError);
  } else {
    console.log(`Fetched ${attendees.length} attendees`);
    for (const attendee of attendees) {
      if (attendee.avatar_url && attendee.avatar_url.startsWith('data:')) {
        console.log(`Attendee ${attendee.full_name || attendee.id} has base64 avatar. Uploading to storage...`);
        const ext = attendee.avatar_url.split(';')[0].split('/')[1] || 'png';
        const filePath = `avatars/migrated-${attendee.id}-${Date.now()}.${ext}`;
        const publicUrl = await uploadToStorage(filePath, attendee.avatar_url);
        
        if (publicUrl) {
          await supabase
            .from('attendees')
            .update({ avatar_url: publicUrl })
            .eq('id', attendee.id);
          console.log(`✅ Migrated attendee avatar ${attendee.id}`);
        } else {
          await supabase
            .from('attendees')
            .update({ avatar_url: null })
            .eq('id', attendee.id);
        }
      }
      
      if (attendee.transaction_proof_url && attendee.transaction_proof_url.startsWith('data:')) {
        console.log(`Attendee ${attendee.full_name || attendee.id} has base64 proof. Uploading to storage...`);
        const ext = attendee.transaction_proof_url.split(';')[0].split('/')[1] || 'png';
        const filePath = `proofs/migrated-${attendee.id}-${Date.now()}.${ext}`;
        const publicUrl = await uploadToStorage(filePath, attendee.transaction_proof_url);
        
        if (publicUrl) {
          await supabase
            .from('attendees')
            .update({ transaction_proof_url: publicUrl })
            .eq('id', attendee.id);
          console.log(`✅ Migrated attendee proof ${attendee.id}`);
        } else {
          await supabase
            .from('attendees')
            .update({ transaction_proof_url: null })
            .eq('id', attendee.id);
        }
      }
    }
  }

  console.log('Fetching sponsors...');
  const { data: sponsors, error: spsError } = await supabase
    .from('sponsors')
    .select('id, name, logo_url');
    
  if (spsError) {
    console.error('Error fetching sponsors:', spsError);
  } else {
    console.log(`Fetched ${sponsors.length} sponsors`);
    for (const sponsor of sponsors) {
      if (sponsor.logo_url && sponsor.logo_url.startsWith('data:')) {
        console.log(`Sponsor ${sponsor.name || sponsor.id} has base64 logo. Uploading to storage...`);
        const ext = sponsor.logo_url.split(';')[0].split('/')[1] || 'png';
        const filePath = `logos/migrated-${sponsor.id}-${Date.now()}.${ext}`;
        const publicUrl = await uploadToStorage(filePath, sponsor.logo_url);
        
        if (publicUrl) {
          await supabase
            .from('sponsors')
            .update({ logo_url: publicUrl })
            .eq('id', sponsor.id);
          console.log(`✅ Migrated sponsor logo ${sponsor.id}`);
        } else {
          await supabase
            .from('sponsors')
            .update({ logo_url: null })
            .eq('id', sponsor.id);
        }
      }
    }
  }

  console.log('Database cleanup completed!');
}

cleanup();
