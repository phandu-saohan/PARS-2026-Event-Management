import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://botibsighhbdaqhoxfxc.supabase.co';
const NEW_ANON_KEY = 'sb_publishable_VLSdXyEvhLL12dTfui7Dfg_u5XWL9eW';

const supabase = createClient(NEW_SUPABASE_URL, NEW_ANON_KEY);

async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: '12345678'
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }

  const { data: attendees, error: attErr } = await supabase
    .from('attendees')
    .select('id, full_name, avatar_url, transaction_proof_url');

  if (attErr) {
    console.error('Error fetching attendees:', attErr);
    return;
  }

  console.log(`Found ${attendees.length} attendees.`);

  let successCount = 0;
  let blockedCount = 0;

  for (const att of attendees) {
    if (att.avatar_url && att.avatar_url.includes('fiifqrffravksxkydmkg.supabase.co')) {
      const oldUrl = att.avatar_url;
      try {
        const res = await fetch(oldUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : 'jpeg';
          const newPath = `avatars/${att.id}-${Date.now()}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('assets')
            .upload(newPath, Buffer.from(buffer), { contentType, upsert: true });

          if (!upErr) {
            const newUrl = `${NEW_SUPABASE_URL}/storage/v1/object/public/assets/${newPath}`;
            await supabase.from('attendees').update({ avatar_url: newUrl }).eq('id', att.id);
            console.log(`✅ Migrated avatar for ${att.id}: ${att.full_name}`);
            successCount++;
          } else {
            console.error(`❌ Upload error for ${att.id}:`, upErr);
          }
        } else {
          // Status 402 or 404
          blockedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${att.id}:`, err.message);
      }
    }
  }

  console.log(`\nMigration summary:`);
  console.log(`- Successfully transferred to new Supabase: ${successCount}`);
  console.log(`- Blocked on old Supabase (due to 402 exceed_egress_quota): ${blockedCount}`);
}

run().catch(console.error);
