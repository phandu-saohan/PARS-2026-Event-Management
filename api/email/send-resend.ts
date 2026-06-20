import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
