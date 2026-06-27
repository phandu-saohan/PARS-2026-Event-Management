/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash, Copy, ExternalLink, ClipboardList, CheckCircle, 
  Settings, Check, X, Shield, Users, Coins, Image, HelpCircle, AlertCircle, FileText, QrCode, Upload
} from 'lucide-react';
import { store } from '../dataStore';
import { CustomFormConfig, Role } from '../types';

interface CustomFormManagerProps {
  role: Role;
}

const BANK_LIST = [
  { value: 'VCB', label: 'Vietcombank (VCB)' },
  { value: 'TCB', label: 'Techcombank (TCB)' },
  { value: 'MB', label: 'MB Bank' },
  { value: 'ACB', label: 'ACB Bank' },
  { value: 'VPB', label: 'VPBank' },
  { value: 'BIDV', label: 'BIDV' },
  { value: 'CTG', label: 'Vietinbank (CTG)' },
  { value: 'TPB', label: 'TPBank' },
  { value: 'MSB', label: 'MSB' },
  { value: 'VIB', label: 'VIB' },
  { value: 'HDB', label: 'HDBank' },
];

const INITIAL_FIELDS = {
  title: true,
  fullName: true,
  organization: true,
  department: false,
  phone: true,
  email: true,
  address: false,
  yearOfBirth: false,
  gender: false,
  cmeRequired: false,
  cmeIdentityNo: false,
  galaRequired: false,
  masterclassRequired: false,
  tourRequired: false,
  province: false,
  avatarUrl: false,
  doctorProofUrl: false,
};

const INITIAL_REQUIRED = {
  fullName: true,
  phone: true,
  email: true,
  organization: false,
};

const DEFAULT_NEW_FORM = (): Omit<CustomFormConfig, 'id' | 'createdAt'> => ({
  title: '',
  headerTitle: '',
  headerSubtitle: '',
  headerLogoUrl: '',
  headerBannerUrl: '',
  footerText: '',
  fields: { ...INITIAL_FIELDS },
  requiredFields: { ...INITIAL_REQUIRED },
  packages: [
    { id: 'pkg-' + Date.now(), name: 'Vé tiêu chuẩn', fee: 0, isActive: true }
  ],
  paymentQrEnabled: false,
  bankCode: 'VCB',
  bankAccountNo: '',
  bankAccountName: '',
  bgType: 'image',
  bgColor: '#4f46e5',
  isActive: true
});

export default function CustomFormManager({ role }: CustomFormManagerProps) {
  const [forms, setForms] = useState<CustomFormConfig[]>(() => store.getCustomForms());
  const [attendees, setAttendees] = useState(() => store.getAttendees());
  const [showEditor, setShowEditor] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<CustomFormConfig, 'id' | 'createdAt'>>(DEFAULT_NEW_FORM);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'info' | 'fields' | 'packages' | 'payment'>('info');
  const [activeQrUrl, setActiveQrUrl] = useState<string | null>(null);
  const [activeQrTitle, setActiveQrTitle] = useState<string>('');

  // Packages state in editor
  const [pkgName, setPkgName] = useState('');
  const [pkgFee, setPkgFee] = useState(0);

  useEffect(() => {
    const sync = () => {
      setForms(store.getCustomForms());
      setAttendees(store.getAttendees());
    };
    window.addEventListener('store-updated', sync);
    window.addEventListener('store-loaded', sync);
    return () => {
      window.removeEventListener('store-updated', sync);
      window.removeEventListener('store-loaded', sync);
    };
  }, []);

  const getPublicLink = (formId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?view=register-custom&formId=${formId}`;
  };

  const handleShowQrModal = (formId: string, title: string) => {
    const url = getPublicLink(formId);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    setActiveQrUrl(qrUrl);
    setActiveQrTitle(title);
  };

  const handleCopyLink = (formId: string) => {
    const url = getPublicLink(formId);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(formId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleOpenFormEditor = (form?: CustomFormConfig) => {
    if (form) {
      setEditingFormId(form.id);
      setFormData({
        title: form.title,
        headerTitle: form.headerTitle || '',
        headerSubtitle: form.headerSubtitle || '',
        headerLogoUrl: form.headerLogoUrl || '',
        headerBannerUrl: form.headerBannerUrl || '',
        footerText: form.footerText || '',
        fields: { ...INITIAL_FIELDS, ...form.fields },
        requiredFields: { ...INITIAL_REQUIRED, ...form.requiredFields },
        packages: form.packages || [],
        paymentQrEnabled: !!form.paymentQrEnabled,
        bankCode: form.bankCode || 'VCB',
        bankAccountNo: form.bankAccountNo || '',
        bankAccountName: form.bankAccountName || '',
        bgType: form.bgType || 'image',
        bgColor: form.bgColor || '#4f46e5',
        isActive: form.isActive !== false
      });
    } else {
      setEditingFormId(null);
      setFormData(DEFAULT_NEW_FORM());
    }
    setEditorTab('info');
    setShowEditor(true);
  };

  const handleAddPackage = () => {
    if (!pkgName.trim()) {
      alert('Vui lòng nhập tên gói đăng ký.');
      return;
    }
    const newPkg = {
      id: 'pkg-' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: pkgName,
      fee: Number(pkgFee) || 0,
      isActive: true
    };
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, newPkg]
    }));
    setPkgName('');
    setPkgFee(0);
  };

  const handleRemovePackage = (pkgId: string) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter(p => p.id !== pkgId)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, headerLogoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, headerBannerUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập Tiêu đề form.');
      return;
    }
    if (formData.packages.length === 0) {
      alert('Cần có ít nhất 1 Gói đăng ký trong form.');
      return;
    }

    const formId = editingFormId || 'form-' + Math.random().toString(36).substr(2, 9);
    const savedForm: CustomFormConfig = {
      ...formData,
      id: formId,
      createdAt: editingFormId ? (forms.find(f => f.id === editingFormId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    store.saveCustomForm(savedForm);
    setShowEditor(false);
    alert(editingFormId ? 'Cập nhật form thành công!' : 'Tạo form đăng ký mới thành công!');
  };

  const handleDeleteForm = (formId: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa form "${title}"?\nLưu ý: Hành động này không thể hoàn tác.`)) {
      store.deleteCustomForm(formId);
      alert('Đã xóa form đăng ký.');
    }
  };

  const handleToggleFormStatus = (form: CustomFormConfig) => {
    const updated = { ...form, isActive: !form.isActive };
    store.saveCustomForm(updated);
  };

  const getFormAttendeeCount = (title: string) => {
    return attendees.filter(a => a.source === title).length;
  };

  return (
    <div className="space-y-6 p-1 md:p-4">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide flex items-center gap-2 text-teal-400">
            <ClipboardList className="w-6 h-6 text-teal-400" />
            Tạo Form Đăng Ký Động
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Cho phép tạo nhiều biểu mẫu đăng ký đại biểu khác nhau, tùy biến các trường dữ liệu và gói lệ phí, tự động ghi nhận đại biểu theo từng chiến dịch nguồn.
          </p>
        </div>
        <button
          onClick={() => handleOpenFormEditor()}
          className="px-4 py-2.5 text-xs bg-teal-550 hover:bg-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Tạo Form Đăng Ký Mới
        </button>
      </div>

      {/* Forms List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm">
            <FileText className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-50" />
            Chưa có form đăng ký tùy chỉnh nào được tạo. Nhấp "Tạo Form Đăng Ký Mới" để bắt đầu!
          </div>
        ) : (
          forms.map(form => {
            const count = getFormAttendeeCount(form.title);
            return (
              <div key={form.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4">
                <div>
                  {/* Status Toggle & Form Title */}
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                      form.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {form.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {new Date(form.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2.5 line-clamp-1">{form.title}</h3>
                  <p className="text-xs text-slate-550 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {form.headerSubtitle || 'Không có mô tả phụ.'}
                  </p>

                  {/* Form fields summaries */}
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Số đại biểu</span>
                        <span className="text-sm font-black text-slate-900 font-mono mt-0.5">{count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Gói Phí</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5">{form.packages.length} gói</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations & Links */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getPublicLink(form.id)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-500 flex-1 truncate select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(form.id)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 cursor-pointer animate-none"
                      title="Sao chép link đăng ký"
                    >
                      {copiedId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleShowQrModal(form.id, form.title)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                      title="Mã QR đăng ký riêng"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={getPublicLink(form.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-teal-50 hover:bg-teal-100 border border-teal-150 rounded-lg text-teal-700"
                      title="Mở biểu mẫu trên trang tin công khai"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!form.isActive}
                        onChange={() => handleToggleFormStatus(form)}
                        className="w-3.5 h-3.5 text-teal-600 bg-gray-50 border-gray-300 rounded cursor-pointer"
                      />
                      <span>{form.isActive ? 'Bật' : 'Tắt'} Form</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenFormEditor(form)}
                        className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-center border-none bg-transparent"
                        title="Chỉnh sửa form"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-650 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-center border-none bg-transparent"
                        title="Xóa form"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal Dialog */}
      {showEditor && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-bold text-sm tracking-wide uppercase">
                  {editingFormId ? 'Chỉnh Sửa Cấu Hình Form' : 'Tạo Mới Form Đăng Ký Tùy Biến'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Thiết lập giao diện, các trường hiển thị, phân hệ thanh toán và lệ phí.</p>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer hover:bg-slate-800 transition-all border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 flex shrink-0">
              <button
                onClick={() => setEditorTab('info')}
                className={`py-3 px-4 border-b-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${
                  editorTab === 'info' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-450 hover:text-slate-700'
                }`}
              >
                1. Giao diện & Header
              </button>
              <button
                onClick={() => setEditorTab('fields')}
                className={`py-3 px-4 border-b-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${
                  editorTab === 'fields' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-450 hover:text-slate-700'
                }`}
              >
                2. Các trường thông tin
              </button>
              <button
                onClick={() => setEditorTab('packages')}
                className={`py-3 px-4 border-b-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${
                  editorTab === 'packages' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-450 hover:text-slate-700'
                }`}
              >
                3. Gói Đăng Ký
              </button>
              <button
                onClick={() => setEditorTab('payment')}
                className={`py-3 px-4 border-b-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${
                  editorTab === 'payment' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-450 hover:text-slate-700'
                }`}
              >
                4. QR chuyển khoản
              </button>
            </div>

            {/* Editor Content Area */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700">
              {/* TAB 1: General Info & Interface */}
              {editorTab === 'info' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block uppercase">Tiêu đề Form Đăng Ký (Bắt buộc)*</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hội thảo Thẩm mỹ Ngoại khoa 2026 (Đây cũng là Nguồn ghi nhận đại biểu)"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">Tiêu đề chính Header (Hiển thị form)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: ĐĂNG KÝ THAM DỰ HỘI THẢO"
                        value={formData.headerTitle || ''}
                        onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">Mô tả phụ Header</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Vui lòng điền đủ thông tin chuẩn xác..."
                        value={formData.headerSubtitle || ''}
                        onChange={(e) => setFormData({ ...formData, headerSubtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block uppercase">Logo Ban Tổ Chức</label>
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {formData.headerLogoUrl ? (
                        <div className="relative w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
                          <img src={formData.headerLogoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, headerLogoUrl: '' })}
                            className="absolute -top-1 -right-1 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 border-none cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 shrink-0 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                          <Image className="w-6 h-6 opacity-45" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải ảnh lên</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                          <span className="text-[10px] text-slate-450 font-bold">Hoặc điền URL trực tiếp bên dưới</span>
                        </div>
                        <input
                          type="url"
                          placeholder="Hoặc nhập liên kết logo (URL) tại đây"
                          value={formData.headerLogoUrl || ''}
                          onChange={(e) => setFormData({ ...formData, headerLogoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Config Section */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <label className="text-[10px] font-black text-slate-500 block uppercase">Thiết lập Hình nền / Banner</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="bgType"
                          checked={formData.bgType === 'image'}
                          onChange={() => setFormData({ ...formData, bgType: 'image' })}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>Sử dụng Hình ảnh</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="bgType"
                          checked={formData.bgType === 'color'}
                          onChange={() => setFormData({ ...formData, bgType: 'color' })}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>Sử dụng Màu nền đơn</span>
                      </label>
                    </div>

                    {formData.bgType === 'color' ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-10 h-10 rounded-lg border border-slate-300 shrink-0 overflow-hidden relative shadow-inner" style={{ backgroundColor: formData.bgColor || '#4f46e5' }}>
                          <input
                            type="color"
                            value={formData.bgColor || '#4f46e5'}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-800">Chọn mã màu nền</span>
                          <input
                            type="text"
                            value={formData.bgColor || '#4f46e5'}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="w-28 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono font-bold uppercase ml-3 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {formData.headerBannerUrl ? (
                          <div className="relative w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
                            <img src={formData.headerBannerUrl} alt="Banner Preview" className="max-w-full max-h-full object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, headerBannerUrl: '' })}
                              className="absolute -top-1 -right-1 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 border-none cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 shrink-0 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                            <Image className="w-6 h-6 opacity-45" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Tải ảnh nền lên</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                            </label>
                            <span className="text-[10px] text-slate-450 font-bold">Hoặc điền URL trực tiếp bên dưới</span>
                          </div>
                          <input
                            type="url"
                            placeholder="Hoặc nhập liên kết hình ảnh (URL) tại đây"
                            value={formData.headerBannerUrl || ''}
                            onChange={(e) => setFormData({ ...formData, headerBannerUrl: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block uppercase">Chân trang & Nội quy (Footer text / Điều khoản)</label>
                    <textarea
                      placeholder="Mọi thông tin liên hệ hỗ trợ xin gửi về Email: support@event.vn hoặc Hotline: 090XXXX..."
                      rows={3}
                      value={formData.footerText || ''}
                      onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Dynamic fields setup */}
              {editorTab === 'fields' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-850 flex gap-2.5 font-medium">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cấu hình hiển thị trường:</strong> Chọn những thông tin bạn muốn thu thập từ đại biểu của biểu mẫu này. Những trường chính (Họ tên, SĐT, Email) luôn là trường bắt buộc để đăng ký tài khoản đại biểu hội nghị.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border border-slate-150 rounded-2xl p-4 bg-slate-50/30">
                    <h5 className="col-span-full text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2 mb-2 flex items-center gap-1">
                      <Settings className="w-4 h-4 text-teal-655" />
                      Trường hiển thị & Bắt buộc
                    </h5>

                    {/* Standard Fields always required */}
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Họ và Tên</span>
                        <span className="text-[10px] text-teal-600 font-bold uppercase">Bắt buộc hệ thống</span>
                      </div>
                      <Check className="w-5 h-5 text-teal-650" />
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Số Điện Thoại</span>
                        <span className="text-[10px] text-teal-600 font-bold uppercase">Bắt buộc hệ thống</span>
                      </div>
                      <Check className="w-5 h-5 text-teal-655" />
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Hòm thư (Email)</span>
                        <span className="text-[10px] text-teal-600 font-bold uppercase">Bắt buộc hệ thống</span>
                      </div>
                      <Check className="w-5 h-5 text-teal-655" />
                    </div>

                    {/* Org (display is always true but required is toggleable) */}
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Cơ quan công tác</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Tùy chỉnh bắt buộc</span>
                      </div>
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                        <input
                          type="checkbox"
                          checked={formData.requiredFields.organization}
                          onChange={(e) => setFormData({
                            ...formData,
                            requiredFields: { ...formData.requiredFields, organization: e.target.checked }
                          })}
                          className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                        />
                        <span>Bắt buộc</span>
                      </label>
                    </div>

                    {/* Dynamic Fields Display Toggles */}
                    {Object.keys(formData.fields).map((fieldKey) => {
                      // Skip title, fullName, phone, email, organization as they are customized above
                      if (['fullName', 'phone', 'email', 'organization'].includes(fieldKey)) return null;

                      const labels: Record<string, string> = {
                        title: 'Danh xưng (BS, GS, TS...)',
                        department: 'Khoa / Phòng ban',
                        address: 'Địa chỉ liên hệ',
                        yearOfBirth: 'Năm sinh',
                        gender: 'Giới tính',
                        cmeRequired: 'Đăng ký CME (Đào tạo liên tục)',
                        cmeIdentityNo: 'Số CCCD (Dành cho CME)',
                        galaRequired: 'Đăng ký vé Gala Dinner',
                        masterclassRequired: 'Đăng ký Masterclass',
                        tourRequired: 'Đăng ký Tour du lịch',
                        province: 'Tỉnh / Thành phố đại diện',
                        avatarUrl: 'Tải lên Ảnh đại biểu (Avatar)',
                        doctorProofUrl: 'Tải lên Bằng chứng Bác sĩ (Bằng cấp)',
                      };

                      const labelText = labels[fieldKey] || fieldKey;
                      const isEnabled = (formData.fields as any)[fieldKey];

                      return (
                        <div key={fieldKey} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{labelText}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => setFormData({
                                ...formData,
                                fields: { ...formData.fields, [fieldKey]: e.target.checked }
                              })}
                              className="w-4 h-4 text-teal-650 rounded cursor-pointer"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Custom packages */}
              {editorTab === 'packages' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <h5 className="text-xs font-black uppercase text-slate-900 mb-3">Thêm gói phí đăng ký cho Form này</h5>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Tên gói (Ví dụ: Gói Tiêu chuẩn ngày 1 & 2)"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Mức phí (VNĐ). Để 0 nếu miễn phí"
                        value={pkgFee || ''}
                        onChange={(e) => setPkgFee(Number(e.target.value) || 0)}
                        className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddPackage}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                      >
                        Thêm gói
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 border border-slate-200 rounded-2xl p-4">
                    <h5 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2 mb-3">Danh sách Gói đăng ký hiển thị trong Form</h5>
                    
                    {formData.packages.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold italic text-center py-4">Chưa có gói đăng ký nào. Cần có ít nhất 1 gói để lưu form.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {formData.packages.map((pkg, idx) => (
                          <div key={pkg.id} className="py-2.5 flex items-center justify-between gap-4 font-semibold text-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Gói {idx + 1}</span>
                              <span className="font-bold text-slate-900">{pkg.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                {pkg.fee.toLocaleString()}đ
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePackage(pkg.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer bg-transparent border-none"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Bank Payment QR Code */}
              {editorTab === 'payment' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <input
                      type="checkbox"
                      id="paymentQrEnabled"
                      checked={formData.paymentQrEnabled}
                      onChange={(e) => setFormData({ ...formData, paymentQrEnabled: e.target.checked })}
                      className="w-4.5 h-4.5 text-teal-600 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="paymentQrEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Kích hoạt thanh toán quét mã QR (VietQR) tự động nếu đăng ký có phí hội thảo
                    </label>
                  </div>

                  {formData.paymentQrEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 p-5 rounded-2xl bg-slate-50/20">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block uppercase">Ngân hàng thụ hưởng*</label>
                        <select
                          value={formData.bankCode}
                          onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          {BANK_LIST.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block uppercase">Số tài khoản nhận tiền*</label>
                        <input
                          type="text"
                          required
                          placeholder="Nhập số tài khoản ngân hàng nhận tiền"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 block uppercase">Tên tài khoản (Chữ in hoa không dấu)*</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: NGUYEN VAN A"
                          value={formData.bankAccountName}
                          onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {editorTab === 'info' && 'Tiếp tục tab 2 để cài đặt các trường'}
                {editorTab === 'fields' && 'Tiếp tục tab 3 để tạo gói lệ phí'}
                {editorTab === 'packages' && 'Tiếp tục tab 4 để cấu hình QR nhận tiền'}
                {editorTab === 'payment' && 'Tất cả cấu hình hoàn tất!'}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Lưu thiết lập Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeQrUrl && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">Mã QR Đăng Ký</h4>
              <button
                onClick={() => setActiveQrUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer hover:bg-slate-100 border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-150 inline-block mx-auto">
              <img
                src={activeQrUrl}
                alt="Registration QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <h5 className="text-sm font-bold text-slate-900 leading-tight">{activeQrTitle}</h5>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Quét mã này bằng camera điện thoại hoặc Zalo để truy cập trực tiếp vào biểu mẫu đăng ký đại biểu.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <a
                href={activeQrUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl text-center cursor-pointer"
              >
                Mở ảnh lớn
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeQrUrl).then(() => {
                    alert('Đã sao chép liên kết hình ảnh QR Code vào bộ nhớ tạm.');
                  });
                }}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs border-none"
              >
                Sao chép Link QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
