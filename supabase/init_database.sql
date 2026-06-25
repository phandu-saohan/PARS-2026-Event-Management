-- =========================================================================
-- MASTER INITIALIZATION SCRIPT: PARS 2026 EVENT MANAGEMENT
-- Target: Supabase PostgreSQL Database (100% Production Ready)
-- Purpose: Complete database initialization including extensions, schemas,
--          all 26 tables, performance indexes, triggers, Row Level Security (RLS)
--          policies, storage bucket configuration, and official seed data.
-- How to run: Copy the entire content of this script, paste it into the 
--             Supabase SQL Editor (Dashboard -> SQL Editor -> New query), and click "Run".
-- =========================================================================

-- ==========================================
-- 1. SETUP EXTENSIONS & SCHEMAS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables to start fresh
DROP VIEW IF EXISTS public.vw_marketing_stats CASCADE;
DROP TABLE IF EXISTS public.event_images CASCADE;
DROP TABLE IF EXISTS public.marketing_scheduled_jobs CASCADE;
DROP TABLE IF EXISTS public.marketing_media_assets CASCADE;
DROP TABLE IF EXISTS public.marketing_posts CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.embed_scripts CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.notification_templates CASCADE;
DROP TABLE IF EXISTS public.internal_tasks CASCADE;
DROP TABLE IF EXISTS public.finance_transactions CASCADE;
DROP TABLE IF EXISTS public.sponsors CASCADE;
DROP TABLE IF EXISTS public.attendees CASCADE;
DROP TABLE IF EXISTS public.speakers CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.virtual_sections CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.schedule_dates CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.specialty_tracks CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.business_config CASCADE;
DROP TABLE IF EXISTS public.user_accounts CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.sending_campaigns CASCADE;
DROP TABLE IF EXISTS public.marketing_oauth_tokens CASCADE;

-- ==========================================
-- 2. CREATE TABLES (Aligned with TypeScript Mappers)
-- ==========================================

-- 2.1. Roles & Permissions
CREATE TABLE public.roles (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2. User Accounts
CREATE TABLE public.user_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL REFERENCES public.roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_active TIMESTAMP WITH TIME ZONE,
    permissions TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3. Business Configuration
CREATE TABLE public.business_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    event_name TEXT NOT NULL,
    organizer_name TEXT NOT NULL DEFAULT 'Bệnh viện Thẩm mỹ EMCAS',
    event_date TEXT NOT NULL,
    event_location TEXT NOT NULL,
    max_registrations INTEGER DEFAULT 1500,
    require_payment_proof BOOLEAN DEFAULT TRUE,
    allow_self_cancellation BOOLEAN DEFAULT FALSE,
    auto_send_zns BOOLEAN DEFAULT TRUE,
    require_practice_code BOOLEAN DEFAULT TRUE,
    pwa_name TEXT DEFAULT 'PARS 2026 - Phẫu Thuật Tạo Hình Thẩm Mỹ & Y Học Tái Sinh',
    pwa_short_name TEXT DEFAULT 'PARS 2026',
    pwa_description TEXT DEFAULT 'Hệ thống quản lý Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên PARS 2026',
    pwa_logo_url TEXT DEFAULT '/icons/icon-512.png',
    pwa_theme_color TEXT DEFAULT '#be6940',
    pwa_background_color TEXT DEFAULT '#0f172a',
    app_url TEXT DEFAULT 'https://pars2026.vercel.app',
    attendee_id_prefix TEXT DEFAULT 'PARS2026',
    delegate_form_config JSONB DEFAULT '{}'::jsonb,
    speaker_form_config JSONB DEFAULT '{}'::jsonb,
    sponsor_form_config JSONB DEFAULT '{}'::jsonb,
    add_on_services JSONB DEFAULT '[]'::jsonb,
    cme_template_config JSONB DEFAULT '{}'::jsonb,
    landing_logo_url TEXT,
    landing_landmarks_url TEXT,
    landing_slide1_url TEXT,
    landing_slide2_url TEXT,
    landing_slide3_url TEXT,
    landing_slide4_url TEXT,
    landing_page_sections JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4. Specialty Tracks
CREATE TABLE public.specialty_tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5. Packages
CREATE TABLE public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fee NUMERIC NOT NULL DEFAULT 0,
    benefits TEXT[] DEFAULT '{}'::text[],
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    includes_cme BOOLEAN DEFAULT FALSE,
    includes_gala BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6. Rooms
CREATE TABLE public.rooms (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7. Schedule Dates
CREATE TABLE public.schedule_dates (
    date_val TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8. Shifts
CREATE TABLE public.shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9. Virtual Sections
CREATE TABLE public.virtual_sections (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    room_name TEXT NOT NULL,
    track_name TEXT NOT NULL,
    buoi_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10. Conference Sessions
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    speaker_name TEXT,
    speaker_title TEXT,
    room_name TEXT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    track TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.11. Speakers
CREATE TABLE public.speakers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    bio TEXT,
    presentation_title TEXT,
    presentation_track TEXT,
    abstract_text TEXT,
    document_url TEXT,
    document_name TEXT,
    calendar_synced BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    scheduled_session_id TEXT,
    avatar_url TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.12. Attendees
CREATE TABLE public.attendees (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    nationality TEXT DEFAULT 'vietname',
    package_id TEXT NOT NULL REFERENCES public.packages(id),
    package_name TEXT NOT NULL,
    package_fee NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT DEFAULT 'bank_transfer',
    transaction_proof_url TEXT,
    qr_code_value TEXT UNIQUE,
    is_checked_in BOOLEAN DEFAULT false,
    check_in_time TEXT,
    notes TEXT,
    year_of_birth INTEGER,
    gender TEXT,
    cme_required BOOLEAN DEFAULT false,
    cme_identity_no TEXT,
    gala_required BOOLEAN DEFAULT false,
    masterclass_required BOOLEAN DEFAULT false,
    tour_required BOOLEAN DEFAULT false,
    registration_period TEXT,
    province TEXT,
    avatar_url TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.13. Sponsors
CREATE TABLE public.sponsors (
    id TEXT PRIMARY KEY, -- Format: SPN-XXX
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('diamond', 'platinum', 'gold', 'silver', 'bronze', 'co_sponsor')),
    logo_url TEXT,
    pledged_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('fully_paid', 'unpaid', 'partially_paid')),
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    booth_location TEXT,
    benefits_signed TEXT[] DEFAULT '{}'::text[],
    notes TEXT,
    contract_no TEXT,
    contract_sign_date TEXT,
    contract_value NUMERIC DEFAULT 0,
    contract_status TEXT CHECK (contract_status IN ('signed', 'pending_signature', 'draft', 'cancelled')),
    contract_file_url TEXT,
    contract_file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.14. Finance Transactions
CREATE TABLE public.finance_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    reference_id TEXT,
    payment_method TEXT,
    verified_by TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.15. Internal Tasks
CREATE TABLE public.internal_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_name TEXT,
    assigned_to_id TEXT REFERENCES public.user_accounts(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    deadline TEXT,
    progress INTEGER DEFAULT 0,
    notes TEXT,
    detailed_content TEXT DEFAULT '',
    checklist JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.16. Notification Templates
CREATE TABLE public.notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'zalo' | 'email' | 'whatsapp' | 'sms'
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved',
    zns_template_id TEXT,
    zns_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.17. Notification Logs
CREATE TABLE public.notification_logs (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    type TEXT NOT NULL,
    template_id TEXT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    template_name TEXT,
    sender TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending',
    payload JSONB DEFAULT '{}'::jsonb,
    response JSONB DEFAULT '{}'::jsonb
);

-- 2.18. System Configuration
CREATE TABLE public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.19. Embed Scripts
CREATE TABLE public.embed_scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.20. Contacts
CREATE TABLE public.contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    group_name TEXT DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.21. Marketing Posts
CREATE TABLE public.marketing_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL DEFAULT 'news_feed', -- 'news_feed', 'video_short'
    platforms TEXT[] DEFAULT '{}'::text[],
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metrics JSONB DEFAULT '{}'::jsonb,
    media_url TEXT,
    video_script TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.22. Marketing Media Assets
CREATE TABLE public.marketing_media_assets (
    id TEXT PRIMARY KEY DEFAULT 'MMA-' || upper(substr(gen_random_uuid()::text, 1, 9)),
    post_id TEXT REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    bucket_name TEXT NOT NULL DEFAULT 'assets',
    uploaded_by TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.23. Marketing Scheduled Jobs
CREATE TABLE public.marketing_scheduled_jobs (
    id TEXT PRIMARY KEY DEFAULT 'MSJ-' || upper(substr(gen_random_uuid()::text, 1, 9)),
    post_id TEXT NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    api_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT msj_platform_check CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),
    CONSTRAINT msj_status_check CHECK (status IN ('pending', 'processing', 'done', 'failed'))
);

-- 2.24. Sending Campaigns
CREATE TABLE public.sending_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
    template_id TEXT,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sending', 'paused', 'completed')),
    total_recipients INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    recipients JSONB DEFAULT '[]'::jsonb,
    logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.25. Event Images (Media gallery)
CREATE TABLE public.event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT DEFAULT 'image/png',
    category TEXT DEFAULT 'general',
    caption TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.26. Marketing OAuth Tokens
CREATE TABLE public.marketing_oauth_tokens (
    id              SERIAL PRIMARY KEY,
    platform        TEXT NOT NULL UNIQUE,
    CONSTRAINT oauth_platform_check CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    account_name    TEXT,
    account_id      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    refresh_count   INTEGER NOT NULL DEFAULT 0,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    last_error      TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TRIGGERS & FUNCTIONS
-- ==========================================

-- Trigger to automatically update marketing_posts.updated_at
CREATE OR REPLACE FUNCTION public.fn_update_marketing_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketing_posts_updated_at ON public.marketing_posts;
CREATE TRIGGER trg_marketing_posts_updated_at
    BEFORE UPDATE ON public.marketing_posts
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_marketing_posts_updated_at();

-- Trigger to automatically update marketing_oauth_tokens.updated_at
CREATE OR REPLACE FUNCTION public.fn_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oauth_tokens_updated_at ON public.marketing_oauth_tokens;
CREATE TRIGGER trg_oauth_tokens_updated_at
    BEFORE UPDATE ON public.marketing_oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION public.fn_oauth_tokens_updated_at();

-- Auto publish scheduled posts logic
CREATE OR REPLACE FUNCTION public.fn_auto_publish_scheduled_posts()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.marketing_posts
    SET status = 'published', published_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
    WHERE status = 'scheduled' AND scheduled_at <= timezone('utc'::text, now());
    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE public.marketing_scheduled_jobs
    SET status = 'done', last_attempt_at = timezone('utc'::text, now())
    WHERE status = 'pending' AND scheduled_at <= timezone('utc'::text, now());

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. DATABASE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions (date);
CREATE INDEX IF NOT EXISTS idx_sessions_room ON public.sessions (room_name);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON public.attendees (email);
CREATE INDEX IF NOT EXISTS idx_attendees_package ON public.attendees (package_id);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON public.attendees (is_checked_in);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_status ON public.marketing_posts (status);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_type ON public.marketing_posts (type);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_at ON public.marketing_posts (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_posts_created_at ON public.marketing_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msj_post_id ON public.marketing_scheduled_jobs (post_id);
CREATE INDEX IF NOT EXISTS idx_mma_post_id ON public.marketing_media_assets (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON public.marketing_oauth_tokens (platform);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON public.marketing_oauth_tokens (token_expires_at) WHERE token_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_active ON public.marketing_oauth_tokens (is_active);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all 26 tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embed_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to prevent conflicts
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 5.1. Public Read Policies
CREATE POLICY "Allow public read packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Allow public read specialty_tracks" ON public.specialty_tracks FOR SELECT USING (true);
CREATE POLICY "Allow public read business_config" ON public.business_config FOR SELECT USING (true);
CREATE POLICY "Allow public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public read schedule_dates" ON public.schedule_dates FOR SELECT USING (true);
CREATE POLICY "Allow public read shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow public read virtual_sections" ON public.virtual_sections FOR SELECT USING (true);
CREATE POLICY "Allow public read sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read speakers" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Allow public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Allow public read embed_scripts" ON public.embed_scripts FOR SELECT USING (true);
CREATE POLICY "Allow public read marketing_posts" ON public.marketing_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read marketing_media_assets" ON public.marketing_media_assets FOR SELECT USING (true);
CREATE POLICY "Allow public read marketing_scheduled_jobs" ON public.marketing_scheduled_jobs FOR SELECT USING (true);
CREATE POLICY "Allow public read event_images" ON public.event_images FOR SELECT USING (true);

-- 5.2. Public Insert Policies (Self-registration and subscription)
CREATE POLICY "Allow public insert attendees" ON public.attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert speakers" ON public.speakers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert sponsors" ON public.sponsors FOR INSERT WITH CHECK (true);

-- 5.3. Public Select/Update for Kiosk Check-In & Proof Upload
CREATE POLICY "Allow public read attendees for checkin" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow public update attendees proof" ON public.attendees FOR UPDATE USING (true) WITH CHECK (true);

-- 5.4. Authenticated Users Full Management Access
CREATE POLICY "Allow authenticated manage roles" ON public.roles TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage user_accounts" ON public.user_accounts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage business_config" ON public.business_config TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage specialty_tracks" ON public.specialty_tracks TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage packages" ON public.packages TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage rooms" ON public.rooms TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage schedule_dates" ON public.schedule_dates TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage shifts" ON public.shifts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage virtual_sections" ON public.virtual_sections TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sessions" ON public.sessions TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage speakers" ON public.speakers TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage attendees" ON public.attendees TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sponsors" ON public.sponsors TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage finance_transactions" ON public.finance_transactions TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage internal_tasks" ON public.internal_tasks TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage notification_templates" ON public.notification_templates TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage notification_logs" ON public.notification_logs TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage embed_scripts" ON public.embed_scripts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage contacts" ON public.contacts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_media_assets" ON public.marketing_media_assets TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_scheduled_jobs" ON public.marketing_scheduled_jobs TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sending_campaigns" ON public.sending_campaigns TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage event_images" ON public.event_images TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_oauth_tokens" ON public.marketing_oauth_tokens TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 6. REAL-TIME SUBSCRIPTION ENABLEMENT
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_setup_realtime() RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END;
$$ LANGUAGE plpgsql;
SELECT public.fn_setup_realtime();

DO $$
DECLARE tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
              'business_config', 'packages', 'specialty_tracks', 'sessions', 
              'speakers', 'attendees', 'sponsors', 'finance_transactions', 'internal_tasks', 
              'notification_templates', 'notification_logs', 'system_config', 
              'embed_scripts', 'rooms', 'schedule_dates', 'shifts', 'virtual_sections', 
              'contacts', 'marketing_posts', 'marketing_media_assets', 'marketing_scheduled_jobs',
              'sending_campaigns', 'event_images', 'marketing_oauth_tokens'
          )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = tbl.table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl.table_name);
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- 7. SUPABASE STORAGE BUCKET CONFIGURATION
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets', 'assets', true,
    524288000, -- 500 MB
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for storage bucket 'assets' (clean setup)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- (Skipped: already enabled by default on Supabase, avoids ownership permission error)

DROP POLICY IF EXISTS "Allow public read assets" ON storage.objects;
CREATE POLICY "Allow public read assets" ON storage.objects 
  FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Allow public upload assets" ON storage.objects;
CREATE POLICY "Allow public upload assets" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Allow authenticated manage assets" ON storage.objects;
CREATE POLICY "Allow authenticated manage assets" ON storage.objects 
  FOR ALL TO authenticated USING (bucket_id = 'assets') WITH CHECK (bucket_id = 'assets');

-- ==========================================
-- 8. INITIAL SEEDING DATA (OFFICIAL CONFIG & AGENDA)
-- ==========================================

-- 8.1. Roles & Permissions Seeding
INSERT INTO public.roles (id, code, name, description, permissions, is_system) VALUES
('admin', 'admin', 'Administrator', 'Quản trị viên toàn quyền', ARRAY['overview.view', 'attendees.view', 'attendees.manage', 'speakers.view', 'speakers.manage', 'schedule.view', 'schedule.manage', 'tasks.view', 'tasks.manage', 'finances.view', 'finances.manage', 'sponsors.view', 'sponsors.manage', 'notifications.view', 'notifications.send', 'settings.view', 'settings.manage', 'marketing.view', 'marketing.manage'], true),
('staff', 'staff', 'Staff', 'Nhân viên ban tổ chức', ARRAY['overview.view', 'attendees.view', 'attendees.manage', 'speakers.view', 'speakers.manage', 'schedule.view', 'tasks.view', 'tasks.manage', 'notifications.view', 'sponsors.view'], true),
('ctv', 'ctv', 'Collaborator', 'Cộng tác viên hỗ trợ', ARRAY['overview.view', 'attendees.view', 'schedule.view', 'tasks.view'], true)
ON CONFLICT (id) DO NOTHING;

-- 8.2. User Accounts Seeding
INSERT INTO public.user_accounts (id, name, email, role, status) VALUES
('usr-1', 'Nguyễn Minh Anh (Admin)', 'admin@parsevent.org', 'admin', 'active'),
('usr-2', 'Đặng Thùy Dương', 'yang.dang@parsevent.org', 'staff', 'active'),
('usr-3', 'Trần Thế Minh', 'minh.tran@parsevent.org', 'ctv', 'active')
ON CONFLICT (id) DO NOTHING;

-- 8.3. Specialty Tracks Seeding
INSERT INTO public.specialty_tracks (id, name, name_en, description) VALUES
('track-breast', 'Phẫu thuật vú & Tạo hình vóc dáng', 'Breast Surgery & Body Contouring', 'Nâng ngực hybrid, tạo hình vú bằng robot, bảo tồn mô tuyến và giải quyết biến chứng túi độn.'),
('track-face', 'Trẻ hóa khuôn mặt & Thao tác sọ mặt', 'Facial Rejuvenation & Craniofacial Surgery', 'Phẫu thuật căng da mặt tầng sâu, phẫu tích sọ mặt, phục hình dị tật bẩm sinh.'),
('track-rhino', 'Tạo hình mũi & Điêu khắc sụn sườn', 'Rhinoplasty & Rib Cartilage Carving', 'Nâng mũi cấu trúc, xử lý biến chứng sau tiêm chất làm đầy mũi.'),
('track-regen', 'Y học tái sinh & Ứng dụng mô mỡ', 'Regenerative Medicine & Fat Grafting', 'Ghép mỡ tự thân (CAL, SVF), in sinh học 3D, lưu trữ tế bào gốc.'),
('track-noninvasive', 'Thẩm mỹ nội khoa & Chỉ sợi, Laser', 'Non-invasive Aesthetic & Thread, Laser', 'Trẻ hóa da đa tầng bằng chỉ collagen, nâng cơ bằng công nghệ laser, tiêm HA an toàn.')
ON CONFLICT (id) DO NOTHING;

-- 8.4. Packages Seeding
INSERT INTO public.packages (id, name, fee, benefits, is_active, description, includes_cme, includes_gala) VALUES
('pkg-standard', 'Gói Đại Biểu Tiêu Chuẩn', 1500000, ARRAY['Quyền tham dự tất cả các phiên báo cáo khoa học chính thức', 'Nhận tài liệu hội nghị, túi đại biểu và kỷ yếu tóm tắt', 'Phục vụ tiệc trà Teabreak cao cấp giữa giờ nghỉ giải lao', 'Cấp giấy chứng nhận tham dự hội thảo khóa học'], true, 'Tham gia toàn bộ phiên báo cáo khoa học, tiệc trà Teabreak và nhận tài liệu hội nghị.', true, false),
('pkg-vip', 'Gói Đại Biểu VIP', 3000000, ARRAY['Quyền lợi gói tiêu chuẩn', 'Vị trí ghế ngồi VIP danh dự hàng đầu tại hội trường chính', 'Phục vụ tiệc trưa Buffet đẳng cấp tại khách sạn Meliá', 'Vé mời tham dự Gala Dinner vinh danh kết nối', 'Bộ quà tặng lưu niệm đặc biệt từ Ban Tổ Chức'], true, 'Bao gồm tất cả quyền lợi gói tiêu chuẩn, chỗ ngồi VIP hàng đầu, tiệc trưa Buffet 5 sao và thư mời dự Gala Dinner.', true, true),
('pkg-speaker', 'Gói Báo Cáo Viên', 0, ARRAY['Quyền lợi VIP miễn phí toàn bộ lệ phí tham gia', 'Lịch trình báo cáo cá nhân hóa trên hệ thống sơ đồ', 'Kỷ niệm chương vinh danh báo cáo viên từ Ban Tổ Chức', 'Hỗ trợ kỹ thuật trình chiếu slide chuyên nghiệp', 'Thư cảm ơn chính thức từ Tổng hội PARS'], true, 'Dành riêng cho báo cáo viên có bài thuyết trình được duyệt. Miễn phí tham dự và nhận kỷ niệm chương.', true, true)
ON CONFLICT (id) DO NOTHING;

-- 8.5. Schedule Management Defaults Seeding
INSERT INTO public.rooms (name) VALUES 
('Hội trường 1'), ('Hội trường 2'), ('Hội trường 3'), ('Hội trường 4')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.schedule_dates (date_val) VALUES 
('2026-09-12'), ('2026-09-13')
ON CONFLICT (date_val) DO NOTHING;

INSERT INTO public.shifts (id, name, start_time, end_time) VALUES 
('sang', 'Buổi Sáng', '08:00', '12:00'),
('chieu', 'Buổi Chiều', '13:00', '18:00')
ON CONFLICT (id) DO NOTHING;

-- 8.6. System Configuration Defaults Seeding
INSERT INTO public.system_config (key, value) VALUES
('zalo_config', '{
  "appId": "829472659103947",
  "secretKey": "abcx***********123",
  "oaId": "293847291847",
  "accessToken": "zalo-oa-token-active-2026-ready-pars",
  "refreshToken": "zalo-refresh-token-active-2026-ready-pars",
  "accessTokenUpdatedAt": "2026-06-03T00:00:00Z",
  "isConfigured": true,
  "testPhone": "0912345678"
}'::jsonb),
('email_config', '{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "contact@parsevent.org",
  "smtpPass": "*************",
  "senderName": "Ban Tổ Chức PARS 2026",
  "senderEmail": "no-reply@parsevent.org",
  "isConfigured": true,
  "testEmail": "phandu8899@gmail.com"
}'::jsonb),
('whatsapp_config', '{
  "accessToken": "eaab*********************************",
  "phoneNumberId": "1092837491827",
  "businessAccountId": "9827364519283",
  "isConfigured": true,
  "testPhone": "0912345678"
}'::jsonb),
('onesignal_config', '{
  "appId": "",
  "restApiKey": "",
  "safariWebId": "",
  "isEnabled": false
}'::jsonb),
('marketing_channels_config', '{
  "facebook": { "appId": "", "pageId": "", "pageAccessToken": "", "pageName": "", "isConfigured": false },
  "zalo": { "appId": "", "secretKey": "", "oaId": "", "accessToken": "", "oaName": "", "isConfigured": false },
  "tiktok": { "clientKey": "", "clientSecret": "", "accessToken": "", "accountName": "", "isConfigured": false },
  "youtube": { "clientId": "", "clientSecret": "", "accessToken": "", "channelName": "", "isConfigured": false }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8.7. Embed Scripts Defaults Seeding
INSERT INTO public.embed_scripts (id, name, target_type, code, is_active, notes, created_at) VALUES
('emb-wp-delegate', 'Form Đăng ký Đại biểu WordPress Banner', 'delegate', '<iframe src="https://parsevent.org/embed?view=register-delegate" title="PARS Delegate Form" width="100%" height="950px" style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" scrolling="yes" loading="lazy"></iframe>', true, 'Đặt khối Custom HTML bọc ngoài widget WP của trang chủ', '2026-06-03 09:12:00'),
('emb-wp-speaker', 'Form Nộp Báo Cáo Viên Sidebar', 'speaker', '<iframe src="https://parsevent.org/embed?view=register-speaker" title="PARS Speaker Submission" width="100%" height="1100px" style="border: none; border-radius: 12px;" scrolling="yes" loading="lazy"></iframe>', true, 'Nhúng vào trang Tin tức / Thư báo cho báo cáo viên', '2026-06-03 10:00:00'),
('emb-tracking-ga4', 'Google Analytics 4 Tracking Code', 'analytics', '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-PARS2026"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(''js'', new Date());\n  gtag(''config'', ''G-PARS2026'');\n</script>', false, 'Chèn vào thẻ <head> của toàn bộ trang đăng ký', '2026-06-03 11:24:00')
ON CONFLICT (id) DO NOTHING;

-- 8.8. Internal Tasks Defaults Seeding
INSERT INTO public.internal_tasks (id, title, description, assigned_to_name, assigned_to_id, priority, status, deadline, progress) VALUES
('TSK-001', 'Gửi thư mời xác nhận báo cáo đến PGS.TS. Trần Quốc Bảo', 'Xác nhận thời gian trình bày, gửi hướng dẫn chuẩn bị slide thuyết trình theo mẫu PARS2026.', 'Đặng Thùy Dương', 'usr-2', 'high', 'done', '2026-05-20', 100),
('TSK-002', 'Đối soát các khoản chuyển khoản đăng ký đại biểu còn treo', 'Kiểm tra sao kê ngân hàng đối chiếu với các đại biểu trạng thái "pending_verification" như BS. Nguyễn Thành Nam và phê duyệt cho họ.', 'Trần Thế Minh', 'usr-3', 'high', 'in_progress', '2026-05-30', 40),
('TSK-003', 'Kiểm tra mặt bằng sơ đồ gian hàng triển lãm tài trợ', 'Liên hệ với trung tâm hội nghị khép kín danh sách vị trí gian hàng triển lãm cho Medtronic và Boston Pharma.', 'Trần Thế Minh', 'usr-3', 'medium', 'todo', '2026-06-15', 0),
('TSK-004', 'Thiết kế Backdrop & Thẻ đại biểu tích hợp mã QR', 'Thống nhất layout màu chủ đạo xanh ngọc và đen, kích thước thẻ 10x15cm, có dây treo màu xanh đồng bộ.', 'Đặng Thùy Dương', 'usr-2', 'medium', 'todo', '2026-06-20', 10)
ON CONFLICT (id) DO NOTHING;

-- 8.9. Seed Sponsors
INSERT INTO public.sponsors (id, name, tier, pledged_amount, paid_amount, payment_status, contact_person, contact_email, contact_phone, benefits_signed, notes, contract_no, contract_sign_date, contract_value, contract_status, contract_file_name, contract_file_url) VALUES
('SPN-001', 'Tập đoàn Y khoa Medtronic Việt Nam', 'platinum', 500000000, 350000000, 'partially_paid', 'Nguyễn Minh Thư', 'minhthu.nguyen@medtronic.com', '0977889900', ARRAY['Sở hữu 2 Gian hàng triển lãm Gold Zone', 'In logo nổi bật trên Backdrop chính và tài liệu', 'Phát video quảng nghị 3 phút tại phiên Khai mạc', '10 Thẻ đại biểu VIP'], 'Phần còn lại sẽ được thanh toán trước ngày 15/09/2026 sau khi bàn giao thiết kế gian hàng.', 'HD-001/PARS/MEDTRONIC', '2026-04-12', 500000000, 'signed', 'HopDongTaitro_Medtronic_Signed.pdf', '#'),
('SPN-002', 'Công ty Cổ phần Boston Pharma', 'gold', 250000000, 250000000, 'fully_paid', 'Trần Văn Tiến', 'tientv@bostonpharma.com.vn', '0901239876', ARRAY['Sở hữu 1 Gian hàng tiêu chuẩn', 'In Logo trên Website & Kỷ yếu', '5 Thẻ đại biểu Standard'], 'Đã hoàn tất đối soát tài chính ngày 20/05/2026.', 'HD-002/PARS/BOSTON', '2026-05-05', 250000000, 'signed', 'HopDong_BostonPharma_HoanTat.pdf', '#'),
('SPN-003', 'Hãng Dược phẩm AstraZeneca Việt Nam', 'silver', 120000000, 0, 'unpaid', 'Phạm Thị Lan', 'lan.pham@astrazeneca.com', '0914565656', ARRAY['Logo trên tài liệu hội nghị', '2 Thẻ đại biểu Standard'], 'Đang làm thủ tục hợp đồng, kế hoạch chuyển khoản tháng 6.', 'HD-003/PARS/AZ', '2026-05-20', 120000000, 'pending_signature', 'HopDong_AstraZeneca_Draft.pdf', '#')
ON CONFLICT (id) DO NOTHING;

-- 8.10. Seed Notification Templates
INSERT INTO public.notification_templates (id, name, type, channel, subject, content, status, zns_template_id, zns_type) VALUES
('tmpl-reg-email', 'Đăng Ký Đại Biểu Thành Công (Email)', 'registration_success', 'email', '🎯 Xác nhận đăng ký tham dự thành công Đại biểu Hội nghị PARS 2026', 'Kính gửi Quý đại biểu {{title}} {{fullname}},\n\nThay mặt Ban Tổ Chức Hội nghị Khoa học PARS 2026, chúng tôi xin trân trọng xác nhận Quý đại biểu đã hoàn tất đăng ký thông tin tham dự.\n\nTHÔNG TIN CHI TIẾT ĐĂNG KÝ VÀ SỬ DỤNG MÃ QR CHECK-IN:\n• Mã đại biểu: {{code}}\n• Họ và tên: {{fullname}}\n• Đơn vị công tác: {{organization}}\n• Gói đăng ký: {{package}}\n• Trạng thái thanh toán: {{payment_status}}\n\nQuý đại biểu vui lòng xuất trình Mã QR đính kèm trong thư này tại Quầy tiếp đón của hội nghị để nhận thẻ đeo chính thức nhanh chóng.\n\nMỌI CHI TIẾT XIN LIÊN HỆ:\n• Email: contact@parsevent.org\n• Hotline: 091-234-5678\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-reg-zalo', 'Đăng Ký Đại Biểu Thành Công (Zalo ZNS)', 'registration_success', 'zalo', NULL, '[PARS 2026] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Bạn đã đăng ký thành công tham dự Hội nghị Khoa học PARS 2026. \n- Gói: {{package}}\n- Mã Đại biểu: {{code}}\n- Trạng thái: {{payment_status}}\nVui lòng xuất trình QR đính kèm tại quầy check-in. Hotline hỗ trợ: 0912345678. Trân trọng cảm ơn!', 'approved', '298516', 'transaction'),
('tmpl-pay-zalo', 'Xác Nhận Đã Thanh Toán Lệ Phí (Zalo ZNS)', 'payment_confirmed', 'zalo', NULL, '[PARS 2026] XÁC NHẬN HOÀN TẤT THANH TOÁN\nKính gửi {{title}} {{fullname}}. Ban Tổ Chức đã tiếp nhận đóng góp lệ phí trị giá {{package_fee}} VNĐ cho Gói: {{package}}. Sắp xếp check-in của bạn đã được ưu tiên hoàn tất.', 'pending', '304521', 'transaction'),
('tmpl-remind-zalo', 'Nhắc Nhở Lịch Trình Hội Nghị (Zalo ZNS)', 'reminder_event', 'zalo', NULL, '[PARS 2026] NHẮC NHỞ LỊCH TRÌNH THAM GIA\nKính gửi {{title}} {{fullname}}. Hội nghị sẽ chính thức khai mạc vào lúc 08:00 sáng mai tại Trung tâm Hội nghị Quốc tế. Hãy quét QR vé {{code}} để vào khán phòng.', 'rejected', '312894', 'promotion'),
('tmpl-speaker-email', 'Xác Nhận Đệ Trình Báo Cáo (Email)', 'abstract_approved', 'email', '📚 Thư xác nhận đăng ký báo cáo chuyên đề hội nghị PARS 2026', 'Kính gửi Báo cáo viên {{title}} {{fullname}},\n\nBan Tổ Chức xin chân thành cảm ơn Quý bác sĩ/nhà khoa học đã gửi đăng ký đề tài báo cáo tại PARS 2026.\n\n• Tên đề tài: {{presentation_title}}\n• Chuyên khoa/Chương trình: {{track}}\n• Trạng thái đệ trình: Đang thẩm định (Chờ phản biện phê duyệt chuyên môn)\n\nTài liệu đính kèm của Quý báo cáo viên đã được tải lên hệ thống an toàn. Lịch trình báo cáo thô sẽ được đồng bộ tự động sau khi Hội đồng Khoa học phê duyệt chính thức.\n\nXin trân trọng kính chúc sức khỏe và thành công!\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-reg-wa', 'Đăng Ký Đại Biểu Thành Công (WhatsApp)', 'registration_success', 'whatsapp', NULL, '[PARS 2026] ĐĂNG KÝ THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Bạn đã đăng ký thành công tham dự Hội nghị Khoa học PARS 2026.\n- Gói: {{package}}\n- Mã Đại biểu: {{code}}\n- Trạng thái: {{payment_status}}\nVui lòng quét mã QR vé để check-in. Trân trọng!', 'approved', 'pars_registration_success', 'transaction'),
('tmpl-speaker-wa', 'Nộp Bài Báo Cáo Thành Công (WhatsApp)', 'abstract_approved', 'whatsapp', NULL, '[PARS 2026] NỘP BÁO CÁO THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Đề tài báo cáo "{{presentation_title}}" của bạn đã được ghi nhận trên hệ thống sự kiện. Trạng thái: Chờ phê duyệt.', 'approved', 'pars_speaker_success', 'transaction'),
('tmpl-speaker-approved', 'Duyệt Đề Tài Báo Cáo Thành Công (Email)', 'abstract_approved', 'email', '🎉 Thư mời báo cáo & xác nhận đề tài khoa học PARS 2026', 'Kính gửi Báo cáo viên {{title}} {{fullname}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin trân trọng thông báo: Báo cáo khoa học của Quý vị với đề tài:\n\n"{{presentation_title}}"\n\nthuộc chuyên khoa/chương trình: {{track}}\n\nĐã được Hội đồng Khoa học phê duyệt chính thức để trình bày tại hội nghị.\n\nXin trân trọng cảm ơn sự đóng góp của Quý vị cho thành công chung của Hội nghị PARS 2026!\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL),
('tmpl-sponsor-registered', 'Xác Nhận Đăng Ký Tài Trợ (Email)', 'sponsor_registered', 'email', '🤝 Xác nhận đăng ký tài trợ Hội nghị Khoa học PARS 2026', 'Kính gửi Đại diện {{organization}},

Ban Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin chân thành cảm ơn Quý đơn vị đã đăng ký đồng hành cùng hội nghị với tư cách là Nhà tài trợ.\n\nTHÔNG TIN ĐĂNG KÝ CHI TIẾT:\n• Đơn vị tài trợ: {{organization}}\n• Gói tài trợ: {{package}}\n• Giá trị tài trợ: {{package_fee}} VNĐ\n• Người liên hệ: {{fullname}}\n• Số điện thoại: {{phone}}\n• Email: {{email}}\n• Vị trí gian hàng mong muốn: {{booth_location}}\n\nHệ thống đã ghi nhận thông tin đăng ký của Quý đơn vị. Ban Tổ Chức sẽ liên hệ trong thời gian sớm nhất để hoàn tất thủ tục hợp đồng và bàn giao sơ đồ gian hàng.\n\nTrân trọng cảm ơn sự đồng hành của Quý đơn vị!\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8.11. Seed Conference Sessions (OFFICIAL 44 SESSIONS)
INSERT INTO public.sessions (id, title, speaker_name, speaker_title, room_name, date, start_time, end_time, track, description) VALUES
('SES-101', 'Đón khách, đăng ký tham dự & Khai mạc, tuyên bố lý do, giới thiệu đại biểu - Phát biểu chào mừng Hội thảo', 'Ban Tổ Chức', 'PARS 2026', 'Hội trường 1', '2026-09-12', '07:30', '08:30', 'Khai mạc', 'Đón khách, đăng ký tham dự và Khai mạc, tuyên bố lý do, giới thiệu đại biểu - Phát biểu chào mừng Hội thảo.'),
('SES-102', 'Bài học kinh nghiệm trong căng da mặt: Quản lý tụ máu và cắt bỏ một phần tuyến nước bọt dưới hàm', 'TS.BS. Arturo Ramirez Montañana, MD, PhD', 'Chủ tịch ISAPS', 'Hội trường 1', '2026-09-12', '08:45', '09:05', 'Căng da mặt', 'Bài học kinh nghiệm trong căng da mặt: Quản lý tụ máu và cắt bỏ một phần tuyến nước bọt dưới hàm.'),
('SES-103', 'Sự Phát Triển Của Lưới Cấy Mỡ', 'TS. BS. Bertha Torres Gómez, MD, PhD', 'Thư ký Quốc gia của ISAPS', 'Hội trường 1', '2026-09-12', '09:10', '09:30', 'Cấy mỡ', 'Sự Phát Triển Của Lưới Cấy Mỡ.'),
('SES-104', 'Mi mắt trên: Các vấn đề khác nhau đòi hỏi các giải pháp khác nhau', 'TS.BS. Arturo Ramirez Montañana, MD, PhD', 'Chủ tịch ISAPS', 'Hội trường 1', '2026-09-12', '09:35', '09:55', 'Thẩm mỹ mi mắt', 'Mi mắt trên: Các vấn đề khác nhau đòi hỏi các giải pháp khác nhau.'),
('SES-105', 'Cách làm nổi bật vẻ đẹp tự nhiên, phẫu thuật tạo hình mi mắt không sẹo kết hợp cấy mỡ vùng chuyển tiếp mi mắt - má', 'Bertha Torres Gómez, MD, PhD', 'Thư ký Quốc gia của ISAPS', 'Hội trường 1', '2026-09-12', '10:00', '10:20', 'Thẩm mỹ mi mắt', 'Cách làm nổi bật vẻ đẹp tự nhiên, phẫu thuật tạo hình mi mắt không sẹo kết hợp cấy mỡ vùng chuyển tiếp mi mắt - má.'),
('SES-106', 'Nghỉ giải lao - TEA BREAK', 'Ban Hậu Cần', 'PARS 2026', 'Hành lang sảnh chính', '2026-09-12', '10:25', '10:35', 'Teabreak', 'Nghỉ giải lao, dùng tiệc trà Teabreak sáng.'),
('SES-107', 'Phẫu thuật điều trị bít hẹp lỗ mũi một phần và toàn phần bằng phương pháp ghép tự do phức hợp sụn vành tai: nhân nhiều ca lâm sàng', 'PGS.TS.BS Đỗ Quang Hùng', 'Phó chủ tịch hội PTTM Việt Nam (VSAPS)', 'Hội trường 1', '2026-09-12', '10:35', '10:55', 'Phẫu thuật mũi', 'Phẫu thuật điều trị bít hẹp lỗ mũi một phần và toàn phần bằng phương pháp ghép tự do phức hợp sụn vành tai: nhân nhiều ca lâm sàng.'),
('SES-108', 'Tiếp cận vấn đề: Phẫu thuật mũi sau khi tiêm chất làm đầy?', 'Bertha Torres Gómez, MD, PhD', 'Thư ký Quốc gia của ISAPS', 'Hội trường 1', '2026-09-12', '11:00', '11:20', 'Phẫu thuật mũi', 'Tiếp cận vấn đề: Phẫu thuật mũi sau khi tiêm chất làm đầy?'),
('SES-109', 'Nâng Ngực và Tái Tạo Tuyến Vú Tự Nhiên bằng Ghép Mỡ Tự Thân và Túi Độn', 'Prof. Kotaro Yoshimura, MD, PhD', 'Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản', 'Hội trường 1', '2026-09-12', '11:25', '11:45', 'Phẫu thuật vú', 'Nâng Ngực và Tái Tạo Tuyến Vú Tự Nhiên bằng Ghép Mỡ Tự Thân và Túi Độn.'),
('SES-110', 'Ăn trưa - LUNCH (Break)', 'Ban Hậu Cần', 'PARS 2026', 'Ăn trưa và tham quan triển lãm', '2026-09-12', '11:50', '13:00', 'Nghỉ giải lao / Bữa trưa', 'Dùng bữa trưa thân mật và tham quan triển lãm thiết bị y tế.'),
('SES-111', 'Đường Rạch Nhỏ, Tiềm Năng Lớn: Phẫu thuật Robot trong Tái Tạo Tuyến Vú', 'GS. BS. Mark W. Clemens, MD, MBA, FACS, FACH', 'Professor, The University of Texas MD Anderson Cancer Center', 'Hội trường 1', '2026-09-12', '13:00', '13:20', 'Phẫu thuật vú', 'Đường Rạch Nhỏ, Tiềm Năng Lớn: Phẫu thuật Robot trong Tái Tạo Tuyến Vú.'),
('SES-112', 'Giảm thiểu xâm lấn trong phẫu thuật nâng ngực: quy trình preservè', 'GS.Fabio Santanelli, MD', 'Secretary General of European Association of Plastic Surgeons', 'Hội trường 1', '2026-09-12', '13:25', '13:45', 'Phẫu thuật vú', 'Giảm thiểu xâm lấn trong phẫu thuật nâng ngực: quy trình preservè.'),
('SES-113', 'Mở rộng chỉ định bệnh nhân trên các kiểu hình vú khác nhau bằng khái niệm Preserve', 'TS. BS. Constantin Stan M.D., Ph.D', 'Founder of The Cronus Med Group Of Clinics', 'Hội trường 1', '2026-09-12', '13:50', '14:10', 'Phẫu thuật vú', 'Mở rộng chỉ định bệnh nhân trên các kiểu hình vú khác nhau bằng khái niệm Preserve.'),
('SES-114', 'Từ phẫu thuật nội soi đến phẫu thuật robot trong phẫu thuật vú: Thực tiễn lâm sàng và triển vọng tương lai của tái tạo vú tại Nhật Bản', 'PGS. BS. Yuko Asano, MD', 'Giám đốc Trung tâm Vú, Bệnh viện Kameda', 'Hội trường 1', '2026-09-12', '14:15', '14:35', 'Phẫu thuật vú', 'Từ phẫu thuật nội soi đến phẫu thuật robot trong phẫu thuật vú: Thực tiễn lâm sàng và triển vọng tương lai của tái tạo vú tại Nhật Bản.'),
('SES-115', 'Cập nhật điều trị mù mắt sau tiêm chất làm đầy Hyaluronic Acid', 'PGS. TS. BS. Nguyễn Hồng Hà', 'Trưởng khoa PTTM Bệnh viện Việt Đức', 'Hội trường 1', '2026-09-12', '14:40', '15:00', 'Biến chứng chất làm đầy', 'Cấp cứu đa khoa điều trị thành công mù lòa do tiêm filler HA.'),
('SES-116', 'Phương pháp cấy mỡ trong phẫu thuật thẩm mỹ vùng kín nữ và chất lượng cuộc sống', 'TS. Amin Kalaji, MD', 'Chair of the Membership Committee for ISPRES', 'Hội trường 1', '2026-09-12', '15:05', '15:25', 'Thẩm mỹ vùng kín', 'Phương pháp cấy mỡ trong phẫu thuật thẩm mỹ vùng kín nữ và chất lượng cuộc sống.'),
('SES-117', 'Nghỉ giải lao - TEA BREAK', 'Ban Hậu Cần', 'PARS 2026', 'Hành lang sảnh chính', '2026-09-12', '15:30', '15:40', 'Teabreak', 'Nghỉ giải lao, dùng tiệc trà Teabreak chiều.'),
('SES-118', 'Phẫu thuật bảo tồn mô tối thiểu xâm lấn dựa trên bằng chứng: dữ liệu cá nhân của tôi trên hơn 500 bệnh nhân trong 2 năm gần đây', 'TS. BS. Constantin Stan M.D., Ph.D', 'Founder of The Cronus Med Group Of Clinics', 'Hội trường 1', '2026-09-12', '15:40', '16:00', 'Phẫu thuật bảo tồn', 'Phẫu thuật bảo tồn mô tối thiểu xâm lấn dựa trên bằng chứng: dữ liệu cá nhân của tôi trên hơn 500 bệnh nhân trong 2 năm gần đây.'),
('SES-119', 'Hormone sinh dục và tuyến vú: Hướng dẫn lựa chọn và tối ưu hóa điều trị', 'TS. BS. Robert Francis Parkyn, MD', 'Clinical Associate Professor, Adelaide University', 'Hội trường 1', '2026-09-12', '16:05', '16:25', 'Nội tiết & Tuyến vú', 'Hormone sinh dục và tuyến vú: Hướng dẫn lựa chọn và tối ưu hóa điều trị.'),
('SES-120', 'Đặc Điểm Bệnh Nhân và Bệnh Đi Kèm có Ảnh Hưởng đến Khả Năng Mắc BIA-ALCL Không?', 'GS. BS.Fabio Santanelli, MD', 'Secretary General of European Association of Plastic Surgeons', 'Hội trường 1', '2026-09-12', '16:30', '16:50', 'An toàn túi ngực', 'Đặc Điểm Bệnh Nhân và Bệnh Đi Kèm có Ảnh Hưởng đến Khả Năng Mắc BIA-ALCL Không?'),
('SES-121', 'BIA-ALCL năm 2026: Phát hiện Sớm hơn, Điều trị Tốt hơn, Bệnh nhân An toàn hơn', 'GS. BS. Mark W. Clemens, MD, MBA, FACS, FACH', 'Professor, The University of Texas MD Anderson Cancer Center', 'Hội trường 1', '2026-09-12', '16:55', '17:15', 'An toàn túi ngực', 'BIA-ALCL năm 2026: Phát hiện Sớm hơn, Điều trị Tốt hơn, Bệnh nhân An toàn hơn.'),
('SES-122', 'Cấy ghép mỡ có sự hỗ trợ của tế bào gốc (cal) trong thẩm mỹ nâng ngực và tái tạo vú', 'PGS. BS. Yuko Asano, MD', 'Giám đốc Trung tâm Vú, Bệnh viện Kameda', 'Hội trường 1', '2026-09-12', '17:20', '17:40', 'Phẫu thuật vú', 'Cấy ghép mỡ có sự hỗ trợ của tế bào gốc (cal) trong thẩm mỹ nâng ngực và tái tạo vú.'),
('SES-123', 'Group photo session & Bế mạc ngày 1', 'Ban Tổ Chức', 'PARS 2026', 'Hội trường 1', '2026-09-12', '17:45', '18:00', 'Bế mạc', 'Chụp ảnh tập thể và bế mạc các phiên báo cáo ngày thứ nhất.'),
('SES-151', 'Hơn 30 năm trong sự nghiệp phẫu thuật vú của tôi: liệu chúng ta còn có thể tiếp tục đổi mới để đạt kết quả ổn định hơn không?', 'TS. BS. Constantin Stan M.D., Ph.D', 'Founder of The Cronus Med Group Of Clinics', 'Hội trường 2', '2026-09-12', '13:00', '13:20', 'Phẫu thuật vú', 'Hơn 30 năm trong sự nghiệp phẫu thuật vú của tôi: liệu chúng ta còn có thể tiếp tục đổi mới để đạt kết quả ổn định hơn không?'),
('SES-152', 'Kết hợp vạt cơ lưng rộng với ghép mỡ tự thân: tái tạo vú tự thân hybrid', 'GS. BS.Fabio Santanelli, MD', 'Secretary General of European Association of Plastic Surgeons', 'Hội trường 2', '2026-09-12', '13:25', '13:45', 'Phẫu thuật vú', 'Kết hợp vạt cơ lưng rộng với ghép mỡ tự thân: tái tạo vú tự thân hybrid.'),
('SES-153', 'Applications of Stem Cells and Stromal Vascular Fraction (SVF)', 'Assoc. Prof. Pham Van Phuc, PhD', 'Director of the Stem Cell Institute, HCM National University', 'Hội trường 2', '2026-09-12', '13:50', '14:00', 'Y học tái sinh', 'Applications of Stem Cells and Stromal Vascular Fraction (SVF).'),
('SES-154', 'Phẫu thuật trẻ hóa khuôn mặt sau giảm cân do thuốc GLP-1', 'GS. BS. C. Bob Basu, MD, MBA, MPH, FACS', 'President, American Society of Plastic Surgeons', 'Hội trường 2', '2026-09-12', '14:05', '14:25', 'Trẻ hóa khuôn mặt', 'Phẫu thuật trẻ hóa khuôn mặt sau giảm cân do thuốc GLP-1.'),
('SES-155', 'Cryopreservation of adipose tissue', 'Dinh Ngoc Quynh Nhu, MD, MSc, PhD Candidate', 'Trường Trung tâm liệu pháp tế bào, Bệnh viện Emcas', 'Hội trường 2', '2026-09-12', '14:30', '14:40', 'Y học tái sinh', 'Cryopreservation of adipose tissue.'),
('SES-156', 'Phẫu thuật nâng ngực sau giảm cân do thuốc GLP-1', 'GS. BS. C. Bob Basu, MD, MBA, MPH, FACS', 'President, American Society of Plastic Surgeons', 'Hội trường 2', '2026-09-12', '14:45', '14:55', 'Phẫu thuật vú', 'Phẫu thuật nâng ngực sau giảm cân do thuốc GLP-1.'),
('SES-157', 'Liệu pháp hormone trong bối cảnh quản lý và điều trị ung thư vú', 'TS. BS. Robert Francis Parkyn, MD', 'Clinical Associate Professor, Adelaide University', 'Hội trường 2', '2026-09-12', '15:00', '15:20', 'Nội tiết & Tuyến vú', 'Liệu pháp hormone trong bối cảnh quản lý và điều trị ung thư vú.'),
('SES-158', 'Nghỉ giải lao - TEA BREAK', 'Ban Hậu Cần', 'PARS 2026', 'Hành lang sảnh chính', '2026-09-12', '15:25', '15:35', 'Teabreak', 'Nghỉ giải lao, dùng tiệc trà Teabreak chiều Hall B.'),
('SES-159', 'Vai trò mới nổi của công nghệ in sinh học 3d trong phẫu thuật tuyến vú', 'GS. BS. Mark W. Clemens, MD, MBA, FACS, FACH', 'Professor, The University of Texas MD Anderson Cancer Center', 'Hội trường 2', '2026-09-12', '15:35', '15:55', 'Công nghệ 3D', 'Vai trò mới nổi của công nghệ in sinh học 3d trong phẫu thuật tuyến vú.'),
('SES-160', 'Quản lý khoang chết trong phẫu thuật tạo hình cơ thể', 'GS. BS. C. Bob Basu, MD, MBA, MPH, FACS', 'President, American Society of Plastic Surgeons', 'Hội trường 2', '2026-09-12', '16:00', '16:10', 'Tạo hình cơ thể', 'Quản lý khoang chết trong phẫu thuật tạo hình cơ thể.'),
('SES-161', 'Tối ưu hóa kết quả trong phẫu thuật thu nhỏ ngực khổng lồ bằng đường rạch ngang, cuống dưới', 'TS. BS Trần Văn Dương', 'Trưởng khoa phẫu thuật tạo hình thẩm mỹ Bệnh viện Chợ Rẫy', 'Hội trường 2', '2026-09-12', '16:15', '16:25', 'Phẫu thuật vú', 'Tối ưu hóa kết quả trong phẫu thuật thu nhỏ ngực khổng lồ bằng đường rạch ngang, cuống dưới.'),
('SES-162', 'Ghép mỡ quanh mắt. Một thử thách lĩnh vực: tránh biến chứng và đạt được kết quả thuận lợi', 'TS. BS. Amin Kalaji, MD', 'Chair of the Membership Committee for ISPRES', 'Hội trường 2', '2026-09-12', '16:30', '16:40', 'Cấy mỡ', 'Ghép mỡ quanh mắt. Một thử thách lĩnh vực: tránh biến chứng và đạt được kết quả thuận lợi.'),
('SES-163', 'Bế mạc phiên báo cáo Hall B', 'Ban Tổ Chức', 'PARS 2026', 'Hội trường 2', '2026-09-12', '17:00', '17:15', 'Bế mạc', 'Kết thúc phiên báo cáo khoa học tại Hội trường B.'),
('SES-199', 'GALA DINNER - Đêm tiệc vinh danh tinh hoa gắn kết', 'Toàn thể Đại biểu & Khách mời', 'PARS 2026', 'Melia Hanoi', '2026-09-12', '18:00', '22:00', 'Gala Dinner', 'Đêm hội tinh hoa tôn vinh và thắt chặt tình hữu nghị tại Khách sạn Melia Hanoi.'),
('SES-201', 'Y học tái tạo với các sản phẩm có nguồn gốc từ mô mỡ', 'Prof. Kotaro Yoshimura, MD, PhD', 'Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản', 'Hội trường 1', '2026-09-13', '09:00', '09:20', 'Y học tái sinh', 'Y học tái tạo với các sản phẩm có nguồn gốc từ mô mỡ.'),
('SES-202', 'Biomaterials Research for Implantable Materials', 'Pham Le Buu Truc, MD, PhD', 'Trung tâm công nghệ sinh học TPHCM', 'Hội trường 1', '2026-09-13', '09:25', '09:40', 'Vật liệu sinh học', 'Biomaterials Research for Implantable Materials.'),
('SES-203', 'Kỹ thuật tạo hình thành bụng hút mỡ dqh: phương pháp an toàn và hiệu quả giúp điêu khắc vòng bụng toàn diện', 'PGS.TS.BS Đỗ Quang Hùng', 'Phó chủ tịch hội PTTM Việt Nam (VSAPS)', 'Hội trường 1', '2026-09-13', '09:45', '09:55', 'Tạo hình thành bụng', 'Kỹ thuật tạo hình thành bụng hút mỡ dqh: phương pháp an toàn và hiệu quả giúp điêu khắc vòng bụng toàn diện.'),
('SES-204', 'Các biến chứng trong phẫu thuật tạo hình cơ thể', 'TS.BS. Arturo Ramírez Montañana, MD, PhD', 'Chủ tịch ISAPS', 'Hội trường 1', '2026-09-13', '10:00', '10:20', 'Tạo hình cơ thể', 'Các biến chứng trong phẫu thuật tạo hình cơ thể.'),
('SES-205', 'Ứng dụng kỹ thuật cấy mỡ hỗ trợ tế bào (cal) và phân đoạn nền mạch (svf) trong tái tạo vú tự thân: báo cáo loạt ca lâm sàng sơ khởi về tính khả thi', 'Assoc. Prof. Nguyen Dinh Tung, MD, PhD', 'Thư ký Quốc gia ISAPS Việt Nam & Giám đốc chuyên môn Bệnh viện Emcas', 'Hội trường 1', '2026-09-13', '10:25', '10:40', 'Phẫu thuật vú', 'Ứng dụng kỹ thuật cấy mỡ hỗ trợ tế bào (cal) và phân đoạn nền mạch (svf) trong tái tạo vú tự thân: báo cáo loạt ca lâm sàng sơ khởi về tính khả thi.'),
('SES-206', 'Thảo luận & Hỏi đáp (Q&A)', 'Ban Chủ Tọa & Đại Biểu', 'PARS 2026', 'Hội trường 1', '2026-09-13', '10:45', '10:55', 'Q&A', 'Phiên thảo luận mở, giải đáp trực tiếp các câu hỏi lâm sàng.'),
('SES-207', 'Group photo session & Closing Session', 'Ban Tổ Chức', 'PARS 2026', 'Hội trường 1', '2026-09-13', '11:00', '11:30', 'Bế mạc', 'Chụp ảnh lưu niệm tập thể và Bế mạc chính thức hội nghị PARS 2026.')
ON CONFLICT (id) DO NOTHING;

-- 8.12. Seed Speakers (OFFICIAL 15 SPEAKERS)
INSERT INTO public.speakers (id, title, full_name, organization, department, phone, email, bio, presentation_title, presentation_track, abstract_text, document_name, document_url, calendar_synced, status, scheduled_session_id, registration_date) VALUES
('SPK-001', 'Arturo Ramírez Montañana, MD, PhD', 'Arturo Ramírez Montañana, MD, PhD', 'International Society of Aesthetic Plastic Surgery (ISAPS)', 'Plastic, Aesthetic & Reconstructive Surgery', NULL, NULL, 'President of the International Society of Aesthetic Plastic Surgery (ISAPS). Renowned Plastic, Aesthetic & Reconstructive Surgeon based in Monterrey, Mexico. Global authority on deep plane facelift, facial rejuvenation, and aesthetic eyelid surgery.', 'Bài học kinh nghiệm trong căng da mặt: Quản lý tụ máu và cắt bỏ một phần tuyến nước bọt dưới hàm', 'Căng da mặt', 'Bài học kinh nghiệm và quy trình quản lý tụ máu trong căng da mặt nâng cao...', NULL, NULL, true, 'approved', 'SES-102', NOW()),
('SPK-002', 'Prof. Kotaro Yoshimura, MD, PhD', 'Prof. Kotaro Yoshimura, MD, PhD', 'Jichi Medical University', 'Department of Plastic Surgery', NULL, NULL, 'Chairman of the Department of Plastic Surgery at Jichi Medical University, Japan. World-famous pioneer in regenerative medicine, Cell-Assisted Lipotransfer (CAL), and adipose-derived stem cell clinical applications.', 'Nâng Ngực và Tái Tạo Tuyến Vú Tự Nhiên bằng Ghép Mỡ Tự Thân và Túi Độn', 'Phẫu thuật vú', 'Ứng dụng tế bào gốc gốc mỡ tự thân kết hợp túi ngực đạt kết quả vượt bậc...', NULL, NULL, true, 'approved', 'SES-109', NOW()),
('SPK-003', 'Bertha Torres Gómez, MD, PhD', 'Bertha Torres Gómez, MD, PhD', 'Mexican Association of Plastic, Aesthetic, and Reconstructive Surgery (AMCPER)', 'National Secretary of ISAPS', NULL, NULL, 'National Secretary of ISAPS for Mexico. Active leader in AMCPER. Specialized in advanced fat grafting grids, natural eyelid rejuvenation, and complex secondary rhinoplasty post-fillers.', 'Sự Phát Triển Của Lưới Cấy Mỡ', 'Cấy mỡ', 'Phân tích sự tiến hóa và tối ưu hóa cấu trúc lưới cấy mỡ tự thân nâng cao...', NULL, NULL, true, 'approved', 'SES-103', NOW()),
('SPK-004', 'Prof. Fabio Santanelli, MD', 'Prof. Fabio Santanelli, MD', 'Sapienza University of Rome', 'European Association of Plastic Surgeons (EURAPS)', NULL, NULL, 'Secretary General of the European Association of Plastic Surgeons. Full Professor of Plastic Surgery at Sapienza University of Rome, Italy. Leading European expert in hybrid breast reconstruction and BIA-ALCL safety.', 'Giảm thiểu xâm lấn trong phẫu thuật nâng ngực: quy trình preservè', 'Phẫu thuật vú', 'Quy trình preservè bảo tồn mô và giảm thiểu tối đa mức độ xâm lấn...', NULL, NULL, true, 'approved', 'SES-112', NOW()),
('SPK-005', 'C. Bob Basu, MD, MBA, MPH, FACS', 'C. Bob Basu, MD, MBA, MPH, FACS', 'American Society of Plastic Surgeons (ASPS)', 'Basu Aesthetics + Plastic Surgery', NULL, NULL, 'President of the American Society of Plastic Surgeons (ASPS). Acclaimed board-certified plastic surgeon, author, and speaker based in Houston, Texas. Expert in post-GLP-1 weight loss body contouring and dead space management.', 'Phẫu thuật trẻ hóa khuôn mặt sau giảm cân do thuốc GLP-1', 'Trẻ hóa khuôn mặt', 'Các giải pháp tạo hình thẩm mỹ chuyên sâu cho bệnh nhân sụt cân nhanh do GLP-1...', NULL, NULL, true, 'approved', 'SES-154', NOW()),
('SPK-006', 'Constantin Stan, MD, PhD', 'Constantin Stan, MD, PhD', 'The Cronos Med Group of Clinics', 'Plastic & Reconstructive Surgery', NULL, NULL, 'Founder of the Cronos Med Group of Clinics, Romania. Pioneer in minimally invasive breast surgery, developer of the multi-plane technique, and inventor of specialized surgical devices for tissue preservation.', 'Mở rộng chỉ định bệnh nhân trên các kiểu hình vú khác nhau bằng khái niệm Preserve', 'Phẫu thuật vú', 'Khái niệm Preserve giúp linh hoạt thiết kế khoang ngực tối ưu...', NULL, NULL, true, 'approved', 'SES-113', NOW()),
('SPK-007', 'Robert Francis Parkyn, MD', 'Robert Francis Parkyn, MD', 'Adelaide University', 'Norwood Breast & Endocrine Surgery Centre', NULL, NULL, 'Clinical Associate Professor in the Discipline of Surgery at Adelaide University, Australia. Specialist breast and endocrine surgeon with extensive research on sex hormones and breast health.', 'Hormone sinh dục và tuyến vú: Hướng dẫn lựa chọn và tối ưu hóa điều trị', 'Nội tiết & Tuyến vú', 'Tương tác nội tiết tố và các giải pháp trị liệu tuyến vú an toàn...', NULL, NULL, true, 'approved', 'SES-119', NOW()),
('SPK-008', 'Amin Kalaji, MD', 'Amin Kalaji, MD', 'International Society of Regenerative Plastic Surgery (ISPRES)', 'Membership Committee Chair', NULL, NULL, 'Membership Committee Chair for ISPRES and National Secretary Group Chair for ISAPS. Renowned Swedish plastic surgeon. Authority on periorbital fat grafting and regenerative medicine in aesthetic surgery.', 'Phương pháp cấy mỡ trong phẫu thuật thẩm mỹ vùng kín nữ và chất lượng cuộc sống', 'Thẩm mỹ vùng kín', 'Cải thiện toàn diện thẩm mỹ và chức năng sinh lý bằng cấy mỡ tự thân...', NULL, NULL, true, 'approved', 'SES-116', NOW()),
('SPK-009', 'Prof. Mark W. Clemens, MD, MBA, FACS', 'Prof. Mark W. Clemens, MD, MBA, FACS', 'The University of Texas MD Anderson Cancer Center', 'Department of Plastic Surgery', NULL, NULL, 'Professor of Plastic Surgery at MD Anderson Cancer Center, Houston, Texas. Internationally recognized leading researcher on Breast Implant-Associated Anaplastic Large Cell Lymphoma (BIA-ALCL) and robotic breast reconstruction.', 'Đường Rạch Nhỏ, Tiềm Năng Lớn: Phẫu thuật Robot trong Tái Tạo Tuyến Vú', 'Phẫu thuật vú', 'Ứng dụng phẫu thuật robot nội soi nâng cao hiệu quả tái tạo tuyến vú...', NULL, NULL, true, 'approved', 'SES-111', NOW()),
('SPK-010', 'Assoc. Prof. Yuko, MD', 'Assoc. Prof. Yuko, MD', 'Kameda Medical Hospital', 'Breast Center Director', NULL, NULL, 'Director of the Breast Center at Kameda Medical Hospital, Japan. Specialized in state-of-the-art robotic breast reconstruction, endoscopic surgery, and Stem Cell Assisted Fat Grafting (CAL).', 'Từ phẫu thuật nội soi đến phẫu thuật robot trong phẫu thuật vú: Thực tiễn lâm sàng và triển vọng tương lai của tái tạo vú tại Nhật Bản', 'Phẫu thuật vú', 'Thực tiễn lâm sàng và triển vọng tương lai của tái tạo vú tại Nhật Bản...', NULL, NULL, true, 'approved', 'SES-114', NOW()),
('SPK-011', 'Assoc. Prof. Dr. Meritorious Physician Vu Ngoc Lam', 'Major General, Assoc. Prof. Dr. Meritorious Physician Vu Ngoc Lam', 'Military Central Hospital 108', 'Craniofacial and Plastic Surgery Center', NULL, NULL, 'Director of the Craniofacial and Plastic Surgery Center at Military Central Hospital 108, Hanoi. Leading expert in complex maxillofacial reconstruction, craniofacial deformity correction, and microvascular surgery.', 'Phẫu thuật tạo hình sọ mặt và tái tạo xương hàm phức tạp', 'Tạo hình sọ mặt', 'Nghiên cứu lâm sàng và kết quả điều trị dị tật sọ mặt bằng kỹ thuật tiên tiến...', NULL, NULL, true, 'approved', 'SES-202', NOW()),
('SPK-012', 'Assoc. Prof. Dr. Pham Hieu Liem', 'Assoc. Prof. Dr. Pham Hieu Liem', 'Pham Ngoc Thach University of Medicine', 'Department of Plastic and Aesthetic Surgery', NULL, NULL, 'Head of the Department of Plastic and Aesthetic Surgery at Pham Ngoc Thach University of Medicine, and Head of Plastic Surgery at HCMC University of Medicine and Pharmacy Hospital. Expert in aesthetic breast surgery and body contouring.', 'Các cải tiến trong phẫu thuật nâng ngực thẩm mỹ và treo sa trễ vú', 'Phẫu thuật vú', 'Phân tích các kỹ thuật khâu thẩm mỹ treo trễ ngực và chọn túi độn an toàn...', NULL, NULL, true, 'approved', NULL, NOW()),
('SPK-013', 'Assoc. Prof. Pham Van Phuc, PhD', 'Assoc. Prof. Pham Van Phuc, PhD', 'Stem Cell Institute, HCMC National University', 'Director', NULL, NULL, 'Director of the Stem Cell Institute at Ho Chi Minh City National University. Renowned stem cell scientist, Editor-in-Chief of Biomedical Research and Therapy. Pioneer in Stromal Vascular Fraction (SVF) clinical translation in Vietnam.', 'Applications of Stem Cells and Stromal Vascular Fraction (SVF)', 'Y học tái sinh', 'Ứng dụng thực tiễn của tế bào gốc và phân đoạn mạch SVF trong y học thẩm mỹ...', NULL, NULL, true, 'approved', 'SES-153', NOW()),
('SPK-014', 'Assoc. Prof. Nguyen Dinh Tung, MD, PhD', 'Assoc. Prof. Nguyen Dinh Tung, MD, PhD', 'EMCAS Cosmetic Plastic Surgery Hospital', 'National Secretary of ISAPS Vietnam', NULL, NULL, 'National Secretary of ISAPS Vietnam and Medical Director of EMCAS Hospital, HCMC. Leading authority in Vietnam on Stem Cell Assisted Fat Grafting (CAL) and stromal vascular fraction (SVF) breast reconstruction.', 'Ứng dụng kỹ thuật cấy mỡ hỗ trợ tế bào (cal) và phân đoạn nền mạch (svf) trong tái tạo vú tự thân: báo cáo loạt ca lâm sàng sơ khởi về tính khả thi', 'Phẫu thuật vú', 'Báo cáo loạt ca lâm sàng sơ khởi về tính khả thi của kỹ thuật CAL và SVF...', NULL, NULL, true, 'approved', 'SES-205', NOW()),
('SPK-015', 'Pham Le Buu Truc, MD, PhD', 'Pham Le Buu Truc, MD, PhD', 'Ho Chi Minh City Biotechnology Center', 'Biomaterials Department', NULL, NULL, 'Senior researcher at the Ho Chi Minh City Biotechnology Center. Specialized in biomaterials research, tissue engineering, and implantable materials development for reconstructive surgeries.', 'Biomaterials Research for Implantable Materials', 'Vật liệu sinh học', 'Nghiên cứu phát triển các vật liệu sinh học tương thích cấy ghép trong tạo hình...', NULL, NULL, true, 'approved', 'SES-202', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8.13. Business Configuration Default Seeding
INSERT INTO public.business_config (
    id, event_name, organizer_name, event_date, event_location, max_registrations,
    require_payment_proof, allow_self_cancellation, auto_send_zns, require_practice_code,
    app_url, landing_logo_url, landing_landmarks_url, landing_page_sections
) VALUES (
    'default',
    'Hội nghị Khoa học Quốc tế PARS 2026',
    'Bệnh viện Thẩm mỹ EMCAS',
    '12 - 13 THÁNG 09, 2026',
    'Meliá Hanoi, Hà Nội, Việt Nam',
    1500,
    true,
    false,
    true,
    true,
    'https://pars2026.vercel.app',
    '/media__1782106316692.png',
    '/media__1782198647752.png',
    '{
      "hero": {
        "tag": "HỘI NGHỊ KHOA HỌC QUỐC TẾ",
        "title": "PARS",
        "year": "2026",
        "themeEn": "PLASTIC & AESTHETIC REGENERATIVE SURGERY",
        "themeVi": "Phẫu thuật Tạo hình Thẩm mỹ & Y học Tái sinh",
        "date": "12 - 13 THÁNG 09, 2026",
        "location": "MELIÀ HANOI, HÀ NỘI, VIỆT NAM",
        "btnRegisterText": "Đăng ký ngay",
        "btnProgramText": "Chương trình hội nghị"
      },
      "intro": {
        "title": "GIỚI THIỆU HỘI NGHỊ",
        "text1": "Hội nghị Khoa học Quốc tế PARS 2026 do Bệnh viện Thẩm mỹ EMCAS đăng cai tổ chức là sự kiện y khoa đỉnh cao quy tụ dàn chuyên gia thẩm mỹ uy tín hàng đầu toàn cầu (ISAPS, ASPS, EURAPS) và Việt Nam.",
        "text2": "Hội nghị tập trung cập nhật các tiến bộ lâm sàng vượt bậc, chuyển giao công nghệ phẫu thuật tạo hình vóc dáng nâng cao, trẻ hóa vùng kín, nâng mũi sụn sườn cấu trúc và kiểm soát toàn diện rủi ro túi ngực (BIA-ALCL).",
        "highlight1Title": "Đơn vị chủ trì uy tín",
        "highlight1Desc": "Bệnh viện Thẩm mỹ EMCAS sở hữu đầy đủ thẩm quyền chuyên môn và chất lượng dịch vụ chuẩn quốc tế.",
        "highlight2Title": "Chứng chỉ CME 4.5h",
        "highlight2Desc": "Cấp chứng nhận đào tạo liên tục y khoa theo quy định của Bộ Y tế, do Bác sĩ Phạm Xuân Khiêm ký duyệt.",
        "highlight3Title": "Giao lưu chuyên gia đa quốc gia",
        "highlight3Desc": "Cơ hội đối thoại trực tiếp và học tập kinh nghiệm thực chiến từ các Giáo sư hàng đầu Hoa Kỳ, Nhật Bản, Thụy Điển, Mexico."
      },
      "sectionBg": {
        "intro": "#FAF8F5",
        "speakersForeign": "#ffffff",
        "speakersDomestic": "#FAF8F5",
        "register": "#ffffff",
        "sponsors": "#FAF8F5",
        "location": "#ffffff"
      }
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    event_date = EXCLUDED.event_date,
    event_location = EXCLUDED.event_location,
    landing_page_sections = EXCLUDED.landing_page_sections;

-- =========================================================================
-- END OF MASTER INITIALIZATION SCRIPT
-- =========================================================================
