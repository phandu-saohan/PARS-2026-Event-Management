import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

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
