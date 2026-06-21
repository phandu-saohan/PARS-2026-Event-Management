import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/token-refresh
 * Unified Token Refresh Handler for Marketing Channels
 * 
 * Supports: zalo | tiktok | youtube | facebook
 * Method: POST
 * Body: { platform, ...credFields }
 * 
 * Automatically saves refreshed tokens back to Supabase system_config.
 */

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

async function saveTokensToSupabase(
  platform: string,
  updates: Record<string, string>
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('[token-refresh] Supabase not configured — skipping DB save');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'marketing_channels_config')
      .single();

    if (error || !data) {
      console.error('[token-refresh] Could not read marketing_channels_config:', error);
      return;
    }

    const config = data.value as Record<string, any>;
    config[platform] = { ...config[platform], ...updates };

    await supabase
      .from('system_config')
      .update({ value: config })
      .eq('key', 'marketing_channels_config');

    console.log(`[token-refresh] ✅ Saved refreshed ${platform.toUpperCase()} token to Supabase`);
  } catch (e: any) {
    console.error('[token-refresh] Error saving to Supabase:', e.message);
  }
}

// ─────────────────────────────────────────────
// 1. ZALO — OAuth v4 Refresh Token
//    POST https://oauth.zaloapp.com/v4/oa/access_token
// ─────────────────────────────────────────────
async function refreshZalo(body: any, res: VercelResponse) {
  const { appId, secretKey, refreshToken } = body;

  if (!appId || !secretKey || !refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu appId, secretKey hoặc refreshToken cho Zalo.',
    });
  }

  try {
    const base = process.env.ZALO_OAUTH_BASE_URL || 'https://oauth.zaloapp.com';
    const response = await fetch(`${base}/v4/oa/access_token`, {
      method: 'POST',
      headers: {
        'secret_key': secretKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        app_id: appId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    const json = await response.json() as any;

    if (!json.access_token) {
      return res.json({
        success: false,
        error: `Zalo OAuth lỗi: ${json.error_description || json.message || JSON.stringify(json)}`,
      });
    }

    const tokenExpiresAt = new Date(
      Date.now() + (json.expires_in || 86400) * 1000
    ).toISOString();

    await saveTokensToSupabase('zalo', {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      tokenExpiresAt,
    });

    return res.json({
      success: true,
      platform: 'zalo',
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      expiresIn: json.expires_in,
      tokenExpiresAt,
      message: '✅ Zalo Access Token đã được làm mới thành công!',
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// 2. TIKTOK — OAuth v2 Refresh Token
//    POST https://open.tiktokapis.com/v2/oauth/token/
// ─────────────────────────────────────────────
async function refreshTikTok(body: any, res: VercelResponse) {
  const { clientKey, clientSecret, refreshToken } = body;

  if (!clientKey || !clientSecret || !refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu clientKey, clientSecret hoặc refreshToken cho TikTok.',
    });
  }

  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    const json = await response.json() as any;

    if (json.error) {
      return res.json({
        success: false,
        error: `TikTok OAuth lỗi: ${json.error_description || json.error}`,
      });
    }

    const tokenExpiresAt = new Date(
      Date.now() + (json.expires_in || 86400) * 1000
    ).toISOString();

    await saveTokensToSupabase('tiktok', {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      tokenExpiresAt,
    });

    return res.json({
      success: true,
      platform: 'tiktok',
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      expiresIn: json.expires_in,
      tokenExpiresAt,
      message: '✅ TikTok Access Token đã được làm mới thành công!',
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// 3. YOUTUBE (Google OAuth 2.0) — Refresh Token
//    POST https://oauth2.googleapis.com/token
// ─────────────────────────────────────────────
async function refreshYouTube(body: any, res: VercelResponse) {
  const { clientId, clientSecret, refreshToken } = body;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu clientId, clientSecret hoặc refreshToken cho YouTube.',
    });
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    const json = await response.json() as any;

    if (json.error) {
      return res.json({
        success: false,
        error: `Google OAuth lỗi: ${json.error_description || json.error}`,
      });
    }

    // Google does not rotate refresh tokens by default
    const tokenExpiresAt = new Date(
      Date.now() + (json.expires_in || 3600) * 1000
    ).toISOString();

    await saveTokensToSupabase('youtube', {
      accessToken: json.access_token,
      tokenExpiresAt,
    });

    return res.json({
      success: true,
      platform: 'youtube',
      accessToken: json.access_token,
      refreshToken,  // Google keeps same refresh token
      expiresIn: json.expires_in,
      tokenExpiresAt,
      message: '✅ YouTube (Google) Access Token đã được làm mới thành công!',
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// 4. FACEBOOK — Extend Long-Lived Token
//    Facebook does not have a standard refresh_token.
//    Instead, exchange a short-lived token for a 60-day long-lived token.
//    GET https://graph.facebook.com/oauth/access_token
// ─────────────────────────────────────────────
async function refreshFacebook(body: any, res: VercelResponse) {
  const { appId, appSecret, shortLivedToken } = body;

  if (!appId || !appSecret || !shortLivedToken) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu appId, appSecret hoặc shortLivedToken cho Facebook.',
    });
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
    );
    const json = await response.json() as any;

    if (json.error) {
      return res.json({
        success: false,
        error: `Facebook Graph lỗi: ${json.error.message || JSON.stringify(json.error)}`,
      });
    }

    const tokenExpiresAt = new Date(
      Date.now() + (json.expires_in || 5184000) * 1000
    ).toISOString();

    await saveTokensToSupabase('facebook', {
      pageAccessToken: json.access_token,
      tokenExpiresAt,
    });

    return res.json({
      success: true,
      platform: 'facebook',
      accessToken: json.access_token,
      expiresIn: json.expires_in,
      tokenExpiresAt,
      message: '✅ Facebook Long-Lived Token đã được gia hạn thành công (60 ngày)!',
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { platform, ...rest } = req.body || {};

  switch (platform) {
    case 'zalo':    return refreshZalo({ ...rest }, res);
    case 'tiktok':  return refreshTikTok({ ...rest }, res);
    case 'youtube': return refreshYouTube({ ...rest }, res);
    case 'facebook': return refreshFacebook({ ...rest }, res);
    default:
      return res.status(400).json({
        error: 'Invalid platform. Supported: zalo | tiktok | youtube | facebook',
      });
  }
}
