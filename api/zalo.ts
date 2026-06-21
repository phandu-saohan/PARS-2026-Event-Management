import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. Action: send (Zalo OA Template Send)
// ==========================================
async function handleSend(req: VercelRequest, res: VercelResponse) {
  let { config, payload } = req.body;

  if (!config || !config.accessToken) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'zalo_config')
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
        console.error('Error fetching Zalo config from Supabase:', dbErr);
      }
    }
  }

  if (!config || !config.accessToken) {
    return res.status(400).json({
      success: false,
      error: "Zalo access token is required.",
    });
  }

  try {
    const apiBase = process.env.ZALO_API_BASE_URL || "https://business.openapi.zalo.me";
    const zaloUrl = `${apiBase}/message/template`;

    const phone = payload.phone || (payload.recipient && payload.recipient.phone);
    let phoneStr = String(phone || '').replace(/[^0-9+]/g, '');
    if (phoneStr.startsWith('0')) {
      phoneStr = '84' + phoneStr.substring(1);
    }

    const requestBody: any = {
      phone: phoneStr,
      template_id: payload.template_id,
      template_data: payload.template_data,
      tracking_id: payload.tracking_id || `tracking_${Date.now()}`
    };

    if (payload.sending_mode) {
      requestBody.sending_mode = payload.sending_mode;
    }

    const fetchOptions: any = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": config.accessToken,
      },
      body: JSON.stringify(requestBody),
    };

    const proxyUrl = process.env.ZALO_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      try {
        const { ProxyAgent } = require('undici');
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
        console.log('[Zalo Send API] Routing via proxy:', proxyUrl);
      } catch (proxyErr) {
        console.error('[Zalo Send API] Failed to initialize ProxyAgent:', proxyErr);
      }
    }

    const response = await fetch(zaloUrl, fetchOptions);
    const resJson = await response.json();
    return res.json({
      success: true,
      data: resJson,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to establish connect to Zalo OpenAPI",
    });
  }
}

// ==========================================
// 2. Action: verify-token (Verify OA Token Status)
// ==========================================
async function handleVerifyToken(req: VercelRequest, res: VercelResponse) {
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

// ==========================================
// 3. Action: refresh-token (OAuth Token Refresh)
// ==========================================
async function handleRefreshToken(req: VercelRequest, res: VercelResponse) {
  const { appId, secretKey, refreshToken } = req.body;

  if (!appId || !secretKey || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Không đủ thông tin để cấp lại Token (Thiếu App ID, Secret Key hoặc Refresh Token).",
    });
  }

  if (refreshToken === 'zalo-refresh-token-active-2026-ready-pars') {
    return res.json({
      success: true,
      accessToken: "zalo-oa-token-refreshed-" + Math.floor(Math.random() * 90000 + 10000),
      refreshToken: "zalo-refresh-token-refreshed-" + Math.floor(Math.random() * 90000 + 10000),
      expiresIn: 86400,
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
        refreshToken: resJson.refresh_token || refreshToken,
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

// ==========================================
// 4. Action: create-article (Create Zalo OA Article Feed)
// ==========================================
async function handleCreateArticle(req: VercelRequest, res: VercelResponse) {
  const { accessToken, title, description, bodyText, coverUrl } = req.body;

  if (!accessToken || !title) {
    return res.status(400).json({
      success: false,
      message: "Thiếu Access Token hoặc tiêu đề bài viết."
    });
  }

  try {
    const apiBase = process.env.ZALO_API_BASE_URL || "https://openapi.zalo.me";
    const zaloUrl = `${apiBase}/v2.0/oa/article/create`;

    const articlePayload = {
      type: "normal",
      title: title,
      author: "Ban Tổ Chức PARS 2026",
      cover: {
        cover_type: "photo",
        photo_url: coverUrl || "https://pars2026.vercel.app/pwa-192x192.png",
        status: "show"
      },
      description: description || title,
      body: [
        {
          type: "text",
          content: bodyText || description || title
        }
      ],
      status: "show"
    };

    const fetchOptions: any = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": accessToken
      },
      body: JSON.stringify(articlePayload)
    };

    const proxyUrl = process.env.ZALO_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      try {
        const { ProxyAgent } = require('undici');
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
      } catch (proxyErr) {
        console.error('[Zalo Create Article API] Failed to initialize ProxyAgent:', proxyErr);
      }
    }

    const response = await fetch(zaloUrl, fetchOptions);
    const resJson = await response.json();

    if (resJson.error === 0) {
      return res.json({
        success: true,
        data: resJson.data,
        message: "Tạo bài đăng Zalo OA thành công!"
      });
    } else {
      return res.json({
        success: false,
        message: `Zalo trả về lỗi mã ${resJson.error}: ${resJson.message || "Không thể tạo bài đăng"}`
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Không kết nối được Zalo API: ${err.message}`
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
  } else if (action === 'verify-token') {
    return handleVerifyToken(req, res);
  } else if (action === 'refresh-token') {
    return handleRefreshToken(req, res);
  } else if (action === 'create-article') {
    return handleCreateArticle(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid or missing action query parameter' });
  }
}
