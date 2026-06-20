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

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ success: false, message: "Token rỗng." });
  }

  try {
    const apiBase = process.env.ZALO_API_BASE_URL || "https://openapi.zalo.me";
    const zaloUrl = `${apiBase}/v2.0/oa/getoa`;

    const fetchOptions: any = {
      method: "GET",
      headers: {
        "access_token": accessToken,
      },
    };

    const proxyUrl = process.env.ZALO_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      try {
        const { ProxyAgent } = require('undici');
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
        console.log('[Zalo Verify API] Routing via proxy:', proxyUrl);
      } catch (proxyErr) {
        console.error('[Zalo Verify API] Failed to initialize ProxyAgent:', proxyErr);
      }
    }

    // Get OA profile is the standard way to verify if access token is working
    const response = await fetch(zaloUrl, fetchOptions);
    const resJson = await response.json();

    if (resJson.error === 0) {
      return res.json({
        success: true,
        message: `Xác thực thành công OA: ${resJson.data?.name || "Zalo OA Active"}`,
      });
    } else {
      return res.json({
        success: false,
        message: `Zalo trả về lỗi mã ${resJson.error}: ${resJson.message || "Token không hợp lệ"}`,
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Không kết nối được Zalo API: ${err.message}`,
    });
  }
}
