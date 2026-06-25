/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Upload, ShieldCheck, HeartHandshake, Check, Landmark, HelpCircle } from 'lucide-react';
import { store } from '../dataStore';
import { sendRealtimeNotification } from '../lib/realtime';
import { Sponsor } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import { useFormLabel } from '../hooks/useFormLabel';

interface PublicSponsorRegisterProps {
  onNavigate: (view: string) => void;
}

const SPONSOR_TIERS = [
  {
    id: 'diamond',
    name: 'Kim Cương',
    nameEn: 'Diamond Partner',
    fee: 600000000,
    color: '#6366f1',
    benefits: [
      'Tặng 50 vé tham dự Gala',
      'Tặng 3 vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): 2 suất',
      'Đại biểu đăng ký qua nhà tài trợ: Giảm 25%',
      'Gian hàng theo tiêu chuẩn: Độc quyền',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 6',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: 3 tháng',
      'Standee trước cửa hội trường: 2 cái',
      'Đăng bài viết về sản phẩm trên Web, page hội: 5 bài',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'Complimentary 50 Gala tickets',
      'Complimentary 3 Welcome Dinner tickets',
      'Hands-on training room use (2h): 2 slots',
      'Delegate registration discount: 25% Off',
      'Standard exhibition booth: Exclusive',
      'Logo on backdrop & printed materials: Size 6',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: 3 Months',
      'Standee at hall entrance: 2 pcs',
      'Product promotion posts on Web/Page: 5 posts',
      'Appreciation certificate & souvenir: Yes'
    ]
  },
  {
    id: 'platinum',
    name: 'Bạch Kim',
    nameEn: 'Platinum Partner',
    fee: 400000000,
    color: '#8b5cf6',
    benefits: [
      'Tặng 40 vé tham dự Gala',
      'Tặng 2 vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): 1 suất',
      'Đại biểu đăng ký qua nhà tài trợ: Giảm 20%',
      'Gian hàng theo tiêu chuẩn: Đặc biệt 1',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 5',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: 2 tháng',
      'Standee trước cửa hội trường: 1 cái',
      'Đăng bài viết về sản phẩm trên Web, page hội: 3 bài',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'Complimentary 40 Gala tickets',
      'Complimentary 2 Welcome Dinner tickets',
      'Hands-on training room use (2h): 1 slot',
      'Delegate registration discount: 20% Off',
      'Standard exhibition booth: Special 1',
      'Logo on backdrop & printed materials: Size 5',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: 2 Months',
      'Standee at hall entrance: 1 pc',
      'Product promotion posts on Web/Page: 3 posts',
      'Appreciation certificate & souvenir: Yes'
    ]
  },
  {
    id: 'gold',
    name: 'Vàng',
    nameEn: 'Gold Partner',
    fee: 300000000,
    color: '#f59e0b',
    benefits: [
      'Tặng 30 vé tham dự Gala',
      'Tặng 1 vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): 1 suất',
      'Đại biểu đăng ký qua nhà tài trợ: Giảm 15%',
      'Gian hàng theo tiêu chuẩn: Đặc biệt 2',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 4',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: 1 tháng',
      'Standee trước cửa hội trường: Không',
      'Đăng bài viết về sản phẩm trên Web, page hội: 2 bài',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'Complimentary 30 Gala tickets',
      'Complimentary 1 Welcome Dinner ticket',
      'Hands-on training room use (2h): 1 slot',
      'Delegate registration discount: 15% Off',
      'Standard exhibition booth: Special 2',
      'Logo on backdrop & printed materials: Size 4',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: 1 Month',
      'Standee at hall entrance: No',
      'Product promotion posts on Web/Page: 2 posts',
      'Appreciation certificate & souvenir: Yes'
    ]
  },
  {
    id: 'silver',
    name: 'Bạc',
    nameEn: 'Silver Partner',
    fee: 200000000,
    color: '#94a3b8',
    benefits: [
      'Tặng 20 vé tham dự Gala',
      'Không có vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): Ưu đãi 50%',
      'Đại biểu đăng ký qua nhà tài trợ: Giảm 10%',
      'Gian hàng theo tiêu chuẩn: Ưu tiên 1',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 3',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: Không',
      'Standee trước cửa hội trường: Không',
      'Đăng bài viết về sản phẩm trên Web, page hội: 1 bài',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'Complimentary 20 Gala tickets',
      'No Welcome Dinner tickets',
      'Hands-on training room use (2h): 50% Discount',
      'Delegate registration discount: 10% Off',
      'Standard exhibition booth: Priority 1',
      'Logo on backdrop & printed materials: Size 3',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: No',
      'Standee at hall entrance: No',
      'Product promotion posts on Web/Page: 1 post',
      'Appreciation certificate & souvenir: Yes'
    ]
  },
  {
    id: 'bronze',
    name: 'Đồng',
    nameEn: 'Bronze Partner',
    fee: 100000000,
    color: '#d97706',
    benefits: [
      'Tặng 10 vé tham dự Gala',
      'Không có vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): Ưu đãi 40%',
      'Đại biểu đăng ký qua nhà tài trợ: Giảm 5%',
      'Gian hàng theo tiêu chuẩn: Ưu tiên 2',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 2',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: Không',
      'Standee trước cửa hội trường: Không',
      'Đăng bài viết về sản phẩm trên Web, page hội: 1 bài',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'Complimentary 10 Gala tickets',
      'No Welcome Dinner tickets',
      'Hands-on training room use (2h): 40% Discount',
      'Delegate registration discount: 5% Off',
      'Standard exhibition booth: Priority 2',
      'Logo on backdrop & printed materials: Size 2',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: No',
      'Standee at hall entrance: No',
      'Product promotion posts on Web/Page: 1 post',
      'Appreciation certificate & souvenir: Yes'
    ]
  },
  {
    id: 'standard',
    name: 'Tiêu Chuẩn',
    nameEn: 'Standard Partner',
    fee: 50000000,
    color: '#64748b',
    benefits: [
      'Không có vé tham dự Gala',
      'Không có vé tham dự tiệc Chào mừng',
      'Giá sử dụng phòng Hand-on training (2h): Ưu đãi 30%',
      'Không có ưu đãi đăng ký đại biểu',
      'Gian hàng theo tiêu chuẩn: Cơ bản',
      'Logo trên backdrop và các ấn phẩm: Cỡ size 1',
      'Nêu tên cảm ơn trong suốt chương trình: Có',
      'Banner trên web hội: Không',
      'Standee trước cửa hội trường: Không',
      'Không có bài viết trên Web, page hội',
      'Giấy cảm ơn và quà lưu niệm: Có'
    ],
    benefitsEn: [
      'No Gala tickets',
      'No Welcome Dinner tickets',
      'Hands-on training room use (2h): 30% Discount',
      'No delegate registration discount',
      'Standard exhibition booth: Basic',
      'Logo on backdrop & printed materials: Size 1',
      'Verbal thank-you announcement: Yes',
      'Society website banner advertisement: No',
      'Standee at hall entrance: No',
      'No product promotion posts on Web/Page',
      'Appreciation certificate & souvenir: Yes'
    ]
  }
];

/* ── Benefits comparison table data ─────────────────────────────── */
const BENEFITS_TABLE = [
  { labelVi: 'Phí tài trợ', labelEn: 'Sponsorship Fee', valuesVi: ['600 triệu', '400 triệu', '300 triệu', '200 triệu', '100 triệu', '50 triệu'], valuesEn: ['600M VND', '400M VND', '300M VND', '200M VND', '100M VND', '50M VND'], isBold: true },
  { labelVi: 'Tặng vé tham dự Gala', labelEn: 'Complimentary Gala Tickets', valuesVi: ['50', '40', '30', '20', '10', '-'], valuesEn: ['50', '40', '30', '20', '10', '-'] },
  { labelVi: 'Tặng vé tham dự tiệc Chào mừng', labelEn: 'Complimentary Welcome Dinner Tickets', valuesVi: ['3', '2', '1', '-', '-', '-'], valuesEn: ['3', '2', '1', '-', '-', '-'] },
  { labelVi: 'Giá sử dụng phòng Hand-on training (2h): $3,000', labelEn: 'Hands-on Training Room Use (2h): $3,000', valuesVi: ['2 suất', '1 suất', '1 suất', 'Ưu đãi 50%', 'Ưu đãi 40%', 'Ưu đãi 30%'], valuesEn: ['2 slots', '1 slot', '1 slot', '50% Discount', '40% Discount', '30% Discount'] },
  { labelVi: 'Đại biểu đăng ký qua nhà tài trợ', labelEn: 'Delegate Registration Discount', valuesVi: ['Giảm 25%', 'Giảm 20%', 'Giảm 15%', 'Giảm 10%', 'Giảm 5%', '-'], valuesEn: ['25% Off', '20% Off', '15% Off', '10% Off', '5% Off', '-'] },
  { labelVi: 'Gian hàng theo tiêu chuẩn', labelEn: 'Standard Exhibition Booth', valuesVi: ['Độc quyền', 'Đặc biệt 1', 'Đặc biệt 2', 'Ưu tiên 1', 'Ưu tiên 2', 'Cơ bản'], valuesEn: ['Exclusive', 'Special 1', 'Special 2', 'Priority 1', 'Priority 2', 'Basic'] },
  { labelVi: 'Logo trên backdrop và các ấn phẩm', labelEn: 'Logo on Backdrop & Printings', valuesVi: ['Cỡ size 6', 'Cỡ size 5', 'Cỡ size 4', 'Cỡ size 3', 'Cỡ size 2', 'Cỡ size 1'], valuesEn: ['Size 6', 'Size 5', 'Size 4', 'Size 3', 'Size 2', 'Size 1'] },
  { labelVi: 'Nêu tên cảm ơn trong suốt chương trình', labelEn: 'Verbal Thank-you Announcement', valuesVi: ['Có', 'Có', 'Có', 'Có', 'Có', 'Có'], valuesEn: ['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'] },
  { labelVi: 'Banner trên web hội', labelEn: 'Banner on Society Website', valuesVi: ['3 tháng', '2 tháng', '1 tháng', 'Không', 'Không', 'Không'], valuesEn: ['3 Months', '2 Months', '1 Month', 'No', 'No', 'No'] },
  { labelVi: 'Standee trước cửa hội trường', labelEn: 'Standee at Hall Entrance', valuesVi: ['2 cái', '1 cái', 'Không', 'Không', 'Không', 'Không'], valuesEn: ['2 pcs', '1 pc', 'No', 'No', 'No', 'No'] },
  { labelVi: 'Đăng bài viết về sản phẩm trên Web, page hội', labelEn: 'Product Promotion Post on Web/Page', valuesVi: ['5 bài', '3 bài', '2 bài', '1 bài', '1 bài', 'Không'], valuesEn: ['5 Posts', '3 Posts', '2 Posts', '1 Post', '1 Post', 'No'] },
  { labelVi: 'Giấy cảm ơn và quà lưu niệm', labelEn: 'Appreciation Certificate & Souvenir', valuesVi: ['Có', 'Có', 'Có', 'Có', 'Có', 'Có'], valuesEn: ['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'] },
];

const TIER_HEADERS = [
  { name: 'Kim cương', nameEn: 'Diamond', color: '#6366f1' },
  { name: 'Bạch kim', nameEn: 'Platinum', color: '#8b5cf6' },
  { name: 'Vàng', nameEn: 'Gold', color: '#f59e0b' },
  { name: 'Bạc', nameEn: 'Silver', color: '#94a3b8' },
  { name: 'Đồng', nameEn: 'Bronze', color: '#d97706' },
  { name: 'Tiêu chuẩn', nameEn: 'Standard', color: '#64748b' },
];

export default function PublicSponsorRegister({ onNavigate }: PublicSponsorRegisterProps) {
  const [businessConfig, setBusinessConfig] = useState(() => store.getBusinessConfig());
  const formCfg = businessConfig.sponsorFormConfig;
  const sponsorTiers = store.getSponsorPackages();
  const [nationality, setNationality] = useState<'vietname' | 'foreign'>('vietname');
  const L = useFormLabel(formCfg, nationality === 'vietname' ? 'vi' : 'en');
  // Form States
  const [name, setName] = useState('');
  const [tier, setTier] = useState<string>('gold');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [boothLocation, setBoothLocation] = useState('auto');
  const [customBoothLocation, setCustomBoothLocation] = useState('');
  
  // Custom logo image state
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  
  // Custom benefits editing (pre-populated when tier changes)
  const [customBenefits, setCustomBenefits] = useState<string[]>([]);
  const [customBenefitsText, setCustomBenefitsText] = useState('');

  // Flow State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdSponsor, setCreatedSponsor] = useState<Sponsor | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate benefits when tier or nationality changes
  useEffect(() => {
    const matched = sponsorTiers.find(t => t.id === tier);
    if (matched) {
      const list = nationality === 'vietname' ? matched.benefits : (matched as any).benefitsEn || matched.benefits;
      setCustomBenefits(list);
      setCustomBenefitsText(list.join('\n'));
    }
  }, [tier, nationality, sponsorTiers]);

  // Sync businessConfig when admin saves settings
  useEffect(() => {
    const sync = () => setBusinessConfig(store.getBusinessConfig());
    window.addEventListener('store-updated', sync);
    window.addEventListener('store-loaded', sync);
    return () => {
      window.removeEventListener('store-updated', sync);
      window.removeEventListener('store-loaded', sync);
    };
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLogoUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
        setIsLogoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsLogoUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
        setIsLogoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentTierData = sponsorTiers.find(t => t.id === tier) || sponsorTiers[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !contactEmail || !contactPhone) {
      setErrorMsg(nationality === 'vietname'
        ? 'Vui lòng điền đầy đủ tất cả các trường thông tin liên hệ bắt buộc (*).'
        : 'Please fill in all required contact fields (*).'
      );
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    // Split custom benefits by newlines
    const finalBenefits = customBenefitsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const sponsorData: Sponsor = {
      id: 'SPN-' + Math.floor(Math.random() * 900 + 100),
      name,
      tier,
      pledgedAmount: currentTierData.fee,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      contactPerson,
      contactEmail,
      contactPhone,
      benefitsSigned: finalBenefits.length > 0 ? finalBenefits : currentTierData.benefits,
      logoUrl: logoImage || undefined,
      notes: notes || undefined,
      boothLocation: boothLocation === 'other' ? customBoothLocation : boothLocation
    };

    try {
      const saved = await store.saveSponsorAsync(sponsorData);
      
      // Broadcast realtime push notification to administrators
      await sendRealtimeNotification(
        'Nhà tài trợ Đăng ký mới',
        `Đơn vị "${saved.name}" vừa đăng ký cam kết tài trợ hạng mức ${saved.tier.toUpperCase()} với số tiền ${(saved.pledgedAmount || 0).toLocaleString('vi-VN')} VND!`,
        'warning'
      );

      // Tự động gửi email xác nhận đăng ký tài trợ
      try {
        const mockAttendee = {
          id: saved.id,
          title: 'Quý đối tác',
          fullName: saved.contactPerson,
          email: saved.contactEmail,
          phone: saved.contactPhone,
          organization: saved.name,
          packageName: saved.tier.toUpperCase(),
          packageFee: saved.pledgedAmount,
          paymentStatus: saved.paymentStatus,
          qrCodeValue: `PARS2026-SPN-${saved.id}`,
          pledgedAmount: saved.pledgedAmount,
          paidAmount: saved.paidAmount,
          boothLocation: saved.boothLocation
        };
        await store.sendEmail(mockAttendee as any, undefined, undefined, 'tmpl-sponsor-registered');
      } catch (emailErr) {
        console.error("Gửi email đăng ký nhà tài trợ thất bại:", emailErr);
      }

      setCreatedSponsor(saved);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(nationality === 'vietname'
        ? `Không thể hoàn tất đăng ký nhà tài trợ: ${err.message || err.details || 'Lỗi cơ sở dữ liệu.'}`
        : `Failed to complete sponsor registration: ${err.message || err.details || 'Database error.'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && createdSponsor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-slate-900">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-teal-800 to-indigo-900 p-8 text-center text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.15),transparent)]" />
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
              <CheckCircle className="w-9 h-9 text-emerald-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">{L.t('ĐĂNG KÝ ĐỒNG HÀNH THÀNH CÔNG', 'SPONSOR REGISTRATION SUCCESSFUL')}</h2>
            <p className="text-teal-200 text-sm mt-2 font-medium max-w-lg mx-auto relative z-10">
              {L.t(`Cảm ơn doanh nghiệp ${createdSponsor.name} đã đăng ký trở thành đối tác đồng hành tại PARS 2026.`, `Thank you to ${createdSponsor.name} for registering as a partner at PARS 2026.`)}
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Column: Sponsor profile details */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">{L.t('CHI TIẾT ĐĂNG KÝ HỒ SƠ', 'REGISTRATION DOSSIER DETAILS')}</span>
                
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  {createdSponsor.logoUrl ? (
                    <img 
                      src={createdSponsor.logoUrl} 
                      alt="Logo Doanh nghiệp" 
                      className="w-14 h-14 object-contain rounded-lg bg-white border p-1" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-500">
                      PARS
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{createdSponsor.name}</h4>
                    <span className="inline-block px-2.5 py-0.5 mt-1 bg-indigo-50 border border-indigo-150 rounded text-[9.5px] font-bold uppercase text-indigo-700 tracking-wider">
                      {L.t(currentTierData.name, currentTierData.nameEn)} {L.t('Đồng hành', 'Partner')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-650 font-medium">
                  <p>• {L.t('Mã đối tác: ', 'Partner ID: ')}<strong className="text-slate-900 font-mono">{createdSponsor.id}</strong></p>
                  <p>• {L.t('Người liên hệ: ', 'Contact Person: ')}<strong className="text-slate-900">{createdSponsor.contactPerson}</strong></p>
                  <p>• {L.t('Số điện thoại: ', 'Phone Number: ')}<strong className="text-slate-900">{createdSponsor.contactPhone}</strong></p>
                  <p>• {L.t('Hộp thư điện tử: ', 'Email Address: ')}<strong className="text-slate-900">{createdSponsor.contactEmail}</strong></p>
                  {createdSponsor.boothLocation && (
                    <p>• {L.t('Vị trí gian hàng: ', 'Booth Location: ')}<strong className="text-slate-900">{createdSponsor.boothLocation === 'auto' ? L.t('BTC sắp xếp', 'Assigned by Organizer') : createdSponsor.boothLocation}</strong></p>
                  )}
                  <p>• {L.t('Kinh phí cam kết đóng góp: ', 'Pledged Sponsorship Fee: ')}<strong className="text-indigo-700 text-sm font-black font-mono">{createdSponsor.pledgedAmount.toLocaleString()} {L.t('VNĐ', 'VND')}</strong></p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/50">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block mb-1">{L.t('Trạng thái hồ sơ:', 'Dossier Status:')}</span>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed">
                    {L.t(
                      `Hợp đồng đồng hành đã sẵn sàng. Ban Thư ký sẽ liên hệ trực tiếp đến số điện thoại ${createdSponsor.contactPhone} trong vòng 24 giờ tiếp theo để bàn giao thiết kế gian hàng sơ đồ vị trí và ký văn bản ghi nhận chính thức.`,
                      `The sponsorship contract is ready. The Secretariat will contact you at ${createdSponsor.contactPhone} within the next 24 hours to deliver the booth layout design and execute the official agreement.`
                    )}
                  </p>
                </div>
              </div>

              {/* Right Column: Bank billing transfer instructions */}
              <div className="md:pl-8 space-y-4 pt-6 md:pt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">{L.t('HƯỚNG DẪN CHUYỂN KHOẢN KINH PHÍ', 'BANK TRANSFER INSTRUCTIONS')}</span>
                
                <div className="p-4 bg-slate-50 border border-slate-250 rounded-2xl space-y-3.5 text-xs text-slate-700 font-sans shadow-inner">
                  <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-200 pb-2">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-xs uppercase tracking-wider">{L.t('Tài khoản ngân hàng của BTC', 'BTC Bank Account Details')}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{L.t('Ngân hàng thụ hưởng:', 'Beneficiary Bank:')}</span>
                      <strong className="text-slate-900 text-right">VIETCOMBANK - Hanoi Branch</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{L.t('Tên tài khoản hưởng:', 'Account Name:')}</span>
                      <strong className="text-slate-900 text-right">HIEP HOI PHAU THUAT THAM MY PARS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{L.t('Số tài khoản:', 'Account Number:')}</span>
                      <strong className="text-slate-900 text-right font-mono text-sm tracking-wide">0011 0042 99999</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{L.t('Số tiền chuyển khoản:', 'Transfer Amount:')}</span>
                      <strong className="text-indigo-755 text-sm font-black font-mono">{(createdSponsor.pledgedAmount).toLocaleString()} {L.t('VNĐ', 'VND')}</strong>
                    </div>
                    <div className="flex flex-col gap-1 bg-white p-2.5 rounded-xl border border-slate-200 mt-2">
                      <span className="text-[9.5px] font-bold text-rose-500 uppercase tracking-wide">{L.t('Cú pháp chuyển tiền chính xác (MEMO):', 'Exact Transfer Description (MEMO):')}</span>
                      <p className="font-mono text-xs font-black text-slate-900 tracking-tight bg-slate-50 p-2 rounded border text-center select-all">
                        {createdSponsor.id} {createdSponsor.name.toUpperCase().replace(/[^A-Z0-9 ]/g, '')} {L.t('TAI TRO PARS2026', 'SPONSOR PARS2026')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex gap-2 text-[10.5px] text-slate-500 leading-snug">
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{L.t('Cổng thanh toán tự động ghi nhận Realtime. Ngay khi chuyển khoản thành công, bút toán đối soát sẽ tự động kích hoạt hiển thị Logo Doanh nghiệp tại trang chủ lễ bế mạc và sảnh vinh danh.', 'Automated real-time payment gateway. Upon successful transfer, the reconciliation entry will trigger the auto-display of the Company Logo on the closing ceremony screen and the hall of honor.')}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('event-details')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
              >
                {L.t('Quay Lại Trang Chủ Hội Nghị', 'Back to Event Homepage')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-slate-800">

      {/* CLOSED FORM SCREEN */}
      {formCfg?.isOpen === false && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center mb-8" style={{ backgroundColor: formCfg?.headerBgColor || '#1c1917' }}>
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-white font-black text-xl mb-3">{L.t('Cổng đăng ký tài trợ đã đóng', 'Sponsorship Portal Closed')}</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto">{formCfg?.closedMessage || L.t('Cổng đăng ký tài trợ hiện đã đóng. Vui lòng liên hệ Ban tổ chức.', 'The sponsorship registration portal is currently closed. Please contact the Organizer.')}</p>
          <button onClick={() => onNavigate('event-details')} className="mt-6 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 cursor-pointer transition-all">{L.t('← Về trang chủ', '← Back to Event Homepage')}</button>
        </div>
      )}

      {formCfg?.isOpen !== false && (<>

      {/* Header section */}
      {!formCfg?.hideHeader && (
        <div
          className="p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 mb-8 text-center relative overflow-hidden"
          style={{ backgroundColor: formCfg?.headerBgColor || '#1c1917' }}
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <HeartHandshake className="w-32 h-32 text-white" />
          </div>

          {formCfg?.bannerImageUrl && <img src={formCfg.bannerImageUrl} alt="Banner" className="h-12 object-contain mx-auto mb-2 rounded" />}

          <span className="px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider inline-block"
            style={{ backgroundColor: `${formCfg?.accentColor || '#f59e0b'}20`, color: formCfg?.accentColor || '#f59e0b', border: `1px solid ${formCfg?.accentColor || '#f59e0b'}40` }}>
            {formCfg?.organizerLabel || L.t('ĐĂNG KÝ ĐỒNG HÀNH & TÀI TRỢ - PARS 2026', 'PARS 2026 PARTNER & SPONSOR REGISTRATION')}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
            {formCfg?.formTitle || L.t('Đăng Ký Đồng Hành & Tài Trợ Hội Nghị', 'Conference Partnership & Sponsorship Registration')}
          </h1>
          <p className="text-xs md:text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: `${formCfg?.accentColor || '#ffffff'}b0` }}>
            {formCfg?.formDescription || L.t('Đưa thương hiệu thiết bị y tế của bạn tiếp cận trực tiếp đến 1,000+ chuyên gia đầu ngành.', 'Expose your medical brand and devices directly to 1,000+ leading industry specialists.')}
          </p>
        </div>
      )}

      {/* Language Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
        <label className="block text-xs font-extrabold text-slate-800 mb-2 uppercase">
          {L.f('nationality', 'Chọn ngôn ngữ *', 'Select Language *')}
        </label>
        <div className="flex bg-slate-100 rounded-lg p-1 gap-2 max-w-sm">
          <button
            type="button"
            onClick={() => setNationality('vietname')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${
              nationality === 'vietname' ? 'bg-stone-900 text-amber-400 shadow-md' : 'text-slate-655 hover:text-slate-900 bg-transparent'
            }`}
          >
            {L.t('Việt Nam', 'Vietnamese')}
          </button>
          <button
            type="button"
            onClick={() => setNationality('foreign')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer border-none ${
              nationality === 'foreign' ? 'bg-stone-900 text-amber-400 shadow-md' : 'text-slate-655 hover:text-slate-900 bg-transparent'
            }`}
          >
            International
          </button>
        </div>
      </div>

      {/* ═══════ BENEFITS COMPARISON TABLE ═══════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-[#2c3e6b] to-[#3b5998] px-6 py-4 text-center">
          <h2 className="text-white font-extrabold text-lg md:text-xl tracking-wide uppercase" style={{ fontStyle: 'italic' }}>
            {L.t('Phí và quyền lợi nhà tài trợ', 'Sponsorship Fees & Benefits')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] md:text-xs border-collapse min-w-[700px]">
            {/* Column Headers */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[28%] border-r border-slate-100">
                  {L.t('Quyền lợi nhà tài trợ', 'Sponsor Benefits')}
                </th>
                {TIER_HEADERS.map((h, i) => (
                  <th key={i} className="py-3 px-2 text-center font-extrabold uppercase tracking-wide text-[10px] border-r border-slate-100 last:border-r-0" style={{ color: h.color }}>
                    {nationality === 'vietname' ? h.name : h.nameEn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BENEFITS_TABLE.map((row, rowIdx) => {
                const label = nationality === 'vietname' ? row.labelVi : row.labelEn;
                const values = nationality === 'vietname' ? row.valuesVi : row.valuesEn;
                return (
                  <tr key={rowIdx} className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                    <td className={`py-2.5 px-4 text-slate-700 border-r border-slate-100 leading-snug ${row.isBold ? 'font-extrabold text-slate-900' : 'font-semibold'}`}>
                      {label}
                    </td>
                    {values.map((val, colIdx) => {
                      const isEmpty = val === '-' || val === 'Không' || val === 'No';
                      return (
                        <td key={colIdx} className={`py-2.5 px-2 text-center border-r border-slate-100 last:border-r-0 ${
                          row.isBold ? 'font-extrabold text-slate-900' : isEmpty ? 'text-slate-300 font-medium' : 'font-semibold text-slate-700'
                        }`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
            {L.t(
              'HỘI NGHỊ KHOA HỌC THƯỜNG NIÊN LẦN THỨ 10 CỦA HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS) — TP. HỒ CHÍ MINH 2026',
              'THE 10TH ANNUAL SCIENTIFIC CONFERENCE OF THE VIETNAM SOCIETY OF AESTHETIC PLASTIC SURGERY (PARS) — HO CHI MINH CITY 2026'
            )}
          </p>
          <p className="text-[9px] text-slate-350 mt-0.5">
            Website: pars.vn &nbsp;—&nbsp; Email: parsevents@gmail.com &nbsp;—&nbsp; Hotline: +84964551151
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Register profile data */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-teal-600 rounded"></span>
                {L.section('sponsorProfile', '1. Hồ Sơ Doanh Nghiệp Tài Trợ', '1. Sponsor / Company Profile')}
              </h3>

              {/* Logo upload block */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">
                  {L.f('logo', 'Logo Thương Hiệu / Doanh Nghiệp *', 'Brand / Company Logo *')}
                </label>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center transition-all min-h-[140px]"
                >
                  {logoImage ? (
                    <div className="relative group w-32 h-32 bg-white rounded-xl border p-2 flex items-center justify-center shadow-inner">
                      <img src={logoImage} alt="Brand Logo Preview" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoImage(null)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-rose-600 cursor-pointer border-none"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {L.t('Kéo thả logo doanh nghiệp vào đây hoặc', 'Drag and drop your logo here or')}
                      </p>
                      <label className="inline-block px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-[10.5px] font-bold text-slate-700 cursor-pointer transition-all">
                        {L.t('Duyệt tìm tệp ảnh', 'Browse image file')}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="text-[9.5px] text-slate-400">
                        {L.t('Khuyên dùng logo định dạng PNG nền trong suốt (Transparent), độ phân giải cao', 'High-res transparent background PNG logo is highly recommended')}
                      </p>
                    </div>
                  )}
                  {isLogoUploading && (
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">
                      {L.t('Đang tải và xử lý...', 'Uploading & processing...')}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {L.f('companyName', 'Tên Thương hiệu / Doanh nghiệp đăng ký *', 'Brand / Registered Company Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={L.p('ví dụ: Công ty Cổ phần Boston Pharma Việt Nam', 'e.g. Boston Pharma Joint Stock Company')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {L.f('contactName', 'Họ & Tên Đại diện liên hệ *', 'Contact Person Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={L.p('ví dụ: Nguyễn Minh Thư', 'e.g. Ms. Jane Smith')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {L.f('contactPhone', 'Số điện thoại liên hệ *', 'Contact Phone Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={L.p('ví dụ: 0977889900', 'e.g. 0977889900')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {L.f('contactEmail', 'Email nhận thư báo ký kết & tài liệu *', 'Email for Contracts & Documents *')}
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={L.p('ví dụ: minhthu.nguyen@bostonpharma.com', 'e.g. jane.smith@bostonpharma.com')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {L.t('Vị trí gian hàng mong muốn *', 'Preferred Booth Location *')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={boothLocation}
                    onChange={(e) => setBoothLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="auto">{L.t('Ban Tổ Chức tự sắp xếp / Tự chọn sau', 'Organizer assigns / Choose later')}</option>
                    <option value="A1">{L.t('Gian A1 (Khu Kim Cương)', 'Booth A1 (Diamond Zone)')}</option>
                    <option value="A2">{L.t('Gian A2 (Khu Kim Cương)', 'Booth A2 (Diamond Zone)')}</option>
                    <option value="A3">{L.t('Gian A3 (Khu Kim Cương)', 'Booth A3 (Diamond Zone)')}</option>
                    <option value="B1">{L.t('Gian B1 (Khu Bạch Kim/Vàng)', 'Booth B1 (Platinum/Gold Zone)')}</option>
                    <option value="B2">{L.t('Gian B2 (Khu Bạch Kim/Vàng)', 'Booth B2 (Platinum/Gold Zone)')}</option>
                    <option value="B3">{L.t('Gian B3 (Khu Bạch Kim/Vàng)', 'Booth B3 (Platinum/Gold Zone)')}</option>
                    <option value="C1">{L.t('Gian C1 (Khu Tiêu chuẩn)', 'Booth C1 (Standard Zone)')}</option>
                    <option value="C2">{L.t('Gian C2 (Khu Tiêu chuẩn)', 'Booth C2 (Standard Zone)')}</option>
                    <option value="other">{L.t('Khác / Vị trí đặc biệt...', 'Other / Special location...')}</option>
                  </select>

                  {boothLocation === 'other' && (
                    <input
                      type="text"
                      required
                      value={customBoothLocation}
                      onChange={(e) => setCustomBoothLocation(e.target.value)}
                      placeholder={L.p('Nhập vị trí mong muốn (ví dụ: D4)', 'Enter preferred location (e.g., D4)')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <RichTextEditor
                  value={notes}
                  onChange={setNotes}
                  label={L.f('notes', 'Ghi chú hoặc yêu cầu đặc biệt của Doanh nghiệp', 'Company requests or special notes')}
                  placeholder={L.p('Yêu cầu sơ đồ gian hàng, mong muốn ghép chung, thời hạn ký hợp hợp hạch toán...', 'Booth layout requirements, co-branding request, accounting deadlines...')}
                  id="sponsor-notes"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Sponsor Tiers option */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-teal-600 rounded"></span>
                {L.section('tierSelect', '2. Lựa Chọn Phân Khúc Đồng Hành', '2. Sponsorship Package Selection')}
              </h3>

              <div className="col-span-1 space-y-2">
                {sponsorTiers.map((t) => (
                  <label 
                    key={t.id}
                    className={`p-3 border rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all select-none relative ${
                      tier === t.id ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sponsorTier"
                      checked={tier === t.id}
                      onChange={() => setTier(t.id)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-55 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <p className="font-extrabold text-slate-900 text-[12px] truncate">
                          {L.t(t.name, t.nameEn)}
                        </p>
                      </div>
                      <p className="text-[11px] font-black font-mono text-indigo-700 mt-0.5 ml-4">{(t.fee).toLocaleString()}đ</p>
                    </div>
                    {tier === t.id && (
                      <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* Dynamic Benefits Checklist Panel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono block">
                  {L.t('DỰ KIẾN QUYỀN LỢI ĐỒNG HÀNH CHÍNH', 'PROSPECTIVE KEY SPONSOR BENEFITS')}
                </span>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  {L.t('Quyền lợi chuẩn theo quy định bảo trợ. Doanh nghiệp có thể điều chỉnh hoặc ghi chú thêm ở mục bên dưới:', 'Standard package benefits. You may modify or add notes in the editor below:')}
                </p>
                
                <textarea
                  value={customBenefitsText}
                  onChange={(e) => setCustomBenefitsText(e.target.value)}
                  placeholder={L.p('Danh sách quyền lợi chính thức được phân cách bằng dòng...', 'List of official benefits separated by lines...')}
                  className="w-full p-3 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 bg-white focus:outline-none focus:border-indigo-500 tracking-tight"
                  rows={6}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-center text-xs font-bold text-rose-600">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              id="btn-submit-sponsor-register"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-2xl cursor-pointer transition-all shadow-lg hover:shadow-teal-600/20 uppercase tracking-wider border-none text-center"
            >
              {isSubmitting ? L.t('Đang gửi hồ sơ tài trợ...', 'Submitting sponsorship request...') : L.t('Gửi Đăng Ký Tài Trợ & Nhận Hợp Đồng', 'Submit Sponsorship & Request Contract')}
            </button>
          </div>
        </div>
      </form>

      {formCfg?.footerNote && (
        <div className="mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10.5px] text-slate-600 text-center leading-relaxed">{formCfg.footerNote}</div>
        </div>
      )}

      </> )}
    </div>
  );
}
