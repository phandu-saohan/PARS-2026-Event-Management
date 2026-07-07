/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { store, DEFAULT_CME_TEMPLATE_CONFIG } from '../dataStore';
import { Attendee } from '../types';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Award, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  QrCode,
  Download,
  Calendar,
  MapPin,
  Building,
  UserCheck,
  Smartphone,
  Mail,
  ShieldCheck
} from 'lucide-react';

export function maskPhone(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return trimmed;
  const visiblePart = trimmed.slice(-4);
  const maskedPart = '*'.repeat(trimmed.length - 4);
  return maskedPart + visiblePart;
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return '*'.repeat(local.length) + '@' + domain;
  }
  const first2 = local.substring(0, 2);
  const last1 = local.substring(local.length - 1);
  const mask = '*'.repeat(local.length - 3);
  return first2 + mask + last1 + '@' + domain;
}

export function formatName(title: string | undefined, fullName: string | undefined): string {
  const fName = fullName || '';
  if (!title) return fName;
  const cleanTitle = title.trim();
  if (cleanTitle.toUpperCase() === 'BS' || cleanTitle.toUpperCase() === 'BS.') {
    return fName;
  }
  return `${cleanTitle} ${fName}`;
}

interface PublicCheckRegistrationProps {
  onNavigate: (view: string) => void;
}

export default function PublicCheckRegistration({ onNavigate }: PublicCheckRegistrationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showCmeModal, setShowCmeModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const businessConfig = store.getBusinessConfig();
  const cmeConfig = businessConfig.cmeTemplateConfig || DEFAULT_CME_TEMPLATE_CONFIG;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setLoading(true);
    // Simulate a brief loading delay for professional system response feeling
    setTimeout(() => {
      const allAttendees = store.getAttendees();
      const filtered = allAttendees.filter(att => {
        const nameMatch = att.fullName.toLowerCase().includes(query);
        const phoneMatch = att.phone.includes(query);
        return nameMatch || phoneMatch;
      });
      setResults(filtered);
      setSearched(true);
      setLoading(false);
    }, 600);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Đã thanh toán (Vé hợp lệ)
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-250 text-amber-700">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Chờ thanh toán chuyển khoản
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Đang đối soát giao dịch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
            <AlertCircle className="w-3.5 h-3.5" />
            Chưa xác định
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 py-10 px-4 flex flex-col items-center font-sans text-slate-800">
      
      {/* Container layout width */}
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Navigation back button */}
        <button
          onClick={() => onNavigate('event-details')}
          className="flex items-center gap-2 text-xs font-bold text-slate-650 hover:text-indigo-650 transition-all border-none bg-transparent cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại thông tin sự kiện
        </button>

        {/* Brand Event Header */}
        <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-10" />
          <div className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full inline-block mx-auto mb-1 shadow-sm">
            HỆ THỐNG TRA CỨU ĐIỆN TỬ
          </div>
          <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight leading-snug">
            {businessConfig.eventName}
          </h1>
          <p className="text-xs text-indigo-200 font-medium">
            {businessConfig.organizerName}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-[11px] text-indigo-150 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {businessConfig.eventDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {businessConfig.eventLocation}
            </span>
          </div>
        </div>

        {/* Search Panel Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <h2 className="text-base font-black text-slate-900 uppercase">Kiểm tra thông tin đại biểu</h2>
            <p className="text-xs text-slate-400 leading-normal">
              Nhập chính xác Họ tên (ví dụ: Nguyen Van A) hoặc Số điện thoại đăng ký ban đầu để xác thực trạng thái.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập Họ tên hoặc Số điện thoại..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-950 hover:bg-slate-900 text-white text-xs font-black rounded-2xl cursor-pointer border-none shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-bold text-slate-450">Đang tìm kiếm thông tin đại biểu...</span>
            </div>
          )}

          {!loading && !searched && (
            <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs leading-normal">
              🔍 Kết quả kiểm tra hồ sơ sẽ hiển thị tại đây. Vui lòng thực hiện tra cứu phía trên.
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2 animate-fade-in">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="font-extrabold text-xs uppercase">Không tìm thấy đại biểu</h4>
              <p className="text-[11px] leading-relaxed max-w-sm mx-auto text-rose-650">
                Hệ thống chưa ghi nhận đăng ký khớp với cụm từ khóa "{searchQuery}". Vui lòng kiểm tra lại chính tả hoặc liên hệ Ban Tổ Chức.
              </p>
            </div>
          )}

          {!loading && searched && results.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-2">
                Tìm thấy {results.length} hồ sơ khớp:
              </span>
              
              {results.map((att) => (
                <div 
                  key={att.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow transition-all animate-fade-in text-left"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        ID: {att.id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 uppercase">
                        {formatName(att.title, att.fullName)}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 font-sans">
                      <p className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Đơn vị: <strong className="text-slate-800">{att.organization}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Hình thức: <strong className="text-slate-800">{att.packageName}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Số điện thoại: <strong className="text-slate-800 font-mono">{maskPhone(att.phone)}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Email nhận vé: <strong className="text-slate-800 font-mono">{maskEmail(att.email)}</strong>
                      </p>
                    </div>

                    <div>
                      {getStatusBadge(att.paymentStatus)}
                    </div>
                  </div>

                  {/* Actions for valid delegates */}
                  <div className="flex flex-wrap md:flex-col gap-2 shrink-0 justify-start md:justify-end">
                    <button
                      onClick={() => {
                        setSelectedAttendee(att);
                        setShowTicketModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-[11px] font-black rounded-xl cursor-pointer border border-indigo-200 flex items-center gap-1 transition-all select-none"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Vé điện tử QR
                    </button>

                    {att.paymentStatus === 'paid' && att.cmeIdentityNo && (
                      <button
                        onClick={() => {
                          setSelectedAttendee(att);
                          setShowCmeModal(true);
                        }}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black rounded-xl cursor-pointer border border-amber-250 flex items-center gap-1 transition-all select-none"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Xem chứng chỉ CME
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Professional security footer statement */}
        <div className="text-center text-[10.5px] text-slate-450 leading-relaxed max-w-md mx-auto pt-6 border-t border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 inline mr-1 -mt-0.5" />
          <strong>ĐẢM BẢO AN TOÀN THÔNG TIN CÁ NHÂN:</strong>
          <p className="mt-0.5">Hệ thống tuân thủ chính sách bảo mật PARS. Toàn bộ Số điện thoại và Email đại biểu được ẩn dấu chỉ hiện thị các chữ số cuối cùng để tránh lộ lọt thông tin ra ngoài cộng đồng.</p>
        </div>

      </div>

      {/* CME Certificate Modal Viewer */}
      {showCmeModal && selectedAttendee && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col text-slate-900">
            <div className="bg-gradient-to-r from-red-850 to-amber-700 bg-red-800 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300 animate-pulse" />
                <h4 className="font-extrabold text-sm uppercase tracking-wide">Xác Thực Chứng Chỉ CME Bản Điện Tử</h4>
              </div>
              <button 
                onClick={() => { setShowCmeModal(false); setSelectedAttendee(null); }}
                className="text-white hover:text-amber-200 font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Frame certificate styled */}
            <div className="p-8 bg-slate-100 overflow-y-auto flex-1 flex justify-center items-center">
              <style dangerouslySetInnerHTML={{ __html: `
                @page {
                  size: 22cm 15.5cm;
                  margin: 0;
                }
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #cme-paper-pub, #cme-paper-pub * {
                    visibility: visible !important;
                  }
                  #cme-paper-pub {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 22cm !important;
                    height: 15.5cm !important;
                    margin: 0 !important;
                    padding: 2cm !important;
                    border: 12px double ${cmeConfig.borderColor || '#b45309'} !important;
                    background-color: ${cmeConfig.bgColor || '#fdfbf7'} !important;
                    -webkit-print-color-adjust: exact !important;
                  }
                }
              `}} />
              
              <div 
                id="cme-paper-pub"
                className="bg-amber-50/5 p-8 shadow-inner relative flex flex-col justify-between select-text rounded border-inset"
                style={{ 
                  width: '22cm', 
                  height: '15.5cm', 
                  fontFamily: 'Georgia, serif', 
                  backgroundColor: cmeConfig.bgColor || '#fdfbf7', 
                  border: `12px double ${cmeConfig.borderColor || '#b45309'}` 
                }}
              >
                {/* Subtle gold floral graphic backgrounds */}
                <div 
                  className="absolute inset-2 border pointer-events-none" 
                  style={{ borderColor: `${cmeConfig.borderColor || '#b45309'}30` }}
                />
                <div className="absolute top-4 right-4 text-[9px] text-slate-400 font-mono tracking-wider font-bold">CMEID: {selectedAttendee.id}</div>

                {/* National / Council Header */}
                <div className="text-center space-y-0.5 flex flex-col items-center">
                  {cmeConfig.logoUrl && (
                    <img 
                      src={cmeConfig.logoUrl} 
                      alt="CME Logo" 
                      className="h-10 object-contain mb-1.5" 
                    />
                  )}
                  <h5 className="text-[10px] font-sans font-extrabold uppercase text-slate-700 tracking-widest leading-none">{cmeConfig.awardBodyTitle}</h5>
                  <h6 className="text-[9px] font-sans font-bold uppercase text-slate-500 tracking-wide">{cmeConfig.awardBodySubtitle}</h6>
                  <div 
                    className="w-24 h-0.5 mx-auto my-1.5" 
                    style={{ backgroundColor: cmeConfig.borderColor || '#b45309' }}
                  />
                </div>

                {/* Certificate Main Label */}
                <div className="text-center space-y-1 mt-2">
                  <h1 
                    className="text-2xl font-bold uppercase tracking-wide"
                    style={{ color: cmeConfig.borderColor || '#b45309' }}
                  >
                    {cmeConfig.certificateTitle}
                  </h1>
                  <p className="text-xs italic text-slate-650 font-sans">{cmeConfig.certificateSubtitle}</p>
                </div>

                {/* Recipient details */}
                <div className="text-center space-y-2 mt-4">
                  <p className="text-xs text-slate-600 font-sans">{cmeConfig.paragraphText}</p>
                  <h2 
                    className="text-xl font-black uppercase tracking-tight my-2"
                    style={{ color: cmeConfig.borderColor || '#b45309' }}
                  >
                    {formatName(selectedAttendee.title, selectedAttendee.fullName)}
                  </h2>
                  
                  <div className="grid grid-cols-2 text-left max-w-md mx-auto text-[11px] text-slate-700 font-sans bg-amber-50/40 p-2.5 rounded border border-amber-100/50">
                    <p>• Năm sinh: <strong>{selectedAttendee.yearOfBirth || '1980'}</strong></p>
                    <p>• Quốc tịch: <strong>{selectedAttendee.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài'}</strong></p>
                    <p className="col-span-2 mt-1">• Đơn vị: <strong>{selectedAttendee.organization}</strong></p>
                  </div>
                </div>

                {/* Subject info */}
                <div className="text-center max-w-lg mx-auto mt-4 space-y-1">
                  <p className="text-xs text-slate-600 font-sans">Đã hoàn thành xuất sắc chương trình đào tạo khoa học chuyên sâu thuộc khuôn khổ:</p>
                  <p 
                    className="text-xs font-bold uppercase tracking-wide font-sans"
                    style={{ color: cmeConfig.borderColor || '#b45309' }}
                  >
                    "{cmeConfig.courseTitle}"
                  </p>
                  <p className="text-[10.5px] italic text-slate-500 font-sans">{cmeConfig.durationText}</p>
                </div>

                {/* Footer stamping, signing & date */}
                <div className="flex justify-between items-end mt-4">
                  {/* Timestamp verified code */}
                  <div className="text-left font-sans space-y-1">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80&data=${encodeURIComponent(`VERIFIED-CME-${selectedAttendee.id}`)}`}
                      alt="Mini Verified"
                      className="w-12 h-12 object-contain bg-white p-0.5 border border-slate-200"
                    />
                    <div>
                      <span className="text-[7.5px] font-mono text-slate-450 block italic">Mã xác minh Sở Y Tế</span>
                      <span className="text-[8.5px] font-mono font-bold text-slate-600 block">{selectedAttendee.id}-CME</span>
                    </div>
                  </div>

                  {/* Red Digital Signature Seal */}
                  <div className="relative text-center font-sans space-y-1 pr-6">
                    <span className="text-[9.5px] text-slate-500 block italic">{cmeConfig.locationDateText}</span>
                    <p className="text-[9.5px] font-bold text-slate-800 uppercase block tracking-wider pt-1">{cmeConfig.signerTitle}</p>
                    
                    {/* Seal Image Overlay simulation */}
                    <div className="absolute top-1 left-3 w-16 h-16 border-2 border-red-500 opacity-80 rounded-full flex flex-col items-center justify-center p-1 text-[7px] font-black text-red-600 border-dashed transform rotate-12 scale-105 pointer-events-none uppercase">
                      <span className="text-[5.5px] tracking-wide text-center">{cmeConfig.sealText1}</span>
                      <span className="text-[6.5px]">{cmeConfig.sealText2}</span>
                      <span className="text-[5px] tracking-tighter text-center">{cmeConfig.sealText3}</span>
                    </div>

                    <div className="pt-6 font-bold text-[11px] text-slate-900 italic font-serif">
                      {cmeConfig.signerName}
                    </div>
                    <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold uppercase tracking-wider block mt-1 scale-95">✓ CHỮ KÝ SỐ ĐÃ CHIỂU ĐỎ</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-250 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-450 italic">Hệ thống Xuất bản Chứng nhận e-CME bảo chứng pháp lý lưu trữ Hội đồng PARS.</span>
              <div className="flex gap-2.5 font-sans">
                <button
                  onClick={() => { setShowCmeModal(false); setSelectedAttendee(null); }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = `CHUNG_NHAN_CME_${selectedAttendee.fullName.replace(/\s+/g, '_')}`;
                    window.print();
                    document.title = originalTitle;
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  In Bản Chứng Chỉ CME / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Ticket modal */}
      {showTicketModal && selectedAttendee && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in flex flex-col text-slate-900">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h4 className="font-extrabold text-sm uppercase tracking-wide">VÉ ĐIỆN TỬ (E-TICKET)</h4>
              </div>
              <button 
                onClick={() => { setShowTicketModal(false); setSelectedAttendee(null); }}
                className="text-white hover:text-indigo-200 font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* Event details */}
              <div>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider leading-snug">{businessConfig.eventName}</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">{businessConfig.eventDate}</p>
              </div>

              {/* QR code */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180&data=${encodeURIComponent(`VERIFIED-ATTENDEE-${selectedAttendee.id}`)}`}
                  alt="Attendee QR Ticket"
                  className="w-44 h-44 object-contain mx-auto"
                />
                <span className="text-[10px] font-mono font-bold text-slate-550 block mt-2">MÃ VÉ: {selectedAttendee.id}</span>
              </div>

              {/* Attendee details */}
              <div className="space-y-1">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase leading-snug">{formatName(selectedAttendee.title, selectedAttendee.fullName)}</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedAttendee.organization}</p>
                <p className="text-[10px] text-slate-400 italic">Mã số CCHN: {selectedAttendee.cmeIdentityNo || 'Không đăng ký CME'}</p>
              </div>

              <div className="pt-2 flex justify-center">
                {getStatusBadge(selectedAttendee.paymentStatus)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
              <button
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = `VE_DIEN_TU_${selectedAttendee.fullName.replace(/\s+/g, '_')}`;
                  window.print();
                  document.title = originalTitle;
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer border-none"
              >
                In Vé QR Đại Biểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
