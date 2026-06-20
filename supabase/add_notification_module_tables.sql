-- ============================================================================
-- PARS 2026 - THIẾT LẬP CƠ SỞ DỮ LIỆU CHO MODULE THÔNG BÁO TỰ ĐỘNG VÀ HÀNG LOẠT
-- ============================================================================

-- 1. BẢNG MẪU THÔNG BÁO (NOTIFICATION TEMPLATES)
-- Lưu trữ các mẫu email, Zalo OA (ZNS), WhatsApp, SMS
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Ví dụ: registration_success, payment_confirmed, reminder_event, abstract_approved
    channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo', 'sms', 'whatsapp')),
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    zns_template_id TEXT,
    zns_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BẢNG LỊCH SỬ GỬI THÔNG BÁO (SENT NOTIFICATION LOGS)
-- Lưu lại lịch sử gửi tin đi (trạng thái thành công/thất bại, nội dung, phản hồi từ API)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id TEXT PRIMARY KEY, -- Định dạng: NTF-XXXX hoặc UUID
    recipient TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'zalo', 'sms', 'whatsapp')),
    template_id TEXT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    template_name TEXT,
    sender TEXT NOT NULL,
    sent_at TEXT NOT NULL, -- Định dạng: YYYY-MM-DD HH:MM
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    payload JSONB DEFAULT '{}'::jsonb,
    response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG CẤU HÌNH HỆ THỐNG (SYSTEM CONFIGURATION)
-- Lưu trữ cấu hình SMTP Email, Zalo OA, Resend API Key, WhatsApp Business
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY, -- Ví dụ: 'zalo_config', 'email_config', 'resend_config', 'whatsapp_config'
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BẢNG DANH BẠ LIÊN HỆ (CONTACTS)
-- Lưu trữ liên hệ từ danh sách Excel tải lên để sử dụng lại
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY, -- Định dạng: CON-XXXX hoặc UUID
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    group_name TEXT DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- KÍCH HOẠT BẢO MẬT ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CẤU HÌNH CÁC CHÍNH SÁCH BẢO MẬT (RLS POLICIES) - AN TOÀN TRÁNH TRÙNG LẶP
-- ============================================================================

-- A. CHÍNH SÁCH CHO MẪU TIN NHẮN (NOTIFICATION TEMPLATES)
DROP POLICY IF EXISTS "Allow authenticated manage notification_templates" ON public.notification_templates;
CREATE POLICY "Allow authenticated manage notification_templates" ON public.notification_templates
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read notification_templates" ON public.notification_templates;
CREATE POLICY "Allow public read notification_templates" ON public.notification_templates
    FOR SELECT
    USING (true);


-- B. CHÍNH SÁCH CHO NHẬT KÝ GỬI TIN (NOTIFICATION LOGS)
DROP POLICY IF EXISTS "Allow authenticated manage notification_logs" ON public.notification_logs;
CREATE POLICY "Allow authenticated manage notification_logs" ON public.notification_logs
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert notification_logs" ON public.notification_logs;
CREATE POLICY "Allow public insert notification_logs" ON public.notification_logs
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read notification_logs" ON public.notification_logs;
CREATE POLICY "Allow public read notification_logs" ON public.notification_logs
    FOR SELECT
    USING (true);


-- C. CHÍNH SÁCH CHO CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG)
DROP POLICY IF EXISTS "Allow authenticated manage system_config" ON public.system_config;
CREATE POLICY "Allow authenticated manage system_config" ON public.system_config
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- D. CHÍNH SÁCH CHO DANH BẠ LIÊN HỆ (CONTACTS)
DROP POLICY IF EXISTS "Allow authenticated manage contacts" ON public.contacts;
CREATE POLICY "Allow authenticated manage contacts" ON public.contacts 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert contacts" ON public.contacts;
CREATE POLICY "Allow public insert contacts" ON public.contacts 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read contacts" ON public.contacts;
CREATE POLICY "Allow public read contacts" ON public.contacts 
    FOR SELECT 
    USING (true);

-- ============================================================================
-- KÍCH HOẠT TÍNH NĂNG ĐỒNG BỘ THỜI GIAN THỰC (SUPABASE REALTIME)
-- ============================================================================

-- Kích hoạt Realtime cho lịch sử gửi tin và danh bạ để giao diện tự cập nhật tức thời
-- Ghi chú: Dùng khối do-declare để tránh lỗi nếu bảng đã được đăng ký Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'notification_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
    END IF;
END $$;

-- ============================================================================
-- SEED DATA MẪU CHO CẤU HÌNH VÀ MẪU THÔNG BÁO TỰ ĐỘNG
-- ============================================================================

-- 1. Chèn cấu hình hệ thống mặc định (nếu chưa tồn tại)
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
('resend_config', '{
  "apiKey": "",
  "senderEmail": "",
  "isConfigured": false
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

-- 2. Chèn các mẫu thông báo mặc định (nếu chưa tồn tại)
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
