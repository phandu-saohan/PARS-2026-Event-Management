import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transferContent, expectedAmount, test, apiToken } = req.query;

  const transferContentStr = Array.isArray(transferContent) ? transferContent[0] : transferContent;
  const expectedAmountStr = Array.isArray(expectedAmount) ? expectedAmount[0] : expectedAmount;
  const testStr = Array.isArray(test) ? test[0] : test;
  const apiTokenStr = Array.isArray(apiToken) ? apiToken[0] : apiToken;

  const isTest = testStr === 'true';

  try {
    let activeToken = apiTokenStr || '';

    // If token not passed, or we need configuration, fetch it from Supabase
    if (!activeToken) {
      if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Chưa cấu hình Supabase URL hoặc Service Role Key trên backend.' });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error: dbErr } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'sepay_config')
        .maybeSingle();

      if (dbErr) {
        console.error('[SePay Check] Supabase error:', dbErr);
        return res.status(500).json({ error: 'Không thể lấy cấu hình SePay từ cơ sở dữ liệu' });
      }

      if (!data || !data.value) {
        return res.status(400).json({ error: 'Không tìm thấy cấu hình SePay (sepay_config) trong cơ sở dữ liệu' });
      }

      const cfg = data.value;
      if (!isTest && !cfg.isEnabled) {
        return res.status(400).json({ error: 'SePay chưa được bật trong hệ thống.' });
      }

      activeToken = cfg.apiToken;
    }

    if (!activeToken) {
      return res.status(400).json({ error: 'Thiếu API Token để thực hiện kết nối.' });
    }

    // Helper to request from a specific API host
    const tryFetch = async (apiBase: string) => {
      const url = isTest
        ? `${apiBase}/v2/transactions?limit=1`
        : `${apiBase}/v2/transactions?q=${encodeURIComponent(transferContentStr?.substring(0, 50) || '')}&limit=20`;

      return await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      });
    };

    // 1. Try calling the Production endpoint first
    let fetchRes = await tryFetch('https://userapi.sepay.vn');

    // 2. If it returns 401, automatically fall back to the Sandbox endpoint
    if (fetchRes.status === 401) {
      console.log('[SePay Check] Production API returned 401, attempting Sandbox API fallback...');
      fetchRes = await tryFetch('https://userapi-sandbox.sepay.vn');
    }

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: `SePay API báo lỗi (${fetchRes.status}): ${errText}` });
    }

    const resData = await fetchRes.json();

    if (isTest) {
      const transactions = resData?.transactions || resData?.data || [];
      return res.json({ success: true, count: transactions.length });
    }

    // Normal check transaction matching logic
    if (!transferContentStr) {
      return res.status(400).json({ error: 'Thiếu thông tin nội dung chuyển khoản (transferContent)' });
    }

    const amount = expectedAmountStr ? Number(expectedAmountStr) : 0;
    const transactions: any[] = resData?.transactions || resData?.data || [];

    // Tìm giao dịch khớp số tiền (chênh lệch ≤ 1000đ để bù phí)
    const matched = transactions.find((t: any) => {
      const amt = Number(t.transferAmount ?? t.transfer_amount ?? 0);
      return Math.abs(amt - amount) <= 1000;
    });

    if (matched) {
      return res.json({
        found: true,
        transaction: {
          id: matched.id,
          gateway: matched.gateway || matched.bankCode || '',
          transactionDate: matched.transactionDate || matched.transaction_date || '',
          transferAmount: Number(matched.transferAmount ?? matched.transfer_amount ?? 0),
          content: matched.content || matched.transaction_content || '',
          referenceCode: matched.referenceCode || matched.reference_number || '',
        },
      });
    }

    return res.json({ found: false });
  } catch (err: any) {
    console.error('[SePay Check] Unhandled error:', err);
    return res.status(500).json({ error: err?.message || 'Lỗi kết nối khi gọi SePay API' });
  }
}
