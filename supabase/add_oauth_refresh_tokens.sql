-- ============================================================
-- PARS 2026 — LƯU REFRESH TOKEN MẠNG XÃ HỘI
-- SQL Script: add_oauth_refresh_tokens.sql
--
-- Mục đích:
--   Tạo bảng chuyên dụng marketing_oauth_tokens để lưu trữ
--   Access Token + Refresh Token cho Facebook, Zalo, TikTok, YouTube
--   một cách an toàn, có kiểm soát hạn sử dụng.
--
-- Cách chạy:
--   Supabase Dashboard → SQL Editor → New query → Paste → Run
--   Script dùng IF NOT EXISTS / ON CONFLICT → an toàn khi chạy lại
-- ============================================================


-- ============================================================
-- PHẦN 1: BẢNG marketing_oauth_tokens
-- Lưu token OAuth từng nền tảng mạng xã hội
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_oauth_tokens (
    id              SERIAL PRIMARY KEY,

    -- Nền tảng mạng xã hội
    platform        TEXT NOT NULL UNIQUE,
    -- Giá trị hợp lệ: 'facebook' | 'zalo' | 'tiktok' | 'youtube'
    CONSTRAINT oauth_platform_check
        CHECK (platform IN ('facebook', 'zalo', 'tiktok', 'youtube')),

    -- Access Token (dùng để gọi API trực tiếp)
    access_token    TEXT,

    -- Refresh Token (dùng để lấy Access Token mới khi hết hạn)
    refresh_token   TEXT,

    -- Thời điểm Access Token hết hạn (UTC)
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Thời điểm Refresh Token hết hạn (UTC, NULL = vĩnh viễn)
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Thông tin bổ sung của tài khoản liên kết
    account_name    TEXT,          -- Tên Page / OA / Kênh
    account_id      TEXT,          -- Page ID / OA ID / Channel ID

    -- Trạng thái kết nối
    is_active       BOOLEAN NOT NULL DEFAULT false,

    -- Số lần tự động refresh token thành công
    refresh_count   INTEGER NOT NULL DEFAULT 0,

    -- Lần cuối cùng refresh token thành công
    last_refreshed_at TIMESTAMP WITH TIME ZONE,

    -- Lỗi cuối nếu refresh thất bại
    last_error      TEXT,

    -- Metadata thời gian
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.marketing_oauth_tokens IS
    'Lưu trữ OAuth Access Token và Refresh Token cho các kênh mạng xã hội Marketing PARS 2026';

COMMENT ON COLUMN public.marketing_oauth_tokens.token_expires_at IS
    'Thời điểm Access Token hết hạn: Zalo ~25h, TikTok ~24h, YouTube ~1h, Facebook ~60d';
COMMENT ON COLUMN public.marketing_oauth_tokens.refresh_token_expires_at IS
    'Thời điểm Refresh Token hết hạn: Zalo ~90d, TikTok ~365d, Google = NULL (vĩnh viễn)';


-- ============================================================
-- PHẦN 2: TRIGGER tự động cập nhật updated_at
-- ============================================================
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
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_oauth_tokens_updated_at();


-- ============================================================
-- PHẦN 3: INDEX hiệu năng
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform
    ON public.marketing_oauth_tokens (platform);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires
    ON public.marketing_oauth_tokens (token_expires_at)
    WHERE token_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_active
    ON public.marketing_oauth_tokens (is_active)
    WHERE is_active = true;


-- ============================================================
-- PHẦN 4: ROW LEVEL SECURITY (RLS)
-- Token OAuth là dữ liệu nhạy cảm — CHỈ authenticated mới đọc/ghi
-- ============================================================
ALTER TABLE public.marketing_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Chỉ authenticated user mới đọc được token
DROP POLICY IF EXISTS "Authenticated read oauth tokens" ON public.marketing_oauth_tokens;
CREATE POLICY "Authenticated read oauth tokens"
    ON public.marketing_oauth_tokens
    FOR SELECT
    TO authenticated
    USING (true);

-- Chỉ authenticated user mới ghi được token
DROP POLICY IF EXISTS "Authenticated manage oauth tokens" ON public.marketing_oauth_tokens;
CREATE POLICY "Authenticated manage oauth tokens"
    ON public.marketing_oauth_tokens
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ⚠️ KHÔNG có policy cho anon — token không được lộ ra ngoài


-- ============================================================
-- PHẦN 5: REALTIME SUBSCRIPTION
-- Frontend nhận cập nhật ngay khi token được refresh
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname   = 'supabase_realtime'
          AND tablename = 'marketing_oauth_tokens'
    ) THEN
        ALTER PUBLICATION supabase_realtime
            ADD TABLE public.marketing_oauth_tokens;
        RAISE NOTICE 'Added marketing_oauth_tokens to supabase_realtime';
    ELSE
        RAISE NOTICE 'marketing_oauth_tokens already in supabase_realtime — skipped.';
    END IF;
END $$;


-- ============================================================
-- PHẦN 6: SEED — Khởi tạo hàng cho 4 nền tảng
-- (Chèn mặc định, chưa có token, is_active = false)
-- ============================================================
INSERT INTO public.marketing_oauth_tokens
    (platform, access_token, refresh_token, token_expires_at, refresh_token_expires_at,
     account_name, account_id, is_active, refresh_count, created_at, updated_at)
VALUES
    -- Facebook (Long-lived token ~60 ngày, không có refresh_token thông thường)
    ('facebook', NULL, NULL, NULL, NULL,
     '', '', false, 0, NOW(), NOW()),

    -- Zalo OA (Access Token ~25 giờ, Refresh Token ~90 ngày)
    ('zalo', NULL, NULL, NULL,
     NOW() + INTERVAL '90 days',
     '', '', false, 0, NOW(), NOW()),

    -- TikTok (Access Token ~24 giờ, Refresh Token ~365 ngày)
    ('tiktok', NULL, NULL, NULL,
     NOW() + INTERVAL '365 days',
     '', '', false, 0, NOW(), NOW()),

    -- YouTube/Google (Access Token ~1 giờ, Refresh Token vĩnh viễn)
    ('youtube', NULL, NULL, NULL, NULL,
     '', '', false, 0, NOW(), NOW())

ON CONFLICT (platform) DO NOTHING;  -- Không ghi đè nếu đã có dữ liệu


-- ============================================================
-- PHẦN 7: CẬP NHẬT system_config — Thêm refreshToken vào marketing_channels_config
-- Dùng jsonb_set để merge mà không mất dữ liệu cũ
-- ============================================================

-- 7a. Facebook — thêm tokenExpiresAt (không có refresh_token)
UPDATE public.system_config
SET value = jsonb_set(
    jsonb_set(value, '{facebook,tokenExpiresAt}', '""'::jsonb, true),
    '{facebook,appSecret}', '""'::jsonb, true
)
WHERE key = 'marketing_channels_config'
  AND NOT (value->'facebook' ? 'tokenExpiresAt');

-- 7b. Zalo — thêm refreshToken + tokenExpiresAt
UPDATE public.system_config
SET value = jsonb_set(
    jsonb_set(value, '{zalo,refreshToken}', '""'::jsonb, true),
    '{zalo,tokenExpiresAt}', '""'::jsonb, true
)
WHERE key = 'marketing_channels_config'
  AND NOT (value->'zalo' ? 'refreshToken');

-- 7c. TikTok — thêm refreshToken + tokenExpiresAt
UPDATE public.system_config
SET value = jsonb_set(
    jsonb_set(value, '{tiktok,refreshToken}', '""'::jsonb, true),
    '{tiktok,tokenExpiresAt}', '""'::jsonb, true
)
WHERE key = 'marketing_channels_config'
  AND NOT (value->'tiktok' ? 'refreshToken');

-- 7d. YouTube — thêm refreshToken + tokenExpiresAt
UPDATE public.system_config
SET value = jsonb_set(
    jsonb_set(value, '{youtube,refreshToken}', '""'::jsonb, true),
    '{youtube,tokenExpiresAt}', '""'::jsonb, true
)
WHERE key = 'marketing_channels_config'
  AND NOT (value->'youtube' ? 'refreshToken');

-- Xác nhận cấu trúc đã được cập nhật
DO $$
DECLARE
    v_config JSONB;
BEGIN
    SELECT value INTO v_config FROM public.system_config
    WHERE key = 'marketing_channels_config';

    IF v_config IS NULL THEN
        -- Tạo mới hoàn toàn nếu chưa có
        INSERT INTO public.system_config (key, value)
        VALUES ('marketing_channels_config', '{
            "facebook": {
                "appId": "", "appSecret": "", "pageId": "",
                "pageAccessToken": "", "pageName": "",
                "tokenExpiresAt": "", "isConfigured": false
            },
            "zalo": {
                "appId": "", "secretKey": "", "oaId": "", "oaName": "",
                "accessToken": "", "refreshToken": "",
                "tokenExpiresAt": "", "isConfigured": false
            },
            "tiktok": {
                "clientKey": "", "clientSecret": "", "accountName": "",
                "accessToken": "", "refreshToken": "",
                "tokenExpiresAt": "", "isConfigured": false
            },
            "youtube": {
                "clientId": "", "clientSecret": "", "channelName": "",
                "accessToken": "", "refreshToken": "",
                "tokenExpiresAt": "", "isConfigured": false
            }
        }'::jsonb)
        ON CONFLICT (key) DO NOTHING;

        RAISE NOTICE 'Created new marketing_channels_config in system_config';
    ELSE
        RAISE NOTICE 'marketing_channels_config exists — fields merged successfully';
    END IF;
END $$;


-- ============================================================
-- PHẦN 8: HÀM TIỆN ÍCH
-- ============================================================

-- 8a. fn_get_oauth_token(platform) — Lấy token đang hoạt động
CREATE OR REPLACE FUNCTION public.fn_get_oauth_token(p_platform TEXT)
RETURNS TABLE (
    access_token            TEXT,
    refresh_token           TEXT,
    token_expires_at        TIMESTAMP WITH TIME ZONE,
    refresh_expires_at      TIMESTAMP WITH TIME ZONE,
    is_expired              BOOLEAN,
    needs_refresh           BOOLEAN,
    minutes_until_expiry    INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.access_token,
        t.refresh_token,
        t.token_expires_at,
        t.refresh_token_expires_at,
        -- Token đã hết hạn?
        CASE
            WHEN t.token_expires_at IS NULL THEN false
            WHEN t.token_expires_at < timezone('utc'::text, now()) THEN true
            ELSE false
        END AS is_expired,
        -- Cần refresh không? (còn dưới 30 phút)
        CASE
            WHEN t.token_expires_at IS NULL THEN false
            WHEN t.token_expires_at < timezone('utc'::text, now()) + INTERVAL '30 minutes' THEN true
            ELSE false
        END AS needs_refresh,
        -- Số phút còn lại
        CASE
            WHEN t.token_expires_at IS NULL THEN NULL::INTEGER
            ELSE EXTRACT(EPOCH FROM (t.token_expires_at - timezone('utc'::text, now())))::INTEGER / 60
        END AS minutes_until_expiry
    FROM public.marketing_oauth_tokens t
    WHERE t.platform = p_platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_get_oauth_token(TEXT) IS
    'Lấy thông tin token và trạng thái hết hạn cho một nền tảng mạng xã hội';


-- 8b. fn_save_oauth_token(...) — Lưu token mới sau khi refresh
CREATE OR REPLACE FUNCTION public.fn_save_oauth_token(
    p_platform              TEXT,
    p_access_token          TEXT,
    p_refresh_token         TEXT DEFAULT NULL,
    p_expires_in_seconds    INTEGER DEFAULT NULL,  -- Thời gian hết hạn (giây)
    p_account_name          TEXT DEFAULT NULL,
    p_account_id            TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Tính thời điểm hết hạn
    IF p_expires_in_seconds IS NOT NULL THEN
        v_expires_at := timezone('utc'::text, now()) + (p_expires_in_seconds || ' seconds')::INTERVAL;
    ELSE
        -- Mặc định theo từng nền tảng nếu không truyền expires_in
        v_expires_at := CASE p_platform
            WHEN 'zalo'     THEN timezone('utc'::text, now()) + INTERVAL '25 hours'
            WHEN 'tiktok'   THEN timezone('utc'::text, now()) + INTERVAL '24 hours'
            WHEN 'youtube'  THEN timezone('utc'::text, now()) + INTERVAL '1 hour'
            WHEN 'facebook' THEN timezone('utc'::text, now()) + INTERVAL '60 days'
            ELSE NULL
        END;
    END IF;

    -- Upsert token
    INSERT INTO public.marketing_oauth_tokens (
        platform, access_token, refresh_token,
        token_expires_at, account_name, account_id,
        is_active, refresh_count, last_refreshed_at, last_error
    )
    VALUES (
        p_platform, p_access_token,
        COALESCE(p_refresh_token, (SELECT t.refresh_token FROM public.marketing_oauth_tokens t WHERE t.platform = p_platform)),
        v_expires_at,
        p_account_name,
        p_account_id,
        true, 1, timezone('utc'::text, now()), NULL
    )
    ON CONFLICT (platform) DO UPDATE SET
        access_token      = EXCLUDED.access_token,
        refresh_token     = COALESCE(EXCLUDED.refresh_token, marketing_oauth_tokens.refresh_token),
        token_expires_at  = EXCLUDED.token_expires_at,
        account_name      = COALESCE(EXCLUDED.account_name, marketing_oauth_tokens.account_name),
        account_id        = COALESCE(EXCLUDED.account_id, marketing_oauth_tokens.account_id),
        is_active         = true,
        refresh_count     = marketing_oauth_tokens.refresh_count + 1,
        last_refreshed_at = timezone('utc'::text, now()),
        last_error        = NULL,
        updated_at        = timezone('utc'::text, now());

    RAISE NOTICE 'Saved % token (expires at: %)', p_platform, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_save_oauth_token(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) IS
    'Lưu hoặc cập nhật Access Token / Refresh Token cho một nền tảng. Tự tính token_expires_at nếu không truyền.';


-- 8c. fn_mark_token_error(platform, error) — Ghi nhận lỗi refresh token
CREATE OR REPLACE FUNCTION public.fn_mark_token_error(
    p_platform  TEXT,
    p_error     TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.marketing_oauth_tokens
    SET
        last_error  = p_error,
        is_active   = false,
        updated_at  = timezone('utc'::text, now())
    WHERE platform = p_platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8d. fn_get_tokens_needing_refresh() — Danh sách token cần refresh ngay
CREATE OR REPLACE FUNCTION public.fn_get_tokens_needing_refresh()
RETURNS TABLE (
    platform    TEXT,
    expires_at  TIMESTAMP WITH TIME ZONE,
    mins_left   INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.platform,
        t.token_expires_at,
        EXTRACT(EPOCH FROM (t.token_expires_at - timezone('utc'::text, now())))::INTEGER / 60
    FROM public.marketing_oauth_tokens t
    WHERE
        t.is_active = true
        AND t.refresh_token IS NOT NULL
        AND t.refresh_token <> ''
        AND t.token_expires_at IS NOT NULL
        -- Cần refresh nếu còn dưới 30 phút hoặc đã hết hạn
        AND t.token_expires_at < timezone('utc'::text, now()) + INTERVAL '30 minutes'
    ORDER BY t.token_expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_get_tokens_needing_refresh() IS
    'Trả về danh sách nền tảng có token sắp hết hạn (dưới 30 phút). Gọi qua pg_cron mỗi 15 phút.';


-- ============================================================
-- PHẦN 9: VIEW tổng quan trạng thái token
-- ============================================================
CREATE OR REPLACE VIEW public.vw_oauth_token_status AS
SELECT
    platform,
    account_name,
    is_active,
    CASE
        WHEN access_token IS NULL OR access_token = '' THEN 'not_configured'
        WHEN token_expires_at IS NULL THEN 'no_expiry'  -- Facebook vĩnh viễn
        WHEN token_expires_at < timezone('utc'::text, now()) THEN 'expired'
        WHEN token_expires_at < timezone('utc'::text, now()) + INTERVAL '2 hours' THEN 'expiring_soon'
        ELSE 'valid'
    END AS token_status,
    token_expires_at,
    CASE
        WHEN token_expires_at IS NULL THEN NULL
        ELSE EXTRACT(EPOCH FROM (token_expires_at - timezone('utc'::text, now())))::INTEGER / 60
    END AS minutes_until_expiry,
    CASE
        WHEN refresh_token IS NOT NULL AND refresh_token <> '' THEN true
        ELSE false
    END AS has_refresh_token,
    refresh_count,
    last_refreshed_at,
    last_error,
    updated_at
FROM public.marketing_oauth_tokens
ORDER BY
    CASE platform
        WHEN 'facebook' THEN 1
        WHEN 'zalo'     THEN 2
        WHEN 'tiktok'   THEN 3
        WHEN 'youtube'  THEN 4
    END;

COMMENT ON VIEW public.vw_oauth_token_status IS
    'Tổng quan trạng thái token tất cả kênh marketing. Dùng cho Dashboard hoặc cảnh báo.';


-- ============================================================
-- PHẦN 10: VÍ DỤ SỬ DỤNG (đọc thêm, không chạy tự động)
-- ============================================================
/*
-- Lưu token mới sau khi refresh (gọi từ API hoặc pg_cron):
SELECT public.fn_save_oauth_token(
    'zalo',                               -- platform
    'zalo_new_access_token_abc123',       -- access_token
    'zalo_new_refresh_token_xyz789',      -- refresh_token
    86400,                                -- expires_in_seconds (24 giờ)
    'PARS 2026 OA',                       -- account_name
    '123456789'                           -- account_id (OA ID)
);

-- Kiểm tra trạng thái token Zalo:
SELECT * FROM public.fn_get_oauth_token('zalo');

-- Xem tất cả token sắp hết hạn:
SELECT * FROM public.fn_get_tokens_needing_refresh();

-- Xem dashboard tổng quan:
SELECT * FROM public.vw_oauth_token_status;

-- Ghi lỗi khi refresh thất bại:
SELECT public.fn_mark_token_error('tiktok', 'Invalid refresh_token: expired');

-- Cập nhật Refresh Token thủ công cho Zalo:
UPDATE public.marketing_oauth_tokens
SET
    refresh_token            = 'zalo_refresh_token_moi',
    refresh_token_expires_at = NOW() + INTERVAL '90 days',
    updated_at               = NOW()
WHERE platform = 'zalo';
*/


-- ============================================================
-- PHẦN 11: KIỂM TRA KẾT QUẢ
-- Chạy sau khi migration xong
-- ============================================================
SELECT
    'marketing_oauth_tokens'         AS table_name,
    COUNT(*)                          AS rows_seeded,
    COUNT(*) FILTER (WHERE is_active) AS active_tokens
FROM public.marketing_oauth_tokens;

-- Xem cấu trúc system_config sau khi merge
SELECT
    key,
    jsonb_object_keys(value) AS channel,
    jsonb_object_keys(value->jsonb_object_keys(value)) AS fields
FROM public.system_config
WHERE key = 'marketing_channels_config'
LIMIT 20;

-- Xem view tổng quan token
SELECT * FROM public.vw_oauth_token_status;
