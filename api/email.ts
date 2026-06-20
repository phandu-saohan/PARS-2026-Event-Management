import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. Action: send (SMTP Send)
// ==========================================
async function handleSend(req: VercelRequest, res: VercelResponse) {
  let { config, payload } = req.body;

  if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'email_config')
          .single();
          
        if (!error && data && data.value) {
          const dbConfig = data.value;
          config = {
            ...dbConfig,
            ...Object.fromEntries(
              Object.entries(config || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            )
          };
        }
      } catch (dbErr: any) {
        console.error('Error fetching email config from Supabase:', dbErr);
      }
    }
  }

  if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return res.status(400).json({
      success: false,
      error: "SMTP server configuration is incomplete.",
    });
  }

  if (!payload || !payload.to) {
    return res.status(400).json({
      success: false,
      error: "Recipient email (to) is missing in payload.",
    });
  }

  try {
    const isSecure = Number(config.smtpPort) === 465;
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: isSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: {
        name: config.senderName || "PARS 2026 BTC",
        address: config.senderEmail || config.smtpUser,
      },
      to: payload.to,
      subject: payload.subject || "Thư xác nhận PARS 2026",
      html: payload.body,
    };

    const info = await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      server: config.smtpHost,
    });
  } catch (err: any) {
    let errorMessage = err.message || "Lỗi khi gửi mail SMTP";
    const lowerError = errorMessage.toLowerCase();
    if (
      errorMessage.includes("5.7.1") || 
      lowerError.includes("sender address rejected") || 
      lowerError.includes("allowed sender address mismatch") ||
      lowerError.includes("not owned by user")
    ) {
      errorMessage += " (Gợi ý: Một số nhà cung cấp SMTP như Gmail/Zoho/Outlook yêu cầu 'MÃ SENDER EMAIL' phải khớp chính xác với tài khoản 'SMTP USER' đăng nhập).";
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

// ==========================================
// 2. Action: send-resend (Resend API Send)
// ==========================================
async function handleSendResend(req: VercelRequest, res: VercelResponse) {
  const { apiKey, from, to, subject, html } = req.body;

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Resend API Key (apiKey) is required.' });
  }
  if (!from) {
    return res.status(400).json({ success: false, error: 'Sender email (from) is required.' });
  }
  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient email (to) is required.' });
  }
  if (!html) {
    return res.status(400).json({ success: false, error: 'Email body (html) is required.' });
  }

  try {
    const resendUrl = 'https://api.resend.com/emails';
    const response = await fetch(resendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject: subject || 'Thông báo từ Ban Tổ Chức',
        html
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        id: data.id,
        message: 'Email sent successfully via Resend API'
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: data.message || JSON.stringify(data)
      });
    }
  } catch (error: any) {
    console.error('[Resend Proxy API Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while connecting to Resend API'
    });
  }
}

// ==========================================
// 3. Action: test-connection (SMTP Connection Verification)
// ==========================================
async function handleTestConnection(req: VercelRequest, res: VercelResponse) {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({
      success: false,
      message: "Cung cấp thiếu thông tin máy chủ SMTP (Host, User, Pass).",
    });
  }

  try {
    const isSecure = Number(smtpPort) === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: isSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    return res.json({
      success: true,
      message: `Kết nối thành công đến máy chủ SMTP ${smtpHost}!`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Hệ thống từ chối kết nối: ${err.message || "Lỗi SMTP không xác định"}`,
    });
  }
}

// ==========================================
// Main Handler
// ==========================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.query.action;

  if (action === 'send') {
    return handleSend(req, res);
  } else if (action === 'send-resend') {
    return handleSendResend(req, res);
  } else if (action === 'test-connection') {
    return handleTestConnection(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid or missing action query parameter' });
  }
}
