import type { VercelRequest, VercelResponse } from '@vercel/node';
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
