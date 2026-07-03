import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apikey');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch webhook secret from dynamic settings (sepay_config) or fallback to env
    let webhookSecret = process.env.SEPAY_WEBHOOK_SECRET || '';
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('*')
          .eq('key', 'sepay_config')
          .maybeSingle();

        if (!error && data && data.value) {
          const config = data.value;
          if (config.webhookSecret) {
            webhookSecret = config.webhookSecret;
          }
        }
      } catch (dbErr) {
        console.error('[SePay Webhook] Failed to fetch config from Supabase:', dbErr);
      }
    }

    // Reject if no webhook secret configured — never process unauthenticated requests
    if (!webhookSecret) {
      console.error('[SePay Webhook] No webhook secret configured. Rejecting request.');
      return res.status(401).json({ success: false, message: 'Webhook secret not configured on server' });
    }

    // SePay sends webhook with header: Authorization: Apikey API_KEY
    const rawHeader = ((req.headers['authorization'] as string) || (req.headers['apikey'] as string) || '').trim();

    // Extract the key from "Apikey xxx" or use the raw value
    let incomingKey = rawHeader;
    const parts = rawHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'apikey') {
      incomingKey = parts[1];
    }

    if (!incomingKey || !safeEqual(incomingKey, webhookSecret)) {
      console.warn('[SePay Webhook] Unauthorized attempt from:', req.headers['x-forwarded-for'] || 'unknown');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('[SePay Webhook] Received payload:', JSON.stringify(payload));

    const {
      id: sepayId,
      transferAmount,
      transferType,
      content,
      transactionDate,
      gateway,
      referenceCode,
    } = payload;

    // Chỉ xử lý giao dịch tiền vào (in)
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Skipped outgoing transaction' });
    }

    if (!content || !transferAmount) {
      return res.status(200).json({ success: true, message: 'Missing content or amount' });
    }

    // Tìm attendee khớp nội dung chuyển khoản
    // Nội dung CK format: "NGUYEN VAN A 0901234567 DONG PHI THAM DU PARS 2026"
    // hoặc chứa attendee ID: "PARS2026-123456"
    const contentUpper = (content as string).toUpperCase().trim();

    // Tìm theo ID đại biểu trong nội dung (nếu có)
    const idMatch = contentUpper.match(/PARS2026-(\d+)/);

    let attendeeQuery = supabase.from('attendees').select('id, full_name, phone, package_fee, payment_status');

    if (idMatch) {
      attendeeQuery = attendeeQuery.eq('id', `PARS2026-${idMatch[1]}`);
    } else {
      // Tìm gần đúng theo số điện thoại trong nội dung
      const phoneMatch = contentUpper.match(/0[0-9]{9,10}/);
      if (phoneMatch) {
        attendeeQuery = attendeeQuery.ilike('phone', `%${phoneMatch[0]}%`);
      } else {
        return res.status(200).json({ success: true, message: 'Cannot match attendee from content' });
      }
    }

    const { data: attendees, error: queryErr } = await attendeeQuery.limit(5);

    if (queryErr || !attendees || attendees.length === 0) {
      console.warn('[SePay Webhook] No matching attendee found for content:', content);
      return res.status(200).json({ success: true, message: 'No matching attendee' });
    }

    // Chọn attendee có package_fee khớp nhất (chênh lệch ≤ 5000đ)
    const matched = attendees.find((a: any) => {
      const fee = Number(a.package_fee || 0);
      return Math.abs(fee - Number(transferAmount)) <= 5000;
    }) || attendees[0];

    if (matched.payment_status === 'paid') {
      return res.status(200).json({ success: true, message: 'Already marked as paid' });
    }

    // Cập nhật payment_status → paid
    const { error: updateErr } = await supabase
      .from('attendees')
      .update({
        payment_status: 'paid',
        payment_method: 'bank_transfer',
        notes: `SePay xác nhận tự động | GD #${sepayId} | ${gateway} | ${transactionDate} | Ref: ${referenceCode} | Số tiền: ${transferAmount.toLocaleString('vi-VN')}đ`,
      })
      .eq('id', matched.id);

    if (updateErr) {
      console.error('[SePay Webhook] Update failed:', updateErr);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    console.log(`[SePay Webhook] ✅ Marked attendee ${matched.id} (${matched.full_name}) as PAID. Amount: ${transferAmount}`);
    return res.status(200).json({ success: true, message: `Attendee ${matched.id} marked as paid` });

  } catch (err: any) {
    console.error('[SePay Webhook] Unhandled error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal error' });
  }
}
