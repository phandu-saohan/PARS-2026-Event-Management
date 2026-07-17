/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PaymentMethodSelector — Chọn phương thức thanh toán
 * - Trong nước (VN): VietQR, VNPay QR
 * - Quốc tế: Stripe Checkout (Visa / Mastercard)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Smartphone, Building2, Globe, ChevronRight, CheckCircle2, Lock, Shield } from 'lucide-react';
import { PaymentGatewayConfig } from '../types';

export type PaymentMethodId = 'bank_transfer' | 'vnpay' | 'stripe';

interface PaymentMethodSelectorProps {
  nationality: 'vietname' | 'foreign';
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
  paymentConfig?: PaymentGatewayConfig;
  totalFee: number; // VNĐ
  lang: 'vi' | 'en';
}

// ── Hằng số logo / màu sắc ──────────────────────────────────────────────────

const VIETQR_LOGO = (
  <svg viewBox="0 0 48 24" className="h-5 w-auto" fill="none">
    <rect width="48" height="24" rx="4" fill="#E31837" />
    <text x="6" y="17" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="white">Viet</text>
    <text x="28" y="17" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="#FFD700">QR</text>
  </svg>
);

const VNPAY_LOGO = (
  <svg viewBox="0 0 64 24" className="h-5 w-auto" fill="none">
    <rect width="64" height="24" rx="4" fill="#0066CC" />
    <text x="8" y="17" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white">VNPay</text>
  </svg>
);

const VISA_LOGO = (
  <svg viewBox="0 0 40 24" className="h-5 w-auto" fill="none">
    <rect width="40" height="24" rx="4" fill="#1A1F71" />
    <text x="5" y="17" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white" letterSpacing="1">VISA</text>
  </svg>
);

const MASTERCARD_LOGO = (
  <svg viewBox="0 0 36 24" className="h-5 w-auto" fill="none">
    <rect width="36" height="24" rx="4" fill="#222222" />
    <circle cx="13" cy="12" r="8" fill="#EB001B" />
    <circle cx="23" cy="12" r="8" fill="#F79E1B" opacity="0.85" />
  </svg>
);

// ── Interfaces ───────────────────────────────────────────────────────────────

interface PaymentOption {
  id: PaymentMethodId;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  group: 'domestic' | 'international';
  badge?: string;
  badgeColor?: string;
  logos: React.ReactNode[];
  isAvailable: (cfg?: PaymentGatewayConfig) => boolean;
  unavailableHint?: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'bank_transfer',
    nameVi: 'Chuyển khoản VietQR',
    nameEn: 'VietQR Bank Transfer',
    descVi: 'Quét mã QR bằng bất kỳ ứng dụng ngân hàng nào. Tự động điền nội dung & số tiền.',
    descEn: 'Scan QR with any banking app. Amount & note are pre-filled automatically.',
    group: 'domestic',
    badge: 'Khuyên dùng',
    badgeColor: 'bg-teal-100 text-teal-800 border border-teal-200',
    logos: [VIETQR_LOGO],
    isAvailable: (cfg) => cfg?.vietqr?.isEnabled !== false, // mặc định bật
  },
  {
    id: 'vnpay',
    nameVi: 'VNPay QR',
    nameEn: 'VNPay QR',
    descVi: 'Thanh toán bằng ví VNPay hoặc ngân hàng liên kết VNPay trên điện thoại.',
    descEn: 'Pay via VNPay wallet or VNPay-linked bank account on mobile.',
    group: 'domestic',
    logos: [VNPAY_LOGO],
    isAvailable: (cfg) => cfg?.vnpay?.isEnabled === true,
    unavailableHint: 'Chưa cấu hình — Admin cần bật VNPay trong Cài đặt.',
  },
  {
    id: 'stripe',
    nameVi: 'Thẻ Visa / Mastercard',
    nameEn: 'Visa / Mastercard Card',
    descVi: 'Thanh toán quốc tế an toàn qua cổng Stripe. Hỗ trợ thẻ Visa, Mastercard toàn cầu.',
    descEn: 'Secure international payment via Stripe. Supports Visa, Mastercard worldwide.',
    group: 'international',
    badge: 'International',
    badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    logos: [VISA_LOGO, MASTERCARD_LOGO],
    isAvailable: (cfg) => cfg?.stripe?.isEnabled === true && !!cfg?.stripe?.publishableKey,
    unavailableHint: 'Chưa cấu hình — Admin cần bật Stripe trong Cài đặt.',
  },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function PaymentMethodSelector({
  nationality,
  selectedMethod,
  onSelect,
  paymentConfig,
  totalFee,
  lang,
}: PaymentMethodSelectorProps) {
  const t = (vi: string, en: string) => lang === 'en' ? en : vi;
  const defaultTab = nationality === 'foreign' ? 'international' : 'domestic';
  const [activeTab, setActiveTab] = useState<'domestic' | 'international'>(defaultTab);

  const domesticOptions = useMemo(() => PAYMENT_OPTIONS.filter(o => o.group === 'domestic' && o.isAvailable(paymentConfig)), [paymentConfig]);
  const intlOptions = useMemo(() => PAYMENT_OPTIONS.filter(o => o.group === 'international' && o.isAvailable(paymentConfig)), [paymentConfig]);
  const currentOptions = activeTab === 'domestic' ? domesticOptions : intlOptions;

  useEffect(() => {
    // If the currently selected method is not available in the active tab's list of options,
    // automatically select the first available option (if any).
    const isSelectedAvailable = currentOptions.some(o => o.id === selectedMethod);
    if (!isSelectedAvailable && currentOptions.length > 0) {
      onSelect(currentOptions[0].id);
    }
  }, [activeTab, selectedMethod, currentOptions, onSelect]);

  const totalUSD = Math.round(totalFee / 25000);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
        <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">04</span>
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          {t('Phương Thức Thanh Toán', 'Payment Method')}
        </h3>
      </div>

      {/* Tab toggle Trong nước / Quốc tế */}
      <div className="inline-flex bg-slate-100 rounded-xl p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('domestic')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'domestic'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          {t('Trong nước 🇻🇳', 'Domestic 🇻🇳')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('international')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'international'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          {t('Quốc tế 🌍', 'International 🌍')}
        </button>
      </div>

      {/* Amount display */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {t('Tổng phí cần thanh toán', 'Total amount due')}
        </span>
        <div className="text-right">
          <span className="font-mono font-black text-sm text-teal-900">{totalFee.toLocaleString()} VNĐ</span>
          {activeTab === 'international' && (
            <span className="text-[10px] text-slate-400 block font-mono">≈ ${totalUSD} USD</span>
          )}
        </div>
      </div>

      {/* Payment options list */}
      <div className="space-y-3">
        {currentOptions.map((option) => {
          const available = option.isAvailable(paymentConfig);
          const isSelected = selectedMethod === option.id;

          return (
            <div
              key={option.id}
              onClick={() => available && onSelect(option.id)}
              className={`relative rounded-2xl border-2 transition-all select-none ${
                !available
                  ? 'opacity-50 cursor-not-allowed border-slate-150 bg-slate-50'
                  : isSelected
                  ? 'border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/15 shadow-md cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-slate-900">
                      {lang === 'en' ? option.nameEn : option.nameVi}
                    </span>
                    {option.badge && available && (
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${option.badgeColor}`}>
                        {option.badge}
                      </span>
                    )}
                    {!available && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Chưa kích hoạt
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    {!available && option.unavailableHint
                      ? option.unavailableHint
                      : lang === 'en' ? option.descEn : option.descVi}
                  </p>
                </div>

                {/* Logos */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {option.logos.map((logo, i) => (
                    <span key={i}>{logo}</span>
                  ))}
                </div>
              </div>

              {/* Stripe security badge */}
              {option.id === 'stripe' && available && isSelected && (
                <div className="border-t border-slate-100 px-4 py-2 bg-white/50 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    {t('Thanh toán bảo mật 256-bit SSL qua Stripe — thông tin thẻ không lưu trên máy chủ của BTC.', 'Secured by 256-bit SSL via Stripe — card details never stored on organizer servers.')}
                  </span>
                  <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VNPay notice when selected */}
      {selectedMethod === 'vnpay' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-[10.5px] text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            {t('Hướng dẫn thanh toán VNPay', 'VNPay Payment Instructions')}
          </p>
          <p>1. {t('Mở ứng dụng ngân hàng / VNPay trên điện thoại', 'Open your banking / VNPay app on mobile')}</p>
          <p>2. {t('Quét mã QR VNPay sẽ hiển thị ở bước tiếp theo', 'Scan the VNPay QR code shown in the next step')}</p>
          <p>3. {t('Xác nhận thanh toán và tải lên biên lai', 'Confirm payment and upload receipt')}</p>
        </div>
      )}

      {/* Stripe notice when selected */}
      {selectedMethod === 'stripe' && paymentConfig?.stripe?.isEnabled && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-[10.5px] text-indigo-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            {t('Thanh toán thẻ Visa / Mastercard qua Stripe', 'Pay with Visa / Mastercard via Stripe')}
          </p>
          <p>{t('Sau khi nhấn "Xác nhận đăng ký", bạn sẽ được chuyển sang trang thanh toán bảo mật của Stripe. Thông tin đăng ký đã lưu — bạn sẽ được redirect về sau khi thanh toán xong.', 'After clicking "Confirm Registration", you will be redirected to Stripe\'s secure checkout page. Your registration will be saved — you\'ll be redirected back after payment.')}</p>
          <div className="flex items-center gap-3 pt-1">
            {VISA_LOGO}
            {MASTERCARD_LOGO}
            <span className="text-[9px] font-mono text-indigo-400">Powered by Stripe</span>
          </div>
        </div>
      )}

      {/* VietQR live preview when selected */}
      {selectedMethod === 'bank_transfer' && paymentConfig?.vietqr && totalFee > 0 && (
        <div className="text-[10px] text-slate-400 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 inline mr-1" />
          {t('Mã VietQR sẽ hiển thị ở bước hoàn tất đăng ký', 'VietQR code will appear after registration is confirmed')}
        </div>
      )}

      {/* International notice */}
      {activeTab === 'international' && !paymentConfig?.stripe?.isEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[10.5px] text-amber-900">
          <p className="font-bold mb-1">
            {t('💳 Thanh toán quốc tế chưa được kích hoạt', '💳 International payment not yet activated')}
          </p>
          <p>{t('Đối với đại biểu quốc tế, vui lòng liên hệ Ban Tổ Chức để được hướng dẫn thanh toán qua chuyển khoản SWIFT hoặc thẻ tín dụng. Email: info@pars.vn', 'For international delegates, please contact the Organizer for SWIFT bank transfer or credit card payment guidance. Email: info@pars.vn')}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-amber-600" />
            <a href="mailto:info@pars.vn" className="font-bold underline text-amber-800">info@pars.vn</a>
          </div>
        </div>
      )}
    </div>
  );
}
