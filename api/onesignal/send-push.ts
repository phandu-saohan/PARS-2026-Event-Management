import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { title, message, isTest } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Missing title or message' });
    }

    // 1. Fetch OneSignal config from database or fallback to environment variables
    let appId = process.env.ONESIGNAL_APP_ID || '';
    let restApiKey = process.env.ONESIGNAL_REST_API_KEY || '';
    let isEnabled = true;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'onesignal_config')
        .maybeSingle();

      if (!error && data && data.value) {
        const config = data.value;
        if (config.appId) appId = config.appId;
        if (config.restApiKey) restApiKey = config.restApiKey;
        if (config.isEnabled !== undefined) isEnabled = config.isEnabled;
      }
    }

    if (!isEnabled && !isTest) {
      return res.json({ success: true, message: 'OneSignal integration is disabled' });
    }

    if (!appId || !restApiKey) {
      console.warn('[OneSignal API] App ID or REST API Key is missing');
      return res.status(400).json({ success: false, message: 'OneSignal configurations are missing' });
    }

    // 2. Call OneSignal HTTP REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        headings: { vi: title, en: title },
        contents: { vi: message, en: message },
        included_segments: ['All'],
      }),
    });

    const responseData = await response.json();
    console.log('[OneSignal API] Response data:', responseData);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: responseData.errors?.[0] || 'OneSignal API request failed',
        details: responseData,
      });
    }

    return res.json({ success: true, response: responseData });
  } catch (err: any) {
    console.error('[OneSignal API] Unhandled error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}
