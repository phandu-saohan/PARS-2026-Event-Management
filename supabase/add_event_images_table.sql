-- =========================================================================
-- SQL Migration Script: Create Event Images (Media Gallery) Table
-- Target: Supabase Database (public.event_images)
-- Purpose: Store metadata and URLs of uploaded images for the event landing page,
--          news feed, speakers, and sponsors, enabling a centralized media library.
-- =========================================================================

-- 1. Create the event_images table
CREATE TABLE IF NOT EXISTS public.event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,                          -- Public URL of the image in storage
    file_name TEXT NOT NULL,                    -- Original name of the uploaded file
    file_size INTEGER,                          -- Size of the file in bytes
    mime_type TEXT DEFAULT 'image/png',          -- MIME type of the image
    category TEXT DEFAULT 'general',            -- Category (e.g., 'news', 'hero', 'speaker', 'sponsor')
    caption TEXT,                               -- Image caption or alt text
    uploaded_by TEXT,                           -- Identifier of the user who uploaded the image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add helpful comments on the table and columns
COMMENT ON TABLE public.event_images IS 'Bảng lưu trữ thông tin siêu dữ liệu (metadata) của hình ảnh tải lên trang tin sự kiện và thư viện phương tiện';
COMMENT ON COLUMN public.event_images.url IS 'Đường dẫn liên kết công khai (Public URL) của hình ảnh từ Supabase Storage';
COMMENT ON COLUMN public.event_images.file_name IS 'Tên gốc của tệp tin hình ảnh khi tải lên';
COMMENT ON COLUMN public.event_images.file_size IS 'Kích thước tệp tin tính bằng bytes';
COMMENT ON COLUMN public.event_images.mime_type IS 'Định dạng tệp tin hình ảnh (ví dụ: image/png, image/jpeg)';
COMMENT ON COLUMN public.event_images.category IS 'Phân loại ảnh (ví dụ: news, hero, speaker, sponsor, general)';
COMMENT ON COLUMN public.event_images.caption IS 'Chú thích hoặc mô tả ngắn gọn cho hình ảnh (dùng làm alt text)';
COMMENT ON COLUMN public.event_images.uploaded_by IS 'Thông tin tài khoản hoặc tên người đã tải ảnh lên';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Policy 4.1: Allow anyone (public/guest) to read/select the images to render on the public landing page or news feed
DROP POLICY IF EXISTS "Allow public read event_images" ON public.event_images;
CREATE POLICY "Allow public read event_images" ON public.event_images
    FOR SELECT
    USING (true);

-- Policy 4.2: Allow authenticated users (admin, staff) to perform all operations (insert, update, delete) to manage the library
DROP POLICY IF EXISTS "Allow authenticated manage event_images" ON public.event_images;
CREATE POLICY "Allow authenticated manage event_images" ON public.event_images
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Enable Realtime subscription for the event_images table (optional, for instant UI updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_images;
