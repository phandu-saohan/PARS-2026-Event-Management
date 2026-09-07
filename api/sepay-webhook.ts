import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

const DEFAULT_SUPABASE_URL = 'https://botibsighhbdaqhoxfxc.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_VLSdXyEvhLL12dTfui7Dfg_u5XWL9eW';

async function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey);
  }

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_ANON_KEY;
  const client = createClient(supabaseUrl, anonKey);
  try {
    const { data: auth, error } = await client.auth.signInWithPassword({
      email: 'admin@admin.com',
      password: '12345678'
    });
    if (!error && auth?.session) {
      return client;
    }
  } catch (err) {
    console.error('[SePay Webhook] Error authenticating with Supabase:', err);
  }
  return client;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apikey');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabase = await getSupabaseAdmin();

    // 1. Fetch webhook secret from dynamic settings (sepay_config) or fallback to env
    let webhookSecret = process.env.SEPAY_WEBHOOK_SECRET || '';
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('*')
          .eq('key', 'sepay_config')
          .maybeSingle();

        if (!error && data && data.value) {
          const config = data.value;
          if (config.webhookSecret) {
            webhookSecret = config.webhookSecret;
          }
        }
      } catch (dbErr) {
        console.error('[SePay Webhook] Failed to fetch config from Supabase:', dbErr);
      }
    }

    // Reject if no webhook secret configured — never process unauthenticated requests
    if (!webhookSecret) {
      console.error('[SePay Webhook] No webhook secret configured. Rejecting request.');
      return res.status(401).json({ success: false, message: 'Webhook secret not configured on server' });
    }

    // SePay sends webhook with header: Authorization: Apikey API_KEY
    const rawHeader = ((req.headers['authorization'] as string) || (req.headers['apikey'] as string) || '').trim();

    // Extract the key from "Apikey xxx" or use the raw value
    let incomingKey = rawHeader;
    const parts = rawHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'apikey') {
      incomingKey = parts[1];
    }

    if (!incomingKey || !safeEqual(incomingKey, webhookSecret)) {
      console.warn('[SePay Webhook] Unauthorized attempt from:', req.headers['x-forwarded-for'] || 'unknown');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('[SePay Webhook] Received payload:', JSON.stringify(payload));

    const {
      id: sepayId,
      transferAmount,
      transferType,
      content,
      transactionDate,
      gateway,
      referenceCode,
    } = payload;

    // Chỉ xử lý giao dịch tiền vào (in)
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Skipped outgoing transaction' });
    }

    if (!content || !transferAmount) {
      return res.status(200).json({ success: true, message: 'Missing content or amount' });
    }

    // Tìm attendee khớp nội dung chuyển khoản
    // Nội dung CK format: "NGUYEN VAN A 0901234567 DONG PHI THAM DU PARS 2026"
    // hoặc chứa attendee ID: "PARS2026-123456"
    const contentUpper = (content as string).toUpperCase().trim();

    // Tìm theo ID đại biểu trong nội dung (nếu có)
    const idMatch = contentUpper.match(/PARS2026-(\d+)/);

    let attendeeQuery = supabase.from('attendees').select('id, full_name, title, phone, email, package_name, package_fee, payment_status, qr_code_value, organization');

    if (idMatch) {
      attendeeQuery = attendeeQuery.eq('id', `PARS2026-${idMatch[1]}`);
    } else {
      // Tìm gần đúng theo số điện thoại trong nội dung
      const phoneMatch = contentUpper.match(/0[0-9]{9,10}/);
      if (phoneMatch) {
        attendeeQuery = attendeeQuery.ilike('phone', `%${phoneMatch[0]}%`);
      } else {
        return res.status(200).json({ success: true, message: 'Cannot match attendee from content' });
      }
    }

    const { data: attendees, error: queryErr } = await attendeeQuery.limit(5);

    if (queryErr || !attendees || attendees.length === 0) {
      console.warn('[SePay Webhook] No matching attendee found for content:', content);
      return res.status(200).json({ success: true, message: 'No matching attendee' });
    }

    // Chọn attendee có package_fee khớp nhất (chênh lệch ≤ 5000đ)
    const matched = attendees.find((a: any) => {
      const fee = Number(a.package_fee || 0);
      return Math.abs(fee - Number(transferAmount)) <= 5000;
    }) || attendees[0];

    if (matched.payment_status === 'paid') {
      return res.status(200).json({ success: true, message: 'Already marked as paid' });
    }

    // Cập nhật payment_status → paid
    const { error: updateErr } = await supabase
      .from('attendees')
      .update({
        payment_status: 'paid',
        payment_method: 'bank_transfer',
        notes: `SePay xác nhận tự động | GD #${sepayId} | ${gateway} | ${transactionDate} | Ref: ${referenceCode} | Số tiền: ${Number(transferAmount).toLocaleString('vi-VN')}đ`,
      })
      .eq('id', matched.id);

    if (updateErr) {
      console.error('[SePay Webhook] Update failed:', updateErr);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    console.log(`[SePay Webhook] ✅ Marked attendee ${matched.id} (${matched.full_name}) as PAID. Amount: ${transferAmount}`);

    // Tự động gửi Email xác nhận đăng ký thành công (kèm thẻ QR check-in & trạng thái Đã Thanh Toán)
    if (matched.email) {
      try {
        const { data: emailConfigRow } = await supabase.from('system_config').select('value').eq('key', 'email_config').single();
        const cfg = emailConfigRow?.value;
        if (cfg && cfg.smtpHost && cfg.smtpUser && cfg.smtpPass) {
          const nodemailerModule = await import('nodemailer');
          const nodemailer = nodemailerModule.default || nodemailerModule;
          const transporter = nodemailer.createTransport({
            host: cfg.smtpHost,
            port: Number(cfg.smtpPort) || 465,
            secure: Number(cfg.smtpPort) === 465,
            auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
            tls: { rejectUnauthorized: false },
          });

          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(matched.qr_code_value || matched.id)}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; border-bottom: 2px solid #be6940; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #1e1b4b; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Hội Nghị PARS 2026</h2>
                <p style="color: #be6940; font-size: 11px; margin: 5px 0 0 0; font-weight: bold;">Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên</p>
              </div>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Kính gửi Quý đại biểu ${matched.title ? matched.title + ' ' : ''}${matched.full_name},<br/><br/>
                Thay mặt Ban Tổ Chức Hội nghị Khoa học PARS 2026, chúng tôi xin trân trọng xác nhận Quý đại biểu đã hoàn tất đăng ký thông tin tham dự và hoàn tất thanh toán lệ phí thành công.
              </p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #be6940; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
                  <tr><td style="padding: 6px 0; font-weight: bold; width: 130px;">Mã Đại Biểu:</td><td style="padding: 6px 0; color: #be6940; font-family: monospace; font-weight: bold;">${matched.id}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold;">Họ và Tên:</td><td style="padding: 6px 0;">${matched.full_name}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold;">Đơn vị:</td><td style="padding: 6px 0;">${matched.organization || 'Hội viên PARS'}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold;">Gói Tham Dự:</td><td style="padding: 6px 0;">${matched.package_name || 'Gói Tiêu Chuẩn'}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold;">Lệ Phí:</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${Number(matched.package_fee || 0).toLocaleString('vi-VN')} VNĐ</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold;">Trạng Thái:</td><td style="padding: 6px 0; font-weight: bold; color: #10b981;">Đã Thanh Toán</td></tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0; background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
                <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: bold;">MÃ QR CHECK-IN</p>
                <img src="${qrUrl}" alt="QR Code" style="width: 180px; height: 180px;" />
                <p style="font-size: 11.5px; color: #64748b; margin: 8px 0 0 0;">Quý đại biểu vui lòng xuất trình mã QR này tại quầy tiếp đón hội nghị để nhận thẻ đeo chính thức.</p>
              </div>
              
              <p style="font-size: 12.5px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <strong>MỌI CHI TIẾT XIN LIÊN HỆ:</strong><br/>
                • Email: contact@parsevent.org<br/>
                • Hotline: 091-234-5678<br/><br/>
                Trân trọng,<br/>
                <strong>Ban Tổ Chức Hội nghị Khoa học PARS 2026</strong>
              </p>
            </div>
          `;

          await transporter.sendMail({
            from: { name: cfg.senderName || 'Ban Tổ Chức PARS 2026', address: cfg.senderEmail || cfg.smtpUser },
            to: matched.email,
            subject: '🎯 Xác nhận đăng ký tham dự thành công Đại biểu Hội nghị PARS 2026',
            html: emailHtml,
          });
          console.log(`[SePay Webhook] ✉️ Sent registration confirmation email to ${matched.email}`);
        }
      } catch (mailErr) {
        console.error('[SePay Webhook] Error sending automated confirmation email:', mailErr);
      }
    }

    return res.status(200).json({ success: true, message: `Attendee ${matched.id} marked as paid` });

  } catch (err: any) {
    console.error('[SePay Webhook] Unhandled error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal error' });
  }
}
