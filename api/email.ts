import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

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
// 2b. Action: send-cloudflare (Cloudflare Worker Email Send)
// ==========================================
async function handleSendCloudflare(req: VercelRequest, res: VercelResponse) {
  const { workerUrl, apiToken, from, to, subject, html } = req.body;

  if (!workerUrl) {
    return res.status(400).json({ success: false, error: 'Cloudflare Worker URL is required.' });
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from,
        to,
        subject: subject || 'Thông báo từ Ban Tổ Chức',
        html
      })
    });

    let data: any = {};
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (response.ok) {
      return res.status(200).json({
        success: true,
        id: data.id || 'cf-worker-id',
        message: 'Email sent successfully via Cloudflare Worker'
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: data.error || data.message || 'Lỗi từ Cloudflare Worker'
      });
    }
  } catch (error: any) {
    console.error('[Cloudflare Worker Proxy API Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while connecting to Cloudflare Worker'
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
// 4. Action: track-open (Email Open Pixel)
// ==========================================
async function handleTrackOpen(req: VercelRequest, res: VercelResponse) {
  const cId = req.query.cId as string;
  const email = req.query.email as string;

  if (cId && email) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Fetch current campaign
        const { data: campaign, error } = await supabase
          .from('sending_campaigns')
          .select('open_count, recipients')
          .eq('id', cId)
          .single();

        if (!error && campaign) {
          const recipients = campaign.recipients || [];
          const updatedRecipients = recipients.map((r: any) => {
            if (r.email && r.email.toLowerCase() === email.toLowerCase()) {
              if (!r.openedAt) {
                return { ...r, openedAt: new Date().toISOString() };
              }
            }
            return r;
          });

          // Increment count and update recipients
          await supabase
            .from('sending_campaigns')
            .update({
              open_count: (campaign.open_count || 0) + 1,
              recipients: updatedRecipients
            })
            .eq('id', cId);
        }
      } catch (dbErr) {
        console.error('Error tracking email open:', dbErr);
      }
    }
  }

  // Always return a tiny 1x1 transparent GIF
  const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': img.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  return res.end(img);
}

// ==========================================
// 5. Action: track-click (Link Click Tracking)
// ==========================================
async function handleTrackClick(req: VercelRequest, res: VercelResponse) {
  const cId = req.query.cId as string;
  const email = req.query.email as string;
  const url = req.query.url as string;

  if (cId && email) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch current campaign
        const { data: campaign, error } = await supabase
          .from('sending_campaigns')
          .select('click_count, recipients')
          .eq('id', cId)
          .single();

        if (!error && campaign) {
          const recipients = campaign.recipients || [];
          const updatedRecipients = recipients.map((r: any) => {
            if (r.email && r.email.toLowerCase() === email.toLowerCase()) {
              if (!r.clickedAt) {
                return { ...r, clickedAt: new Date().toISOString() };
              }
            }
            return r;
          });

          // Increment count and update recipients
          await supabase
            .from('sending_campaigns')
            .update({
              click_count: (campaign.click_count || 0) + 1,
              recipients: updatedRecipients
            })
            .eq('id', cId);
        }
      } catch (dbErr) {
        console.error('Error tracking email click:', dbErr);
      }
    }
  }

  // Redirect to destination URL
  const destinationUrl = url || '/';
  res.writeHead(302, { Location: destinationUrl });
  return res.end();
}

// ==========================================
// 2d. Action: send-ses (Amazon SES Send)
// ==========================================
async function handleSendAwsSes(req: VercelRequest, res: VercelResponse) {
  const { accessKeyId, secretAccessKey, region, from, to, subject, html } = req.body;

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ success: false, error: 'AWS Credentials (accessKeyId, secretAccessKey) are required.' });
  }
  if (!region) {
    return res.status(400).json({ success: false, error: 'AWS Region is required.' });
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
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject || 'Thông báo từ Ban Tổ Chức',
        },
      },
      Source: from,
    });

    const response = await sesClient.send(command);
    return res.status(200).json({
      success: true,
      messageId: response.MessageId,
      message: 'Email sent successfully via Amazon SES'
    });
  } catch (error: any) {
    console.error('[AWS SES Send Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while sending email via Amazon SES'
    });
  }
}

// ==========================================
// 2e. Action: send-smtp (Direct SMTP Send)
// ==========================================
async function handleSendSmtp(req: VercelRequest, res: VercelResponse) {
  const { smtpHost, smtpPort, smtpUser, smtpPass, from, senderName, to, subject, html } = req.body;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({ success: false, error: 'SMTP configuration (smtpHost, smtpUser, smtpPass) is required.' });
  }
  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient email (to) is required.' });
  }
  if (!html) {
    return res.status(400).json({ success: false, error: 'Email body (html) is required.' });
  }

  try {
    const isSecure = Number(smtpPort) === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: {
        name: senderName || "PARS 2026 BTC",
        address: from || smtpUser,
      },
      to,
      subject: subject || "Thư xác nhận PARS 2026",
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      server: smtpHost,
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

    console.error('[SMTP Send Error]:', err);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

// ==========================================
// Main Handler
// ==========================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const action = req.query.action;

  if (action === 'track-open' || action === 'track-click') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed for tracking' });
    }
  } else {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  if (action === 'send') {
    return handleSend(req, res);
  } else if (action === 'send-resend') {
    return handleSendResend(req, res);
  } else if (action === 'send-cloudflare') {
    return handleSendCloudflare(req, res);
  } else if (action === 'send-ses') {
    return handleSendAwsSes(req, res);
  } else if (action === 'send-smtp') {
    return handleSendSmtp(req, res);
  } else if (action === 'test-connection') {
    return handleTestConnection(req, res);
  } else if (action === 'track-open') {
    return handleTrackOpen(req, res);
  } else if (action === 'track-click') {
    return handleTrackClick(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid or missing action query parameter' });
  }
}
