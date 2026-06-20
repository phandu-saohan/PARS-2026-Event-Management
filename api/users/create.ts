import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, role, permissions } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc (email, mật khẩu, tên, vai trò).' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // Fallback to service key if defined in various formats
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'Cổng Supabase chưa được cấu hình Service Role Key. Vui lòng thiết lập biến môi trường SUPABASE_SERVICE_ROLE_KEY trên Vercel.' 
    });
  }

  try {
    // Create admin supabase client with admin privileges (bypassing RLS for user management)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Create the user in Supabase Authentication
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      throw new Error(`Lỗi tạo tài khoản Auth: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Không nhận được thông tin người dùng từ Supabase Auth');
    }

    const userId = authData.user.id; // Get the generated UUID

    // 2. Create the profile record in public.user_accounts linked to that UUID
    const { error: dbError } = await supabaseAdmin
      .from('user_accounts')
      .insert({
        id: userId,
        name,
        email,
        role,
        status: 'active',
        permissions: permissions || []
      });

    if (dbError) {
      // Rollback the created auth user if database profile insertion fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Lỗi tạo profile database: ${dbError.message}`);
    }

    return res.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        status: 'active',
        permissions: permissions || []
      }
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi hệ thống khi tạo nhân sự'
    });
  }
}
