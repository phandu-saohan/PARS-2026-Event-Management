/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle, QrCode, Mail, Phone, FileText, Upload, 
  AlertCircle, Sparkles, Check, HelpCircle, MapPin, User, Calendar
} from 'lucide-react';
import { store } from '../dataStore';
import { Attendee, CustomFormConfig, AddOnService, FormFieldConfig } from '../types';
import { getProvinceList } from '../data/vnProvinces';

const DEFAULT_FIELDS_ORDER = [
  'fullName',
  'phone',
  'email',
  'organization',
  'title',
  'department',
  'address',
  'yearOfBirth',
  'gender',
  'cmeRequired',
  'cmeIdentityNo',
  'galaRequired',
  'masterclassRequired',
  'tourRequired',
  'province',
  'avatarUrl',
  'doctorProofUrl',
];

interface PublicCustomRegisterProps {
  onNavigate: (view: string) => void;
}

export default function PublicCustomRegister({ onNavigate }: PublicCustomRegisterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const doctorProofInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Parse formId from URL query string
  const [formId, setFormId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('formId');
    } catch {
      return null;
    }
  });

  const [formConfig, setFormConfig] = useState<CustomFormConfig | null>(null);
  const [businessConfig, setBusinessConfig] = useState(() => store.getBusinessConfig());
  const [loadingForm, setLoadingForm] = useState(true);

  // Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);

  // Form inputs state
  const [title, setTitle] = useState('BS');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [province, setProvince] = useState('Hồ Chí Minh');
  const [address, setAddress] = useState('');
  const [packageId, setPackageId] = useState('');
  
  // Add-ons
  const [cmeRequired, setCmeRequired] = useState(false);
  const [cmeIdentityNo, setCmeIdentityNo] = useState('');
  const [galaRequired, setGalaRequired] = useState(false);
  const [masterclassRequired, setMasterclassRequired] = useState(false);
  const [tourRequired, setTourRequired] = useState(false);

  // Uploaded files (Base64 offline support)
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [doctorProofImage, setDoctorProofImage] = useState<string | null>(null);
  const [transactionProofImage, setTransactionProofImage] = useState<string | null>(null);

  // Upload indicators
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isDoctorProofUploading, setIsDoctorProofUploading] = useState(false);
  const [isProofUploading, setIsProofUploading] = useState(false);

  // Custom field values state
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Load form settings on startup
  useEffect(() => {
    if (formId) {
      const allForms = store.getCustomForms();
      const currentForm = allForms.find(f => f.id === formId);
      if (currentForm) {
        setFormConfig(currentForm);
        // Default selected package to the first active package in the list
        if (currentForm.packages && currentForm.packages.length > 0) {
          setPackageId(currentForm.packages[0].id);
        }
      }
    }
    setLoadingForm(false);
  }, [formId]);

  // Handle auto-height posting for iframe embedding
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
  }, [currentStep, isSubmitted, formConfig]);

  if (loadingForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-teal-650 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải biểu mẫu đăng ký...</p>
        </div>
      </div>
    );
  }

  if (!formConfig || !formConfig.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase">Biểu mẫu không khả dụng</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn đăng ký này không chính xác hoặc biểu mẫu đã bị đóng bởi Ban Tổ Chức. Vui lòng liên hệ hỗ trợ hoặc quay lại trang chủ.
          </p>
          <button
            onClick={() => onNavigate('event-details')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
          >
            Quay lại Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // Get add-on service objects and fees
  const addOnServices: AddOnService[] = (businessConfig.addOnServices && businessConfig.addOnServices.length > 0) ? businessConfig.addOnServices : [
    { id: 'addon-cme', nameVi: 'Chứng chỉ CME', nameEn: 'CME Certificate', descriptionVi: 'Nhận chứng chỉ đào tạo y khoa liên tục CME sau khi kết thúc khóa học tham luận.', descriptionEn: 'Receive Continuing Medical Education (CME) certificate after completing the sessions.', fee: 350000, isEnabled: true, color: 'teal' },
    { id: 'addon-gala', nameVi: 'Gala Dinner', nameEn: 'Gala Dinner', descriptionVi: 'Đăng ký tiệc tối ẩm thực giao lưu kết nối thân mật y sỹ.', descriptionEn: 'Register for the evening Gala Dinner for friendly medical networking.', fee: 700000, isEnabled: true, color: 'amber' },
    { id: 'addon-masterclass', nameVi: 'Master Class', nameEn: 'Master Class', descriptionVi: 'Nhận truyền thụ và chuyển giao công nghệ thẩm mỹ lâm sàn chuyên sâu.', descriptionEn: 'Receive knowledge sharing and technology transfer for advanced aesthetic clinical methods.', fee: 500000, isEnabled: true, color: 'purple' },
    { id: 'addon-tour', nameVi: 'Tour tham quan', nameEn: 'Sightseeing Tour', descriptionVi: 'Đóng phí Tour tham luận văn hóa dã ngoại theo lịch trình hội nghị.', descriptionEn: 'Register for cultural tour field trips following the official schedule.', fee: 4500000, isEnabled: true, color: 'pink' }
  ];

  const cmeFee = addOnServices.find(s => s.id === 'addon-cme')?.fee || 350000;
  const galaFee = addOnServices.find(s => s.id === 'addon-gala')?.fee || 700000;
  const masterclassFee = addOnServices.find(s => s.id === 'addon-masterclass')?.fee || 500000;
  const tourFee = addOnServices.find(s => s.id === 'addon-tour')?.fee || 4500000;

  // Selected package details
  const selectedPkg = formConfig.packages.find(p => p.id === packageId) || formConfig.packages[0];

  // Calculate Total Lệ Phí
  const packageFee = selectedPkg ? selectedPkg.fee : 0;
  const calculatedTotalFee = packageFee + 
    (cmeRequired ? cmeFee : 0) + 
    (galaRequired ? galaFee : 0) + 
    (masterclassRequired ? masterclassFee : 0) + 
    (tourRequired ? tourFee : 0);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, loadingSetter: (val: boolean) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Tệp quá dung lượng cho phép. Vui lòng tải ảnh dưới 8MB.');
        return;
      }
      loadingSetter(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        loadingSetter(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Vui lòng nhập họ và tên của bạn.';
    if (!phone.trim()) return 'Vui lòng nhập số điện thoại liên lạc.';
    if (!email.trim() || !email.includes('@')) return 'Vui lòng cung cấp hòm thư email chính xác.';
    if (formConfig.requiredFields.organization && !organization.trim()) return 'Vui lòng nhập cơ quan công tác.';
    if (formConfig.fields.avatarUrl && !avatarImage) return 'Vui lòng tải lên ảnh thẻ đại biểu.';
    if (formConfig.fields.doctorProofUrl && !doctorProofImage) return 'Vui lòng tải lên bằng chứng Bác sĩ (Bằng cấp).';

    // Validate custom fields
    const customFields = formConfig.fields.customFieldsList || [];
    for (const field of customFields) {
      if (field.isEnabled && field.required) {
        const val = customValues[field.key];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          return `Vui lòng nhập/chọn thông tin cho trường "${field.label}".`;
        }
      }
    }
    return null;
  };

  const handleNextStep = () => {
    const err = validateStep1();
    if (err) {
      alert(err);
      return;
    }

    if (calculatedTotalFee > 0) {
      setCurrentStep(2);
    } else {
      // Free registration, register immediately
      handleSubmitRegistration(true);
    }
  };

  const handleSubmitRegistration = (isFree = false) => {
    const existingAttendees = store.getAttendees();
    const maxSeq = existingAttendees.reduce((max, att) => {
      const match = att.id.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        return num > max ? num : max;
      }
      return max;
    }, existingAttendees.length);
    const nextSeq = maxSeq + 1;
    const padSeq = String(nextSeq).padStart(3, '0');
    const prefix = businessConfig.attendeeIdPrefix || 'PARS2026';
    const newId = `${prefix}-${padSeq}`;

    // Format custom fields to notes
    let notesText = '';
    const customFields = formConfig.fields.customFieldsList || [];
    const customLines: string[] = [];
    customFields.forEach(field => {
      if (field.isEnabled) {
        const val = customValues[field.key];
        if (val !== undefined && val !== null && val !== '') {
          let displayVal = val;
          if (Array.isArray(val)) {
            displayVal = val.join(', ');
          } else if (typeof val === 'boolean') {
            displayVal = val ? 'Có' : 'Không';
          }
          customLines.push(`- ${field.label}: ${displayVal}`);
        }
      }
    });

    if (customLines.length > 0) {
      notesText = `[Trường tùy chỉnh]\n${customLines.join('\n')}`;
    }

    const newAttendee: Attendee = {
      id: newId,
      title: formConfig.fields.title ? title : 'BS',
      fullName: fullName.toUpperCase().trim(),
      organization: organization.trim() || 'Tự do',
      department: department.trim() || '',
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      province: formConfig.fields.province ? province : 'Hồ Chí Minh',
      nationality: 'vietname',
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      packageFee: selectedPkg.fee,
      paymentStatus: isFree ? 'paid' : 'pending_verification',
      paymentMethod: isFree ? 'cash' : 'bank_transfer',
      registrationDate: new Date().toISOString().split('T')[0],
      qrCodeValue: `${newId}-${fullName.toUpperCase().replace(/\s+/g, '')}`,
      isCheckedIn: false,
      gender: formConfig.fields.gender ? gender : undefined,
      yearOfBirth: formConfig.fields.yearOfBirth ? yearOfBirth : undefined,
      cmeRequired: formConfig.fields.cmeRequired ? cmeRequired : false,
      cmeIdentityNo: (formConfig.fields.cmeRequired && cmeRequired) ? cmeIdentityNo : undefined,
      galaRequired: formConfig.fields.galaRequired ? galaRequired : false,
      masterclassRequired: formConfig.fields.masterclassRequired ? masterclassRequired : false,
      tourRequired: formConfig.fields.tourRequired ? tourRequired : false,
      avatarUrl: avatarImage || undefined,
      doctorProofUrl: doctorProofImage || undefined,
      transactionProofUrl: transactionProofImage || undefined,
      notes: notesText || undefined,
      source: formConfig.title // Sets the attendee's source to the title of this custom form
    };

    store.saveAttendee(newAttendee);

    // Auto-trigger notifications
    try {
      store.sendZaloZNS(newAttendee);
      store.sendEmail(newAttendee);
      store.sendWhatsapp(newAttendee);

      if (newAttendee.paymentStatus === 'paid') {
        const templates = store.getTemplates();
        const zTmpl = templates.find(t => t.channel === 'zalo' && t.type === 'payment_confirmed');
        const eTmpl = templates.find(t => t.channel === 'email' && t.type === 'payment_confirmed');
        const wTmpl = templates.find(t => t.channel === 'whatsapp' && t.type === 'payment_confirmed');

        store.sendZaloZNS(newAttendee, zTmpl?.id || 'payment_confirmed');
        store.sendEmail(newAttendee, undefined, undefined, eTmpl?.id || 'payment_confirmed');
        store.sendWhatsapp(newAttendee, wTmpl?.id || 'payment_confirmed');
      }
    } catch (err) {
      console.error('Lỗi khi gửi tin thông báo tự động:', err);
    }

    setCreatedAttendee(newAttendee);
    setIsSubmitted(true);
    setCurrentStep(3);
  };

  // Generate VietQR dynamic code transfer parameters
  const cleanName = fullName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D').trim();
  const transferMessage = `${cleanName} ${phone.trim()}`;
  const bankCode = formConfig.bankCode || businessConfig.paymentConfig?.vietqr?.bankCode || 'VCB';
  const bankAccountNo = formConfig.bankAccountNo || businessConfig.paymentConfig?.vietqr?.accountNo || '';
  const bankAccountName = formConfig.bankAccountName || businessConfig.paymentConfig?.vietqr?.accountName || '';

  const currentVietQRUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccountNo}-compact.png?amount=${calculatedTotalFee}&addInfo=${encodeURIComponent(transferMessage)}&accountName=${encodeURIComponent(bankAccountName)}`;

  const checkinQrUrl = createdAttendee 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdAttendee.qrCodeValue)}`
    : '';

  const renderFieldByKey = (fieldKey: string) => {
    if (!formConfig) return null;

    const isCustom = !DEFAULT_FIELDS_ORDER.includes(fieldKey);
    const customLabels = formConfig.fields.customLabels || {};
    const customPlaceholders = formConfig.fields.customPlaceholders || {};
    
    if (isCustom) {
      const fieldDef = (formConfig.fields.customFieldsList || []).find(f => f.key === fieldKey);
      if (!fieldDef || !fieldDef.isEnabled) return null;

      const val = customValues[fieldDef.key] ?? '';
      
      const handleChange = (newVal: any) => {
        setCustomValues(prev => ({ ...prev, [fieldDef.key]: newVal }));
      };

      const baseInputClasses = "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-905 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50";
      const isRequired = fieldDef.required;
      const labelText = `${fieldDef.label} ${isRequired ? '*' : ''}`;

      switch (fieldDef.type) {
        case 'text':
          return (
            <div key={fieldDef.key} className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <input
                type="text"
                required={isRequired}
                placeholder={fieldDef.placeholder || `Nhập ${fieldDef.label.toLowerCase()}`}
                value={val}
                onChange={(e) => handleChange(e.target.value)}
                className={baseInputClasses}
              />
            </div>
          );

        case 'number':
          return (
            <div key={fieldDef.key} className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <input
                type="number"
                required={isRequired}
                placeholder={fieldDef.placeholder || `Nhập số`}
                value={val}
                onChange={(e) => handleChange(e.target.value)}
                className={baseInputClasses}
              />
            </div>
          );

        case 'textarea':
          return (
            <div key={fieldDef.key} className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <textarea
                rows={3}
                required={isRequired}
                placeholder={fieldDef.placeholder || `Nhập nội dung chi tiết...`}
                value={val}
                onChange={(e) => handleChange(e.target.value)}
                className={baseInputClasses}
              />
            </div>
          );

        case 'select':
          return (
            <div key={fieldDef.key} className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <select
                required={isRequired}
                value={val}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">-- Chọn {fieldDef.label} --</option>
                {(fieldDef.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

        case 'radio':
          return (
            <div key={fieldDef.key} className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <div className="flex flex-wrap gap-4 py-1.5 text-xs font-bold text-slate-700">
                {(fieldDef.options || []).map(opt => (
                  <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={fieldDef.key}
                      value={opt}
                      checked={val === opt}
                      onChange={() => handleChange(opt)}
                      className="w-4 h-4 text-teal-650 focus:ring-teal-500 cursor-pointer"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          );

        case 'checkbox':
          const options = fieldDef.options || [];
          if (options.length > 0) {
            const arrVal = Array.isArray(val) ? val : [];
            const handleCheckboxGroupChange = (opt: string, checked: boolean) => {
              if (checked) {
                handleChange([...arrVal, opt]);
              } else {
                handleChange(arrVal.filter(v => v !== opt));
              }
            };
            return (
              <div key={fieldDef.key} className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
                <div className="flex flex-wrap gap-4 py-1.5 text-xs font-bold text-slate-700">
                  {options.map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arrVal.includes(opt)}
                        onChange={(e) => handleCheckboxGroupChange(opt, e.target.checked)}
                        className="w-4 h-4 text-teal-650 rounded focus:ring-teal-500 cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          } else {
            return (
              <div key={fieldDef.key} className="md:col-span-2 bg-white p-4 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={(e) => handleChange(e.target.checked)}
                    className="w-4 h-4 text-teal-650 rounded cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{fieldDef.label}</span>
                    {fieldDef.placeholder && (
                      <span className="text-[10px] text-slate-400 font-semibold">{fieldDef.placeholder}</span>
                    )}
                  </div>
                </label>
              </div>
            );
          }

        case 'file':
          return (
            <div key={fieldDef.key} className="space-y-2 md:col-span-2 border border-slate-150 p-4 rounded-2xl bg-slate-50/30">
              <label className="text-[10px] font-black text-slate-500 block uppercase">{labelText}</label>
              <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-250 flex items-center justify-center overflow-hidden shrink-0">
                  {val ? (
                    <img src={val} alt="Uploaded file preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold font-mono">NO FILE</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 8 * 1024 * 1024) {
                          alert('Tệp quá dung lượng cho phép. Vui lòng tải ảnh dưới 8MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleChange(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id={`file-input-${fieldDef.key}`}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`file-input-${fieldDef.key}`)?.click()}
                    className="w-full py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1 bg-white"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Tải ảnh lên
                  </button>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    }
    
    switch (fieldKey) {
      case 'title':
        return formConfig.fields.title ? (
          <div key="title" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.title || 'Danh xưng'} *
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="BS">Bác sĩ (BS)</option>
              <option value="ThS.BS">Thạc sĩ Bác sĩ (ThS.BS)</option>
              <option value="TS.BS">Tiến sĩ Bác sĩ (TS.BS)</option>
              <option value="PGS.TS.BS">Phó Giáo sư Tiến sĩ Bác sĩ (PGS.TS.BS)</option>
              <option value="GS.TS.BS">Giáo sư Tiến sĩ Bác sĩ (GS.TS.BS)</option>
              <option value="Dược sĩ">Dược sĩ</option>
              <option value="CN">Cử nhân (CN)</option>
              <option value="Ông">Ông</option>
              <option value="Bà">Bà</option>
            </select>
          </div>
        ) : null;

      case 'fullName':
        return (
          <div key="fullName" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.fullName || 'Họ và Tên'} *
            </label>
            <input
              type="text"
              required
              placeholder={customPlaceholders.fullName || 'Nhập họ và tên đầy đủ của bạn'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        );

      case 'gender':
        return formConfig.fields.gender ? (
          <div key="gender" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.gender || 'Giới tính'} *
            </label>
            <div className="flex gap-4 py-1.5 text-xs font-bold text-slate-700">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Nam"
                  checked={gender === 'Nam'}
                  onChange={() => setGender('Nam')}
                  className="w-4 h-4 text-teal-650 focus:ring-teal-500 cursor-pointer"
                />
                <span>Nam</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Nữ"
                  checked={gender === 'Nữ'}
                  onChange={() => setGender('Nữ')}
                  className="w-4 h-4 text-teal-655 focus:ring-teal-500 cursor-pointer"
                />
                <span>Nữ</span>
              </label>
            </div>
          </div>
        ) : null;

      case 'yearOfBirth':
        return formConfig.fields.yearOfBirth ? (
          <div key="yearOfBirth" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.yearOfBirth || 'Năm sinh'} *
            </label>
            <input
              type="number"
              placeholder={customPlaceholders.yearOfBirth || 'Ví dụ: 1985'}
              value={yearOfBirth}
              onChange={(e) => setYearOfBirth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        ) : null;

      case 'phone':
        return (
          <div key="phone" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.phone || 'Số điện thoại'} *
            </label>
            <input
              type="tel"
              required
              placeholder={customPlaceholders.phone || 'Nhập số điện thoại di động chính chủ'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        );

      case 'email':
        return (
          <div key="email" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.email || 'Địa chỉ Email'} *
            </label>
            <input
              type="email"
              required
              placeholder={customPlaceholders.email || 'Ví dụ: bacsi@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        );

      case 'organization':
        const orgRequired = !!formConfig.requiredFields.organization;
        return (
          <div key="organization" className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.organization || 'Cơ quan công tác'} {orgRequired ? '*' : '(Không bắt buộc)'}
            </label>
            <input
              type="text"
              placeholder={customPlaceholders.organization || 'Nhập bệnh viện, đơn vị, phòng khám hoặc cơ quan'}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        );

      case 'department':
        return formConfig.fields.department ? (
          <div key="department" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.department || 'Khoa / Phòng ban'}
            </label>
            <input
              type="text"
              placeholder={customPlaceholders.department || 'Ví dụ: Khoa Thẩm mỹ Ngoại khoa'}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        ) : null;

      case 'province':
        return formConfig.fields.province ? (
          <div key="province" className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.province || 'Tỉnh / Thành phố đại diện'}
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {getProvinceList().map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        ) : null;

      case 'address':
        return formConfig.fields.address ? (
          <div key="address" className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.address || 'Địa chỉ liên hệ'}
            </label>
            <input
              type="text"
              placeholder={customPlaceholders.address || 'Nhập địa chỉ nhà riêng hoặc cơ quan công tác chi tiết'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        ) : null;

      case 'avatarUrl':
        return formConfig.fields.avatarUrl ? (
          <div key="avatarUrl" className="space-y-2 md:col-span-2 border border-slate-150 p-4 rounded-2xl bg-slate-50/30">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.avatarUrl || 'Ảnh thẻ đại biểu (Ảnh chân dung)'} *
            </label>
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
              <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-250 flex items-center justify-center overflow-hidden shrink-0">
                {avatarImage ? (
                  <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold font-mono">NO IMG</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setAvatarImage, setIsAvatarUploading)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1 bg-white"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Tải ảnh chân dung
                </button>
              </div>
            </div>
          </div>
        ) : null;

      case 'doctorProofUrl':
        return formConfig.fields.doctorProofUrl ? (
          <div key="doctorProofUrl" className="space-y-2 md:col-span-2 border border-slate-150 p-4 rounded-2xl bg-slate-50/30">
            <label className="text-[10px] font-black text-slate-500 block uppercase">
              {customLabels.doctorProofUrl || 'Bằng chứng Bác sĩ (Bằng tốt nghiệp)'} *
            </label>
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
              <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-250 flex items-center justify-center overflow-hidden shrink-0">
                {doctorProofImage ? (
                  <img src={doctorProofImage} alt="Doctor Proof" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold font-mono">NO IMG</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={doctorProofInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setDoctorProofImage, setIsDoctorProofUploading)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => doctorProofInputRef.current?.click()}
                  className="w-full py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1 bg-white"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Tải bằng chứng Bác sĩ
                </button>
              </div>
            </div>
          </div>
        ) : null;

      case 'cmeRequired':
        return formConfig.fields.cmeRequired ? (
          <div key="cmeRequired" className="md:col-span-2 bg-white p-4 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cmeRequired}
                onChange={(e) => {
                  setCmeRequired(e.target.checked);
                  if (!e.target.checked) setCmeIdentityNo('');
                }}
                className="w-4 h-4 text-teal-655 rounded cursor-pointer mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {customLabels.cmeRequired || 'Đăng ký cấp chứng nhận CME'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Cần tích lũy đủ thời gian nghe báo cáo khoa học theo quy chế (Phụ phí: +{cmeFee.toLocaleString()}đ)</span>
              </div>
            </label>
          </div>
        ) : null;

      case 'galaRequired':
        return formConfig.fields.galaRequired ? (
          <div key="galaRequired" className="md:col-span-2 bg-white p-4 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer justify-between w-full">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={galaRequired}
                  onChange={(e) => setGalaRequired(e.target.checked)}
                  className="w-4 h-4 text-teal-655 rounded cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {customLabels.galaRequired || 'Đăng ký tham dự tiệc tối Gala Dinner'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Bao gồm đêm nhạc tri ân và ẩm thực truyền thống Việt Nam</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-750">+{galaFee.toLocaleString()}đ</span>
            </label>
          </div>
        ) : null;

      case 'masterclassRequired':
        return formConfig.fields.masterclassRequired ? (
          <div key="masterclassRequired" className="md:col-span-2 bg-white p-4 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer justify-between w-full">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={masterclassRequired}
                  onChange={(e) => setMasterclassRequired(e.target.checked)}
                  className="w-4 h-4 text-teal-655 rounded cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {customLabels.masterclassRequired || 'Đăng ký khoá học thực hành nâng cao (Masterclass)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Khoá thực hành chuyên sâu cùng chuyên gia đầu ngành</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-755">+{masterclassFee.toLocaleString()}đ</span>
            </label>
          </div>
        ) : null;

      case 'tourRequired':
        return formConfig.fields.tourRequired ? (
          <div key="tourRequired" className="md:col-span-2 bg-white p-4 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer justify-between w-full">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={tourRequired}
                  onChange={(e) => setTourRequired(e.target.checked)}
                  className="w-4 h-4 text-teal-655 rounded cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {customLabels.tourRequired || 'Đăng ký tham quan dã ngoại (Sightseeing Tour)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Chương trình tham quan danh lam thắng cảnh cho báo cáo viên quốc tế</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-760">+{tourFee.toLocaleString()}đ</span>
            </label>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4 md:py-12 md:px-6">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Banner Logo Section */}
        {formConfig.bgType === 'color' ? (
          <div className="text-white px-6 py-8 text-center relative border-b border-slate-200" style={{ backgroundColor: formConfig.bgColor || '#4f46e5' }}>
            {formConfig.headerLogoUrl && (
              <div className="w-12 h-12 bg-white rounded-xl p-1 mx-auto mb-3 flex items-center justify-center shadow-md">
                <img src={formConfig.headerLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-white drop-shadow-sm">
              {formConfig.headerTitle || formConfig.title}
            </h1>
            <p className="text-xs text-white/80 mt-1.5 font-medium leading-relaxed max-w-lg mx-auto">
              {formConfig.headerSubtitle || 'Đăng ký thông tin đại biểu tham dự sự kiện chính thức.'}
            </p>
          </div>
        ) : formConfig.headerBannerUrl ? (
          <div className="w-full h-44 md:h-56 relative overflow-hidden bg-slate-100 border-b border-slate-200">
            <img src={formConfig.headerBannerUrl} alt="Banner" className="w-full h-full object-cover" />
            {formConfig.headerLogoUrl && (
              <div className="absolute top-4 left-6 w-14 h-14 bg-white/95 rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-md">
                <img src={formConfig.headerLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 text-white px-6 py-6 md:py-8 text-center relative border-b border-slate-800">
            {formConfig.headerLogoUrl && (
              <div className="w-12 h-12 bg-white rounded-xl p-1 mx-auto mb-3 flex items-center justify-center">
                <img src={formConfig.headerLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-teal-400">
              {formConfig.headerTitle || formConfig.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-lg mx-auto">
              {formConfig.headerSubtitle || 'Đăng ký thông tin đại biểu tham dự sự kiện chính thức.'}
            </p>
          </div>
        )}

        {/* Dynamic Header details when banner is used */}
        {formConfig.bgType !== 'color' && formConfig.headerBannerUrl && (
          <div className="p-6 pb-2 text-center border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-slate-900">
              {formConfig.headerTitle || formConfig.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-lg mx-auto">
              {formConfig.headerSubtitle || 'Đăng ký thông tin đại biểu tham dự sự kiện chính thức.'}
            </p>
          </div>
        )}

        {/* Stepper Steps UI */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between font-bold text-xs uppercase tracking-wide text-slate-500">
          <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-teal-700' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[10px] text-teal-700">1</span>
            <span>Thông tin & Gói</span>
          </div>
          <div className="h-px bg-slate-200 flex-1 mx-3" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-teal-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              currentStep >= 2 ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-100 border-slate-200 text-slate-450'
            }`}>2</span>
            <span>Thanh toán</span>
          </div>
          <div className="h-px bg-slate-200 flex-1 mx-3" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-teal-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              currentStep >= 3 ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-100 border-slate-200 text-slate-450'
            }`}>3</span>
            <span>Hoàn tất</span>
          </div>
        </div>

        {/* STEP 1: Form Fill */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formConfig.fields.fieldsOrder || DEFAULT_FIELDS_ORDER).map((fieldKey) => renderFieldByKey(fieldKey))}
            </div>

            {/* Custom packages selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 block uppercase">Chọn Gói Đăng Ký Hội Thảo *</label>
              <div className="space-y-2">
                {formConfig.packages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all ${
                      packageId === pkg.id 
                        ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-550/20' 
                        : 'border-slate-200 bg-slate-50/20 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={packageId === pkg.id}
                        onChange={() => setPackageId(pkg.id)}
                        className="w-4.5 h-4.5 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{pkg.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 leading-tight font-medium">Bao gồm toàn bộ quyền lợi tiêu chuẩn</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {pkg.fee === 0 ? 'MIỄN PHÍ' : `${pkg.fee.toLocaleString()}đ`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit operations */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Tổng lệ phí thanh toán</span>
                <span className="text-base font-black font-mono text-emerald-800 mt-1">
                  {calculatedTotalFee === 0 ? 'MIỄN PHÍ' : `${calculatedTotalFee.toLocaleString()}đ`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all hover:scale-[1.02]"
              >
                {calculatedTotalFee > 0 ? 'Tiếp tục Thanh Toán' : 'Hoàn tất Đăng Ký'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment and VietQR */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6">
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-slate-700 space-y-1.5">
              <h5 className="font-bold text-emerald-850 flex items-center gap-1">
                <CheckCircle className="w-4.5 h-4.5" />
                Thông tin cá nhân được tiếp nhận thành công!
              </h5>
              <p className="text-[11px] text-slate-550 leading-relaxed">
                Để kích hoạt thẻ đại biểu chính thức, vui lòng thực hiện quét mã chuyển khoản nhanh bên dưới hoặc tự động chuyển khoản ngân hàng theo đúng thông tin BTC chỉ định.
              </p>
            </div>

            {/* VietQR Showcase */}
            <div className="flex flex-col md:flex-row gap-6 border border-slate-200 p-5 rounded-2xl">
              <div className="w-full md:w-56 shrink-0 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <img
                  src={currentVietQRUrl}
                  alt="VietQR code"
                  className="w-48 h-48 object-contain"
                />
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">Quét mã chuyển khoản nhanh</span>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                <h4 className="font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">Thông tin ngân hàng BTC</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Ngân hàng:</span>
                    <strong className="text-slate-800 font-bold uppercase">{bankCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Số tài khoản:</span>
                    <strong className="text-slate-850 font-bold font-mono">{bankAccountNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Tên chủ tài khoản:</span>
                    <strong className="text-slate-850 font-bold uppercase">{bankAccountName}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <span className="text-slate-400 font-medium">Nội dung CK:</span>
                    <strong className="text-rose-600 font-bold font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                      {transferMessage}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <span className="text-slate-400 font-medium">Số tiền chuyển:</span>
                    <strong className="text-emerald-800 font-black font-mono text-sm">
                      {calculatedTotalFee.toLocaleString()}đ
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof of transaction */}
            <div className="space-y-2 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
              <label className="text-[10px] font-black text-slate-500 block uppercase">Tải lên bằng chứng chuyển khoản (Ảnh chụp hóa đơn/Bill)*</label>
              <div className="flex items-center gap-4 bg-white p-3 border border-slate-200 rounded-xl">
                <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-250 flex items-center justify-center overflow-hidden shrink-0">
                  {transactionProofImage ? (
                    <img src={transactionProofImage} alt="Hóa đơn" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold font-mono">NO IMG</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={proofInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setTransactionProofImage, setIsProofUploading)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="w-full py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1 bg-white"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Tải ảnh hóa đơn/Bill
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 actions */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold rounded-xl text-xs cursor-pointer bg-white"
              >
                Quay lại sửa thông tin
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!transactionProofImage) {
                    alert('Vui lòng tải lên ảnh chụp hóa đơn giao dịch chuyển khoản.');
                    return;
                  }
                  handleSubmitRegistration(false);
                }}
                className="px-6 py-2.5 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all hover:scale-[1.02]"
              >
                Xác nhận đã chuyển tiền
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Success Screen */}
        {currentStep === 3 && createdAttendee && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-150">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">ĐĂNG KÝ HỘI NGHỊ HOÀN TẤT!</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Xin chúc mừng, hồ sơ đăng ký của bạn đã được lưu lại thành công. Ban Tổ Chức sẽ xác minh thanh toán và gửi xác nhận qua SMS/Email.
              </p>
            </div>

            {/* Ticket Card Component */}
            <div className="max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-inner relative overflow-hidden">
              {/* Ticket Top Jagged Edge decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-650" />

              <div className="space-y-4 pt-2">
                <div className="flex flex-col items-center">
                  <img
                    src={checkinQrUrl}
                    alt="Ticket QR Code"
                    className="w-40 h-40 border border-slate-200 rounded-xl p-1 bg-white"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-900 mt-2 bg-slate-200/50 px-3 py-0.5 rounded-full border border-slate-300">
                    {createdAttendee.id}
                  </span>
                </div>

                <div className="text-left space-y-2 text-xs border-t border-dashed border-slate-300 pt-4 font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Họ và tên:</span>
                    <strong className="text-slate-900 uppercase">{createdAttendee.title} {createdAttendee.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Số điện thoại:</span>
                    <strong className="text-slate-900 font-mono">{createdAttendee.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Gói đăng ký:</span>
                    <strong className="text-teal-700 uppercase bg-teal-50 border border-teal-100 px-2 py-0.2 rounded">{createdAttendee.packageName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Trạng thái vé:</span>
                    <strong className={`uppercase ${
                      createdAttendee.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {createdAttendee.paymentStatus === 'paid' ? 'Đã kích hoạt' : 'Chờ xác thực thanh toán'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  // Reset states and reload form
                  setCurrentStep(1);
                  setIsSubmitted(false);
                  setCreatedAttendee(null);
                  setFullName('');
                  setPhone('');
                  setEmail('');
                  setOrganization('');
                  setDepartment('');
                  setAddress('');
                  setCmeRequired(false);
                  setCmeIdentityNo('');
                  setGalaRequired(false);
                  setMasterclassRequired(false);
                  setTourRequired(false);
                  setAvatarImage(null);
                  setDoctorProofImage(null);
                  setTransactionProofImage(null);
                  setCustomValues({});
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                Đăng ký biểu mẫu mới
              </button>
            </div>
          </div>
        )}

        {/* Footer info text settings */}
        {formConfig.footerText && (
          <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 text-center text-[10px] text-slate-400 font-semibold leading-relaxed">
            {formConfig.footerText}
          </div>
        )}
      </div>
    </div>
  );
}
