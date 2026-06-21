-- ============================================================
-- PARS 2026 — MARKETING SỰ KIỆN
-- SQL Migration Script
-- Chạy trong Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================
-- ⚠️  HƯỚNG DẪN CHẠY:
--   1. Vào Supabase Dashboard → SQL Editor → New query
--   2. Copy toàn bộ nội dung file này → Paste → Run
--   3. Kiểm tra kết quả ở tab Results bên dưới
--   4. Script dùng IF NOT EXISTS / ON CONFLICT DO NOTHING — an toàn khi chạy lại
-- ============================================================

-- ============================================================
-- PHẦN 1: CẬP NHẬT BẢNG marketing_posts
-- Tạo mới nếu chưa có, thêm cột còn thiếu nếu đã có
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    content         TEXT,
    type            TEXT NOT NULL DEFAULT 'news_feed',
    platforms       TEXT[],
    status          TEXT NOT NULL DEFAULT 'draft',
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    published_at    TIMESTAMP WITH TIME ZONE,
    metrics         JSONB DEFAULT '{}'::jsonb,
    media_url       TEXT,
    video_script    TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thêm updated_at nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.marketing_posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Added: marketing_posts.updated_at';
    END IF;
END $$;

-- Thêm author_id nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE public.marketing_posts ADD COLUMN author_id TEXT;
        RAISE NOTICE 'Added: marketing_posts.author_id';
    END IF;
END $$;

-- Thêm author_name nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'author_name'
    ) THEN
        ALTER TABLE public.marketing_posts ADD COLUMN author_name TEXT;
        RAISE NOTICE 'Added: marketing_posts.author_name';
    END IF;
END $$;

-- Thêm tags (mảng hashtag)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.marketing_posts ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added: marketing_posts.tags';
    END IF;
END $$;

-- Thêm publish_result (response từ API mạng xã hội)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'publish_result'
    ) THEN
        ALTER TABLE public.marketing_posts ADD COLUMN publish_result JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added: marketing_posts.publish_result';
    END IF;
END $$;

-- Trigger tự động cập nhật updated_at
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

-- ============================================================
-- PHẦN 2: BẢNG marketing_media_assets
-- Lưu metadata file ảnh/video đã upload Supabase Storage
-- ============================================================
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
    uploaded_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- PHẦN 3: BẢNG marketing_scheduled_jobs
-- Hàng đợi lên lịch đăng bài tự động theo nền tảng
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_scheduled_jobs (
    id              TEXT PRIMARY KEY DEFAULT 'MSJ-' || upper(substr(gen_random_uuid()::text, 1, 9)),
    post_id         TEXT NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL,
    scheduled_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    attempt_count   INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    api_response    JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT msj_platform_check CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),
    CONSTRAINT msj_status_check   CHECK (status IN ('pending', 'processing', 'done', 'failed'))
);

-- ============================================================
-- PHẦN 4: INDEXES HIỆU NĂNG
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_marketing_posts_status       ON public.marketing_posts (status);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_type         ON public.marketing_posts (type);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_scheduled_at ON public.marketing_posts (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_posts_created_at   ON public.marketing_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msj_post_id                  ON public.marketing_scheduled_jobs (post_id);
CREATE INDEX IF NOT EXISTS idx_msj_status_scheduled         ON public.marketing_scheduled_jobs (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mma_post_id                  ON public.marketing_media_assets (post_id) WHERE post_id IS NOT NULL;

-- ============================================================
-- PHẦN 5: ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.marketing_media_assets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- marketing_posts (nếu chưa có policy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'marketing_posts' AND policyname = 'Allow public read marketing_posts'
    ) THEN
        CREATE POLICY "Allow public read marketing_posts" ON public.marketing_posts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'marketing_posts' AND policyname = 'Allow authenticated manage marketing_posts'
    ) THEN
        CREATE POLICY "Allow authenticated manage marketing_posts" ON public.marketing_posts TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- marketing_media_assets
DROP POLICY IF EXISTS "Public read marketing_media_assets"         ON public.marketing_media_assets;
CREATE POLICY "Public read marketing_media_assets"
    ON public.marketing_media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated manage marketing_media_assets" ON public.marketing_media_assets;
CREATE POLICY "Authenticated manage marketing_media_assets"
    ON public.marketing_media_assets TO authenticated USING (true) WITH CHECK (true);

-- marketing_scheduled_jobs
DROP POLICY IF EXISTS "Public read marketing_scheduled_jobs"         ON public.marketing_scheduled_jobs;
CREATE POLICY "Public read marketing_scheduled_jobs"
    ON public.marketing_scheduled_jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated manage marketing_scheduled_jobs" ON public.marketing_scheduled_jobs;
CREATE POLICY "Authenticated manage marketing_scheduled_jobs"
    ON public.marketing_scheduled_jobs TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PHẦN 6: REALTIME SUBSCRIPTION
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'marketing_posts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_posts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'marketing_media_assets') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_media_assets;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'marketing_scheduled_jobs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_scheduled_jobs;
    END IF;
END $$;

-- ============================================================
-- PHẦN 7: SUPABASE STORAGE — BUCKET 'assets'
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets', 'assets', true,
    524288000,  -- 500 MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS
DROP POLICY IF EXISTS "Public read assets bucket"           ON storage.objects;
CREATE POLICY "Public read assets bucket"
    ON storage.objects FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Authenticated upload to assets"     ON storage.objects;
CREATE POLICY "Authenticated upload to assets"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Authenticated delete from assets"   ON storage.objects;
CREATE POLICY "Authenticated delete from assets"
    ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Anon upload marketing folder"       ON storage.objects;
CREATE POLICY "Anon upload marketing folder"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'marketing');

-- ============================================================
-- PHẦN 8: SEED — CẤU HÌNH KÊNH MARKETING
-- ============================================================
INSERT INTO public.system_config (key, value)
VALUES (
    'marketing_channels_config',
    '{
        "facebook": { "appId": "", "pageId": "", "pageAccessToken": "", "pageName": "", "isConfigured": false },
        "zalo":     { "appId": "", "secretKey": "", "oaId": "", "accessToken": "", "oaName": "", "isConfigured": false },
        "tiktok":   { "clientKey": "", "clientSecret": "", "accessToken": "", "accountName": "", "isConfigured": false },
        "youtube":  { "clientId": "", "clientSecret": "", "accessToken": "", "channelName": "", "isConfigured": false }
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PHẦN 9: SEED — BÀI ĐĂNG MẪU (tuỳ chọn)
-- ============================================================
INSERT INTO public.marketing_posts (id, title, content, type, platforms, status, video_script, created_at, updated_at)
VALUES
(
    'MP-SEED-001',
    '📢 PARS 2026 – Hội nghị Khoa học Thẩm mỹ chính thức khai mạc',
    E'Kính gửi quý Bác sĩ và đồng nghiệp,\n\nHội nghị Khoa học Thẩm mỹ thường niên PARS 2026 chính thức khai mạc tại Hà Nội ngày 14-15/11/2026.\n\n✨ ĐIỂM NHẤN:\n• 80+ báo cáo khoa học chuyên sâu\n• Cadaver Lab thực hành trực tiếp\n• Gala Dinner & Triển lãm thiết bị\n\nĐăng ký: https://pars2026.vercel.app/register-delegate',
    'news_feed',
    ARRAY['facebook', 'zalo'],
    'draft',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),
(
    'MP-SEED-002',
    'Kịch bản Shorts: 3 lý do không thể bỏ lỡ PARS 2026',
    NULL,
    'video_short',
    ARRAY['tiktok', 'youtube'],
    'draft',
    E'❓ [0-5s] Bạn có biết hội nghị thẩm mỹ nào quy tụ hơn 500 bác sĩ hàng đầu Việt Nam?\n\n🔬 [5-45s] PARS 2026 — 80 báo cáo lâm sàng, Cadaver Lab thực chiến, Gala Dinner kết nối chuyên gia.\n\n👉 [45-60s] Link đăng ký ở bio kênh — Early Bird giảm 20%!',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PHẦN 10: HÀM TỰ ĐỘNG — fn_auto_publish_scheduled_posts()
-- Gọi qua pg_cron hoặc Edge Function mỗi 5 phút
-- ============================================================
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

-- ============================================================
-- PHẦN 11: VIEW THỐNG KÊ MARKETING
-- ============================================================
CREATE OR REPLACE VIEW public.vw_marketing_stats AS
SELECT
    COUNT(*)                                                      AS total_posts,
    COUNT(*) FILTER (WHERE status = 'published')                 AS published_count,
    COUNT(*) FILTER (WHERE status = 'scheduled')                 AS scheduled_count,
    COUNT(*) FILTER (WHERE status = 'draft')                     AS draft_count,
    COUNT(*) FILTER (WHERE type   = 'news_feed')                 AS news_feed_count,
    COUNT(*) FILTER (WHERE type   = 'video_short')               AS video_short_count,
    COALESCE(SUM((metrics->>'reach')::BIGINT),   0)              AS total_reach,
    COALESCE(SUM((metrics->>'likes')::BIGINT),   0)              AS total_likes,
    COALESCE(SUM((metrics->>'shares')::BIGINT),  0)              AS total_shares,
    COALESCE(SUM((metrics->>'views')::BIGINT),   0)              AS total_video_views,
    MAX(published_at)                                             AS last_published_at
FROM public.marketing_posts;

-- ============================================================
-- KIỂM TRA KẾT QUẢ — Chạy sau khi migration xong
-- ============================================================
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('marketing_posts', 'marketing_media_assets', 'marketing_scheduled_jobs')
ORDER BY table_name;
