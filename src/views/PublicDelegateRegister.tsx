/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, QrCode, Mail, Phone, FileText, Upload, AlertCircle, Sparkles, Check, HelpCircle, ExternalLink } from 'lucide-react';
import { store } from '../dataStore';
import { sendRealtimeNotification } from '../lib/realtime';
import { Attendee, RegistrationPackage, AddOnService } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import { getProvinceList, getDistrictsOf, getWardsOf } from '../data/vnProvinces';
import SepayPaymentChecker from '../components/SepayPaymentChecker';
import { useFormLabel } from '../hooks/useFormLabel';
import PaymentMethodSelector, { PaymentMethodId } from '../components/PaymentMethodSelector';

interface FormStepperProps {
  currentStep: number;
  isSubmitted: boolean;
  L?: any;
}

function FormStepper({ currentStep, isSubmitted, L }: FormStepperProps) {
  const steps = [
    { number: 1, label: L ? L.t('Thông tin đăng ký', 'Registration Info') : 'Thông tin đăng ký', desc: L ? L.t('Thông tin & Gói', 'Info & Package') : 'Thông tin & Gói' },
    { number: 2, label: L ? L.t('Thanh toán', 'Payment') : 'Thanh toán', desc: L ? L.t('Chọn phương thức & QR', 'Select method & QR') : 'Chọn phương thức & QR' },
    { number: 3, label: L ? L.t('Xác nhận & Vé', 'Confirmation & Ticket') : 'Xác nhận & Vé', desc: L ? L.t('Vé check-in & Hoàn tất', 'Check-in ticket & Complete') : 'Vé check-in & Hoàn tất' }
  ];

  const activeStep = isSubmitted ? 3 : currentStep;

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 md:py-6">
      <div className="max-w-3xl mx-auto">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between relative">
          {/* Progress Bar background */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
          {/* Progress Bar active line */}
          <div
            className="absolute top-5 left-8 h-0.5 bg-teal-650 transition-all duration-500 ease-in-out -z-0"
            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const isCompleted = activeStep > step.number;
            const isActive = activeStep === step.number;

            return (
              <div key={step.number} className="flex flex-col items-center relative z-10 w-40 text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${isCompleted
                  ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                  : isActive
                    ? 'bg-white border-teal-600 text-teal-800 ring-4 ring-teal-50 shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                  {isCompleted ? <Check className="w-4 h-4 text-white" /> : step.number}
                </div>
                <span className={`text-[11px] font-extrabold mt-2 uppercase tracking-wide transition-colors duration-300 ${isActive ? 'text-teal-900' : isCompleted ? 'text-teal-700' : 'text-slate-400'
                  }`}>
                  {step.label}
                </span>
                <span className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5 px-2">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest font-mono">
              {L ? L.t('Bước', 'Step') : 'Bước'} {activeStep} / 3
            </span>
            <h4 className="text-sm font-black text-slate-900 uppercase">
              {steps[activeStep - 1].label}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {steps[activeStep - 1].desc}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((step) => {
              const isCompleted = activeStep > step.number;
              const isActive = activeStep === step.number;
              return (
                <div
                  key={step.number}
                  className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-teal-600' : isCompleted ? 'w-2 bg-teal-500' : 'w-2 bg-slate-200'
                    }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PublicDelegateRegisterProps {
  onNavigate: (view: string) => void;
  isInline?: boolean;
}

const getInitialLang = (): 'vietname' | 'foreign' => {
  try {
    const lang = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
    if (['en', 'foreign', 'international'].includes(lang)) return 'foreign';
    if (['vi', 'vn', 'vietnam', 'vietname'].includes(lang)) return 'vietname';
  } catch {
    /* ignore */
  }
  return 'vietname'; // mặc định tiếng Việt
};

export default function PublicDelegateRegister({ onNavigate, isInline = false }: PublicDelegateRegisterProps) {
  const packages = store.getPackages().filter(p => p.isActive);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const doctorProofInputRef = useRef<HTMLInputElement>(null);
  const [businessConfig, setBusinessConfig] = useState(() => store.getBusinessConfig());
  const formCfg = businessConfig.delegateFormConfig;
  const addOnServices: AddOnService[] = (businessConfig.addOnServices && businessConfig.addOnServices.length > 0) ? businessConfig.addOnServices : [
    { id: 'addon-cme', nameVi: 'Chứng chỉ CME', nameEn: 'CME Certificate', descriptionVi: 'Nhận chứng chỉ đào tạo y khoa liên tục CME sau khi kết thúc khóa học tham luận.', descriptionEn: 'Receive Continuing Medical Education (CME) certificate after completing the sessions.', fee: 350000, isEnabled: true, color: 'teal' },
    { id: 'addon-gala', nameVi: 'Gala Dinner', nameEn: 'Gala Dinner', descriptionVi: 'Đăng ký tiệc tối ẩm thực giao lưu kết nối thân mật y sỹ.', descriptionEn: 'Register for the evening Gala Dinner for friendly medical networking.', fee: 700000, isEnabled: true, color: 'amber' },
    { id: 'addon-masterclass', nameVi: 'Master Class', nameEn: 'Master Class', descriptionVi: 'Nhận truyền thụ và chuyển giao công nghệ thẩm mỹ lâm sàn chuyên sâu.', descriptionEn: 'Receive knowledge sharing and technology transfer for advanced aesthetic clinical methods.', fee: 500000, isEnabled: true, color: 'purple' },
    { id: 'addon-tour', nameVi: 'Tour tham quan', nameEn: 'Sightseeing Tour', descriptionVi: 'Đóng phí Tour tham luận văn hóa dã ngoại theo lịch trình hội nghị.', descriptionEn: 'Register for cultural tour field trips following the official schedule.', fee: 4500000, isEnabled: true, color: 'pink' }
  ];

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

  // Auto-height postMessage for iframe embedding in WordPress
  useEffect(() => {
    const sendHeight = () => {
      const h = document.documentElement.scrollHeight || document.body.scrollHeight;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'pars-height', height: h }, '*');
      }
    };
    sendHeight();
    
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(sendHeight);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Custom Form State
  const [title, setTitle] = useState('BS');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [province, setProvince] = useState('Hồ Chí Minh');
  const [district, setDistrict] = useState('Thành phố Thủ Đức');
  const [ward, setWard] = useState('Phường Thảo Điền');
  const [address, setAddress] = useState('');
  // const [nationality, setNationality] = useState<'vietname' | 'foreign'>('vietname');
  const [nationality, setNationality] = useState<'vietname' | 'foreign'>(getInitialLang);
  const [period, setPeriod] = useState<'pre_10_11' | 'post_10_11'>(() => {
    const today = new Date();
    const targetDate = new Date('2026-11-10');
    return today >= targetDate ? 'post_10_11' : 'pre_10_11';
  });
  const [addOnSelections, setAddOnSelections] = useState<Record<string, boolean>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('bank_transfer');
  const toggleAddOn = (id: string) => {
    setAddOnSelections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const L = useFormLabel(formCfg, nationality === 'vietname' ? 'vi' : 'en');

  // CME states
  const [cmeRequired, setCmeRequired] = useState(false);
  const [galaRequired, setGalaRequired] = useState(false);
  const [masterclassRequired, setMasterclassRequired] = useState(false);
  const [tourRequired, setTourRequired] = useState(false);

  const [packageId, setPackageId] = useState(packages[0]?.id || 'pkg-standard');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [notes, setNotes] = useState('');

  // Flow States
  const [currentStep, setCurrentStep] = useState(1);
  const [doctorProofImage, setDoctorProofImage] = useState<string | null>(null);
  const [isDoctorProofUploading, setIsDoctorProofUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync packageId khi nationality thay đổi; cũng điều chỉnh payment method mặc định
  useEffect(() => {
    if (nationality === 'foreign') {
      setPackageId('pkg-foreign');
      // Đại biểu quốc tế mặc định dùng Stripe nếu đã bật
      if (businessConfig.paymentConfig?.stripe?.isEnabled) {
        setSelectedPaymentMethod('stripe');
      }
    } else if (packageId === 'pkg-foreign') {
      setPackageId('pkg-member');
      setSelectedPaymentMethod('bank_transfer');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationality]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAvatarUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
        setIsAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDoctorProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsDoctorProofUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDoctorProofImage(reader.result as string);
        setIsDoctorProofUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProofUploadInSuccess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && createdAttendee) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setProofImage(base64Image);
        try {
          const updatedAttendee = {
            ...createdAttendee,
            transactionProofUrl: base64Image,
          };
          const saved = await store.saveAttendeeAsync(updatedAttendee);
          setCreatedAttendee(saved);
        } catch (err) {
          console.error("Lỗi cập nhật ảnh biên nhận:", err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProofInSuccess = async () => {
    if (createdAttendee) {
      setProofImage(null);
      try {
        const updatedAttendee = {
          ...createdAttendee,
          transactionProofUrl: undefined,
        };
        const saved = await store.saveAttendeeAsync(updatedAttendee);
        setCreatedAttendee(saved);
      } catch (err) {
        console.error("Lỗi xóa ảnh biên nhận:", err);
      }
    }
  };

  const validateStep1 = () => {
    if (!fullName) {
      setErrorMsg('Vui lòng điền họ và tên đại biểu.');
      return false;
    }
    if (!yearOfBirth) {
      setErrorMsg('Vui lòng điền năm sinh để hoàn tất thông tin đăng ký CME.');
      return false;
    }
    const yobNum = parseInt(yearOfBirth, 10);
    if (isNaN(yobNum) || yobNum < 1920 || yobNum > 2026) {
      setErrorMsg('Năm sinh không hợp lệ (ví dụ: 1988).');
      return false;
    }
    if (!phone) {
      setErrorMsg('Vui lòng nhập số điện thoại di động.');
      return false;
    }
    if (!email) {
      setErrorMsg('Vui lòng điền địa chỉ Email để BTC gửi vé điện tử.');
      return false;
    }
    if (!organization) {
      setErrorMsg('Vui lòng điền cơ quan đơn vị công tác.');
      return false;
    }
    if (!address) {
      setErrorMsg('Vui lòng điền địa chỉ liên hệ.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const scrollToFormTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectedPackage = packages.find(p => p.id === packageId) || packages[0];
  const provincesList = getProvinceList();
  const districts = getDistrictsOf(province);
  const wards = getWardsOf(province, district);
  const cleanPhoneInput = phone.trim().replace(/\s+/g, '');
  const cleanFullNameAscii = fullName.trim().toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .replace(/[^A-Z0-9\s]/g, '');
  const transferMessage = `${cleanFullNameAscii} ${cleanPhoneInput}`;

  const baseFee = selectedPackage?.fee ?? 0;

  // Calculate add-on fees dynamically from config
  const addOnFeeDetails = addOnServices
    .filter(s => addOnSelections[s.id])
    .map(s => {
      const fee = s.fee;
      return { id: s.id, nameVi: s.nameVi, nameEn: s.nameEn, fee };
    });
  const totalAddOnFee = addOnFeeDetails.reduce((sum, d) => sum + d.fee, 0);

  const calculatedTotalFee = baseFee + totalAddOnFee;

  // Dynamic preview for bank transfer using VietQR
  const currentVietQRUrl = `https://img.vietqr.io/image/VCB-0331000516283-compact.png?amount=${calculatedTotalFee}&addInfo=${encodeURIComponent(transferMessage)}&accountName=HOI%20PHAU%20THUAT%2520TAO%2520HINH%2520THAM%2520MY%2520VIET%2520NAM`;

  // Vietnam address selectors handlers
  const handleProvinceChange = (selectedProv: string) => {
    setProvince(selectedProv);
    const districts = getDistrictsOf(selectedProv);
    if (districts.length > 0) {
      setDistrict(districts[0]);
      const wards = getWardsOf(selectedProv, districts[0]);
      if (wards.length > 0) {
        setWard(wards[0]);
      } else {
        setWard('');
      }
    } else {
      setDistrict('');
      setWard('');
    }
  };

  const handleDistrictChange = (selectedDist: string) => {
    setDistrict(selectedDist);
    const wards = getWardsOf(province, selectedDist);
    if (wards.length > 0) {
      setWard(wards[0]);
    } else {
      setWard('');
    }
  };

  const handleToggleCme = (val: boolean) => {
    setAddOnSelections(prev => ({ ...prev, 'addon-cme': val }));
  };

  const handleToggleGala = (val: boolean) => {
    setAddOnSelections(prev => ({ ...prev, 'addon-gala': val }));
  };

  const handleSelectPackage = (pkgId: string) => {
    setPackageId(pkgId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollToFormTop();
      }
      return;
    }

    if (!fullName) {
      setErrorMsg('Vui lòng điền họ và tên đại biểu.');
      return;
    }
    if (!yearOfBirth) {
      setErrorMsg('Vui lòng điền năm sinh để hoàn tất thông tin đăng ký CME.');
      return;
    }
    const yobNum = parseInt(yearOfBirth, 10);
    if (isNaN(yobNum) || yobNum < 1920 || yobNum > 2026) {
      setErrorMsg('Năm sinh không hợp lệ (ví dụ: 1988).');
      return;
    }
    if (!phone) {
      setErrorMsg('Vui lòng nhập số điện thoại di động.');
      return;
    }
    if (!email) {
      setErrorMsg('Vui lòng điền địa chỉ Email để BTC gửi vé điện tử.');
      return;
    }
    if (!organization) {
      setErrorMsg('Vui lòng điền cơ quan đơn vị công tác.');
      return;
    }
    if (!address) {
      setErrorMsg('Vui lòng điền địa chỉ liên hệ.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // Generate a random unique ID to avoid collisions on public registration
      const randomSeq = Math.floor(Math.random() * 900000 + 100000);
      const prefix = store.getBusinessConfig().attendeeIdPrefix || 'PARS2026';
      const newId = `${prefix}-${randomSeq}`;
      const qrCodeValue = `${newId}-${fullName.replace(/\s+/g, '').toUpperCase()}`;

      const fullAddress = `${address.trim()}${ward ? ', ' + ward : ''}${district ? ', ' + district : ''}`;

      const isCmeSelected = addOnServices.some(s => s.id.toLowerCase().includes('cme') && addOnSelections[s.id]);
      const isGalaSelected = addOnServices.some(s => s.id.toLowerCase().includes('gala') && addOnSelections[s.id]);
      const isMasterclassSelected = addOnServices.some(s => s.id.toLowerCase().includes('master') && addOnSelections[s.id]);
      const isTourSelected = addOnServices.some(s => s.id.toLowerCase().includes('tour') && addOnSelections[s.id]);

      let finalNotes = notes;
      const customAddOns = addOnServices.filter(s =>
        addOnSelections[s.id] &&
        !s.id.toLowerCase().includes('cme') &&
        !s.id.toLowerCase().includes('gala') &&
        !s.id.toLowerCase().includes('master') &&
        !s.id.toLowerCase().includes('tour')
      );
      if (customAddOns.length > 0) {
        const customNames = customAddOns.map(s => s.nameVi).join(', ');
        finalNotes = notes ? `${notes}\n[Đăng ký thêm: ${customNames}]` : `[Đăng ký thêm: ${customNames}]`;
      }

      const attendeeData: Attendee = {
        id: newId,
        title,
        fullName: fullName.toUpperCase(),
        organization,
        department: department || 'Khoa Tạo hình Thẩm mỹ',
        phone: cleanPhoneInput,
        email,
        address: fullAddress,
        nationality,
        packageId,
        packageName: selectedPackage?.name || 'Gói Tiêu Chuẩn',
        packageFee: calculatedTotalFee,
        paymentStatus: 'pending_verification',
        paymentMethod: selectedPaymentMethod as any,
        transactionProofUrl: proofImage || undefined,
        registrationDate: new Date().toISOString().split('T')[0],
        qrCodeValue,
        isCheckedIn: false,
        notes: finalNotes,
        yearOfBirth,
        gender,
        cmeRequired: isCmeSelected,
        cmeIdentityNo: undefined,
        galaRequired: isGalaSelected,
        masterclassRequired: isMasterclassSelected,
        tourRequired: isTourSelected,
        registrationPeriod: period,
        province,
        avatarUrl: avatarImage || undefined,
        doctorProofUrl: doctorProofImage || undefined,
      };

      const saved = await store.saveAttendeeAsync(attendeeData);

      // Broadcast realtime push notification to administrators
      await sendRealtimeNotification(
        'Đại biểu Đăng Ký Mới',
        `Đại biểu ${saved.title} ${saved.fullName} (${saved.organization}) vừa đăng ký thành công gói ${saved.packageName}!`,
        'success'
      );

      // Gửi thông báo tự động (chạy background)
      try {
        store.sendZaloZNS(saved);
        store.sendEmail(saved);
        store.sendWhatsapp(saved);
      } catch (err) {
        console.error('Lỗi khi gửi thông báo tự động:', err);
      }

      setCreatedAttendee(saved);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Lỗi lưu đăng ký đại biểu:', err);
      setErrorMsg(`Không thể hoàn tất đăng ký do lỗi cơ sở dữ liệu: ${err.message || err.details || 'Lỗi mạng hoặc phân quyền.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic provinces list comes from administrative helper

  if (isSubmitted && createdAttendee) {
    const checkinQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdAttendee.qrCodeValue)}`;
    const cleanFullNameAsciiSub = createdAttendee.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'D')
      .replace(/[^A-Z0-9\s]/g, '');
    const transferMessageSub = `${cleanFullNameAsciiSub} ${createdAttendee.phone}`;
    const vietQrSuccessUrl = `https://img.vietqr.io/image/VCB-0331000516283-compact.png?amount=${createdAttendee.packageFee}&addInfo=${encodeURIComponent(transferMessageSub)}&accountName=HOI%20PHAU%20THUAT%2520TAO%2520HINH%2520THAM%2520MY%2520VIET%2520NAM`;

    return (
      <div className={isInline ? "w-full text-slate-800 font-sans" : "bg-slate-100 min-h-screen py-8 md:py-12 px-4 text-slate-800 font-sans"}>
        <div className={isInline ? "bg-white rounded-3xl border border-slate-250 shadow-md overflow-hidden" : "max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"}>
          {/* FormStepper indicating step 3 is active */}
          <FormStepper currentStep={3} isSubmitted={true} L={L} />

          {/* Header alert */}
          <div className="bg-teal-900 text-amber-400 p-8 text-center relative border-b border-teal-800">
            <div className="absolute top-4 left-4">
              <button
                id="btn-confirm-return"
                onClick={() => onNavigate('event-details')}
                className="p-1 px-3 rounded-lg bg-teal-850 hover:bg-teal-800 text-xs font-semibold flex items-center gap-1 text-teal-200 border border-teal-800/60 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Về trang chủ
              </button>
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-3 border border-amber-400/25">
              <CheckCircle className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">Đăng Ký Thành Công</h2>
            <p className="text-xs text-teal-200 uppercase tracking-widest font-mono mt-1">Hội Nghị Thường Niên PARS 2026</p>
          </div>

          <div className="p-6 md:p-8 space-y-6">

            {/* Confirmation notification box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 text-emerald-900 text-xs space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950 font-sans text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span>Thông tin đăng ký đã được gửi thành công qua Email và Zalo của đại biểu.</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-sans">
                Mẫu đăng ký tham gia của đại biểu <strong>{createdAttendee.title} {createdAttendee.fullName}</strong> đã được lưu trữ thành công trên hệ thống hội nghị PARS 2026.
              </p>
              <div className="space-y-1 text-slate-650 font-sans pl-1 border-l-2 border-emerald-350">
                <p>• <strong>Zalo OA:</strong> Phiếu check-in kèm mã QR đã được gửi tự động tới SĐT Zalo: <strong className="text-slate-900">{createdAttendee.phone}</strong></p>
                <p>• <strong>Email liên hệ:</strong> Thẻ điện tử và hướng dẫn chi tiết hội nghị đã được gửi đến hòm thư: <strong className="text-slate-900">{createdAttendee.email}</strong></p>
              </div>
            </div>

            {/* Electronic Ticket & Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">

              {/* Left Column: CHECK-IN PASS GỒM ẢNH QR VÉ */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                <div className="bg-teal-950 text-white p-3.5 text-center border-b border-teal-900">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block font-mono">THẺ CHECK-IN ĐẠI BIỂU</span>
                  <span className="text-[9px] text-slate-350 tracking-wider">XUẤT TRÌNH KHI ĐẾN LỄ TÂN</span>
                </div>

                <div className="p-5 flex flex-col items-center flex-1 justify-center">
                  <div className="p-2 border-2 border-dashed border-teal-600/30 rounded-2xl bg-white mb-3 shadow-inner">
                    <img
                      src={checkinQrUrl}
                      alt="Checkin QR"
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <div className="text-center space-y-1 w-full">
                    <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block">{createdAttendee.id}</span>
                    <div className="flex items-center justify-center gap-2.5 mt-2 mb-1.5 px-4">
                      {createdAttendee.avatarUrl && (
                        <img
                          src={createdAttendee.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                        />
                      )}
                      <div className={createdAttendee.avatarUrl ? 'text-left' : 'text-center w-full'}>
                        <p className="text-xs md:text-sm font-black text-slate-900 uppercase leading-snug">
                          {createdAttendee.title} {createdAttendee.fullName}
                        </p>
                        <p className="text-[10.5px] text-slate-500 font-semibold leading-tight">{createdAttendee.organization}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium">Năm sinh: {createdAttendee.yearOfBirth}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 text-center text-[10px] text-slate-500 font-medium font-mono border-t border-slate-100">
                  MÃ SỐ ĐẠI BIỂU: {createdAttendee.qrCodeValue}
                </div>
              </div>

              {/* Right Column: THANH TOÁN — conditional theo payment method đã chọn */}
              {createdAttendee.paymentMethod === 'stripe' ? (
                /* Stripe Card Payment Panel */
                <div className="border border-indigo-200 rounded-2xl overflow-hidden bg-indigo-50/20 shadow-sm flex flex-col justify-between">
                  <div className="bg-indigo-700 text-white p-3.5 text-center border-b border-indigo-600">
                    <span className="text-[10px] uppercase font-black tracking-wider block">THANH TOÁN THẺ QUỐC TẾ</span>
                    <span className="text-[9px] text-indigo-200 font-medium">VISA / MASTERCARD · POWERED BY STRIPE</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center flex-1 space-y-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <svg viewBox="0 0 48 16" className="h-7 w-auto"><rect width="48" height="16" rx="3" fill="#1A1F71" /><text x="6" y="12" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white" letterSpacing="1">VISA</text></svg>
                      <svg viewBox="0 0 36 24" className="h-7 w-auto"><circle cx="13" cy="12" r="10" fill="#EB001B" /><circle cx="23" cy="12" r="10" fill="#F79E1B" /><path d="M18 5.5a10 10 0 0 1 0 13A10 10 0 0 1 18 5.5Z" fill="#FF5F00" /></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-indigo-900">{createdAttendee.packageFee.toLocaleString()} VNĐ</p>
                      <p className="text-[10px] text-slate-500">≈ ${Math.round(createdAttendee.packageFee / 25000)} USD</p>
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed text-left">
                      {L.t('Nhấn nút bên dưới để thanh toán bằng thẻ Visa/Mastercard qua cổng Stripe bảo mật. Thông tin đăng ký đã được lưu.', 'Click below to pay by Visa/Mastercard via secure Stripe checkout. Your registration is saved.')}
                    </p>
                    {businessConfig.paymentConfig?.stripe?.publishableKey ? (
                      <a
                        href={`https://buy.stripe.com/test_link?prefilled_email=${encodeURIComponent(createdAttendee.email)}&client_reference_id=${createdAttendee.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all no-underline cursor-pointer"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {L.t('Thanh toán bằng thẻ ngay →', 'Pay with Card Now →')}
                      </a>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 text-left w-full">
                        ⚠️ {L.t('Liên hệ BTC để thanh toán quốc tế: info@pars.vn', 'Contact organizer for international payment: info@pars.vn')}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-indigo-50 text-center text-[9px] text-indigo-600 font-sans border-t border-indigo-200">
                    🔒 Mã hóa 256-bit SSL · Thông tin thẻ không lưu tại máy chủ BTC
                  </div>
                </div>
              ) : createdAttendee.paymentMethod === 'vnpay' ? (
                /* VNPay QR Panel */
                <div className="border border-blue-200 rounded-2xl overflow-hidden bg-blue-50/20 shadow-sm flex flex-col justify-between">
                  <div className="bg-blue-600 text-white p-3.5 text-center border-b border-blue-500">
                    <span className="text-[10px] uppercase font-black tracking-wider block">THANH TOÁN VNPAY QR</span>
                    <span className="text-[9px] text-blue-100 font-medium">LIÊN NGÂN HÀNG QUỐC GIA</span>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-between flex-1 space-y-3">
                    <div className="p-2 bg-white border border-blue-200 rounded-xl shadow-inner">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`VNPAYQR|${businessConfig.paymentConfig?.vnpay?.merchantId || 'PARS2026'}|${createdAttendee.packageFee}|${transferMessageSub}`)}`}
                        alt="VNPay QR"
                        referrerPolicy="no-referrer"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                    <div className="text-left w-full text-[10.5px] space-y-1.5 text-slate-700">
                      <p>• Trạng thái: <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">Chờ xác minh</span></p>
                      <p>• Số tiền: <strong className="text-teal-700 font-bold font-mono text-xs">{createdAttendee.packageFee.toLocaleString()}đ</strong></p>
                      <p>• Nội dung: <strong className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono font-extrabold text-xs">{transferMessageSub}</strong></p>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 text-center text-[9px] text-blue-800 font-sans border-t border-blue-200">
                    📱 Mở ứng dụng ngân hàng / VNPay và quét mã QR phía trên
                  </div>
                </div>
              ) : (
                /* VietQR (bank_transfer) — mặc định */
                <div className="border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/20 shadow-sm flex flex-col justify-between">
                  <div className="bg-amber-500 text-amber-950 p-3.5 text-center border-b border-amber-300">
                    <span className="text-[10px] uppercase font-black tracking-wider block">QUYỂN THANH TOÁN VIETQR</span>
                    <span className="text-[9px] text-amber-900 font-medium">BẮT BUỘC ĐỂ BTC KHỞI TẠO CME</span>
                  </div>

                  <div className="p-4 flex flex-col items-center justify-between flex-1 space-y-3">
                    {/* VietQR automatic dynamic generation code */}
                    <div className="p-1 px-[10px] bg-white border border-slate-200 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]">
                      <img
                        src={vietQrSuccessUrl}
                        alt="VietQR code"
                        referrerPolicy="no-referrer"
                        className="w-40 h-auto object-contain mx-auto"
                      />
                    </div>

                    <div className="text-left w-full text-[10.5px] space-y-1.5 text-slate-700">
                      <p>• Trạng thái: <span className="font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">Chờ xác minh</span></p>
                      <p>• Ngân hàng: <strong className="text-slate-900 font-mono">VIETCOMBANK</strong></p>
                      <p>• Số tài khoản: <strong className="text-teal-900 font-mono font-bold text-xs">0331000516283</strong></p>
                      <p>• Chủ tài khoản: <strong className="text-slate-900 font-sans uppercase">Hoi phau thuat tao hinh tham my Viet Nam</strong></p>
                      <p>• Số tiền: <strong className="text-teal-700 font-bold font-mono text-xs">{createdAttendee.packageFee.toLocaleString()}đ</strong></p>
                      <p>• Nội dung CK: <strong className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-extrabold text-xs">{transferMessageSub}</strong></p>
                    </div>
                  </div>

                  <div className="p-2 bg-amber-100/40 text-center text-[9px] text-amber-900 font-sans border-t border-amber-200">
                    ⚠️ Quét QR bằng ứng dụng ngân hàng để tự điền nội dung & số tiền chính xác.
                  </div>
                </div>
              )}
            </div>

            {/* Proof of Payment file uploader on Step 4 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Upload className="w-4 h-4 text-teal-600 animate-bounce" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {L.t('Đính Kèm Biên Lai Chuyển Khoản (Để BTC Đối Soát Nhanh)', 'Attach Payment Receipt (For Fast Verification)')}
                </h4>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                {L.t('Sau khi quét mã QR thanh toán phía trên, đại biểu vui lòng tải lên hình ảnh biên nhận chuyển khoản thành công. Ban thư ký sẽ đối soát giao dịch và phê duyệt hồ sơ của đại biểu tức thì.', 'After scanning the VietQR code above, please upload the payment receipt. The secretariat will verify the transaction and approve your registration immediately.')}
              </p>
              <div className="flex items-center gap-3">
                <div 
                  role="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 cursor-pointer text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all w-fit select-none"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  {L.t('Đính kèm hóa đơn chuyển khoản', 'Attach Receipt')}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProofUploadInSuccess}
                    className="hidden"
                  />
                </div>
                {isUploading && <span className="text-[10px] text-slate-400 font-mono animate-pulse">{L.t('Đang nạp file...', 'Uploading...')}</span>}
                {createdAttendee.transactionProofUrl && <span className="text-xs text-emerald-650 font-bold flex items-center gap-1">{L.t('✓ Đã tải ảnh hóa đơn thành công!', '✓ Receipt uploaded successfully!')}</span>}
              </div>
              {createdAttendee.transactionProofUrl && (
                <div className="relative w-fit mt-2 border border-slate-200 rounded-xl p-1 bg-slate-50 shadow-inner">
                  <img
                    src={createdAttendee.transactionProofUrl}
                    alt="Transaction Proof"
                    className="h-28 w-auto object-contain rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveProofInSuccess}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white leading-none rounded-full w-5 h-5 text-[10px] font-black border border-white flex items-center justify-center cursor-pointer hover:bg-rose-700 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* CME specific confirmation data display if requested */}
            {createdAttendee.cmeRequired && (
              <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl text-[11px] text-teal-950 space-y-1">
                <p className="font-bold text-teal-900 uppercase tracking-wide text-[10px]">ĐĂNG KÝ CẤP CHỨNG CHỈ CME ĐÃ GHI NHẬN:</p>
                <p>• Đại biểu có nhu cầu cấp CME y tế liên tục: <strong>Có</strong></p>
                <p>• Nơi nhận chứng chỉ giấy: <strong>{createdAttendee.address || createdAttendee.province}</strong></p>
              </div>
            )}

            {/* Instruction Footer action buttons */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
              <strong>* Ban Tổ Chức Hướng Dẫn:</strong> Sau khi hoàn thành chuyển tiền qua QR ngân hàng và tải lên biên lai, trạng thái đóng phí của đại biểu sẽ được duyệt sang màu xanh <strong>PAID (Đã đóng phí)</strong> trên ứng dụng.
            </div>

            {/* SePay auto payment check */}
            {(() => {
              const sepay = store.getSepayConfig();
              if (!sepay.isEnabled || !sepay.apiToken) return null;
              return (
                <SepayPaymentChecker
                  transferContent={transferMessageSub}
                  expectedAmount={createdAttendee.packageFee || 0}
                  attendeeId={createdAttendee.id}
                />
              );
            })()}

            <div className="pt-4 flex flex-col md:flex-row gap-3">
              <button
                onClick={() => window.location.href = 'https://pars.vn'}
                className="flex-1 py-3 text-xs bg-slate-900 hover:bg-slate-950 text-white font-black uppercase text-center rounded-xl tracking-wider transition-all cursor-pointer"
              >
                Quay về trang chủ: Pars.vn
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer"
              >
                In Thẻ & Hóa Đơn 🖨️
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={isInline ? "w-full text-slate-800 font-sans" : "bg-slate-100 min-h-screen py-8 md:py-12 px-4 text-slate-800 font-sans"}>
      <div className={isInline ? "w-full" : "max-w-4xl mx-auto"}>


        {/* Form Container with Premium aesthetic */}
        <div className={isInline ? "bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden" : "bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"}>

          {/* CLOSED FORM SCREEN */}
          {formCfg?.isOpen === false && (
            <div
              className="p-12 text-center"
              style={{ backgroundColor: formCfg?.headerBgColor || '#042f2e' }}
            >
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-white font-black text-xl mb-3">Cổng đăng ký đã đóng</h2>
              <p className="text-white/70 text-sm max-w-md mx-auto">
                {formCfg?.closedMessage || 'Cổng đăng ký hiện đã đóng. Vui lòng liên hệ Ban tổ chức để biết thêm thông tin.'}
              </p>
            </div>
          )}

          {/* OPEN FORM */}
          {formCfg?.isOpen !== false && (
            <>

              {/* Header Section */}
              {!formCfg?.hideHeader && (
                <div
                  className="text-white p-6 md:p-8 border-b-4 relative"
                  style={{
                    backgroundColor: formCfg?.headerBgColor || '#042f2e',
                    borderBottomColor: formCfg?.accentColor || '#fbbf24',
                  }}
                >
                  <div className="absolute right-4 top-4 hidden md:block">
                    <span className="text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest font-mono"
                      style={{ color: formCfg?.accentColor || '#fbbf24', backgroundColor: `${formCfg?.accentColor || '#fbbf24'}18`, borderColor: `${formCfg?.accentColor || '#fbbf24'}40` }}>
                      REGISTRATION PORTAL
                    </span>
                  </div>

                  {formCfg?.bannerImageUrl && (
                    <img src={formCfg.bannerImageUrl} alt="Banner" className="h-12 object-contain mb-3 rounded" />
                  )}

                  <div className="max-w-xl">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase block font-mono"
                      style={{ color: formCfg?.accentColor || '#fbbf24' }}>
                      {formCfg?.organizerLabel || 'HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)'}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black mt-1.5 tracking-tight uppercase">
                      {formCfg?.formTitle || 'ĐĂNG KÝ ĐẠI BIỂU THAM DỰ HỘI NGHỊ THƯỜNG NIÊN PARS 2026'}
                    </h1>
                    <p className="text-white/70 text-xs mt-1.5 leading-relaxed font-medium">
                      {formCfg?.formDescription || 'Cổng đăng ký điện tử dành cho đại biểu, bác sĩ thẩm mỹ trong nước & quốc tế.'}
                    </p>
                  </div>
                </div>
              )}



              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                {errorMsg && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-semibold">{errorMsg}</span>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                  {/* LEFT COLUMN: Personal Info, Package selection, CME & Gala */}
                  <div className="lg:col-span-7 space-y-8">

                    {/* STEP 1: THÔNG TIN ĐẠI BIỂU */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                        <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">01</span>
                        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                          {L.section('personalInfo', 'THÔNG TIN ĐẠI BIỂU ĐĂNG KÝ', 'DELEGATE PERSONAL INFORMATION')}
                        </h3>
                      </div>

                      {/* Hàng 1 — 2 cột: Avatar | Họ và Tên */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        {/* Cột trái: Avatar upload */}
                        <div className="flex flex-col gap-3">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('avatar', 'Ảnh Chân Dung / Avatar *', 'Portrait Photo *')}
                          </label>
                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="relative group shrink-0 w-20 h-20 rounded-full bg-slate-250 border-2 border-dashed border-teal-600/30 flex items-center justify-center overflow-hidden">
                              {avatarImage ? (
                                <img src={avatarImage} className="w-full h-full object-cover" alt="Avatar" />
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold text-center p-1 leading-none select-none">
                                  {L.t('Chưa có ảnh', 'No Photo')}
                                </span>
                              )}
                              {isAvatarUploading && (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-[10px] text-white font-mono">
                                  Loading...
                                </div>
                              )}
                            </div>
                            <div className="space-y-2 flex-1 min-w-0">
                              <p className="text-[10px] text-slate-500 leading-snug">
                                {L.t('Khuyên dùng ảnh chân dung rõ mặt để check-in nhận diện khuôn mặt.', 'Clear face portrait for instant facial recognition check-in.')}
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  role="button"
                                  onClick={() => avatarInputRef.current?.click()}
                                  className="px-3 py-1 bg-white hover:bg-slate-105 border border-slate-350 text-[11px] font-bold rounded-lg cursor-pointer transition-all select-none"
                                >
                                  {L.t('Tải ảnh', 'Upload')}
                                  <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                  />
                                </div>
                                {avatarImage && (
                                  <button
                                    type="button"
                                    onClick={() => setAvatarImage(null)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold rounded-lg border-none cursor-pointer"
                                  >
                                    {L.t('Xóa', 'Remove')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cột phải: Họ và Tên */}
                        <div className="flex flex-col justify-center">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('fullName', 'Họ và Tên (In hoa có dấu) *', 'Full Name (Capitalized) *')}
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value.toUpperCase())}
                            placeholder={L.p('ví dụ: NGUYỄN VĂN A', 'e.g. NGUYEN VAN A')}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:border-teal-600 focus:outline-none focus:bg-white uppercase tracking-wider transition-all placeholder-slate-400"
                          />
                          <span className="text-[10px] text-slate-400 mt-1.5 block">
                            {L.t('Nhập đầy đủ họ tên in hoa có dấu để in trên thẻ đại biểu và chứng chỉ', 'Enter full capitalized name for delegate badge and certificate')}
                          </span>
                        </div>
                      </div>

                      {/* Hàng 2 — 3 cột đều nhau: Năm sinh | Số điện thoại | Email */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('yearOfBirth', 'Năm sinh *', 'Year of Birth *')}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={yearOfBirth}
                            onChange={(e) => setYearOfBirth(e.target.value.replace(/D/g, ''))}
                            placeholder={L.p('ví dụ: 1988', 'e.g. 1988')}
                            className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {L.t('Cần thiết cho chứng chỉ CME', 'Required for CME certification')}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('phone', 'Số điện thoại di động *', 'Contact Phone Number *')}
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={L.p('ví dụ: 0912345678', 'e.g. 0912345678')}
                            className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-teal-600 focus:outline-none placeholder-slate-400 animate-fade-in"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {L.t('Zalo OA dùng để gửi vé QR tự động', 'Zalo OA for automated QR ticket sending')}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('email', 'Địa chỉ Email nhận vé & CME *', 'Email for Ticket & CME *')}
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={L.p('ví dụ: bacsi.nguyen@gmail.com', 'e.g. doctor@gmail.com')}
                            className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                          />
                        </div>
                      </div>

                      {/* Hàng 3 — 2 cột: Đơn vị công tác | Địa chỉ liên hệ */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('workplace', 'Đơn vị công tác *', 'Workplace *')}
                          </label>
                          <input
                            type="text"
                            required
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder={L.p('ví dụ: Bệnh viện Chợ Rẫy', 'e.g. Cho Ray Hospital')}
                            className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {L.f('address', 'Địa chỉ liên hệ *', 'Contact Address *')}
                          </label>
                          <input
                            type="text"
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={L.p('ví dụ: Phường Thảo Điền, TP Thủ Đức, Hồ Chí Minh', 'e.g. Thao Dien, Thu Duc City, Ho Chi Minh City')}
                            className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: CHỌN GÓI ĐĂNG KÝ HỘI NGHỊ */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                        <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">02</span>
                        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                          {L.section('package', 'CHỌN GÓI ĐĂNG KÝ HỘI NGHỊ', 'CONFERENCE REGISTRATION PACKAGE')}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {packages
                          .filter((pkg) => {
                            if (nationality === 'vietname') {
                              return pkg.id === 'pkg-member' || pkg.id === 'pkg-standard' || pkg.id === 'pkg-student';
                            } else {
                              return pkg.id === 'pkg-foreign';
                            }
                          })
                          .map((pkg) => {
                            const isSelected = packageId === pkg.id;
                            const currentPkgPrice = pkg.fee;
                            return (
                              <label
                                key={pkg.id}
                                onClick={() => handleSelectPackage(pkg.id)}
                                className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-start gap-4 transition-all relative ${isSelected
                                  ? 'bg-teal-50/40 border-teal-600 ring-2 ring-teal-600/20 shadow-lg'
                                  : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm'
                                  }`}
                              >
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${pkg.id === 'pkg-member' ? 'bg-indigo-100 text-indigo-850 border border-indigo-200' :
                                      pkg.id === 'pkg-standard' ? 'bg-teal-100 text-teal-850 border border-teal-100' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                      {pkg.id === 'pkg-member' ? L.t('Hội Viên', 'Member') :
                                        pkg.id === 'pkg-standard' ? L.t('Tiêu chuẩn', 'Standard') :
                                          pkg.id === 'pkg-student' ? L.t('Học Viên', 'Student/Resident') :
                                            pkg.id === 'pkg-free' ? L.t('Báo cáo viên', 'Speaker') : L.t('Quốc tế', 'International')}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="font-black text-xs md:text-sm text-slate-950 block leading-tight">{pkg.name}</span>

                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {pkg.id === 'pkg-free' ? (
                                        <span className="px-1 py-0.2 bg-teal-50 text-teal-800 border border-teal-100 rounded text-[7.5px] font-black">{L.t('✓ MIỄN PHÍ', '✓ FREE')}</span>
                                      ) : (
                                        <span className="px-1 py-0.2 bg-slate-100 text-slate-400 rounded text-[7.5px] font-bold">{L.t('Phí tự chọn phụ trợ', 'Add-on fees excluded')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="font-mono font-black text-slate-950 text-sm md:text-base text-right">
                                    {pkg.id === 'pkg-foreign' ? (
                                      <span>
                                        ${Math.round(pkg.fee / 25000)}{' '}
                                        <span className="text-[10px] font-normal text-slate-400 font-sans block mt-0.5">
                                          ({pkg.fee.toLocaleString()} VNĐ)
                                        </span>
                                      </span>
                                    ) : (
                                      <span>
                                        {currentPkgPrice.toLocaleString()}{' '}
                                        <span className="text-[10px] font-normal text-slate-400 font-sans">VNĐ</span>
                                      </span>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: other add-ons, note fields, cumulative fee panel, submit button */}
                  <div className="lg:col-span-5 space-y-8">

                    {/* CME & Gala Dinner selections */}
                    {(() => {
                      const leftAddOns = addOnServices.filter(svc => svc.isEnabled && (svc.id.toLowerCase().includes('cme') || svc.id.toLowerCase().includes('gala')));
                      if (leftAddOns.length === 0) return null;
                      return (
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                            <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">03</span>
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                              {L.t('Cấp Chứng Chỉ CME & Gala Dinner', 'CME Certification & Gala Dinner')}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {leftAddOns.map((svc) => {
                              const isSelected = addOnSelections[svc.id] || false;
                              const svcFee = svc.fee;
                              const colorMap = {
                                teal: { bg: 'bg-teal-50/40', border: 'border-teal-600', ring: 'ring-teal-600/10', text: 'text-teal-900', checkbox: 'text-teal-800' },
                                amber: { bg: 'bg-amber-50/40', border: 'border-amber-500', ring: 'ring-amber-500/10', text: 'text-amber-850', checkbox: 'text-amber-600' },
                                purple: { bg: 'bg-purple-50/40', border: 'border-purple-500', ring: 'ring-purple-500/10', text: 'text-purple-850', checkbox: 'text-purple-600' },
                                pink: { bg: 'bg-pink-50/40', border: 'border-pink-500', ring: 'ring-pink-500/10', text: 'text-pink-850', checkbox: 'text-pink-600' },
                                indigo: { bg: 'bg-indigo-50/40', border: 'border-indigo-500', ring: 'ring-indigo-500/10', text: 'text-indigo-850', checkbox: 'text-indigo-600' },
                                rose: { bg: 'bg-rose-50/40', border: 'border-rose-500', ring: 'ring-rose-500/10', text: 'text-rose-850', checkbox: 'text-rose-600' },
                              };
                              const c = colorMap[svc.color || 'teal'] || colorMap.teal;

                              return (
                                <div
                                  key={svc.id}
                                  onClick={() => toggleAddOn(svc.id)}
                                  className={`p-4 rounded-2xl border cursor-pointer select-none transition-all ${isSelected
                                    ? `${c.bg} ${c.border} ring-2 ${c.ring}`
                                    : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm hover:shadow-xs'
                                    }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleAddOn(svc.id);
                                      }}
                                      className={`w-5 h-5 rounded border-slate-300 ${c.checkbox} focus:ring-current mt-0.5 cursor-pointer`}
                                    />
                                    <div>
                                      <span className={`text-xs font-black ${c.text} block uppercase`}>
                                        {L.t(`${svc.nameVi} (+ ${svcFee.toLocaleString()}đ)`, `${svc.nameEn} (+ ${svcFee.toLocaleString()} VND)`)}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5">
                                        {L.t(svc.descriptionVi, svc.descriptionEn)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Other services */}
                    {(() => {
                      const rightAddOns = addOnServices.filter(svc => svc.isEnabled && !(svc.id.toLowerCase().includes('cme') || svc.id.toLowerCase().includes('gala')));
                      if (rightAddOns.length === 0) return null;
                      return (
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                            <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">04</span>
                            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                              {L.t('Dịch Vụ Phụ Trợ Khác', 'Other Optional Services')}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {rightAddOns.map((svc) => {
                              const isSelected = addOnSelections[svc.id] || false;
                              const svcFee = svc.fee;
                              const colorMap = {
                                teal: { bg: 'bg-teal-50/40', border: 'border-teal-600', ring: 'ring-teal-600/10', text: 'text-teal-900', checkbox: 'text-teal-800' },
                                amber: { bg: 'bg-amber-50/40', border: 'border-amber-500', ring: 'ring-amber-500/10', text: 'text-amber-850', checkbox: 'text-amber-600' },
                                purple: { bg: 'bg-purple-50/40', border: 'border-purple-500', ring: 'ring-purple-500/10', text: 'text-purple-850', checkbox: 'text-purple-600' },
                                pink: { bg: 'bg-pink-50/40', border: 'border-pink-500', ring: 'ring-pink-500/10', text: 'text-pink-850', checkbox: 'text-pink-600' },
                                indigo: { bg: 'bg-indigo-50/40', border: 'border-indigo-500', ring: 'ring-indigo-500/10', text: 'text-indigo-850', checkbox: 'text-indigo-600' },
                                rose: { bg: 'bg-rose-50/40', border: 'border-rose-500', ring: 'ring-rose-500/10', text: 'text-rose-850', checkbox: 'text-rose-600' },
                              };
                              const c = colorMap[svc.color || 'teal'] || colorMap.teal;

                              return (
                                <div
                                  key={svc.id}
                                  onClick={() => toggleAddOn(svc.id)}
                                  className={`p-4 rounded-2xl border cursor-pointer select-none transition-all ${isSelected
                                    ? `${c.bg} ${c.border} ring-2 ${c.ring}`
                                    : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm hover:shadow-xs'
                                    }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleAddOn(svc.id);
                                      }}
                                      className={`w-5 h-5 rounded border-slate-300 ${c.checkbox} focus:ring-current mt-0.5 cursor-pointer`}
                                    />
                                    <div>
                                      <span className={`text-xs font-black ${c.text} block uppercase`}>
                                        {L.t(`${svc.nameVi} (+ ${svcFee.toLocaleString()}đ)`, `${svc.nameEn} (+ ${svcFee.toLocaleString()} VND)`)}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5">
                                        {L.t(svc.descriptionVi, svc.descriptionEn)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}



                    {/* Note fields */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                        <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                          {addOnServices.filter(svc => svc.isEnabled && !(svc.id.toLowerCase().includes('cme') || svc.id.toLowerCase().includes('gala'))).length > 0 ? '06' : '05'}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                          {L.t('Yêu Cầu Đặc Biệt', 'Special Requests')}
                        </h3>
                      </div>
                      <RichTextEditor
                        value={notes}
                        onChange={setNotes}
                        label={L.f('notes', 'Ghi chú yêu cầu đặc biệt khác cho BTC', 'Special notes or request for Organizer')}
                        placeholder={L.p('ví dụ: Đóng gói ăn chay, Xuất hóa đơn đỏ cho cơ quan bệnh viện công (ghi rõ MST, Tên tổ chức)...', 'e.g. Vegetarian meal, Invoice details (Tax code, Name)...')}
                        id="delegate-notes"
                      />
                    </div>

                    {/* Cumulative Fee Panel */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-250 space-y-3 shadow-inner">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block border-b border-slate-200 pb-2">
                        {L.t('TỔNG HỢP CHI PHÍ ĐĂNG KÝ HỘI NGHỊ', 'REGISTRATION FEE SUMMARY')}
                      </span>
                      <div className="space-y-2 text-xs font-semibold text-slate-700">
                        <div className="flex justify-between">
                          <span>{L.t('Phí Gói Đăng Ký', 'Package Fee')} ({selectedPackage?.name}):</span>
                          <span className="font-mono text-slate-905">
                            {selectedPackage?.id === 'pkg-foreign' ? (
                              `$${Math.round(baseFee / 25000)} (${baseFee.toLocaleString()} VNĐ)`
                            ) : (
                              `${baseFee.toLocaleString()} VNĐ`
                            )}
                          </span>
                        </div>
                        {addOnFeeDetails.map(d => (
                          <div key={d.id} className="flex justify-between">
                            <span>• {L.t(d.nameVi, d.nameEn)}:</span>
                            <span className="font-mono text-slate-905">+{d.fee.toLocaleString()} VNĐ</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-teal-900 bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs md:text-sm font-black mt-3">
                          <span>{L.t('TỔNG LỆ PHÍ ĐĂNG KÝ CẦN ĐÓNG:', 'TOTAL REGISTRATION FEE:')}</span>
                          <span className="font-mono">{calculatedTotalFee.toLocaleString()} VNĐ</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Button Step 1 */}
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) {
                            setCurrentStep(2);
                            scrollToFormTop();
                          }
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-xl transition-all border border-amber-400/40 relative group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        {L.t('Tiếp Tục Chọn Phương Thức Thanh Toán ➜', 'Continue to Payment Method ➜')}
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                  {/* Left Column: Payment selector and QR display */}
                  <div className="lg:col-span-7 space-y-6">
                    <PaymentMethodSelector
                      nationality={nationality}
                      selectedMethod={selectedPaymentMethod}
                      onSelect={setSelectedPaymentMethod}
                      paymentConfig={businessConfig.paymentConfig}
                      totalFee={calculatedTotalFee}
                      lang={nationality === 'vietname' ? 'vi' : 'en'}
                    />

                    {/* Payment Details Container */}
                    {selectedPaymentMethod === 'stripe' ? (
                      <div className="border border-indigo-250 rounded-2xl overflow-hidden bg-indigo-50/10 shadow-sm flex flex-col justify-between">
                        <div className="bg-indigo-700 text-white p-3.5 text-center border-b border-indigo-600">
                          <span className="text-[10px] uppercase font-black tracking-wider block">THANH TOÁN THẺ QUỐC TẾ</span>
                          <span className="text-[9px] text-indigo-200 font-medium">VISA / MASTERCARD · POWERED BY STRIPE</span>
                        </div>
                        <div className="p-5 flex flex-col items-center justify-center space-y-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <svg viewBox="0 0 48 16" className="h-7 w-auto"><rect width="48" height="16" rx="3" fill="#1A1F71" /><text x="6" y="12" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white" letterSpacing="1">VISA</text></svg>
                            <svg viewBox="0 0 36 24" className="h-7 w-auto"><circle cx="13" cy="12" r="10" fill="#EB001B" /><circle cx="23" cy="12" r="10" fill="#F79E1B" /><path d="M18 5.5a10 10 0 0 1 0 13A10 10 0 0 1 18 5.5Z" fill="#FF5F00" /></svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-indigo-900">{calculatedTotalFee.toLocaleString()} VNĐ</p>
                            <p className="text-[10px] text-slate-500">≈ ${Math.round(calculatedTotalFee / 25000)} USD</p>
                          </div>
                          <p className="text-[10.5px] text-slate-600 leading-relaxed text-left">
                            {L.t('Đại biểu sẽ thanh toán qua cổng Stripe bảo mật ở bước tiếp theo sau khi hoàn tất đăng ký.', 'You will be redirected to pay by Card via secure Stripe checkout in the next step after confirming registration.')}
                          </p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-center text-[9px] text-indigo-600 font-sans border-t border-indigo-200">
                          🔒 Mã hóa 256-bit SSL · Thông tin bảo mật tuyệt đối
                        </div>
                      </div>
                    ) : selectedPaymentMethod === 'vnpay' ? (
                      <div className="border border-blue-200 rounded-2xl overflow-hidden bg-blue-50/10 shadow-sm flex flex-col justify-between">
                        <div className="bg-blue-600 text-white p-3.5 text-center border-b border-blue-500">
                          <span className="text-[10px] uppercase font-black tracking-wider block">THANH TOÁN VNPAY QR</span>
                          <span className="text-[9px] text-blue-100 font-medium">LIÊN NGÂN HÀNG QUỐC GIA</span>
                        </div>
                        <div className="p-5 flex flex-col items-center justify-between space-y-4">
                          <div className="p-2 bg-white border border-blue-200 rounded-xl shadow-inner">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`VNPAYQR|${businessConfig.paymentConfig?.vnpay?.merchantId || 'PARS2026'}|${calculatedTotalFee}|${transferMessage}`)}`}
                              alt="VNPay QR"
                              referrerPolicy="no-referrer"
                              className="w-36 h-36 object-contain"
                            />
                          </div>
                          <div className="text-left w-full text-[10.5px] space-y-1.5 text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <p>• Ngân hàng thanh toán: <span className="font-bold text-blue-705">VNPay QR hỗ trợ mọi ứng dụng ngân hàng</span></p>
                            <p>• Số tiền: <strong className="text-teal-700 font-bold font-mono text-xs">{calculatedTotalFee.toLocaleString()}đ</strong></p>
                            <p>• Nội dung: <strong className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono font-extrabold text-xs">{transferMessage}</strong></p>
                          </div>
                        </div>
                        <div className="p-2 bg-blue-50 text-center text-[9px] text-blue-800 font-sans border-t border-blue-200">
                          📱 Mở ứng dụng ngân hàng / VNPay và quét mã QR phía trên
                        </div>
                      </div>
                    ) : (
                      /* VietQR / Bank Transfer */
                      <div className="space-y-6">
                        <div className="border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/10 shadow-sm flex flex-col justify-between">
                          <div className="bg-amber-500 text-amber-950 p-3.5 text-center border-b border-amber-300">
                            <span className="text-[10px] uppercase font-black tracking-wider block">QUÉT MÃ THANH TOÁN VIETQR</span>
                            <span className="text-[9px] text-amber-900 font-medium">BẮT BUỘC ĐỂ BTC KHỞI TẠO CME</span>
                          </div>

                          <div className="p-5 flex flex-col items-center justify-between space-y-4">
                            <div className="p-1 px-[10px] bg-white border border-slate-200 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]">
                              <img
                                src={currentVietQRUrl}
                                alt="VietQR code"
                                referrerPolicy="no-referrer"
                                className="w-40 h-auto object-contain mx-auto"
                              />
                            </div>

                            <div className="text-left w-full text-[10.5px] space-y-1.5 text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                              <p>• Ngân hàng: <strong className="text-slate-900 font-mono">VIETCOMBANK</strong></p>
                              <p>• Số tài khoản: <strong className="text-teal-900 font-mono font-bold text-xs">0331000516283</strong></p>
                              <p>• Chủ tài khoản: <strong className="text-slate-900 font-sans uppercase">Hoi phau thuat tao hinh tham my Viet Nam</strong></p>
                              <p>• Số tiền: <strong className="text-teal-700 font-bold font-mono text-xs">{calculatedTotalFee.toLocaleString()}đ</strong></p>
                              <p>• Nội dung CK: <strong className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-extrabold text-xs">{transferMessage}</strong></p>
                            </div>
                          </div>

                          <div className="p-2 bg-amber-100/40 text-center text-[9px] text-amber-900 font-sans border-t border-amber-200">
                            ⚠️ Quét QR bằng ứng dụng ngân hàng để tự điền nội dung & số tiền chính xác.
                          </div>
                        </div>

                        {/* Proof Upload in Step 2 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Upload className="w-4 h-4 text-teal-600 animate-bounce" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              {L.t('Đính Kèm Biên Lai Chuyển Khoản (Để BTC Đối Soát Nhanh)', 'Attach Payment Receipt (For Fast Verification)')}
                            </h4>
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                            {L.t('Sau khi quét mã QR thanh toán phía trên, đại biểu vui lòng tải lên hình ảnh biên nhận chuyển khoản thành công. Ban thư ký sẽ đối soát giao dịch và phê duyệt hồ sơ của đại biểu tức thì.', 'After scanning the VietQR code above, please upload the payment receipt. The secretariat will verify the transaction and approve your registration immediately.')}
                          </p>
                          <div className="flex items-center gap-3">
                            <div 
                              role="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 cursor-pointer text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all w-fit select-none"
                            >
                              <Upload className="w-4 h-4 text-slate-500" />
                              {L.t('Đính kèm hóa đơn chuyển khoản', 'Attach Receipt')}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                            {isUploading && <span className="text-[10px] text-slate-400 font-mono animate-pulse">{L.t('Đang nạp file...', 'Uploading...')}</span>}
                            {proofImage && <span className="text-xs text-emerald-650 font-bold flex items-center gap-1">{L.t('✓ Đã đính kèm ảnh hóa đơn!', '✓ Receipt attached!')}</span>}
                          </div>
                          {proofImage && (
                            <div className="relative w-fit mt-2 border border-slate-200 rounded-xl p-1 bg-slate-50 shadow-inner">
                              <img
                                src={proofImage}
                                alt="Transaction Proof"
                                className="h-28 w-auto object-contain rounded-lg border border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => setProofImage(null)}
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white leading-none rounded-full w-5 h-5 text-[10px] font-black border border-white flex items-center justify-center cursor-pointer hover:bg-rose-700 shadow-sm"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Fee summary and submission buttons */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Cumulative Fee Panel */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-250 space-y-3 shadow-inner">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block border-b border-slate-200 pb-2">
                        {L.t('TỔNG HỢP CHI PHÍ ĐĂNG KÝ HỘI NGHỊ', 'REGISTRATION FEE SUMMARY')}
                      </span>
                      <div className="space-y-2 text-xs font-semibold text-slate-700">
                        <div className="flex justify-between">
                          <span>{L.t('Phí Gói Đăng Ký', 'Package Fee')} ({selectedPackage?.name}):</span>
                          <span className="font-mono text-slate-905">
                            {selectedPackage?.id === 'pkg-foreign' ? (
                              `$${Math.round(baseFee / 25000)} (${baseFee.toLocaleString()} VNĐ)`
                            ) : (
                              `${baseFee.toLocaleString()} VNĐ`
                            )}
                          </span>
                        </div>
                        {addOnFeeDetails.map(d => (
                          <div key={d.id} className="flex justify-between">
                            <span>• {L.t(d.nameVi, d.nameEn)}:</span>
                            <span className="font-mono text-slate-905">+{d.fee.toLocaleString()} VNĐ</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-teal-900 bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs md:text-sm font-black mt-3">
                          <span>{L.t('TỔNG LỆ PHÍ ĐĂNG KÝ CẦN ĐÓNG:', 'TOTAL REGISTRATION FEE:')}</span>
                          <span className="font-mono">{calculatedTotalFee.toLocaleString()} VNĐ</span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(1); scrollToFormTop(); }}
                        className="px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all"
                      >
                        {L.t('Quay Lại', 'Back')}
                      </button>
                      
                      <button
                        id="btn-submit-delegate"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 max-w-[240px] px-6 py-3.5 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-xl transition-all border border-amber-400/40 relative group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        {isSubmitting ? L.t('Đang gửi...', 'Submitting...') : L.t('Xác Nhận & Hoàn Tất ⚡', 'Confirm & Complete ⚡')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>

              {/* Footer Note from config */}
              {formCfg?.footerNote && (
                <div className="px-6 pb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10.5px] text-slate-600 text-center leading-relaxed">
                    {formCfg.footerNote}
                  </div>
                </div>
              )}

            </>
          )}


        </div>
      </div>
    </div>
  );
}
