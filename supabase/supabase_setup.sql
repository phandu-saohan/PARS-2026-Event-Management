
-- ============================================================
-- PARS 2026 - UNIFIED DATABASE SETUP SCRIPT FOR SUPABASE
-- COPY & PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- ============================================================

-- ------------------------------------------------------------
-- SECTION 1: CLEANUP (Drop tables if they exist to start fresh)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.embed_scripts CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.notification_templates CASCADE;
DROP TABLE IF EXISTS public.finance_transactions CASCADE;
DROP TABLE IF EXISTS public.internal_tasks CASCADE;
DROP TABLE IF EXISTS public.sponsors CASCADE;
DROP TABLE IF EXISTS public.speakers CASCADE;
DROP TABLE IF EXISTS public.attendees CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.user_accounts CASCADE;
DROP TABLE IF EXISTS public.business_config CASCADE;
DROP TABLE IF EXISTS public.specialty_tracks CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.marketing_posts CASCADE;


-- ------------------------------------------------------------

-- SECTION 2: CREATE TABLES AND ENFORCE RLS

-- ------------------------------------------------------------

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
    delegate_form_config JSONB DEFAULT '{}'::jsonb,
    speaker_form_config JSONB DEFAULT '{}'::jsonb,
    sponsor_form_config JSONB DEFAULT '{}'::jsonb,
    add_on_services JSONB DEFAULT '[]'::jsonb,
    cme_template_config JSONB DEFAULT '{}'::jsonb,
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
CREATE POLICY "Allow authenticated manage embed_scripts" ON public.embed_scripts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);



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


-- ============================================================
-- AUTOMATIC AUTH USER PROFILE SYNC TRIGGER
-- ============================================================

-- Function to automatically handle new user signups from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_accounts (id, name, email, role, status, permissions)
  VALUES (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    -- Default to 'admin' for admin@admin.com, others get 'ctv'
    case when new.email = 'admin@admin.com' then 'admin' else 'ctv' end,
    'active',
    case when new.email = 'admin@admin.com' 
      then ARRAY['all', 'manage_attendees', 'manage_speakers', 'manage_sponsors', 'manage_finances', 'manage_settings']
      else ARRAY['manage_attendees']
    end
  )
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id,
      name = coalesce(EXCLUDED.name, public.user_accounts.name),
      role = coalesce(EXCLUDED.role, public.user_accounts.role),
      status = coalesce(EXCLUDED.status, public.user_accounts.status),
      permissions = coalesce(EXCLUDED.permissions, public.user_accounts.permissions);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute after a new user is inserted into auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- ============================================================
-- STORAGE BUCKETS INITIALIZATION AND RLS POLICIES
-- ============================================================

-- Ensure the 'assets' storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Allow public read assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manage assets" ON storage.objects;

-- RLS Policy: Allow anyone to view/read objects in the assets bucket (public bucket)
CREATE POLICY "Allow public read assets" ON storage.objects 
  FOR SELECT USING (bucket_id = 'assets');

-- RLS Policy: Allow public registration forms to upload files (portraits, payment proofs)
CREATE POLICY "Allow public upload assets" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'assets');

-- RLS Policy: Allow authenticated users (staff, admins) full management access
CREATE POLICY "Allow authenticated manage assets" ON storage.objects 
  FOR ALL TO authenticated USING (bucket_id = 'assets');



-- ------------------------------------------------------------

-- SECTION 3: INSERT SEED DATA

-- ------------------------------------------------------------

-- 1. Seed Specialty Tracks (Chuyên khoa báo cáo)
INSERT INTO public.specialty_tracks (id, name, name_en, description) VALUES
('track-1', 'Ngoại Lồng Ngực & Tim Mạch', 'Thoracic & Cardiovascular Surgery', 'Chuyên khoa ngoại lồng ngực, mạch máu và tim mạch'),
('track-2', 'Thần Kinh Học', 'Neurology & Stroke', 'Nội thần kinh, ngoại thần kinh và đột quỵ'),
('track-3', 'Gây Mê Hồi Sức & ERAS', 'Anesthesia & Resuscitation & ERAS', 'Gây mê, hồi sức tích cực và phục hồi sớm sau phẫu thuật'),
('track-4', 'Ngoại khoa tổng quát', 'General Surgery', 'Phẫu thuật tiêu hóa, gan mật và ổ bụng chung'),
('track-5', 'Y học Công nghệ & AI', 'Medical Technology & AI', 'Ứng dụng công nghệ thông tin, mô phỏng sinh học và AI trong y học'),
('track-6', 'Tạo hình Thẩm mỹ', 'Aesthetic Plastic Surgery', 'Phẫu thuật tạo hình, tái tạo thẩm mỹ và da liễu thẩm mỹ')
ON CONFLICT (id) DO NOTHING;


-- 2. Seed Registration Packages (Gói đăng ký)
INSERT INTO public.packages (id, name, fee, benefits, is_active, includes_cme, includes_gala) VALUES
('pkg-member', 'Thành viên HPASS/HSPAS/PARS', 2500000, ARRAY[
  'Quyền tham dự đầy đủ mọi phiên báo cáo khoa học ngày chính',
  'Nhận bộ túi đựng tài liệu hội nghị & quà lưu niệm chính thức',
  'Teabreak và Tiệc trà giải lao cao cấp giữa các chuyên đề',
  'Hỗ trợ suất ăn trưa tại hội nghị',
  'Nhận Chứng nhận tham luận & kỷ yếu tóm tắt'
], true, false, false),
('pkg-standard', 'Không phải Hội viên', 3000000, ARRAY[
  'Quyền tham dự đầy đủ tất cả chuyên đề báo cáo',
  'Nhận bộ túi đựng tài liệu & quà tặng hội nghị chính thức',
  'Phục vụ Teabreak & Tiệc trà giải lao cao cấp',
  'Hỗ trợ suất ăn trưa đầy đủ hàng ngày trong suốt hội nghị'
], true, false, false),
('pkg-student', 'Học viên chuyên ngành PTTM', 1000000, ARRAY[
  'Tham dự học thuật định hướng Thẩm mỹ & Da liễu sảnh chính',
  'Nhận tài liệu đĩa tóm tắt hoặc mã tải Bản mềm kỷ yếu sự kiện',
  'Teabreak & Trà bánh phục vụ nhẹ nhàng tại hành lang đại hội'
], true, false, false),
('pkg-foreign', 'BS Nước ngoài (Foreign Doctor)', 3750000, ARRAY[
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
('pkg-vip', 'Gói Đại Biểu VIP', 3000000, ARRAY[
  'Đầy đủ quyền tham dự các phiên học thuật và khu vực VIP',
  'Bộ túi tài liệu & Quà lưu niệm VIP',
  'Teabreak & Trà bánh cao cấp',
  'Tham dự Gala Dinner đặc quyền',
  'Chứng nhận tham luận có CME'
], true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Business Config (Cấu hình nghiệp vụ)
INSERT INTO public.business_config (
  id, event_name, organizer_name, event_date, event_location, 
  max_registrations, require_payment_proof, allow_self_cancellation, 
  auto_send_zns, require_practice_code,
  delegate_form_config, speaker_form_config, sponsor_form_config
) VALUES (
  'default', 
  'Hội nghị Khoa học Thường niên PARS 2026', 
  'Hội Phẫu thuật Tạo hình Thẩm mỹ Việt Nam (PARS)', 
  'Ngày 14 - 15 tháng 11 năm 2026', 
  'Trung tâm Hội nghị Quốc gia, Hà Nội', 
  1500, 
  true, 
  false, 
  true, 
  true,
  '{
    "isOpen": true,
    "language": "both",
    "formTitle": "ĐĂNG KÝ ĐẠI BIỂU THAM DỰ HỘI NGHỊ THƯỜNG NIÊN PARS 2026",
    "formDescription": "Cổng đăng ký điện tử dành cho đại biểu, bác sĩ thẩm mỹ trong nước & quốc tế. Điền chính xác thông tin để phát hành CME và thẻ đại biểu QR tự động.",
    "organizerLabel": "HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)",
    "headerBgColor": "#042f2e",
    "accentColor": "#fbbf24",
    "closedMessage": "Cổng đăng ký đại biểu hiện đã đóng. Vui lòng liên hệ Ban tổ chức để biết thêm thông tin.",
    "footerNote": "",
    "maxEntries": 0,
    "sectionLabels": {
      "personalInfo":  { "vi": "THÔNG TIN ĐẠI BIỂU ĐĂNG KÝ",      "en": "DELEGATE PERSONAL INFORMATION" },
      "scheduleAddOns":{ "vi": "DỊCH VỤ PHỤ TRỢ TỰ CHỌN", "en": "OPTIONAL ADD-ON SERVICES" },
      "package":       { "vi": "CHỌN GÓI ĐĂNG KÝ HỘI NGHỊ",         "en": "CONFERENCE REGISTRATION PACKAGE" },
      "payment":       { "vi": "THÔNG TIN THANH TOÁN CHUYỂN KHOẢN",  "en": "BANK TRANSFER PAYMENT DETAILS" }
    }
  }'::jsonb,
  '{
    "isOpen": true,
    "language": "both",
    "formTitle": "ĐĂNG KÝ NỘP BÀI BÁO CÁO KHOA HỌC PARS 2026",
    "formDescription": "Cổng nộp báo cáo khoa học dành cho báo cáo viên, chuyên gia trong và ngoài nước. Vui lòng đính kèm file tóm tắt abstract.",
    "organizerLabel": "HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)",
    "headerBgColor": "#1e1b4b",
    "accentColor": "#818cf8",
    "closedMessage": "Cổng nộp bài báo cáo hiện đã đóng. Vui lòng liên hệ Ban thư ký khoa học.",
    "footerNote": "",
    "maxEntries": 0,
    "sectionLabels": {
      "speakerInfo":   { "vi": "THÔNG TIN BÁO CÁO VIÊN",            "en": "SPEAKER INFORMATION" },
      "abstractInfo":  { "vi": "NỘI DUNG ĐỀ TÀI ĐĂNG KÝ ĐỀ TRÌNH", "en": "ABSTRACT & PRESENTATION DETAILS" }
    }
  }'::jsonb,
  '{
    "isOpen": true,
    "language": "both",
    "formTitle": "ĐĂNG KÝ NHÀ TÀI TRỢ & ĐỐI TÁC PARS 2026",
    "formDescription": "Đăng ký hợp tác tài trợ chính thức cho Hội nghị Khoa học Thẩm mỹ thường niên PARS 2026. Ban tổ chức sẽ liên hệ xác nhận trong 24h.",
    "organizerLabel": "HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)",
    "headerBgColor": "#1c1917",
    "accentColor": "#f59e0b",
    "closedMessage": "Cổng đăng ký tài trợ hiện đã đóng. Vui lòng liên hệ Ban tổ chức.",
    "footerNote": "",
    "maxEntries": 0,
    "sectionLabels": {
      "sponsorProfile": { "vi": "THÔNG TIN DOANH NGHIỆP TÀI TRỢ",  "en": "SPONSOR / COMPANY PROFILE" },
      "tierSelect":     { "vi": "CHỌN GÓI TÀI TRỢ",                 "en": "SPONSORSHIP PACKAGE SELECTION" }
    },
    "sponsorPackages": [
      {
        "id": "diamond",
        "name": "Kim Cương",
        "nameEn": "Diamond Partner",
        "fee": 600000000,
        "color": "#6366f1",
        "benefits": [
          "Tặng 50 vé tham dự Gala",
          "Tặng 3 vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): 2 suất",
          "Đại biểu đăng ký qua nhà tài trợ: Giảm 25%",
          "Gian hàng theo tiêu chuẩn: Độc quyền",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 6",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: 3 tháng",
          "Standee trước cửa hội trường: 2 cái",
          "Đăng bài viết về sản phẩm trên Web, page hội: 5 bài",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "Complimentary 50 Gala tickets",
          "Complimentary 3 Welcome Dinner tickets",
          "Hands-on training room use (2h): 2 slots",
          "Delegate registration discount: 25% Off",
          "Standard exhibition booth: Exclusive",
          "Logo on backdrop & printed materials: Size 6",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: 3 Months",
          "Standee at hall entrance: 2 pcs",
          "Product promotion posts on Web/Page: 5 posts",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      },
      {
        "id": "platinum",
        "name": "Bạch Kim",
        "nameEn": "Platinum Partner",
        "fee": 400000000,
        "color": "#8b5cf6",
        "benefits": [
          "Tặng 40 vé tham dự Gala",
          "Tặng 2 vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): 1 suất",
          "Đại biểu đăng ký qua nhà tài trợ: Giảm 20%",
          "Gian hàng theo tiêu chuẩn: Đặc biệt 1",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 5",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: 2 tháng",
          "Standee trước cửa hội trường: 1 cái",
          "Đăng bài viết về sản phẩm trên Web, page hội: 3 bài",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "Complimentary 40 Gala tickets",
          "Complimentary 2 Welcome Dinner tickets",
          "Hands-on training room use (2h): 1 slot",
          "Delegate registration discount: 20% Off",
          "Standard exhibition booth: Special 1",
          "Logo on backdrop & printed materials: Size 5",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: 2 Months",
          "Standee at hall entrance: 1 pc",
          "Product promotion posts on Web/Page: 3 posts",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      },
      {
        "id": "gold",
        "name": "Vàng",
        "nameEn": "Gold Partner",
        "fee": 300000000,
        "color": "#f59e0b",
        "benefits": [
          "Tặng 30 vé tham dự Gala",
          "Tặng 1 vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): 1 suất",
          "Đại biểu đăng ký qua nhà tài trợ: Giảm 15%",
          "Gian hàng theo tiêu chuẩn: Đặc biệt 2",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 4",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: 1 tháng",
          "Standee trước cửa hội trường: Không",
          "Đăng bài viết về sản phẩm trên Web, page hội: 2 bài",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "Complimentary 30 Gala tickets",
          "Complimentary 1 Welcome Dinner ticket",
          "Hands-on training room use (2h): 1 slot",
          "Delegate registration discount: 15% Off",
          "Standard exhibition booth: Special 2",
          "Logo on backdrop & printed materials: Size 4",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: 1 Month",
          "Standee at hall entrance: No",
          "Product promotion posts on Web/Page: 2 posts",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      },
      {
        "id": "silver",
        "name": "Bạc",
        "nameEn": "Silver Partner",
        "fee": 200000000,
        "color": "#94a3b8",
        "benefits": [
          "Tặng 20 vé tham dự Gala",
          "Không có vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): Ưu đãi 50%",
          "Đại biểu đăng ký qua nhà tài trợ: Giảm 10%",
          "Gian hàng theo tiêu chuẩn: Ưu tiên 1",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 3",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: Không",
          "Standee trước cửa hội trường: Không",
          "Đăng bài viết về sản phẩm trên Web, page hội: 1 bài",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "Complimentary 20 Gala tickets",
          "No Welcome Dinner tickets",
          "Hands-on training room use (2h): 50% Discount",
          "Delegate registration discount: 10% Off",
          "Standard exhibition booth: Priority 1",
          "Logo on backdrop & printed materials: Size 3",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: No",
          "Standee at hall entrance: No",
          "Product promotion posts on Web/Page: 1 post",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      },
      {
        "id": "bronze",
        "name": "Đồng",
        "nameEn": "Bronze Partner",
        "fee": 100000000,
        "color": "#d97706",
        "benefits": [
          "Tặng 10 vé tham dự Gala",
          "Không có vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): Ưu đãi 40%",
          "Đại biểu đăng ký qua nhà tài trợ: Giảm 5%",
          "Gian hàng theo tiêu chuẩn: Ưu tiên 2",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 2",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: Không",
          "Standee trước cửa hội trường: Không",
          "Đăng bài viết về sản phẩm trên Web, page hội: 1 bài",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "Complimentary 10 Gala tickets",
          "No Welcome Dinner tickets",
          "Hands-on training room use (2h): 40% Discount",
          "Delegate registration discount: 5% Off",
          "Standard exhibition booth: Priority 2",
          "Logo on backdrop & printed materials: Size 2",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: No",
          "Standee at hall entrance: No",
          "Product promotion posts on Web/Page: 1 post",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      },
      {
        "id": "standard",
        "name": "Tiêu Chuẩn",
        "nameEn": "Standard Partner",
        "fee": 50000000,
        "color": "#64748b",
        "benefits": [
          "Không có vé tham dự Gala",
          "Không có vé tham dự tiệc Chào mừng",
          "Giá sử dụng phòng Hand-on training (2h): Ưu đãi 30%",
          "Không có ưu đãi đăng ký đại biểu",
          "Gian hàng theo tiêu chuẩn: Cơ bản",
          "Logo trên backdrop và các ấn phẩm: Cỡ size 1",
          "Nêu tên cảm ơn trong suốt chương trình: Có",
          "Banner trên web hội: Không",
          "Standee trước cửa hội trường: Không",
          "Không có bài viết trên Web, page hội",
          "Giấy cảm ơn và quà lưu niệm: Có"
        ],
        "benefitsEn": [
          "No Gala tickets",
          "No Welcome Dinner tickets",
          "Hands-on training room use (2h): 30% Discount",
          "No delegate registration discount",
          "Standard exhibition booth: Basic",
          "Logo on backdrop & printed materials: Size 1",
          "Verbal thank-you announcement: Yes",
          "Society website banner advertisement: No",
          "Standee at hall entrance: No",
          "No product promotion posts on Web/Page",
          "Appreciation certificate & souvenir: Yes"
        ],
        "isActive": true
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed User Accounts (Tài khoản người dùng)
INSERT INTO public.user_accounts (id, name, email, role, status, last_active) VALUES
('usr-admin-1', 'ADMIN SYSTEM', 'admin@admin.com', 'admin', 'active', NULL),
('usr-1', 'GS.TS. Phạm Minh Chi', 'chi.pham@pars.org', 'admin', 'active', '2026-05-28 08:30:00+00'),
('usr-2', 'Đặng Thùy Dương', 'duong.dt@pars.org', 'btc', 'active', '2026-05-28 08:15:00+00'),
('usr-3', 'Trần Thế Minh', 'minh.tt@pars.org', 'ctv', 'active', '2026-05-27 17:40:00+00'),
('usr-4', 'Nguyễn Kiều Trang', 'trang.nk@pars.org', 'ctv', 'inactive', '2026-05-15 10:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Sponsors (Nhà tài trợ)
INSERT INTO public.sponsors (id, name, tier, pledged_amount, paid_amount, payment_status, contact_person, contact_email, contact_phone, benefits_signed, notes, contract_no, contract_sign_date, contract_value, contract_status, contract_file_name, contract_file_url) VALUES
('SPN-001', 'Tập đoàn Y khoa Medtronic Việt Nam', 'platinum', 500000000, 350000000, 'partially_paid', 'Nguyễn Minh Thư', 'minhthu.nguyen@medtronic.com', '0977889900', ARRAY['Sở hữu 2 Gian hàng triển lãm Gold Zone', 'In logo nổi bật trên Backdrop chính và tài liệu', 'Phát video quảng nghị 3 phút tại phiên Khai mạc', '10 Thẻ đại biểu VIP'], 'Phần còn lại sẽ được thanh toán trước ngày 15/09/2026 sau khi bàn giao thiết kế gian hàng.', 'HD-001/PARS/MEDTRONIC', '2026-04-12', 500000000, 'signed', 'HopDongTaitro_Medtronic_Signed.pdf', '#'),
('SPN-002', 'Công ty Cổ phần Boston Pharma', 'gold', 250000000, 250000000, 'fully_paid', 'Trần Văn Tiến', 'tientv@bostonpharma.com.vn', '0901239876', ARRAY['Sở hữu 1 Gian hàng tiêu chuẩn', 'In Logo trên Website & Kỷ yếu', '5 Thẻ đại biểu Standard'], 'Đã hoàn tất đối soát tài chính ngày 20/05/2026.', 'HD-002/PARS/BOSTON', '2026-05-05', 250000000, 'signed', 'HopDong_BostonPharma_HoanTat.pdf', '#'),
('SPN-003', 'Hãng Dược phẩm AstraZeneca Việt Nam', 'silver', 120000000, 0, 'unpaid', 'Phạm Thị Lan', 'lan.pham@astrazeneca.com', '0914565656', ARRAY['Logo trên tài liệu hội nghị', '2 Thẻ đại biểu Standard'], 'Đang làm thủ tục hợp đồng, kế hoạch chuyển khoản tháng 6.', 'HD-003/PARS/AZ', '2026-05-20', 120000000, 'pending_signature', 'HopDong_AstraZeneca_Draft.pdf', '#')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Notification Templates (Mẫu thông báo)
INSERT INTO public.notification_templates (id, name, type, channel, subject, content, status, zns_template_id, zns_type) VALUES
('tmpl-reg-email', 'Đăng Ký Đại Biểu Thành Công (Email)', 'registration_success', 'email', '🎯 Xác nhận đăng ký tham dự thành công Đại biểu Hội nghị PARS 2026', 'Kính gửi Quý đại biểu {{title}} {{fullname}},\n\nThay mặt Ban Tổ Chức Hội nghị Khoa học PARS 2026, chúng tôi xin trân trọng xác nhận Quý đại biểu đã hoàn tất đăng ký thông tin tham dự.\n\nTHÔNG TIN CHI TIẾT ĐĂNG KÝ VÀ SỬ DỤNG MÃ QR CHECK-IN:\n• Mã đại biểu: {{code}}\n• Họ và tên: {{fullname}}\n• Đơn vị công tác: {{organization}}\n• Gói đăng ký: {{package}}\n• Trạng thái thanh toán: {{payment_status}}\n\nQuý đại biểu vui lòng xuất trình Mã QR đính kèm trong thư này tại Quầy tiếp đón của hội nghị để nhận thẻ đeo chính thức nhanh chóng.\n\nMỌI CHI TIẾT XIN LIÊN HỆ:\n• Email: contact@parsevent.org\n• Hotline: 091-234-5678\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-reg-zalo', 'Đăng Ký Đại Biểu Thành Công (Zalo ZNS)', 'registration_success', 'zalo', NULL, '[PARS 2026] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Bạn đã đăng ký thành công tham dự Hội nghị Khoa học PARS 2026. \n- Gói: {{package}}\n- Mã Đại biểu: {{code}}\n- Trạng thái: {{payment_status}}\nVui lòng xuất trình QR đính kèm tại quầy check-in. Hotline hỗ trợ: 0912345678. Trân trọng cảm ơn!', 'approved', '298516', 'transaction'),
('tmpl-pay-zalo', 'Xác Nhận Đã Thanh Toán Lệ Phí (Zalo ZNS)', 'payment_confirmed', 'zalo', NULL, '[PARS 2026] XÁC NHẬN HOÀN TẤT THANH TOÁN\nKính gửi {{title}} {{fullname}}. Ban Tổ Chức đã tiếp nhận đóng góp lệ phí trị giá {{package_fee}} VNĐ cho Gói: {{package}}. Sắp xếp check-in của bạn đã được ưu tiên hoàn tất.', 'pending', '304521', 'transaction'),
('tmpl-remind-zalo', 'Nhắc Nhở Lịch Trình Hội Nghị (Zalo ZNS)', 'reminder_event', 'zalo', NULL, '[PARS 2026] NHẮC NHỞ LỊCH TRÌNH THAM GIA\nKính gửi {{title}} {{fullname}}. Hội nghị sẽ chính thức khai mạc vào lúc 08:00 sáng mai tại Trung tâm Hội nghị Quốc tế. Hãy quét QR vé {{code}} để vào khán phòng.', 'rejected', '312894', 'promotion'),
('tmpl-speaker-email', 'Xác Nhận Đệ Trình Báo Cáo (Email)', 'abstract_approved', 'email', '📚 Thư xác nhận đăng ký báo cáo chuyên đề hội nghị PARS 2026', 'Kính gửi Báo cáo viên {{title}} {{fullname}},\n\nBan Tổ Chức xin chân thành cảm ơn Quý bác sĩ/nhà khoa học đã gửi đăng ký đề tài báo cáo tại PARS 2026.\n\n• Tên đề tài: {{presentation_title}}\n• Chuyên khoa/Chương trình: {{track}}\n• Trạng thái đệ trình: Đang thẩm định (Chờ phản biện phê duyệt chuyên môn)\n\nTài liệu đính kèm của Quý báo cáo viên đã được tải lên hệ thống an toàn. Lịch trình báo cáo thô sẽ được đồng bộ tự động sau khi Hội đồng Khoa học phê duyệt chính thức.\n\nXin trân trọng kính chúc sức khỏe và thành công!\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-reg-wa', 'Đăng Ký Đại Biểu Thành Công (WhatsApp)', 'registration_success', 'whatsapp', NULL, '[PARS 2026] ĐĂNG KÝ THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Bạn đã đăng ký thành công tham dự Hội nghị Khoa học PARS 2026.\n- Gói: {{package}}\n- Mã Đại biểu: {{code}}\n- Trạng thái: {{payment_status}}\nVui lòng quét mã QR vé để check-in. Trân trọng!', 'approved', 'pars_registration_success', 'transaction'),
('tmpl-speaker-wa', 'Nộp Bài Báo Cáo Thành Công (WhatsApp)', 'abstract_approved', 'whatsapp', NULL, '[PARS 2026] NỘP BÁO CÁO THÀNH CÔNG\nXin chào {{title}} {{fullname}}. Đề tài báo cáo "{{presentation_title}}" của bạn đã được ghi nhận trên hệ thống sự kiện. Trạng thái: Chờ phê duyệt.', 'approved', 'pars_speaker_success', 'transaction'),
('tmpl-speaker-approved', 'Duyệt Đề Tài Báo Cáo Thành Công (Email)', 'abstract_approved', 'email', '🎉 Thư mời báo cáo & xác nhận đề tài khoa học PARS 2026', 'Kính gửi Báo cáo viên {{title}} {{fullname}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin trân trọng thông báo: Báo cáo khoa học của Quý vị với đề tài:\n\n"{{presentation_title}}"\n\nthuộc chuyên khoa/chương trình: {{track}}\n\nĐã được Hội đồng Khoa học phê duyệt chính thức để trình bày tại hội nghị.\n\nXin trân trọng cảm ơn sự đóng góp của Quý vị cho thành công chung của Hội nghị PARS 2026!\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL),
('tmpl-sponsor-registered', 'Xác Nhận Đăng Ký Tài Trợ (Email)', 'sponsor_registered', 'email', '🤝 Xác nhận đăng ký tài trợ Hội nghị Khoa học PARS 2026', 'Kính gửi Đại diện {{organization}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin chân thành cảm ơn Quý đơn vị đã đăng ký đồng hành cùng hội nghị với tư cách là Nhà tài trợ.\n\nTHÔNG TIN ĐĂNG KÝ CHI TIẾT:\n• Đơn vị tài trợ: {{organization}}\n• Gói tài trợ: {{package}}\n• Giá trị tài trợ: {{package_fee}} VNĐ\n• Người liên hệ: {{fullname}}\n• Số điện thoại: {{phone}}\n• Email: {{email}}\n• Vị trí gian hàng mong muốn: {{booth_location}}\n\nHệ thống đã ghi nhận thông tin đăng ký của Quý đơn vị. Ban Tổ Chức sẽ liên hệ trong thời gian sớm nhất để hoàn tất thủ tục hợp đồng và bàn giao sơ đồ gian hàng.\n\nTrân trọng cảm ơn sự đồng hành của Quý đơn vị!\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL),
('tmpl-sponsor-paid', 'Xác Nhận Thanh Toán Tài Trợ (Email)', 'sponsor_paid', 'email', '🎯 Xác nhận hoàn tất đóng góp tài trợ PARS 2026', 'Kính gửi Đại diện {{organization}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin xác nhận đã tiếp nhận khoản đóng góp tài trợ từ Quý đơn vị:\n\n• Đơn vị tài trợ: {{organization}}\n• Gói tài trợ: {{package}}\n• Số tiền đã nộp: {{paid_amount}} VNĐ\n• Trạng thái đóng phí: {{payment_status}}\n\nBan Tổ Chức xin trân trọng cảm ơn sự ủng hộ và đồng hành quý báu của Quý đơn vị đối với sự thành công của Hội nghị PARS 2026.\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL),
('tmpl-sponsor-contract', 'Xác Nhận Ký Kết Hợp Đồng Tài Trợ (Email)', 'sponsor_contract', 'email', '📜 Xác nhận ký kết hợp đồng tài trợ PARS 2026', 'Kính gửi Đại diện {{organization}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin trân trọng xác nhận Hợp đồng tài trợ của Quý đơn vị đã được ký kết thành công:\n\n• Đơn vị tài trợ: {{organization}}\n• Gói tài trợ: {{package}}\n• Số hợp đồng: {{contract_no}}\n• Trạng thái hợp đồng: Đã ký kết (Signed)\n\nBản scan hợp đồng đã được lưu trữ an toàn trên hệ thống. Ban Tổ Chức sẽ tiến hành các bước chuẩn bị gian hàng triển lãm và in ấn logo của Quý đơn vị theo đúng điều khoản cam kết.\n\nTrân trọng cảm ơn Quý đơn vị!\nBan Tổ Chức Hội nghị Khoa học PARS 2026.', 'approved', NULL, NULL),
('tmpl-speaker-survey-email', 'Cảm ơn & Khảo sát (Báo cáo viên - Email)', 'thank_you_survey', 'email', '💖 Thư cảm ơn & Khảo sát ý kiến Báo cáo viên - Hội nghị PARS 2026', 'Kính gửi Quý báo cáo viên {{title}} {{fullname}},\n\nBan Tổ Chức Hội nghị Khoa học PARS 2026 xin trân trọng cảm ơn Quý vị đã tham gia và có bài trình bày xuất sắc tại hội nghị.\n\nSự đóng góp chuyên môn của Quý vị đã làm nên thành công rực rỡ của sự kiện năm nay.\n\nĐể tiếp tục cải thiện chất lượng tổ chức cho các kỳ hội nghị tiếp theo, kính mong Quý vị dành ít phút thực hiện khảo sát nhanh tại đường liên kết sau:\n👉 https://pars2026.com/survey-speaker?code={{code}}\n\nXin trân trọng cảm ơn và kính chúc Quý vị nhiều sức khỏe, thành công!\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-speaker-survey-zalo', 'Cảm ơn & Khảo sát (Báo cáo viên - Zalo)', 'thank_you_survey', 'zalo', NULL, '[PARS 2026] THƯ CẢM ƠN BÁO CÁO VIÊN\nXin chào {{title}} {{fullname}}. Ban Tổ Chức chân thành cảm ơn sự đóng góp quý báu của bạn tại hội nghị. Vui lòng làm khảo sát ý kiến tại: https://pars2026.com/survey-speaker?code={{code}}. Trân trọng!', 'approved', '321854', 'transaction'),
('tmpl-speaker-survey-whatsapp', 'Cảm ơn & Khảo sát (Báo cáo viên - WhatsApp)', 'thank_you_survey', 'whatsapp', NULL, '[PARS 2026] THƯ CẢM ƠN BÁO CÁO VIÊN\nXin chào {{title}} {{fullname}}. Ban Tổ Chức chân thành cảm ơn sự đóng góp quý báu của bạn tại hội nghị. Vui lòng làm khảo sát ý kiến tại: https://pars2026.com/survey-speaker?code={{code}}. Trân trọng!', 'approved', 'pars_speaker_survey', 'transaction'),
('tmpl-attendee-survey-email', 'Cảm ơn & Khảo sát (Đại biểu - Email)', 'thank_you_survey', 'email', '💖 Thư cảm ơn & Khảo sát ý kiến Đại biểu tham dự - Hội nghị PARS 2026', 'Kính gửi Quý đại biểu {{title}} {{fullname}},\n\nBan Tổ Chức Hội nghị Khoa học PARS 2026 xin trân trọng cảm ơn Quý đại biểu đã dành thời gian tham dự hội nghị.\n\nĐể tiếp tục nâng cao chất lượng dịch vụ và nội dung chuyên môn cho các kỳ hội nghị sau, kính mong Quý đại biểu dành ít phút đóng góp ý kiến thông qua khảo sát nhanh dưới đây:\n👉 https://pars2026.com/survey-delegate?code={{code}}\n\nTrân trọng cảm ơn và hẹn gặp lại Quý đại biểu tại các sự kiện tiếp theo!\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-attendee-survey-zalo', 'Cảm ơn & Khảo sát (Đại biểu - Zalo)', 'thank_you_survey', 'zalo', NULL, '[PARS 2026] THƯ CẢM ƠN ĐẠI BIỂU\nXin chào {{title}} {{fullname}}. Ban Tổ Chức chân thành cảm ơn bạn đã tham gia hội nghị PARS 2026. Vui lòng thực hiện khảo sát đóng góp ý kiến tại: https://pars2026.com/survey-delegate?code={{code}}. Trân trọng!', 'approved', '321855', 'transaction'),
('tmpl-attendee-survey-whatsapp', 'Cảm ơn & Khảo sát (Đại biểu - WhatsApp)', 'thank_you_survey', 'whatsapp', NULL, '[PARS 2026] THƯ CẢM ƠN ĐẠI BIỂU\nXin chào {{title}} {{fullname}}. Ban Tổ Chức chân thành cảm ơn bạn đã tham gia hội nghị PARS 2026. Vui lòng thực hiện khảo sát đóng góp ý kiến tại: https://pars2026.com/survey-delegate?code={{code}}. Trân trọng!', 'approved', 'pars_delegate_survey', 'transaction'),
('tmpl-sponsor-survey-email', 'Cảm ơn & Khảo sát (Nhà tài trợ - Email)', 'thank_you_survey', 'email', '💖 Thư cảm ơn & Khảo sát ý kiến Nhà tài trợ - Hội nghị PARS 2026', 'Kính gửi Ban lãnh đạo & Quý đơn vị {{organization}},\n\nBan Tổ Chức Hội nghị Khoa học Thường niên PARS 2026 xin trân trọng gửi lời cảm ơn sâu sắc nhất đến Quý đơn vị đã đồng hành tài trợ và đóng góp to lớn vào sự thành công rực rỡ của hội nghị.\n\nSự hiện diện của gian hàng và các hoạt động của Quý đơn vị tại sự kiện đã nhận được sự quan tâm lớn từ các đại biểu.\n\nNhằm cải thiện tốt hơn các quyền lợi và quy trình phối hợp cho nhà tài trợ trong các sự kiện tiếp theo, kính mong Quý đơn vị đóng góp ý kiến qua khảo sát nhanh tại đường dẫn:\n👉 https://pars2026.com/survey-sponsor?id={{code}}\n\nTrân trọng kính chúc Quý công ty ngày càng phát triển thịnh vượng!\n\nTrân trọng,\nBan Tổ Chức Hội nghị Khoa học PARS 2026', 'approved', NULL, NULL),
('tmpl-sponsor-survey-zalo', 'Cảm ơn & Khảo sát (Nhà tài trợ - Zalo)', 'thank_you_survey', 'zalo', NULL, '[PARS 2026] THƯ CẢM ƠN NHÀ TÀI TRỢ\nKính gửi Quý đối tác {{organization}}. Ban Tổ Chức chân thành cảm ơn Quý đơn vị đã đồng hành tài trợ tại PARS 2026. Vui lòng làm khảo sát phản hồi tại: https://pars2026.com/survey-sponsor. Trân trọng!', 'approved', '321856', 'transaction'),
('tmpl-sponsor-survey-whatsapp', 'Cảm ơn & Khảo sát (Nhà tài trợ - WhatsApp)', 'thank_you_survey', 'whatsapp', NULL, '[PARS 2026] THƯ CẢM ƠN NHÀ TÀI TRỢ\nKính gửi Quý đối tác {{organization}}. Ban Tổ Chức chân thành cảm ơn Quý đơn vị đã đồng hành tài trợ tại PARS 2026. Vui lòng làm khảo sát phản hồi tại: https://pars2026.com/survey-sponsor. Trân trọng!', 'approved', 'pars_sponsor_survey', 'transaction')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed System Config (Cấu hình Zalo, Email mặc định)
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

-- 8. Seed Embed Scripts (Mã nhúng)
INSERT INTO public.embed_scripts (id, name, target_type, code, is_active, notes, created_at) VALUES
('emb-wp-delegate', 'Form Đăng ký Đại biểu WordPress Banner', 'delegate', '<iframe src="https://parsevent.org/embed?view=register-delegate" title="PARS Delegate Form" width="100%" height="950px" style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" scrolling="yes" loading="lazy"></iframe>', true, 'Đặt khối Custom HTML bọc ngoài widget WP của trang chủ', '2026-06-03 09:12:00'),
('emb-wp-speaker', 'Form Nộp Báo Cáo Viên Sidebar', 'speaker', '<iframe src="https://parsevent.org/embed?view=register-speaker" title="PARS Speaker Submission" width="100%" height="1100px" style="border: none; border-radius: 12px;" scrolling="yes" loading="lazy"></iframe>', true, 'Nhúng vào trang Tin tức / Thư báo cho báo cáo viên', '2026-06-03 10:00:00'),
('emb-tracking-ga4', 'Google Analytics 4 Tracking Code', 'analytics', '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-PARS2026"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(''js'', new Date());\n  gtag(''config'', ''G-PARS2026'');\n</script>', false, 'Chèn vào thẻ <head> của toàn bộ trang đăng ký', '2026-06-03 11:24:00')
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Internal Tasks (Công việc nội bộ)
INSERT INTO public.internal_tasks (id, title, description, assigned_to_name, assigned_to_id, priority, status, deadline, progress) VALUES
('TSK-001', 'Gửi thư mời xác nhận báo cáo đến PGS.TS. Trần Quốc Bảo', 'Xác nhận thời gian trình bày, gửi hướng dẫn chuẩn bị slide thuyết trình theo mẫu PARS2026.', 'Đặng Thùy Dương', 'usr-2', 'high', 'done', '2026-05-20', 100),
('TSK-002', 'Đối soát các khoản chuyển khoản đăng ký đại biểu còn treo', 'Kiểm tra sao kê ngân hàng đối chiếu với các đại biểu trạng thái "pending_verification" như BS. Nguyễn Thành Nam và phê duyệt cho họ.', 'Trần Thế Minh', 'usr-3', 'high', 'in_progress', '2026-05-30', 40),
('TSK-003', 'Kiểm tra mặt bằng sơ đồ gian hàng triển lãm tài trợ', 'Liên hệ với trung tâm hội nghị khép kín danh sách vị trí gian hàng triển lãm cho Medtronic và Boston Pharma.', 'Trần Thế Minh', 'usr-3', 'medium', 'todo', '2026-06-15', 0),
('TSK-004', 'Thiết kế Backdrop & Thẻ đại biểu tích hợp mã QR', 'Thống nhất layout màu chủ đạo xanh ngọc và đen, kích thước thẻ 10x15cm, có dây treo màu xanh đồng bộ.', 'Đặng Thùy Dương', 'usr-2', 'medium', 'todo', '2026-06-20', 10)
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Sessions (Lịch trình sự kiện)
INSERT INTO public.sessions (id, title, speaker_name, speaker_title, room_name, date, start_time, end_time, track, description) VALUES
('SES-101', 'Đăng ký & Check-in Đại biểu', 'Ban Thư Ký', 'Ban Tổ Chức', 'Bàn check in', '2026-12-11', '07:30', '09:00', 'Check-in', 'Đại biểu và báo cáo viên hoàn thiện thủ tục, quét QR nhận thẻ đeo chính thức, tài liệu đại học.'),
('SES-102', 'Live Surgery - Phiên phẫu thuật trực tiếp lâm sàng', 'Hội đồng chuyên gia phẫu thuật', 'Phẫu thuật viên danh tiếng', 'Hội trường 1', '2026-12-11', '09:00', '12:00', 'Live Surgery', 'Trình diễn kỹ thuật mổ trực tiếp từ phòng mổ tiêu chuẩn quốc tế truyền hình về hội trường.'),
('SES-103', 'Hands-on Session: Đào tạo thực hành tại chỗ nâng cao', 'Chuyên gia chuyển giao', 'Cố vấn chuyên môn hàng đầu', 'Hội trường 2', '2026-12-11', '09:00', '12:00', 'Hands-on', 'Cầm tay chỉ việc, truyền đạt thủ thuật chuyên nghiệp trên mô hình giả lập và thiết bị tiên tiến.'),
('SES-104', 'Hands-on Session: Thực hành công nghệ thẩm mỹ lâm sàng', 'Chuyên gia thương hiệu', 'Bác sĩ chuyển giao công nghệ', 'Hội trường 3', '2026-12-11', '09:00', '12:00', 'Hands-on', 'Hướng dẫn thực hành kỹ năng sử dụng chỉ thẩm mỹ, tiêm chất làm đầy chất lượng cao.'),
('SES-105', 'Hands-on Session: Trải nghiệm thiết bị năng lượng nguồn laser', 'Đội ngũ kỹ thuật viên y tế', 'Chuyên gia lâm sàng', 'Hội trường 4', '2026-12-11', '09:00', '12:00', 'Hands-on', 'Sử dụng hệ thống laser tân tiến, thiết bị RF và tối ưu tham số an toàn trong thẩm mỹ da.'),
('SES-106', 'Nghỉ trưa, dùng bữa & Tham quan triển lãm thiết bị y tế', 'Toàn thể Đại biểu', 'Khách mời tự do', 'Ăn trưa và tham quan triển lãm', '2026-12-11', '12:00', '13:30', 'Nghỉ giải lao / Bữa trưa', 'Thưởng thức ẩm thực cao cấp và giao lưu trao đổi bên các gian hàng triển lãm của đối tác.'),
('SES-107', 'Live Surgery - Phiên phẫu thuật trực tiếp lâm sàng 2', 'Ban điều hành chuyên khoa', 'Hội đồng phẫu thuật', 'Hội trường 1', '2026-12-11', '13:30', '15:00', 'Live Surgery', 'Chuyển giao và hướng dẫn kỹ năng phẫu thuật nâng cao trực diện qua màn hình chuyên dụng độ phân giải cao.'),
('SES-108', 'Họp trù bị Ban Chấp hành Hội PARS', 'Ban Chấp hành Tổng hội', 'Thành viên BCH PARS', 'Hội trường 2', '2026-12-11', '13:30', '15:00', 'Họp trù bị', 'Quán triệt định hướng, nội dung và phê chuẩn văn kiện chuẩn bị Đại hội đại biểu chính thức.'),
('SES-109', 'Hands-on Session: Thực nghiệm kỹ thuật trẻ hóa công nghệ cao', 'Báo cáo viên chuyên đề', 'Cố vấn chuyên môn', 'Hội trường 3', '2026-12-11', '13:30', '15:00', 'Hands-on', 'Trải thực hành trên mô hình các liệu pháp nâng cơ, trẻ hóa đa tầng phối hợp.'),
('SES-110', 'Hands-on Session: Phân tích kỹ thuật phục hồi & tạo hình nâng cao', 'Kỹ thuật viên đối tác', 'Bác sĩ cố vấn', 'Hội trường 4', '2026-12-11', '13:30', '15:00', 'Hands-on', 'Phương pháp bảo dưỡng chỉ khâu thẩm mỹ và nâng tầm kỹ thuật thao tác lâm sàng.'),
('SES-111', 'Nghỉ Giải Lao & Tiệc Trà chiều Teabreak', 'Hội đồng tiếp tân', 'Ban hậu cần', 'Hành lang sảnh chính', '2026-12-11', '15:00', '15:15', 'Teabreak', 'Thưởng thức cà phê, trà bánh thượng hạng trước phiên họp đại hội lớn.'),
('SES-112', 'ĐẠI HỘI PARS NHIỆM KỲ 3 CHÍNH THỨC', 'Đoàn Chủ Tịch Hội Nghiệp', 'Ban điều hành PARS', 'Hội trường 1', '2026-12-11', '15:15', '17:00', 'Đại hội', 'Đại hội chính thức nhiệm kỳ III kết hợp tổng kết chặng đường phát triển và bầu cử nhân sự khoá mới.'),
('SES-113', 'MASTER CLASS: Kỹ thuật nâng cao cấu trúc Phẫu thuật Tạo hình', 'Chủ tọa lớp học', 'Giáo sư đào tạo y khoa liên tục', 'Hội trường 2', '2026-12-11', '17:00', '18:00', 'Master Class', 'Phiên giảng dạy chuyên sâu bởi các bậc thầy đầu ngành, chuyển giao tinh hoa phẫu thuật.'),
('SES-114', 'MASTER CLASS: Thiết kế bồi hoàn thẩm mỹ khuôn mặt', 'Chuyên gia Quốc tế', 'Khách mời Thượng đỉnh', 'Hội trường 3', '2026-12-11', '17:00', '18:00', 'Master Class', 'Phân tích nhân trắc học kết hợp thực nghiệp can thiệp trẻ hóa nâng cao toàn diện khuôn mặt.'),
('SES-115', 'MASTER CLASS: Tái tạo cấu trúc ngực vầng sau biến chứng y khoa', 'Chủ tọa & Chuyên gia', 'Khách mời danh dự', 'Hội trường 4', '2026-12-11', '17:00', '18:00', 'Master Class', 'Chia sẻ độc quyền các phác đồ tháo gỡ biến chứng co thắt và tái cấu trúc ngực.'),
('SES-116', 'Welcome Dinner - Tiệc tối chào đón Đại biểu tham dự', 'Ban Tổ Chức PARS', 'Tổng hội hân hoan đón rước', 'New World SaiGon', '2026-12-11', '19:00', '21:00', 'Welcome Dinner', 'Gặp gỡ, giao lưu thân mật khởi động chuỗi ngày hội nghị khoa học đầy bổ ích.'),
('SES-201', 'Đăng ký & Check-in Đại biểu ngày thứ hai', 'Ban Thư Ký tiếp đón', 'Hậu cần sự kiện', 'Bàn check in', '2026-12-12', '07:30', '08:30', 'Check-in', 'Hỗ trợ đón tiếp đại biểu phương xa, giao thẻ đại biểu thạc cứu thông báo.'),
('SES-202', 'Khai mạc Đại Hội Nghị Khoa học Thường niên PARS 2026', 'PGS.TS.BS. Lê Hành & Lãnh đạo', 'Chủ tịch Hội PARS', 'Hội trường 1', '2026-12-12', '08:30', '09:45', 'Khai mạc', 'Phát biểu chỉ đạo, tôn vinh đại biểu xuất sắc, chào đón khách mời trung ương, quốc tế.'),
('SES-203', 'Nghỉ giải lao & Tiệc Trà Teabreak sáng', 'Ban Hậu cần', 'Sự tiếp đón tận nhà', 'Hành lang hội nghị', '2026-12-12', '09:45', '10:00', 'Teabreak', 'Tiệc trà nghỉ giải lao chuẩn phong cách quốc tế kết nối nhanh.'),
('SES-204', 'Phiên 1: Xu hướng mới trong Phẫu thuật Tạo hình & Thẩm mỹ', 'Hội đồng Giáo sư đầu ngành', '4-5 Bài báo cáo học thuyết trình nghị', 'Hội trường 1', '2026-12-12', '10:00', '11:15', 'Hội nghị', 'Gồm 4-5 chuyên gia đầu ngành thuyết minh về viễn cảnh bùng nổ chuyển giao phẫu thuật tạo hình.'),
('SES-205', 'Phiên 2: Phẫu thuật Sọ – Mặt chuyên sâu nâng cao', 'PGS.TS. Nhà khoa học uy tú', 'Chuyên đề học thuyết 4-5 báo cáo viên', 'Hội trường 2', '2026-12-12', '10:00', '11:15', 'Hội nghị', 'Loạt 4-5 bài thuyết giảng về chỉnh hình dị tật bẩm sinh vùng sọ mặt phức tạp.'),
('SES-225', 'Gala Dinner - Đêm tiệc vinh danh tinh hoa gắn kết tình hữu hữu', 'Ban Trị Sự PARS 2026', 'Giao kết đại dã ngoại hữu nghị', 'BV quân y 175', '2026-12-12', '19:00', '21:00', 'Gala Dinner', 'Đêm hội tinh hoa tôn vinh, thưởng lãm nghệ thuật sang trọng thắt chặt tình kết nối hữu hảo.')
ON CONFLICT (id) DO NOTHING;

-- 11. Seed Speakers (Báo cáo viên)
INSERT INTO public.speakers (id, title, full_name, organization, department, phone, email, bio, presentation_title, presentation_track, abstract_text, document_name, document_url, calendar_synced, status, scheduled_session_id, registration_date) VALUES
('SPK-001', 'PGS.TS.', 'Trần Quốc Bảo', 'Bệnh viện Trung ương Quân đội 108', 'Ngoại lồng ngực', '0903334444', 'bao.tq@108hospital.vn', 'Trưởng khoa Ngoại Lồng ngực Bệnh viện 108. Có hơn 20 năm kinh nghiệm phẫu thuật tim mạch lồng ngực, viết hơn 30 bài báo quốc tế.', 'Phẫu thuật Robot điều trị u trung thất trước: Kinh nghiệm ban đầu tại Việt Nam', 'Ngoại Lồng Ngực & Tim Mạch', 'Bài báo cáo trình bày tóm tắt kết quả của 45 trường hợp phẫu thuật cắt bỏ u trung thất bằng robot tại bệnh viện Trung ương Quân đội 108 từ năm 2024 đến nay. Kết quả cho thấy tỷ lệ tai biến thấp, thời gian nằm viện trung bình là 3.2 ngày, phục hồi nhanh hơn đáng kể so với mổ nội soi thông thường hoặc mổ hở...', 'Abstract_PhauThuatRobot_TranQuocBao.pdf', '#', true, 'approved', NULL, '2026-05-12 00:00:00+00'),
('SPK-002', 'PGS.TS.BS.', 'Lê Hoàng Mỹ', 'Đại học Y Dược TP.HCM', 'Thần kinh học', '0912123567', 'my.lh@ump.edu.vn', 'Giảng viên cao cấp bộ môn Thần Kinh Đại học Y Dược TP.HCM, đồng thời là Giám đốc Trung tâm Sa sút trí tuệ.', 'Cập nhật liệu pháp kháng thể đơn dòng trong điều trị bệnh Alzheimer giai đoạn sớm', 'Thần Kinh Học', 'Alzheimer là một gánh nặng bệnh tật ngày càng gia tăng. Trong nghiên cứu này chúng tôi đánh giá tính hiệu quả và an toàn của các loại kháng thể đơn dòng mới được FDA phê duyệt trong năm 2025-2026. Tổng lược lâm sàng, tỷ lệ phản ứng phụ sưng não (ARIA) và hướng tiếp cận tối ưu cho bệnh nhân Việt Nam.', 'Alzheimer_Update_LeHoangMy.pdf', '#', false, 'pending', NULL, '2026-05-25 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Attendees (Đại biểu)
INSERT INTO public.attendees (id, title, full_name, organization, department, phone, email, address, nationality, package_id, package_name, package_fee, payment_status, payment_method, registration_date, qr_code_value, is_checked_in, check_in_time, notes) VALUES
('ATT-001', 'GS.TS.', 'Hoàng Văn Minh', 'Trường Đại học Y Hà Nội', 'Y tế Công cộng', '0912345678', 'minh.hv@hmu.edu.vn', '8 Tôn Thất Tùng, Đống Đa, Hà Nội', 'vietname', 'pkg-vip', 'Gói Đại Biểu VIP', 3000000, 'paid', 'bank_transfer', '2026-05-10', 'PARS2026-ATT-001-MINH', true, '2026-05-28 08:05', 'Khách mời danh dự'),
('ATT-002', 'ThS.BS.', 'Lê Thị Thu Hương', 'Bệnh viện Bạch Mai', 'Tim mạch', '0981122334', 'huong.le@bachmai.org', '78 Giải Phóng, Đống Đa, Hà Nội', 'vietname', 'pkg-standard', 'Gói Đại Biểu Tiêu Chuẩn', 1500000, 'paid', 'credit_card', '2026-05-14', 'PARS2026-ATT-002-HUONG', false, NULL, 'Cần cấp chứng nhận CME'),
('ATT-003', 'BS.', 'Nguyễn Thành Nam', 'Bệnh viện Chợ Rẫy', 'Chấn thương chỉnh hình', '0908765432', 'nam.nt@choray.org.vn', '201B Nguyễn Chí Thanh, Quận 5, TP.HCM', 'vietname', 'pkg-standard', 'Gói Đại Biểu Tiêu Chuẩn', 1500000, 'pending_verification', 'bank_transfer', '2026-05-27', 'PARS2026-ATT-003-NAM', false, NULL, NULL),
('ATT-004', 'Dr.', 'Alena Smirnova', 'National University Hospital', 'Neurology', '+6582310492', 'alena.sm@nuh.edu.sg', '5 Lower Kent Ridge Rd, Singapore', 'foreign', 'pkg-vip', 'Gói Đại Biểu VIP', 3000000, 'unpaid', 'credit_card', '2026-05-26', 'PARS2026-ATT-004-ALENA', false, NULL, 'Yêu cầu phòng đơn tại khách sạn liên kết')
ON CONFLICT (id) DO NOTHING;

-- 13. Seed Finance Transactions (Thu chi tài chính)
INSERT INTO public.finance_transactions (id, date, type, category, amount, description, reference_id, payment_method, verified_by, is_verified) VALUES
('TXN-001', '2026-05-10 10:15', 'income', 'Gói đại biểu', 3000000, 'Phí đăng ký Gói VIP đại biểu Hoàng Văn Minh', 'ATT-001', 'Chuyển khoản Vietcombank', 'GS.TS. Phạm Minh Chi', true),
('TXN-002', '2026-05-14 14:30', 'income', 'Gói đại biểu', 1500000, 'Phí đăng ký Gói Tiêu chuẩn đại biểu Lê Thị Thu Hương', 'ATT-002', 'Cổng thanh toán thẻ', 'Độc lập (Tự động)', true),
('TXN-003', '2026-05-20 09:00', 'income', 'Nhà tài trợ', 250000000, 'Thanh toán đợt 1 tài trợ Boston Pharma VN', 'SPN-002', 'Chuyển khoản BIDV', 'Đặng Thùy Dương', true),
('TXN-004', '2026-05-22 16:45', 'income', 'Nhà tài trợ', 350000000, 'Ký quỹ đợt 1 tài trợ Platinum Medtronic VN', 'SPN-001', 'Chuyển khoản Vietcombank', 'Đặng Thùy Dương', true),
('TXN-005', '2026-05-25 11:20', 'expense', 'Khách sạn & Địa điểm', 50000000, 'Đặt cọc sảnh tổ chức tiệc Gala Dinner Khách sạn REX', NULL, 'Chuyển khoản Vietcombank', 'GS.TS. Phạm Minh Chi', true),
('TXN-006', '2026-05-27 15:30', 'expense', 'In ấn & Marketing', 12500000, 'Thanh toán tiền in 500 tập Kỷ yếu tóm tắt đợt 1', NULL, 'Chuyển khoản BIDV', 'Đặng Thùy Dương', false)
ON CONFLICT (id) DO NOTHING;