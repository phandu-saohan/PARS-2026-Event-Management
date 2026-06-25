-- Script SQL cấu hình Bucket lưu trữ hình ảnh trên Supabase Storage
-- Tên bucket: assets
-- Chức năng: Lưu trữ hình ảnh báo cáo viên, ảnh chân dung đại biểu, biên lai chuyển khoản và các tài liệu khác.

-- 1. Đảm bảo bucket 'assets' tồn tại và được cấu hình ở chế độ công khai (public = true)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'assets', 
  'assets', 
  true, 
  5242880, -- Giới hạn dung lượng tệp: 5MB (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] -- Chỉ cho phép định dạng ảnh
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Kích hoạt tính năng RLS (Row Level Security) cho bảng storage.objects nếu chưa kích hoạt
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Xóa các chính sách cũ (nếu có) để tránh xung đột trùng lặp khi chạy lại script
DROP POLICY IF EXISTS "Allow public read assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manage assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update delete assets" ON storage.objects;

-- 4. Chính sách SELECT: Cho phép tất cả người dùng (Public/Guest) xem/tải hình ảnh từ bucket 'assets'
CREATE POLICY "Allow public read assets" ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'assets');

-- 5. Chính sách INSERT: Cho phép mọi người tải ảnh lên (ảnh chân dung đại biểu khi đăng ký, ảnh biên lai chuyển khoản)
CREATE POLICY "Allow public upload assets" ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'assets');

-- 6. Chính sách ALL (SELECT/INSERT/UPDATE/DELETE): Cho phép người dùng đã đăng nhập (authenticated - admin, staff) toàn quyền quản lý
CREATE POLICY "Allow authenticated manage assets" ON storage.objects 
  FOR ALL 
  TO authenticated 
  USING (bucket_id = 'assets')
  WITH CHECK (bucket_id = 'assets');
