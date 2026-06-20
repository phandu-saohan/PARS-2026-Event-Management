import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { appId, secretKey, refreshToken } = req.body;

  if (!appId || !secretKey || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Không đủ thông tin để cấp lại Token (Thiếu App ID, Secret Key hoặc Refresh Token).",
    });
  }

  // Bypass/mock if sandbox token is used
  if (refreshToken === 'zalo-refresh-token-active-2026-ready-pars') {
    return res.json({
      success: true,
      accessToken: "zalo-oa-token-refreshed-" + Math.floor(Math.random() * 90000 + 10000),
      refreshToken: "zalo-refresh-token-refreshed-" + Math.floor(Math.random() * 90000 + 10000),
      expiresIn: 86400, // 24 hours
      message: "Cấp mới Access Token Sandbox thành công (Mô phỏng)!",
    });
  }

  try {
    const oauthBase = process.env.ZALO_OAUTH_BASE_URL || "https://oauth.zaloapp.com";
    const zaloUrl = `${oauthBase}/v4/oa/access_token`;

    const fetchOptions: any = {
      method: "POST",
      headers: {
        "secret_key": secretKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        app_id: appId,
        grant_type: "refresh_token",
      }).toString(),
    };

    const proxyUrl = process.env.ZALO_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      try {
        const { ProxyAgent } = require('undici');
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
        console.log('[Zalo OAuth API] Routing via proxy:', proxyUrl);
      } catch (proxyErr) {
        console.error('[Zalo OAuth API] Failed to initialize ProxyAgent:', proxyErr);
      }
    }

    const response = await fetch(zaloUrl, fetchOptions);
    const resJson = await response.json();

    if (resJson && resJson.access_token) {
      return res.json({
        success: true,
        accessToken: resJson.access_token,
        refreshToken: resJson.refresh_token || refreshToken, // fallback if not returned
        expiresIn: resJson.expires_in,
        message: "Lấy Access Token mới thành công từ Zalo OAuth API Gateway!",
      });
    } else {
      return res.json({
        success: false,
        message: `Zalo OAuth trả về lỗi: ${resJson.error_description || resJson.message || JSON.stringify(resJson)}`,
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Lỗi kết nối cổng Zalo OAuth: ${err.message}`,
    });
  }
}
