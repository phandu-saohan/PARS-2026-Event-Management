-- ============================================================
--  PARS 2026 — FULL MIGRATION SCRIPT FOR SUPABASE
--  Tác giả  : PARS 2026 Dev Team
--  Phiên bản: v2.0  (2026-06-25)
--  Mô tả    : Script SQL tổng hợp, idempotent — có thể chạy
--             nhiều lần mà không gây lỗi trùng lặp.
--             Bao gồm: Tạo bảng, RLS, Realtime, Seed mặc định,
--             Migrations bổ sung, Storage bucket.
--
--  CÁCH CHẠY:
--  1. Vào Supabase Dashboard → SQL Editor
--  2. Paste toàn bộ nội dung file này
--  3. Nhấn "Run" — script sẽ tự bỏ qua những gì đã tồn tại
-- ============================================================

-- Bật extension cần thiết
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- PHẦN 1: TẠO BẢNG (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- 1. Gói đăng ký (Registration Packages)
CREATE TABLE IF NOT EXISTS public.packages (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    fee               NUMERIC NOT NULL DEFAULT 0,
    benefits          TEXT[] DEFAULT '{}',
    is_active         BOOLEAN DEFAULT TRUE,
    description       TEXT,
    includes_cme      BOOLEAN DEFAULT FALSE,
    includes_gala     BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Chuyên khoa / Phân khoa báo cáo
CREATE TABLE IF NOT EXISTS public.specialty_tracks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    name_en     TEXT,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Cấu hình nghiệp vụ sự kiện (Business Config)
CREATE TABLE IF NOT EXISTS public.business_config (
    id                      TEXT PRIMARY KEY DEFAULT 'default',
    event_name              TEXT NOT NULL DEFAULT 'PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế',
    organizer_name          TEXT NOT NULL DEFAULT 'Hội Phẫu Thuật Tạo Hình Thẩm Mỹ Việt Nam (PARS)',
    event_date              TEXT NOT NULL DEFAULT '12-13/09/2026',
    event_location          TEXT NOT NULL DEFAULT 'Hà Nội, Việt Nam',
    max_registrations       INTEGER DEFAULT 1500,
    require_payment_proof   BOOLEAN DEFAULT TRUE,
    allow_self_cancellation BOOLEAN DEFAULT FALSE,
    auto_send_zns           BOOLEAN DEFAULT TRUE,
    require_practice_code   BOOLEAN DEFAULT TRUE,
    pwa_name                TEXT DEFAULT 'PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ',
    pwa_short_name          TEXT DEFAULT 'PARS 2026',
    pwa_description         TEXT DEFAULT 'Hệ thống quản lý Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên PARS 2026',
    pwa_logo_url            TEXT DEFAULT '/icons/icon-512.png',
    pwa_theme_color         TEXT DEFAULT '#4f46e5',
    pwa_background_color    TEXT DEFAULT '#0f172a',
    app_url                 TEXT DEFAULT 'https://pars2026.vercel.app',
    attendee_id_prefix      TEXT DEFAULT 'PARS2026',
    delegate_form_config    JSONB DEFAULT '{}'::jsonb,
    speaker_form_config     JSONB DEFAULT '{}'::jsonb,
    sponsor_form_config     JSONB DEFAULT '{}'::jsonb,
    add_on_services         JSONB DEFAULT '[]'::jsonb,
    cme_template_config     JSONB DEFAULT '{}'::jsonb,
    landing_logo_url        TEXT,
    landing_landmarks_url   TEXT,
    landing_slide1_url      TEXT,
    landing_slide2_url      TEXT,
    landing_slide3_url      TEXT,
    landing_slide4_url      TEXT,
    landing_page_sections   JSONB DEFAULT '{}'::jsonb,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Tài khoản người dùng (Admin / BTC / CTV)
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    role        TEXT NOT NULL,
    status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_active TIMESTAMP WITH TIME ZONE,
    permissions TEXT[] DEFAULT '{}'::text[],
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Lịch trình hội nghị (Conference Sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    speaker_name TEXT,
    speaker_title TEXT,
    room_name    TEXT,
    date         TEXT NOT NULL,
    start_time   TEXT NOT NULL,
    end_time     TEXT NOT NULL,
    track        TEXT,
    description  TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. Đại biểu tham dự (Attendees)
CREATE TABLE IF NOT EXISTS public.attendees (
    id                    TEXT PRIMARY KEY,
    title                 TEXT NOT NULL,
    full_name             TEXT NOT NULL,
    organization          TEXT,
    department            TEXT,
    phone                 TEXT,
    email                 TEXT,
    address               TEXT,
    nationality           TEXT DEFAULT 'vietname',
    package_id            TEXT REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name          TEXT,
    package_fee           NUMERIC DEFAULT 0,
    payment_status        TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending_verification')),
    payment_method        TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash')),
    transaction_proof_url TEXT,
    registration_date     TEXT NOT NULL,
    qr_code_value         TEXT UNIQUE NOT NULL,
    is_checked_in         BOOLEAN DEFAULT FALSE,
    check_in_time         TEXT,
    notes                 TEXT,
    year_of_birth         INTEGER,
    gender                TEXT,
    cme_required          BOOLEAN DEFAULT FALSE,
    cme_identity_no       TEXT,
    gala_required         BOOLEAN DEFAULT FALSE,
    masterclass_required  BOOLEAN DEFAULT FALSE,
    tour_required         BOOLEAN DEFAULT FALSE,
    registration_period   TEXT,
    province              TEXT,
    avatar_url            TEXT,
    doctor_proof_url      TEXT,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 7. Báo cáo viên (Speakers)
CREATE TABLE IF NOT EXISTS public.speakers (
    id                   TEXT PRIMARY KEY,
    title                TEXT,
    full_name            TEXT NOT NULL,
    organization         TEXT,
    department           TEXT,
    phone                TEXT,
    email                TEXT,
    bio                  TEXT,
    presentation_title   TEXT NOT NULL,
    presentation_track   TEXT,
    abstract_text        TEXT,
    document_url         TEXT,
    document_name        TEXT,
    calendar_synced      BOOLEAN DEFAULT FALSE,
    status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    scheduled_session_id TEXT REFERENCES public.sessions(id) ON DELETE SET NULL,
    avatar_url           TEXT,
    registration_date    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 8. Nhà tài trợ (Sponsors)
CREATE TABLE IF NOT EXISTS public.sponsors (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    tier                TEXT NOT NULL CHECK (tier IN ('diamond', 'platinum', 'gold', 'silver', 'bronze', 'co_sponsor')),
    logo_url            TEXT,
    pledged_amount      NUMERIC DEFAULT 0,
    paid_amount         NUMERIC DEFAULT 0,
    payment_status      TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('fully_paid', 'unpaid', 'partially_paid')),
    contact_person      TEXT,
    contact_email       TEXT,
    contact_phone       TEXT,
    booth_location      TEXT,
    benefits_signed     TEXT[] DEFAULT '{}',
    notes               TEXT,
    contract_no         TEXT,
    contract_sign_date  TEXT,
    contract_value      NUMERIC DEFAULT 0,
    contract_status     TEXT CHECK (contract_status IN ('signed', 'pending_signature', 'draft', 'cancelled')),
    contract_file_url   TEXT,
    contract_file_name  TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 9. Công việc nội bộ BTC (Internal Tasks)
CREATE TABLE IF NOT EXISTS public.internal_tasks (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT,
    assigned_to_name TEXT,
    assigned_to_id   TEXT REFERENCES public.user_accounts(id) ON DELETE SET NULL,
    priority         TEXT CHECK (priority IN ('high', 'medium', 'low')),
    status           TEXT CHECK (status IN ('todo', 'in_progress', 'done')),
    deadline         TEXT,
    progress         INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 10. Giao dịch tài chính (Finance Transactions)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id             TEXT PRIMARY KEY,
    date           TEXT NOT NULL,
    type           TEXT CHECK (type IN ('income', 'expense')),
    category       TEXT NOT NULL,
    amount         NUMERIC NOT NULL DEFAULT 0,
    description    TEXT,
    reference_id   TEXT,
    payment_method TEXT,
    verified_by    TEXT,
    is_verified    BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 11. Mẫu thông báo (Notification Templates)
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    channel         TEXT NOT NULL CHECK (channel IN ('email', 'zalo', 'sms', 'whatsapp')),
    subject         TEXT,
    content         TEXT NOT NULL,
    status          TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    zns_template_id TEXT,
    zns_type        TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 12. Lịch sử gửi thông báo (Notification Logs)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id            TEXT PRIMARY KEY,
    recipient     TEXT NOT NULL,
    type          TEXT NOT NULL CHECK (type IN ('email', 'zalo', 'sms', 'whatsapp')),
    template_id   TEXT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    template_name TEXT,
    sender        TEXT NOT NULL,
    sent_at       TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    payload       JSONB DEFAULT '{}'::jsonb,
    response      JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 13. Mã nhúng bên thứ ba (Embed Scripts)
CREATE TABLE IF NOT EXISTS public.embed_scripts (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    target_type  TEXT NOT NULL CHECK (target_type IN ('delegate', 'speaker', 'sponsor', 'analytics', 'custom')),
    code         TEXT NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    notes        TEXT,
    created_at   TEXT NOT NULL,
    created_at_db TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 14. Cấu hình hệ thống (Zalo, Email, Resend... dưới dạng JSONB)
CREATE TABLE IF NOT EXISTS public.system_config (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 15. Bài đăng Marketing
CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    content      TEXT,
    type         TEXT NOT NULL,
    platforms    TEXT[],
    status       TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metrics      JSONB,
    media_url    TEXT,
    video_script TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 16. Vai trò tùy chỉnh (Custom Roles & Permissions)
CREATE TABLE IF NOT EXISTS public.roles (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}'::text[],
    is_system   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 17. Chiến dịch gửi hàng loạt (Sending Campaigns)
CREATE TABLE IF NOT EXISTS public.sending_campaigns (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    channel          TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
    template_id      TEXT,
    subject          TEXT,
    body             TEXT,
    status           TEXT NOT NULL CHECK (status IN ('draft', 'sending', 'paused', 'completed')),
    total_recipients INTEGER DEFAULT 0,
    success_count    INTEGER DEFAULT 0,
    failed_count     INTEGER DEFAULT 0,
    recipients       JSONB DEFAULT '[]'::jsonb,
    logs             JSONB DEFAULT '[]'::jsonb,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 18. Danh bạ / Liên hệ (Contacts)
CREATE TABLE IF NOT EXISTS public.contacts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    phone      TEXT,
    group_name TEXT DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 19. Hình ảnh sự kiện / Media Gallery (Event Images)
CREATE TABLE IF NOT EXISTS public.event_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url         TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    file_size   INTEGER,
    mime_type   TEXT DEFAULT 'image/png',
    category    TEXT DEFAULT 'general',
    caption     TEXT,
    uploaded_by TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 20. Phòng / Hội trường (Rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
    name       TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 21. Ngày tổ chức (Schedule Dates)
CREATE TABLE IF NOT EXISTS public.schedule_dates (
    date_val   TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 22. Buổi họp / Ca (Shifts)
CREATE TABLE IF NOT EXISTS public.shifts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time   TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 23. Section ảo (Virtual Sections)
CREATE TABLE IF NOT EXISTS public.virtual_sections (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    room_name   TEXT NOT NULL,
    track_name  TEXT NOT NULL,
    buoi_id     TEXT NOT NULL,
    start_time  TEXT NOT NULL,
    end_time    TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);


-- ============================================================
-- PHẦN 2: MIGRATIONS — THÊM CỘT CÒN THIẾU (ALTER TABLE)
-- ============================================================

-- Bỏ ràng buộc role cũ (nếu tồn tại) để hỗ trợ custom roles
ALTER TABLE public.user_accounts DROP CONSTRAINT IF EXISTS user_accounts_role_check;

-- Đảm bảo cột landing_page_sections tồn tại trong business_config
ALTER TABLE public.business_config
    ADD COLUMN IF NOT EXISTS landing_page_sections JSONB DEFAULT '{}'::jsonb;

-- Đảm bảo cột attendee_id_prefix tồn tại
ALTER TABLE public.business_config
    ADD COLUMN IF NOT EXISTS attendee_id_prefix TEXT DEFAULT 'PARS2026';

-- Đảm bảo cột landing_logo_url tồn tại
ALTER TABLE public.business_config
    ADD COLUMN IF NOT EXISTS landing_logo_url TEXT;

-- Đảm bảo cột doctor_proof_url tồn tại trong attendees
ALTER TABLE public.attendees
    ADD COLUMN IF NOT EXISTS doctor_proof_url TEXT;


-- ============================================================
-- PHẦN 3: KÍCH HOẠT ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.packages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embed_scripts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_sections      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PHẦN 4: CHÍNH SÁCH RLS (DROP IF EXISTS → CREATE)
-- ============================================================

-- [packages]
DROP POLICY IF EXISTS "Allow public read packages"           ON public.packages;
DROP POLICY IF EXISTS "Allow authenticated manage packages"  ON public.packages;
CREATE POLICY "Allow public read packages"          ON public.packages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage packages" ON public.packages TO authenticated USING (true) WITH CHECK (true);

-- [specialty_tracks]
DROP POLICY IF EXISTS "Allow public read specialty_tracks"           ON public.specialty_tracks;
DROP POLICY IF EXISTS "Allow authenticated manage specialty_tracks"  ON public.specialty_tracks;
CREATE POLICY "Allow public read specialty_tracks"          ON public.specialty_tracks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage specialty_tracks" ON public.specialty_tracks TO authenticated USING (true) WITH CHECK (true);

-- [business_config]
DROP POLICY IF EXISTS "Allow public read business_config"           ON public.business_config;
DROP POLICY IF EXISTS "Allow authenticated manage business_config"  ON public.business_config;
CREATE POLICY "Allow public read business_config"          ON public.business_config FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage business_config" ON public.business_config TO authenticated USING (true) WITH CHECK (true);

-- [user_accounts]
DROP POLICY IF EXISTS "Allow authenticated read user_accounts"    ON public.user_accounts;
DROP POLICY IF EXISTS "Allow authenticated manage user_accounts"  ON public.user_accounts;
CREATE POLICY "Allow authenticated read user_accounts"   ON public.user_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated manage user_accounts" ON public.user_accounts TO authenticated USING (true) WITH CHECK (true);

-- [sessions]
DROP POLICY IF EXISTS "Allow public read sessions"           ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated manage sessions"  ON public.sessions;
CREATE POLICY "Allow public read sessions"          ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage sessions" ON public.sessions TO authenticated USING (true) WITH CHECK (true);

-- [attendees]
DROP POLICY IF EXISTS "Allow public insert attendees"        ON public.attendees;
DROP POLICY IF EXISTS "Allow public update attendees"        ON public.attendees;
DROP POLICY IF EXISTS "Allow public read attendees for checkin" ON public.attendees;
DROP POLICY IF EXISTS "Allow authenticated manage attendees" ON public.attendees;
CREATE POLICY "Allow public insert attendees"        ON public.attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendees"        ON public.attendees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read attendees for checkin" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage attendees" ON public.attendees TO authenticated USING (true) WITH CHECK (true);

-- [speakers]
DROP POLICY IF EXISTS "Allow public read speakers"           ON public.speakers;
DROP POLICY IF EXISTS "Allow public insert speakers"         ON public.speakers;
DROP POLICY IF EXISTS "Allow authenticated manage speakers"  ON public.speakers;
CREATE POLICY "Allow public read speakers"          ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Allow public insert speakers"        ON public.speakers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage speakers" ON public.speakers TO authenticated USING (true) WITH CHECK (true);

-- [sponsors]
DROP POLICY IF EXISTS "Allow public read sponsors"           ON public.sponsors;
DROP POLICY IF EXISTS "Allow public insert sponsors"         ON public.sponsors;
DROP POLICY IF EXISTS "Allow authenticated manage sponsors"  ON public.sponsors;
CREATE POLICY "Allow public read sponsors"          ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Allow public insert sponsors"        ON public.sponsors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sponsors" ON public.sponsors TO authenticated USING (true) WITH CHECK (true);

-- [internal_tasks]
DROP POLICY IF EXISTS "Allow authenticated manage internal_tasks" ON public.internal_tasks;
CREATE POLICY "Allow authenticated manage internal_tasks" ON public.internal_tasks TO authenticated USING (true) WITH CHECK (true);

-- [finance_transactions]
DROP POLICY IF EXISTS "Allow authenticated manage finance_transactions" ON public.finance_transactions;
CREATE POLICY "Allow authenticated manage finance_transactions" ON public.finance_transactions TO authenticated USING (true) WITH CHECK (true);

-- [notification_templates]
DROP POLICY IF EXISTS "Allow authenticated manage notification_templates" ON public.notification_templates;
CREATE POLICY "Allow authenticated manage notification_templates" ON public.notification_templates TO authenticated USING (true) WITH CHECK (true);

-- [notification_logs]
DROP POLICY IF EXISTS "Allow public insert notification_logs"        ON public.notification_logs;
DROP POLICY IF EXISTS "Allow authenticated manage notification_logs" ON public.notification_logs;
CREATE POLICY "Allow public insert notification_logs"        ON public.notification_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage notification_logs" ON public.notification_logs TO authenticated USING (true) WITH CHECK (true);

-- [embed_scripts]
DROP POLICY IF EXISTS "Allow authenticated manage embed_scripts" ON public.embed_scripts;
CREATE POLICY "Allow authenticated manage embed_scripts" ON public.embed_scripts TO authenticated USING (true) WITH CHECK (true);

-- [system_config]
DROP POLICY IF EXISTS "Allow authenticated manage system_config" ON public.system_config;
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config TO authenticated USING (true) WITH CHECK (true);

-- [marketing_posts]
DROP POLICY IF EXISTS "Allow public read marketing_posts"           ON public.marketing_posts;
DROP POLICY IF EXISTS "Allow authenticated manage marketing_posts"  ON public.marketing_posts;
CREATE POLICY "Allow public read marketing_posts"          ON public.marketing_posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);

-- [roles]
DROP POLICY IF EXISTS "Allow authenticated read roles"    ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated manage roles"  ON public.roles;
CREATE POLICY "Allow authenticated read roles"   ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage roles" ON public.roles TO authenticated USING (true) WITH CHECK (true);

-- [sending_campaigns]
DROP POLICY IF EXISTS "Allow authenticated manage sending_campaigns" ON public.sending_campaigns;
CREATE POLICY "Allow authenticated manage sending_campaigns" ON public.sending_campaigns TO authenticated USING (true) WITH CHECK (true);

-- [contacts]
DROP POLICY IF EXISTS "Allow public read contacts"           ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert contacts"         ON public.contacts;
DROP POLICY IF EXISTS "Allow authenticated manage contacts"  ON public.contacts;
CREATE POLICY "Allow public read contacts"          ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert contacts"        ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage contacts" ON public.contacts TO authenticated USING (true) WITH CHECK (true);

-- [event_images]
DROP POLICY IF EXISTS "Allow public read event_images"           ON public.event_images;
DROP POLICY IF EXISTS "Allow authenticated manage event_images"  ON public.event_images;
CREATE POLICY "Allow public read event_images"          ON public.event_images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage event_images" ON public.event_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- [rooms]
DROP POLICY IF EXISTS "Allow public read rooms"           ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated manage rooms"  ON public.rooms;
CREATE POLICY "Allow public read rooms"          ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage rooms" ON public.rooms TO authenticated USING (true) WITH CHECK (true);

-- [schedule_dates]
DROP POLICY IF EXISTS "Allow public read schedule_dates"           ON public.schedule_dates;
DROP POLICY IF EXISTS "Allow authenticated manage schedule_dates"  ON public.schedule_dates;
CREATE POLICY "Allow public read schedule_dates"          ON public.schedule_dates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage schedule_dates" ON public.schedule_dates TO authenticated USING (true) WITH CHECK (true);

-- [shifts]
DROP POLICY IF EXISTS "Allow public read shifts"           ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated manage shifts"  ON public.shifts;
CREATE POLICY "Allow public read shifts"          ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage shifts" ON public.shifts TO authenticated USING (true) WITH CHECK (true);

-- [virtual_sections]
DROP POLICY IF EXISTS "Allow public read virtual_sections"           ON public.virtual_sections;
DROP POLICY IF EXISTS "Allow authenticated manage virtual_sections"  ON public.virtual_sections;
CREATE POLICY "Allow public read virtual_sections"          ON public.virtual_sections FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage virtual_sections" ON public.virtual_sections TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- PHẦN 5: SUPABASE REALTIME
-- ============================================================

DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'attendees', 'speakers', 'sessions', 'sponsors',
        'internal_tasks', 'finance_transactions', 'notification_logs',
        'packages', 'marketing_posts', 'roles', 'sending_campaigns',
        'contacts', 'event_images', 'rooms', 'schedule_dates',
        'shifts', 'virtual_sections'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END $$;


-- ============================================================
-- PHẦN 6: DỮ LIỆU MẶC ĐỊNH (SEED DATA)
-- ============================================================

-- 6.1 Hội trường (Rooms) — Cập nhật theo PARS 2026
INSERT INTO public.rooms (name) VALUES
    ('Hội trường 1'),
    ('Hội trường 2')
ON CONFLICT (name) DO NOTHING;

-- 6.2 Ngày tổ chức
INSERT INTO public.schedule_dates (date_val) VALUES
    ('2026-09-12'),
    ('2026-09-13')
ON CONFLICT (date_val) DO NOTHING;

-- Xóa ngày cũ sai nếu có
DELETE FROM public.schedule_dates WHERE date_val IN ('2026-12-11', '2026-12-12');

-- 6.3 Ca tổ chức (Shifts)
INSERT INTO public.shifts (id, name, start_time, end_time) VALUES
    ('sang',  'Buổi Sáng',  '07:30', '12:00'),
    ('chieu', 'Buổi Chiều', '13:00', '18:00')
ON CONFLICT (id) DO UPDATE SET
    name       = EXCLUDED.name,
    start_time = EXCLUDED.start_time,
    end_time   = EXCLUDED.end_time;

-- 6.4 Vai trò hệ thống (System Roles)
INSERT INTO public.roles (id, code, name, description, permissions, is_system) VALUES
(
    'role-admin', 'admin', 'Toàn Trị',
    'Quản trị viên tối cao, có quyền quản lý toàn bộ hệ thống.',
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
    ], TRUE
),
(
    'role-btc', 'btc', 'Ban Tổ Chức',
    'Thành viên Ban Tổ Chức, quản lý đại biểu, lịch trình, báo cáo viên, thông báo.',
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
    ], TRUE
),
(
    'role-ctv', 'ctv', 'Cộng Tác Viên',
    'Hỗ trợ check-in đại biểu, xem lịch trình và thực hiện nhiệm vụ được giao.',
    ARRAY[
        'overview.view',
        'schedule.view',
        'speakers.view',
        'attendees.view', 'attendees.checkin',
        'tasks.view', 'tasks.edit'
    ], TRUE
)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    is_system   = EXCLUDED.is_system;

-- 6.5 Cấu hình nghiệp vụ mặc định (Business Config seed)
INSERT INTO public.business_config (
    id, event_name, organizer_name, event_date, event_location,
    max_registrations, require_payment_proof, allow_self_cancellation,
    auto_send_zns, require_practice_code,
    pwa_name, pwa_short_name, pwa_description,
    pwa_logo_url, pwa_theme_color, pwa_background_color,
    app_url, attendee_id_prefix,
    delegate_form_config, speaker_form_config, sponsor_form_config,
    add_on_services, cme_template_config, landing_page_sections
)
VALUES (
    'default',
    'PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên',
    'Hội Phẫu Thuật Tạo Hình Thẩm Mỹ Việt Nam (PARS)',
    '12-13/09/2026',
    'Hà Nội, Việt Nam',
    1500, TRUE, FALSE, TRUE, TRUE,
    'PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ',
    'PARS 2026',
    'Hệ thống quản lý Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên PARS 2026',
    '/icons/icon-512.png', '#4f46e5', '#0f172a',
    'https://pars2026.vercel.app', 'PARS2026',
    jsonb_build_object(
        'isOpen', true, 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ ĐẠI BIỂU THAM DỰ HỘI NGHỊ PARS 2026',
        'headerBgColor', '#042f2e', 'accentColor', '#fbbf24'
    ),
    jsonb_build_object(
        'isOpen', true, 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ BÁO CÁO VIÊN THAM DỰ HỘI NGHỊ PARS 2026',
        'headerBgColor', '#1e1b4b', 'accentColor', '#a5b4fc'
    ),
    jsonb_build_object(
        'isOpen', true, 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ NHÀ TÀI TRỢ HỘI NGHỊ PARS 2026',
        'headerBgColor', '#451a03', 'accentColor', '#fbbf24'
    ),
    '[]'::jsonb,
    '{}'::jsonb,
    jsonb_build_object(
        'hero', jsonb_build_object(
            'tag', 'PARS 2026 — INTERNATIONAL SCIENTIFIC CONFERENCE',
            'title', 'HỘI NGHỊ KHOA HỌC',
            'year', '2026',
            'themeEn', 'INNOVATIONS IN AESTHETIC PLASTIC SURGERY',
            'themeVi', 'ĐỔI MỚI TRONG PHẪU THUẬT TẠO HÌNH THẨM MỸ',
            'date', '12 - 13 tháng 9 năm 2026',
            'location', 'Hà Nội, Việt Nam',
            'btnRegisterText', 'Đăng Ký Tham Dự',
            'btnProgramText', 'Chương Trình Khoa Học'
        ),
        'sectionBg', jsonb_build_object(
            'intro', '#ffffff',
            'speakersForeign', '#0f172a',
            'speakersDomestic', '#ffffff',
            'register', '#f1f5f9',
            'sponsors', '#ffffff',
            'location', '#0f172a'
        )
    )
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PHẦN 7: SUPABASE STORAGE — BUCKET 'assets'
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets', 'assets', true,
    10485760, -- 10MB
    ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public             = true,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Chính sách Storage (chạy trong block để không lỗi nếu đã có)
DROP POLICY IF EXISTS "Allow public read assets"           ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload assets"         ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manage assets"  ON storage.objects;

CREATE POLICY "Allow public read assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'assets');

CREATE POLICY "Allow public upload assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow authenticated manage assets"
    ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'assets')
    WITH CHECK (bucket_id = 'assets');


-- ============================================================
-- PHẦN 8: TÀI KHOẢN ADMIN MẶC ĐỊNH
-- ============================================================
-- Lưu ý: Thay thế email & id bằng thông tin thực của bạn
-- ID phải khớp với auth.users.id nếu dùng Supabase Auth

INSERT INTO public.user_accounts (id, name, email, role, status, permissions)
VALUES (
    'admin-default',
    'Administrator',
    'admin@admin.com',
    'admin',
    'active',
    ARRAY[
        'overview.view', 'schedule.view', 'schedule.edit',
        'speakers.view', 'speakers.edit', 'attendees.view', 'attendees.edit',
        'sponsors.view', 'sponsors.edit', 'notifications.view',
        'notifications.edit', 'notifications.send', 'tasks.view', 'tasks.edit',
        'finances.view', 'finances.edit', 'marketing.view', 'marketing.edit',
        'marketing.publish', 'settings.view', 'settings.edit', 'settings.roles'
    ]
)
ON CONFLICT (email) DO UPDATE SET
    role        = 'admin',
    status      = 'active',
    permissions = EXCLUDED.permissions;


-- ============================================================
-- HOÀN TẤT
-- ============================================================
-- Script đã thực hiện:
--   ✅ Tạo 23 bảng (CREATE TABLE IF NOT EXISTS)
--   ✅ Migrations: thêm cột còn thiếu (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
--   ✅ Kích hoạt RLS cho tất cả bảng
--   ✅ Tạo chính sách RLS đầy đủ (DROP IF EXISTS → CREATE mới)
--   ✅ Đăng ký Realtime cho 17 bảng
--   ✅ Seed dữ liệu mặc định (Rooms, Dates, Shifts, Roles, Business Config)
--   ✅ Cấu hình Supabase Storage bucket 'assets'
--   ✅ Tạo tài khoản Admin mặc định
-- ============================================================
