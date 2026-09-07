-- =========================================================================
--  PARS 2026 — SQL TẠO HOẶC CẬP NHẬT TÀI KHOẢN ADMIN CHÍNH
--  Email    : admin@admin.com
--  Password : 12345678
--  Quyền    : Quản trị viên tối cao (Role: admin, đầy đủ permissions)
--
--  HƯỚNG DẪN CHẠY:
--  1. Mở Supabase Dashboard (Dự án mới hoặc hiện tại).
--  2. Chọn SQL Editor ở thanh menu bên trái -> Bấm "New query".
--  3. Dán toàn bộ mã bên dưới và bấm nút "Run".
--  4. Đăng nhập ngay trên trang quản trị với admin@admin.com / 12345678.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- 1. Mã hóa mật khẩu 12345678 theo chuẩn Blowfish (bcrypt) của Supabase Auth
    v_encrypted_pw := crypt('12345678', gen_salt('bf'));

    -- 2. Kiểm tra xem email admin@admin.com đã tồn tại trong auth.users chưa
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@admin.com';

    IF v_user_id IS NOT NULL THEN
        -- Đã có tài khoản: Cập nhật mật khẩu thành 12345678 và xác nhận email
        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw,
            email_confirmed_at = COALESCE(email_confirmed_at, timezone('utc'::text, now())),
            updated_at = timezone('utc'::text, now()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = '{"name":"Admin Chính"}'::jsonb
        WHERE id = v_user_id;

        -- Đảm bảo có bản ghi identity liên kết
        IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
            INSERT INTO auth.identities (
                id, user_id, provider_id, identity_data, provider, email, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                v_user_id::text,
                jsonb_build_object('sub', v_user_id::text, 'email', 'admin@admin.com'),
                'email',
                'admin@admin.com',
                timezone('utc'::text, now()),
                timezone('utc'::text, now())
            );
        END IF;

        RAISE NOTICE 'Đã cập nhật mật khẩu 12345678 cho tài khoản admin@admin.com.';
    ELSE
        -- Chưa có: Tạo tài khoản mới trực tiếp trong auth.users
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'admin@admin.com',
            v_encrypted_pw,
            timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"name":"Admin Chính"}'::jsonb,
            false,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );

        -- Thêm thông tin định danh tương ứng trong auth.identities
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, email, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_user_id::text,
            jsonb_build_object('sub', v_user_id::text, 'email', 'admin@admin.com'),
            'email',
            'admin@admin.com',
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );

        RAISE NOTICE 'Đã tạo mới tài khoản admin@admin.com với ID: %', v_user_id;
    END IF;

    -- 3. Tạo / Đồng bộ quyền Admin chính tối cao trong bảng public.user_accounts
    INSERT INTO public.user_accounts (id, name, email, role, status, permissions)
    VALUES (
        v_user_id::text,
        'Admin Chính',
        'admin@admin.com',
        'admin',
        'active',
        ARRAY[
            'overview.view',
            'schedule.view', 'schedule.edit',
            'speakers.view', 'speakers.edit',
            'attendees.view', 'attendees.edit', 'attendees.checkin',
            'sponsors.view', 'sponsors.edit',
            'notifications.view', 'notifications.edit', 'notifications.send',
            'tasks.view', 'tasks.edit',
            'finances.view', 'finances.edit',
            'marketing.view', 'marketing.edit', 'marketing.publish',
            'settings.view', 'settings.edit', 'settings.roles'
        ]
    )
    ON CONFLICT (email) DO UPDATE SET
        id          = EXCLUDED.id,
        name        = EXCLUDED.name,
        role        = 'admin',
        status      = 'active',
        permissions = EXCLUDED.permissions;

    RAISE NOTICE 'Đã kích hoạt quyền Admin chính thành công!';
END $$;
