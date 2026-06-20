import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Assemble content using object format for from field to prevent quote/syntax issues
    const mailOptions = {
      from: {
        name: config.senderName || "PARS 2026 BTC",
        address: config.senderEmail || config.smtpUser,
      },
      to: payload.to,
      subject: payload.subject || "Thư xác nhận PARS 2026",
      html: payload.body, // We pass email body as HTML content
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
    
    // Add helpful tips for SMTP sender mismatch errors (common in Gmail/Zoho/Outlook)
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
