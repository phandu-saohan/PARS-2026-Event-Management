/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Plus, Coins, Play, FileDown, CheckCircle, Trash, ShoppingBag, ShieldCheck, Mail, Phone, Users, Landmark, FileText, Calendar, Upload, Link, AlertCircle, AlertTriangle, Edit3, FileCheck, Check, Eye, Download, X, MapPin } from 'lucide-react';
import { store } from '../dataStore';
import { Sponsor, Role, SponsorPackage } from '../types';

interface SponsorManagementProps {
  role: Role;
  onNavigate?: (view: string) => void;
}

export default function SponsorManagement({ role, onNavigate }: SponsorManagementProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(store.getSponsors());
  const [showForm, setShowForm] = useState(false);
  const sponsorPackages = store.getSponsorPackages ? store.getSponsorPackages() : [];

  const getTierStyle = (tierId: string) => {
    const pkg = sponsorPackages.find(p => p.id === tierId);
    if (!pkg) return undefined;
    const color = pkg.color || '#6366f1';
    return {
      backgroundColor: color + '15',
      color: color,
      borderColor: color + '40',
      borderWidth: '1px',
      borderStyle: 'solid' as const
    };
  };

  const getTierClass = (tierId: string) => {
    const pkg = sponsorPackages.find(p => p.id === tierId);
    if (pkg) return '';
    if (tierId === 'diamond') return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    if (tierId === 'platinum') return 'bg-purple-50 text-purple-750 border border-purple-200';
    if (tierId === 'gold') return 'bg-amber-50 text-amber-705 border border-amber-200';
    if (tierId === 'silver') return 'bg-slate-50 text-slate-600 border border-slate-200';
    if (tierId === 'bronze') return 'bg-orange-50 text-orange-700 border border-orange-205';
    if (tierId === 'standard') return 'bg-zinc-50 text-zinc-600 border border-zinc-200';
    if (tierId === 'co_sponsor') return 'bg-emerald-50 text-emerald-707 border border-emerald-200';
    return 'bg-slate-100 text-slate-650';
  };

  const getTierName = (tierId: string) => {
    const pkg = sponsorPackages.find(p => p.id === tierId);
    if (pkg) return pkg.name;
    if (tierId === 'diamond') return 'Diamond Partner';
    if (tierId === 'platinum') return 'Platinum Partner';
    if (tierId === 'gold') return 'Gold Partner';
    if (tierId === 'silver') return 'Silver Partner';
    if (tierId === 'bronze') return 'Bronze Partner';
    if (tierId === 'standard') return 'Standard Partner';
    if (tierId === 'co_sponsor') return 'Co-Sponsor';
    return `${tierId.toUpperCase()} Partner`;
  };

  // Form fields for adding a new sponsor
  const [name, setName] = useState('');
  const [tier, setTier] = useState<string>('gold');
  const [pledgedAmount, setPledgedAmount] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [benefitsListText, setBenefitsListText] = useState('Gian hàng triển lãm chính, Logo nổi bật trang bìa');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [boothLocation, setBoothLocation] = useState('auto');
  const [customBoothLocation, setCustomBoothLocation] = useState('');

  // --- New fields for contract inputs in NEW sponsor form ---
  const [formContractNo, setFormContractNo] = useState('');
  const [formContractSignDate, setFormContractSignDate] = useState('');
  const [formContractValue, setFormContractValue] = useState('');
  const [formContractStatus, setFormContractStatus] = useState<Sponsor['contractStatus']>('draft');
  const [formContractFileName, setFormContractFileName] = useState('');
  const [formContractFileUrl, setFormContractFileUrl] = useState('');
  const [formIsDraggingContract, setFormIsDraggingContract] = useState(false);

  // --- New states for editing contracts for existing sponsors ---
  const [showContractModal, setShowContractModal] = useState<Sponsor | null>(null);
  const [contractNo, setContractNo] = useState('');
  const [contractSignDate, setContractSignDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [contractStatus, setContractStatus] = useState<Sponsor['contractStatus']>('draft');
  
  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contractFileName, setContractFileName] = useState('');
  const [contractFileUrl, setContractFileUrl] = useState('');
  const [isDraggingContract, setIsDraggingContract] = useState(false);

  // Simulated Document Preview Pane
  const [previewSponsor, setPreviewSponsor] = useState<Sponsor | null>(null);

  // States for editing sponsor details
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [editName, setEditName] = useState('');
  const [editTier, setEditTier] = useState<string>('gold');
  const [editPledgedAmount, setEditPledgedAmount] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editBenefitsListText, setEditBenefitsListText] = useState('');
  const [editLogoImage, setEditLogoImage] = useState<string | null>(null);
  const [isEditLogoUploading, setIsEditLogoUploading] = useState(false);
  const [editBoothLocation, setEditBoothLocation] = useState('auto');
  const [editCustomBoothLocation, setEditCustomBoothLocation] = useState('');

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

  // Interactive Payment Simulator States
  const [showPaySimModal, setShowPaySimModal] = useState<Sponsor | null>(null);
  const [paySimAmount, setPaySimAmount] = useState('');
  const [paySimMethod, setPaySimMethod] = useState<'credit' | 'bank'>('bank');
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);

  const loadAll = () => {
    setSponsors([...store.getSponsors()]);
  };

  const handleCreateSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pledgedAmount) {
      alert('Vui lòng điền tên tập đoàn và số tiền tài trợ.');
      return;
    }

    const nPledged = Number(pledgedAmount);
    if (isNaN(nPledged) || nPledged <= 0) {
      alert('Kinh phí tài trợ thỏa thuận phải hợp lệ.');
      return;
    }

    const benefits = benefitsListText.split(',').map(b => b.trim()).filter(b => b !== '');

    const sponsorData: Sponsor = {
      id: 'SPN-' + Math.floor(Math.random() * 900 + 100),
      name,
      tier,
      pledgedAmount: nPledged,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      contactPerson,
      contactEmail,
      contactPhone,
      benefitsSigned: benefits,
      logoUrl: logoImage || undefined,
      contractNo: formContractNo || undefined,
      contractSignDate: formContractSignDate || undefined,
      contractValue: formContractValue ? Number(formContractValue) : undefined,
      contractStatus: formContractNo ? formContractStatus : undefined,
      contractFileName: formContractFileName || undefined,
      contractFileUrl: formContractFileUrl || undefined,
      boothLocation: boothLocation === 'other' ? customBoothLocation : boothLocation,
    };

    store.saveSponsor(sponsorData);
    setShowForm(false);
    
    // Clear
    setName('');
    setPledgedAmount('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setLogoImage(null);
    setBoothLocation('auto');
    setCustomBoothLocation('');
    setFormContractNo('');
    setFormContractSignDate('');
    setFormContractValue('');
    setFormContractStatus('draft');
    setFormContractFileName('');
    setFormContractFileUrl('');
    
    loadAll();
    alert('Thêm Nhà tài trợ mới thành công! Đã lên lịch trình đối soát tài chính.');
  };

  // Get Vietnamese labels & styles for contract statuses
  const getContractStatusLabel = (status: Sponsor['contractStatus']) => {
    switch (status) {
      case 'signed': return 'Đã ký kết';
      case 'pending_signature': return 'Chờ ký kết';
      case 'draft': return 'Bản thảo';
      case 'expired': return 'Hết hiệu lực';
      case 'cancelled': return 'Đã hủy bỏ';
      default: return 'Chưa tạo';
    }
  };

  const getContractStatusStyle = (status: Sponsor['contractStatus']) => {
    switch (status) {
      case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending_signature': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'expired': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled': return 'bg-slate-100 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-450 border-slate-200';
    }
  };

  // Realistic mock download builder
  const handleDownloadContractFile = (sponsor: Sponsor) => {
    if (!sponsor.contractFileName) return;
    
    if (sponsor.contractFileUrl && sponsor.contractFileUrl !== '#') {
      const link = document.createElement('a');
      link.href = sponsor.contractFileUrl;
      link.download = sponsor.contractFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(`Đã tải xuống hợp đồng chính thức: ${sponsor.contractFileName}`);
    } else {
      // Generate realistic Vietnamese Legal format text document
      let docContent = '';
      docContent += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n`;
      docContent += `Độc lập - Tự do - Hạnh phúc\n`;
      docContent += `-------------------------\n\n`;
      docContent += `HỢP ĐỒNG KHAI THÁC QUYỀN LỢI TÀI TRỢ & ĐỒNG HÀNH SỰ KIỆN KHCS\n`;
      docContent += `Số hiệu: ${sponsor.contractNo || 'HD-' + sponsor.id + '/PARS'}\n`;
      docContent += `Về việc: Đồng hành tài trợ Hội Nghị Thẩm Mỹ Quốc Tế PARS 2026\n\n`;
      docContent += `Hôm nay, ngày ${sponsor.contractSignDate || '.../.../2026'}, tại văn phòng Ban điều hành, chúng tôi gồm:\n\n`;
      docContent += `BÊN A: BAN TỔ CHỨC HỘI NGHỊ PARS 2026\n`;
      docContent += `- Đại diện: GS.TS. Phạm Minh Chi\n`;
      docContent += `- Chức vụ: Trưởng Ban tổ chức hội nghị khoa học\n`;
      docContent += `- Văn phòng tổng thư ký: Hà Nội - Việt Nam\n\n`;
      docContent += `BÊN B: ĐƠN VỊ TÀI TRỢ & ĐỒNG HÀNH DOANH NGHIỆP\n`;
      docContent += `- Tên Công ty: ${sponsor.name}\n`;
      docContent += `- Đại diện thương mại: ${sponsor.contactPerson || 'Ông/Bà Đại Diện'}\n`;
      docContent += `- Email: ${sponsor.contactEmail || 'chưa cập nhật'} | SĐT: ${sponsor.contactPhone || 'chưa cập nhật'}\n\n`;
      docContent += `ĐIỀU 1: PHẠM VI HỢP TÁC & GIÁ TRỊ CAM KẾT\n`;
      docContent += `- Bên B cam kết đồng hành với hạn mức: ${(sponsor.contractValue || sponsor.pledgedAmount).toLocaleString()} VNĐ\n`;
      docContent += `- Thực tế đã giải ngân thanh quyết toán: ${(sponsor.paidAmount).toLocaleString()} VNĐ\n`;
      docContent += `- Phân khúc Partner đồng hành: Hạng ${sponsor.tier.toUpperCase()}\n`;
      if (sponsor.boothLocation) {
        docContent += `- Vị trí gian hàng đăng ký: ${sponsor.boothLocation === 'auto' ? 'Ban tổ chức sắp xếp' : sponsor.boothLocation}\n`;
      }
      docContent += `\n`;
      docContent += `ĐIỀU 2: QUYỀN LỢI BÊN B ĐƯỢC HƯỞNG\n`;
      sponsor.benefitsSigned.forEach((benefit, index) => {
        docContent += `  ${index + 1}. Quyền lợi danh mục: ${benefit}\n`;
      });
      docContent += `\nĐIỀU 3: TRÁCH NHIỆM CHUNG & HIỆU LỰC HỢP ĐỒNG\n`;
      docContent += `- Trạng thái ghi nhận hợp tác: ${getContractStatusLabel(sponsor.contractStatus || 'draft')}\n`;
      docContent += `- Bản hợp đồng này được lập thành 02 bản có giá trị pháp lý tương đương.\n\n`;
      docContent += `       ĐẠI DIỆN BÊN A                         ĐẠI DIỆN BÊN B\n`;
      docContent += `          (Đã ký)                                (Đã ký)\n\n`;
      docContent += `   GS.TS. Phạm Minh Chi                   ${sponsor.contactPerson || 'Đối tác đồng hành'}\n\n`;
      docContent += `========================================================================\n`;
      docContent += `ĐƯỢC CHỨNG THỰC LƯU TRỮ TRÊN CƠ SỞ DỮ LIỆU ĐIỆN TỬ PARS DATA ENGINE 2026`;

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), docContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = sponsor.contractFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenContractEdit = (sponsor: Sponsor) => {
    setShowContractModal(sponsor);
    setContractNo(sponsor.contractNo || `HD-${sponsor.id}/PARS`);
    setContractSignDate(sponsor.contractSignDate || new Date().toISOString().substring(0, 10));
    setContractValue(sponsor.contractValue?.toString() || sponsor.pledgedAmount.toString());
    setContractStatus(sponsor.contractStatus || 'draft');
    setContractFileName(sponsor.contractFileName || '');
    setContractFileUrl(sponsor.contractFileUrl || '');
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContractModal) return;

    const nVal = Number(contractValue);
    if (isNaN(nVal) || nVal < 0) {
      alert('Giá trị hợp đồng phải là một giá trị số hợp lệ.');
      return;
    }

    const originalList = store.getSponsors();
    const found = originalList.find(s => s.id === showContractModal.id);
    if (found) {
      const oldStatus = found.contractStatus;
      found.contractNo = contractNo || undefined;
      found.contractSignDate = contractSignDate || undefined;
      found.contractValue = nVal;
      found.contractStatus = contractStatus;
      if (contractFileName) {
        found.contractFileName = contractFileName;
        found.contractFileUrl = contractFileUrl;
      }
      store.saveSponsor(found);

      // Nếu trạng thái chuyển sang đã ký (signed) và trước đó chưa ký, gửi email thông báo
      if (contractStatus === 'signed' && oldStatus !== 'signed') {
        try {
          const mockAttendee = {
            id: found.id,
            title: 'Quý đối tác',
            fullName: found.contactPerson,
            email: found.contactEmail,
            phone: found.contactPhone,
            organization: found.name,
            packageName: found.tier.toUpperCase(),
            packageFee: found.pledgedAmount,
            paymentStatus: found.paymentStatus,
            qrCodeValue: `PARS2026-SPN-${found.id}`,
            pledgedAmount: found.pledgedAmount,
            paidAmount: found.paidAmount,
            boothLocation: found.boothLocation,
            contractNo: found.contractNo
          };
          await store.sendEmail(mockAttendee as any, undefined, undefined, 'tmpl-sponsor-contract');
        } catch (emailErr) {
          console.error("Gửi email ký hợp đồng nhà tài trợ thất bại:", emailErr);
        }
      }
    }

    setShowContractModal(null);
    loadAll();
    alert('Cập nhật hồ sơ pháp lý & file hợp đồng đối tác thành công!');
  };

  // 1-Click online payment simulation trigger
  const handleSimPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaySimModal || !paySimAmount) return;

    const sponsorObj = showPaySimModal;
    const nPay = Number(paySimAmount);

    if (isNaN(nPay) || nPay <= 0) {
      alert('Số tiền thanh toán phải hợp lệ.');
      return;
    }

    setIsSimulatingSuccess(true);

    setTimeout(async () => {
      // Update Sponsor amounts
      const originalList = store.getSponsors();
      const found = originalList.find(s => s.id === sponsorObj.id);
      if (found) {
        const nextPaid = found.paidAmount + nPay;
        found.paidAmount = nextPaid >= found.pledgedAmount ? found.pledgedAmount : nextPaid;
        found.paymentStatus = found.paidAmount >= found.pledgedAmount ? 'fully_paid' : 'partially_paid';
        store.saveSponsor(found);

        // Gửi email xác nhận thanh toán tài trợ
        try {
          const mockAttendee = {
            id: found.id,
            title: 'Quý đối tác',
            fullName: found.contactPerson,
            email: found.contactEmail,
            phone: found.contactPhone,
            organization: found.name,
            packageName: found.tier.toUpperCase(),
            packageFee: found.pledgedAmount,
            paymentStatus: found.paymentStatus,
            qrCodeValue: `PARS2026-SPN-${found.id}`,
            pledgedAmount: found.pledgedAmount,
            paidAmount: found.paidAmount,
            boothLocation: found.boothLocation,
            contractNo: found.contractNo
          };
          await store.sendEmail(mockAttendee as any, undefined, undefined, 'tmpl-sponsor-paid');
        } catch (emailErr) {
          console.error("Gửi email xác nhận thanh toán nhà tài trợ thất bại:", emailErr);
        }
      }

      setIsSimulatingSuccess(false);
      setShowPaySimModal(null);
      setPaySimAmount('');
      loadAll();
      alert(`[MÔ PHỎNG THANH TOÁN] Cổng thanh toán báo có! Đã cập nhật khoản thu tài trợ trị giá ${nPay.toLocaleString()}đ và đồng bộ hạch toán Realtime.`);
    }, 1500);
  };

  const handleOpenEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setEditName(sponsor.name);
    setEditTier(sponsor.tier);
    setEditPledgedAmount(sponsor.pledgedAmount.toString());
    setEditContactPerson(sponsor.contactPerson);
    setEditContactEmail(sponsor.contactEmail);
    setEditContactPhone(sponsor.contactPhone);
    setEditBenefitsListText(sponsor.benefitsSigned.join(', '));
    setEditLogoImage(sponsor.logoUrl || null);
    const currentLoc = sponsor.boothLocation || 'auto';
    const standardLocs = ['auto', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];
    if (standardLocs.includes(currentLoc)) {
      setEditBoothLocation(currentLoc);
      setEditCustomBoothLocation('');
    } else {
      setEditBoothLocation('other');
      setEditCustomBoothLocation(currentLoc);
    }
  };

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsEditLogoUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogoImage(reader.result as string);
        setIsEditLogoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSponsorDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;
    if (!editName || !editPledgedAmount) {
      alert('Vui lòng điền tên tập đoàn và số tiền tài trợ.');
      return;
    }

    const nPledged = Number(editPledgedAmount);
    if (isNaN(nPledged) || nPledged <= 0) {
      alert('Kinh phí tài trợ thỏa thuận phải hợp lệ.');
      return;
    }

    const benefits = editBenefitsListText.split(',').map(b => b.trim()).filter(b => b !== '');

    const originalList = store.getSponsors();
    const found = originalList.find(s => s.id === editingSponsor.id);
    if (found) {
      found.name = editName;
      found.tier = editTier;
      found.pledgedAmount = nPledged;
      found.contactPerson = editContactPerson;
      found.contactEmail = editContactEmail;
      found.contactPhone = editContactPhone;
      found.benefitsSigned = benefits;
      found.logoUrl = editLogoImage || undefined;
      found.boothLocation = editBoothLocation === 'other' ? editCustomBoothLocation : editBoothLocation;
      store.saveSponsor(found);
    }

    setEditingSponsor(null);
    loadAll();
    alert('Cập nhật thông tin Nhà tài trợ thành công!');
  };

  const handleDelete = (id: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền xóa nhà tài trợ!');
      return;
    }
    setDeleteConfirmId(id);
  };

  // Detailed report file download simulator
  const handleExportReport = () => {
    let reportContent = 'BÁO CÁO PHÂN TÍCH TÀI TRỢ CHUYÊN SÂU - PARS 2026\n';
    reportContent += `Ngày trích xuất dữ liệu: ${new Date().toISOString().replace('T', ' ').substring(0, 16)}\n`;
    reportContent += '=============================================\n\n';
    
    let totalPledged = 0;
    let totalPaid = 0;

    sponsors.forEach(s => {
      totalPledged += s.pledgedAmount;
      totalPaid += s.paidAmount;
      reportContent += `[${s.tier.toUpperCase()}] ${s.name}\n`;
      reportContent += `  - Người liên hệ: ${s.contactPerson} (${s.contactPhone})\n`;
      if (s.boothLocation) {
        reportContent += `  - Vị trí gian hàng: ${s.boothLocation === 'auto' ? 'BTC sắp xếp' : s.boothLocation}\n`;
      }
      reportContent += `  - Kinh phí Thỏa thuận: ${s.pledgedAmount.toLocaleString()} VNĐ\n`;
      reportContent += `  - Đã chuyển khoản: ${s.paidAmount.toLocaleString()} VNĐ\n`;
      reportContent += `  - Tỷ lệ hoàn tất: ${Math.round(s.paidAmount/s.pledgedAmount*100)}%\n`;
      reportContent += `  - Quyền lợi ký kết:\n`;
      s.benefitsSigned.forEach(b => {
        reportContent += `    + ${b}\n`;
      });
      reportContent += `---------------------------------------------\n`;
    });

    reportContent += `\nTỔNG HỢP DANH THU TÀI TRỢ:\n`;
    reportContent += `- Tổng hạn ngạch thỏa thuận: ${totalPledged.toLocaleString()} VNĐ\n`;
    reportContent += `- Thực thu nhận (Đã thanh toán): ${totalPaid.toLocaleString()} VNĐ\n`;
    reportContent += `- Dòng quỹ treo: ${(totalPledged - totalPaid).toLocaleString()} VNĐ\n`;
    reportContent += `- Tỷ lệ đối soát hoàn tất: ${Math.round(totalPaid/totalPledged*100)}%\n`;

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Báo_Cáo_Tài_Trợ_PARS2026.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Overview statistical card widgets */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Quản Lý Gói Đồng Hành Tài Trợ</h3>
          <p className="text-xs text-slate-400">Giám sát các gói ký kết, quyền lợi sảnh gian trưng bày, thanh toán trực tiếp.</p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              id="btn-view-public-register-sponsor"
              onClick={() => onNavigate('register-sponsor')}
              className="px-4 py-2 text-xs bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-indigo-600" />
              Mở Đăng Ký Public
            </button>
          )}

          <button
            id="btn-export-sponsor-report"
            onClick={handleExportReport}
            className="px-4 py-2 text-xs bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Xuất Báo Cáo Chuyên Sâu
          </button>
          
          {role !== 'ctv' && (
            <button
              id="btn-add-sponsor-modal"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ghi Nhậm Thỏa Thuận Mới
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sponsors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sponsors.map(sponsor => {
          const ratioPct = Math.round((sponsor.paidAmount / sponsor.pledgedAmount) * 100);
          return (
            <div key={sponsor.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-350 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                {/* Sponsor level header */}
                <div className="flex items-center justify-between">
                  <span 
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${getTierClass(sponsor.tier)}`}
                    style={getTierStyle(sponsor.tier)}
                  >
                    {getTierName(sponsor.tier)}
                  </span>
                  
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{sponsor.id}</span>
                </div>

                {/* Company Name & logo */}
                <div className="flex items-center gap-3">
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt="Logo" className="w-11 h-11 object-contain bg-white rounded-lg p-1 border shadow-sm shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-teal-50 border border-teal-105 flex items-center justify-center font-bold text-[10px] text-teal-700 shrink-0 select-none uppercase font-mono">
                      {sponsor.name.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{sponsor.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sponsor.contactPerson} - {sponsor.contactPhone}</p>
                    {sponsor.boothLocation && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-700">
                        <MapPin className="w-3.5 h-3.5 text-indigo-550 animate-pulse" />
                        <span>Gian hàng: {sponsor.boothLocation === 'auto' ? 'BTC sắp xếp' : sponsor.boothLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fund ratio meters */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">Hết ngạch thỏa thuận:</span>
                    <strong className="text-slate-900">{(sponsor.pledgedAmount).toLocaleString()}đ</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">Thực thu nhận (Paid):</span>
                    <strong className="text-teal-700">{(sponsor.paidAmount).toLocaleString()}đ</strong>
                  </div>
                  
                  {/* Visual Bar Ratio */}
                  <div className="relative pt-1.5">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                      <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 rounded-full" style={{ width: `${ratioPct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1 text-right">Đối soát hoàn tất {ratioPct}%</span>
                  </div>
                </div>

                {/* Benefits signed checklist details */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">Quyền lợi ký kết nổi bật:</span>
                  <ul className="text-[11px] text-slate-600 pl-3 list-disc space-y-1">
                    {sponsor.benefitsSigned.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                {/* Extended Contract & File Information Block */}
                <div className="pt-3.5 mt-2 border-t border-slate-200/60 bg-slate-50/70 p-3 rounded-xl border border-slate-150 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black text-indigo-950 tracking-wider font-mono flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                      Pháp Lý Hợp Đồng
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors ${getContractStatusStyle(sponsor.contractStatus)}`}>
                      {getContractStatusLabel(sponsor.contractStatus || 'draft')}
                    </span>
                  </div>

                  {sponsor.contractNo ? (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Số HĐ:</span>
                        <span className="font-mono font-bold text-slate-800">{sponsor.contractNo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Ngày ký:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {sponsor.contractSignDate || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Giá trị thực ký:</span>
                        <span className="font-bold text-pink-700">{(sponsor.contractValue || sponsor.pledgedAmount).toLocaleString()}đ</span>
                      </div>

                      {/* File Attachment Pill */}
                      {sponsor.contractFileName ? (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-150">
                          <div className="flex items-center gap-1 w-[70%]">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[10px] text-slate-700 font-semibold truncate" title={sponsor.contractFileName}>
                              {sponsor.contractFileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewSponsor(sponsor)}
                              className="p-1 hover:bg-slate-100 text-indigo-700 rounded transition"
                              title="Xem nhanh văn bản"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadContractFile(sponsor)}
                              className="p-1 hover:bg-slate-100 text-emerald-700 rounded transition"
                              title="Tải văn bản đính kèm"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-center text-[10px] text-amber-600 font-medium py-1 bg-amber-50 rounded border border-amber-100 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          Thiếu file đính kèm chính thức
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-[11px] text-slate-450 italic">
                      Chưa hoàn tất khai báo hợp đồng
                    </div>
                  )}

                  <div className="mt-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenContractEdit(sponsor)}
                      className="text-[10px] font-black hover:text-pink-600 text-indigo-700 transition-colors inline-flex items-center gap-1 cursor-pointer border-0 bg-transparent pl-2 py-0.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {sponsor.contractNo ? 'Cập Nhật Hồ Sơ' : 'Thiết Lập Hợp Đồng'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action and simulator control */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  id={`btn-pay-sponsor-${sponsor.id}`}
                  onClick={() => setShowPaySimModal(sponsor)}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-150 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Nộp Phí Đồng Hành
                </button>

                {role !== 'ctv' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditSponsor(sponsor)}
                      className="p-1.5 hover:bg-indigo-50 text-indigo-550 text-indigo-600 rounded-lg transition-all cursor-pointer"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sponsor.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-all cursor-pointer"
                      title="Xóa hồ sơ"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SPONSOR PAYMENT GATEWAY ONLINE SIMULATOR MODAL */}
      {showPaySimModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-805">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
              <span className="text-[9px] font-bold text-teal-300 uppercase tracking-widest font-mono block">CỔNG QUYẾT TOÁN KINH PHÍ ĐỒNG HÀNH</span>
              <h4 className="font-extrabold text-xs tracking-wider uppercase mt-1">OFFICIAL ENTERPRISE BILLING GATEWAY</h4>
              <p className="text-[10px] text-emerald-100 mt-1">Đóng góp kinh phí đồng hành trực tiếp cho sảnh triển lãm PARS 2026.</p>
            </div>

            <form onSubmit={handleSimPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1 text-xs">
                <span className="text-slate-400 block font-mono">Doanh nghiệp chi trả:</span>
                <p className="font-bold text-slate-900 text-sm">{showPaySimModal.name}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 mt-1.5 border-t border-slate-200">
                  <p>• Số thỏa thuận: <strong className="text-slate-800">{(showPaySimModal.pledgedAmount).toLocaleString()}đ</strong></p>
                  <p>• Đã nộp luỹ kế: <strong className="text-emerald-700">{(showPaySimModal.paidAmount).toLocaleString()}đ</strong></p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Số tiền muốn nộp lần này (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={paySimAmount}
                  onChange={(e) => setPaySimAmount(e.target.value)}
                  placeholder="ví dụ: 100000000"
                  className="w-full px-3 py-2 border-2 border-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none font-black text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Cổng truyền tín cổng đối chiếu</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-3 border rounded-xl flex items-center gap-2 cursor-pointer bg-white text-xs hover:bg-slate-50 font-semibold select-none">
                    <input
                      type="radio"
                      name="paySimMethod"
                      checked={paySimMethod === 'bank'}
                      onChange={() => setPaySimMethod('bank')}
                      className="text-emerald-600"
                    />
                    <span>Vietcombank ERP Sync</span>
                  </label>
                  <label className="p-3 border rounded-xl flex items-center gap-2 cursor-pointer bg-white text-xs hover:bg-slate-50 font-semibold select-none">
                    <input
                      type="radio"
                      name="paySimMethod"
                      checked={paySimMethod === 'credit'}
                      onChange={() => setPaySimMethod('credit')}
                      className="text-emerald-600"
                    />
                    <span>Cổng Thẻ Visa/Master</span>
                  </label>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg text-[10px] font-medium text-emerald-800 flex items-start gap-1.5 border border-emerald-150">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Bạn đang thanh thử trong môi trường nhà phát triên. Các thao tác này sẽ đẩy tiền luỹ kế trực tiếp và nảy bút toán thu chi trên sổ sách để kiểm định.</span>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  disabled={isSimulatingSuccess}
                  onClick={() => setShowPaySimModal(null)}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-sim"
                  type="submit"
                  disabled={isSimulatingSuccess}
                  className="px-4 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {isSimulatingSuccess ? 'Đang mã hóa...' : 'Xác Nhận Nạp Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSERT MANUALLY NEW SPONSORS AGREEMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800">
            <div className="bg-teal-600 p-5 text-white">
              <h4 className="font-bold text-sm">GHI NHẬN HỢP ĐỒNG TÀI TRỢ</h4>
              <p className="text-[11px] text-teal-100">Khai báo thông số tập đoàn cùng cam kết tài chính thỏa thuận.</p>
            </div>

            <form onSubmit={handleCreateSponsor} className="p-6 space-y-4">
              {/* Logo Select Section */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-205">
                <div className="relative shrink-0 w-12 h-12 rounded-lg bg-slate-200 border border-dashed border-teal-600/30 flex items-center justify-center overflow-hidden">
                  {logoImage ? (
                    <img src={logoImage} className="w-full h-full object-contain" alt="Logo preview" />
                  ) : (
                    <span className="text-slate-400 text-[9px] font-bold text-center select-none">No Logo</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wide">Logo Doanh Nghiệp (Logo)</span>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold rounded cursor-pointer transition-all select-none">
                      Tải ảnh logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoImage && (
                      <button
                        type="button"
                        onClick={() => setLogoImage(null)}
                        className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded border-none cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên Tập đoàn / Doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ví dụ: Medtronic VN"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Gói Partner Đồng Hành *</label>
                  <select
                    value={tier}
                    onChange={(e: any) => setTier(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer font-semibold text-slate-700"
                  >
                    {sponsorPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.fee === 0 ? 'Miễn phí' : `${(pkg.fee / 1000000).toLocaleString()}tr`})
                      </option>
                    ))}
                    <option value="co_sponsor">Co-Sponsor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tổng tiền Thỏa thuận *</label>
                  <input
                    type="number"
                    required
                    value={pledgedAmount}
                    onChange={(e) => setPledgedAmount(e.target.value)}
                    placeholder="ví dụ: 100000000"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Vị trí gian hàng</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={boothLocation}
                    onChange={(e) => setBoothLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer font-semibold text-slate-700 bg-white"
                  >
                    <option value="auto">BTC tự sắp xếp / Tự chọn sau</option>
                    <option value="A1">Gian A1 (Khu Kim Cương)</option>
                    <option value="A2">Gian A2 (Khu Kim Cương)</option>
                    <option value="A3">Gian A3 (Khu Kim Cương)</option>
                    <option value="B1">Gian B1 (Khu Bạch Kim/Vàng)</option>
                    <option value="B2">Gian B2 (Khu Bạch Kim/Vàng)</option>
                    <option value="B3">Gian B3 (Khu Bạch Kim/Vàng)</option>
                    <option value="C1">Gian C1 (Khu Tiêu chuẩn)</option>
                    <option value="C2">Gian C2 (Khu Tiêu chuẩn)</option>
                    <option value="other">Khác / Vị trí đặc biệt...</option>
                  </select>

                  {boothLocation === 'other' && (
                    <input
                      type="text"
                      required
                      value={customBoothLocation}
                      onChange={(e) => setCustomBoothLocation(e.target.value)}
                      placeholder="Mã gian hàng (ví dụ: D4)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên liên hệ</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="ví dụ: Chị Linh"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">SĐT liên hệ</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Mail liên hệ</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="mail@..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Quyền lợi ký cam kết (Phân tách bằng dấu phẩy)</label>
                <textarea
                  value={benefitsListText}
                  onChange={(e) => setBenefitsListText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Optional Section: Thiết lập hợp đồng ban đầu */}
              <div className="border-t border-slate-150 pt-3 space-y-3">
                <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider font-mono block">
                  Thiết lập Hợp đồng kỹ thuật (Tùy chọn)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Số Hợp Đồng</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      placeholder="HD-XXX/PARS"
                      value={formContractNo}
                      onChange={(e) => setFormContractNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Ngày ký</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      value={formContractSignDate}
                      onChange={(e) => setFormContractSignDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Trạng thái pháp lý</label>
                    <select
                      className="w-full px-3 py-1.4 border border-slate-200 rounded-lg text-xs cursor-pointer"
                      value={formContractStatus}
                      onChange={(e: any) => setFormContractStatus(e.target.value)}
                    >
                      <option value="draft">Bản thảo</option>
                      <option value="pending_signature">Chờ ký kết</option>
                      <option value="signed">Đã ký kết</option>
                      <option value="expired">Hết hạn</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Giá trị hợp đồng (VNĐ)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      placeholder="Mặc định lấy tổng tiền"
                      value={formContractValue}
                      onChange={(e) => setFormContractValue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Contract File Drag & Drop Simulation */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tài liệu văn bản đính kèm</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setFormIsDraggingContract(true);
                    }}
                    onDragLeave={() => setFormIsDraggingContract(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setFormIsDraggingContract(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormContractFileUrl(reader.result as string || '#');
                          setFormContractFileName(file.name);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all ${
                      formIsDraggingContract ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="form-contract-file-select"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormContractFileUrl(reader.result as string || '#');
                            setFormContractFileName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="form-contract-file-select" className="cursor-pointer space-y-1 block select-none">
                      <div className="flex justify-center text-slate-400">
                        <Upload className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {formContractFileName ? (
                          <span className="text-teal-700 font-bold">{formContractFileName}</span>
                        ) : (
                          <span>Kéo thả file vào đây hoặc nhấn để duyệt file</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-450">Hỗ trợ PDF, DOCX, PNG (Tối đa 15MB)</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setLogoImage(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-save-sponsor"
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-teal-600 hover:bg-teal-700 font-bold rounded-lg animate-fade-in"
                >
                  Thêm bảo trợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT/UPDATE SPONSOR DETAILS MODAL */}
      {editingSponsor && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800">
            <div className="bg-indigo-900 p-5 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">CHỈNH SỬA THÔNG TIN NHÀ TÀI TRỢ</h4>
                <p className="text-[11px] text-indigo-200 mt-1">Cập nhật thông tin chi tiết nhà đồng hành tài trợ.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSponsor(null)}
                className="text-white hover:text-pink-650 transition bg-transparent border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsorDetails} className="p-6 space-y-4 text-left">
              {/* Logo Select Section */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-205">
                <div className="relative shrink-0 w-12 h-12 rounded-lg bg-slate-200 border border-dashed border-indigo-650/30 flex items-center justify-center overflow-hidden">
                  {editLogoImage ? (
                    <img src={editLogoImage} className="w-full h-full object-contain" alt="Logo preview" />
                  ) : (
                    <span className="text-slate-400 text-[9px] font-bold text-center select-none">No Logo</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wide">Logo Doanh Nghiệp (Logo)</span>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold rounded cursor-pointer transition-all select-none">
                      Tải ảnh logo
                      <input type="file" accept="image/*" onChange={handleEditLogoUpload} className="hidden" />
                    </label>
                    {editLogoImage && (
                      <button
                        type="button"
                        onClick={() => setEditLogoImage(null)}
                        className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded border-none cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên Tập đoàn / Doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ví dụ: Medtronic VN"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Gói Partner Đồng Hành *</label>
                  <select
                    value={editTier}
                    onChange={(e: any) => setEditTier(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer font-semibold text-slate-700"
                  >
                    {sponsorPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.fee === 0 ? 'Miễn phí' : `${(pkg.fee / 1000000).toLocaleString()}tr`})
                      </option>
                    ))}
                    <option value="co_sponsor">Co-Sponsor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tổng tiền Thỏa thuận (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={editPledgedAmount}
                    onChange={(e) => setEditPledgedAmount(e.target.value)}
                    placeholder="ví dụ: 100000000"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Vị trí gian hàng</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editBoothLocation}
                    onChange={(e) => setEditBoothLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer font-semibold text-slate-700 bg-white"
                  >
                    <option value="auto">BTC tự sắp xếp / Tự chọn sau</option>
                    <option value="A1">Gian A1 (Khu Kim Cương)</option>
                    <option value="A2">Gian A2 (Khu Kim Cương)</option>
                    <option value="A3">Gian A3 (Khu Kim Cương)</option>
                    <option value="B1">Gian B1 (Khu Bạch Kim/Vàng)</option>
                    <option value="B2">Gian B2 (Khu Bạch Kim/Vàng)</option>
                    <option value="B3">Gian B3 (Khu Bạch Kim/Vàng)</option>
                    <option value="C1">Gian C1 (Khu Tiêu chuẩn)</option>
                    <option value="C2">Gian C2 (Khu Tiêu chuẩn)</option>
                    <option value="other">Khác / Vị trí đặc biệt...</option>
                  </select>

                  {editBoothLocation === 'other' && (
                    <input
                      type="text"
                      required
                      value={editCustomBoothLocation}
                      onChange={(e) => setEditCustomBoothLocation(e.target.value)}
                      placeholder="Mã gian hàng (ví dụ: D4)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên liên hệ</label>
                  <input
                    type="text"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    placeholder="ví dụ: Chị Linh"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">SĐT liên hệ</label>
                  <input
                    type="tel"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Mail liên hệ</label>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    placeholder="mail@..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Quyền lợi ký cam kết (Phân tách bằng dấu phẩy)</label>
                <textarea
                  value={editBenefitsListText}
                  onChange={(e) => setEditBenefitsListText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSponsor(null);
                    setEditLogoImage(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-indigo-900 hover:bg-indigo-950 font-bold rounded-lg cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT/UPDATE CONTRACT DETAILS MODAL */}
      {showContractModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800">
            <div className="bg-indigo-900 p-5 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">QUẢN LÝ PHÁP LÝ HỢP ĐỒNG</h4>
                <p className="text-[11px] text-indigo-200 mt-1">{showContractModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(null)}
                className="text-white hover:text-pink-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã Số Hợp Đồng *</label>
                  <input
                    type="text"
                    required
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Ngày Ký Hợp Đồng *</label>
                  <input
                    type="date"
                    required
                    value={contractSignDate}
                    onChange={(e) => setContractSignDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Trạng Thế Đàm Phán *</label>
                  <select
                    value={contractStatus}
                    onChange={(e: any) => setContractStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="draft">Bản thảo hợp tác</option>
                    <option value="pending_signature">Chờ ký kết (Song phương)</option>
                    <option value="signed">Đã ký hoàn chỉnh (Hiệu lực)</option>
                    <option value="expired">Đã hết hiệu lực</option>
                    <option value="cancelled">Đã hủy bỏ thỏa thuận</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Giá Trị Thực Tế HĐ *</label>
                  <input
                    type="number"
                    required
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Drag and drop contract file upload */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">File Hợp Đồng Đính Kèm (PDF / DOCX)</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingContract(true);
                  }}
                  onDragLeave={() => setIsDraggingContract(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingContract(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setContractFileUrl(reader.result as string || '#');
                        setContractFileName(file.name);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDraggingContract ? 'border-pink-500 bg-pink-50/50' : 'border-slate-205 bg-slate-50/60'
                  }`}
                >
                  <input
                    type="file"
                    id="modal-contract-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setContractFileUrl(reader.result as string || '#');
                          setContractFileName(file.name);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="modal-contract-file-input" className="cursor-pointer space-y-1 block select-none">
                    <div className="flex justify-center text-slate-400">
                      <Upload className="w-6 h-6 text-indigo-700" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {contractFileName ? (
                        <p className="text-indigo-900 font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          {contractFileName}
                        </p>
                      ) : (
                        <span>Kéo & thả file tại đây hoặc click để duyệt file</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Định dạng file PDF, DOCX, hoặc ảnh scan có hiệu lực</p>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowContractModal(null)}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-indigo-900 hover:bg-indigo-950 font-bold rounded-lg cursor-pointer"
                >
                  Ghi Lại Quyết Định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATED EVENT MANAGEMENT PAPER PREVIEW MODAL */}
      {previewSponsor && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-auto overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                <h4 className="font-bold text-sm tracking-wide">
                  XEM TRƯỚC HỢP ĐỒNG: {previewSponsor.contractNo}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSponsor(null)}
                className="text-white hover:text-pink-600 transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated legal paper with stamps */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div className="bg-white max-w-xl w-full p-8 shadow-sm rounded-lg border border-slate-200 relative select-none font-sans leading-relaxed text-xs">
                
                {/* Official National emblem text */}
                <div className="text-center space-y-1 mb-6">
                  <h5 className="font-extrabold uppercase text-[10px] tracking-wide text-slate-905">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>
                  <h6 className="font-bold text-[9px] tracking-widest text-slate-700">Độc lập - Tự do - Hạnh phúc</h6>
                  <div className="w-24 h-0.5 bg-slate-200 mx-auto mt-1" />
                </div>

                {/* Contract title */}
                <div className="text-center space-y-1.5 mb-6">
                  <h4 className="font-black text-xs uppercase text-slate-900 leading-snug">
                    HỢP ĐỒNG HỢP TÁC TÀI TRỢ & ĐỒNG HÀNH TRƯNG BÀY KHÔNG GIAN KHOA HỌC
                  </h4>
                  <p className="font-mono text-[9px] text-slate-450">Số: {previewSponsor.contractNo}</p>
                </div>

                {/* Contract info body */}
                <div className="space-y-4 text-slate-705 text-[11px]">
                  <p>Hôm nay, ngày {previewSponsor.contractSignDate || '.../.../2026'}, tại văn phòng Ban điều hành, chúng tôi gồm:</p>
                  
                  <div className="space-y-1.5">
                    <p className="font-extrabold text-slate-900 uppercase">BÊN A: BAN TỔ CHỨC HỘI NGHỊ PARS 2026</p>
                    <ul className="pl-3 list-disc space-y-1">
                      <li>Đơn vị: Ban Thư ký Hội nghị Khoa học Thẩm mỹ Toàn quốc PARS</li>
                      <li>Đại diện: GS.TS. Phạm Minh Chi - Trưởng Ban tổ chức</li>
                      <li>Địa chỉ văn phòng: Tổng thư ký PARS hội sở</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-extrabold text-slate-900 uppercase">BÊN B: {previewSponsor.name}</p>
                    <ul className="pl-3 list-disc space-y-1">
                      <li>Người liên hệ chính: {previewSponsor.contactPerson || 'Đại diện Bên B'}</li>
                      <li>Email liên lạc: {previewSponsor.contactEmail}</li>
                      <li>Số điện thoại: {previewSponsor.contactPhone}</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 uppercase">ĐIỀU 1: PHẠM VI HỢP TÁC & KINH PHÍ CAM KẾT</p>
                    <p>Bên B đồng ý bảo trợ kinh phí với tư cách là đối tác phân khúc hứa hẹn <b className="uppercase">{previewSponsor.tier} Partner</b>:</p>
                    <ul className="pl-3 list-disc space-y-1">
                      <li>Hạn ngạch bảo trợ thỏa thuận cam kết: <b className="text-pink-600">{(previewSponsor.contractValue || previewSponsor.pledgedAmount).toLocaleString()} VNĐ</b></li>
                      <li>Hình thức thanh toán: Chuyển khoản qua ngân hàng liên kết ERP</li>
                      <li>Thực tế lũy kế thu nhận đối soát: <b className="text-emerald-700">{(previewSponsor.paidAmount).toLocaleString()} VNĐ</b> (Hoàn thành {Math.round((previewSponsor.paidAmount / (previewSponsor.contractValue || previewSponsor.pledgedAmount)) * 100)}%)</li>
                      {previewSponsor.boothLocation && (
                        <li>Vị trí gian hàng trưng bày: <b>{previewSponsor.boothLocation === 'auto' ? 'Ban tổ chức sắp xếp' : previewSponsor.boothLocation}</b></li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 uppercase">ĐIỀU 2: CÁC QUYỀN LỢI ĐỒNG HÀNH BÊN B ĐƯỢC THIẾT LẬP</p>
                    <ol className="pl-4 list-decimal space-y-1">
                      {previewSponsor.benefitsSigned.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Stamp and signature placeholder */}
                  <div className="pt-8 grid grid-cols-2 text-center relative mt-12 min-h-[140px]">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">ĐẠI DIỆN BÊN B</p>
                      <p className="text-[9px] text-slate-400">(Ký, ghi rõ họ tên)</p>
                      <p className="pt-10 font-bold text-slate-800">{previewSponsor.contactPerson || 'Đại diện Bên B'}</p>
                    </div>

                    <div className="space-y-0.5 relative animate-fade-in">
                      <p className="font-bold text-slate-900">ĐẠI DIỆN BÊN A</p>
                      <p className="text-[9px] text-slate-400">(Ký, đóng dấu pháp nhân)</p>
                      
                      {/* RED CIRCULAR VIETNAMESE STAMP GRAPHIC ACCENT ON BÊN A */}
                      <div className="absolute right-[20%] top-[20px] w-20 h-20 rounded-full border-[3px] border-rose-600/70 opacity-80 flex items-center justify-center rotate-12 select-none pointer-events-none">
                        <div className="text-[7px] font-bold text-rose-600 text-center uppercase leading-none px-1">
                          PARS 2026<br />
                          <span className="text-[5px]">BAN TỔ CHỨC</span><br />
                          ★ ĐÃ KÝ ★
                        </div>
                      </div>

                      <p className="pt-10 font-bold text-slate-800">GS.TS. Phạm Minh Chi</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPreviewSponsor(null)}
                className="px-4 py-2 text-xs bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition"
              >
                Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const sponsorToDelete = sponsors.find(s => s.id === deleteConfirmId);
        if (!sponsorToDelete) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Xác nhận xóa nhà tài trợ</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa nhà tài trợ <span className="font-extrabold text-slate-800">{sponsorToDelete.name}</span> ({sponsorToDelete.id}) khỏi danh sách? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    store.deleteSponsor(deleteConfirmId);
                    loadAll();
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer border-none"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
