/**
 * Authentication module using Supabase Auth
 * Quản lý đăng nhập, đăng xuất, phiên làm việc và phân quyền
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'inactive';
}

/**
 * Đăng nhập bằng email + password (Supabase Auth)
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase chưa được cấu hình. Vui lòng kiểm tra .env.local' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: 'Không tìm thấy thông tin người dùng' };
  }

  // Fetch role from user_accounts table
  const authUser = await fetchUserProfile(data.user.id, data.user.email || '');
  return { user: authUser, error: null };
}

/**
 * Đăng xuất
 */
export async function signOut(): Promise<void> {
  localStorage.removeItem('pars_supabase_user_profile');
  localStorage.removeItem('pars_mock_user');
  await supabase.auth.signOut();
}

/**
 * Lấy phiên hiện tại
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Lấy user hiện tại
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Supabase getUser returned error, trying local session:', error);
      // Fallback to local session user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return fetchUserProfile(session.user.id, session.user.email || '');
      }
      return null;
    }
    if (!user) return null;
    return fetchUserProfile(user.id, user.email || '');
  } catch (err) {
    console.error('Error in getCurrentUser, falling back to local session:', err);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return fetchUserProfile(session.user.id, session.user.email || '');
      }
    } catch (sessionErr) {
      console.error('Error getting local session:', sessionErr);
    }
    return null;
  }
}

/**
 * Lắng nghe thay đổi auth state
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Gửi email reset mật khẩu
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?view=overview`,
  });
  return { error: error?.message || null };
}

/**
 * Lấy thông tin profile + role từ bảng user_accounts
 */
async function fetchUserProfile(authId: string, email: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Try to load cached profile from localStorage
      const cached = localStorage.getItem('pars_supabase_user_profile');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.email === email) {
            return parsed;
          }
        } catch (e) {
          console.error('Error parsing cached user profile:', e);
        }
      }

      // Fallback: tạo user profile mặc định với role 'ctv' nếu chưa có (ngoại trừ admin@admin.com)
      return {
        id: authId,
        email,
        name: email.split('@')[0],
        role: email.trim().toLowerCase() === 'admin@admin.com' ? 'admin' : 'ctv',
        status: 'active',
      };
    }

    const profile: AuthUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as Role,
      status: data.status || 'active',
    };

    // Cache the profile
    localStorage.setItem('pars_supabase_user_profile', JSON.stringify(profile));

    return profile;
  } catch {
    // Try to load cached profile from localStorage
    const cached = localStorage.getItem('pars_supabase_user_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.email === email) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing cached user profile:', e);
      }
    }

    return {
      id: authId,
      email,
      name: email.split('@')[0],
      role: email.trim().toLowerCase() === 'admin@admin.com' ? 'admin' : 'ctv',
      status: 'active',
    };
  }
}
