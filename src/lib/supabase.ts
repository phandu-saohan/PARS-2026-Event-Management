/**
 * Supabase Client Singleton
 * Kết nối trực tiếp từ browser đến Supabase (database, auth, realtime)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase chưa được cấu hình. Hệ thống sẽ chạy ở chế độ offline (localStorage).\n' +
    'Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env.local'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL');
}

/**
 * Uploads a base64 string or file object to a Supabase bucket
 * @param path The destination path in the bucket (e.g. 'avatars/user-123.png')
 * @param fileOrBase64 The base64 data string (starts with data:image/...) or a File object
 * @param bucket Default is 'assets'
 */
export async function uploadToSupabaseStorage(
  path: string, 
  fileOrBase64: File | string, 
  bucket: string = 'assets'
): Promise<string | null> {
  try {
    let body: any;
    let contentType = 'image/png';

    if (typeof fileOrBase64 === 'string') {
      if (!fileOrBase64.startsWith('data:')) {
        // Not a base64 data URL, return as is
        return fileOrBase64;
      }
      
      // Parse base64 data
      const parts = fileOrBase64.split(';base64,');
      const header = parts[0];
      const base64Data = parts[1];
      
      contentType = header.split(':')[1] || 'image/png';
      
      // Convert base64 to binary ArrayBuffer
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      body = bytes.buffer;
    } else {
      body = fileOrBase64;
      contentType = fileOrBase64.type;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, body, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Error uploading file to Supabase storage:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error inside uploadToSupabaseStorage:', err);
    return null;
  }
}
