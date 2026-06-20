/**
 * SepayPaymentChecker Component
 * Hiển thị nút kiểm tra thanh toán SePay trên trang xác nhận đăng ký.
 * Polling SePay API v2 theo nội dung chuyển khoản và số tiền.
 */
import React, { useState, useEffect, useRef } from 'react';
import { store } from '../dataStore';

interface SepayPaymentCheckerProps {
  transferContent: string;
  expectedAmount: number;
  attendeeId: string;
}

type CheckStatus = 'idle' | 'checking' | 'found' | 'not_found' | 'error';

export default function SepayPaymentChecker({
  transferContent,
  expectedAmount,
  attendeeId,
}: SepayPaymentCheckerProps) {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [message, setMessage] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoPolling, setAutoPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 8;
  const POLL_INTERVAL = 30000; // 30 giây

  const checkPayment = async () => {
    if (status === 'found') return;
    setStatus('checking');

    const result = await store.checkSepayPayment(transferContent, expectedAmount);

    if (result.found && result.transaction) {
      setStatus('found');
      setTransaction(result.transaction);
      setAutoPolling(false);
      setMessage(`✅ Giao dịch xác nhận! ${result.transaction.gateway} — ${Number(result.transaction.transferAmount).toLocaleString('vi-VN')}đ — ${result.transaction.transactionDate}`);

      // Cập nhật payment_status trên Supabase
      try {
        await store.updateAttendeeField(attendeeId, {
          payment_status: 'paid',
          notes: `SePay xác nhận | GD #${result.transaction.id} | ${result.transaction.gateway} | ${result.transaction.transactionDate} | Ref: ${result.transaction.referenceCode}`,
        });
      } catch (err) {
        console.warn('SePay: Không thể cập nhật payment_status tự động:', err);
      }
    } else if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('not_found');
      setRetryCount(prev => prev + 1);
      setMessage('Chưa tìm thấy giao dịch khớp. Vui lòng thử lại sau khi chuyển khoản hoàn tất.');
    }
  };

  // Auto-polling khi bật
  useEffect(() => {
    if (autoPolling && status !== 'found') {
      if (retryCount >= MAX_RETRIES) {
        setAutoPolling(false);
        setStatus('not_found');
        setMessage(`Đã kiểm tra ${MAX_RETRIES} lần nhưng chưa tìm thấy giao dịch. BTC sẽ xét duyệt thủ công trong vòng 24h.`);
        return;
      }
      pollRef.current = setTimeout(() => {
        checkPayment();
      }, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [autoPolling, retryCount, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor = {
    idle: 'bg-slate-50 border-slate-200 text-slate-700',
    checking: 'bg-blue-50 border-blue-200 text-blue-800',
    found: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    not_found: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
  }[status];

  return (
    <div className={`mt-4 p-4 rounded-2xl border ${statusColor} transition-all`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-black text-[11px] uppercase tracking-wider">
            💳 Xác Nhận Thanh Toán Tự Động (SePay)
          </p>
          {status === 'idle' && (
            <p className="text-[10px] mt-0.5 opacity-70">
              Sau khi chuyển khoản xong, nhấn nút để hệ thống xác nhận ngay lập tức.
            </p>
          )}
          {status === 'checking' && (
            <p className="text-[10px] mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Đang kiểm tra giao dịch trên SePay...
            </p>
          )}
          {message && status !== 'idle' && status !== 'checking' && (
            <p className="text-[10.5px] mt-1 font-medium leading-relaxed">{message}</p>
          )}
          {status === 'found' && transaction && (
            <div className="mt-2 text-[10px] space-y-0.5">
              <p>🏦 Ngân hàng: <strong>{transaction.gateway}</strong></p>
              <p>💰 Số tiền: <strong>{Number(transaction.transferAmount).toLocaleString('vi-VN')}đ</strong></p>
              <p>📅 Thời gian: <strong>{transaction.transactionDate}</strong></p>
              <p>🔖 Mã GD: <strong className="font-mono">{transaction.referenceCode || transaction.id}</strong></p>
            </div>
          )}
          {autoPolling && status === 'not_found' && (
            <p className="text-[9.5px] mt-1 opacity-60">
              Tự động kiểm tra lại sau 30 giây... (lần {retryCount}/{MAX_RETRIES})
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {status !== 'found' && (
            <button
              type="button"
              disabled={status === 'checking'}
              onClick={() => {
                setAutoPolling(true);
                checkPayment();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-sm"
            >
              {status === 'checking' ? '⏳ Đang kiểm tra...' : '🔍 Kiểm tra ngay'}
            </button>
          )}
          {autoPolling && status !== 'found' && (
            <button
              type="button"
              onClick={() => setAutoPolling(false)}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold rounded-xl cursor-pointer border-solid"
            >
              Dừng
            </button>
          )}
        </div>
      </div>

      {status === 'not_found' && !autoPolling && retryCount > 0 && retryCount < MAX_RETRIES && (
        <p className="text-[9.5px] mt-2 opacity-60 text-center">
          Nội dung CK khớp: <code className="bg-white/60 px-1 rounded">{transferContent.substring(0, 40)}...</code>
        </p>
      )}
    </div>
  );
}
