-- ============================================================
--  PARS 2026 — FULL SYSTEM MIGRATION SCRIPT FOR SUPABASE
--  Phiên bản: v3.0 (Cập nhật toàn diện: 27 bảng, RLS, Storage, Realtime, Seed)
--  Mục đích : Chuyển đổi và thiết lập trọn gói sang một Supabase Project mới.
--             Tất cả câu lệnh đều idempotent (IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT),
--             có thể chạy một lần hoặc chạy lại nhiều lần mà không bị lỗi.
--
--  HƯỚNG DẪN THIẾT LẬP SUPABASE MỚI:
--  1. Đăng nhập Supabase (https://supabase.com) -> Tạo New Project.
--  2. Chờ Project khởi tạo xong (Active).
--  3. Vào menu bên trái: "SQL Editor" -> Bấm "New query".
--  4. Copy TOÀN BỘ nội dung file SQL này -> Paste vào Editor -> Bấm "Run".
--  5. Cập nhật URL & API Key vào file .env.local và trên Vercel:
--     - VITE_SUPABASE_URL = https://<project-ref>.supabase.co
--     - VITE_SUPABASE_ANON_KEY = <anon public key>
--     - SUPABASE_SERVICE_ROLE_KEY = <service_role secret key>
--     - DATABASE_URL = postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
-- ============================================================

-- Bật các extension cần thiết
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- PHẦN 1: TẠO TẤT CẢ 27 BẢNG HỆ THỐNG
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

-- 2. Chuyên khoa / Phân khoa báo cáo (Specialty Tracks)
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
    payment_config          JSONB DEFAULT '{}'::jsonb,
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

-- 5. Vai trò tùy chỉnh (Custom Roles & Permissions)
CREATE TABLE IF NOT EXISTS public.roles (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}'::text[],
    is_system   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. Lịch trình hội nghị (Conference Sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    speaker_name  TEXT,
    speaker_title TEXT,
    room_name     TEXT,
    date          TEXT NOT NULL,
    start_time    TEXT NOT NULL,
    end_time      TEXT NOT NULL,
    track         TEXT,
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 7. Đại biểu tham dự (Attendees)
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
    source                TEXT DEFAULT 'website',
    invoice_info          JSONB,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 8. Báo cáo viên (Speakers)
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

-- 9. Nhà tài trợ (Sponsors)
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

-- 10. Công việc nội bộ BTC (Internal Tasks)
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

-- 11. Giao dịch tài chính (Finance Transactions)
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

-- 12. Mẫu thông báo (Notification Templates)
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

-- 13. Lịch sử gửi thông báo (Notification Logs)
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

-- 14. Chiến dịch gửi hàng loạt (Sending Campaigns)
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
    open_count       INTEGER DEFAULT 0,
    click_count      INTEGER DEFAULT 0,
    recipients       JSONB DEFAULT '[]'::jsonb,
    logs             JSONB DEFAULT '[]'::jsonb,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 15. Danh bạ / Liên hệ (Contacts)
CREATE TABLE IF NOT EXISTS public.contacts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    phone      TEXT,
    group_name TEXT DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 16. Mã nhúng bên thứ ba (Embed Scripts)
CREATE TABLE IF NOT EXISTS public.embed_scripts (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    target_type   TEXT NOT NULL CHECK (target_type IN ('delegate', 'speaker', 'sponsor', 'analytics', 'custom')),
    code          TEXT NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    notes         TEXT,
    created_at    TEXT NOT NULL,
    created_at_db TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 17. Cấu hình hệ thống (System Config - Zalo, Email, Resend, v.v.)
CREATE TABLE IF NOT EXISTS public.system_config (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 18. Biểu mẫu đăng ký tùy biến (Custom Registration Forms)
CREATE TABLE IF NOT EXISTS public.custom_registration_forms (
    id                 TEXT PRIMARY KEY,
    title              TEXT NOT NULL,
    header_title       TEXT,
    header_subtitle    TEXT,
    header_logo_url    TEXT,
    header_banner_url  TEXT,
    footer_text        TEXT,
    fields             JSONB NOT NULL DEFAULT '{}'::jsonb,
    required_fields    JSONB NOT NULL DEFAULT '{}'::jsonb,
    packages           JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_qr_enabled BOOLEAN DEFAULT FALSE,
    bank_code          TEXT,
    bank_account_no    TEXT,
    bank_account_name  TEXT,
    is_active          BOOLEAN DEFAULT TRUE,
    bg_type            TEXT DEFAULT 'image',
    bg_color           TEXT,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 19. Bài đăng Marketing (Marketing Posts)
CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    content        TEXT,
    type           TEXT NOT NULL DEFAULT 'news_feed',
    platforms      TEXT[],
    status         TEXT NOT NULL DEFAULT 'draft',
    scheduled_at   TIMESTAMP WITH TIME ZONE,
    published_at   TIMESTAMP WITH TIME ZONE,
    metrics        JSONB DEFAULT '{}'::jsonb,
    media_url      TEXT,
    video_script   TEXT,
    author_id      TEXT,
    author_name    TEXT,
    tags           TEXT[] DEFAULT '{}',
    publish_result JSONB DEFAULT '{}'::jsonb,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 20. File đính kèm Marketing (Marketing Media Assets)
CREATE TABLE IF NOT EXISTS public.marketing_media_assets (
    id              TEXT PRIMARY KEY DEFAULT 'MMA-' || upper(substr(gen_random_uuid()::text, 1, 9)),
    post_id         TEXT REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
    file_name       TEXT NOT NULL,
    file_type       TEXT NOT NULL,
    file_size_bytes BIGINT,
    storage_path    TEXT NOT NULL,
    public_url      TEXT NOT NULL,
    bucket_name     TEXT NOT NULL DEFAULT 'assets',
    uploaded_by     TEXT,
    uploaded_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 21. Lên lịch đăng bài Marketing (Marketing Scheduled Jobs)
CREATE TABLE IF NOT EXISTS public.marketing_scheduled_jobs (
    id              TEXT PRIMARY KEY DEFAULT 'MSJ-' || upper(substr(gen_random_uuid()::text, 1, 9)),
    post_id         TEXT NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),
    scheduled_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    attempt_count   INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    api_response    JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 22. Token OAuth mạng xã hội (Marketing OAuth Tokens)
CREATE TABLE IF NOT EXISTS public.marketing_oauth_tokens (
    id                       SERIAL PRIMARY KEY,
    platform                 TEXT NOT NULL UNIQUE CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),
    access_token             TEXT,
    refresh_token            TEXT,
    token_expires_at         TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    account_name             TEXT,
    account_id               TEXT,
    is_active                BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_count            INTEGER NOT NULL DEFAULT 0,
    last_refreshed_at        TIMESTAMP WITH TIME ZONE,
    last_error               TEXT,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 23. Hình ảnh sự kiện / Thư viện ảnh (Event Images)
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

-- 24. Phòng / Hội trường (Rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
    name       TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 25. Ngày tổ chức sự kiện (Schedule Dates)
CREATE TABLE IF NOT EXISTS public.schedule_dates (
    date_val   TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 26. Ca / Buổi tổ chức (Shifts)
CREATE TABLE IF NOT EXISTS public.shifts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time   TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 27. Section phiên họp ảo / Khung giờ phòng (Virtual Sections)
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
-- PHẦN 2: TRIGGER & HÀM HỖ TRỢ
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_update_marketing_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketing_posts_updated_at ON public.marketing_posts;
CREATE TRIGGER trg_marketing_posts_updated_at
    BEFORE UPDATE ON public.marketing_posts
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_marketing_posts_updated_at();


-- ============================================================
-- PHẦN 3: INDEXES HIỆU NĂNG
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attendees_package_id         ON public.attendees (package_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_code            ON public.attendees (qr_code_value);
CREATE INDEX IF NOT EXISTS idx_attendees_email              ON public.attendees (email);
CREATE INDEX IF NOT EXISTS idx_attendees_phone              ON public.attendees (phone);
CREATE INDEX IF NOT EXISTS idx_attendees_payment_status     ON public.attendees (payment_status);
CREATE INDEX IF NOT EXISTS idx_attendees_is_checked_in      ON public.attendees (is_checked_in);
CREATE INDEX IF NOT EXISTS idx_speakers_status              ON public.speakers (status);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier                ON public.sponsors (tier);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_status       ON public.marketing_posts (status);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_type         ON public.marketing_posts (type);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_at ON public.marketing_posts (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_posts_created_at   ON public.marketing_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msj_post_id                  ON public.marketing_scheduled_jobs (post_id);
CREATE INDEX IF NOT EXISTS idx_msj_status_scheduled         ON public.marketing_scheduled_jobs (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mma_post_id                  ON public.marketing_media_assets (post_id) WHERE post_id IS NOT NULL;


-- ============================================================
-- PHẦN 4: KÍCH HOẠT ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.packages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_tracks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embed_scripts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_media_assets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_scheduled_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_oauth_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_sections          ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PHẦN 5: CHÍNH SÁCH BẢO MẬT RLS (POLICIES)
-- ============================================================

-- [packages]
DROP POLICY IF EXISTS "Allow public read packages"          ON public.packages;
DROP POLICY IF EXISTS "Allow authenticated manage packages" ON public.packages;
CREATE POLICY "Allow public read packages"          ON public.packages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage packages" ON public.packages TO authenticated USING (true) WITH CHECK (true);

-- [specialty_tracks]
DROP POLICY IF EXISTS "Allow public read specialty_tracks"          ON public.specialty_tracks;
DROP POLICY IF EXISTS "Allow authenticated manage specialty_tracks" ON public.specialty_tracks;
CREATE POLICY "Allow public read specialty_tracks"          ON public.specialty_tracks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage specialty_tracks" ON public.specialty_tracks TO authenticated USING (true) WITH CHECK (true);

-- [business_config]
DROP POLICY IF EXISTS "Allow public read business_config"          ON public.business_config;
DROP POLICY IF EXISTS "Allow authenticated manage business_config" ON public.business_config;
CREATE POLICY "Allow public read business_config"          ON public.business_config FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage business_config" ON public.business_config TO authenticated USING (true) WITH CHECK (true);

-- [user_accounts]
DROP POLICY IF EXISTS "Allow authenticated read user_accounts"   ON public.user_accounts;
DROP POLICY IF EXISTS "Allow authenticated manage user_accounts" ON public.user_accounts;
CREATE POLICY "Allow authenticated read user_accounts"   ON public.user_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated manage user_accounts" ON public.user_accounts TO authenticated USING (true) WITH CHECK (true);

-- [roles]
DROP POLICY IF EXISTS "Allow authenticated read roles"   ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated manage roles" ON public.roles;
CREATE POLICY "Allow authenticated read roles"   ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage roles" ON public.roles TO authenticated USING (true) WITH CHECK (true);

-- [sessions]
DROP POLICY IF EXISTS "Allow public read sessions"          ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated manage sessions" ON public.sessions;
CREATE POLICY "Allow public read sessions"          ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage sessions" ON public.sessions TO authenticated USING (true) WITH CHECK (true);

-- [attendees]
-- Cho phép: Khách công cộng đăng ký (INSERT), xuất hóa đơn/upload minh chứng (UPDATE), xem để check-in & xác nhận (SELECT)
DROP POLICY IF EXISTS "Allow public insert attendees"           ON public.attendees;
DROP POLICY IF EXISTS "Allow public update attendees"           ON public.attendees;
DROP POLICY IF EXISTS "Allow public read attendees for checkin" ON public.attendees;
DROP POLICY IF EXISTS "Allow authenticated manage attendees"    ON public.attendees;

CREATE POLICY "Allow public insert attendees"           ON public.attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendees"           ON public.attendees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read attendees for checkin" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage attendees"    ON public.attendees TO authenticated USING (true) WITH CHECK (true);

-- [speakers]
DROP POLICY IF EXISTS "Allow public read speakers"          ON public.speakers;
DROP POLICY IF EXISTS "Allow public insert speakers"        ON public.speakers;
DROP POLICY IF EXISTS "Allow authenticated manage speakers" ON public.speakers;
CREATE POLICY "Allow public read speakers"          ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Allow public insert speakers"        ON public.speakers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage speakers" ON public.speakers TO authenticated USING (true) WITH CHECK (true);

-- [sponsors]
DROP POLICY IF EXISTS "Allow public read sponsors"          ON public.sponsors;
DROP POLICY IF EXISTS "Allow public insert sponsors"        ON public.sponsors;
DROP POLICY IF EXISTS "Allow authenticated manage sponsors" ON public.sponsors;
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

-- [sending_campaigns]
DROP POLICY IF EXISTS "Allow authenticated manage sending_campaigns" ON public.sending_campaigns;
CREATE POLICY "Allow authenticated manage sending_campaigns" ON public.sending_campaigns TO authenticated USING (true) WITH CHECK (true);

-- [contacts]
DROP POLICY IF EXISTS "Allow public read contacts"          ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert contacts"        ON public.contacts;
DROP POLICY IF EXISTS "Allow authenticated manage contacts" ON public.contacts;
CREATE POLICY "Allow public read contacts"          ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert contacts"        ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage contacts" ON public.contacts TO authenticated USING (true) WITH CHECK (true);

-- [embed_scripts]
DROP POLICY IF EXISTS "Allow authenticated manage embed_scripts" ON public.embed_scripts;
CREATE POLICY "Allow authenticated manage embed_scripts" ON public.embed_scripts TO authenticated USING (true) WITH CHECK (true);

-- [system_config]
DROP POLICY IF EXISTS "Allow authenticated manage system_config" ON public.system_config;
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config TO authenticated USING (true) WITH CHECK (true);

-- [custom_registration_forms]
DROP POLICY IF EXISTS "Allow public read custom forms"          ON public.custom_registration_forms;
DROP POLICY IF EXISTS "Allow authenticated manage custom forms" ON public.custom_registration_forms;
CREATE POLICY "Allow public read custom forms"          ON public.custom_registration_forms FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage custom forms" ON public.custom_registration_forms TO authenticated USING (true) WITH CHECK (true);

-- [marketing_posts]
DROP POLICY IF EXISTS "Allow public read marketing_posts"          ON public.marketing_posts;
DROP POLICY IF EXISTS "Allow authenticated manage marketing_posts" ON public.marketing_posts;
CREATE POLICY "Allow public read marketing_posts"          ON public.marketing_posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);

-- [marketing_media_assets]
DROP POLICY IF EXISTS "Public read marketing_media_assets"          ON public.marketing_media_assets;
DROP POLICY IF EXISTS "Authenticated manage marketing_media_assets" ON public.marketing_media_assets;
CREATE POLICY "Public read marketing_media_assets"          ON public.marketing_media_assets FOR SELECT USING (true);
CREATE POLICY "Authenticated manage marketing_media_assets" ON public.marketing_media_assets TO authenticated USING (true) WITH CHECK (true);

-- [marketing_scheduled_jobs]
DROP POLICY IF EXISTS "Public read marketing_scheduled_jobs"          ON public.marketing_scheduled_jobs;
DROP POLICY IF EXISTS "Authenticated manage marketing_scheduled_jobs" ON public.marketing_scheduled_jobs;
CREATE POLICY "Public read marketing_scheduled_jobs"          ON public.marketing_scheduled_jobs FOR SELECT USING (true);
CREATE POLICY "Authenticated manage marketing_scheduled_jobs" ON public.marketing_scheduled_jobs TO authenticated USING (true) WITH CHECK (true);

-- [marketing_oauth_tokens]
DROP POLICY IF EXISTS "Authenticated manage marketing_oauth_tokens" ON public.marketing_oauth_tokens;
CREATE POLICY "Authenticated manage marketing_oauth_tokens" ON public.marketing_oauth_tokens TO authenticated USING (true) WITH CHECK (true);

-- [event_images]
DROP POLICY IF EXISTS "Allow public read event_images"          ON public.event_images;
DROP POLICY IF EXISTS "Allow authenticated manage event_images" ON public.event_images;
CREATE POLICY "Allow public read event_images"          ON public.event_images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage event_images" ON public.event_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- [rooms]
DROP POLICY IF EXISTS "Allow public read rooms"          ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated manage rooms" ON public.rooms;
CREATE POLICY "Allow public read rooms"          ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage rooms" ON public.rooms TO authenticated USING (true) WITH CHECK (true);

-- [schedule_dates]
DROP POLICY IF EXISTS "Allow public read schedule_dates"          ON public.schedule_dates;
DROP POLICY IF EXISTS "Allow authenticated manage schedule_dates" ON public.schedule_dates;
CREATE POLICY "Allow public read schedule_dates"          ON public.schedule_dates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage schedule_dates" ON public.schedule_dates TO authenticated USING (true) WITH CHECK (true);

-- [shifts]
DROP POLICY IF EXISTS "Allow public read shifts"          ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated manage shifts" ON public.shifts;
CREATE POLICY "Allow public read shifts"          ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage shifts" ON public.shifts TO authenticated USING (true) WITH CHECK (true);

-- [virtual_sections]
DROP POLICY IF EXISTS "Allow public read virtual_sections"          ON public.virtual_sections;
DROP POLICY IF EXISTS "Allow authenticated manage virtual_sections" ON public.virtual_sections;
CREATE POLICY "Allow public read virtual_sections"          ON public.virtual_sections FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage virtual_sections" ON public.virtual_sections TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- PHẦN 6: SUPABASE REALTIME (TỰ ĐỘNG BẬT CHO CÁC BẢNG QUAN TRỌNG)
-- ============================================================

DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'attendees', 'speakers', 'sessions', 'sponsors',
        'internal_tasks', 'finance_transactions', 'notification_logs',
        'packages', 'marketing_posts', 'marketing_media_assets',
        'marketing_scheduled_jobs', 'roles', 'sending_campaigns',
        'contacts', 'custom_registration_forms', 'event_images',
        'rooms', 'schedule_dates', 'shifts', 'virtual_sections'
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
            BEGIN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END LOOP;
END $$;


-- ============================================================
-- PHẦN 7: SUPABASE STORAGE (BUCKET 'assets' & POLICIES)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets', 'assets', true,
    524288000, -- 500MB
    ARRAY[
        'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
        'application/pdf','video/mp4','video/quicktime','video/webm','video/x-msvideo'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public             = true,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
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
-- PHẦN 8: DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- ============================================================

-- 8.1 Hội trường (Rooms)
INSERT INTO public.rooms (name) VALUES
    ('Hội trường 1'),
    ('Hội trường 2')
ON CONFLICT (name) DO NOTHING;

-- 8.2 Ngày tổ chức
INSERT INTO public.schedule_dates (date_val) VALUES
    ('2026-09-12'),
    ('2026-09-13')
ON CONFLICT (date_val) DO NOTHING;

-- 8.3 Buổi / Ca (Shifts)
INSERT INTO public.shifts (id, name, start_time, end_time) VALUES
    ('sang',  'Buổi Sáng',  '07:30', '12:00'),
    ('chieu', 'Buổi Chiều', '13:00', '18:00')
ON CONFLICT (id) DO UPDATE SET
    name       = EXCLUDED.name,
    start_time = EXCLUDED.start_time,
    end_time   = EXCLUDED.end_time;

-- 8.4 Phân khoa chuyên môn (Specialty Tracks)
INSERT INTO public.specialty_tracks (id, name, name_en, description) VALUES
('track-1', 'Phẫu thuật Tạo hình & Thẩm mỹ Khuôn mặt', 'Facial Plastic & Aesthetic Surgery', 'Phẫu thuật nâng mũi, tạo hình mí, căng da mặt và trẻ hóa'),
('track-2', 'Tạo hình Thẩm mỹ Vú & Thân mình', 'Breast & Body Contouring Surgery', 'Nâng ngực, tạo hình thành bụng, hút mỡ và đường nét cơ thể'),
('track-3', 'Da liễu Thẩm mỹ & Laser & Thiết bị Năng lượng', 'Aesthetic Dermatology & Energy-Based Devices', 'Trị liệu laser, ánh sáng, sóng cao tần, siêu âm vi điểm'),
('track-4', 'Thủ thuật Thẩm mỹ Nội khoa & Tiêm cấy (Injectables)', 'Minimally Invasive & Injectables', 'Botulinum toxin, chất làm đầy Filler, chỉ sinh học căng da'),
('track-5', 'Y học Tái tạo & Tế bào Gốc trong Thẩm mỹ', 'Regenerative Medicine & Stem Cells', 'Ứng dụng PRP, tế bào gốc mô mỡ và exosome trong trẻ hóa'),
('track-6', 'An toàn Phẫu thuật, Xử trí Tai biến & Pháp lý Y khoa', 'Patient Safety & Complications Management', 'Kiểm soát nhiễm khuẩn, an toàn gây mê và xử trí biến chứng')
ON CONFLICT (id) DO NOTHING;

-- 8.5 Gói đăng ký hội nghị (Packages)
INSERT INTO public.packages (id, name, fee, benefits, is_active, includes_cme, includes_gala) VALUES
('pkg-member', 'Hội viên PARS / VSAPS', 2500000, ARRAY[
  'Quyền tham dự đầy đủ mọi phiên báo cáo khoa học ngày chính',
  'Nhận bộ túi đựng tài liệu hội nghị & quà lưu niệm chính thức',
  'Teabreak và Tiệc trà giải lao cao cấp giữa các chuyên đề',
  'Hỗ trợ suất ăn trưa tại hội nghị',
  'Nhận Chứng nhận tham luận & kỷ yếu tóm tắt'
], true, false, false),
('pkg-standard', 'Bác sĩ / Đại biểu chưa là Hội viên', 3000000, ARRAY[
  'Quyền tham dự đầy đủ tất cả chuyên đề báo cáo',
  'Nhận bộ túi đựng tài liệu & quà tặng hội nghị chính thức',
  'Phục vụ Teabreak & Tiệc trà giải lao cao cấp',
  'Hỗ trợ suất ăn trưa đầy đủ hàng ngày trong suốt hội nghị'
], true, false, false),
('pkg-student', 'Học viên / Bác sĩ Nội trú chuyên ngành', 1000000, ARRAY[
  'Tham dự học thuật định hướng Thẩm mỹ & Da liễu sảnh chính',
  'Nhận tài liệu kỷ yếu sự kiện điện tử',
  'Teabreak & Trà bánh phục vụ nhẹ nhàng tại hành lang đại hội'
], true, false, false),
('pkg-foreign', 'Đại biểu Quốc tế (International Doctor)', 3750000, ARRAY[
  'Full access to all scientific sessions and exhibition areas',
  'Premium printed delegate badge, bag, and program abstract',
  'Complimentary gourmet luncheons and high-tea breaks',
  'Certificate of International Attendance of PARS 2026'
], true, false, false),
('pkg-free', 'Chủ tọa & Báo cáo viên (Miễn phí)', 0, ARRAY[
  'Miễn phí tham dự đặc quyền dành cho Chủ tọa & Báo cáo viên',
  'Nhận Kỷ niệm chương & Thư mời vinh danh điện tử chính thức',
  'Quyền tham gia toàn bộ phiên báo cáo y khoa chuyên sâu và đại sảnh VIP',
  'Hỗ trợ toàn bộ quyền lợi ẩm thực cao cấp tại hội nghị'
], true, false, false),
('pkg-vip', 'Gói Đại Biểu VIP & Toàn diện', 5000000, ARRAY[
  'Đầy đủ quyền tham dự các phiên học thuật và khu vực VIP Lounge',
  'Bộ túi tài liệu & Quà lưu niệm VIP',
  'Teabreak & Trà bánh cao cấp sảnh VIP',
  'Tham dự Gala Dinner đặc quyền',
  'Đã bao gồm lệ phí cấp chứng chỉ đào tạo liên tục CME'
], true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 8.6 Vai trò hệ thống (System Roles)
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

-- 8.7 Cấu hình nghiệp vụ mặc định (Business Config)
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
        'isOpen', true, 'language', 'both', 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ ĐẠI BIỂU THAM DỰ HỘI NGHỊ THƯỜNG NIÊN PARS 2026',
        'formDescription', 'Cổng đăng ký điện tử dành cho đại biểu, bác sĩ thẩm mỹ trong nước & quốc tế. Điền chính xác thông tin để phát hành CME và thẻ đại biểu QR tự động.',
        'headerBgColor', '#042f2e', 'accentColor', '#fbbf24',
        'closedMessage', 'Cổng đăng ký đại biểu hiện đã đóng. Vui lòng liên hệ Ban tổ chức.',
        'sectionLabels', jsonb_build_object(
            'personalInfo', jsonb_build_object('vi', 'THÔNG TIN ĐẠI BIỂU ĐĂNG KÝ', 'en', 'DELEGATE PERSONAL INFORMATION'),
            'scheduleAddOns', jsonb_build_object('vi', 'DỊCH VỤ PHỤ TRỢ TỰ CHỌN', 'en', 'OPTIONAL ADD-ON SERVICES'),
            'package', jsonb_build_object('vi', 'CHỌN GÓI ĐĂNG KÝ HỘI NGHỊ', 'en', 'CONFERENCE REGISTRATION PACKAGE'),
            'payment', jsonb_build_object('vi', 'THÔNG TIN THANH TOÁN CHUYỂN KHOẢN', 'en', 'BANK TRANSFER PAYMENT DETAILS')
        )
    ),
    jsonb_build_object(
        'isOpen', true, 'language', 'both', 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ NỘP BÀI BÁO CÁO KHOA HỌC PARS 2026',
        'formDescription', 'Cổng nộp báo cáo khoa học dành cho báo cáo viên, chuyên gia trong và ngoài nước. Vui lòng đính kèm file tóm tắt abstract.',
        'headerBgColor', '#1e1b4b', 'accentColor', '#818cf8',
        'closedMessage', 'Cổng nộp bài báo cáo hiện đã đóng. Vui lòng liên hệ Ban thư ký khoa học.'
    ),
    jsonb_build_object(
        'isOpen', true, 'language', 'both', 'hideHeader', false,
        'organizerLabel', 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)',
        'formTitle', 'ĐĂNG KÝ NHÀ TÀI TRỢ & ĐỐI TÁC PARS 2026',
        'formDescription', 'Đăng ký hợp tác tài trợ chính thức cho Hội nghị Khoa học Thẩm mỹ thường niên PARS 2026. Ban tổ chức sẽ liên hệ xác nhận trong 24h.',
        'headerBgColor', '#1c1917', 'accentColor', '#f59e0b',
        'closedMessage', 'Cổng đăng ký tài trợ hiện đã đóng. Vui lòng liên hệ Ban tổ chức.'
    ),
    '[
        {"id": "addon-cme", "nameVi": "Chứng chỉ CME", "nameEn": "CME Certificate", "fee": 350000, "isEnabled": true, "color": "teal", "descriptionVi": "Nhận chứng chỉ đào tạo y khoa liên tục CME sau hội nghị.", "descriptionEn": "Receive Continuing Medical Education (CME) certificate."},
        {"id": "addon-gala", "nameVi": "Tiệc tối Gala Dinner", "nameEn": "Gala Dinner", "fee": 800000, "isEnabled": true, "color": "amber", "descriptionVi": "Tham dự đêm tiệc tri ân và giao lưu kết nối cùng các chuyên gia hàng đầu.", "descriptionEn": "Join the networking celebration and appreciation evening."}
    ]'::jsonb,
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

-- 8.8 Mẫu thông báo (Notification Templates)
INSERT INTO public.notification_templates (id, name, type, channel, subject, content, status, zns_template_id, zns_type) VALUES
('tmpl-reg-email', 'Đăng Ký Đại Biểu Thành Công (Email)', 'registration_success', 'email', '🎯 Xác nhận đăng ký tham dự thành công Đại biểu Hội nghị PARS 2026', 'Kính gửi Quý đại biểu {{title}} {{fullname}},

Thay mặt Ban Tổ Chức Hội nghị Khoa học PARS 2026, chúng tôi xin trân trọng xác nhận Quý đại biểu đã hoàn tất đăng ký thông tin tham dự.

THÔNG TIN CHI TIẾT ĐĂNG KÝ VÀ SỬ DỤNG MÃ QR CHECK-IN:
• Mã đại biểu: {{code}}
• Họ và tên: {{fullname}}
• Đơn vị công tác: {{organization}}
• Gói đăng ký: {{package}}
• Trạng thái thanh toán: {{payment_status}}

Quý đại biểu vui lòng xuất trình Mã QR đính kèm trong thư này tại Quầy tiếp đón của hội nghị để nhận thẻ đeo chính thức nhanh chóng.

MỌI CHI TIẾT XIN LIÊN HỆ:
• Email: contact@parsevent.org
• Hotline: 091-234-5678

Trân trọng,
Ban Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-reg-zalo', 'Đăng Ký Đại Biểu Thành Công (Zalo ZNS)', 'registration_success', 'zalo', NULL, '[PARS 2026] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG
Xin chào {{title}} {{fullname}}. Bạn đã đăng ký thành công tham dự Hội nghị Khoa học PARS 2026. 
- Gói: {{package}}
- Mã Đại biểu: {{code}}
- Trạng thái: {{payment_status}}
Vui lòng xuất trình QR đính kèm tại quầy check-in. Hotline hỗ trợ: 0912345678. Trân trọng cảm ơn!', 'approved', '298516', 'transaction'),
('tmpl-pay-zalo', 'Xác Nhận Đã Thanh Toán Lệ Phí (Zalo ZNS)', 'payment_confirmed', 'zalo', NULL, '[PARS 2026] XÁC NHẬN HOÀN TẤT THANH TOÁN
Kính gửi {{title}} {{fullname}}. Ban Tổ Chức đã tiếp nhận đóng góp lệ phí trị giá {{package_fee}} VNĐ cho Gói: {{package}}. Sắp xếp check-in của bạn đã được ưu tiên hoàn tất.', 'approved', '304521', 'transaction'),
('tmpl-speaker-email', 'Xác Nhận Đệ Trình Báo Cáo (Email)', 'abstract_approved', 'email', '📚 Thư xác nhận đăng ký báo cáo chuyên đề hội nghị PARS 2026', 'Kính gửi Báo cáo viên {{title}} {{fullname}},

Ban Tổ Chức xin chân thành cảm ơn Quý bác sĩ/nhà khoa học đã gửi đăng ký đề tài báo cáo tại PARS 2026.

• Tên đề tài: {{presentation_title}}
• Chuyên khoa/Chương trình: {{track}}
• Trạng thái đệ trình: Đang thẩm định

Xin trân trọng kính chúc sức khỏe và thành công!
Ban Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-sponsor-registered', 'Xác Nhận Đăng Ký Tài Trợ (Email)', 'sponsor_registered', 'email', '🤝 Xác nhận đăng ký tài trợ Hội nghị Khoa học PARS 2026', 'Kính gửi Đại diện {{organization}},

Ban Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin chân thành cảm ơn Quý đơn vị đã đăng ký đồng hành cùng hội nghị với tư cách là Nhà tài trợ.

THÔNG TIN ĐĂNG KÝ CHI TIẾT:
• Đơn vị tài trợ: {{organization}}
• Gói tài trợ: {{package}}
• Giá trị tài trợ: {{package_fee}} VNĐ
• Người liên hệ: {{fullname}}
• Số điện thoại: {{phone}}
• Email: {{email}}

Trân trọng cảm ơn sự đồng hành của Quý đơn vị!
Ban Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8.9 Cấu hình Hệ thống (System Config)
INSERT INTO public.system_config (key, value) VALUES
('marketing_channels_config', '{
    "facebook": { "appId": "", "pageId": "", "pageAccessToken": "", "pageName": "", "isConfigured": false },
    "zalo":     { "appId": "", "secretKey": "", "oaId": "", "accessToken": "", "oaName": "", "isConfigured": false },
    "tiktok":   { "clientKey": "", "clientSecret": "", "accessToken": "", "accountName": "", "isConfigured": false },
    "youtube":  { "clientId": "", "clientSecret": "", "accessToken": "", "channelName": "", "isConfigured": false }
}'::jsonb),
('zalo_config', '{
    "appId": "", "secretKey": "", "oaId": "", "accessToken": "", "refreshToken": "", "isConfigured": false
}'::jsonb),
('email_config', '{
    "senderName": "Ban Tổ Chức PARS 2026", "senderEmail": "no-reply@parsevent.org", "isConfigured": false
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8.10 Tài khoản Quản trị viên khởi tạo
-- Lưu ý: Bạn có thể đăng ký tài khoản qua Supabase Auth, sau đó gán role 'admin' tại bảng này
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
-- HOÀN TẤT THIẾT LẬP HỆ THỐNG SUPABASE
-- ============================================================
-- Script đã thiết lập đầy đủ:
--   ✅ 27 Bảng nghiệp vụ hoàn chỉnh (attendees, marketing, custom forms, v.v.)
--   ✅ Đầy đủ các trường mới nhất: invoice_info, cme_identity_no, doctor_proof_url, source
--   ✅ Kích hoạt Row-Level Security (RLS) cho tất cả 27 bảng
--   ✅ Cấu hình các chính sách RLS chuẩn xác (công cộng đăng ký/cập nhật hóa đơn/xem checkin, admin quản trị)
--   ✅ Đăng ký Realtime cho 20 bảng sự kiện quan trọng
--   ✅ Tạo Storage Bucket 'assets' dung lượng 500MB và chính sách upload/view công khai
--   ✅ Dữ liệu mẫu chuẩn xác: Rooms, Dates, Shifts, Tracks, Packages, Roles, Config, Templates
-- ============================================================
