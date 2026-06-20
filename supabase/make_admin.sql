-- =========================================================================
-- SQL Script: Thiết lập tài khoản admin@admin.com thành Quản Trị Viên (Admin)
-- Chạy đoạn mã này trong Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- 1. Tìm ID của tài khoản từ bảng auth.users (đã đăng ký qua Supabase Auth)
    SELECT id::text INTO v_user_id FROM auth.users WHERE email = 'admin@admin.com';

    -- 2. Nếu tài khoản đã tồn tại trong Supabase Auth
    IF v_user_id IS NOT NULL THEN
        -- Kiểm tra nếu đã có bản ghi trong public.user_accounts thì cập nhật
        IF EXISTS (SELECT 1 FROM public.user_accounts WHERE email = 'admin@admin.com') THEN
            UPDATE public.user_accounts
            SET id = v_user_id, -- Đồng bộ hóa ID
                role = 'admin',
                status = 'active',
                permissions = ARRAY['all', 'manage_attendees', 'manage_speakers', 'manage_sponsors', 'manage_finances', 'manage_settings']
            WHERE email = 'admin@admin.com';
            
            RAISE NOTICE 'Đã cập nhật tài khoản auth hiện tại admin@admin.com thành Quản trị viên.';
        ELSE
            -- Nếu chưa có bản ghi thì chèn mới khớp với ID của auth.users
            INSERT INTO public.user_accounts (id, name, email, role, status, permissions)
            VALUES (
                v_user_id,
                'ADMIN SYSTEM',
                'admin@admin.com',
                'admin',
                'active',
                ARRAY['all', 'manage_attendees', 'manage_speakers', 'manage_sponsors', 'manage_finances', 'manage_settings']
            );
            
            RAISE NOTICE 'Đã liên kết và cấp quyền Quản trị viên cho tài khoản auth admin@admin.com.';
        END IF;
        
    -- 3. Nếu tài khoản chưa đăng ký trong Supabase Auth (Tạo sẵn bản ghi trong public.user_accounts)
    ELSE
        IF EXISTS (SELECT 1 FROM public.user_accounts WHERE email = 'admin@admin.com') THEN
            UPDATE public.user_accounts
            SET role = 'admin',
                status = 'active',
                permissions = ARRAY['all', 'manage_attendees', 'manage_speakers', 'manage_sponsors', 'manage_finances', 'manage_settings']
            WHERE email = 'admin@admin.com';
            
            RAISE NOTICE 'Đã cập nhật vai trò Admin cho bản ghi chờ trong public.user_accounts.';
        ELSE
            INSERT INTO public.user_accounts (id, name, email, role, status, permissions)
            VALUES (
                -- Sinh UUID ngẫu nhiên tạm thời làm khóa chính
                gen_random_uuid()::text,
                'ADMIN SYSTEM',
                'admin@admin.com',
                'admin',
                'active',
                ARRAY['all', 'manage_attendees', 'manage_speakers', 'manage_sponsors', 'manage_finances', 'manage_settings']
            );
            
            RAISE NOTICE 'Đã tạo sẵn tài khoản chờ trong public.user_accounts. Hãy tạo tài khoản với email admin@admin.com trên Supabase Auth để kích hoạt đồng bộ đăng nhập.';
        END IF;
    END IF;
END $$;
