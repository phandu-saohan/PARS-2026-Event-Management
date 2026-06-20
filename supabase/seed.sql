-- ==========================================
-- PARS 2026 - SEED DATA FOR SUPABASE
-- ==========================================

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
  auto_send_zns, require_practice_code, app_url,
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
  'https://pars2026.vercel.app',
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
      "scheduleAddOns":{ "vi": "THỜI ĐIỂM & DỊCH VỤ PHỤ TRỢ TỰ CHỌN", "en": "SCHEDULE & OPTIONAL ADD-ON SERVICES" },
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

-- 10. Seed Sessions (Lịch trình sự kiện) (Đã xóa dữ liệu mẫu)


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
