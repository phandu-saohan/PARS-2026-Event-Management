-- ==========================================
-- PARS 2026 - DATABASE SCHEMA FOR SUPABASE
-- ==========================================

-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Registration Packages (Gói đăng ký)
CREATE TABLE public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fee NUMERIC NOT NULL DEFAULT 0,
    benefits TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    includes_cme BOOLEAN DEFAULT FALSE,
    includes_gala BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Specialty Tracks (Chuyên khoa/Phân khoa báo cáo)
CREATE TABLE public.specialty_tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. Dynamic Business Config (Cấu hình nghiệp vụ)
CREATE TABLE public.business_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    event_name TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_location TEXT NOT NULL,
    max_registrations INTEGER DEFAULT 1500,
    require_payment_proof BOOLEAN DEFAULT TRUE,
    allow_self_cancellation BOOLEAN DEFAULT FALSE,
    auto_send_zns BOOLEAN DEFAULT TRUE,
    require_practice_code BOOLEAN DEFAULT TRUE,
    pwa_name TEXT DEFAULT 'PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ',
    pwa_short_name TEXT DEFAULT 'PARS 2026',
    pwa_description TEXT DEFAULT 'Hệ thống quản lý Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên PARS 2026',
    pwa_logo_url TEXT DEFAULT '/icons/icon-512.png',
    pwa_theme_color TEXT DEFAULT '#4f46e5',
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

-- 4. User Accounts (BTC / Admin / CTV Accounts)
CREATE TABLE public.user_accounts (
    id TEXT PRIMARY KEY, -- Maps to auth.users.id if using Supabase Auth
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'btc', 'ctv')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_active TIMESTAMP WITH TIME ZONE,
    permissions TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Conference Sessions (Lịch trình hội nghị)
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    speaker_name TEXT,
    speaker_title TEXT,
    room_name TEXT,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    start_time TEXT NOT NULL, -- Format: HH:MM
    end_time TEXT NOT NULL, -- Format: HH:MM
    track TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Attendees (Người tham dự / Đại biểu)
CREATE TABLE public.attendees (
    id TEXT PRIMARY KEY, -- Format: ATT-XXX
    title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    nationality TEXT DEFAULT 'vietname',
    package_id TEXT REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name TEXT,
    package_fee NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending_verification')),
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash')),
    transaction_proof_url TEXT,
    registration_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    qr_code_value TEXT UNIQUE NOT NULL,
    is_checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TEXT, -- Format: YYYY-MM-DD HH:MM
    notes TEXT,
    year_of_birth INTEGER,
    gender TEXT,
    cme_required BOOLEAN DEFAULT FALSE,
    cme_identity_no TEXT,
    gala_required BOOLEAN DEFAULT FALSE,
    masterclass_required BOOLEAN DEFAULT FALSE,
    tour_required BOOLEAN DEFAULT FALSE,
    registration_period TEXT,
    province TEXT,
    avatar_url TEXT,
    doctor_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Speakers (Báo cáo viên / Bài tóm tắt)
CREATE TABLE public.speakers (
    id TEXT PRIMARY KEY, -- Format: SPK-XXX
    title TEXT,
    full_name TEXT NOT NULL,
    organization TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    bio TEXT,
    presentation_title TEXT NOT NULL,
    presentation_track TEXT,
    abstract_text TEXT,
    document_url TEXT,
    document_name TEXT,
    calendar_synced BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    scheduled_session_id TEXT REFERENCES public.sessions(id) ON DELETE SET NULL,
    avatar_url TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Sponsors (Nhà tài trợ)
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
    benefits_signed TEXT[] DEFAULT '{}',
    notes TEXT,
    contract_no TEXT,
    contract_sign_date TEXT,
    contract_value NUMERIC DEFAULT 0,
    contract_status TEXT CHECK (contract_status IN ('signed', 'pending_signature', 'draft', 'cancelled')),
    contract_file_url TEXT,
    contract_file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Internal Tasks (Công việc nội bộ BTC)
CREATE TABLE public.internal_tasks (
    id TEXT PRIMARY KEY, -- Format: TSK-XXX
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_name TEXT,
    assigned_to_id TEXT REFERENCES public.user_accounts(id) ON DELETE SET NULL,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT CHECK (status IN ('todo', 'in_progress', 'done')),
    deadline TEXT, -- Format: YYYY-MM-DD
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Finance Transactions (Thu chi tài chính)
CREATE TABLE public.finance_transactions (
    id TEXT PRIMARY KEY, -- Format: TXN-XXX
    date TEXT NOT NULL, -- Format: YYYY-MM-DD HH:MM
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    reference_id TEXT, -- Attendee ID or Sponsor ID
    payment_method TEXT,
    verified_by TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Notification Templates (Mẫu tin nhắn Zalo/Email)
CREATE TABLE public.notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. registration_success, payment_confirmed, reminder_event, abstract_approved
    channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo', 'sms', 'whatsapp')),
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    zns_template_id TEXT,
    zns_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Sent Notification Logs (Lịch sử gửi thông báo)
CREATE TABLE public.notification_logs (
    id TEXT PRIMARY KEY, -- Format: NTF-XXX
    recipient TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'zalo', 'sms', 'whatsapp')),
    template_id TEXT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    template_name TEXT,
    sender TEXT NOT NULL,
    sent_at TEXT NOT NULL, -- Format: YYYY-MM-DD HH:MM
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    payload JSONB DEFAULT '{}'::jsonb,
    response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Embed Scripts (Mã nhúng bên thứ ba)
CREATE TABLE public.embed_scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('delegate', 'speaker', 'sponsor', 'analytics', 'custom')),
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TEXT NOT NULL, -- Format: YYYY-MM-DD HH:MM
    created_at_db TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. System Configuration (Zalo, Email configs as JSONB)
CREATE TABLE public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Marketing Posts Configuration
CREATE TABLE public.marketing_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL, -- 'news_feed', 'video_short'
    platforms TEXT[], -- Array of strings (facebook, zalo, tiktok, youtube)
    status TEXT NOT NULL, -- 'draft', 'scheduled', 'published'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metrics JSONB, -- reach, likes, shares, comments, views
    media_url TEXT,
    video_script TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embed_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (for client UI, check-in, info screens)
CREATE POLICY "Allow public read packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Allow public read specialty_tracks" ON public.specialty_tracks FOR SELECT USING (true);
CREATE POLICY "Allow public read business_config" ON public.business_config FOR SELECT USING (true);
CREATE POLICY "Allow public read sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Allow public read speakers" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Allow public read marketing_posts" ON public.marketing_posts FOR SELECT USING (true);

-- 2. Registration Policies (allow public insert for delegates, speakers & sponsors registration forms)
CREATE POLICY "Allow public insert attendees" ON public.attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert speakers" ON public.speakers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert sponsors" ON public.sponsors FOR INSERT WITH CHECK (true);

-- 3. Authenticated Users (BTC, Admin, CTV) Policies
-- For simplicity in prototypes, we allow authenticated users (logged-in accounts) full access
-- A more advanced policy would inspect the user_accounts role
CREATE POLICY "Allow authenticated read user_accounts" ON public.user_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated manage packages" ON public.packages TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage specialty_tracks" ON public.specialty_tracks TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage business_config" ON public.business_config TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage user_accounts" ON public.user_accounts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sessions" ON public.sessions TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage attendees" ON public.attendees TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage speakers" ON public.speakers TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage sponsors" ON public.sponsors TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage internal_tasks" ON public.internal_tasks TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage finance_transactions" ON public.finance_transactions TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage notification_templates" ON public.notification_templates TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage notification_logs" ON public.notification_logs TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert notification_logs" ON public.notification_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage embed_scripts" ON public.embed_scripts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- SUPABASE REALTIME CONFIGURATION
-- ==========================================

-- Enable real-time updates for key collaborative tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.speakers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_posts;
