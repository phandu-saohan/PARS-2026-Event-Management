-- ============================================================
--  PARS 2026 — CẬP NHẬT HÌNH ẢNH TRANG TIN SỰ KIỆN
--  Phiên bản : v1.0  (2026-06-25)
--  Mục tiêu  : Cập nhật toàn bộ hình ảnh trong bảng
--              public.business_config cho trang tin sự kiện
--              (Landing Page / Public Event Details)
--
--  HƯỚNG DẪN SỬ DỤNG:
--  ① Thay thế tất cả URL hình ảnh bên dưới bằng URL thực tế
--     (từ Supabase Storage hoặc CDN của bạn)
--  ② Chạy script trong Supabase Dashboard → SQL Editor
--  ③ Script idempotent — chạy nhiều lần không gây lỗi
-- ============================================================


-- ============================================================
-- PHẦN 1: CẬP NHẬT ẢNH TRỰC TIẾP TRONG CỘT RIÊNG
-- Các cột: landing_logo_url, landing_landmarks_url,
--          landing_slide1_url → landing_slide4_url
-- ============================================================

UPDATE public.business_config
SET
    -- -------------------------------------------------------
    -- LOGO HỘI NGHỊ (góc trên bên trái navbar)
    -- Khuyến nghị: PNG nền trong suốt, tỉ lệ ngang, ~400x120px
    -- -------------------------------------------------------
    landing_logo_url = 'https://parsvn.com/uploads/logo/pars-logo.png',

    -- -------------------------------------------------------
    -- ẢNH NỀN HERO BANNER (full-screen background)
    -- Khuyến nghị: ≥1920×1080px, phong cảnh Hà Nội/địa điểm
    -- -------------------------------------------------------
    landing_landmarks_url = 'https://parsvn.com/uploads/bg/hanoi-banner-2026.jpg',

    -- -------------------------------------------------------
    -- SLIDESHOW / GALLERY ẢNH PHỤ (tùy chọn, hiển thị trong
    -- các section phụ hoặc carousel)
    -- -------------------------------------------------------
    landing_slide1_url = 'https://parsvn.com/uploads/slides/slide-1.jpg',
    landing_slide2_url = 'https://parsvn.com/uploads/slides/slide-2.jpg',
    landing_slide3_url = 'https://parsvn.com/uploads/slides/slide-3.jpg',
    landing_slide4_url = 'https://parsvn.com/uploads/slides/slide-4.jpg',

    updated_at = timezone('utc', now())

WHERE id = 'default';


-- ============================================================
-- PHẦN 2: CẬP NHẬT NỘI DUNG JSONB landing_page_sections
-- Bao gồm: hero text, intro text, speaker photos,
--          section backgrounds
-- ============================================================

UPDATE public.business_config
SET
    landing_page_sections = COALESCE(landing_page_sections, '{}'::jsonb) || jsonb_build_object(

        -- ====================================================
        -- 2A. HERO BANNER — Văn bản & nút hành động
        -- ====================================================
        'hero', jsonb_build_object(
            'tag',             'PARS 2026 — INTERNATIONAL SCIENTIFIC CONFERENCE',
            'title',           'HỘI NGHỊ KHOA HỌC',
            'year',            '2026',
            'themeEn',         'INNOVATIONS IN AESTHETIC PLASTIC SURGERY',
            'themeVi',         'ĐỔI MỚI TRONG PHẪU THUẬT TẠO HÌNH THẨM MỸ',
            'date',            '12 - 13 tháng 9 năm 2026',
            'location',        'Melià Hanoi, Hà Nội, Việt Nam',
            'btnRegisterText', 'Đăng Ký Tham Dự',
            'btnProgramText',  'Chương Trình Khoa Học'
        ),

        -- ====================================================
        -- 2B. SECTION GIỚI THIỆU — Tiêu đề & nội dung
        -- ====================================================
        'intro', jsonb_build_object(
            'title',           'GIỚI THIỆU HỘI NGHỊ',
            'text1',           'Hội nghị Khoa học Quốc tế PARS 2026 do Hội Phẫu Thuật Tạo Hình Thẩm Mỹ Việt Nam (PARS) tổ chức là sự kiện y khoa đỉnh cao quy tụ dàn chuyên gia thẩm mỹ uy tín hàng đầu toàn cầu (ISAPS, ASPS, EURAPS) và Việt Nam.',
            'text2',           'Hội nghị tập trung cập nhật các tiến bộ lâm sàng vượt bậc, chuyển giao công nghệ phẫu thuật tạo hình vóc dáng nâng cao, trẻ hóa và kiểm soát toàn diện rủi ro trong thẩm mỹ hiện đại.',
            'highlight1Title', 'Đơn vị chủ trì uy tín',
            'highlight1Desc',  'Hội PARS tập hợp đội ngũ chuyên gia phẫu thuật thẩm mỹ hàng đầu Việt Nam với tiêu chuẩn đào tạo và thực hành quốc tế.',
            'highlight2Title', 'Chứng chỉ CME 4.5h',
            'highlight2Desc',  'Cấp chứng nhận đào tạo liên tục y khoa theo quy định của Bộ Y tế Việt Nam, được công nhận bởi các tổ chức y tế quốc tế.',
            'highlight3Title', 'Giao lưu chuyên gia đa quốc gia',
            'highlight3Desc',  'Cơ hội đối thoại trực tiếp và học tập kinh nghiệm thực chiến từ các Giáo sư hàng đầu Hoa Kỳ, Nhật Bản, Thụy Điển, Mexico, Ý, Romania, Úc.'
        ),

        -- ====================================================
        -- 2C. MÀU NỀN TỪNG SECTION
        -- Thay đổi màu hex theo thiết kế của bạn
        -- ====================================================
        'sectionBg', jsonb_build_object(
            'intro',            '#ffffff',   -- Trắng — Section Giới thiệu
            'speakersForeign',  '#0f172a',   -- Xanh đậm — Section BCV Quốc tế
            'speakersDomestic', '#ffffff',   -- Trắng — Section BCV Trong nước
            'register',         '#f1f5f9',   -- Xám nhạt — Section Đăng ký
            'sponsors',         '#ffffff',   -- Trắng — Section Nhà tài trợ
            'location',         '#0f172a'    -- Xanh đậm — Section Địa điểm
        ),

        -- ====================================================
        -- 2D. DANH SÁCH BÁO CÁO VIÊN — Ảnh chân dung
        -- Thay photoUrl bằng URL ảnh thực tế của từng BCV
        -- ====================================================
        'speakers', jsonb_build_object(

            -- ------------------------------------------------
            -- BÁO CÁO VIÊN QUỐC TẾ
            -- ------------------------------------------------
            'foreign', jsonb_build_array(
                jsonb_build_object(
                    'id',       'spk-f1',
                    'name',     'Arturo Ramírez Montañana, MD, PhD',
                    'role',     'President, International Society of Aesthetic Plastic Surgery (ISAPS)',
                    'highlight','Plastic, Aesthetic & Reconstructive Surgeon – Monterrey, Mexico',
                    'country',  'Mexico',
                    'type',     'foreign',
                    'initials', 'AR',
                    'avatarBg', 'from-amber-600 via-red-700 to-rose-900',
                    -- ▼ THAY THẾ URL ẢNH TẠI ĐÂY ▼
                    'photoUrl', 'https://parsvn.com/uploads/speaker/arturo-ramirez-montanana-md-phd-(1).png'
                ),
                jsonb_build_object(
                    'id',       'spk-f2',
                    'name',     'Prof. Kotaro Yoshimura, MD, PhD',
                    'role',     'Chairman of Department of Plastic Surgery at Jichi Medical University, Japan',
                    'highlight','Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản',
                    'country',  'Nhật Bản',
                    'type',     'foreign',
                    'initials', 'KY',
                    'avatarBg', 'from-teal-600 via-sky-700 to-indigo-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/prof-kotaro-yoshimura-md-phd-(1).png'
                ),
                jsonb_build_object(
                    'id',       'spk-f3',
                    'name',     'Bertha Torres Gómez, MD, PhD',
                    'role',     'Chair, National Secretary of ISAPS',
                    'highlight','Mexican Association of Plastic, Aesthetic, and Reconstructive Surgery (AMCPER)',
                    'country',  'Mexico',
                    'type',     'foreign',
                    'initials', 'BG',
                    'avatarBg', 'from-pink-600 via-rose-700 to-purple-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/bertha-torres-gomez-md-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-f4',
                    'name',     'Prof. Fabio Santanelli, MD',
                    'role',     'Secretary General of the European Association of Plastic Surgeons',
                    'highlight','Lecturer at Sapienza University of Rome, Italy',
                    'country',  'Ý',
                    'type',     'foreign',
                    'initials', 'FS',
                    'avatarBg', 'from-emerald-600 via-teal-700 to-cyan-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/prof-fabio-santanelli-md-(1).png'
                ),
                jsonb_build_object(
                    'id',       'spk-f5',
                    'name',     'C. Bob Basu, MD, MBA, MPH, FACS',
                    'role',     'President, American Society of Plastic Surgeons',
                    'highlight','Board-Certified Plastic Surgeon, American Board of Plastic Surgery',
                    'country',  'Mỹ',
                    'type',     'foreign',
                    'initials', 'BB',
                    'avatarBg', 'from-blue-600 via-indigo-700 to-slate-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/c-bob-basu-md-mba-mph-facs.png'
                ),
                jsonb_build_object(
                    'id',       'spk-f6',
                    'name',     'Constantin Stan, MD, PhD',
                    'role',     'Founder Of The Cronos Med Group Of Clinics',
                    'highlight','Medic specialist Chirurgie Estetica, Plastica si Reconstructiva',
                    'country',  'Romania',
                    'type',     'foreign',
                    'initials', 'CS',
                    'avatarBg', 'from-indigo-600 via-purple-700 to-pink-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/constantin-stan-md-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-f7',
                    'name',     'Robert Francis Parkyn, MD',
                    'role',     'Clinical Associate Professor, Adelaide University',
                    'highlight','Trung tâm Phẫu thuật Tuyến vú và Nội tiết Norwood, Úc',
                    'country',  'Úc',
                    'type',     'foreign',
                    'initials', 'RP',
                    'avatarBg', 'from-slate-700 via-slate-800 to-teal-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/robert-francis-parkyn-md-(1).png'
                ),
                jsonb_build_object(
                    'id',       'spk-f8',
                    'name',     'Amin Kalaji, MD',
                    'role',     'Chair of the Membership Committee, ISPRES',
                    'highlight','Chủ tịch Nhóm Tổng thư ký ISAPS',
                    'country',  'Thụy Điển',
                    'type',     'foreign',
                    'initials', 'AK',
                    'avatarBg', 'from-orange-600 via-rose-700 to-amber-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/amin-kalaji-md.png'
                ),
                jsonb_build_object(
                    'id',       'spk-f9',
                    'name',     'Prof. Mark W. Clemens, MD, MBA, FACS',
                    'role',     'Professor of Plastic Surgery, MD Anderson Cancer Center, Houston',
                    'highlight','Chuyên gia đầu ngành về tái tạo tuyến vú và an toàn túi ngực (BIA-ALCL)',
                    'country',  'Mỹ',
                    'type',     'foreign',
                    'initials', 'MC',
                    'avatarBg', 'from-sky-600 via-indigo-750 to-slate-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/prof-mark-w-clemens-md-mba-facs.png'
                ),
                jsonb_build_object(
                    'id',       'spk-f10',
                    'name',     'Assoc. Prof. Yuko, MD',
                    'role',     'Breast Center Director – Kameda Medical Hospital, Japan',
                    'highlight','Chuyên gia hàng đầu về phẫu thuật robot và cấy ghép mỡ tự thân tái tạo ngực',
                    'country',  'Nhật Bản',
                    'type',     'foreign',
                    'initials', 'YA',
                    'avatarBg', 'from-rose-500 via-pink-700 to-violet-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/assoc-prof-yuko-md.png'
                )
            ),

            -- ------------------------------------------------
            -- BÁO CÁO VIÊN TRONG NƯỚC
            -- ------------------------------------------------
            'domestic', jsonb_build_array(
                jsonb_build_object(
                    'id',       'spk-d1',
                    'name',     'Thiếu tướng, PGS.TS. TTND. Vũ Ngọc Lâm',
                    'role',     'Giám đốc Trung tâm Phẫu thuật Sọ mặt và Tạo hình, BV 108',
                    'highlight','Giám đốc Trung tâm Phẫu thuật Sọ mặt và Tạo hình, Bệnh viện Trung ương Quân đội 108',
                    'country',  'Việt Nam',
                    'type',     'domestic',
                    'initials', 'VL',
                    'avatarBg', 'from-emerald-700 via-teal-850 to-indigo-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/assoc-prof-vu-ngoc-lam-md-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-d2',
                    'name',     'PGS.TS. Phạm Hiếu Liêm',
                    'role',     'Trưởng Bộ môn PTTM Đại học Y khoa Phạm Ngọc Thạch',
                    'highlight','Trưởng Bộ môn PTTM Đại học Y khoa Phạm Ngọc Thạch & ĐH Y Dược TP.HCM',
                    'country',  'Việt Nam',
                    'type',     'domestic',
                    'initials', 'PL',
                    'avatarBg', 'from-indigo-700 via-rose-800 to-amber-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/assoc-prof-pham-hieu-liem-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-d3',
                    'name',     'PGS.TS. Phạm Văn Phúc',
                    'role',     'Viện trưởng Viện Tế bào gốc, Đại học Quốc gia TP.HCM',
                    'highlight','Viện trưởng Viện Tế bào gốc, Đại học Quốc gia TP.HCM',
                    'country',  'Việt Nam',
                    'type',     'domestic',
                    'initials', 'VP',
                    'avatarBg', 'from-cyan-700 via-sky-800 to-slate-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/assoc-prof-pham-van-phuc-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-d4',
                    'name',     'PGS.TS. Nguyễn Đình Tùng',
                    'role',     'Giám đốc Y khoa Bệnh viện PTTM EMCAS',
                    'highlight','Thư ký Quốc gia ISAPS Việt Nam',
                    'country',  'Việt Nam',
                    'type',     'domestic',
                    'initials', 'NT',
                    'avatarBg', 'from-amber-600 via-orange-850 to-stone-900',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/assoc-prof-nguyen-dinh-tung-md-phd.png'
                ),
                jsonb_build_object(
                    'id',       'spk-d5',
                    'name',     'TS. Phạm Lê Bửu Trúc',
                    'role',     'Trung tâm Công nghệ Sinh học TP.HCM',
                    'highlight','Trung tâm Công nghệ Sinh học Thành phố Hồ Chí Minh',
                    'country',  'Việt Nam',
                    'type',     'domestic',
                    'initials', 'PT',
                    'avatarBg', 'from-violet-750 via-purple-900 to-slate-950',
                    'photoUrl', 'https://parsvn.com/uploads/speaker/pham-le-buu-truc-md-phd.png'
                )
            )
        )
    ),

    updated_at = timezone('utc', now())

WHERE id = 'default';


-- ============================================================
-- PHẦN 3: XÁC NHẬN KẾT QUẢ
-- Chạy lệnh SELECT này để kiểm tra dữ liệu đã lưu đúng chưa
-- ============================================================

SELECT
    id,
    event_name,
    landing_logo_url,
    landing_landmarks_url,
    landing_slide1_url,
    landing_slide2_url,
    landing_slide3_url,
    landing_slide4_url,
    landing_page_sections -> 'hero'         AS hero_config,
    landing_page_sections -> 'sectionBg'    AS section_bg_colors,
    jsonb_array_length(landing_page_sections -> 'speakers' -> 'foreign')   AS foreign_speakers_count,
    jsonb_array_length(landing_page_sections -> 'speakers' -> 'domestic')  AS domestic_speakers_count,
    updated_at
FROM public.business_config
WHERE id = 'default';


-- ============================================================
-- PHẦN 4 (TÙY CHỌN): CẬP NHẬT ẢNH TỪNG BÁO CÁO VIÊN ĐƠN LẺ
-- Dùng khi chỉ muốn đổi 1 ảnh mà không viết lại toàn bộ mảng
-- ============================================================

/*
-- Ví dụ: cập nhật ảnh báo cáo viên có id = 'spk-f1'
UPDATE public.business_config
SET landing_page_sections = jsonb_set(
    landing_page_sections,
    '{speakers, foreign, 0, photoUrl}',           -- index 0 = phần tử đầu tiên
    '"https://cdn.example.com/new-speaker-1.jpg"'::jsonb
)
WHERE id = 'default';

-- Ví dụ: cập nhật ảnh báo cáo viên trong nước index 2 (spk-d3)
UPDATE public.business_config
SET landing_page_sections = jsonb_set(
    landing_page_sections,
    '{speakers, domestic, 2, photoUrl}',
    '"https://cdn.example.com/pham-van-phuc-new.jpg"'::jsonb
)
WHERE id = 'default';
*/


-- ============================================================
-- PHẦN 5 (TÙY CHỌN): CẬP NHẬT CHỈ MÀU NỀN SECTION
-- ============================================================

/*
UPDATE public.business_config
SET landing_page_sections = jsonb_set(
    landing_page_sections,
    '{sectionBg}',
    '{
      "intro":            "#ffffff",
      "speakersForeign":  "#0a0f1e",
      "speakersDomestic": "#f8fafc",
      "register":         "#eff6ff",
      "sponsors":         "#ffffff",
      "location":         "#0a0f1e"
    }'::jsonb
)
WHERE id = 'default';
*/


-- ============================================================
-- HOÀN TẤT
-- Script đã thực hiện:
--   ✅ Cập nhật ảnh logo, hero background, slides (Phần 1)
--   ✅ Cập nhật text hero banner + intro + màu section (Phần 2)
--   ✅ Cập nhật danh sách 10 BCV Quốc tế + 5 BCV Trong nước (Phần 2)
--   ✅ Câu SELECT xác nhận kết quả (Phần 3)
--   ✅ Ví dụ cập nhật ảnh từng BCV đơn lẻ (Phần 4 — comment)
--   ✅ Ví dụ cập nhật màu nền section (Phần 5 — comment)
-- ============================================================
