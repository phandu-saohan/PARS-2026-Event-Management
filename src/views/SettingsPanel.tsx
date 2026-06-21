/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Database, 
  Mail, 
  Plus, 
  Trash, 
  Edit2, 
  CheckCircle, 
  Copy, 
  Smartphone, 
  Laptop, 
  Code, 
  ExternalLink, 
  Sliders, 
  Info, 
  Eye, 
  X,
  Settings,
  Layers,
  Globe,
  SlidersHorizontal,
  Check,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Users,
  MapPin,
  Calendar,
  AlertTriangle,
  Printer,
  Loader2,
  RefreshCw,
  Award
} from 'lucide-react';
import { store, DEFAULT_CME_TEMPLATE_CONFIG } from '../dataStore';
import { 
  UserAccount, 
  RegistrationPackage, 
  SponsorPackage, 
  ZaloConfig, 
  EmailConfig, 
  ResendConfig,
  WhatsappConfig,
  SupabaseConfig, 
  Role, 
  NotificationTemplate,
  BusinessConfig,
  EmbedScript,
  AddOnService,
  CmeTemplateConfig
} from '../types';
import RichTextEditor from '../components/RichTextEditor';

interface SettingsPanelProps {
  role: Role;
}

export default function SettingsPanel({ role }: SettingsPanelProps) {
  // Navigation tab state
  const [activeSubTab, setActiveSubTab] = useState<'business' | 'packages' | 'sponsor-packages' | 'integrations' | 'operators' | 'embeds' | 'printers' | 'sepay' | 'forms' | 'onesignal' | 'cme-layout' | 'backup'>('business');
  const [formActiveSection, setFormActiveSection] = useState<'delegate' | 'speaker' | 'sponsor'>('delegate');

  // Printer config states (saved to localStorage for device-specific setup)
  const [printerAutoPrint, setPrinterAutoPrint] = useState(() => {
    return localStorage.getItem('pars_printer_autoprint') === 'true';
  });
  const [printerPaperSize, setPrinterPaperSize] = useState(() => {
    return localStorage.getItem('pars_printer_papersize') || '80x50';
  });
  const [printerMargin, setPrinterMargin] = useState(() => {
    return localStorage.getItem('pars_printer_margin') || 'none';
  });
  const [printerConnection, setPrinterConnection] = useState(() => {
    return localStorage.getItem('pars_printer_connection') || 'browser';
  });

  // Business Config state
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(store.getBusinessConfig());

  // Packages state
  const [packages, setPackages] = useState<RegistrationPackage[]>(store.getPackages());
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [isPackageEdit, setIsPackageEdit] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [formPkgId, setFormPkgId] = useState('');
  const [formPkgName, setFormPkgName] = useState('');
  const [formPkgFee, setFormPkgFee] = useState(0);
  const [formPkgDesc, setFormPkgDesc] = useState('');
  const [formPkgBenefits, setFormPkgBenefits] = useState('');
  const [formPkgIsActive, setFormPkgIsActive] = useState(true);
  const [formPkgIncludesCme, setFormPkgIncludesCme] = useState(true);
  const [formPkgIncludesGala, setFormPkgIncludesGala] = useState(false);

  // Sponsor Packages state
  const [sponsorPackages, setSponsorPackages] = useState<SponsorPackage[]>(store.getSponsorPackages ? store.getSponsorPackages() : []);
  const [showSponsorPackageModal, setShowSponsorPackageModal] = useState(false);
  const [isSponsorPackageEdit, setIsSponsorPackageEdit] = useState(false);
  const [isSavingSponsorPackage, setIsSavingSponsorPackage] = useState(false);
  const [formSponsorPkgId, setFormSponsorPkgId] = useState('');
  const [formSponsorPkgName, setFormSponsorPkgName] = useState('');
  const [formSponsorPkgNameEn, setFormSponsorPkgNameEn] = useState('');
  const [formSponsorPkgFee, setFormSponsorPkgFee] = useState(0);
  const [formSponsorPkgColor, setFormSponsorPkgColor] = useState('#6366f1');
  const [formSponsorPkgBenefits, setFormSponsorPkgBenefits] = useState('');
  const [formSponsorPkgBenefitsEn, setFormSponsorPkgBenefitsEn] = useState('');
  const [formSponsorPkgIsActive, setFormSponsorPkgIsActive] = useState(true);

  // Credentials integration state
  const [zaloConfig, setZaloConfig] = useState<ZaloConfig>(store.getZaloConfig());
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(store.getEmailConfig());
  const [resendConfig, setResendConfig] = useState<ResendConfig>(store.getResendConfig());
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfig>(store.getWhatsappConfig());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(store.getSupabaseConfig());
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Connection & API Testing variables
  const [zaloTesting, setZaloTesting] = useState(false);
  const [zaloTestResult, setZaloTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [emailSendingTest, setEmailSendingTest] = useState(false);
  const [emailSendingResult, setEmailSendingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resendSendingTest, setResendSendingTest] = useState(false);
  const [resendSendingResult, setResendSendingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resendTestEmail, setResendTestEmail] = useState('');
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Operators/Users management states
  const [users, setUsers] = useState<UserAccount[]>(store.getUsers());
  const [showUserModal, setShowUserModal] = useState(false);
  const [isUserEdit, setIsUserEdit] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserName, setFormUserName] = useState('');
  const [formUserPassword, setFormUserPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [formUserRole, setFormUserRole] = useState<Role>('ctv');
  const [formUserStatus, setFormUserStatus] = useState<'active' | 'inactive'>('active');
  const [formUserPermissions, setFormUserPermissions] = useState<string[]>([]);

  // Embed Scripts states
  const [embedScripts, setEmbedScripts] = useState<EmbedScript[]>(store.getEmbedScripts());
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [isEmbedEdit, setIsEmbedEdit] = useState(false);
  const [formEmbedId, setFormEmbedId] = useState('');
  const [formEmbedName, setFormEmbedName] = useState('');

  // SePay config states
  const [sepayConfig, setSepayConfig] = useState(store.getSepayConfig());
  const [isSepayTesting, setIsSepayTesting] = useState(false);
  const [sepayTestResult, setSepayTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // OneSignal config states
  const [onesignalConfig, setOnesignalConfig] = useState(store.getOneSignalConfig());
  const [isOnesignalTesting, setIsOnesignalTesting] = useState(false);
  const [onesignalTestResult, setOnesignalTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formEmbedTarget, setFormEmbedTarget] = useState<'delegate' | 'speaker' | 'sponsor' | 'analytics' | 'custom'>('delegate');
  const [formEmbedCode, setFormEmbedCode] = useState('');
  const [formEmbedNotes, setFormEmbedNotes] = useState('');
  const [formEmbedIsActive, setFormEmbedIsActive] = useState(true);
  
  // Direct Quick Copy Code visual helper states
  const [iframeHeight, setIframeHeight] = useState('950');
  const [copiedCodeSection, setCopiedCodeSection] = useState<string | null>(null);
  const [selectedEmbedForm, setSelectedEmbedForm] = useState<'delegate' | 'speaker' | 'sponsor'>('delegate');

  // Reload caches helper
  const reloadData = () => {
    setUsers([...store.getUsers()]);
    setPackages([...store.getPackages()]);
    setSponsorPackages([...(store.getSponsorPackages ? store.getSponsorPackages() : [])]);
    setEmbedScripts([...store.getEmbedScripts()]);
    setBusinessConfig(store.getBusinessConfig());
  };

  /**
   * Apply PWA icon & theme-color from businessConfig to the current document DOM.
   * Works for both base64 data URLs and regular https:// URLs.
   */
  const applyPwaIconToDocument = (logoUrl?: string, themeColor?: string) => {
    const url = logoUrl || businessConfig.pwaLogoUrl;
    const color = themeColor || businessConfig.pwaThemeColor || '#be6940';

    if (url) {
      // Update favicon (tab icon)
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = url;
      favicon.type = url.startsWith('data:image/png') ? 'image/png'
        : url.startsWith('data:image/svg') ? 'image/svg+xml'
        : url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg') ? 'image/jpeg'
        : 'image/png';

      // Update apple-touch-icon
      let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = url;
    }

    // Update theme-color meta
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = color;
  };

  // Apply PWA icon on component mount (reflects previously saved logo)
  useEffect(() => {
    const cfg = store.getBusinessConfig();
    if (cfg.pwaLogoUrl || cfg.pwaThemeColor) {
      applyPwaIconToDocument(cfg.pwaLogoUrl, cfg.pwaThemeColor);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers for Business Config ---
  const handleSaveBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveBusinessConfig(businessConfig);
    // Apply PWA icon & theme-color to DOM immediately after save
    applyPwaIconToDocument(businessConfig.pwaLogoUrl, businessConfig.pwaThemeColor);
    alert('Đã cập nhật cấu hình Nghiệp vụ sự kiện lưu vào database thành công!');
    reloadData();
  };

  // --- Handlers for Registration Packages ---
  const handleOpenAddPackage = () => {
    if (role !== 'admin') {
      alert('Chỉ tài khoản tối cao Admin mới có quyền tạo thêm gói đăng ký!');
      return;
    }
    setIsPackageEdit(false);
    setFormPkgId('pkg-' + Math.floor(Math.random() * 900 + 100));
    setFormPkgName('');
    setFormPkgFee(500000);
    setFormPkgDesc('');
    setFormPkgBenefits('');
    setFormPkgIsActive(true);
    setFormPkgIncludesCme(true);
    setFormPkgIncludesGala(false);
    setShowPackageModal(true);
  };

  const handleOpenEditPackage = (pkg: RegistrationPackage) => {
    if (role !== 'admin') {
      alert('Chỉ tài khoản tối cao Admin mới có quyền sửa đổi thông tin gói!');
      return;
    }
    setIsPackageEdit(true);
    setFormPkgId(pkg.id);
    setFormPkgName(pkg.name);
    setFormPkgFee(pkg.fee);
    setFormPkgDesc(pkg.description || '');
    setFormPkgBenefits((pkg.benefits || []).join(', '));
    setFormPkgIsActive(pkg.isActive);
    setFormPkgIncludesCme(typeof pkg.includesCme === 'undefined' ? true : pkg.includesCme);
    setFormPkgIncludesGala(!!pkg.includesGala);
    setShowPackageModal(true);
  };

  const handleSavePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;

    if (!formPkgId || !formPkgName) {
      alert('Vui lòng cung cấp mã ID và Tên gói đăng ký!');
      return;
    }

    const benefitsArray = formPkgBenefits
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const updatedPkg: RegistrationPackage = {
      id: formPkgId,
      name: formPkgName,
      fee: Number(formPkgFee),
      description: formPkgDesc,
      benefits: benefitsArray,
      isActive: formPkgIsActive,
      includesCme: formPkgIncludesCme,
      includesGala: formPkgIncludesGala
    };

    setIsSavingPackage(true);
    try {
      await store.savePackageAsync(updatedPkg);
      setShowPackageModal(false);
      reloadData();
      alert('Đã lưu cấu hình gói đăng ký thành công!');
    } catch (err: any) {
      console.error('Lỗi khi lưu gói đăng ký:', err);
      alert(`Không thể lưu gói đăng ký: ${err.message || err}`);
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (role !== 'admin') {
      alert('Quyền hạn bị từ chối!');
      return;
    }

    const connectedAttendees = store.getAttendees().filter(a => a.packageId === id);
    if (connectedAttendees.length > 0) {
      if (!window.confirm(`Hệ thống phát hiện ${connectedAttendees.length} Đại biểu đã mua gói này. Nếu xóa, hiển thị phí của các đại biểu này có thể lỗi. Bạn có thực sự muốn xóa?`)) {
        return;
      }
    } else {
      if (!window.confirm('Chắc chắn muốn xóa bỏ gói đăng ký này vĩnh viễn?')) {
        return;
      }
    }

    setIsSavingPackage(true);
    try {
      await store.deletePackageAsync(id);
      reloadData();
      alert('Đã xóa gói đăng ký thành công!');
    } catch (err: any) {
      console.error('Lỗi khi xóa gói đăng ký:', err);
      alert(`Không thể xóa gói đăng ký: ${err.message || err}`);
    } finally {
      setIsSavingPackage(false);
    }
  };

  // --- Handlers for Sponsor Packages ---
  const handleOpenAddSponsorPackage = () => {
    if (role !== 'admin') {
      alert('Chỉ tài khoản tối cao Admin mới có quyền tạo thêm gói tài trợ!');
      return;
    }
    setIsSponsorPackageEdit(false);
    setFormSponsorPkgId('sponsor-' + Math.floor(Math.random() * 900 + 100));
    setFormSponsorPkgName('');
    setFormSponsorPkgNameEn('');
    setFormSponsorPkgFee(50000000);
    setFormSponsorPkgColor('#6366f1');
    setFormSponsorPkgBenefits('');
    setFormSponsorPkgBenefitsEn('');
    setFormSponsorPkgIsActive(true);
    setShowSponsorPackageModal(true);
  };

  const handleOpenEditSponsorPackage = (pkg: SponsorPackage) => {
    if (role !== 'admin') {
      alert('Chỉ tài khoản tối cao Admin mới có quyền sửa đổi thông tin gói tài trợ!');
      return;
    }
    setIsSponsorPackageEdit(true);
    setFormSponsorPkgId(pkg.id);
    setFormSponsorPkgName(pkg.name);
    setFormSponsorPkgNameEn(pkg.nameEn || '');
    setFormSponsorPkgFee(pkg.fee);
    setFormSponsorPkgColor(pkg.color || '#6366f1');
    setFormSponsorPkgBenefits((pkg.benefits || []).join('\n'));
    setFormSponsorPkgBenefitsEn((pkg.benefitsEn || []).join('\n'));
    setFormSponsorPkgIsActive(pkg.isActive);
    setShowSponsorPackageModal(true);
  };

  const handleSaveSponsorPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;

    if (!formSponsorPkgId || !formSponsorPkgName) {
      alert('Vui lòng cung cấp mã ID và Tên gói tài trợ!');
      return;
    }

    const benefitsArray = formSponsorPkgBenefits
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const benefitsEnArray = formSponsorPkgBenefitsEn
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const updatedPkg: SponsorPackage = {
      id: formSponsorPkgId,
      name: formSponsorPkgName,
      nameEn: formSponsorPkgNameEn || undefined,
      fee: Number(formSponsorPkgFee),
      color: formSponsorPkgColor,
      benefits: benefitsArray,
      benefitsEn: benefitsEnArray.length > 0 ? benefitsEnArray : undefined,
      isActive: formSponsorPkgIsActive
    };

    setIsSavingSponsorPackage(true);
    try {
      const config = { ...businessConfig };
      if (!config.sponsorFormConfig) {
        config.sponsorFormConfig = { isOpen: true, sponsorPackages: [] };
      }
      if (!config.sponsorFormConfig.sponsorPackages) {
        config.sponsorFormConfig.sponsorPackages = [];
      }

      if (isSponsorPackageEdit) {
        config.sponsorFormConfig.sponsorPackages = config.sponsorFormConfig.sponsorPackages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
      } else {
        const exists = config.sponsorFormConfig.sponsorPackages.some(p => p.id === updatedPkg.id);
        if (exists) {
          alert('Mã ID gói tài trợ này đã tồn tại! Vui lòng nhập mã khác.');
          setIsSavingSponsorPackage(false);
          return;
        }
        config.sponsorFormConfig.sponsorPackages.push(updatedPkg);
      }

      await store.saveBusinessConfig(config);
      setShowSponsorPackageModal(false);
      reloadData();
      alert('Đã lưu cấu hình gói tài trợ thành công!');
    } catch (err: any) {
      console.error('Lỗi khi lưu gói tài trợ:', err);
      alert(`Không thể lưu gói tài trợ: ${err.message || err}`);
    } finally {
      setIsSavingSponsorPackage(false);
    }
  };

  const handleDeleteSponsorPackage = async (id: string) => {
    if (role !== 'admin') {
      alert('Quyền hạn bị từ chối!');
      return;
    }

    const connectedSponsors = store.getSponsors ? store.getSponsors().filter((s: any) => s.tier === id) : [];
    if (connectedSponsors.length > 0) {
      if (!window.confirm(`Hệ thống phát hiện ${connectedSponsors.length} Nhà tài trợ đã chọn gói này. Nếu xóa, thông tin của họ có thể hiển thị không chuẩn. Bạn có thực sự muốn xóa?`)) {
        return;
      }
    } else {
      if (!window.confirm('Chắc chắn muốn xóa bỏ gói tài trợ này vĩnh viễn?')) {
        return;
      }
    }

    setIsSavingSponsorPackage(true);
    try {
      const config = { ...businessConfig };
      if (config.sponsorFormConfig && config.sponsorFormConfig.sponsorPackages) {
        config.sponsorFormConfig.sponsorPackages = config.sponsorFormConfig.sponsorPackages.filter(p => p.id !== id);
        await store.saveBusinessConfig(config);
      }
      reloadData();
      alert('Đã xóa gói tài trợ thành công!');
    } catch (err: any) {
      console.error('Lỗi khi xóa gói tài trợ:', err);
      alert(`Không thể xóa gói tài trợ: ${err.message || err}`);
    } finally {
      setIsSavingSponsorPackage(false);
    }
  };

  // --- Handlers for Printer Settings ---
  const handleSavePrinterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pars_printer_autoprint', String(printerAutoPrint));
    localStorage.setItem('pars_printer_papersize', printerPaperSize);
    localStorage.setItem('pars_printer_margin', printerMargin);
    localStorage.setItem('pars_printer_connection', printerConnection);
    alert('Đã lưu cấu hình máy in thành công!');
  };

  // --- Handlers for Integration (Zalo OA, SMTP, Supabase) ---
  const handleSaveZaloSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveZaloConfig(zaloConfig);
    alert('Đã cập nhật đồng bộ các tham số Cổng API Zalo OA!');
  };

  const handleVerifyZaloTokenObj = async () => {
    setZaloTesting(true);
    setZaloTestResult(null);
    try {
      const response = await fetch('/api/zalo/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: zaloConfig.accessToken })
      });
      const data = await response.json();
      setZaloTestResult({
        success: data.success,
        message: data.message
      });
    } catch (err: any) {
      setZaloTestResult({
        success: false,
        message: `Lỗi kết nối cổng API: ${err.message || 'Không xách định'}`
      });
    } finally {
      setZaloTesting(false);
    }
  };

  const handleRefreshZaloToken = async () => {
    if (!zaloConfig.appId || !zaloConfig.secretKey || !zaloConfig.refreshToken) {
      alert('Vui lòng kiểm tra lại thông tin App ID, Secret Key và Refresh Token trước khi thực hiện làm mới.');
      return;
    }
    setZaloTesting(true);
    setZaloTestResult(null);
    try {
      const response = await fetch('/api/zalo/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: zaloConfig.appId,
          secretKey: zaloConfig.secretKey,
          refreshToken: zaloConfig.refreshToken
        })
      });
      const data = await response.json();
      if (data.success) {
        const updated = {
          ...zaloConfig,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || zaloConfig.refreshToken,
          accessTokenUpdatedAt: new Date().toISOString()
        };
        setZaloConfig(updated);
        store.saveZaloConfig(updated);
        setZaloTestResult({
          success: true,
          message: `${data.message}\nℹ️ Access Token mới diễn hoạt trong 24 giờ tới.`
        });
        alert('Gia hạn Cổng Access Token Zalo thành công!');
      } else {
        setZaloTestResult({
          success: false,
          message: `Không thể gia hạn Token: ${data.message || 'Mất phản hồi từ cổng'}`
        });
      }
    } catch (err: any) {
      setZaloTestResult({
        success: false,
        message: `Lỗi kết nối cổng gia hạn Zalo: ${err.message}`
      });
    } finally {
      setZaloTesting(false);
    }
  };

  const handleSendTestZaloMessage = async () => {
    if (!zaloConfig.testPhone) {
      alert('Vui lòng nhập Số điện thoại nhận tin thử nghiệm.');
      return;
    }
    setZaloTesting(true);
    setZaloTestResult(null);
    try {
      let phoneWithPrefix = zaloConfig.testPhone.replace(/[^0-9]/g, '');
      if (phoneWithPrefix.startsWith('0')) {
        phoneWithPrefix = '84' + phoneWithPrefix.substring(1);
      }
      const targetTemplate = store.getTemplates().find(t => t.id === 'tmpl-reg-zalo');
      const response = await fetch('/api/zalo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: zaloConfig,
          payload: {
            recipient: { phone: phoneWithPrefix },
            template_id: targetTemplate?.znsTemplateId || 'tmpl-reg-zalo',
            template_data: {
              title: 'BS.',
              fullname: 'Khách mời Thử nghiệm',
              package: 'Gói Hội nghị PARS Chuyên sâu',
              code: 'PARS-ZALO-PRO',
              payment_status: 'Đã hoàn tất (Test)',
              qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PARS-ZALO-PRO-SUCCESS'
            }
          }
        })
      });
      const data = await response.json();
      if (data.success && data.data?.error === 0) {
        setZaloTestResult({
          success: true,
          message: `Truyền phát ZNS thành công! ID tin nhắn: ${data.data?.data?.msg_id || 'msg-zalo-888'}`
        });
      } else {
        setZaloTestResult({
          success: false,
          message: `Zalo phản hồi lỗi: ${data.data?.message || data.error || 'Mã lỗi bất thường từ cổng Zalo'}`
        });
      }
    } catch (err: any) {
      setZaloTestResult({
        success: false,
        message: `Truyền tin thất bại: ${err.message}`
      });
    } finally {
      setZaloTesting(false);
    }
  };

  const handleTestOneSignal = async () => {
    if (!onesignalConfig.appId || !onesignalConfig.restApiKey) {
      alert('Vui lòng điền đầy đủ OneSignal App ID và REST API Key.');
      return;
    }
    setIsOnesignalTesting(true);
    setOnesignalTestResult(null);
    try {
      await store.saveOneSignalConfig(onesignalConfig);
      
      const res = await fetch('/api/onesignal/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'PARS 2026 - Kiểm thử kết nối',
          message: '🔔 OneSignal Push Notification hoạt động hoàn hảo!',
          isTest: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOnesignalTestResult({
          success: true,
          message: `✅ Kết nối thành công! Đã phát push thông báo kiểm thử. ID: ${data.response?.id || 'N/A'}`
        });
      } else {
        setOnesignalTestResult({
          success: false,
          message: `❌ Thất bại: ${data.message || 'Lỗi không xác định từ OneSignal API'}`
        });
      }
    } catch (err: any) {
      setOnesignalTestResult({
        success: false,
        message: `❌ Lỗi kết nối: ${err.message}`
      });
    } finally {
      setIsOnesignalTesting(false);
    }
  };

  const handleSaveSMTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveEmailConfig(emailConfig);
    alert('Đã lưu cấu hình Cổng Mail SMTP Outgoing Server!');
  };

  const handleTestSmtpConnectionObj = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpUser: emailConfig.smtpUser,
          smtpPass: emailConfig.smtpPass
        })
      });
      const data = await response.json();
      setSmtpTestResult({
        success: data.success,
        message: data.message
      });
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: `Lỗi kết nối máy chủ Mail: ${err.message}`
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSendTestMailObj = async () => {
    if (!emailConfig.testEmail) {
      alert('Vui lòng điền Email nhận test trước!');
      return;
    }
    setEmailSendingTest(true);
    setEmailSendingResult(null);
    try {
      const testContentHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #be6940; text-transform: uppercase;">Máy Chủ SMTP Kích Hoạt Thành Công</h2>
          <p>Kính gửi Quý đại diện quản trị,</p>
          <p>Thư này xác nhận cổng gửi Email Outcoming qua hình thức SMTP của bạn đã cấu hình thành công.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; font-family: monospace; font-size: 13px; border-left: 4px solid #be6940; margin: 20px 0;">
            • SMTP Server: ${emailConfig.smtpHost}:${emailConfig.smtpPort}<br/>
            • Email nguồn: ${emailConfig.senderEmail}<br/>
            • Thời gian: ${new Date().toLocaleString()}
          </div>
          <p style="font-size: 11px; color: #94a3b8;">Email tự động phục vụ đo lường cổng đăng ký Hội nghị.</p>
        </div>
      `;
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: emailConfig,
          payload: {
            to: emailConfig.testEmail,
            subject: `[SMTP SUCCESS] Email kiểm định kết nối cổng thông tin PARS`,
            body: testContentHtml
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setEmailSendingResult({
          success: true,
          message: `Thư xác thực đã bắn thành công tới ${emailConfig.testEmail}! Kiểm tra cả hòm thư Spam.`
        });
      } else {
        setEmailSendingResult({
          success: false,
          message: `Lỗi truyền phát SMTP: ${data.error || 'Chi tiết gửi lỗi máy chủ.'}`
        });
      }
    } catch (err: any) {
      setEmailSendingResult({
        success: false,
        message: `Lỗi kết nối API: ${err.message}`
      });
    } finally {
      setEmailSendingTest(false);
    }
  };

  const handleSaveResendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveResendConfig(resendConfig);
    alert('Đã lưu cấu hình Cổng Mail Resend!');
  };

  const handleSendTestResendMail = async () => {
    if (!resendTestEmail) {
      alert('Vui lòng điền Email nhận test trước!');
      return;
    }
    if (!resendConfig.apiKey || !resendConfig.senderEmail) {
      alert('Vui lòng điền API Key và Email gửi đi trước!');
      return;
    }
    setResendSendingTest(true);
    setResendSendingResult(null);
    try {
      const testContentHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #be6940; text-transform: uppercase;">Cổng Truyền Tin Resend Kích Hoạt Thành Công</h2>
          <p>Kính gửi Quý đại diện quản trị,</p>
          <p>Thư này xác nhận cổng gửi Email Outcoming qua hình thức API của Resend đã cấu hình thành công.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; font-family: monospace; font-size: 13px; border-left: 4px solid #be6940; margin: 20px 0;">
            • Cổng API: Resend Bulk Service<br/>
            • Email nguồn: ${resendConfig.senderEmail}<br/>
            • Thời gian: ${new Date().toLocaleString()}
          </div>
          <p style="font-size: 11px; color: #94a3b8;">Email tự động phục vụ đo lường cổng gửi tin hàng loạt.</p>
        </div>
      `;
      const response = await fetch('/api/email/send-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: resendConfig.apiKey,
          from: resendConfig.senderEmail,
          to: resendTestEmail,
          subject: `[RESEND SUCCESS] Email kiểm định kết nối cổng truyền tin Resend`,
          html: testContentHtml
        })
      });
      const data = await response.json();
      if (data.success) {
        setResendSendingResult({
          success: true,
          message: `Thư xác thực đã bắn thành công tới ${resendTestEmail}! Kiểm tra cả hòm thư Spam.`
        });
      } else {
        setResendSendingResult({
          success: false,
          message: `Lỗi truyền phát Resend: ${data.error || 'Chi tiết gửi lỗi máy chủ.'}`
        });
      }
    } catch (err: any) {
      setResendSendingResult({
        success: false,
        message: `Lỗi kết nối API: ${err.message}`
      });
    } finally {
      setResendSendingTest(false);
    }
  };

  const handleSaveWhatsappSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveWhatsappConfig(whatsappConfig);
    alert('Đã lưu cấu hình Cổng WhatsApp Business API thành công!');
  };

  const handleVerifyWhatsappToken = async () => {
    if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
      alert('Vui lòng nhập Access Token và Phone Number ID trước khi kiểm tra!');
      return;
    }
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setWaTestResult({
          success: true,
          message: `Xác thực thành công! ID Số điện thoại: ${data.id}, Tên hiển thị: ${data.display_phone_number || 'N/A'}`
        });
      } else {
        setWaTestResult({
          success: false,
          message: `Meta Graph API báo lỗi: ${data.error?.message || 'Không rõ nguyên nhân'}`
        });
      }
    } catch (err: any) {
      setWaTestResult({
        success: false,
        message: `Lỗi kết nối Meta Graph API: ${err.message}`
      });
    } finally {
      setWaTesting(false);
    }
  };

  const handleSendTestWhatsappMessage = async () => {
    if (!whatsappConfig.testPhone) {
      alert('Vui lòng điền số điện thoại nhận test trước!');
      return;
    }
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const testAttendee = {
        id: 'ATT-TEST',
        title: 'BS.',
        fullName: 'Đại Biểu Thử Nghiệm',
        organization: 'Bệnh viện Da liễu',
        department: 'Thẩm mỹ Da',
        phone: whatsappConfig.testPhone,
        email: 'test@example.com',
        address: 'Hà Nội',
        nationality: 'vietname' as const,
        packageId: 'pkg-member',
        packageName: 'Thành viên PARS',
        packageFee: 2500000,
        paymentStatus: 'paid' as const,
        paymentMethod: 'bank_transfer' as const,
        registrationDate: new Date().toISOString().split('T')[0],
        qrCodeValue: 'TEST-QR-VALUE',
        isCheckedIn: false,
      };

      const resLog = await store.sendWhatsapp(testAttendee);
      if (resLog.status === 'success') {
        setWaTestResult({
          success: true,
          message: `Tin nhắn WhatsApp test đã bắn thành công tới ${whatsappConfig.testPhone}! Hãy kiểm tra thiết bị của bạn.`
        });
      } else {
        setWaTestResult({
          success: false,
          message: `WhatsApp API báo lỗi: ${resLog.response?.message || resLog.response?.error?.message || 'Lỗi gửi tin'}`
        });
      }
    } catch (err: any) {
      setWaTestResult({
        success: false,
        message: `Lỗi kết nối API: ${err.message}`
      });
    } finally {
      setWaTesting(false);
    }
  };

  const handleSaveSupabaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveSupabaseConfig(supabaseConfig);
    alert('Đã cập nhật cấu hình thông số kết nối Supabase Cloud Database!');
  };

  const handleCopySQLScript = () => {
    navigator.clipboard.writeText(store.getSupabaseSqlSchema());
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // --- Handlers for Users & Operators Granular CRUD ---
  const handleOpenAddOperator = () => {
    if (role !== 'admin') {
      alert('Không đủ quyền hạn! Chỉ Trưởng Ban Tổ Chức (Admin) mới có quyền tạo tài khoản.');
      return;
    }
    setIsUserEdit(false);
    setFormUserId('USR-' + Math.floor(Math.random() * 900 + 100));
    setFormUserEmail('');
    setFormUserName('');
    setFormUserPassword('');
    setFormUserRole('ctv');
    setFormUserStatus('active');
    setFormUserPermissions(['approve_attendees']);
    setShowUserModal(true);
  };

  const handleOpenEditOperator = (u: UserAccount) => {
    if (role !== 'admin') {
      alert('Không đủ quyền hạn!');
      return;
    }
    setIsUserEdit(true);
    setFormUserId(u.id);
    setFormUserEmail(u.email);
    setFormUserName(u.name);
    setFormUserRole(u.role);
    setFormUserStatus(u.status);
    setFormUserPermissions(u.permissions || []);
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserEmail || !formUserName) {
      alert('Vui lòng điền đủ Họ tên và Tên tài khoản (Email).');
      return;
    }

    if (!isUserEdit) {
      // Adding new operator: call Vercel Serverless API to register in Auth + public.user_accounts
      if (!formUserPassword || formUserPassword.length < 6) {
        alert('Mật khẩu bắt buộc và phải có ít nhất 6 ký tự!');
        return;
      }

      setIsSavingUser(true);
      fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formUserEmail.trim().toLowerCase(),
          password: formUserPassword,
          name: formUserName.trim(),
          role: formUserRole,
          permissions: formUserPermissions
        })
      })
      .then(async res => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          return { ok: res.ok, status: res.status, data };
        } catch (e) {
          return { ok: false, status: res.status, errorText: text };
        }
      })
      .then(result => {
        if (result.ok && result.data?.success) {
          alert('Tạo nhân sự mới và đồng bộ Supabase Auth thành công!');
          // Add to local dataStore cache
          store.addUserLocally(result.data.user);
          setShowUserModal(false);
          reloadData();
        } else {
          const errorMsg = result.data?.error || result.errorText || '';
          if (errorMsg.trim().startsWith('<!DOCTYPE') || errorMsg.trim().startsWith('<html') || errorMsg.includes('Vite CSS') || errorMsg.includes('html')) {
            alert(`Lỗi khi tạo nhân sự: Phản hồi từ máy chủ không phải dữ liệu JSON (Mã lỗi HTTP ${result.status}).\n\n👉 LƯU Ý: Nếu bạn đang chạy ứng dụng cục bộ bằng lệnh 'npm run dev', các API serverless Vercel sẽ không hoạt động trực tiếp. Hãy chạy lệnh 'vercel dev' và sử dụng cổng của Vercel (thường là http://localhost:3000) để API hoạt động.`);
          } else {
            alert(`Lỗi khi tạo nhân sự: ${errorMsg || 'Không xác định (Lỗi máy chủ)'}`);
          }
        }
      })
      .catch(err => {
        alert(`Lỗi mạng/kết nối: ${err.message}`);
      })
      .finally(() => {
        setIsSavingUser(false);
      });
    } else {
      // Editing operator: standard profile update (role/status/permissions) in public.user_accounts
      const payload: UserAccount = {
        id: formUserId,
        email: formUserEmail.trim().toLowerCase(),
        name: formUserName.trim(),
        role: formUserRole,
        status: formUserStatus,
        permissions: formUserPermissions
      };
      store.saveUser(payload);
      setShowUserModal(false);
      reloadData();
    }
  };

  const handleDeleteOperator = (id: string) => {
    if (role !== 'admin') {
      alert('Chỉ quản trị viên mới được xóa cộng tác viên!');
      return;
    }
    const target = users.find(u => u.id === id);
    if (target && target.email === 'admin') {
      alert('Không cho phép xóa tài khoản quản trị hệ thống tối cao.');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa nhân sự ${target?.name} khỏi hệ thống vận hành?`)) {
      store.deleteUser(id);
      reloadData();
    }
  };

  const handleToggleUserPermission = (perm: string) => {
    if (formUserPermissions.includes(perm)) {
      setFormUserPermissions(formUserPermissions.filter(p => p !== perm));
    } else {
      setFormUserPermissions([...formUserPermissions, perm]);
    }
  };

  // --- Handlers for Embed Scripts CRUD ---
  const handleOpenAddEmbed = () => {
    setIsEmbedEdit(false);
    setFormEmbedId('emb-' + Math.floor(Math.random() * 900 + 100));
    setFormEmbedName('');
    setFormEmbedTarget('delegate');
    setFormEmbedCode('');
    setFormEmbedNotes('');
    setFormEmbedIsActive(true);
    setShowEmbedModal(true);
  };

  const handleOpenEditEmbed = (emb: EmbedScript) => {
    setIsEmbedEdit(true);
    setFormEmbedId(emb.id);
    setFormEmbedName(emb.name);
    setFormEmbedTarget(emb.targetType);
    setFormEmbedCode(emb.code);
    setFormEmbedNotes(emb.notes || '');
    setFormEmbedIsActive(emb.isActive);
    setShowEmbedModal(true);
  };

  const handleSaveEmbedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmbedName || !formEmbedCode) {
      alert('Vui lòng nhập Tên nhãn cấu hình và Mã nhúng của bạn!');
      return;
    }

    const payload: EmbedScript = {
      id: formEmbedId,
      name: formEmbedName,
      targetType: formEmbedTarget,
      code: formEmbedCode,
      notes: formEmbedNotes,
      isActive: formEmbedIsActive,
      createdAt: new Date().toISOString()
    };

    store.saveEmbedScript(payload);
    setShowEmbedModal(false);
    reloadData();
  };

  const handleDeleteEmbed = (id: string) => {
    if (window.confirm('Bạn có đồng ý gỡ bỏ mã nhúng tích hợp này không? Hành động này không thể hoàn tác.')) {
      store.deleteEmbedScript(id);
      reloadData();
    }
  };

  const handleToggleEmbedActive = (emb: EmbedScript) => {
    const updated = { ...emb, isActive: !emb.isActive };
    store.saveEmbedScript(updated);
    reloadData();
  };

  // Helper resolvers for dynamic iframe string code copy paste helper
  const getEmbedFormUrl = (formType: 'delegate' | 'speaker' | 'sponsor') => {
    // Ưu tiên dùng App URL đã cấu hình trong Cài đặt -> Thông tin sự kiện
    // (để đảm bảo mã nhúng WP luôn trỏ đúng domain production, không dùng localhost)
    const configuredUrl = businessConfig.appUrl?.trim().replace(/\/$/, '');
    const origin = configuredUrl || window.location.origin;
    let viewName = 'register-delegate';
    if (formType === 'speaker') viewName = 'register-speaker';
    if (formType === 'sponsor') viewName = 'register-sponsor';
    return `${origin}/?view=${viewName}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            CÀI ĐẶT HỆ THỐNG & TÍCH HỢP
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối quy chế sự kiện, thiết lập phân quyền chi tiết, cấu hình luồng dữ liệu Zalo ZNS, SMTP và mã nhúng bên thứ ba.
          </p>
        </div>

        {/* Current user role banner */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 self-start md:self-auto shadow-sm">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wide">
            Vai trò vận hành:
          </span>
          <span className="text-[10px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md">
            {role === 'admin' ? 'Trưởng BTC (Admin)' : role === 'btc' ? 'Thành viên BTC' : 'Cộng tác viên (CTV)'}
          </span>
        </div>
      </div>

      {/* Main Container Grid with left side navigations and right panel view layouts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left sidebar Navigation panel */}
        <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-2 mb-2">DANH MỤC CẤU HÌNH</span>
          
          <button
            onClick={() => setActiveSubTab('business')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'business'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>🛠️ Cấu hình Nghiệp vụ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('packages')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'packages'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>🎟️ Gói Đại Biểu Đăng Ký</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sponsor-packages')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'sponsor-packages'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>💎 Gói Tài Trợ (Sponsor)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('integrations')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'integrations'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>🔌 Cổng Tích Hợp API</span>
          </button>

          <button
            onClick={() => setActiveSubTab('operators')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'operators'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>👥 Phân Quyền Vận Hành</span>
          </button>

          <button
            onClick={() => setActiveSubTab('embeds')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'embeds'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Code className="w-4 h-4 shrink-0" />
            <span>💻 Quản lý Mã Nhúng (WP)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('printers')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'printers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900 bg-transparent'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>🖨️ Cấu hình Máy In Nhãn</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sepay')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'sepay'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 bg-transparent'
            }`}
          >
            <span className="shrink-0 text-base">💳</span>
            <span>SePay - Xác nhận CK</span>
          </button>

          <button
            onClick={() => setActiveSubTab('onesignal')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'onesignal'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-850 bg-transparent'
            }`}
          >
            <span className="shrink-0 text-base">🔔</span>
            <span>OneSignal Push</span>
          </button>

          <button
            onClick={() => setActiveSubTab('forms')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'forms'
                ? 'bg-violet-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800 bg-transparent'
            }`}
          >
            <span className="shrink-0 text-base">📋</span>
            <span>Cấu hình Form Public</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cme-layout')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'cme-layout'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800 bg-transparent'
            }`}
          >
            <span className="shrink-0 text-base">🎓</span>
            <span>Thiết kế Chứng chỉ CME</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border-none ${
              activeSubTab === 'backup'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-800 bg-transparent'
            }`}
          >
            <span className="shrink-0 text-base">💾</span>
            <span>Sao Lưu & Phục Hồi</span>
          </button>

          {/* Quick diagnostic tips */}
          <div className="pt-4 mt-4 border-t border-slate-200 px-2 space-y-2 text-[10.5px] text-slate-500 leading-normal">
            <span className="font-extrabold text-slate-800 block text-[10px]">🖥️ DATABASE SYNC:</span>
            <p>Tất cả cấu hình được đồng bộ hóa tức thời về hệ thống Supabase/Local để ngăn ngừa gián đoạn truy xuất ngoài cộng đồng.</p>
          </div>
        </div>

        {/* Right content panel layout */}
        <div className="md:col-span-9 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          
          {/* ================= SECTION 1: BUSINESS LOGISTICS ================= */}
          {activeSubTab === 'business' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cấu hình nghiệp vụ sự kiện</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Xác lập các luật nghiệp vụ, ngưỡng đăng tải và danh tính đơn vị tổ chức.</p>
                </div>
              </div>

              <form onSubmit={handleSaveBusinessSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Tên sự kiện / Hội nghị *</label>
                    <input
                      type="text"
                      required
                      value={businessConfig.eventName}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, eventName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Đơn vị chủ trì / Tổ chức *</label>
                    <input
                      type="text"
                      required
                      value={businessConfig.organizerName}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, organizerName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Thời gian diễn ra *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessConfig.eventDate}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, eventDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Địa chỉ tổ chức *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessConfig.eventLocation}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, eventLocation: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Giới hạn đại biểu đăng ký (Ngưỡng cảnh báo)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={10000}
                      value={businessConfig.maxRegistrations}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, maxRegistrations: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-850"
                    />
                  </div>
                </div>

                {/* App URL for embed generation */}
                <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 mt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[9px] font-black">🔗</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-indigo-800 uppercase tracking-wide">URL Domain Production (Bắt buộc cho mã nhúng WP)</p>
                      <p className="text-[10px] text-indigo-600 mt-0.5 leading-relaxed">
                        Nhập URL chính thức của hệ thống đã deploy (Vercel / Netlify / hosting). 
                        Mã nhúng iframe cho WordPress sẽ dùng URL này thay vì localhost.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={businessConfig.appUrl || ''}
                      onChange={(e) => setBusinessConfig({ ...businessConfig, appUrl: e.target.value })}
                      placeholder="Ví dụ: https://pars2026.com hoặc https://ten-project.vercel.app"
                      className="flex-1 px-3.5 py-2 text-xs border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-800 bg-white"
                    />
                    {businessConfig.appUrl && (
                      <a
                        href={businessConfig.appUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black border border-indigo-300 px-3 py-2 rounded-xl bg-white whitespace-nowrap"
                      >
                        Mở ↗
                      </a>
                    )}
                  </div>
                  {!businessConfig.appUrl && (
                    <p className="text-[9.5px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                      ⚠️ Chưa cấu hình — mã nhúng WP sẽ dùng URL hiện tại ({window.location.origin})
                    </p>
                  )}
                  {businessConfig.appUrl && (
                    <p className="text-[9.5px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                      ✅ Mã nhúng WordPress sẽ dùng: {businessConfig.appUrl}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-650 animate-pulse" />
                    Cấu hình ứng dụng di động PWA (Tải App / Chế độ ngoại tuyến)
                  </span>

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">Tên ứng dụng hiển thị (App Name) *</label>
                      <input
                        type="text"
                        value={businessConfig.pwaName || ''}
                        onChange={(e) => setBusinessConfig({ ...businessConfig, pwaName: e.target.value })}
                        placeholder="Ví dụ: PARS 2026 - Hội Nghị Thẩm Mỹ"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">Tên viết tắt trên màn hình điện thoại (Short Name) *</label>
                      <input
                        type="text"
                        value={businessConfig.pwaShortName || ''}
                        onChange={(e) => setBusinessConfig({ ...businessConfig, pwaShortName: e.target.value })}
                        placeholder="Ví dụ: PARS 2026"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 block">Mô tả ứng dụng PWA</label>
                      <textarea
                        value={businessConfig.pwaDescription || ''}
                        onChange={(e) => setBusinessConfig({ ...businessConfig, pwaDescription: e.target.value })}
                        placeholder="Nhập mô tả ngắn về ứng dụng phục vụ SEO và giới thiệu PWA..."
                        rows={2}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">Logo ứng dụng PWA *</label>
                      <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {businessConfig.pwaLogoUrl ? (
                            <img src={businessConfig.pwaLogoUrl} alt="Logo PWA" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold select-none text-center">No Logo</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-350 text-[10px] font-bold rounded-lg cursor-pointer transition-all inline-block select-none">
                            Tải lên hình ảnh
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setBusinessConfig({ ...businessConfig, pwaLogoUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {businessConfig.pwaLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setBusinessConfig({ ...businessConfig, pwaLogoUrl: '' })}
                              className="px-2 py-1 ml-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg border-none cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">Màu chủ đạo (Theme) *</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={businessConfig.pwaThemeColor || '#be6940'}
                            onChange={(e) => setBusinessConfig({ ...businessConfig, pwaThemeColor: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={businessConfig.pwaThemeColor || '#be6940'}
                            onChange={(e) => setBusinessConfig({ ...businessConfig, pwaThemeColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">Màu nền (Background) *</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={businessConfig.pwaBackgroundColor || '#0f172a'}
                            onChange={(e) => setBusinessConfig({ ...businessConfig, pwaBackgroundColor: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={businessConfig.pwaBackgroundColor || '#0f172a'}
                            onChange={(e) => setBusinessConfig({ ...businessConfig, pwaBackgroundColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-mono text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">LUẬT PHÊ DUYỆT & TRUYỀN PHÁT</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Toggle require payment proof */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-xs font-bold text-slate-850 block">Yêu cầu ảnh chuyển khoản</span>
                        <span className="text-[10px] text-slate-400">Bắt buộc đại biểu tải minh chứng chuyển khoản khi đăng ký ngoài cộng đồng</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBusinessConfig({ ...businessConfig, requirePaymentProof: !businessConfig.requirePaymentProof })}
                        className="p-1 cursor-pointer border-none bg-transparent hover:scale-105 transition-transform"
                      >
                        {businessConfig.requirePaymentProof ? (
                          <ToggleRight className="w-10 h-7 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-7 text-slate-350" />
                        )}
                      </button>
                    </div>

                    {/* Toggle allow cancellation */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-xs font-bold text-slate-850 block">Cho phép đại biểu tự hủy</span>
                        <span className="text-[10px] text-slate-400">Đại biểu có thể tự hủy đăng ký hoặc rút bài báo cáo qua cổng tích hợp</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBusinessConfig({ ...businessConfig, allowSelfCancellation: !businessConfig.allowSelfCancellation })}
                        className="p-1 cursor-pointer border-none bg-transparent hover:scale-105 transition-transform"
                      >
                        {businessConfig.allowSelfCancellation ? (
                          <ToggleRight className="w-10 h-7 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-7 text-slate-350" />
                        )}
                      </button>
                    </div>

                    {/* Toggle instant ZNS */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-xs font-bold text-slate-850 block">Tự động gửi Zalo ZNS lập tức</span>
                        <span className="text-[10px] text-slate-400">Tự động truyền tin mẫu ZNS thành công ngay sau khi đại biểu gửi form</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBusinessConfig({ ...businessConfig, autoSendZns: !businessConfig.autoSendZns })}
                        className="p-1 cursor-pointer border-none bg-transparent hover:scale-105 transition-transform"
                      >
                        {businessConfig.autoSendZns ? (
                          <ToggleRight className="w-10 h-7 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-7 text-slate-350" />
                        )}
                      </button>
                    </div>

                    {/* Toggle require practice code */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-xs font-bold text-slate-850 block">Yêu cầu CCHN khi xin CME</span>
                        <span className="text-[10px] text-slate-400">Yêu cầu điền Mã chứng chỉ hành nghề y tế nếu tick chọn yêu cầu cấp CME</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBusinessConfig({ ...businessConfig, requirePracticeCode: !businessConfig.requirePracticeCode })}
                        className="p-1 cursor-pointer border-none bg-transparent hover:scale-105 transition-transform"
                      >
                        {businessConfig.requirePracticeCode ? (
                          <ToggleRight className="w-10 h-7 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-7 text-slate-350" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer hover:shadow transition-all text-xs border-none"
                  >
                    Lưu cấu hình Nghiệp vụ sự kiện
                  </button>
                </div>
              </form>

              {/* Danger Zone (Khu vực nguy hiểm) */}
              {(role === 'admin' || role === 'btc') && (
                <div className="border border-rose-200 bg-rose-50/50 rounded-2xl p-5 mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide">Khu vực cảnh báo nguy hiểm</h4>
                      <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                        Hành động khôi phục dữ liệu gốc sẽ xóa sạch toàn bộ cơ sở dữ liệu hiện tại (bao gồm danh sách đại biểu, báo cáo viên, lịch trình, nhà tài trợ, các giao dịch tài chính, lịch sử gửi tin...) và tải lại dữ liệu mẫu cấu hình mặc định ban đầu.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-rose-150/60 pt-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">Khôi phục toàn bộ dữ liệu gốc (Factory Reset)</span>
                      <span className="text-[10px] text-rose-600">Đồng bộ xóa sạch trên LocalStorage và Supabase Cloud</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('CẢNH BÁO CỰC KỲ QUAN TRỌNG: Bạn có chắc chắn muốn khôi phục dữ liệu hệ thống mặc định? Hành động này sẽ xóa sạch toàn bộ đại biểu, báo cáo viên, lịch trình, nhà tài trợ, cấu hình và không thể khôi phục lại. Bạn có chắc chắn tiếp tục không?')) {
                          store.resetToDefaults();
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold rounded-xl transition-all text-xs border-none cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5 hover:animate-spin" />
                      Khôi Phục Dữ Liệu Gốc
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 2: REGISTRATION PACKAGES CRUD ================= */}
          {activeSubTab === 'packages' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Quản lý các gói đại biểu đăng ký</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Xác lập các cấu trúc định mức đóng góp tham dự, quyền hạn CME và Gala Dinner.</p>
                </div>
                {role === 'admin' && (
                  <button
                    disabled={isSavingPackage}
                    onClick={handleOpenAddPackage}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Đăng ký gói mới
                  </button>
                )}
              </div>

              {/* Package cards list container block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map(pkg => (
                  <div key={pkg.id} className="border border-slate-200 bg-white hover:border-slate-300 rounded-2xl p-5 relative transition-all shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {pkg.id}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900">{pkg.name}</h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        pkg.isActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100 border border-slate-200'
                      }`}>
                        {pkg.isActive ? '● Đang mở nhận' : '○ Đang đóng'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-slate-850">
                          {pkg.fee === 0 ? 'Miễn Phí' : pkg.fee.toLocaleString()}
                        </span>
                        {pkg.fee > 0 && <span className="text-[9px] text-slate-400 font-bold">VNĐ / Đại biểu</span>}
                      </div>

                      {pkg.description && (
                        <div className="text-[10.5px] text-slate-500 leading-normal line-clamp-2" dangerouslySetInnerHTML={{ __html: pkg.description }} />
                      )}

                      {/* Package special specifications tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pkg.includesCme && (
                          <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-100/40 px-2 py-0.5 rounded">
                            ✓ Có Cấp CME
                          </span>
                        )}
                        {pkg.includesGala && (
                          <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-100/40 px-2 py-0.5 rounded">
                            ✓ Có Dự Tiệc Gala
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Benefits string split chips list */}
                    {pkg.benefits && pkg.benefits.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 space-y-1.5">
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">ĐẶC QUYỀN ĐI KÈM:</span>
                        <div className="flex flex-wrap gap-1">
                          {pkg.benefits.map((b, i) => (
                            <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons footer for package */}
                    {role === 'admin' && (
                      <div className="border-t border-slate-100 pt-3 flex justify-end gap-1 px-1">
                        <button
                          disabled={isSavingPackage}
                          onClick={() => handleOpenEditPackage(pkg)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          disabled={isSavingPackage}
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>Gỡ bỏ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>


              {/* ── ADD-ON SERVICES MANAGEMENT ── */}
              <div className="border-t border-slate-200 pt-6 mt-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cấu hình dịch vụ phụ trợ tự chọn</h3>
                    <p className="text-[11px] text-slate-450 mt-0.5">Chỉnh sửa tên, giá, mô tả và bật/tắt các dịch vụ phụ trợ hiển thị trên form đại biểu (CME, Gala Dinner, Masterclass, Tour...).</p>
                  </div>
                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        const newId = 'addon-' + Date.now();
                        const current = businessConfig.addOnServices || [
                          { id: 'addon-cme', nameVi: 'Chứng chỉ CME', nameEn: 'CME Certificate', descriptionVi: 'Nhận chứng chỉ đào tạo y khoa liên tục CME sau khi kết thúc khóa học tham luận.', descriptionEn: 'Receive Continuing Medical Education (CME) certificate after completing the sessions.', fee: 350000, isEnabled: true, color: 'teal' },
                          { id: 'addon-gala', nameVi: 'Gala Dinner', nameEn: 'Gala Dinner', descriptionVi: 'Đăng ký tiệc tối ẩm thực giao lưu kết nối thân mật y sỹ.', descriptionEn: 'Register for the evening Gala Dinner for friendly medical networking.', fee: 700000, isEnabled: true, color: 'amber' },
                          { id: 'addon-masterclass', nameVi: 'Master Class', nameEn: 'Master Class', descriptionVi: 'Nhận truyền thụ và chuyển giao công nghệ thẩm mỹ lâm sàn chuyên sâu.', descriptionEn: 'Receive knowledge sharing and technology transfer for advanced aesthetic clinical methods.', fee: 500000, isEnabled: true, color: 'purple' },
                          { id: 'addon-tour', nameVi: 'Tour tham quan', nameEn: 'Sightseeing Tour', descriptionVi: 'Đóng phí Tour tham luận văn hóa dã ngoại theo lịch trình hội nghị.', descriptionEn: 'Register for cultural tour field trips following the official schedule.', fee: 4500000, isEnabled: true, color: 'pink' }
                        ];
                        setBusinessConfig({
                          ...businessConfig,
                          addOnServices: [...current, {
                            id: newId,
                            nameVi: 'Dịch vụ mới',
                            nameEn: 'New Service',
                            descriptionVi: 'Mô tả dịch vụ...',
                            descriptionEn: 'Service description...',
                            fee: 0,
                            isEnabled: false,
                            color: 'teal'
                          }]
                        });
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm dịch vụ
                    </button>
                  )}
                </div>

                {/* Default services if none configured */}
                {(() => {
                  const services: AddOnService[] = businessConfig.addOnServices || [
                    { id: 'addon-cme', nameVi: 'Chứng chỉ CME', nameEn: 'CME Certificate', descriptionVi: 'Nhận chứng chỉ đào tạo y khoa liên tục CME sau khi kết thúc khóa học tham luận.', descriptionEn: 'Receive Continuing Medical Education (CME) certificate after completing the sessions.', fee: 350000, isEnabled: true, color: 'teal' },
                    { id: 'addon-gala', nameVi: 'Gala Dinner', nameEn: 'Gala Dinner', descriptionVi: 'Đăng ký tiệc tối ẩm thực giao lưu kết nối thân mật y sỹ.', descriptionEn: 'Register for the evening Gala Dinner for friendly medical networking.', fee: 700000, isEnabled: true, color: 'amber' },
                    { id: 'addon-masterclass', nameVi: 'Master Class', nameEn: 'Master Class', descriptionVi: 'Nhận truyền thụ và chuyển giao công nghệ thẩm mỹ lâm sàn chuyên sâu.', descriptionEn: 'Receive knowledge sharing and technology transfer for advanced aesthetic clinical methods.', fee: 500000, isEnabled: true, color: 'purple' },
                    { id: 'addon-tour', nameVi: 'Tour tham quan', nameEn: 'Sightseeing Tour', descriptionVi: 'Đóng phí Tour tham luận văn hóa dã ngoại theo lịch trình hội nghị.', descriptionEn: 'Register for cultural tour field trips following the official schedule.', fee: 4500000, isEnabled: true, color: 'pink' }
                  ];

                  // Initialize defaults if not yet saved
                  if (!businessConfig.addOnServices) {
                    setTimeout(() => {
                      setBusinessConfig(prev => ({ ...prev, addOnServices: services }));
                    }, 0);
                  }

                  return (
                    <div className="space-y-4">
                      {services.map((svc, idx) => (
                        <div key={svc.id} className="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                                svc.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                                svc.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                                svc.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                svc.color === 'pink' ? 'bg-pink-100 text-pink-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>{svc.id}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                svc.isEnabled ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100 border border-slate-200'
                              }`}>
                                {svc.isEnabled ? '● Đang bật' : '○ Đang tắt'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, isEnabled: !svc.isEnabled };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                                  svc.isEnabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {svc.isEnabled ? 'Tắt' : 'Bật'}
                              </button>
                              {role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!confirm('Xóa dịch vụ này?')) return;
                                    const updated = services.filter((_, i) => i !== idx);
                                    setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                  }}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer border-none bg-transparent"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Tên tiếng Việt *</label>
                              <input
                                type="text"
                                value={svc.nameVi}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, nameVi: e.target.value };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Tên tiếng Anh *</label>
                              <input
                                type="text"
                                value={svc.nameEn}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, nameEn: e.target.value };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Mô tả tiếng Việt</label>
                              <textarea
                                value={svc.descriptionVi}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, descriptionVi: e.target.value };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                rows={2}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Mô tả tiếng Anh</label>
                              <textarea
                                value={svc.descriptionEn}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, descriptionEn: e.target.value };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                rows={2}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Giá dịch vụ (VNĐ)</label>
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={svc.fee}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, fee: Number(e.target.value) };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-1">Màu giao diện</label>
                              <select
                                value={svc.color || 'teal'}
                                onChange={(e) => {
                                  const updated = [...services];
                                  updated[idx] = { ...svc, color: e.target.value };
                                  setBusinessConfig({ ...businessConfig, addOnServices: updated });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                <option value="teal">🟢 Teal</option>
                                <option value="amber">🟡 Amber</option>
                                <option value="purple">🟣 Purple</option>
                                <option value="pink">🩷 Pink</option>
                                <option value="indigo">🔵 Indigo</option>
                                <option value="rose">🔴 Rose</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Save button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            store.saveBusinessConfig(businessConfig);
                            alert('Đã lưu cấu hình dịch vụ phụ trợ thành công!');
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer border-none shadow-sm transition-all"
                        >
                          💾 Lưu cấu hình dịch vụ phụ trợ
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================= SECTION 2B: SPONSOR PACKAGES CRUD ================= */}
          {activeSubTab === 'sponsor-packages' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Quản lý gói đăng ký của nhà tài trợ</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Xác lập các mức đóng góp tài trợ sự kiện, quyền lợi và màu sắc nhận diện tương ứng.</p>
                </div>
                {role === 'admin' && (
                  <button
                    disabled={isSavingSponsorPackage}
                    onClick={handleOpenAddSponsorPackage}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Đăng ký gói mới
                  </button>
                )}
              </div>

              {/* Sponsor Package cards list container block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsorPackages.map(pkg => {
                  const displayColor = pkg.color || '#6366f1';
                  return (
                    <div key={pkg.id} className="border border-slate-200 bg-white hover:border-slate-300 rounded-2xl p-5 relative transition-all shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span 
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white"
                            style={{ backgroundColor: displayColor }}
                          >
                            {pkg.id}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900 mt-1">{pkg.name}</h4>
                          {pkg.nameEn && <p className="text-[10px] text-slate-400 font-medium italic">{pkg.nameEn}</p>}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          pkg.isActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100 border border-slate-200'
                        }`}>
                          {pkg.isActive ? '● Đang mở nhận' : '○ Đang đóng'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-850">
                            {pkg.fee === 0 ? 'Tài Trợ Đồng Hành' : pkg.fee.toLocaleString()}
                          </span>
                          {pkg.fee > 0 && <span className="text-[9px] text-slate-450 font-bold">VNĐ / Nhà tài trợ</span>}
                        </div>
                      </div>

                      {/* Benefits VI list */}
                      {pkg.benefits && pkg.benefits.length > 0 && (
                        <div className="border-t border-slate-150 pt-3 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">QUYỀN LỢI CHI TIẾT (VI):</span>
                          <div className="flex flex-col gap-1">
                            {pkg.benefits.map((b, i) => (
                              <span key={i} className="text-[9.5px] font-bold text-slate-650 flex items-start gap-1.5 leading-relaxed">
                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Benefits EN list */}
                      {pkg.benefitsEn && pkg.benefitsEn.length > 0 && (
                        <div className="border-t border-slate-100 pt-3 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest block">SPONSORSHIP BENEFITS (EN):</span>
                          <div className="flex flex-col gap-1">
                            {pkg.benefitsEn.map((b, i) => (
                              <span key={i} className="text-[9.5px] font-medium text-slate-500 flex items-start gap-1.5 leading-relaxed italic">
                                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons footer for package */}
                      {role === 'admin' && (
                        <div className="border-t border-slate-100 pt-3 flex justify-end gap-1 px-1">
                          <button
                            disabled={isSavingSponsorPackage}
                            onClick={() => handleOpenEditSponsorPackage(pkg)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </button>
                          <button
                            disabled={isSavingSponsorPackage}
                            onClick={() => handleDeleteSponsorPackage(pkg.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span>Gỡ bỏ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= SECTION 3: INTEGRATION API CONNECTION CONFIG ================= */}
          {activeSubTab === 'integrations' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cấu hình liên kết cổng tích hợp API</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Quản lý định biên truyền phát Email SMTP/Resend Server, Zalo OA Gateway và Supabase Cloud Database.</p>
              </div>

              {/* Left & Right layout: columns for form config and verification test tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Zalo OA Connection settings card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                    🪪 ZALO OA API CREDENTIALS
                  </span>
                  <form onSubmit={handleSaveZaloSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">APP ID</label>
                      <input
                        type="text"
                        value={zaloConfig.appId}
                        onChange={(e) => setZaloConfig({ ...zaloConfig, appId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">SECRET KEY</label>
                      <input
                        type="password"
                        value={zaloConfig.secretKey}
                        onChange={(e) => setZaloConfig({ ...zaloConfig, secretKey: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">OFFICIAL ACCOUNT ID (OA ID)</label>
                      <input
                        type="text"
                        value={zaloConfig.oaId}
                        onChange={(e) => setZaloConfig({ ...zaloConfig, oaId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">ACCESS TOKEN (ZALO OA)</label>
                      <textarea
                        value={zaloConfig.accessToken}
                        onChange={(e) => setZaloConfig({ ...zaloConfig, accessToken: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        rows={2}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">REFRESH TOKEN (Gia hạn tự động sau 23 giờ)</label>
                        {zaloConfig.accessTokenUpdatedAt && (
                          <span className="text-[8.5px] font-black text-emerald-600">
                            ⏱️ Cập nhật: {new Date(zaloConfig.accessTokenUpdatedAt).toLocaleTimeString('vi-VN')} {new Date(zaloConfig.accessTokenUpdatedAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={zaloConfig.refreshToken || ''}
                        onChange={(e) => setZaloConfig({ ...zaloConfig, refreshToken: e.target.value })}
                        placeholder="Nhập Refresh Token được cấp từ Zalo để tự động gia hạn Access Token"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        rows={2}
                      />
                      <p className="text-[9.5px] text-slate-450 mt-1 leading-snug">
                        ⚠️ <span className="font-bold text-amber-700">Lưu ý:</span> ACCESS TOKEN của Zalo OA sẽ hết hạn sau 24 giờ. 
                        Hệ thống sẽ dùng REFRESH TOKEN định kỳ sau 23 giờ để tự động lấy Token mới, giúp luồng truyền phát ZNS không bị ngắt quãng.
                      </p>
                    </div>
                    <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-900 border-none text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer">
                      Đồng Bộ cấu hình Zalo API
                    </button>
                  </form>

                  <div className="border-t border-slate-250 pt-3 space-y-2.5 mt-4">
                    <span className="text-[9px] font-black text-indigo-700 block">⚡ CHẠY TEST TRUYỀN PHÁT ZALO CO-GATEWAY:</span>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleVerifyZaloTokenObj}
                          disabled={zaloTesting}
                          className="w-full px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 rounded-lg cursor-pointer text-[10px] font-bold text-center"
                        >
                          {zaloTesting ? 'Đang xác thực...' : '1. Kiểm tra Token'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRefreshZaloToken}
                          disabled={zaloTesting}
                          className="w-full px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-750 rounded-lg cursor-pointer text-[10px] font-bold text-center"
                          title="Yêu cầu cổng OAuth cấp Access Token mới ngay lập tức"
                        >
                          {zaloTesting ? 'Đang làm mới...' : '🔄 Làm mới Token'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Số ĐT nhận test (09...)"
                          value={zaloConfig.testPhone}
                          onChange={(e) => setZaloConfig({ ...zaloConfig, testPhone: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono flex-1 min-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestZaloMessage}
                          disabled={zaloTesting}
                          className="px-3 py-1.5 bg-blue-50 text-blue-750 border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          2. Gửi test ZNS
                        </button>
                      </div>
                    </div>

                    {zaloTestResult && (
                      <div className={`p-3 rounded-lg border text-[10px] font-mono leading-normal mt-2 ${
                        zaloTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <div className="font-extrabold flex items-center gap-1.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${zaloTestResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>Zalo OA Verification Gate:</span>
                        </div>
                        <p>{zaloTestResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SMTP Mailer Server settings card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                    📧 OUTGOING MAIL SERVER (SMTP)
                  </span>
                  <form onSubmit={handleSaveSMTPSubmit} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 block mb-1">SMTP HOST</label>
                        <input
                          type="text"
                          value={emailConfig.smtpHost}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[9px] font-black text-slate-400 block mb-1">PORT</label>
                        <input
                          type="number"
                          value={emailConfig.smtpPort}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">SMTP USER ACCOUNT (EMAIL)</label>
                      <input
                        type="text"
                        value={emailConfig.smtpUser}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">SMTP ACCOUNT PASSWORD (SMTP PASS)</label>
                      <input
                        type="password"
                        value={emailConfig.smtpPass}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 block mb-1">MÃ SENDER NAME</label>
                        <input
                          type="text"
                          value={emailConfig.senderName}
                          onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 block mb-1">MÃ SENDER EMAIL</label>
                        <input
                          type="email"
                          value={emailConfig.senderEmail}
                          onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-900 border-none text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer">
                      Đồng bộ thông số Mail SMTP
                    </button>
                  </form>

                  <div className="border-t border-slate-250 pt-3 space-y-2.5 mt-4">
                    <span className="text-[9px] font-black text-indigo-700 block">⚡ KIỂM TRA LUỒNG BẮN THƯ SMTP:</span>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleTestSmtpConnectionObj}
                        disabled={smtpTesting}
                        className="w-full px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 rounded-lg cursor-pointer text-[10px] font-bold text-center"
                      >
                        {smtpTesting ? 'Đang kiểm tra...' : '1. Check SMTP Connection'}
                      </button>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Email nhận test..."
                          value={emailConfig.testEmail}
                          onChange={(e) => setEmailConfig({ ...emailConfig, testEmail: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono flex-1 min-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestMailObj}
                          disabled={emailSendingTest}
                          className="px-3 py-1.5 bg-blue-50 text-blue-750 border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          2. Gửi mail test
                        </button>
                      </div>
                    </div>

                    {smtpTestResult && (
                      <div className={`p-3 rounded-lg border text-[10px] font-mono leading-normal ${
                        smtpTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <span className="font-extrabold block mb-0.5">SMTP Authentication:</span>
                        <p>{smtpTestResult.message}</p>
                      </div>
                    )}
                    {emailSendingResult && (
                      <div className={`p-3 rounded-lg border text-[10px] font-mono leading-normal ${
                        emailSendingResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <span className="font-extrabold block mb-0.5">SMTP Transmission:</span>
                        <p>{emailSendingResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2b. Resend Outcoming Mail Server settings card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                    📧 CỔNG GỬI MAIL HÀNG LOẠT (RESEND)
                  </span>
                  <form onSubmit={handleSaveResendSubmit} className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">RESEND API KEY</label>
                      <input
                        type="password"
                        placeholder="re_xxxxxxxxxxxxxx"
                        value={resendConfig.apiKey}
                        onChange={(e) => setResendConfig({ ...resendConfig, apiKey: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">EMAIL SENDER (EMAIL GỬI ĐI)</label>
                      <input
                        type="text"
                        placeholder="onboarding@resend.dev hoặc email tên miền của bạn"
                        value={resendConfig.senderEmail}
                        onChange={(e) => setResendConfig({ ...resendConfig, senderEmail: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-900 border-none text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer font-bold">
                      Đồng bộ thông số Mail Resend
                    </button>
                  </form>

                  <div className="border-t border-slate-250 pt-3 space-y-2.5 mt-4">
                    <span className="text-[9px] font-black text-indigo-700 block">⚡ KIỂM TRA CỔNG BẮN THƯ RESEND:</span>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Email nhận test..."
                          value={resendTestEmail}
                          onChange={(e) => setResendTestEmail(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono flex-1 min-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestResendMail}
                          disabled={resendSendingTest}
                          className="px-3 py-1.5 bg-blue-50 text-blue-750 border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          {resendSendingTest ? 'Đang gửi...' : 'Gửi mail test'}
                        </button>
                      </div>
                    </div>

                    {resendSendingResult && (
                      <div className={`p-3 rounded-lg border text-[10px] font-mono leading-normal ${
                        resendSendingResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <span className="font-extrabold block mb-0.5">Resend Transmission:</span>
                        <p>{resendSendingResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. WhatsApp Business API settings card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                    🟢 WHATSAPP BUSINESS CLOUD API
                  </span>
                  <form onSubmit={handleSaveWhatsappSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">ACCESS TOKEN (SYSTEM USER TEMPORARY/PERMANENT)</label>
                      <textarea
                        value={whatsappConfig.accessToken}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">PHONE NUMBER ID</label>
                      <input
                        type="text"
                        value={whatsappConfig.phoneNumberId}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">WHATSAPP BUSINESS ACCOUNT ID</label>
                      <input
                        type="text"
                        value={whatsappConfig.businessAccountId}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, businessAccountId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-900 border-none text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer">
                      Đồng Bộ cấu hình WhatsApp API
                    </button>
                  </form>

                  <div className="border-t border-slate-250 pt-3 space-y-2.5 mt-4">
                    <span className="text-[9px] font-black text-indigo-700 block">⚡ CHẠY TEST TRUYỀN PHÁT WHATSAPP CO-GATEWAY:</span>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleVerifyWhatsappToken}
                        disabled={waTesting}
                        className="w-full px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 rounded-lg cursor-pointer text-[10px] font-bold text-center"
                      >
                        {waTesting ? 'Đang xác thực...' : '1. Kiểm tra Token'}
                      </button>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Số ĐT nhận test (84...)"
                          value={whatsappConfig.testPhone}
                          onChange={(e) => setWhatsappConfig({ ...whatsappConfig, testPhone: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono flex-1 min-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestWhatsappMessage}
                          disabled={waTesting}
                          className="px-3 py-1.5 bg-blue-50 text-blue-750 border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          2. Gửi test Template
                        </button>
                      </div>
                    </div>

                    {waTestResult && (
                      <div className={`p-3 rounded-lg border text-[10px] font-mono leading-normal mt-2 ${
                        waTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <div className="font-extrabold flex items-center gap-1.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${waTestResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>WhatsApp Verification Gate:</span>
                        </div>
                        <p>{waTestResult.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Hướng dẫn tích hợp WhatsApp Business Cloud API */}
                  <details className="border-t border-slate-200 pt-3 mt-3 cursor-pointer group">
                    <summary className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center justify-between list-none group-open:mb-2 select-none">
                      <span>📖 HƯỚNG DẪN TÍCH HỢP WHATSAPP API</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                    </summary>
                    <div className="text-[10.5px] text-slate-600 space-y-2 leading-relaxed font-sans cursor-default pt-1 select-text">
                      <p className="font-bold text-slate-700">Các bước kết nối với Meta WhatsApp Cloud API:</p>
                      <ol className="list-decimal pl-4 space-y-2 text-slate-600">
                        <li>
                          <strong>Tạo Ứng dụng Meta:</strong> Truy cập <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">developers.facebook.com</a>, đăng nhập tài khoản Facebook, tạo ứng dụng mới loại <strong>Doanh nghiệp (Business)</strong>.
                        </li>
                        <li>
                          <strong>Thiết lập WhatsApp:</strong> Tìm sản phẩm <strong>WhatsApp</strong> trong dashboard ứng dụng của bạn và nhấn <strong>Thiết lập (Set up)</strong> để kết nối với tài khoản Meta Business Suite.
                        </li>
                        <li>
                          <strong>Lấy thông số ID:</strong> Vào mục <strong>WhatsApp &rarr; Bắt đầu (Get Started)</strong> trong thanh bên trái. Sao chép <strong>Phone Number ID</strong> và <strong>WhatsApp Business Account ID</strong> ở góc bên phải.
                        </li>
                        <li>
                          <strong>Tạo Access Token vĩnh viễn:</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Vào <strong>Cài đặt doanh nghiệp (Business Settings)</strong> của Meta Suite &rarr; <strong>Người dùng hệ thống (System Users)</strong>.</li>
                            <li>Thêm người dùng hệ thống mới vai trò <strong>Quản trị viên (Admin)</strong>.</li>
                            <li>Chọn người dùng đó &rarr; nhấn <strong>Tạo mã token (Generate token)</strong>.</li>
                            <li>Tích chọn ứng dụng của bạn và tích 2 quyền bắt buộc: <code>whatsapp_business_messaging</code> và <code>whatsapp_business_management</code> rồi sao chép mã Token.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Kiểm tra kết nối:</strong> Điền các thông số vào form trên, nhấn <strong>Đồng Bộ</strong>, sau đó điền số điện thoại test (dạng <code>84...</code>) rồi ấn <strong>Kiểm tra Token</strong> và <strong>Gửi test Template</strong>.
                        </li>
                      </ol>
                    </div>
                  </details>
                </div>
              </div>

              {/* 3. Supabase Credentials link and Postgres DDL viewer table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
                
                {/* Supabase inputs */}
                <div className="lg:col-span-5 bg-slate-55 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block border-b border-slate-200 pb-1.5">
                    ⚡ LIÊN KẾT SUPABASE CLOUD (REAL-TIME STORAGE)
                  </span>
                  <form onSubmit={handleSaveSupabaseSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">SUPABASE URL</label>
                      <input
                        type="text"
                        value={supabaseConfig.apiUrl}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1">ANON PUBLIC API KEY</label>
                      <input
                        type="password"
                        value={supabaseConfig.anonKey}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        placeholder="eyJhbG..."
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 text-[10.5px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-all border-none shadow-sm">
                      Đồng bộ liên kết Supabase Credentials
                    </button>
                  </form>
                </div>

                {/* SQL DDL postgres viewer panel */}
                <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-300 space-y-3 self-stretch flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <span className="text-[9.5px] font-mono font-black text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-indigo-400" />
                        SUPABASE POSTGRESQL DDL STRUCTURES
                      </span>
                      <button
                        onClick={handleCopySQLScript}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[9px] font-black font-mono cursor-pointer border border-slate-800"
                      >
                        {copiedSchema ? 'COPIED!' : 'COPY SQL'}
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-normal">
                      Hãy sao chép cấu trúc mã nguồn SQL định nghĩa bảng dưới đây rồi dán vào trang <strong className="text-white font-bold">SQL Editor</strong> bên cổng hành chính quản trị của dự án <strong>Supabase</strong> để lập tức kiến thiết các bảng đồng bộ thực tế.
                    </p>
                    <div className="bg-slate-900/60 border border-slate-900 rounded-xl p-3">
                      <pre className="font-mono text-[8px] text-slate-400 max-h-40 overflow-y-auto leading-relaxed whitespace-pre select-all h-36">
                        {store.getSupabaseSqlSchema()}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= SECTION 4: DETAILED HUMAN ROLE AND PERMISSIONS CRUD ================= */}
          {activeSubTab === 'operators' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cấu hình phân quyền vận hành hệ thống</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Xác lập phạm vi thẩm quyền của nhân sự thuộc ban tổ chức đối với hồ sơ tài chính, đại biểu và phê duyệt.</p>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={handleOpenAddOperator}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm nhân sự mới
                  </button>
                )}
              </div>

              {/* Responsive table mapping operators and granular flags list */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-250 transition-all font-sans text-[10.5px]">
                      <th className="p-3.5 pl-5">Tên hiển thị nhân sự</th>
                      <th className="p-3.5">Email tài khoản</th>
                      <th className="p-3.5">Vai trò</th>
                      <th className="p-3.5">Phân quyền chi tiết</th>
                      <th className="p-3.5 text-center">Trạng thái</th>
                      {role === 'admin' && <th className="p-3.5 pr-5 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block">{u.name}</span>
                            <span className="text-[8.5px] text-slate-400 font-mono tracking-wide px-1.5 py-0.5 bg-slate-100 rounded">
                              {u.id}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600">{u.email}</td>
                        <td className="p-3.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono text-center uppercase inline-block font-extrabold ${
                            u.role === 'admin' ? 'bg-red-50 text-red-700' : u.role === 'btc' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'btc' ? 'BTC' : 'CTV'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {(!u.permissions || u.permissions.length === 0) ? (
                              <span className="text-[9px] text-slate-400 italic">Mặc định</span>
                            ) : (
                              u.permissions.map((p, i) => {
                                const mapText: Record<string, string> = {
                                  'approve_attendees': 'Duyệt đại biểu',
                                  'manage_speakers': 'Duyệt báo cáo viên',
                                  'finance_records': 'Tính năng tài chính',
                                  'system_settings': 'Sửa cấu hình hệ thống'
                                };
                                return (
                                  <span key={i} className="text-[8.5px] font-bold bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5 text-indigo-600" />
                                    {mapText[p] || p}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            disabled={role !== 'admin' || u.email === 'admin'}
                            onClick={() => {
                              const updatedUser = { ...u, status: u.status === 'active' ? 'inactive' : ('active' as any) };
                              store.saveUser(updatedUser);
                              reloadData();
                            }}
                            className={`px-2 py-0.5 rounded-full text-[9px] border font-black uppercase text-center cursor-pointer disabled:cursor-not-allowed ${
                              u.status === 'active'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}
                          >
                            {u.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                          </button>
                        </td>
                        {role === 'admin' && (
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditOperator(u)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 border-none bg-transparent cursor-pointer"
                                title="Chỉnh sửa chi tiết"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOperator(u.id)}
                                disabled={u.email === 'admin'}
                                className="p-1 hover:bg-rose-50 rounded text-rose-450 hover:text-rose-705 border-none bg-transparent cursor-pointer disabled:opacity-20"
                                title="Xóa nhân sự"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 5: WORDPRESS EMBEDS & CUSTOM SCRIPTS CRUD ================= */}
          {activeSubTab === 'embeds' && (
            <div className="space-y-6">
              
              {/* Informational banner of integrated embeds scripts with community */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-200 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-700">
                <Info className="w-5 h-5 shrink-0 text-indigo-500" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs">CƠ CHẾ KẾT NỐI MÃ NHÚNG TÍCH HỢP (WORDPRESS / HEADERS / ANALYTICS)</h4>
                  <p className="text-[10.5px]">
                    Bạn có thể tự do khởi tạo và CRUD lưu trữ không giới hạn các đoạn mã / scripts nhúng lên máy chủ Supabase. Toàn bộ các mã Iframe, mã nhúng Google Analytics, pixel theo dõi Facebook hay mã hỗ trợ trực tuyến đều có thể được quản lý tiện lợi tại đây.
                  </p>
                </div>
              </div>

              {/* Dynamic Embed Script list & config controllers row */}
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Danh sách mã nhúng trong database</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">CRUD các tài nguyên mã nhúng và sao chép an toàn để dán vào WordPress của bạn.</p>
                </div>
                <button
                  onClick={handleOpenAddEmbed}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  Thành lập mã nhúng mới
                </button>
              </div>

              {/* DB entries collection view */}
              <div className="grid grid-cols-1 gap-4">
                {embedScripts.map(script => (
                  <div key={script.id} className="border border-slate-200 bg-white hover:border-slate-350 rounded-2xl p-4 transition-all relative space-y-3.5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="gap-2 flex flex-col md:flex-row md:items-center">
                        <span className="text-[9px] font-mono font-black text-white bg-slate-800 px-2.5 py-0.5 rounded-lg">
                          {script.id}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900">{script.name}</h4>
                        <span className="text-[8.5px] font-black uppercase bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded">
                          {script.targetType === 'delegate' ? 'Form Đại biểu WP' : script.targetType === 'speaker' ? 'Form Báo cáo viên WP' : script.targetType === 'sponsor' ? 'Form Tài trợ WP' : script.targetType === 'analytics' ? 'Tracking Analytics' : 'Custom Snippet'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleEmbedActive(script)}
                          className={`text-[9.5px] font-bold bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1 ${
                            script.isActive ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {script.isActive ? '● Đang kích hoạt' : '○ Tạm ngắt'}
                        </button>
                      </div>
                    </div>

                    {script.notes && (
                      <p className="text-[10.5px] text-slate-450 italic font-sans leading-relaxed">
                        Mẹo tích hợp: {script.notes}
                      </p>
                    )}

                    {/* Pre-rendered code area and quick action keys */}
                    <div className="bg-slate-950 p-3.5 rounded-xl text-[10px] font-mono text-slate-300 relative border border-slate-850 group select-all">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(script.code);
                          setCopiedCodeSection(script.id);
                          setTimeout(() => setCopiedCodeSection(null), 2000);
                        }}
                        className="absolute right-2.5 top-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-lg px-2 py-1 text-[8.5px] cursor-pointer"
                      >
                        {copiedCodeSection === script.id ? 'COPIED!' : 'COPY CODE'}
                      </button>
                      <pre className="overflow-x-auto max-h-24 pr-20 select-all font-mono leading-normal whitespace-pre-wrap mt-0.5">
                        {script.code}
                      </pre>
                    </div>

                    {/* Footer crud button tasks */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end gap-3 text-[10.5px] font-bold">
                      <button
                        onClick={() => handleOpenEditEmbed(script)}
                        className="text-slate-500 hover:text-slate-850 border-none bg-transparent cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteEmbed(script.id)}
                        className="text-rose-500 hover:text-rose-700 border-none bg-transparent cursor-pointer flex items-center gap-1"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        Nhấn giải phóng
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic standard quick WordPress copy generator tool */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-950/80 text-xs text-slate-350 space-y-5 mt-6">
                <span className="text-[9.5px] font-mono font-black text-amber-400 tracking-wider block uppercase">⚡ TRÌNH TẠO MÃ NHÚNG NHANH CHO WORDPRESS GUTEBERG/ELEMENTOR</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block text-[10.5px]">1. Chọn mẫu biểu mẫu:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'delegate', label: 'Đại Biểu' },
                          { id: 'speaker', label: 'Bài Báo' },
                          { id: 'sponsor', label: 'Tài Trợ' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedEmbedForm(f.id as any)}
                            className={`py-1.5 text-[10px] font-extrabold rounded-lg cursor-pointer border text-center transition-all ${
                              selectedEmbedForm === f.id
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-300">
                        <label className="font-bold text-[10.5px]">2. Chỉ số chiều cao iframe:</label>
                        <span className="font-mono text-indigo-400 font-black">{iframeHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="800"
                        max="1400"
                        step="50"
                        value={iframeHeight}
                        onChange={(e) => setIframeHeight(e.target.value)}
                        className="w-full accent-indigo-500 h-1 cursor-pointer bg-slate-950 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-850">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] text-slate-400 font-bold">MẮT XEM TRƯỚC URL:</span>
                      <a href={getEmbedFormUrl(selectedEmbedForm)} target="_blank" rel="noreferrer" className="text-indigo-400 font-black text-[10px] uppercase flex items-center gap-1.5 hover:underline">
                        Bật xem trước
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-normal">
                      Mã nhúng dãn chiều cao thông minh tự bọc sandbox cho phép đại biểu giao lưu tuyệt vời trên di động mà không lo bị co rút khung hiển thị.
                    </p>
                  </div>
                </div>

                {/* Gutenberg clean frame format block */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center bg-slate-950/80 p-2.5 px-3.5 rounded-t-lg border-b border-slate-900 text-[10.5px]">
                    <span className="font-mono font-bold text-slate-300">Iframe Responsive Gutenberg/Elementor Block Code</span>
                    <button
                      onClick={() => {
                        const finalCode = `<!-- PARS Embed Form: ${selectedEmbedForm} -->
<div id="pars-frame-root-${selectedEmbedForm}" style="width:100%;overflow:hidden;position:relative;">
  <iframe
    id="pars-embed-frame-${selectedEmbedForm}"
    src="${getEmbedFormUrl(selectedEmbedForm)}"
    width="100%"
    height="${iframeHeight}px"
    style="border:none;width:100%;display:block;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.06);"
    loading="lazy"
    allow="clipboard-write"
    sandbox="allow-top-navigation allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
  ></iframe>
  <script>
    (function(){
      var frame=document.getElementById('pars-embed-frame-${selectedEmbedForm}');
      window.addEventListener('message',function(e){
        if(e.data&&e.data.type==='pars-height'&&typeof e.data.height==='number'){
          frame.style.height=e.data.height+'px';
        }
      });
    })();
  <\/script>
</div>`;
                        navigator.clipboard.writeText(finalCode);
                        setCopiedCodeSection('quickger');
                        setTimeout(() => setCopiedCodeSection(null), 2000);
                      }}
                      className="text-amber-400 font-bold border-none bg-transparent cursor-pointer hover:underline text-[10px]"
                    >
                      {copiedCodeSection === 'quickger' ? 'Đã sao chép!' : 'COPY CODE'}
                    </button>
                  </div>
                  <pre className="bg-slate-950/40 p-4 border border-slate-900 rounded-b-lg font-mono text-[8.5px] text-emerald-400 h-36 overflow-y-auto leading-relaxed select-all">
{`<!-- PARS Embed Form: ${selectedEmbedForm} -->
<div id="pars-frame-root-${selectedEmbedForm}" style="width:100%;overflow:hidden;position:relative;">
  <iframe
    id="pars-embed-frame-${selectedEmbedForm}"
    src="${getEmbedFormUrl(selectedEmbedForm)}"
    width="100%" height="${iframeHeight}px"
    style="border:none;width:100%;display:block;border-radius:12px;"
    loading="lazy" allow="clipboard-write"
    sandbox="allow-top-navigation allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
  ></iframe>
  <script>(function(){var f=document.getElementById('pars-embed-frame-${selectedEmbedForm}');window.addEventListener('message',function(e){if(e.data&&e.data.type==='pars-height')f.style.height=e.data.height+'px';});})()</script>
</div>`}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* ================= SECTION 6: PRINTER CONFIGURATION & MANUAL ================= */}
          {activeSubTab === 'printers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cấu hình máy in nhãn nhiệt & name badge</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Xác lập các tham số in ấn cục bộ trên thiết bị tiếp đón tại sảnh.</p>
                </div>
              </div>

              <form onSubmit={handleSavePrinterSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Toggle auto print */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Tự động in khi check-in</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Mở hộp thoại in (hoặc in trực tiếp) ngay sau khi quét QR / duyệt check-in</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrinterAutoPrint(!printerAutoPrint)}
                      className="p-1 cursor-pointer border-none bg-transparent hover:scale-105 transition-transform"
                    >
                      {printerAutoPrint ? (
                        <ToggleRight className="w-10 h-7 text-indigo-650" />
                      ) : (
                        <ToggleLeft className="w-10 h-7 text-slate-350" />
                      )}
                    </button>
                  </div>

                  {/* Connection mode selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Phương thức kết nối & in ấn</label>
                    <select
                      value={printerConnection}
                      onChange={(e) => setPrinterConnection(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-white text-slate-800"
                    >
                      <option value="browser">In qua hộp thoại trình duyệt (Mặc định)</option>
                      <option value="kiosk">Chế độ in tự động Silent / Kiosk printing</option>
                    </select>
                  </div>

                  {/* Paper size selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Khổ giấy sticker thực tế</label>
                    <select
                      value={printerPaperSize}
                      onChange={(e) => setPrinterPaperSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-white text-slate-800"
                    >
                      <option value="100x150">Khổ lớn: 100mm x 150mm (A6 sticker)</option>
                      <option value="80x50">Khổ chuẩn: 80mm x 50mm (8cm x 5cm Badge)</option>
                      <option value="70x50">Khổ nhỏ: 70mm x 50mm (Mini Badge)</option>
                      <option value="K80">Khổ hóa đơn: K80 (80mm cuộn liên tục)</option>
                    </select>
                  </div>

                  {/* Margin configuration */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Căn lề trống trang in (Margins)</label>
                    <select
                      value={printerMargin}
                      onChange={(e) => setPrinterMargin(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-white text-slate-800"
                    >
                      <option value="none">Không lề - Margin 0 (Khuyên dùng cho máy in nhiệt)</option>
                      <option value="minimum">Lề tối thiểu (Minimum - 2mm)</option>
                      <option value="default">Mặc định của hệ thống trình duyệt</option>
                    </select>
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer hover:shadow transition-all text-xs border-none"
                  >
                    Lưu cấu hình máy in cục bộ
                  </button>
                </div>
              </form>

              {/* ================= INSTRUCTION MANUAL ================= */}
              <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
                <span className="text-[11.5px] font-black text-slate-800 uppercase tracking-widest block flex items-center gap-1.5">
                  📖 HƯỚNG DẪN CẤU HÌNH VÀ SỬ DỤNG MÁY IN NHIỆT CHI TIẾT
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Step 1 & 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h4 className="font-extrabold text-xs text-indigo-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">1</span>
                      Thiết lập phần cứng & Driver máy in
                    </h4>
                    <ul className="list-disc pl-4 text-[10.5px] text-slate-650 space-y-1.5 leading-relaxed">
                      <li>Kết nối máy in nhãn nhiệt (Xprinter, Zebra, Honeywell, Brother,...) qua cổng USB hoặc mạng LAN.</li>
                      <li>Vào <strong>Control Panel</strong> &gt; <strong>Devices and Printers</strong> (hoặc Printers & Scanners trên Win 10/11).</li>
                      <li>Nhấn chuột phải vào máy in, chọn <strong>Printing Preferences</strong>.</li>
                      <li>Tại thẻ <strong>Page Setup</strong>, nhấn <strong>New</strong> để tạo khổ giấy mới khớp chính xác với kích thước sticker vật lý đang sử dụng (vd: 80mm x 50mm hoặc 100mm x 150mm).</li>
                      <li>Đặt lề (Margins) trong driver bằng <strong>0mm</strong>.</li>
                    </ul>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h4 className="font-extrabold text-xs text-indigo-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">2</span>
                      Cấu hình hộp thoại in trên Chrome / Edge
                    </h4>
                    <ul className="list-disc pl-4 text-[10.5px] text-slate-650 space-y-1.5 leading-relaxed">
                      <li>Tại hộp thoại in hiển thị lần đầu trên hệ thống, chọn đúng tên máy in nhãn nhiệt.</li>
                      <li><strong>Paper Size:</strong> Chọn đúng khổ giấy vừa tạo trong driver (vd: 80x50mm).</li>
                      <li><strong>Margins:</strong> Chọn <strong>None</strong> (Không có) để nội dung thẻ in tràn viền chuẩn.</li>
                      <li><strong>Headers and footers:</strong> Bỏ chọn (Uncheck) mục "Đầu trang và chân trang" để không bị dính link URL và ngày tháng.</li>
                      <li><strong>Background graphics:</strong> Tích chọn (Check) để hiển thị nền màu của phân nhóm đại biểu (VIP/Báo cáo viên).</li>
                    </ul>
                  </div>

                  {/* Step 4: Kiosk mode setup */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 md:col-span-2">
                    <h4 className="font-extrabold text-xs text-indigo-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">3</span>
                      Cấu hình In Tự Động Instant-Print (Kiosk Mode - Bỏ qua hộp thoại)
                    </h4>
                    <div className="text-[10.5px] text-slate-650 space-y-2.5 leading-relaxed">
                      <p>
                        Để hệ thống in tự động nhảy ra giấy in ngay lập tức khi check-in mà không cần người dùng click nút "Print" trên hộp thoại trình duyệt (in ngầm cực nhanh tại sảnh đón), hãy thực hiện:
                      </p>
                      <div className="space-y-1.5 pl-4 list-decimal">
                        <div>1. Tắt toàn bộ các cửa sổ Chrome hoặc Edge đang chạy trên máy tính tiếp tiếp nhận.</div>
                        <div>2. Nhấp chuột phải vào biểu tượng shortcut <strong>Google Chrome</strong> ngoài màn hình desktop &gt; chọn <strong>Properties</strong>.</div>
                        <div>
                          3. Tại thẻ <strong>Shortcut</strong>, tìm dòng <strong>Target</strong>. Di chuyển con trỏ xuống cuối chuỗi dẫn, cách ra một khoảng trắng và dán vào tham số:
                          <code className="bg-slate-900 text-indigo-400 font-mono text-[10px] px-1.5 py-0.5 rounded ml-1 font-bold">--kiosk-printing</code>
                        </div>
                        <div className="text-[9.5px] text-slate-500 italic">
                          Ví dụ dòng Target sau chỉnh sửa: <code className="bg-slate-900 text-slate-300 font-mono text-[9px] px-1 rounded">"C:\...\chrome.exe" --kiosk-printing</code>
                        </div>
                        <div>4. Nhấn <strong>Apply</strong> &gt; <strong>OK</strong> rồi khởi chạy lại Chrome bằng shortcut đó.</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[10px] font-bold">
                        ⚠️ LƯU Ý QUAN TRỌNG: Cấu hình máy in được lưu riêng biệt trên từng thiết bị sảnh (localStorage). Do đó máy tiếp đón nào cần in trực tiếp thì phải bật cấu hình máy in và chỉnh Chrome trên máy đó.
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ================= SECTION 7: SEPAY PAYMENT VERIFICATION ================= */}
          {activeSubTab === 'sepay' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    💳 SePay — Xác Nhận Chuyển Khoản Tự Động
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Kết nối SePay để tự động xác nhận thanh toán ngay khi đại biểu chuyển khoản thành công.
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  sepayConfig.isEnabled && sepayConfig.apiToken
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {sepayConfig.isEnabled && sepayConfig.apiToken ? '● Đã kích hoạt' : '○ Chưa bật'}
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[10.5px] text-blue-800 space-y-1.5">
                <p className="font-black text-[11px]">🔗 Cách thức hoạt động:</p>
                <p>1. Đại biểu chuyển khoản với <strong>nội dung CK</strong> đã được tạo sẵn (chứa họ tên + SĐT)</p>
                <p>2. SePay nhận biến động số dư từ ngân hàng → gửi webhook về hệ thống</p>
                <p>3. Hệ thống khớp nội dung CK + số tiền → tự động cập nhật trạng thái <strong>ĐÃ THANH TOÁN ✅</strong></p>
                <p>4. Đại biểu cũng có thể nhấn nút <strong>"Kiểm tra thanh toán"</strong> trên trang xác nhận để xác minh ngay</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  store.saveSepayConfig(sepayConfig);
                  alert('Đã lưu cấu hình SePay thành công!');
                }}
                className="space-y-5"
              >
                {/* Enable toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Bật tích hợp SePay</span>
                    <span className="text-[10px] text-slate-450 block mt-0.5">
                      Cho phép hệ thống gọi SePay API để kiểm tra giao dịch
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSepayConfig({ ...sepayConfig, isEnabled: !sepayConfig.isEnabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                      sepayConfig.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      sepayConfig.isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* API Token */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-600 block">
                      API Token <span className="text-rose-500">*</span>
                      <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="ml-2 text-indigo-500 hover:underline font-normal">
                        Lấy tại my.sepay.vn ↗
                      </a>
                    </label>
                    <input
                      type="password"
                      value={sepayConfig.apiToken}
                      onChange={(e) => setSepayConfig({ ...sepayConfig, apiToken: e.target.value })}
                      placeholder="Ví dụ: eyJhbGciOiJIUzI1Ni..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-800"
                    />
                    <p className="text-[9.5px] text-slate-400">Company Settings → API Access → Create Token</p>
                  </div>

                  {/* Bank Code */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Ngân hàng <span className="text-rose-500">*</span></label>
                    <select
                      value={sepayConfig.bankCode}
                      onChange={(e) => setSepayConfig({ ...sepayConfig, bankCode: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                    >
                      <option value="VCB">Vietcombank (VCB)</option>
                      <option value="TCB">Techcombank (TCB)</option>
                      <option value="MB">MB Bank</option>
                      <option value="ACB">ACB Bank</option>
                      <option value="VPB">VPBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="CTG">Vietinbank (CTG)</option>
                      <option value="TPB">TPBank</option>
                      <option value="MSB">MSB</option>
                      <option value="VIB">VIB</option>
                      <option value="HDB">HDBank</option>
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Số tài khoản <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={sepayConfig.bankAccountNo}
                      onChange={(e) => setSepayConfig({ ...sepayConfig, bankAccountNo: e.target.value, accountNumber: e.target.value })}
                      placeholder="Ví dụ: 0331000516283"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-600 block">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      value={sepayConfig.accountName}
                      onChange={(e) => setSepayConfig({ ...sepayConfig, accountName: e.target.value })}
                      placeholder="Ví dụ: HOI PHAU THUAT TAO HINH THAM MY VIET NAM"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                    />
                  </div>

                  {/* Webhook Secret */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-600 block">Webhook Secret (Apikey)</label>
                    <input
                      type="text"
                      value={sepayConfig.webhookSecret || ''}
                      onChange={(e) => setSepayConfig({ ...sepayConfig, webhookSecret: e.target.value })}
                      placeholder="Apikey bạn đặt trong SePay → Tích hợp → Webhooks"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Webhook URL helper */}
                {businessConfig.appUrl && (
                  <div className="bg-slate-900 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">📡 Webhook URL — Dán vào SePay → Tích hợp → Webhooks</p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 text-emerald-400 font-mono text-[10px] bg-slate-950 px-3 py-2 rounded-lg overflow-x-auto">
                        {businessConfig.appUrl.replace(/\/$/, '')}/api/sepay-webhook
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${businessConfig.appUrl?.replace(/\/$/, '')}/api/sepay-webhook`);
                          alert('Đã copy URL!');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg border-none cursor-pointer whitespace-nowrap"
                      >
                        Copy URL
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500">Chọn loại Webhook: <strong className="text-slate-300">Biến động số dư</strong> | Tài khoản: <strong className="text-slate-300">{sepayConfig.bankCode} {sepayConfig.bankAccountNo}</strong></p>
                  </div>
                )}
                {!businessConfig.appUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 font-bold">
                    ⚠️ Cần cấu hình <strong>URL Domain Production</strong> trong tab <strong>Cấu hình Nghiệp vụ</strong> để hiển thị Webhook URL chính xác.
                  </div>
                )}

                {/* Test connection */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSepayTesting || !sepayConfig.apiToken}
                    onClick={async () => {
                      setIsSepayTesting(true);
                      setSepayTestResult(null);
                      try {
                        const url = `/api/sepay-check?test=true&apiToken=${encodeURIComponent(sepayConfig.apiToken)}`;
                        const res = await fetch(url, {
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSepayTestResult({ success: true, message: `✅ Kết nối thành công! Tìm thấy ${data?.count ?? 0} giao dịch gần nhất.` });
                        } else {
                          const errData = await res.json().catch(() => ({ error: '' }));
                          setSepayTestResult({ success: false, message: `❌ SePay trả về lỗi ${res.status}: ${errData.error || 'Kiểm tra lại API Token.'}` });
                        }
                      } catch (err: any) {
                        setSepayTestResult({ success: false, message: `❌ Lỗi kết nối: ${err.message}` });
                      } finally {
                        setIsSepayTesting(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSepayTesting ? '⏳ Đang kiểm tra...' : '🔌 Test Kết Nối SePay'}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-all"
                  >
                    💾 Lưu Cấu Hình SePay
                  </button>
                </div>

                {sepayTestResult && (
                  <div className={`p-3 rounded-xl border text-[11px] font-bold ${
                    sepayTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {sepayTestResult.message}
                  </div>
                )}
              </form>

              {/* Integration guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-[10.5px] text-slate-700">
                <p className="font-black text-[11px] text-slate-900">📋 Hướng dẫn cấu hình SePay đầy đủ:</p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>Đăng ký/đăng nhập tại <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-indigo-600 underline">my.sepay.vn</a></li>
                  <li>Vào <strong>Tài khoản ngân hàng</strong> → Liên kết tài khoản {sepayConfig.bankCode} {sepayConfig.bankAccountNo || 'của bạn'}</li>
                  <li>Vào <strong>Company Settings → API Access</strong> → Tạo API Token → Dán vào ô trên</li>
                  <li>Vào <strong>Tích hợp → Webhooks</strong> → Thêm URL webhook → Chọn loại <em>Biến động số dư</em></li>
                  <li>Đặt <strong>Apikey</strong> trong webhook config → Dán vào ô <em>Webhook Secret</em> trên</li>
                  <li>Lưu cấu hình → Deploy ứng dụng → Test bằng tính năng <em>Gửi thử</em> trên SePay</li>
                </ol>
              </div>
            </div>
          )}

          {/* ================= SECTION 9: ONESIGNAL PUSH NOTIFICATIONS ================= */}
          {activeSubTab === 'onesignal' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-800">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    🔔 OneSignal Push Notifications
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Tích hợp OneSignal để tự động đẩy thông báo OS-level trực tiếp lên màn hình điện thoại/máy tính của quản trị viên ngay cả khi trình duyệt đã đóng.
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  onesignalConfig.isEnabled && onesignalConfig.appId ? 'bg-emerald-50 text-emerald-750 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {onesignalConfig.isEnabled && onesignalConfig.appId ? '● Đã kích hoạt' : '○ Chưa bật'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-800 uppercase block">Hướng dẫn cài đặt:</span>
                <ul className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Truy cập trang chủ <a href="https://onesignal.com" target="_blank" rel="noreferrer" className="text-indigo-605 hover:underline font-bold">onesignal.com ↗</a> và tạo ứng dụng mới.</li>
                  <li>Điền <strong>App ID</strong> và <strong>REST API Key</strong> vào các ô tương ứng bên dưới.</li>
                  <li>Bật tính năng và bấm lưu cấu hình. Quản trị viên truy cập trang web sẽ thấy chuông đăng ký ở góc phải màn hình để nhận tin.</li>
                </ul>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await store.saveOneSignalConfig(onesignalConfig);
                alert('Đã lưu cấu hình OneSignal thành công!');
              }} className="space-y-4">
                
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Bật tích hợp OneSignal Push</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Kích hoạt gửi thông báo qua OneSignal khi có đại biểu, báo cáo viên hoặc nhà tài trợ mới.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnesignalConfig({ ...onesignalConfig, isEnabled: !onesignalConfig.isEnabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      onesignalConfig.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        onesignalConfig.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">OneSignal App ID *</label>
                    <input
                      type="text"
                      required={onesignalConfig.isEnabled}
                      value={onesignalConfig.appId}
                      onChange={(e) => setOnesignalConfig({ ...onesignalConfig, appId: e.target.value })}
                      placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">OneSignal REST API Key *</label>
                    <input
                      type="password"
                      required={onesignalConfig.isEnabled}
                      value={onesignalConfig.restApiKey}
                      onChange={(e) => setOnesignalConfig({ ...onesignalConfig, restApiKey: e.target.value })}
                      placeholder="e.g. N2MwYjFmN2It..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Safari Web ID (Tùy chọn cho trình duyệt Safari)</label>
                  <input
                    type="text"
                    value={onesignalConfig.safariWebId || ''}
                    onChange={(e) => setOnesignalConfig({ ...onesignalConfig, safariWebId: e.target.value })}
                    placeholder="e.g. web.onesignal.auto.123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <button
                    type="button"
                    disabled={isOnesignalTesting}
                    onClick={handleTestOneSignal}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer text-xs transition-all shadow-sm w-full sm:w-auto text-center"
                  >
                    {isOnesignalTesting ? '⏳ Đang truyền thử...' : '🔌 Bắn thử Push Notification'}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs transition-all shadow w-full sm:w-auto text-center"
                  >
                    💾 Lưu cấu hình OneSignal
                  </button>
                </div>

                {onesignalTestResult && (
                  <div className={`p-3 rounded-xl border text-xs leading-normal ${
                    onesignalTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-rose-50 text-rose-800 border-rose-250'
                  }`}>
                    {onesignalTestResult.message}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ================= SECTION 8: PUBLIC FORM CONFIGURATION ================= */}
          {activeSubTab === 'forms' && (() => {
            // Helper: get current form config by active section
            const getFormCfg = () => {
              if (formActiveSection === 'delegate') return businessConfig.delegateFormConfig || {};
              if (formActiveSection === 'speaker') return businessConfig.speakerFormConfig || {};
              return businessConfig.sponsorFormConfig || {};
            };
            const setFormCfg = (patch: Record<string, any>) => {
              const key = formActiveSection === 'delegate' ? 'delegateFormConfig'
                : formActiveSection === 'speaker' ? 'speakerFormConfig'
                : 'sponsorFormConfig';
              setBusinessConfig({
                ...businessConfig,
                [key]: { ...(businessConfig[key as keyof typeof businessConfig] as object || {}), ...patch },
              });
            };
            const cfg = getFormCfg();
            const formLabels = {
              delegate: { icon: '🎫', label: 'Đại Biểu', color: 'teal' },
              speaker: { icon: '🎤', label: 'Báo Cáo Viên', color: 'indigo' },
              sponsor: { icon: '🏆', label: 'Nhà Tài Trợ', color: 'amber' },
            };
            return (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    📋 Cấu Hình Trang Form Public
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Tùy chỉnh nội dung, màu sắc và trạng thái mở/đóng của từng cổng đăng ký công khai.
                  </p>
                </div>

                {/* Sub-tab selector */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  {(['delegate', 'speaker', 'sponsor'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setFormActiveSection(sec)}
                      className={`flex-1 py-2 text-[11px] font-black rounded-lg border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        formActiveSection === sec
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'bg-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span>{formLabels[sec].icon}</span>
                      <span>{formLabels[sec].label}</span>
                    </button>
                  ))}
                </div>

                {/* Form config editor */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    store.saveBusinessConfig(businessConfig);
                    alert(`Đã lưu cấu hình form ${formLabels[formActiveSection].label} thành công!`);
                  }}
                  className="space-y-5"
                >
                  {/* Open/Closed toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        {formLabels[formActiveSection].icon} Form {formLabels[formActiveSection].label}
                      </span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">
                        Bật = đại biểu có thể truy cập và gửi đăng ký. Tắt = hiển thị thông báo đóng.
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        (cfg as any).isOpen !== false
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                        {(cfg as any).isOpen !== false ? '● Đang mở' : '○ Đã đóng'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormCfg({ isOpen: !(cfg as any).isOpen })}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                          (cfg as any).isOpen !== false ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          (cfg as any).isOpen !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Hide Header toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        Ẩn Header của Form
                      </span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">
                        Bật = Ẩn phần header màu phía trên cùng của form public (thích hợp khi nhúng iframe).
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        (cfg as any).hideHeader
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {(cfg as any).hideHeader ? '● Đã ẩn' : '○ Đang hiển thị'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormCfg({ hideHeader: !(cfg as any).hideHeader })}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                          (cfg as any).hideHeader ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          (cfg as any).hideHeader ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Closed message */}
                  {(cfg as any).isOpen === false && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Thông báo khi form đóng</label>
                      <textarea
                        value={(cfg as any).closedMessage || ''}
                        onChange={(e) => setFormCfg({ closedMessage: e.target.value })}
                        rows={2}
                        placeholder="Ví dụ: Cổng đăng ký đã đóng. Vui lòng liên hệ Ban tổ chức..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 resize-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {/* Organizer label */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Tên ban tổ chức (hiển thị trên header)</label>
                      <input
                        type="text"
                        value={(cfg as any).organizerLabel || ''}
                        onChange={(e) => setFormCfg({ organizerLabel: e.target.value })}
                        placeholder="HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-800 uppercase"
                      />
                    </div>

                    {/* Form title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Tiêu đề chính của form (H1)</label>
                      <input
                        type="text"
                        value={(cfg as any).formTitle || ''}
                        onChange={(e) => setFormCfg({ formTitle: e.target.value })}
                        placeholder="ĐĂNG KÝ ĐẠI BIỂU THAM DỰ HỘI NGHỊ..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-800"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Mô tả ngắn bên dưới tiêu đề</label>
                      <textarea
                        value={(cfg as any).formDescription || ''}
                        onChange={(e) => setFormCfg({ formDescription: e.target.value })}
                        rows={2}
                        placeholder="Cổng đăng ký điện tử dành cho..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 resize-none"
                      />
                    </div>

                    {/* Colors row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-600 block">Màu nền header</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={(cfg as any).headerBgColor || '#042f2e'}
                            onChange={(e) => setFormCfg({ headerBgColor: e.target.value })}
                            className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={(cfg as any).headerBgColor || '#042f2e'}
                            onChange={(e) => setFormCfg({ headerBgColor: e.target.value })}
                            className="flex-1 px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-mono text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-600 block">Màu accent (badge, text)</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={(cfg as any).accentColor || '#fbbf24'}
                            onChange={(e) => setFormCfg({ accentColor: e.target.value })}
                            className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={(cfg as any).accentColor || '#fbbf24'}
                            onChange={(e) => setFormCfg({ accentColor: e.target.value })}
                            className="flex-1 px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-mono text-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview header */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block uppercase tracking-wider">Preview Header</label>
                      <div
                        className="rounded-xl p-4 relative overflow-hidden"
                        style={{ backgroundColor: (cfg as any).headerBgColor || '#042f2e' }}
                      >
                        <span
                          className="text-[9px] font-black tracking-widest uppercase block font-mono"
                          style={{ color: (cfg as any).accentColor || '#fbbf24' }}
                        >
                          {(cfg as any).organizerLabel || 'TÊN BAN TỔ CHỨC'}
                        </span>
                        <p className="text-white font-black text-sm mt-1 leading-tight">
                          {(cfg as any).formTitle || 'TIÊU ĐỀ FORM'}
                        </p>
                        <p className="text-white/60 text-[10px] mt-1">
                          {(cfg as any).formDescription || 'Mô tả ngắn...'}
                        </p>
                      </div>
                    </div>

                    {/* Banner image */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Ảnh Banner / Logo trên Header (URL)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={(cfg as any).bannerImageUrl || ''}
                          onChange={(e) => setFormCfg({ bannerImageUrl: e.target.value })}
                          placeholder="https://example.com/banner.png hoặc data:image/..."
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800"
                        />
                        <label className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap">
                          Tải lên
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setFormCfg({ bannerImageUrl: reader.result as string });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {(cfg as any).bannerImageUrl && (
                          <button type="button" onClick={() => setFormCfg({ bannerImageUrl: '' })}
                            className="px-2 py-2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl border-none cursor-pointer hover:bg-rose-100">
                            Xóa
                          </button>
                        )}
                      </div>
                      {(cfg as any).bannerImageUrl && (
                        <img src={(cfg as any).bannerImageUrl} alt="Banner preview"
                          className="h-14 object-contain rounded-lg border border-slate-200 mt-1" />
                      )}
                    </div>

                    {/* Footer note */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Ghi chú footer (hiển thị cuối form)</label>
                      <textarea
                        value={(cfg as any).footerNote || ''}
                        onChange={(e) => setFormCfg({ footerNote: e.target.value })}
                        rows={2}
                        placeholder="Ví dụ: Mọi thắc mắc vui lòng liên hệ email: btc@pars2026.com | Hotline: 0901 234 567"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 resize-none"
                      />
                    </div>

                    {/* Max entries */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">
                        Giới hạn số lượng đăng ký riêng
                        <span className="font-normal text-slate-400 ml-2">(0 = không giới hạn)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={(cfg as any).maxEntries ?? 0}
                        onChange={(e) => setFormCfg({ maxEntries: parseInt(e.target.value) || 0 })}
                        className="w-40 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-800"
                      />
                    </div>

                    {/* Language configuration */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-600 block">Chế độ ngôn ngữ hiển thị form</label>
                      <select
                        value={(cfg as any).language || 'both'}
                        onChange={(e) => setFormCfg({ language: e.target.value as any })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-800"
                      >
                        <option value="vi">Chỉ Tiếng Việt (Vietnamese Only)</option>
                        <option value="en">Chỉ Tiếng Anh (English Only)</option>
                        <option value="both">Song ngữ Việt - Anh (Bilingual VI/EN)</option>
                      </select>
                    </div>

                    {/* Section Labels configuration */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        ✍️ Tùy Chỉnh Tên Các Section (Tiêu Đề Phân Đoạn)
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Chỉnh sửa tiêu đề hiển thị cho từng phần trong form công khai ở cả 2 ngôn ngữ (Việt & Anh).
                      </p>

                      <div className="space-y-4 pt-2 border-t border-slate-200">
                        {(() => {
                          const currentSectionLabels = (cfg as any).sectionLabels || {};
                          
                          // Define sections based on form type
                          const sections: { key: string; labelVi: string; labelEn: string; placeholderVi: string; placeholderEn: string }[] = [];
                          if (formActiveSection === 'delegate') {
                            sections.push(
                              { key: 'personalInfo', labelVi: 'Phần 1: Thông tin đại biểu', labelEn: 'Section 1: Delegate Info', placeholderVi: 'THÔNG TIN ĐẠI BIỂU ĐĂNG KÝ', placeholderEn: 'DELEGATE PERSONAL INFORMATION' },
                              { key: 'package', labelVi: 'Phần 2: Chọn gói đăng ký', labelEn: 'Section 2: Package Select', placeholderVi: 'CHỌN GÓI ĐĂNG KÝ HỘI NGHỊ', placeholderEn: 'CONFERENCE REGISTRATION PACKAGE' },
                              { key: 'scheduleAddOns', labelVi: 'Phần 3: Dịch vụ phụ trợ tự chọn', labelEn: 'Section 3: Optional Add-on Services', placeholderVi: 'DỊCH VỤ PHỤ TRỢ TỰ CHỌN', placeholderEn: 'OPTIONAL ADD-ON SERVICES' },
                              { key: 'payment', labelVi: 'Phần 4: Thanh toán chuyển khoản', labelEn: 'Section 4: Payment Details', placeholderVi: 'THÔNG TIN THANH TOÁN CHUYỂN KHOẢN', placeholderEn: 'BANK TRANSFER PAYMENT DETAILS' }
                            );
                          } else if (formActiveSection === 'speaker') {
                            sections.push(
                              { key: 'speakerInfo', labelVi: 'Phần 1: Thông tin báo cáo viên', labelEn: 'Section 1: Speaker Info', placeholderVi: 'THÔNG TIN BÁO CÁO VIÊN', placeholderEn: 'SPEAKER INFORMATION' },
                              { key: 'abstractInfo', labelVi: 'Phần 2: Nội dung đề tài', labelEn: 'Section 2: Abstract Details', placeholderVi: 'NỘI DUNG ĐỀ TÀI ĐĂNG KÝ ĐỀ TRÌNH', placeholderEn: 'ABSTRACT & PRESENTATION DETAILS' }
                            );
                          } else if (formActiveSection === 'sponsor') {
                            sections.push(
                              { key: 'sponsorProfile', labelVi: 'Phần 1: Thông tin doanh nghiệp', labelEn: 'Section 1: Company Profile', placeholderVi: 'THÔNG TIN DOANH NGHIỆP TÀI TRỢ', placeholderEn: 'SPONSOR / COMPANY PROFILE' },
                              { key: 'tierSelect', labelVi: 'Phần 2: Gói tài trợ', labelEn: 'Section 2: Sponsorship Package', placeholderVi: 'CHỌN GÓI TÀI TRỢ', placeholderEn: 'SPONSORSHIP PACKAGE SELECTION' }
                            );
                          }

                          return sections.map((sec) => {
                            const valVi = currentSectionLabels[sec.key]?.vi || '';
                            const valEn = currentSectionLabels[sec.key]?.en || '';

                            return (
                              <div key={sec.key} className="space-y-2 pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                <span className="text-[10px] font-extrabold text-violet-750 block uppercase font-mono">
                                  {sec.labelVi} / {sec.labelEn}
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-[9.5px] text-slate-450 font-bold block">Tên Tiếng Việt</span>
                                    <input
                                      type="text"
                                      value={valVi}
                                      placeholder={sec.placeholderVi}
                                      onChange={(e) => {
                                        const newLabels = { ...currentSectionLabels };
                                        newLabels[sec.key] = {
                                          vi: e.target.value,
                                          en: newLabels[sec.key]?.en || sec.placeholderEn
                                        };
                                        setFormCfg({ sectionLabels: newLabels });
                                      }}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9.5px] text-slate-450 font-bold block">Tên Tiếng Anh</span>
                                    <input
                                      type="text"
                                      value={valEn}
                                      placeholder={sec.placeholderEn}
                                      onChange={(e) => {
                                        const newLabels = { ...currentSectionLabels };
                                        newLabels[sec.key] = {
                                          vi: newLabels[sec.key]?.vi || sec.placeholderVi,
                                          en: e.target.value
                                        };
                                        setFormCfg({ sectionLabels: newLabels });
                                      }}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Field Labels configuration */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        ✍️ Tùy Chỉnh Các Nhãn Trường Nhập Liệu (Labels)
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Chỉnh sửa nhãn (label) hiển thị của các trường thông tin trong form công khai ở cả 2 ngôn ngữ.
                      </p>

                      <div className="space-y-4 pt-2 border-t border-slate-200">
                        {(() => {
                          const currentFieldLabels = (cfg as any).fieldLabels || {};
                          
                          // Define fields based on form type
                          const fields: { key: string; labelVi: string; labelEn: string; placeholderVi: string; placeholderEn: string }[] = [];
                          if (formActiveSection === 'delegate') {
                            fields.push(
                              { key: 'nationality', labelVi: 'Chọn ngôn ngữ / Quốc tịch', labelEn: 'Select Language / Nationality', placeholderVi: 'Chọn ngôn ngữ *', placeholderEn: 'Select Language *' },
                              { key: 'avatar', labelVi: 'Ảnh Chân Dung / Avatar', labelEn: 'Portrait / Avatar', placeholderVi: 'Ảnh Chân Dung / Avatar *', placeholderEn: ' scientific Portrait *' },
                              { key: 'academicTitle', labelVi: 'Học hàm / Học vị', labelEn: 'Academic Title', placeholderVi: 'Học hàm / Học vị *', placeholderEn: 'Academic Title *' },
                              { key: 'fullName', labelVi: 'Họ và Tên', labelEn: 'Full Name', placeholderVi: 'Họ và Tên (In hoa có dấu) *', placeholderEn: 'Full Name (Capitalized) *' },
                              { key: 'yearOfBirth', labelVi: 'Năm sinh', labelEn: 'Year of Birth', placeholderVi: 'Năm sinh *', placeholderEn: 'Year of Birth *' },
                              { key: 'phone', labelVi: 'Số điện thoại di động', labelEn: 'Contact Phone Number', placeholderVi: 'Số điện thoại di động *', placeholderEn: 'Contact Phone Number *' },
                              { key: 'email', labelVi: 'Địa chỉ Email nhận vé & CME', labelEn: 'Email for Ticket & CME', placeholderVi: 'Địa chỉ Email nhận vé & CME *', placeholderEn: 'Email for Ticket & CME *' },
                              { key: 'workplace', labelVi: 'Đơn vị công tác', labelEn: 'Workplace', placeholderVi: 'Đơn vị công tác (Bệnh viện/Khoa Y/Viện thẩm mỹ) *', placeholderEn: 'Workplace (Hospital/Medical School/Clinic) *' },
                              { key: 'address', labelVi: 'Địa chỉ liên hệ', labelEn: 'Contact Address', placeholderVi: 'Địa chỉ liên hệ *', placeholderEn: 'Contact Address *' },
                              { key: 'notes', labelVi: 'Ghi chú cho BTC', labelEn: 'Notes for Organizer', placeholderVi: 'Ghi chú yêu cầu đặc biệt khác cho BTC', placeholderEn: 'Special notes or request for Organizer' }
                            );
                          } else if (formActiveSection === 'speaker') {
                            fields.push(
                              { key: 'avatar', labelVi: 'Ảnh Chân Dung', labelEn: 'Portrait Image', placeholderVi: 'Ảnh Chân Dung / Chân Dung Khoa Học *', placeholderEn: 'Scientific Portrait / Avatar *' },
                              { key: 'academicTitle', labelVi: 'Học hàm / Học vị', labelEn: 'Academic Title', placeholderVi: 'Học hàm / Học vị *', placeholderEn: 'Academic Title *' },
                              { key: 'fullName', labelVi: 'Họ và Tên', labelEn: 'Full Name', placeholderVi: 'Họ và Tên *', placeholderEn: 'Full Name *' },
                              { key: 'institution', labelVi: 'Đơn vị công tác chính', labelEn: 'Primary Institution', placeholderVi: 'Đơn vị công tác chính *', placeholderEn: 'Primary Institution *' },
                              { key: 'department', labelVi: 'Khoa / Phòng ban', labelEn: 'Department / Specialty', placeholderVi: 'Khoa / Phòng ban / Bộ môn *', placeholderEn: 'Department / Specialty *' },
                              { key: 'phone', labelVi: 'Số điện thoại', labelEn: 'Phone Number', placeholderVi: 'Số điện thoại *', placeholderEn: 'Phone Number *' },
                              { key: 'email', labelVi: 'Email liên hệ trao đổi học thuật', labelEn: 'Academic Contact Email', placeholderVi: 'Email liên hệ trao đổi học thuật *', placeholderEn: 'Academic Contact Email *' },
                              { key: 'bio', labelVi: 'Tiểu sử khoa học tóm tắt (Bio)', labelEn: 'Short Scientific Bio', placeholderVi: 'Tiểu sử khoa học tóm tắt (Bio) - Khoảng 100 từ', placeholderEn: 'Short Scientific Bio - Around 100 words' },
                              { key: 'presentationTitle', labelVi: 'Tên đề tài báo cáo khoa học', labelEn: 'Presentation Title', placeholderVi: 'Tên đề tài bài báo cáo khoa học *', placeholderEn: 'Presentation Title *' },
                              { key: 'category', labelVi: 'Chuyên đề', labelEn: 'Scientific Topic', placeholderVi: 'Chuyên đề *', placeholderEn: 'Scientific Topic / Track *' },
                              { key: 'abstractText', labelVi: 'Tóm tắt nội dung báo cáo', labelEn: 'Abstract Text', placeholderVi: 'Tóm tắt nội dung báo cáo (Abstract) - Giới hạn 500 từ *', placeholderEn: 'Abstract text - Limit 500 words *' },
                              { key: 'uploadFile', labelVi: 'CV/Abstract/Full file', labelEn: 'CV/Abstract/Full file', placeholderVi: 'CV/Abstract/Full file', placeholderEn: 'CV/Abstract/Full file' }

                            );
                          } else if (formActiveSection === 'sponsor') {
                            fields.push(
                              { key: 'logo', labelVi: 'Logo Doanh Nghiệp', labelEn: 'Brand / Company Logo', placeholderVi: 'Logo Thương Hiệu / Doanh Nghiệp *', placeholderEn: 'Brand / Company Logo *' },
                              { key: 'companyName', labelVi: 'Tên Doanh nghiệp đăng ký', labelEn: 'Registered Company Name', placeholderVi: 'Tên Thương hiệu / Doanh nghiệp đăng ký *', placeholderEn: 'Brand / Registered Company Name *' },
                              { key: 'contactName', labelVi: 'Họ & Tên Người liên hệ', labelEn: 'Contact Person Name', placeholderVi: 'Họ & Tên Đại diện liên hệ *', placeholderEn: 'Contact Person Name *' },
                              { key: 'contactPhone', labelVi: 'Số điện thoại liên hệ', labelEn: 'Contact Phone Number', placeholderVi: 'Số điện thoại liên hệ *', placeholderEn: 'Contact Phone Number *' },
                              { key: 'contactEmail', labelVi: 'Email liên hệ nhận hợp đồng', labelEn: 'Email for Contracts', placeholderVi: 'Email nhận thư báo ký kết & tài liệu *', placeholderEn: 'Email for Contracts & Documents *' },
                              { key: 'notes', labelVi: 'Ghi chú của Doanh nghiệp', labelEn: 'Company notes', placeholderVi: 'Ghi chú hoặc yêu cầu đặc biệt của Doanh nghiệp', placeholderEn: 'Company requests or special notes' }
                            );
                          }

                          return fields.map((fld) => {
                            const valVi = currentFieldLabels[fld.key]?.vi || '';
                            const valEn = currentFieldLabels[fld.key]?.en || '';

                            return (
                              <div key={fld.key} className="space-y-2 pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                <span className="text-[10px] font-extrabold text-violet-755 block uppercase font-mono">
                                  {fld.labelVi} / {fld.labelEn}
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-[9.5px] text-slate-455 font-bold block">Tên Tiếng Việt</span>
                                    <input
                                      type="text"
                                      value={valVi}
                                      placeholder={fld.placeholderVi}
                                      onChange={(e) => {
                                        const newLabels = { ...currentFieldLabels };
                                        newLabels[fld.key] = {
                                          vi: e.target.value,
                                          en: newLabels[fld.key]?.en || fld.placeholderEn
                                        };
                                        setFormCfg({ fieldLabels: newLabels });
                                      }}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9.5px] text-slate-455 font-bold block">Tên Tiếng Anh</span>
                                    <input
                                      type="text"
                                      value={valEn}
                                      placeholder={fld.placeholderEn}
                                      onChange={(e) => {
                                        const newLabels = { ...currentFieldLabels };
                                        newLabels[fld.key] = {
                                          vi: newLabels[fld.key]?.vi || fld.placeholderVi,
                                          en: e.target.value
                                        };
                                        setFormCfg({ fieldLabels: newLabels });
                                      }}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white text-xs font-black rounded-xl border-none cursor-pointer transition-all"
                    >
                      💾 Lưu cấu hình form {formLabels[formActiveSection].label}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const appUrl = businessConfig.appUrl?.replace(/\/$/, '') || window.location.origin;
                        const viewMap = { delegate: 'register-delegate', speaker: 'register-speaker', sponsor: 'register-sponsor' };
                        window.open(`${appUrl}?view=${viewMap[formActiveSection]}`, '_blank');
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-none cursor-pointer transition-all"
                    >
                      👁️ Xem thử form
                    </button>
                  </div>
                </form>

                {/* Quick links */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-[10.5px] text-violet-900 space-y-2">
                  <p className="font-black text-[11px]">📌 Link trực tiếp tới từng form public:</p>
                  {[
                    { key: 'register-delegate', label: '🎫 Đăng ký Đại biểu' },
                    { key: 'register-speaker', label: '🎤 Đăng ký Báo cáo viên' },
                    { key: 'register-sponsor', label: '🏆 Đăng ký Nhà tài trợ' },
                  ].map(({ key, label }) => {
                    const base = businessConfig.appUrl?.replace(/\/$/, '') || window.location.origin;
                    const url = `${base}?view=${key}`;
                    return (
                      <div key={key} className="flex gap-2 items-center">
                        <code className="flex-1 bg-white border border-violet-200 px-2 py-1 rounded-lg font-mono text-[10px] text-violet-700 overflow-x-auto">{url}</code>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(url); alert('Đã copy!'); }}
                          className="px-2.5 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg border-none cursor-pointer whitespace-nowrap">Copy</button>
                        <a href={url} target="_blank" rel="noreferrer"
                          className="px-2.5 py-1 bg-white border border-violet-300 text-violet-700 text-[10px] font-bold rounded-lg no-underline whitespace-nowrap">
                          {label}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ================= SECTION 9: CME CERTIFICATE LAYOUT CONFIGURATION ================= */}
          {activeSubTab === 'cme-layout' && (() => {
            const cmeConfig = businessConfig.cmeTemplateConfig || DEFAULT_CME_TEMPLATE_CONFIG;
            
            const setCmeConfig = (patch: Partial<CmeTemplateConfig>) => {
              setBusinessConfig({
                ...businessConfig,
                cmeTemplateConfig: {
                  ...DEFAULT_CME_TEMPLATE_CONFIG,
                  ...cmeConfig,
                  ...patch,
                },
              });
            };

            const handleSaveCmeSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              store.saveBusinessConfig(businessConfig);
              alert('Đã lưu cấu hình layout chứng chỉ CME thành công!');
            };

            return (
              <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      🎓 Thiết Kế Chứng Chỉ CME Điện Tử
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-0.5">
                      Tùy chỉnh nội dung chữ, chữ ký số, mộc đỏ và tông màu sắc của chứng chỉ CME phát hành cho đại biểu.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveCmeSubmit} className="space-y-6">
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Header Group */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        🏛️ Tiêu Đề Đơn Vị Ban Hành & Logo (Header)
                      </span>
                      
                      {/* Logo Upload row */}
                      <div className="space-y-1 pb-2 border-b border-slate-200">
                        <label className="text-[10.5px] font-bold text-slate-500 block">Logo hiển thị trên chứng chỉ</label>
                        <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl max-w-md">
                          <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            {cmeConfig.logoUrl ? (
                              <img src={cmeConfig.logoUrl} alt="Logo CME" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold select-none text-center leading-none">Chưa có Logo</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-[10px] font-bold rounded-lg cursor-pointer transition-all inline-block select-none">
                              Tải lên hình ảnh
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCmeConfig({ logoUrl: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {cmeConfig.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setCmeConfig({ logoUrl: '' })}
                                className="px-2 py-1 ml-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg border-none cursor-pointer"
                              >
                                Xóa Logo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Đơn vị ban hành (Tiếng Việt) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.awardBodyTitle}
                            onChange={(e) => setCmeConfig({ awardBodyTitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Đơn vị ban hành (Tiếng Anh) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.awardBodySubtitle}
                            onChange={(e) => setCmeConfig({ awardBodySubtitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Certificate Titles */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        📜 Tên Loại Chứng Chỉ
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Tiêu đề chứng chỉ (Tiếng Việt) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.certificateTitle}
                            onChange={(e) => setCmeConfig({ certificateTitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Tiêu đề chứng chỉ (Tiếng Anh) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.certificateSubtitle}
                            onChange={(e) => setCmeConfig({ certificateSubtitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Texts */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        ✍️ Nội Dung Trình Bày (Body)
                      </span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Lời dẫn chứng nhận *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.paragraphText}
                            onChange={(e) => setCmeConfig({ paragraphText: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Tên chương trình / khóa học khoa học *</label>
                          <textarea
                            required
                            value={cmeConfig.courseTitle}
                            onChange={(e) => setCmeConfig({ courseTitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-semibold font-sans"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Thời lượng / Số tiết đào tạo *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.durationText}
                            onChange={(e) => setCmeConfig({ durationText: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signer Info */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        ✒️ Người Ký & Ngày Tháng Ban Hành
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Địa điểm & Ngày tháng ký phát hành *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.locationDateText}
                            onChange={(e) => setCmeConfig({ locationDateText: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Chức vụ người ký *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.signerTitle}
                            onChange={(e) => setCmeConfig({ signerTitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-bold uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Họ và tên người ký *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.signerName}
                            onChange={(e) => setCmeConfig({ signerName: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-bold italic"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seal config */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        💮 Cấu Hợp Mộc Đỏ Số
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Mộc đỏ: Dòng 1 (Vòng ngoài) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.sealText1}
                            onChange={(e) => setCmeConfig({ sealText1: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Mộc đỏ: Dòng 2 (Trung tâm) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.sealText2}
                            onChange={(e) => setCmeConfig({ sealText2: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block">Mộc đỏ: Dòng 3 (Vòng dưới) *</label>
                          <input
                            type="text"
                            required
                            value={cmeConfig.sealText3}
                            onChange={(e) => setCmeConfig({ sealText3: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Colors & Layout styling */}
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2">
                      <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                        🎨 Màu Sắc & Thiết Kế Đường Viền
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 block" style={{ backgroundColor: cmeConfig.borderColor }} />
                            Màu đường viền & chữ tiêu đề chính *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={cmeConfig.borderColor}
                              onChange={(e) => setCmeConfig({ borderColor: e.target.value })}
                              className="w-9 h-8 border border-slate-200 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              required
                              value={cmeConfig.borderColor}
                              onChange={(e) => setCmeConfig({ borderColor: e.target.value })}
                              className="w-full px-3 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-slate-500 block flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 block" style={{ backgroundColor: cmeConfig.bgColor }} />
                            Màu nền chứng chỉ *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={cmeConfig.bgColor}
                              onChange={(e) => setCmeConfig({ bgColor: e.target.value })}
                              className="w-9 h-8 border border-slate-200 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              required
                              value={cmeConfig.bgColor}
                              onChange={(e) => setCmeConfig({ bgColor: e.target.value })}
                              className="w-full px-3 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-black rounded-xl cursor-pointer transition-all border-none shadow-sm flex items-center gap-1.5"
                    >
                      💾 Lưu Cấu Hình Layout Chứng Chỉ
                    </button>
                  </div>
                </form>

                {/* Preview layout box */}
                <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                    👁️ Bản Xem Trước Thu Nhỏ (Mini Preview)
                  </span>
                  <div className="p-4 bg-slate-200 rounded-xl flex justify-center overflow-x-auto">
                    <div 
                      className="p-4 shadow relative flex flex-col justify-between select-none rounded border-inset shrink-0"
                      style={{ 
                        width: '550px', 
                        height: '387px', 
                        fontFamily: 'Georgia, serif', 
                        backgroundColor: cmeConfig.bgColor || '#fdfbf7', 
                        border: `8px double ${cmeConfig.borderColor || '#b45309'}`,
                        transform: 'scale(1)',
                        transformOrigin: 'top center'
                      }}
                    >
                      <div 
                        className="absolute inset-1 border pointer-events-none" 
                        style={{ borderColor: `${cmeConfig.borderColor || '#b45309'}30` }}
                      />
                      
                      {/* Header */}
                      <div className="text-center flex flex-col items-center">
                        {cmeConfig.logoUrl && (
                          <img 
                            src={cmeConfig.logoUrl} 
                            alt="CME Logo Preview" 
                            className="h-5 object-contain mb-0.5" 
                          />
                        )}
                        <h5 className="text-[6.5px] font-sans font-extrabold uppercase text-slate-700 leading-none">{cmeConfig.awardBodyTitle}</h5>
                        <h6 className="text-[5.5px] font-sans font-bold uppercase text-slate-500 mt-0.5 leading-none">{cmeConfig.awardBodySubtitle}</h6>
                        <div className="w-12 h-0.5 mx-auto my-1" style={{ backgroundColor: cmeConfig.borderColor || '#b45309' }} />
                      </div>

                      {/* Title */}
                      <div className="text-center mt-0.5">
                        <h1 className="text-[13px] font-bold uppercase leading-none" style={{ color: cmeConfig.borderColor || '#b45309' }}>{cmeConfig.certificateTitle}</h1>
                        <p className="text-[6px] italic text-slate-650 font-sans mt-0.5 leading-none">{cmeConfig.certificateSubtitle}</p>
                      </div>

                      {/* Recipient */}
                      <div className="text-center mt-1">
                        <p className="text-[6.5px] text-slate-600 font-sans leading-none">{cmeConfig.paragraphText}</p>
                        <h2 className="text-[11px] font-black uppercase tracking-tight my-1 text-red-900 leading-none font-sans">
                          BS. NGUYỄN VĂN A
                        </h2>
                        <div className="text-[6px] text-slate-500 font-sans leading-none">
                          Năm sinh: 1985 | Quốc tịch: Việt Nam | Đơn vị: Bệnh viện Đa khoa Quốc tế
                        </div>
                      </div>

                      {/* Course */}
                      <div className="text-center mt-1 px-4">
                        <p className="text-[6px] text-slate-600 font-sans leading-none">Đã hoàn thành xuất sắc chương trình đào tạo khoa học tại:</p>
                        <p className="text-[7px] font-bold uppercase my-0.5 leading-tight font-sans" style={{ color: cmeConfig.borderColor || '#b45309' }}>
                          "{cmeConfig.courseTitle}"
                        </p>
                        <p className="text-[6px] italic text-slate-500 font-sans leading-none">{cmeConfig.durationText}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-left font-sans flex items-center gap-1">
                          <div className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center font-mono text-[3px] text-slate-450">QR CODE</div>
                          <div>
                            <span className="text-[4px] text-slate-450 block italic leading-none">Mã xác minh</span>
                            <span className="text-[5px] font-mono font-bold text-slate-600 block leading-none">01-CME</span>
                          </div>
                        </div>

                        <div className="relative text-center font-sans pr-2">
                          <span className="text-[5px] text-slate-500 block italic leading-none">{cmeConfig.locationDateText}</span>
                          <p className="text-[5.5px] font-bold text-slate-800 uppercase block tracking-wider mt-0.5 leading-none">{cmeConfig.signerTitle}</p>
                          
                          <div className="absolute top-0 left-1 w-8 h-8 border border-red-500 opacity-80 rounded-full flex flex-col items-center justify-center text-[3.5px] font-black text-red-600 border-dashed transform rotate-12 uppercase leading-none">
                            <span className="text-[2.5px] tracking-tighter leading-none text-center">{cmeConfig.sealText1}</span>
                            <span className="text-[3px] leading-none">{cmeConfig.sealText2}</span>
                            <span className="text-[2.2px] tracking-tighter leading-none text-center">{cmeConfig.sealText3}</span>
                          </div>

                          <div className="pt-3.5 font-bold text-[6.5px] text-slate-900 italic font-serif leading-none">
                            {cmeConfig.signerName}
                          </div>
                          <span className="text-[4px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold uppercase tracking-wider block mt-0.5 scale-95 leading-none">✓ CHỮ KÝ SỐ</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================= SECTION 12: BACKUP & RESTORE ================= */}
          {activeSubTab === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Sao Lưu & Phục Hồi Hệ Thống</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Tạo bản sao lưu toàn bộ dữ liệu cấu hình, danh sách đại biểu, báo cáo viên và khôi phục khi cần thiết.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                      📥
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Sao lưu dữ liệu</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Xuất toàn bộ cơ sở dữ liệu hiện tại thành tệp tin backup.json để lưu trữ an toàn.</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const backupData = store.exportBackupData();
                          const blob = new Blob([backupData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          const dateStr = new Date().toISOString().slice(0, 10);
                          a.href = url;
                          a.download = `pars-backup-${dateStr}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch (err: any) {
                          alert(`Không thể tạo file backup: ${err.message || err}`);
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl transition-all text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10"
                    >
                      💾 Tạo & Tải Bản Sao Lưu (.json)
                    </button>
                  </div>
                </div>

                {/* Restore Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#ffe4e6', color: '#e11d48' }}>
                      📤
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans">Khôi phục dữ liệu</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Tải lên tệp tin backup.json đã lưu trước đó để khôi phục toàn bộ trạng thái hệ thống.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <input
                      type="file"
                      accept=".json"
                      id="restore-file-input"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!window.confirm('CẢNH BÁO CỰC KỲ QUAN TRỌNG: Việc khôi phục dữ liệu sẽ XÓA SẠCH toàn bộ dữ liệu hiện tại của hệ thống (bao gồm cấu hình, đại biểu, báo cáo viên) và ghi đè bằng dữ liệu trong file backup. Bạn có chắc chắn muốn tiếp tục không?')) {
                          e.target.value = '';
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const content = event.target?.result as string;
                          try {
                            const res = await store.importBackupData(content);
                            if (res.success) {
                              alert(res.message);
                              window.location.reload();
                            } else {
                              alert(res.message);
                            }
                          } catch (err: any) {
                            alert(`Lỗi phục hồi dữ liệu: ${err.message || err}`);
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('restore-file-input')?.click();
                      }}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold rounded-xl transition-all text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/10"
                    >
                      🔄 Chọn File & Khôi Phục Dữ Liệu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modals or other subtab containers */}
        </div>

      </div>

      {/* ================= MODAL: REGISTRATION PACKAGE MANAGER CRUD ================= */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-150 shadow-2xl animate-fade-in text-slate-900">
            <div className="bg-slate-900 p-4 border-b border-slate-950 flex justify-between items-center text-white">
              <span className="font-extrabold text-xs tracking-wider uppercase">
                {isPackageEdit ? 'Chỉnh Sửa Gói Đăng Ký' : 'Thành Lập Gói Đăng Ký Mới'}
              </span>
              <button 
                disabled={isSavingPackage}
                onClick={() => setShowPackageModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackageSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">ID Gói *</label>
                  <input
                    type="text"
                    required
                    disabled={isPackageEdit || isSavingPackage}
                    value={formPkgId}
                    onChange={(e) => setFormPkgId(e.target.value)}
                    placeholder="pkg-custom"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Tên Gói Đại Biểu *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingPackage}
                    value={formPkgName}
                    onChange={(e) => setFormPkgName(e.target.value)}
                    placeholder="ví dụ: Gói Masterclass 1"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-855 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Đơn giá / Phí tham gia (VNĐ) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    disabled={isSavingPackage}
                    value={formPkgFee}
                    onChange={(e) => setFormPkgFee(Number(e.target.value))}
                    className="w-full pl-3 pr-10 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-extrabold disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400 text-[10px]">VNĐ</span>
                </div>
              </div>

              <div className={`text-left py-1 text-xs ${isSavingPackage ? 'pointer-events-none opacity-60' : ''}`}>
                <RichTextEditor
                  value={formPkgDesc}
                  onChange={setFormPkgDesc}
                  label="Mô tả tóm tắt"
                  placeholder="Điền ghi chú dành cho các y bác sĩ hoặc đối tượng ưu đãi của gói..."
                  id="pkg-desc"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Đặc quyền (Các chuỗi ngăn bởi dấu phẩy ,)</label>
                <textarea
                  value={formPkgBenefits}
                  disabled={isSavingPackage}
                  onChange={(e) => setFormPkgBenefits(e.target.value)}
                  placeholder="Nhận CME, Tài liệu bài báo, Teabreak Hội nghị..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formPkgIncludesCme}
                    disabled={isSavingPackage}
                    onChange={(e) => setFormPkgIncludesCme(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-350 cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Cấp CME</span>
                    <span className="text-[9px] text-slate-450 block -mt-0.5">Xác nhận có CME khoa học</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formPkgIncludesGala}
                    disabled={isSavingPackage}
                    onChange={(e) => setFormPkgIncludesGala(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-350 cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Gala Dinner</span>
                    <span className="text-[9px] text-slate-450 block -mt-0.5">Bao gồm thư mời tiệc tối</span>
                  </div>
                </label>
              </div>

              {/* Toggle pkg is active */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10.5px] font-bold text-slate-700">Trạng thái phát hành</span>
                <button
                  type="button"
                  disabled={isSavingPackage}
                  onClick={() => setFormPkgIsActive(!formPkgIsActive)}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-center cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
                    formPkgIsActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {formPkgIsActive ? 'Đang hoạt động' : 'Tạm Đóng'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  disabled={isSavingPackage}
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 bg-slate-100 font-bold rounded-lg cursor-pointer hover:bg-slate-200 text-slate-600 transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingPackage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-all border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingPackage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu Gói Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SPONSOR PACKAGE MANAGER CRUD ================= */}
      {showSponsorPackageModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-150 shadow-2xl animate-fade-in text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 p-4 border-b border-slate-950 flex justify-between items-center text-white">
              <span className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                {isSponsorPackageEdit ? 'Chỉnh Sửa Gói Tài Trợ' : 'Thành Lập Gói Tài Trợ Mới'}
              </span>
              <button 
                disabled={isSavingSponsorPackage}
                onClick={() => setShowSponsorPackageModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSponsorPackageSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">ID Gói *</label>
                  <input
                    type="text"
                    required
                    disabled={isSponsorPackageEdit || isSavingSponsorPackage}
                    value={formSponsorPkgId}
                    onChange={(e) => setFormSponsorPkgId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="sponsor-custom"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Tên Gói Tài Trợ *</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingSponsorPackage}
                    value={formSponsorPkgName}
                    onChange={(e) => setFormSponsorPkgName(e.target.value)}
                    placeholder="ví dụ: Nhà Tài Trợ Vàng"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-850 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Tên Tiếng Anh</label>
                <input
                  type="text"
                  disabled={isSavingSponsorPackage}
                  value={formSponsorPkgNameEn}
                  onChange={(e) => setFormSponsorPkgNameEn(e.target.value)}
                  placeholder="ví dụ: Gold Sponsor"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-850 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Phí tài trợ (VNĐ) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      step={100000}
                      disabled={isSavingSponsorPackage}
                      value={formSponsorPkgFee}
                      onChange={(e) => setFormSponsorPkgFee(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-extrabold disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-450 text-[9px]">VNĐ</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Màu nhận diện *</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      disabled={isSavingSponsorPackage}
                      value={formSponsorPkgColor}
                      onChange={(e) => setFormSponsorPkgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0 shrink-0"
                    />
                    <input
                      type="text"
                      disabled={isSavingSponsorPackage}
                      value={formSponsorPkgColor}
                      onChange={(e) => setFormSponsorPkgColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Quyền lợi Tiếng Việt (mỗi dòng một quyền lợi)</label>
                <textarea
                  disabled={isSavingSponsorPackage}
                  value={formSponsorPkgBenefits}
                  onChange={(e) => setFormSponsorPkgBenefits(e.target.value)}
                  placeholder="Gian hàng tiêu chuẩn: 1 gian&#10;Logo trên backdrop: Có&#10;Vé tham dự Gala Dinner: 5 vé..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Quyền lợi Tiếng Anh (mỗi dòng một quyền lợi)</label>
                <textarea
                  disabled={isSavingSponsorPackage}
                  value={formSponsorPkgBenefitsEn}
                  onChange={(e) => setFormSponsorPkgBenefitsEn(e.target.value)}
                  placeholder="Standard booth: 1&#10;Logo on backdrop: Yes&#10;Gala Dinner tickets: 5..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  rows={3}
                />
              </div>

              {/* Toggle pkg is active */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10.5px] font-bold text-slate-700">Trạng thái phát hành</span>
                <button
                  type="button"
                  disabled={isSavingSponsorPackage}
                  onClick={() => setFormSponsorPkgIsActive(!formSponsorPkgIsActive)}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-center cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
                    formSponsorPkgIsActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {formSponsorPkgIsActive ? 'Đang hoạt động' : 'Tạm Đóng'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  disabled={isSavingSponsorPackage}
                  onClick={() => setShowSponsorPackageModal(false)}
                  className="px-4 py-2 bg-slate-100 font-bold rounded-lg cursor-pointer hover:bg-slate-200 text-slate-600 transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingSponsorPackage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-all border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingSponsorPackage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu Gói Tài Trợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HUMAN OPERATOR PERMISSIONS CRUD ================= */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-150 shadow-2xl animate-fade-in text-slate-900">
            <div className="bg-slate-900 p-4 border-b border-slate-950 flex justify-between items-center text-white">
              <span className="font-extrabold text-xs tracking-wider uppercase">
                {isUserEdit ? 'Cấu Hình Quản Trị Nhân Sự' : 'Gán Thêm Thành Viên Mới'}
              </span>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Mã ID *</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={formUserId}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-400 bg-slate-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Email / Nickname Đăng nhập *</label>
                  <input
                    type="email"
                    required
                    disabled={isUserEdit}
                    value={formUserEmail}
                    onChange={(e) => setFormUserEmail(e.target.value)}
                    placeholder="vd: operator.chi@pars.org"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Họ Tên Hiển Thị *</label>
                <input
                  type="text"
                  required
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  placeholder="vd: BS.CKII Nguyễn Thế Chi"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              {!isUserEdit && (
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Mật Khẩu Ban Đầu (tối thiểu 6 ký tự) *</label>
                  <input
                    type="password"
                    required
                    value={formUserPassword}
                    onChange={(e) => setFormUserPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cho nhân sự..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Vai trò Vận hành *</label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value as Role)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="ctv">Cộng tác viên (CTV)</option>
                    <option value="btc">Thành viên BTC</option>
                    <option value="admin">Trưởng ban BTC (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Trạng thái Tài khoản *</label>
                  <select
                    value={formUserStatus}
                    onChange={(e) => setFormUserStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đình chỉ tạm thời</option>
                  </select>
                </div>
              </div>

              {/* Permissions checkboxes checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">GÁN QUYỀN HẠN CHI TIẾT (GRANULAR PERMISSIONS):</span>
                
                <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  <label className="flex items-center gap-2.5 cursor-pointer selection-none">
                    <input
                      type="checkbox"
                      checked={formUserPermissions.includes('approve_attendees')}
                      onChange={() => handleToggleUserPermission('approve_attendees')}
                      className="w-4 h-4 rounded text-indigo-600 outline-none cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] block">Duyệt thông tin & đối soát đại biểu</span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">Cho phép duyệt, gán QR, thay đổi trạng thái đóng tiền</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer selection-none">
                    <input
                      type="checkbox"
                      checked={formUserPermissions.includes('manage_speakers')}
                      onChange={() => handleToggleUserPermission('manage_speakers')}
                      className="w-4 h-4 rounded text-indigo-600 outline-none cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] block">Phê duyệt Báo cáo khoa học / CME</span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">Xét duyệt tóm tắt báo cáo viên, sắp xếp phòng biểu diễn</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer selection-none">
                    <input
                      type="checkbox"
                      checked={formUserPermissions.includes('finance_records')}
                      onChange={() => handleToggleUserPermission('finance_records')}
                      className="w-4 h-4 rounded text-indigo-600 outline-none cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] block">Truy xuất báo cáo tài chính thu chi</span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">Được quyền lọc biểu đồ tài chính, nhập chi ngân sách</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer selection-none">
                    <input
                      type="checkbox"
                      checked={formUserPermissions.includes('system_settings')}
                      onChange={() => handleToggleUserPermission('system_settings')}
                      className="w-4 h-4 rounded text-indigo-600 outline-none cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] block">Cấu hình tham số hệ thống & API</span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">Sửa đổi credentials SMTP, Token Zalo OA và xoá dữ liệu</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 font-bold rounded-lg cursor-pointer hover:bg-slate-200 text-slate-600 transition-all border-none"
                >
                  Thoát ra
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-all border-none shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isSavingUser ? 'Đang tạo Auth & DB...' : 'Đồng Bộ Tài Khoản nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXTRINSIC EMBED CODE DYNAMIC CRUD ================= */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-150 shadow-2xl animate-fade-in text-slate-900">
            <div className="bg-slate-900 p-4 border-b border-slate-950 flex justify-between items-center text-white">
              <span className="font-extrabold text-xs tracking-wider uppercase">
                {isEmbedEdit ? 'Chỉnh Sửa Mã Nhúng Database' : 'Thiết Lập Đoạn Mã Nhúng'}
              </span>
              <button 
                onClick={() => setShowEmbedModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmbedSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Mã nhúng ID *</label>
                  <input
                    type="text"
                    required
                    disabled={isEmbedEdit}
                    value={formEmbedId}
                    onChange={(e) => setFormEmbedId(e.target.value)}
                    placeholder="emb-ga4"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Tên nhãn mô tả mã nhúng *</label>
                  <input
                    type="text"
                    required
                    value={formEmbedName}
                    onChange={(e) => setFormEmbedName(e.target.value)}
                    placeholder="vd: Iframe Form Delegate Đăng Ký chính thức"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Phân vị / Vị trí nhúng *</label>
                  <select
                    value={formEmbedTarget}
                    onChange={(e) => setFormEmbedTarget(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold bg-white"
                  >
                    <option value="delegate">Iframe Đăng Ký Đại Biểu (WordPress)</option>
                    <option value="speaker">Iframe Form Báo Cáo Viên (WordPress)</option>
                    <option value="sponsor">Iframe Form Tài Trợ (WordPress)</option>
                    <option value="analytics">Đoạn Script Pixel / Analytics thẻ Head/Body</option>
                    <option value="custom">Mã nhúng tùy biến quảng cáo / Chỉnh trang trí</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10.5px] font-black text-slate-500 block mb-1">Phát hiệu lập tức *</label>
                  <select
                    value={formEmbedIsActive ? 'true' : 'false'}
                    onChange={(e) => setFormEmbedIsActive(e.target.value === 'true')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold bg-white"
                  >
                    <option value="true">Bật kích hoạt và truyền dữ liệu</option>
                    <option value="false">Tạm dừng ẩn trên web ngoài</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Nội dung Mã nguồn (HTML / Block / Iframe / Script)*</label>
                <textarea
                  required
                  value={formEmbedCode}
                  onChange={(e) => setFormEmbedCode(e.target.value)}
                  placeholder="vd: <iframe src='...' width='100%' height='950px' ...></iframe>"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[10px] text-indigo-700 bg-slate-50"
                  rows={6}
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1">Mẹo / Giải nghĩa vị trí nhúng</label>
                <input
                  type="text"
                  value={formEmbedNotes}
                  onChange={(e) => setFormEmbedNotes(e.target.value)}
                  placeholder="vd: Dán vào Widget HTML của trang chủ tin tức..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-2 bg-slate-100 font-bold rounded-lg cursor-pointer hover:bg-slate-200 text-slate-600 transition-all border-none"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-all border-none shadow-sm"
                >
                  Lưu trữ Mã Nhúng DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
