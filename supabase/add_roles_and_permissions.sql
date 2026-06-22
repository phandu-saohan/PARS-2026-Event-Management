-- ============================================================
-- SQL Migration: Add Roles & Custom Granular Permissions
-- ============================================================

-- 1. Create public.roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}'::text[],
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drop the hardcoded CHECK constraint on user_accounts.role
ALTER TABLE public.user_accounts DROP CONSTRAINT IF EXISTS user_accounts_role_check;

-- 3. Seed default roles (admin, btc, ctv)
INSERT INTO public.roles (id, code, name, description, permissions, is_system) VALUES
('role-admin', 'admin', 'Toàn Trị', 'Quyền quản trị viên tối cao, có thể quản lý tất cả các phân hệ và cấu hình hệ thống.',
 ARRAY[
   'overview.view', 
   'schedule.view', 'schedule.edit', 
   'speakers.view', 'speakers.edit', 
   'attendees.view', 'attendees.edit', 
   'sponsors.view', 'sponsors.edit', 
   'notifications.view', 'notifications.edit', 'notifications.send',
   'tasks.view', 'tasks.edit',
   'finances.view', 'finances.edit', 
   'marketing.view', 'marketing.edit', 'marketing.publish',
   'settings.view', 'settings.edit', 'settings.roles'
 ], TRUE),
('role-btc', 'btc', 'Ban Tổ Chức', 'Thành viên Ban Tổ Chức, có quyền quản lý đại biểu, lịch trình, báo cáo viên, gửi thông báo và công việc nội bộ.',
 ARRAY[
   'overview.view', 
   'schedule.view', 'schedule.edit', 
   'speakers.view', 'speakers.edit', 
   'attendees.view', 'attendees.edit', 
   'sponsors.view', 'sponsors.edit', 
   'notifications.view', 'notifications.edit', 'notifications.send',
   'tasks.view', 'tasks.edit',
   'finances.view',
   'marketing.view', 'marketing.edit',
   'settings.view'
 ], TRUE),
('role-ctv', 'ctv', 'Cộng Tác Viên', 'Cộng tác viên hỗ trợ sự kiện, chủ yếu hỗ trợ check-in đại biểu, xem lịch trình và thực hiện các nhiệm vụ được giao.',
 ARRAY[
   'overview.view', 
   'schedule.view', 
   'speakers.view', 
   'attendees.view', 'attendees.checkin',
   'tasks.view', 'tasks.edit'
 ], TRUE)
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system = EXCLUDED.is_system;

-- 4. Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS policies
DROP POLICY IF EXISTS "Allow authenticated read roles" ON public.roles;
CREATE POLICY "Allow authenticated read roles" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage roles" ON public.roles;
CREATE POLICY "Allow authenticated manage roles" ON public.roles TO authenticated USING (true) WITH CHECK (true);

-- 6. Add roles to supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'roles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
    END IF;
END $$;
