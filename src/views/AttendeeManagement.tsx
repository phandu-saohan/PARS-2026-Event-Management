/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Search, Filter, Trash, CheckCircle2, QrCode, Plus, Check, FileDown, Eye, RefreshCcw, Wifi, WifiOff, Sparkles, Printer, Award, FileSpreadsheet, Download, Database, Upload, Edit3, Save, AlertTriangle, User, Calendar, MapPin, Info, CreditCard, Tag, Phone, Mail, UserCheck, Cloud, X, Send, CalendarDays, ChevronRight, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { store, DEFAULT_CME_TEMPLATE_CONFIG } from '../dataStore';
import { Attendee, Role } from '../types';
import { emailQueue, EmailJobResult, QueueStatus } from '../lib/emailQueue';
import { campaignManager, CampaignState, CampaignStats } from '../lib/emailCampaign';

const parseCustomFieldsFromNotes = (notes: string | undefined): { label: string; value: string }[] | null => {
  if (!notes || !notes.includes('[Trường tùy chỉnh]')) return null;
  const parts = notes.split('[Trường tùy chỉnh]');
  if (parts.length < 2) return null;
  const lines = parts[1].split('\n').map(l => l.trim()).filter(Boolean);
  const fields: { label: string; value: string }[] = [];
  lines.forEach(line => {
    if (line.startsWith('- ')) {
      const content = line.substring(2);
      const colonIdx = content.indexOf(':');
      if (colonIdx >= 0) {
        const label = content.substring(0, colonIdx).trim();
        const value = content.substring(colonIdx + 1).trim();
        fields.push({ label, value });
      }
    }
  });
  return fields;
};

const getRemainingNotes = (notes: string | undefined): string => {
  if (!notes) return '';
  if (!notes.includes('[Trường tùy chỉnh]')) return notes;
  const parts = notes.split('[Trường tùy chỉnh]');
  return parts[0].trim();
};

const formatName = (title: string | undefined, fullName: string | undefined): string => {
  const fName = fullName || '';
  if (!title) return fName;
  const cleanTitle = title.trim();
  if (cleanTitle.toUpperCase() === 'BS' || cleanTitle.toUpperCase() === 'BS.') {
    return fName;
  }
  return `${cleanTitle} ${fName}`;
};

interface AttendeeManagementProps {
  role: Role;
}

export default function AttendeeManagement({ role }: AttendeeManagementProps) {
  const [attendees, setAttendees] = useState<Attendee[]>(store.getAttendees());
  const cmeConfig = store.getBusinessConfig().cmeTemplateConfig || DEFAULT_CME_TEMPLATE_CONFIG;
  
  // Filtering & searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'pending_verification'>('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked' | 'not_checked'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Extract unique sources list
  const uniqueSources = React.useMemo(() => {
    const list = attendees.map(a => a.source || 'website');
    return Array.from(new Set(list));
  }, [attendees]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, checkInFilter, sourceFilter]);

  // Monitor network status to allow online/offline actions dynamically
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update list reactively when background sync completes
  React.useEffect(() => {
    const handlePendingSyncUpdate = () => {
      loadAll();
    };
    window.addEventListener('pending-sync-updated', handlePendingSyncUpdate);
    return () => {
      window.removeEventListener('pending-sync-updated', handlePendingSyncUpdate);
    };
  }, []);
  
  // Custom manual delegate insert form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('BS');
  const [newFullName, setNewFullName] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPackage, setNewPackage] = useState('pkg-standard');
  const [newGender, setNewGender] = useState('Nam');
  const [newYearOfBirth, setNewYearOfBirth] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newProvince, setNewProvince] = useState('Hồ Chí Minh');
  const [newNationality, setNewNationality] = useState<'vietname' | 'foreign'>('vietname');
  const [newCmeRequired, setNewCmeRequired] = useState(false);
  const [newGalaRequired, setNewGalaRequired] = useState(false);
  const [newMasterclassRequired, setNewMasterclassRequired] = useState(false);
  const [newTourRequired, setNewTourRequired] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<'paid' | 'unpaid' | 'pending_verification'>('paid');
  const [newAvatarImage, setNewAvatarImage] = useState<string | null>(null);
  const [isNewAvatarUploading, setIsNewAvatarUploading] = useState(false);
  const [newDoctorProofImage, setNewDoctorProofImage] = useState<string | null>(null);
  const [isNewDoctorProofUploading, setIsNewDoctorProofUploading] = useState(false);
  const [newTransactionProofImage, setNewTransactionProofImage] = useState<string | null>(null);
  const [isNewTransactionProofUploading, setIsNewTransactionProofUploading] = useState(false);
  
  // Selected viewer for details modal
  const [viewDetailAttendee, setViewDetailAttendee] = useState<Attendee | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailEditForm, setDetailEditForm] = useState<Attendee | null>(null);
  
  // Custom QR Bank Transfer scanner component for unpaid attendees
  const [unpaidAttendeeForQR, setUnpaidAttendeeForQR] = useState<Attendee | null>(null);

  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // States for destination bank configurations
  const [bankId, setBankId] = useState<string>('MB');
  const [accountNo, setAccountNo] = useState<string>('10112026');
  const [accountHolder, setAccountHolder] = useState<string>('BAN TO CHUC PARS 2026');
  const [customFeeSurcharge, setCustomFeeSurcharge] = useState<number>(0);
  const [customMemoAdd, setCustomMemoAdd] = useState<string>('');

  // Helper to remove tones for reliable bank scanning
  const removeVietnameseTones = (str: string): string => {
    let result = str;
    result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    result = result.replace(/đ/g, "d");
    result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    result = result.replace(/Ò|Ó|Ọ|B|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    result = result.replace(/Đ/g, "D");
    return result.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  };

  // Kiosk/Fast Check-in console states
  const [kioskInput, setKioskInput] = useState('');
  const [kioskFeedback, setKioskFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showOfflineListModal, setShowOfflineListModal] = useState(false);
  const [offlineSearchQuery, setOfflineSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Interactive label paper thermal printer simulation
  const [autoPrintedAttendee, setAutoPrintedAttendee] = useState<Attendee | null>(null);
  const [isPrintingBadge, setIsPrintingBadge] = useState(false);

  // Modals for Certifications, Badges, and Bulk Uploads
  const [selectedCmeAttendee, setSelectedCmeAttendee] = useState<Attendee | null>(null);
  const [selectedBadgeAttendee, setSelectedBadgeAttendee] = useState<Attendee | null>(null);
  const [kioskCheckInAttendee, setKioskCheckInAttendee] = useState<Attendee | null>(null);
  const badgePrintRef = useRef<HTMLDivElement>(null);

  // States for sending quick notifications
  const [notifyAttendee, setNotifyAttendee] = useState<Attendee | null>(null);
  const [notifyTemplateId, setNotifyTemplateId] = useState<'tmpl-confirmation' | 'tmpl-reminder'>('tmpl-confirmation');
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notificationFeedback, setNotificationFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // States for sending ZNS in bulk
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
  const [showBulkZnsModal, setShowBulkZnsModal] = useState(false);
  const [bulkChannel, setBulkChannel] = useState<'zalo' | 'whatsapp'>('zalo');
  const [bulkZnsTemplateId, setBulkZnsTemplateId] = useState<string>('');
  const [bulkSendingStatus, setBulkSendingStatus] = useState<'idle' | 'sending' | 'completed'>('idle');
  const [bulkSendResults, setBulkSendResults] = useState<Array<{ name: string; phone: string; status: 'success' | 'failed'; detail?: string }>>([]);
  const [bulkProgress, setBulkProgress] = useState(0);

  // States for Email Queue bulk send (anti-spam)
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailTemplateId, setBulkEmailTemplateId] = useState<string>('');
  const [emailQueueStatus, setEmailQueueStatus] = useState<QueueStatus | null>(null);
  const [emailQueueRunning, setEmailQueueRunning] = useState(false);

  // States for multi-day Campaign Mode
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaign, setCampaign] = useState<CampaignState | null>(() => campaignManager.load());
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(() => {
    const c = campaignManager.load();
    return c ? campaignManager.getStats(c) : null;
  });
  const [campaignTemplateId, setCampaignTemplateId] = useState<string>('');
  const [campaignDailyLimit, setCampaignDailyLimit] = useState<number>(700);
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignQueueStatus, setCampaignQueueStatus] = useState<QueueStatus | null>(null);
  const [campaignName, setCampaignName] = useState<string>(`Chiến dịch Email PARS 2026 - ${new Date().toLocaleDateString('vi-VN')}`);

  const handleStartBulkZns = async () => {
    if (!bulkZnsTemplateId) {
      alert(`Vui lòng chọn mẫu tin nhắn ${bulkChannel === 'zalo' ? 'Zalo ZNS' : 'WhatsApp'} để tiến hành gửi hàng loạt.`);
      return;
    }
    
    setBulkSendingStatus('sending');
    setBulkProgress(0);
    setBulkSendResults([]);
    
    const selectedAttendees = attendees.filter(a => selectedAttendeeIds.includes(a.id));
    const results: typeof bulkSendResults = [];
    
    for (let i = 0; i < selectedAttendees.length; i++) {
      const att = selectedAttendees[i];
      try {
        const log = bulkChannel === 'zalo' 
          ? await store.sendZaloZNS(att, bulkZnsTemplateId)
          : await store.sendWhatsapp(att, bulkZnsTemplateId);
        results.push({
          name: formatName(att.title, att.fullName),
          phone: att.phone,
          status: log.status === 'success' ? 'success' : 'failed',
          detail: log.response?.message || 'Thành công'
        });
      } catch (err: any) {
        results.push({
          name: formatName(att.title, att.fullName),
          phone: att.phone,
          status: 'failed',
          detail: err.message || 'Lỗi gửi tin'
        });
      }
      setBulkProgress(Math.round(((i + 1) / selectedAttendees.length) * 100));
      setBulkSendResults([...results]);
      // small state-update delay to make progress bars and items render delightfully
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    
    setBulkSendingStatus('completed');
  };

  /**
   * handleStartBulkEmail — Gửi email hàng loạt qua EmailQueue chống Spam.
   * Xếp hàng, delay 2s/email, retry 2 lần với backoff, batch pause 8s/20 email.
   */
  const handleStartBulkEmail = useCallback(async () => {
    const selectedAttendees = attendees.filter(a => selectedAttendeeIds.includes(a.id));
    if (selectedAttendees.length === 0) return;

    // Build jobs cho EmailQueue
    const jobs = selectedAttendees.map(att => ({
      jobId: att.id,
      recipientName: formatName(att.title, att.fullName),
      recipientEmail: att.email,
      send: () => store.sendEmailQueued(att, undefined, undefined, bulkEmailTemplateId || undefined),
      meta: { attendeeId: att.id },
    }));

    // Reset và load queue
    emailQueue.load(jobs);
    setEmailQueueStatus(emailQueue.getStatus());
    setEmailQueueRunning(true);

    // Đăng ký observers để UI re-render real-time
    const onUpdate = (status: QueueStatus) => {
      setEmailQueueStatus({ ...status, results: [...status.results] });
    };
    emailQueue
      .on('start', onUpdate)
      .on('job_start', onUpdate)
      .on('job_done', onUpdate)
      .on('job_retry', onUpdate)
      .on('batch_pause', onUpdate)
      .on('delay_tick', onUpdate)
      .on('complete', onUpdate)
      .on('cancel', onUpdate);

    await emailQueue.run();

    // Cleanup listeners
    emailQueue
      .off('start', onUpdate)
      .off('job_start', onUpdate)
      .off('job_done', onUpdate)
      .off('job_retry', onUpdate)
      .off('batch_pause', onUpdate)
      .off('delay_tick', onUpdate)
      .off('complete', onUpdate)
      .off('cancel', onUpdate);

    setEmailQueueRunning(false);
  }, [attendees, selectedAttendeeIds, bulkEmailTemplateId]);

  // ── Campaign handlers ────────────────────────────────────────────────────

  const refreshCampaignState = useCallback((c: CampaignState) => {
    setCampaign(c);
    setCampaignStats(campaignManager.getStats(c));
  }, []);

  /** Tạo chiến dịch mới từ danh sách đã chọn */
  const handleCreateCampaign = useCallback(() => {
    const ids = selectedAttendeeIds.length > 0
      ? selectedAttendeeIds
      : attendees.map(a => a.id);
    if (ids.length === 0) { alert('Không có đại biểu nào!'); return; }
    if (!window.confirm(`Tạo chiến dịch gửi email cho ${ids.length.toLocaleString()} đại biểu?\n\nDự kiến: ~${Math.ceil(ids.length / campaignDailyLimit)} ngày (${campaignDailyLimit} email/ngày).\n\nChiến dịch cũ sẽ bị xóa nếu tồn tại.`)) return;
    const c = campaignManager.create({
      name: campaignName,
      templateId: campaignTemplateId,
      allIds: ids,
      dailyLimit: campaignDailyLimit,
    });
    refreshCampaignState(c);
    setCampaignQueueStatus(null);
  }, [attendees, selectedAttendeeIds, campaignName, campaignTemplateId, campaignDailyLimit, refreshCampaignState]);

  /** Gửi đợt hôm nay của chiến dịch đang active */
  const handleSendTodayBatch = useCallback(async () => {
    if (!campaign) return;
    const stats = campaignManager.getStats(campaign);
    if (!stats.canSendToday) { alert('Đã gửi đợt hôm nay rồi. Quay lại vào ngày mai nhé!'); return; }

    const batchIds = campaignManager.getTodaysBatch(campaign);
    const batchAttendees = attendees.filter(a => batchIds.includes(a.id));

    if (batchAttendees.length === 0) {
      alert('Không tìm thấy đại biểu trong đợt này trong danh sách hiện tại.');
      return;
    }

    const jobs = batchAttendees.map(att => ({
      jobId: att.id,
      recipientName: `${att.title || ''} ${att.fullName}`.trim(),
      recipientEmail: att.email,
      send: () => store.sendEmailQueued(att, undefined, undefined, campaign.templateId || undefined),
      meta: { attendeeId: att.id },
    }));

    // Load queue & register listeners
    emailQueue.load(jobs);
    setCampaignQueueStatus(emailQueue.getStatus());
    setCampaignSending(true);

    const onUpdate = (status: QueueStatus) => {
      setCampaignQueueStatus({ ...status, results: [...status.results] });
    };
    emailQueue
      .on('start', onUpdate).on('job_start', onUpdate).on('job_done', onUpdate)
      .on('job_retry', onUpdate).on('batch_pause', onUpdate).on('delay_tick', onUpdate)
      .on('complete', onUpdate).on('cancel', onUpdate);

    const finalStatus = await emailQueue.run();

    // Cleanup
    emailQueue
      .off('start', onUpdate).off('job_start', onUpdate).off('job_done', onUpdate)
      .off('job_retry', onUpdate).off('batch_pause', onUpdate).off('delay_tick', onUpdate)
      .off('complete', onUpdate).off('cancel', onUpdate);

    // Build results map for campaign manager
    const resultsMap: Record<string, 'success' | 'failed' | 'permanent_fail'> = {};
    for (const r of finalStatus.results) {
      if (r.status === 'success') resultsMap[r.jobId] = 'success';
      else if (r.error && /550|invalid.*email|no such user/i.test(r.error)) resultsMap[r.jobId] = 'permanent_fail';
      else resultsMap[r.jobId] = 'failed';
    }

    const updated = campaignManager.recordBatchResult(campaign, batchIds, resultsMap);
    refreshCampaignState(updated);
    setCampaignSending(false);
  }, [campaign, attendees, refreshCampaignState]);

  const handleOpenNotifyModal = (att: Attendee, tempId: 'tmpl-confirmation' | 'tmpl-reminder' = 'tmpl-confirmation') => {
    setNotifyAttendee(att);
    setNotifyTemplateId(tempId);
    setNotificationFeedback(null);
    
    const title = att.title && att.title !== 'BS' && att.title !== 'BS.' ? att.title : 'Quý đại biểu';
    const fullname = att.fullName || '';
    const code = att.id || '';
    const pkg = att.packageName || 'Gói Đại Biểu Tiêu Chuẩn';
    const payStatusText = att.paymentStatus === 'paid' ? 'Đã Thanh Toán' : att.paymentStatus === 'pending_verification' ? 'Chờ Đối Soát' : 'Chưa Thanh Toán';
    const org = att.organization || 'Bệnh viện';

    if (tempId === 'tmpl-confirmation') {
      setNotifySubject(`🎯 [PARS 2026] Thư xác nhận đăng ký & đóng phí tham gia hội nghị`);
      setNotifyBody(
`Kính gửi ${title} ${fullname},

Ban Tổ chức Hội nghị Khoa học Thẩm mỹ Quốc tế PARS 2026 xin trân trọng thông báo hồ sơ đăng ký tham gia hội nghị của Quý đại biểu đã được xác nhận hoàn tất thành công.

Thông tin chi tiết tham dự:
- Mã số Đại biểu: ${code}
- Gói đăng ký: ${pkg}
- Trạng thái đóng phí: ${payStatusText}
- Cơ quan: ${org}
- Thời gian: Ngày 11-12 tháng 12 năm 2026
- Địa điểm: Trung tâm Hội nghị Quốc tế PARS (TP.HCM)

Quý đại biểu vui lòng lưu lại email này để nhận Thẻ đeo chính thức (Name-Badge) và tài liệu hội nghị tại bàn đón tiếp.

Ban Tổ chức rất hân hạnh được đón tiếp Quý đại biểu tại hội nghị sắp tới.

Trân trọng,
Ban Thư ký Hội nghị PARS 2026`
      );
    } else {
      setNotifySubject(`⏳ [PARS 2026] Nhắc hoàn thành đóng phí đăng ký tham dự Hội nghị`);
      setNotifyBody(
`Kính gửi ${title} ${fullname},

Ban Tổ chức Hội nghị Khoa học Thẩm mỹ Quốc tế PARS 2026 xin trân trọng cảm ơn Quý đại biểu đã đăng ký tham gia hội nghị.

Hiện tại, hệ thống ghi nhận trạng thái phí tham dự của Quý đại biểu là: ${payStatusText} (${pkg}).

Để đảm bảo quyền lợi tham dự và nhận tài liệu chính thức, Quý đại biểu vui lòng hoàn tất đóng phí bằng hình thức chuyển khoản:
- Ngân hàng: Quân Đội (MB)
- Số tài khoản: 10112026
- Tên tài khoản: BAN TO CHUC PARS 2026
- Nội dung chuyển khoản: ${code} ${fullname}

Sau khi nhận được chuyển khoản, Ban Thư ký sẽ tiến hành đối soát nhanh và gửi email xác nhận cùng Mã QR Check-in chính thức.

Mọi thắc mắc xin liên hệ Hotline: 090 123 4567.

Trân trọng,
Ban Thư ký Hội nghị PARS 2026`
      );
    }
  };

  const handleSendQuickNotification = async () => {
    if (!notifyAttendee) return;
    setIsSendingNotification(true);
    setNotificationFeedback(null);

    try {
      const log = await store.sendEmail(notifyAttendee, notifySubject, notifyBody);
      
      if (log.status === 'success') {
        setNotificationFeedback({
          success: true,
          msg: `Đã gửi thành công email thông báo tới ${notifyAttendee.fullName} (${notifyAttendee.email})!`
        });
      } else {
        setNotificationFeedback({
          success: false,
          msg: `Máy chủ báo lỗi: ${log.response?.message || log.response?.error || 'Không thể truyền phát qua SMTP.'}`
        });
      }
    } catch (err: any) {
      setNotificationFeedback({
        success: false,
        msg: `Có lỗi xảy ra khi kết nối: ${err?.message || 'Không thể gửi email'}`
      });
    } finally {
      setIsSendingNotification(false);
    }
  };
  
  const handlePrintBadge = useReactToPrint({
    contentRef: badgePrintRef,
    documentTitle: selectedBadgeAttendee ? `NAME_BADGE_${selectedBadgeAttendee.id}` : 'NAME_BADGE',
  });

  // Auto-print effect when badge print modal is opened
  React.useEffect(() => {
    if (selectedBadgeAttendee) {
      const isAutoPrint = localStorage.getItem('pars_printer_autoprint') === 'true';
      if (isAutoPrint) {
        const timer = setTimeout(() => {
          handlePrintBadge();
        }, 800); // 800ms allows modal animation and QR image to load
        return () => clearTimeout(timer);
      }
    }
  }, [selectedBadgeAttendee, handlePrintBadge]);

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get all rows as array of arrays
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          const outputLines: string[] = [];
          let skippedHeader = false;
          let parsedCount = 0;
          
          rows.forEach((parts, index) => {
            if (!parts || parts.length === 0) return;
            
            // Check if first line is a header
            const rowStr = parts.map(p => p !== null && p !== undefined ? String(p) : '').join(' ').toLowerCase();
            if (index === 0 && (
              rowStr.includes('học vị') || 
              rowStr.includes('fullname') || 
              rowStr.includes('họ và tên') || 
              rowStr.includes('điện thoại') || 
              rowStr.includes('email') || 
              rowStr.includes('cccd') ||
              rowStr.includes('title') ||
              rowStr.includes('phone') ||
              rowStr.includes('cơ quan')
            )) {
              skippedHeader = true;
              return; // skip header
            }
            
            if (parts.length >= 2) {
              const title = parts[0] !== null && parts[0] !== undefined ? String(parts[0]).trim() : 'BS.';
              const name = parts[1] !== null && parts[1] !== undefined ? String(parts[1]).trim() : '';
              const phone = parts[2] !== null && parts[2] !== undefined ? String(parts[2]).trim() : '';
              const email = parts[3] !== null && parts[3] !== undefined ? String(parts[3]).trim() : '';
              const org = parts[4] !== null && parts[4] !== undefined ? String(parts[4]).trim() : '';
              const yob = parts[5] !== null && parts[5] !== undefined ? String(parts[5]).trim() : '';
              const cccd = parts[6] !== null && parts[6] !== undefined ? String(parts[6]).trim() : '';
              
              if (name) {
                outputLines.push(`${title} | ${name} | ${phone} | ${email} | ${org} | ${yob} | ${cccd}`);
                parsedCount++;
              }
            }
          });
          
          if (parsedCount > 0) {
            setBulkInputText(outputLines.join('\n'));
            setUploadFeedback(`📥 Tải file Excel thành công! Đã trích xuất ${parsedCount} đại biểu từ tệp "${file.name}" ${skippedHeader ? '(bỏ dòng tiêu đề)' : ''}.`);
            playSoundSound('success');
          } else {
            alert('Không tìm thấy dữ liệu hợp lệ trong tệp Excel. Hãy chắc chắn tệp chứa ít nhất 2 cột (Học vị và Họ tên)');
          }
        } catch (error) {
          console.error(error);
          alert('Có lỗi xảy ra khi đọc tệp Excel. Vui lòng kiểm tra lại định dạng tệp.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        
        const lines = text.split(/\r?\n/);
        const outputLines: string[] = [];
        let skippedHeader = false;
        let parsedCount = 0;
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          
          // Auto-detect delimiter: pipe, semicolon, tab, or comma
          let delimiter = '|';
          if (trimmed.includes('|')) {
            delimiter = '|';
          } else if (trimmed.includes(';')) {
            delimiter = ';';
          } else if (trimmed.includes('\t')) {
            delimiter = '\t';
          } else if (trimmed.includes(',')) {
            delimiter = ',';
          }
          
          const parts = trimmed.split(delimiter).map(p => {
            let s = p.trim();
            if (s.startsWith('"') && s.endsWith('"')) {
              s = s.substring(1, s.length - 1).trim();
            }
            return s;
          });
          
          // Check if first line is a header
          if (index === 0 && (
            trimmed.toLowerCase().includes('học vị') || 
            trimmed.toLowerCase().includes('fullname') || 
            trimmed.toLowerCase().includes('họ và tên') || 
            trimmed.toLowerCase().includes('điện thoại') || 
            trimmed.toLowerCase().includes('email') || 
            trimmed.toLowerCase().includes('cccd') ||
            trimmed.toLowerCase().includes('title') ||
            trimmed.toLowerCase().includes('phone') ||
            trimmed.toLowerCase().includes('cơ quan')
          )) {
            skippedHeader = true;
            return; // skip parsing header line
          }
          
          if (parts.length >= 2) {
            const title = parts[0] || 'BS.';
            const name = parts[1] || '';
            const phone = parts[2] || '';
            const email = parts[3] || '';
            const org = parts[4] || '';
            const yob = parts[5] || '';
            const cccd = parts[6] || '';
            
            if (name) {
              outputLines.push(`${title} | ${name} | ${phone} | ${email} | ${org} | ${yob} | ${cccd}`);
              parsedCount++;
            }
          }
        });
        
        if (parsedCount > 0) {
          setBulkInputText(outputLines.join('\n'));
          setUploadFeedback(`📥 Tải file thành công! Đã trích xuất ${parsedCount} đại biểu từ tệp "${file.name}" ${skippedHeader ? '(bỏ dòng tiêu đề)' : ''}.`);
          playSoundSound('success');
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong tệp. Hãy chắc chắn tệp CSV/TXT chứa ít nhất 2 cột (Học vị và Họ tên)');
        }
      };
      reader.readAsText(file);
    }
  };

  const [showCmeDeclarationModal, setShowCmeDeclarationModal] = useState(false);

  const loadAll = () => {
    setAttendees([...store.getAttendees()]);
  };



  const playSoundEffect = (type: 'success' | 'fail' = 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched clean chirp
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, ctx.currentTime); // Buzz
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio Context muted or not allowed yet:', e);
    }
  };

  const handleToggleCheckIn = (id: string) => {
    const attendeesList = store.getAttendees();
    const found = attendeesList.find(a => a.id === id);
    if (found) {
      found.isCheckedIn = !found.isCheckedIn;
      found.checkInTime = found.isCheckedIn 
        ? new Date().toISOString().replace('T', ' ').substring(0, 16) 
        : undefined;
      store.saveAttendee(found);
      
      if (found.isCheckedIn) {
        playSoundSound('success');
        
        // Auto show simulated heat label sticker rolling out
        setAutoPrintedAttendee(found);
        setIsPrintingBadge(true);
        setTimeout(() => {
          setIsPrintingBadge(false);
        }, 3500);

        // Auto print badge if enabled in settings
        if (localStorage.getItem('pars_printer_autoprint') === 'true') {
          setSelectedBadgeAttendee(found);
        }
      }
      loadAll();
    }
  };

  const playSoundSound = (type: 'success' | 'fail') => {
    playSoundEffect(type);
  };

  const handleSyncOfflineData = async () => {
    setIsSyncingOffline(true);
    try {
      const result = await store.syncPendingAttendees();
      if (result.success) {
        alert("Đồng bộ dữ liệu ngoại tuyến lên hệ thống thành công!");
      } else {
        alert(`Đồng bộ hoàn tất với ${result.errorCount} lỗi. Vui lòng kiểm tra lại kết nối mạng.`);
      }
      loadAll();
    } catch (err: any) {
      alert("Có lỗi xảy ra khi đồng bộ: " + (err?.message || err));
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Direct USB / Hardware Scanner Checkin Handler
  const handleDirectScannerCheckIn = (scannedCode: string) => {
    const list = store.getAttendees();
    const prefix = store.getBusinessConfig().attendeeIdPrefix || 'PARS2026';
    const cleanCode = scannedCode.replace(`${prefix}-`, '').trim();
    const found = list.find(a => 
      a.id.toLowerCase() === scannedCode.toLowerCase() || 
      a.id.toLowerCase() === cleanCode.toLowerCase() || 
      a.phone === scannedCode || 
      a.qrCodeValue.toLowerCase() === scannedCode.toLowerCase()
    );

    if (found) {
      if (found.isCheckedIn) {
        playSoundSound('fail');
        setKioskFeedback({
          success: false,
          msg: `[THIẾT BỊ QUÉT] Đại biểu ${found.title} ${found.fullName} đã điểm danh trước đó!`
        });
      } else {
        found.isCheckedIn = true;
        found.checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
        store.saveAttendee(found);
        playSoundSound('success');

        // Dynamic visual printer ticker
        setAutoPrintedAttendee(found);
        setIsPrintingBadge(true);
        setTimeout(() => {
          setIsPrintingBadge(false);
        }, 3500);

        // Auto print badge if enabled in settings
        if (localStorage.getItem('pars_printer_autoprint') === 'true') {
          setSelectedBadgeAttendee(found);
        }

        setKioskFeedback({
          success: true,
          msg: `[MÁY QUÉT VẬT LÝ ⚡] Đón tiếp BS: ${found.title} ${found.fullName} || Vé: ${found.packageName}`
        });
        loadAll();
      }
    } else {
      playSoundSound('fail');
      setKioskFeedback({
        success: false,
        msg: `[MÁY QUÉT VẬT LÝ] Không khớp mã quét: "${scannedCode}"`
      });
    }
    setTimeout(() => setKioskFeedback(null), 5000);
  };

  // Hardware scanner global hook
  React.useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore global key captures when writing in normal text controls
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      const currentTime = Date.now();
      // Scanners transmit extremely fast (< 45ms between keystrokes)
      if (currentTime - lastKeyTime > 120) {
        buffer = ''; 
      }
      lastKeyTime = currentTime;

      if (e.key.length === 1) {
        buffer += e.key;
      } else if (e.key === 'Enter') {
        const checkinCode = buffer.trim().toUpperCase();
        if (checkinCode) {
          handleDirectScannerCheckIn(checkinCode);
        }
        buffer = '';
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [attendees]);

  // Bulk past lists of attendees
  const handleBulkImportTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInputText.trim()) return;

    // Parse pasted lines from CSV or tab separated fields
    // Formats supported: Title | Full Name | Phone | Email | Organization | yearOfBirth | CCCD
    const lines = bulkInputText.split('\n');
    let count = 0;

    const existingAttendees = store.getAttendees();
    let maxSeq = existingAttendees.reduce((max, att) => {
      const match = att.id.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        return num > max ? num : max;
      }
      return max;
    }, existingAttendees.length);

    lines.forEach(line => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length >= 3 && parts[1]) {
        const titleVal = parts[0] || 'BS.';
        const nameVal = parts[1].toUpperCase();
        const phoneVal = parts[2].replace(/\s+/g, '');
        const emailVal = parts[3] || `${nameVal.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
        const orgVal = parts[4] || 'Sở Y Tế';
        const yob = parts[5] || '1985';
        const cccd = parts[6] || '';

        maxSeq++;
        const padSeq = String(maxSeq).padStart(3, '0');
        const prefix = store.getBusinessConfig().attendeeIdPrefix || 'PARS2026';
        const newId = `${prefix}-${padSeq}`;
        const autoAttendee: Attendee = {
          id: newId,
          title: titleVal,
          fullName: nameVal,
          organization: orgVal,
          department: 'Thẩm mỹ & Tạo hình',
          phone: phoneVal,
          email: emailVal,
          address: 'Hồ Chí Minh',
          nationality: 'vietname',
          packageId: 'pkg-standard',
          packageName: 'Gói Đại Biểu Tiêu Chuẩn',
          packageFee: 1500000,
          paymentStatus: 'paid', // invitees are pre-paid
          paymentMethod: 'bank_transfer',
          registrationDate: new Date().toISOString().split('T')[0],
          qrCodeValue: `${newId}-${nameVal.replace(/\s+/g, '')}`,
          isCheckedIn: false,
          yearOfBirth: yob,
          gender: 'Nam',
          cmeRequired: !!cccd,
          cmeIdentityNo: cccd || undefined,
          province: 'Hồ Chí Minh'
        };

        store.saveAttendee(autoAttendee);
        count++;
      }
    });

    if (count > 0) {
      playSoundSound('success');
      alert(`Đã nạp thành công bộ lọc danh bạ ${count} đại biểu Bác sĩ thư mời vào bộ cơ sở!`);
      setShowBulkForm(false);
      setBulkInputText('');
      setUploadFeedback(null);
      loadAll();
    } else {
      alert('Không phân giải được dữ liệu hàng loạt. Vui lòng nhập đúng định dạng phân tách bằng dấu gạch đứng (|)');
    }
  };



  const handleKioskCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskInput) return;
    
    const token = kioskInput.trim().toUpperCase();
    const attendeesList = store.getAttendees();
    const found = attendeesList.find(a => a.id === token || a.phone === token || a.qrCodeValue === token);
    
    if (found) {
      setKioskCheckInAttendee(found);
      setKioskFeedback(null);
    } else {
      playSoundSound('fail');
      setKioskFeedback({
        success: false,
        msg: `Không tìm thấy thông tin đại biểu có ID/SĐT: "${token}"`
      });
      setTimeout(() => {
        setKioskFeedback(null);
      }, 5000);
    }
    setKioskInput('');
  };

  const handleConfirmKioskCheckIn = (attendee: Attendee) => {
    const list = store.getAttendees();
    const found = list.find(a => a.id === attendee.id);
    if (!found) return;

    if (!found.isCheckedIn) {
      found.isCheckedIn = true;
      found.checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
      store.saveAttendee(found);
      playSoundSound('success');

      // Auto show simulated heat label sticker rolling out
      setAutoPrintedAttendee(found);
      setIsPrintingBadge(true);
      setTimeout(() => {
        setIsPrintingBadge(false);
      }, 3500);


    } else {
      playSoundSound('success');
    }

    // Open badge printer modal
    setSelectedBadgeAttendee(found);
    // Close Kiosk info modal
    setKioskCheckInAttendee(null);
    loadAll();
  };



  const handleUpdatePayment = (id: string, newStatus: 'paid' | 'unpaid' | 'pending_verification') => {
    // CTV is banned from altering finances
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền thay đổi trạng thái đóng phí đại biểu!');
      return;
    }
    const attendeesList = store.getAttendees();
    const found = attendeesList.find(a => a.id === id);
    if (found) {
      const oldStatus = found.paymentStatus;
      found.paymentStatus = newStatus;
      store.saveAttendee(found);
      
      if (oldStatus !== 'paid' && newStatus === 'paid') {
        try {
          const templates = store.getTemplates();
          const zTmpl = templates.find(t => t.channel === 'zalo' && t.type === 'payment_confirmed');
          const eTmpl = templates.find(t => t.channel === 'email' && t.type === 'payment_confirmed');
          const wTmpl = templates.find(t => t.channel === 'whatsapp' && t.type === 'payment_confirmed');

          store.sendZaloZNS(found, zTmpl?.id || 'payment_confirmed');
          store.sendEmail(found, undefined, undefined, eTmpl?.id || 'payment_confirmed');
          store.sendWhatsapp(found, wTmpl?.id || 'payment_confirmed');
        } catch (err) {
          console.error('Lỗi gửi tin nhắn khi cập nhật trạng thái thanh toán:', err);
        }
      }
      
      loadAll();
    }
  };

  const handleDeleteAttendee = (id: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền xóa hồ sơ đại biểu!');
      return;
    }
    setDeleteConfirmId(id);
  };

  const handleNewAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsNewAvatarUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarImage(reader.result as string);
        setIsNewAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewDoctorProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsNewDoctorProofUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDoctorProofImage(reader.result as string);
        setIsNewDoctorProofUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditDoctorProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && detailEditForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetailEditForm({
          ...detailEditForm,
          doctorProofUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditDoctorProof = () => {
    if (detailEditForm) {
      setDetailEditForm({
        ...detailEditForm,
        doctorProofUrl: undefined
      });
    }
  };

  const handleNewTransactionProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsNewTransactionProofUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTransactionProofImage(reader.result as string);
        setIsNewTransactionProofUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditTransactionProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && detailEditForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetailEditForm({
          ...detailEditForm,
          transactionProofUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditTransactionProof = () => {
    if (detailEditForm) {
      setDetailEditForm({
        ...detailEditForm,
        transactionProofUrl: undefined
      });
    }
  };

  const handleAddManualDelegate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newOrg || !newPhone || !newEmail || !newAddress) {
      alert('Vui lòng điền đủ họ tên, cơ quan, số điện thoại, email và địa chỉ liên hệ.');
      return;
    }

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
    const prefix = store.getBusinessConfig().attendeeIdPrefix || 'PARS2026';
    const newId = `${prefix}-${padSeq}`;
    const packages = store.getPackages();
    const selectedPkg = packages.find(p => p.id === newPackage) || packages[0];

    const manualDelegate: Attendee = {
      id: newId,
      title: newTitle,
      fullName: newFullName.toUpperCase(),
      organization: newOrg,
      department: '',
      phone: newPhone,
      email: newEmail,
      address: newAddress.trim(),
      province: newProvince,
      nationality: newNationality,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      packageFee: selectedPkg.fee,
      paymentStatus: newPaymentStatus,
      paymentMethod: 'cash',
      registrationDate: new Date().toISOString().split('T')[0],
      qrCodeValue: `${newId}-${newFullName.toUpperCase().replace(/\s+/g, '')}`,
      isCheckedIn: false,
      gender: newGender,
      yearOfBirth: newYearOfBirth,
      cmeRequired: newCmeRequired,
      galaRequired: newGalaRequired,
      masterclassRequired: newMasterclassRequired,
      tourRequired: newTourRequired,
      avatarUrl: newAvatarImage || undefined,
      doctorProofUrl: newDoctorProofImage || undefined,
      transactionProofUrl: newTransactionProofImage || undefined,
    };

    store.saveAttendee(manualDelegate);
    
    // Auto-trigger notifications
    try {
      store.sendZaloZNS(manualDelegate);
      store.sendEmail(manualDelegate);
      store.sendWhatsapp(manualDelegate);

      // If the manual delegate is created with payment status 'paid', trigger payment confirmation notifications
      if (manualDelegate.paymentStatus === 'paid') {
        const templates = store.getTemplates();
        const zTmpl = templates.find(t => t.channel === 'zalo' && t.type === 'payment_confirmed');
        const eTmpl = templates.find(t => t.channel === 'email' && t.type === 'payment_confirmed');
        const wTmpl = templates.find(t => t.channel === 'whatsapp' && t.type === 'payment_confirmed');

        store.sendZaloZNS(manualDelegate, zTmpl?.id || 'payment_confirmed');
        store.sendEmail(manualDelegate, undefined, undefined, eTmpl?.id || 'payment_confirmed');
        store.sendWhatsapp(manualDelegate, wTmpl?.id || 'payment_confirmed');
      }
    } catch (err) {
      console.error('Failed to trigger manual delegate auto notifications:', err);
    }

    setShowAddForm(false);
    
    // reset form fields
    setNewFullName('');
    setNewOrg('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewProvince('Hồ Chí Minh');
    setNewYearOfBirth('');
    setNewGender('Nam');
    setNewNationality('vietname');
    setNewCmeRequired(false);
    setNewGalaRequired(false);
    setNewMasterclassRequired(false);
    setNewTourRequired(false);
    setNewPaymentStatus('paid');
    setNewAvatarImage(null);
    setNewDoctorProofImage(null);
    setNewTransactionProofImage(null);
    
    loadAll();
  };

  // Simulated Excel/CSV download
  const handleExportCSV = () => {
    const filteredRows = getFilteredAttendees();
    let csvContent = 'ID,Danh xưng,Họ và tên,Cơ quan,Số ĐT,Email,Số CCCD,Địa chỉ liên hệ,Ngày đăng ký,Gói Đăng Ký,Phí (VNĐ),Thanh Toán,Check In,Yêu cầu hóa đơn,Chi tiết hóa đơn\n';
    
    filteredRows.forEach(a => {
      const invReq = a.invoiceInfo?.required ? (a.invoiceInfo.type === 'company' ? 'Công ty' : 'Cá nhân') : 'Không';
      let invDetail = '';
      if (a.invoiceInfo?.required) {
        if (a.invoiceInfo.type === 'company') {
          invDetail = `Cty: ${a.invoiceInfo.companyName} | MST: ${a.invoiceInfo.taxNo} | ĐC: ${a.invoiceInfo.address} | SĐT: ${a.invoiceInfo.phone} | Email: ${a.invoiceInfo.email}`;
        } else {
          invDetail = `Cá nhân: ${a.invoiceInfo.name} | CCCD: ${a.invoiceInfo.idNo} | ĐC: ${a.invoiceInfo.address} | SĐT: ${a.invoiceInfo.phone} | Email: ${a.invoiceInfo.email}`;
        }
      }
      csvContent += `"${a.id}","${a.title}","${a.fullName}","${a.organization}","${a.phone}","${a.email}","${a.cmeIdentityNo || ''}","${(a.address || '').replace(/"/g, '""')}","${a.registrationDate || ''}","${a.packageName}",${a.packageFee},"${a.paymentStatus}","${a.isCheckedIn ? 'Đã có mặt' : 'Chưa'}","${invReq}","${invDetail.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DS_Dai_Bieu_PARS2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredAttendees = () => {
    return attendees.filter(a => {
      const matchQuery = 
        a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = 
        statusFilter === 'all' || 
        a.paymentStatus === statusFilter;

      const matchCheckIn = 
        checkInFilter === 'all' || 
        (checkInFilter === 'checked' && a.isCheckedIn) ||
        (checkInFilter === 'not_checked' && !a.isCheckedIn);

      const matchSource = 
        sourceFilter === 'all' || 
        (a.source || 'website') === sourceFilter;

      return matchQuery && matchStatus && matchCheckIn && matchSource;
    });
  };

  const filteredData = getFilteredAttendees();

  // Calculate pagination values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Generate intelligent page numbers (1, 2, ..., last)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* TRẠM ĐIỀU KHIỂN SẢNH TIẾP ĐÓN - ONLINE/OFFLINE & MÁY QUÉT Honeywell/Zebra */}
      <div className="bg-[#111c3a] text-white p-4 rounded-xl border border-slate-700/50 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#be6940]/10 flex items-center justify-center border border-[#be6940]/25 text-[#be6940]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[12.5px] font-black uppercase tracking-wide">Bộ Điều Khiển Sảnh Thao Tác Trực Tiếp</h4>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold uppercase tracking-wider">PARS v2.6 Ready</span>
            </div>
            <p className="text-[11px] text-slate-350 flex items-center gap-1.5 mt-0.5">
              <span>Đầu đọc cổng USB Zebra/Honeywell:</span>
              <span className="inline-flex items-center gap-1 text-emerald-450 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-ping"></span>
                LIVE LISTENING
              </span>
              <span className="text-slate-500 font-mono">| Nhấp phím bất kỳ ngoài form để quét tự động</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowOfflineListModal(true)}
            className="px-3.5 py-1.5 text-[10.5px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            Danh sách offline
          </button>
        </div>
      </div>
 
       {/* Sync Flash Message Alert */}
       {syncFeedback && (
         <div className="p-3 rounded-lg border text-xs font-bold flex items-center gap-2 animate-bounce bg-emerald-50 border-emerald-200 text-emerald-800">
           <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
           <span>{syncFeedback}</span>
         </div>
       )}

      {/* INSTANT AUTOMATED BADGE PRINTING VISUALIZER STRIP */}
      {isPrintingBadge && autoPrintedAttendee && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white shadow-xl animate-fade-in flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-1 bg-rose-600 text-[8px] font-mono tracking-widest font-bold px-2 text-white">THERMAL PRINT STREAM</div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-600/15 border border-orange-500/20 text-orange-400 animate-pulse">
              <Printer className="w-5 h-5 font-bold" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-orange-300 uppercase tracking-widest">Đang kết xuất in nhãn sticker sảnh (8cm x 5cm)...</p>
              <h5 className="text-xs font-extrabold text-white mt-0.5 animate-pulse">
                Bản ghi: {formatName(autoPrintedAttendee.title, autoPrintedAttendee.fullName)} - {autoPrintedAttendee.organization}
              </h5>
            </div>
          </div>
          {/* Animated paper rolling effect */}
          <div className="bg-white text-slate-900 text-[8px] font-mono font-bold p-1 bg-gradient-to-b from-white to-slate-200 rounded animate-bounce shadow-md">
            📄 IN_BADGE_SUCCESS
          </div>
        </div>
      )}

      {/* PHÂN HỆ QUẦY ĐIỂM DANH LỄ TÂN HỘI NGHỊ (REAL-TIME DESK) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Check-in statistics & general overview */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Tiến Độ Điểm Danh (Check-In)</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse">Đồng bộ tự chuyển</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Tổng</span>
                <span className="text-xl font-black text-slate-900 font-mono">{attendees.length}</span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-center">
                <span className="text-[9px] text-emerald-650 font-bold block uppercase">Có mặt</span>
                <span className="text-xl font-black text-emerald-800 font-mono">{attendees.filter(a => a.isCheckedIn).length}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 block uppercase">Vắng</span>
                <span className="text-xl font-black text-slate-500 font-mono">{attendees.filter(a => !a.isCheckedIn).length}</span>
              </div>
            </div>

            {/* Geometric ProgressBar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-650">
                <span>Tỷ lệ lấp đầy sảnh hội trường</span>
                <span className="font-mono text-indigo-600">
                  {attendees.length > 0 ? Math.round((attendees.filter(a => a.isCheckedIn).length / attendees.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden relative">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-700 ease-out" 
                  style={{ width: `${attendees.length > 0 ? (attendees.filter(a => a.isCheckedIn).length / attendees.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed">
            * Kiosk hỗ trợ tìm kiếm theo <strong>Số điện thoại</strong>, <strong>Mã số đại biểu</strong> (ví dụ: ATT-8273) để điểm danh tức thì và phát âm thanh phản hồi trực quan.
          </p>
        </div>

        {/* Right Card: Instant Check-In & Scanner Simulator */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Bàn Tiếp Đón & Quét Mã Lễ Tân</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded uppercase">Mạng Nội Bộ</span>
            </div>

            <div className="space-y-3">
              {/* Form Manual Kiosk Check-In */}
              <form onSubmit={handleKioskCheckIn} className="space-y-3">
                <p className="text-[10px] font-bold text-indigo-950 uppercase tracking-wide">Số điện thoại hoặc mã số:</p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={kioskInput}
                    onChange={(e) => setKioskInput(e.target.value)}
                    placeholder="ví dụ: 0912345678 hoặc ATT-3928..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 uppercase font-mono font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm border-none"
                  >
                    Check
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 leading-snug">Ấn Enter hoặc click để ghi nhận điểm danh tự động.</p>
              </form>
            </div>
          </div>

          {/* Feedback response toast panel inside block */}
          <div className="mt-4 min-h-[40px] flex items-center">
            {kioskFeedback ? (
              <div className={`w-full p-2.5 rounded-lg border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                kioskFeedback.success 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <span className="text-sm">{kioskFeedback.success ? '✓' : '✗'}</span>
                <span className="flex-1">{kioskFeedback.msg}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Thanh trạng thái tiếp nhận thông tin phản hồi từ hệ thống camera & bàn đăng ký...</span>
            )}
          </div>
        </div>
      </div>

      {/* Top dashboard actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Searching input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên, SĐT, ID..."
              className="pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-lg text-xs font-semibold focus:outline-none placeholder-slate-400 transition-all uppercase w-60"
            />
          </div>

          {/* Filtering dropdowns */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tất cả Thanh toán</option>
            <option value="paid">Đã đóng phí</option>
            <option value="pending_verification">Đang chờ đối soát</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>

          <select
            value={checkInFilter}
            onChange={(e: any) => setCheckInFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tất cả Điểm danh (Check-In)</option>
            <option value="checked">Đã điểm danh</option>
            <option value="not_checked">Chưa điểm danh</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e: any) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tất cả Nguồn</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-attendee-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Sổ Cái Excel (CSV)
          </button>

          <button
            id="btn-export-cme-moh"
            onClick={() => setShowCmeDeclarationModal(true)}
            className="px-3.5 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-805 border border-amber-200 text-amber-800 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Xuất biểu mẫu danh sách CME điểm danh gửi Sở Y Tế nghiệm thu hoàn tất"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            Tờ Khai CME Sở Y Tế 📋
          </button>

          {role !== 'ctv' && (
            <>
              <button
                id="btn-bulk-import-modal"
                onClick={() => setShowBulkForm(true)}
                className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                Nhập Excel Hàng Loạt
              </button>

              <button
                id="btn-add-attendee-modal"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo 1 Đại Biểu
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedAttendeeIds.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200/80 p-4 rounded-xl flex flex-wrap justify-between items-center gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-605 text-white bg-teal-600 font-extrabold rounded-full px-2.5 py-1 text-xs animate-pulse">
              Đã chọn {selectedAttendeeIds.length} đại biểu
            </div>
            <div className="text-left">
              <p className="text-[12px] font-black text-slate-800">Thao tác gửi email hàng loạt</p>
              <p className="text-[10px] text-slate-500 font-medium font-sans">Gửi email qua Google SMTP — chọn đơn lẻ hoặc thiết lập chiến dịch nhiều ngày.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zalo/WhatsApp bulk send */}
            <button
              type="button"
              onClick={() => {
                // Initialize default state to Zalo OA and select the first available Zalo template
                setBulkChannel('zalo');
                const zaloTemplates = store.getTemplates().filter(t => t.channel === 'zalo');
                const approvedZns = zaloTemplates.find(t => t.status === 'approved');
                if (approvedZns) {
                  setBulkZnsTemplateId(approvedZns.id);
                } else if (zaloTemplates.length > 0) {
                  setBulkZnsTemplateId(zaloTemplates[0].id);
                } else {
                  setBulkZnsTemplateId('');
                }
                setBulkSendingStatus('idle');
                setBulkSendResults([]);
                setBulkProgress(0);
                setShowBulkZnsModal(true);
              }}
              className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-black rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
            >
              <Sparkles className="w-4 h-4 text-teal-100" />
              Gửi Tin Hàng Loạt 🚀
            </button>

            {/* Email Queue bulk send */}
            <button
              type="button"
              onClick={() => {
                // Pre-select first email template if available
                const emailTemplates = store.getTemplates().filter(t => t.channel === 'email');
                setBulkEmailTemplateId(emailTemplates.length > 0 ? emailTemplates[0].id : '');
                setEmailQueueStatus(null);
                setEmailQueueRunning(false);
                setShowBulkEmailModal(true);
              }}
              className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
            >
              <Send className="w-3.5 h-3.5" />
              Email Hàng Loạt 📧
            </button>

            {/* Campaign Mode button */}
            <button
              type="button"
              onClick={() => {
                const emailTemplates = store.getTemplates().filter(t => t.channel === 'email');
                setCampaignTemplateId(emailTemplates.length > 0 ? emailTemplates[0].id : '');
                setShowCampaignModal(true);
              }}
              className="px-4 py-2 text-xs bg-violet-600 hover:bg-violet-700 text-white font-black rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Chiến Dịch Nhiều Ngày 📅
            </button>

            <button
              type="button"
              onClick={() => setSelectedAttendeeIds([])}
              className="px-3.5 py-2 text-xs bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer border-none"
            >
              Hủy lựa chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Table & Grid Layout */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-400 bg-slate-50 uppercase tracking-widest font-mono">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(a => selectedAttendeeIds.includes(a.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pageIds = paginatedData.map(a => a.id);
                        setSelectedAttendeeIds(prev => Array.from(new Set([...prev, ...pageIds])));
                      } else {
                        const pageIds = paginatedData.map(a => a.id);
                        setSelectedAttendeeIds(prev => prev.filter(id => !pageIds.includes(id)));
                      }
                    }}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3.5">Mã ID</th>
                <th className="px-6 py-3.5">Họ và Tên Đại Biểu</th>
                <th className="px-6 py-3.5">Đơn Vị Công Tác</th>
                <th className="px-6 py-3.5">Nguồn</th>
                <th className="px-6 py-3.5">Gói Đăng Ký</th>
                <th className="px-6 py-3.5 text-center">Đóng Phí (VNĐ)</th>
                <th className="px-6 py-3.5 text-center">Check-In</th>
                <th className="px-6 py-3.5 text-right">Tương Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-semibold italic text-xs">
                    Không tìm thấy đại biểu nào khớp với bộ lọc dữ liệu hiện thời.
                  </td>
                </tr>
              ) : (
                paginatedData.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-4 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={selectedAttendeeIds.includes(att.id)}
                        onChange={() => {
                          if (selectedAttendeeIds.includes(att.id)) {
                            setSelectedAttendeeIds(selectedAttendeeIds.filter(id => id !== att.id));
                          } else {
                            setSelectedAttendeeIds([...selectedAttendeeIds, att.id]);
                          }
                        }}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{att.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {att.avatarUrl ? (
                            <img src={att.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] uppercase font-extrabold text-slate-400 font-mono">
                              {att.fullName ? att.fullName.substring(0, 2) : 'BS'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-sm">
                            {formatName(att.title, att.fullName)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-450 font-semibold">
                            <span>{att.gender || 'N/A'}</span>
                            <span>•</span>
                            <span>NS: {att.yearOfBirth || 'N/A'}</span>
                            <span>•</span>
                            <span>{att.nationality === 'vietname' ? '🇻🇳 Việt Nam' : '🌐 Nước ngoài'}</span>
                          </div>
                          <span className="text-[10px] text-slate-450 mt-0.5 font-mono">{att.email} | {att.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{att.organization || 'Tự do'}</span>
                        {att.department && (
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">{att.department}</span>
                        )}
                        {att.province && (
                          <span className="text-[9.5px] text-slate-400 font-medium mt-0.5 flex items-center gap-0.5">
                            📍 {att.province}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {att.source === 'website' || !att.source ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          website
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[120px] inline-block" title={att.source}>
                          {att.source}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          att.packageId === 'pkg-vip' ? 'bg-amber-50 text-amber-700' :
                          att.packageId === 'pkg-standard' ? 'bg-teal-50/50 text-teal-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {att.packageName}
                        </span>
                        
                        {/* Render addon badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {att.cmeRequired && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100" title="Yêu cầu CME">
                              CME
                            </span>
                          )}
                          {att.galaRequired && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-black bg-amber-50 text-amber-700 border border-amber-100" title="Yêu cầu Gala">
                              GALA
                            </span>
                          )}
                          
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold font-mono text-slate-900">{(att.packageFee).toLocaleString()}đ</span>
                        
                        {/* Status badge selectable dropdown if admin/btc */}
                        {role === 'ctv' ? (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 uppercase ${
                            att.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            att.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {att.paymentStatus === 'paid' ? 'Đã đóng phí' :
                             att.paymentStatus === 'pending_verification' ? 'Chờ đối soát' : 'Chưa đóng phí'}
                          </span>
                        ) : (
                          <select
                            value={att.paymentStatus}
                            onChange={(e: any) => handleUpdatePayment(att.id, e.target.value)}
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full mt-1 border border-slate-200 focus:outline-none cursor-pointer uppercase ${
                              att.paymentStatus === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                              att.paymentStatus === 'pending_verification' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                            }`}
                          >
                            <option value="paid">PAID (Đã đóng)</option>
                            <option value="pending_verification">PENDING (Chờ duyệt)</option>
                            <option value="unpaid">UNPAID (Chưa đóng)</option>
                          </select>
                        )}

                        {/* Interactive dynamic QR code trigger for unpaid delegates */}
                        {att.paymentStatus === 'unpaid' && (
                          <button
                            type="button"
                            onClick={() => setUnpaidAttendeeForQR(att)}
                            className="mt-1.5 px-2 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
                            title="Tạo mã QR Chuyển khoản nhanh thu phí"
                          >
                            <QrCode className="w-3 h-3 text-indigo-600 animate-pulse" />
                            <span>Quét chuyển khoản 💸</span>
                          </button>
                        )}
                        {att.paymentStatus === 'pending_verification' && (
                          <button
                            type="button"
                            onClick={() => setUnpaidAttendeeForQR(att)}
                            className="mt-1.5 px-2 py-1 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded border border-amber-200 flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0 shadow-xs"
                            title="Xác thực hoặc xem lại mã chuyển khoản"
                          >
                            <QrCode className="w-3 h-3 text-amber-600" />
                            <span>Mã VietQR đối soát 🔍</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={att.isCheckedIn}
                          onChange={() => handleToggleCheckIn(att.id)}
                          className="w-4.5 h-4.5 text-teal-600 bg-gray-50 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                        <span className={`text-[9px] font-mono font-bold uppercase ${att.isCheckedIn ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {att.isCheckedIn ? 'CO_MAT' : 'CHUA'}
                        </span>
                      </label>
                      {att.isCheckedIn && att.checkInTime && (
                        <span className="text-[8px] text-slate-400 block mt-0.5 font-mono">{att.checkInTime}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 8x5cm Badge Thermal Printer */}
                        <button
                          type="button"
                          title="Thiết kế & In Thẻ Đeo (Name-Badge 8x5cm) 🖨️"
                          onClick={() => setSelectedBadgeAttendee(att)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </button>

                        {/* e-CME Certificate button for qualified attendees */}
                        {att.paymentStatus === 'paid' && (
                          <button
                            type="button"
                            title="Bản mềm / Xuất Chứng Chỉ Đào Tạo CME 🏅"
                            onClick={() => setSelectedCmeAttendee(att)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-805 rounded-lg transition-all cursor-pointer"
                          >
                            <Award className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}

                        {/* Send Quick Notification Email button */}
                        <button
                          type="button"
                          title="Soạn & Gửi Email thông báo nhanh ✉️"
                          onClick={() => handleOpenNotifyModal(att, 'tmpl-confirmation')}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-805 rounded-lg transition-all cursor-pointer"
                        >
                          <Mail className="w-4 h-4 text-indigo-600" />
                        </button>

                        <button
                          title="Hiển thị QR & Chi tiết"
                          onClick={() => {
                            setViewDetailAttendee(att);
                            setDetailEditForm(JSON.parse(JSON.stringify(att)));
                            setIsEditingDetail(false);
                          }}
                          className="p-1.5 hover:bg-slate-150 text-slate-500 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role !== 'ctv' && (
                          <button
                            title="Xóa hồ sơ"
                            onClick={() => handleDeleteAttendee(att.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile grid view of items */}
      <div className="block md:hidden space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm font-semibold italic text-xs">
            Không tìm thấy đại biểu nào khớp với bộ lọc dữ liệu hiện thời.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedData.map((att) => (
              <div key={att.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAttendeeIds.includes(att.id)}
                      onChange={() => {
                        if (selectedAttendeeIds.includes(att.id)) {
                          setSelectedAttendeeIds(selectedAttendeeIds.filter(id => id !== att.id));
                        } else {
                          setSelectedAttendeeIds([...selectedAttendeeIds, att.id]);
                        }
                      }}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded cursor-pointer shrink-0 animate-fade-in"
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {att.avatarUrl ? (
                        <img src={att.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 font-mono">
                          {att.fullName ? att.fullName.substring(0, 2) : 'BS'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-950 text-xs">
                        {formatName(att.title, att.fullName)}
                      </span>
                      <span className="text-[8.5px] text-slate-450 mt-0.5 font-medium">
                        {att.gender || 'N/A'} • NS: {att.yearOfBirth || 'N/A'} • {att.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài'}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{att.id} | {att.phone}</span>
                      <span className="text-[9px] text-slate-400 max-w-[150px] truncate">{att.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${
                      att.packageId === 'pkg-vip' ? 'bg-amber-50 text-amber-700' :
                      att.packageId === 'pkg-standard' ? 'bg-teal-50/50 text-teal-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {att.packageName}
                    </span>
                    {/* Addon badges */}
                    <div className="flex gap-0.5 flex-wrap justify-end">
                      {att.cmeRequired && <span className="px-1 py-0.2 bg-emerald-50 text-emerald-750 border border-emerald-100 rounded text-[7px] font-black">CME</span>}
                      {att.galaRequired && <span className="px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[7px] font-black">GALA</span>}
                      
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Đơn vị:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate" title={`${att.organization || 'Tự do'} ${att.department ? `(${att.department})` : ''} ${att.province ? `📍 ${att.province}` : ''}`}>
                      {att.organization || 'Tự do'} {att.department ? `(${att.department})` : ''} {att.province ? `📍 ${att.province}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Đóng Phí:</span>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-900 font-mono">{(att.packageFee).toLocaleString()}đ</span>
                      {role === 'ctv' ? (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 uppercase ${
                          att.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          att.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {att.paymentStatus === 'paid' ? 'Đã đóng phí' :
                           att.paymentStatus === 'pending_verification' ? 'Chờ đối soát' : 'Chưa đóng phí'}
                        </span>
                      ) : (
                        <select
                          value={att.paymentStatus}
                          onChange={(e: any) => handleUpdatePayment(att.id, e.target.value)}
                          className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md mt-0.5 border border-slate-200 focus:outline-none cursor-pointer uppercase ${
                            att.paymentStatus === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                            att.paymentStatus === 'pending_verification' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                          }`}
                        >
                          <option value="paid">PAID</option>
                          <option value="pending_verification">PENDING</option>
                          <option value="unpaid">UNPAID</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Check-In:</span>
                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={att.isCheckedIn}
                          onChange={() => handleToggleCheckIn(att.id)}
                          className="w-4 h-4 text-teal-600 bg-gray-50 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                        <span className={`text-[9px] font-mono font-bold uppercase ${att.isCheckedIn ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {att.isCheckedIn ? 'CÓ MẶT' : 'CHƯA'}
                        </span>
                      </label>
                      {att.isCheckedIn && att.checkInTime && (
                        <span className="text-[8px] text-slate-400 font-mono">({att.checkInTime})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 mt-auto">
                  {/* Interactive VietQR action */}
                  <div className="shrink-0">
                    {att.paymentStatus === 'unpaid' && (
                      <button
                        type="button"
                        onClick={() => setUnpaidAttendeeForQR(att)}
                        className="p-1 px-1.5 text-[8px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-100 flex items-center gap-0.5 cursor-pointer transition-all shrink-0"
                      >
                        <QrCode className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />
                        <span>Chuyển khoản</span>
                      </button>
                    )}
                    {att.paymentStatus === 'pending_verification' && (
                      <button
                        type="button"
                        onClick={() => setUnpaidAttendeeForQR(att)}
                        className="p-1 px-1.5 text-[8px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded border border-amber-100 flex items-center gap-0.5 cursor-pointer transition-all shrink-0"
                      >
                        <QrCode className="w-2.5 h-2.5 text-amber-600" />
                        <span>Đối soát 🔍</span>
                      </button>
                    )}
                  </div>

                  {/* Operational Icon Pack (Clean & minimal) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="In Thẻ Đeo"
                      onClick={() => setSelectedBadgeAttendee(att)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-500 hover:text-indigo-650 rounded transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {att.paymentStatus === 'paid' && (
                      <button
                        type="button"
                        title="Chứng Chỉ CME"
                        onClick={() => setSelectedCmeAttendee(att)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-150 border border-emerald-100 text-emerald-600 rounded transition-all cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Gửi thông báo nhanh"
                      onClick={() => handleOpenNotifyModal(att, 'tmpl-confirmation')}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-150 border border-indigo-100 text-indigo-650 rounded transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-650" />
                    </button>

                    <button
                      title="Chi tiết"
                      onClick={() => {
                        setViewDetailAttendee(att);
                        setDetailEditForm(JSON.parse(JSON.stringify(att)));
                        setIsEditingDetail(false);
                      }}
                      className="p-1.5 bg-slate-55 hover:bg-slate-100 border border-slate-205 text-slate-500 hover:text-slate-900 rounded transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {role !== 'ctv' && (
                      <button
                        title="Xóa"
                        onClick={() => handleDeleteAttendee(att.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-500 hover:text-rose-700 rounded transition-all cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Hiển thị</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none transition-all cursor-pointer text-slate-705"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>đại biểu / trang</span>
          <span className="text-slate-300 font-mono hidden sm:inline">|</span>
          <span>
            Đang xem {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, totalItems)} trong tổng số {totalItems} đại biểu
          </span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                currentPage === 1
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed border-none'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 active:scale-95'
              }`}
            >
              Trước
            </button>
            
            {getPageNumbers().map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => typeof p === 'number' && setCurrentPage(p)}
                disabled={typeof p !== 'number'}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  p === currentPage
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10 cursor-default border-none'
                    : p === '...'
                    ? 'text-slate-400 cursor-default border-none bg-transparent'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 active:scale-95 cursor-pointer'
                }`}
              >
                {p}
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed border-none'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 active:scale-95'
              }`}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Manual Insert Dialog Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden border border-slate-150 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="bg-teal-600 p-5 text-white shrink-0">
              <h4 className="font-bold text-sm tracking-wide uppercase">Thêm đại biểu thủ công (Đồng bộ Form)</h4>
              <p className="text-[11px] text-teal-100">Khởi tạo nhanh hồ sơ đại biểu trực tiếp tại quầy lễ tân hội nghị với đầy đủ thông tin chuẩn hóa.</p>
            </div>
            
            <form onSubmit={handleAddManualDelegate} className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700">
              {/* Profile Photo, Doctor Proof & Transaction Proof Upload Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Profile Avatar Upload */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-350 shrink-0 flex items-center justify-center">
                    {newAvatarImage ? (
                      <img src={newAvatarImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold font-mono">NO IMG</span>
                    )}
                    {isNewAvatarUploading && (
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-[8px] text-white">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase leading-tight">Ảnh đại biểu (Ảnh thẻ/Hồ sơ)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewAvatarUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Doctor Proof Upload */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 border-2 border-slate-350 shrink-0 flex items-center justify-center">
                    {newDoctorProofImage ? (
                      <div className="relative w-full h-full">
                        <img src={newDoctorProofImage} alt="Minh chứng Bác sĩ" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewDoctorProofImage(null)}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow border-none cursor-pointer flex items-center justify-center"
                          title="Xóa ảnh"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[9px] font-bold font-mono text-center uppercase leading-tight p-1">No Proof</span>
                    )}
                    {isNewDoctorProofUploading && (
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-[8px] text-white">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase leading-tight">Ảnh minh chứng Bác sĩ (Chứng chỉ)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewDoctorProofUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Transaction Proof Upload */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 border-2 border-slate-350 shrink-0 flex items-center justify-center">
                    {newTransactionProofImage ? (
                      <div className="relative w-full h-full">
                        <img src={newTransactionProofImage} alt="Minh chứng chuyển khoản" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewTransactionProofImage(null)}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow border-none cursor-pointer flex items-center justify-center"
                          title="Xóa ảnh"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[9px] font-bold font-mono text-center uppercase leading-tight p-1">No Proof</span>
                    )}
                    {isNewTransactionProofUploading && (
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-[8px] text-white">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase leading-tight">Ảnh chuyển khoản (Minh chứng)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewTransactionProofUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Học vị / Danh xưng</label>
                  <select
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none cursor-pointer"
                  >
                    <option value="GS.TS.BS">GS.TS.BS</option>
                    <option value="PGS.TS.BS">PGS.TS.BS</option>
                    <option value="TS.BS">TS.BS</option>
                    <option value="ThS.BS">ThS.BS</option>
                    <option value="BSCK1">BSCK1</option>
                    <option value="BSCK2">BSCK2</option>
                    <option value="BSNT">BSNT</option>
                    <option value="BS">BS</option>
                    <option value="Đại biểu">Đại biểu</option>
                  </select>
                </div>
                <div className="sm:col-span-8">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Họ và Tên (Có dấu) *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="ví dụ: TRẦN VĂN A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400 uppercase"
                  />
                </div>
              </div>

              {/* Gender & Year of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Giới tính</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setNewGender('Nam')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                        newGender === 'Nam' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGender('Nữ')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                        newGender === 'Nữ' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                      }`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Năm sinh</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newYearOfBirth}
                    onChange={(e) => setNewYearOfBirth(e.target.value.replace(/\D/g, ''))}
                    placeholder="ví dụ: 1988"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Work Organization */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Cơ quan đơn vị công tác *</label>
                <input
                  type="text"
                  required
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  placeholder="ví dụ: Bệnh viện Chợ Rẫy / Đại học Y Dược"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Contact info (Phone / Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="ví dụ: 0912345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ví dụ: dai_bieu@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Contact Address & Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Địa chỉ liên hệ *</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="ví dụ: 120 Hồng Bàng, Quận 5, TP. Hồ Chí Minh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tỉnh / Thành phố *</label>
                  <input
                    type="text"
                    required
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value)}
                    placeholder="ví dụ: Hồ Chí Minh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Quốc tịch</label>
                  <select
                    value={newNationality}
                    onChange={(e) => setNewNationality(e.target.value as 'vietname' | 'foreign')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none cursor-pointer"
                  >
                    <option value="vietname">Việt Nam 🇻🇳</option>
                    <option value="foreign">Nước ngoài 🌐</option>
                  </select>
                </div>
              </div>

              {/* Package selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Gói học tập đăng ký chính</label>
                <select
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-teal-600 focus:outline-none cursor-pointer"
                >
                  {store.getPackages().map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({(p.fee).toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Add-ons Checklist */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Nhu cầu bổ sung học viên</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-150 rounded-xl hover:border-teal-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={newCmeRequired}
                      onChange={(e) => setNewCmeRequired(e.target.checked)}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Cấp chứng chỉ CME giấy</p>
                      <p className="text-[9px] text-slate-400 font-medium">+350.000 VNĐ</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-150 rounded-xl hover:border-teal-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={newGalaRequired}
                      onChange={(e) => setNewGalaRequired(e.target.checked)}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Tham dự Gala Dinner</p>
                      <p className="text-[9px] text-slate-400 font-medium">+700.000 VNĐ</p>
                    </div>
                  </label>

                  
                </div>
              </div>

              {/* Payment status select */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Trạng thái thanh toán hội đại biểu</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value as 'paid' | 'unpaid' | 'pending_verification')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:outline-none cursor-pointer"
                >
                  <option value="paid">🟢 Đã thanh toán đầy đủ (Paid)</option>
                  <option value="unpaid">🔴 Chưa thanh toán (Unpaid)</option>
                  <option value="pending_verification">🟡 Chờ xác thực giao dịch chuyển khoản (Pending)</option>
                </select>
              </div>

              {/* Submit Buttons footer */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors cursor-pointer border-none"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-add-attendee"
                  type="submit"
                  className="px-5 py-2.5 text-xs text-white bg-teal-600 hover:bg-teal-700 font-bold rounded-xl shadow-md cursor-pointer transition-all border-none"
                >
                  Xác nhận nạp sổ 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Viewer Modal with QR image simulation code matching requirement */}
      {viewDetailAttendee && detailEditForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl md:max-w-4xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in flex flex-col max-h-[92vh]">
            
            {/* Header bar */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative shrink-0">
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">Bàn Trực Ban Tiếp Đón & Quản Lý Hồ Sơ</span>
                <h4 className="font-extrabold text-sm mt-0.5 uppercase tracking-wide">
                  {isEditingDetail ? 'Hiệu Chỉnh Thông Tin Đại Biểu' : 'Hồ Sơ Điện Tử Chi Tiết Đại Biểu'}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setViewDetailAttendee(null);
                  setIsEditingDetail(false);
                }}
                className="text-slate-400 hover:text-white font-extrabold text-lg p-1 hover:bg-slate-800 rounded-full transition-all cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Main Grid content: horizontal on desktop, vertical on mobile */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
              
              {/* LEFT COLUMN: Visual profile assets (Avatar, QR, Status badges) - spans 4 cols */}
              <div className="md:col-span-4 bg-slate-50 p-6 flex flex-col items-center border-r border-slate-105 text-center space-y-5">
                
                {/* Avatar view & upload avatar simulated section */}
                <div className="relative group">
                  {viewDetailAttendee.avatarUrl ? (
                    <img 
                      src={viewDetailAttendee.avatarUrl} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/25 shadow-md flex-shrink-0" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-extrabold text-slate-500 text-2xl shadow-inner flex-shrink-0">
                      {viewDetailAttendee.fullName.substring(0, 1)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 p-1 px-2.5 rounded-full text-[8.5px] font-mono leading-none bg-slate-900 border border-slate-800 text-slate-200 font-extrabold">
                    {viewDetailAttendee.title || 'BS.'}
                  </span>
                </div>

                {/* Core QR Code for ticket scanning */}
                <div className="space-y-1.5 w-full flex flex-col items-center">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">MÃ QR ĐIỂM DANH</span>
                  <div className="p-3 bg-white border border-slate-150 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(viewDetailAttendee.qrCodeValue)}`} 
                      alt="QR Code" 
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold tracking-tight bg-slate-200 px-2.5 py-0.5 rounded-lg select-all">
                    {viewDetailAttendee.id}
                  </span>
                </div>

                {/* Ticket/Package Label */}
                <div className="w-full space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Gói Lệ Phí Hoạt Động</span>
                  <span className="inline-block w-full px-3 py-1 bg-indigo-50 text-indigo-750 font-black border border-indigo-150 rounded-xl text-[11px] uppercase tracking-wide">
                    {viewDetailAttendee.packageName}
                  </span>
                </div>

                {/* Quick status tags */}
                <div className="w-full pt-4 border-t border-slate-200 flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                  <span className={`px-2.5 py-1 rounded-full border ${
                    viewDetailAttendee.isCheckedIn 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse' 
                      : 'bg-slate-100 text-slate-550 border-slate-250'
                  }`}>
                    {viewDetailAttendee.isCheckedIn ? '● Đã Có Mặt sảnh' : '○ Chưa Điểm Danh'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full border ${
                    viewDetailAttendee.paymentStatus === 'paid' 
                      ? 'bg-teal-50 text-teal-700 border-teal-250' 
                      : viewDetailAttendee.paymentStatus === 'pending_verification'
                      ? 'bg-amber-50 text-amber-700 border-amber-250'
                      : 'bg-rose-50 text-rose-700 border-rose-250'
                  }`}>
                    {viewDetailAttendee.paymentStatus === 'paid' 
                      ? '✓ Đã Đóng Phí' 
                      : viewDetailAttendee.paymentStatus === 'pending_verification'
                      ? '⏳ Chờ Đối Soát'
                      : '✕ Chưa Nộp Phí'}
                  </span>
                </div>

              </div>

              {/* RIGHT COLUMN: Profile details grid or Interactive edit mode based on permissions */}
              <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-5">
                
                <div>
                  {/* Nav & Perm Indicators */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1 px-2 rounded-md font-sans text-[9px] font-black uppercase tracking-wider ${
                        role === 'ctv' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}>
                        {role === 'ctv' ? 'Phân quyền: Cộng Tác Viên (Chỉ Xem)' : `Quản trị Viên (${role.toUpperCase()})`}
                      </span>
                    </div>
                    
                    {role !== 'ctv' && (
                      <button
                        type="button"
                        onClick={() => setIsEditingDetail(!isEditingDetail)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                          isEditingDetail 
                            ? 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white' 
                            : 'bg-indigo-50 hover:bg-indigo-150 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isEditingDetail ? 'Hủy Sửa Đối Tượng' : 'Sửa Thông Tin'}
                      </button>
                    )}
                  </div>

                  {/* VIEW MODE */}
                  {!isEditingDetail ? (
                    <div className="space-y-4 animate-fade-in">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium">
                        {/* Title & Name */}
                        <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-150 relative">
                          <span className="text-[10px] text-slate-400 absolute top-2 right-3 font-mono tracking-wide uppercase">Cấu hình Danh xưng</span>
                          <p className="text-[11px] text-slate-500 font-bold font-mono">DANH XƯNG & HỌ TÊN:</p>
                          <p className="text-sm font-black text-slate-900 uppercase mt-0.5">
                            {formatName(viewDetailAttendee.title, viewDetailAttendee.fullName)}
                          </p>
                        </div>

                        {/* Contact phone & email */}
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Số điện thoại di động:</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-150 font-mono text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                            <span>{viewDetailAttendee.phone || 'Chưa cung cấp'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Địa chỉ hòm thư (Email):</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-mono">
                            <Mail className="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                            <span className="truncate">{viewDetailAttendee.email || 'Chưa cung cấp'}</span>
                          </div>
                        </div>

                        {/* Gender & year of birth */}
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Giới tính đại biểu:</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/55 rounded-lg border border-slate-150 text-slate-800 font-semibold">
                            <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{viewDetailAttendee.gender || 'Chưa cập nhật'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Năm sinh:</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-mono font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{viewDetailAttendee.yearOfBirth || 'Chưa cung cấp'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Số CCCD đại biểu:</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-mono font-semibold">
                            <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{viewDetailAttendee.cmeIdentityNo || 'Chưa cung cấp'}</span>
                          </div>
                        </div>

                        {/* Organization & Department */}
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Cơ quan công tác liên kết:</span>
                          <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-semibold truncate font-sans">
                            🏢 {viewDetailAttendee.organization || 'Tự do'}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Khoa / Chuyên khoa công tác:</span>
                          <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-semibold truncate font-sans">
                            🩺 {viewDetailAttendee.department || 'Chưa cung cấp'}
                          </div>
                        </div>

                        {/* Nationality & Province */}
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Quốc tịch / Nationality:</span>
                          <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-semibold">
                            🌐 {viewDetailAttendee.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài / International'}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Tỉnh / Thành phố đại diện:</span>
                          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{viewDetailAttendee.province || 'Chưa cập nhật'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Nguồn đăng ký:</span>
                          <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-850 font-bold truncate">
                            ℹ️ {viewDetailAttendee.source || 'website'}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-450 block font-bold mb-0.5">Địa chỉ liên hệ:</span>
                          <div className="p-2 bg-slate-50/50 rounded-lg border border-slate-150 text-slate-800 font-semibold leading-relaxed">
                            📍 {viewDetailAttendee.address || 'Chưa cập nhật'}
                          </div>
                        </div>

                        {/* CME Certification indicator */}
                        <div className="sm:col-span-2 p-3 rounded-xl border flex items-center justify-between gap-4 mt-2 bg-emerald-50/20 border-emerald-150">
                          <div className="flex gap-2">
                            <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] font-black text-slate-900 uppercase block">Nhu cầu Chứng Chỉ Đào Tạo (CME)</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {viewDetailAttendee.cmeRequired 
                                  ? 'Yêu cầu cấp CME hoạt động.'
                                  : 'Không đăng ký nhu cầu cấp tín chỉ đào tạo liên tục.'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                            viewDetailAttendee.cmeRequired ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {viewDetailAttendee.cmeRequired ? 'Active' : 'Muted'}
                          </span>
                        </div>

                        {/* Event Sub services flags */}
                        <div className="sm:col-span-2 grid grid-cols-1 gap-2 text-center text-[9.5px]">
                          <div className={`p-1.5 rounded-lg border ${viewDetailAttendee.galaRequired ? 'bg-amber-500/10 border-amber-300 text-amber-850 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            🍽️ GALA DINNER
                          </div>
                          
                        </div>

                        {/* Yêu cầu xuất hóa đơn */}
                        {viewDetailAttendee.invoiceInfo && viewDetailAttendee.invoiceInfo.required && (
                          <div className="sm:col-span-2 p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 text-xs space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900 uppercase">
                              <span>📄 Yêu cầu xuất hóa đơn</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-blue-600 text-white rounded">
                                {viewDetailAttendee.invoiceInfo.type === 'company' ? 'Công ty' : 'Cá nhân'}
                              </span>
                            </div>
                            {viewDetailAttendee.invoiceInfo.type === 'company' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 font-medium">
                                <div><span className="text-slate-400">Tên công ty:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.companyName}</strong></div>
                                <div><span className="text-slate-400">Mã số thuế:</span> <strong className="text-slate-800 font-bold font-mono">{viewDetailAttendee.invoiceInfo.taxNo}</strong></div>
                                <div><span className="text-slate-400">Số điện thoại:</span> <strong className="text-slate-800 font-bold font-mono">{viewDetailAttendee.invoiceInfo.phone}</strong></div>
                                <div><span className="text-slate-400">Email:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.email}</strong></div>
                                <div className="sm:col-span-2"><span className="text-slate-400">Địa chỉ:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.address}</strong></div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 font-medium">
                                <div><span className="text-slate-400">Họ và tên:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.name}</strong></div>
                                <div><span className="text-slate-400">Số CCCD:</span> <strong className="text-slate-800 font-bold font-mono">{viewDetailAttendee.invoiceInfo.idNo}</strong></div>
                                <div><span className="text-slate-400">Số điện thoại:</span> <strong className="text-slate-800 font-bold font-mono">{viewDetailAttendee.invoiceInfo.phone}</strong></div>
                                <div><span className="text-slate-400">Email:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.email}</strong></div>
                                <div className="sm:col-span-2"><span className="text-slate-400">Địa chỉ:</span> <strong className="text-slate-800 font-bold">{viewDetailAttendee.invoiceInfo.address}</strong></div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Additional notes rendering */}
                      {viewDetailAttendee.notes && (
                        (() => {
                          const customFields = parseCustomFieldsFromNotes(viewDetailAttendee.notes);
                          const remainingNotes = getRemainingNotes(viewDetailAttendee.notes);
                          return (
                            <div className="space-y-3">
                              {customFields && customFields.length > 0 && (
                                <div className="p-3 bg-teal-50/30 rounded-xl border border-teal-200/40 text-[11px] space-y-1.5">
                                  <span className="font-extrabold text-teal-800 block text-[9.5px] uppercase tracking-wider">📋 Thông tin tùy chỉnh bổ sung:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
                                    {customFields.map((field, idx) => (
                                      <div key={idx} className="flex justify-between border-b border-slate-100 pb-0.5">
                                        <span className="text-slate-400 font-semibold">{field.label}:</span>
                                        <strong className="text-slate-800 font-bold ml-2">{field.value}</strong>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {remainingNotes && (
                                <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-250/20 text-[11px]">
                                  <span className="font-extrabold text-slate-600 block text-[10px] mb-1">📝 GHI CHÚ TỪ BAN TỔ CHỨC:</span>
                                  <div 
                                    className="text-slate-650 leading-relaxed max-h-16 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: remainingNotes }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}

                      {/* Proof of transfer image rendering */}
                      {viewDetailAttendee.transactionProofUrl && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ẢNH CHUYỂN KHOẢN / MINH CHỨNG THANH TOÁN:</span>
                          <div className="relative max-w-sm rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 group hover:shadow transition-shadow">
                            <img 
                              src={viewDetailAttendee.transactionProofUrl} 
                              alt="Minh chứng thanh toán" 
                              className="max-h-48 w-full object-contain cursor-zoom-in"
                              onClick={() => window.open(viewDetailAttendee.transactionProofUrl || '', '_blank')}
                            />
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              Click để xem ảnh lớn 🔍
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Doctor proof credentials image rendering */}
                      {viewDetailAttendee.doctorProofUrl && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ẢNH MINH CHỨNG BÁC SĨ:</span>
                          <div className="relative max-w-sm rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 group hover:shadow transition-shadow">
                            <img 
                              src={viewDetailAttendee.doctorProofUrl} 
                              alt="Minh chứng Bác sĩ" 
                              className="max-h-48 w-full object-contain cursor-zoom-in"
                              onClick={() => window.open(viewDetailAttendee.doctorProofUrl, '_blank')}
                            />
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              Click để xem ảnh lớn 🔍
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ACTIVE EDIT FORM (Only for ADMIN/OPERATOR, role isn't 'ctv') */
                    <div className="space-y-4 animate-fade-in text-xs">
                      <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-indigo-800 leading-normal text-[11px]">
                        <strong>Sửa đổi thông tin:</strong> Bạn đang trực tiếp ghi đè dữ liệu lên bộ cơ sở đại biểu. Hãy chắc chắn thông tin số điện thoại khớp chính xác để in chứng chỉ CME sau hội nghị.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Họ và tên đại biểu *</label>
                          <input
                            type="text"
                            required
                            value={detailEditForm.fullName}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, fullName: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>

                        {/* Title & Birth */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Danh xưng (Học vị)</label>
                          <select
                            value={detailEditForm.title}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-905 font-semibold focus:outline-none focus:border-indigo-500"
                          >
                            {['GS.TS.BS', 'PGS.TS.BS', 'TS.BS', 'ThS.BS', 'BSCK1', 'BSCK2', 'BSNT', 'BS', 'Đại biểu'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* Year of birth */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Năm sinh</label>
                          <input
                            type="text"
                            value={detailEditForm.yearOfBirth || ''}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, yearOfBirth: e.target.value })}
                            placeholder="Ví dụ: 1980"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Gender, Nationality & Province */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Giới tính</label>
                          <select
                            value={detailEditForm.gender || 'Nam'}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, gender: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Quốc tịch</label>
                          <select
                            value={detailEditForm.nationality || 'vietname'}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, nationality: e.target.value as 'vietname' | 'foreign' })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="vietname">Việt Nam</option>
                            <option value="foreign">Nước ngoài / International</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Tỉnh / Thành phố</label>
                          <input
                            type="text"
                            value={detailEditForm.province || ''}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, province: e.target.value })}
                            placeholder="Ví dụ: Hồ Chí Minh"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Địa chỉ liên hệ</label>
                          <input
                            type="text"
                            value={detailEditForm.address || ''}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, address: e.target.value })}
                            placeholder="Địa chỉ số nhà, đường, phường, quận..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Phone & Email */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Số Điện thoại *</label>
                          <input
                            type="text"
                            required
                            value={detailEditForm.phone}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, phone: e.target.value.replace(/\s+/g, '') })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-550 block mb-1 uppercase">Địa chỉ Email *</label>
                          <input
                            type="email"
                            required
                            value={detailEditForm.email}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, email: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>

                        {/* Organization & Department */}
                        <div>
                          <label className="text-[10px] font-black text-slate-505 block mb-1 uppercase">Cơ quan công tác</label>
                          <input
                            type="text"
                            value={detailEditForm.organization}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, organization: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-505 block mb-1 uppercase">Khoa / Phòng ban</label>
                          <input
                            type="text"
                            value={detailEditForm.department || ''}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, department: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        {/* Source (Read-only) */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Nguồn đăng ký</label>
                          <input
                            type="text"
                            disabled
                            value={detailEditForm.source || 'website'}
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-550 font-semibold focus:outline-none cursor-not-allowed text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Số CCCD đại biểu</label>
                          <input
                            type="text"
                            value={detailEditForm.cmeIdentityNo || ''}
                            onChange={(e) => setDetailEditForm({ ...detailEditForm, cmeIdentityNo: e.target.value.replace(/\D/g, '') })}
                            placeholder="Nhập 12 số CCCD..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Package Selector & Payment Status */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Đại biểu Đăng ký Gói Lệ Phí</label>
                          <select
                            value={detailEditForm.packageId}
                            onChange={(e) => {
                              const pkgs = store.getPackages();
                              const foundPkg = pkgs.find(p => p.id === e.target.value);
                              if (foundPkg) {
                                setDetailEditForm({
                                  ...detailEditForm,
                                  packageId: foundPkg.id,
                                  packageName: foundPkg.name,
                                  packageFee: foundPkg.fee
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-905 font-semibold focus:outline-none focus:border-indigo-500 text-[11px]"
                          >
                            {store.getPackages().map(pkg => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} ({pkg.fee.toLocaleString()}đ)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Trạng thái Thanh toán</label>
                          <select
                            value={detailEditForm.paymentStatus}
                            onChange={(e: any) => setDetailEditForm({ ...detailEditForm, paymentStatus: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="paid">✓ Đã nộp học phí (Paid)</option>
                            <option value="unpaid">✗ Chưa thanh toán (Unpaid)</option>
                            <option value="pending_verification">⏳ Chờ đối soát (Pending Verification)</option>
                          </select>
                        </div>

                        {/* CME checkbox and document fields */}
                        <div className="sm:col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="detail-edit-cmeRequired"
                              checked={detailEditForm.cmeRequired}
                              onChange={(e) => setDetailEditForm({ ...detailEditForm, cmeRequired: e.target.checked })}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="detail-edit-cmeRequired" className="text-xs font-black text-slate-800 select-none cursor-pointer">Đại biểu đăng ký cấp nhận tín chỉ CME hội nghị (Có phí)</label>
                          </div>
                        </div>

                        {/* Event Sub services checkboxes */}
                        <div className="sm:col-span-2 border-t border-slate-100 pt-3 grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-1.5 leading-none">
                            <input
                              type="checkbox"
                              id="detail-edit-gala"
                              checked={detailEditForm.galaRequired}
                              onChange={(e) => setDetailEditForm({ ...detailEditForm, galaRequired: e.target.checked })}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                            <label htmlFor="detail-edit-gala" className="text-[11px] font-bold text-slate-700 select-none cursor-pointer">Gala Dinner</label>
                          </div>

                          
                        </div>

                        {/* Doctor Proof Upload in Edit Mode */}
                        <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Ảnh minh chứng là Bác sĩ</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {detailEditForm.doctorProofUrl ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 group flex items-center justify-center">
                                <img src={detailEditForm.doctorProofUrl} alt="Doctor Proof" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={handleRemoveEditDoctorProof}
                                  className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow border-none cursor-pointer flex items-center justify-center"
                                  title="Xóa ảnh"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center font-extrabold text-slate-400 text-[9px] shadow-inner shrink-0 text-center uppercase leading-tight p-1">
                                Chưa có
                              </div>
                            )}
                            <div className="space-y-1 flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditDoctorProofUpload}
                                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                              />
                              <p className="text-[9px] text-slate-400">Chọn ảnh minh chứng là Bác sĩ để cập nhật.</p>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Proof Upload in Edit Mode */}
                        <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                          <label className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Ảnh chuyển khoản / Minh chứng thanh toán</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {detailEditForm.transactionProofUrl ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 group flex items-center justify-center">
                                <img src={detailEditForm.transactionProofUrl} alt="Transaction Proof" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={handleRemoveEditTransactionProof}
                                  className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow border-none cursor-pointer flex items-center justify-center"
                                  title="Xóa ảnh"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center font-extrabold text-slate-400 text-[9px] shadow-inner shrink-0 text-center uppercase leading-tight p-1">
                                Chưa có
                              </div>
                            )}
                            <div className="space-y-1 flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditTransactionProofUpload}
                                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                              />
                              <p className="text-[9px] text-slate-400">Chọn ảnh minh chứng thanh toán chuyển khoản để cập nhật.</p>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Edit footer actions */}
                      <div className="pt-4 border-t border-slate-150 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingDetail(false)}
                          className="px-4 py-2 cursor-pointer text-slate-500 hover:bg-slate-100 font-bold rounded-lg border-none bg-transparent"
                        >
                          Hủy cài đặt Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!detailEditForm.fullName || !detailEditForm.phone || !detailEditForm.email) {
                              alert('Họ tên, SĐT và Email là bắt buộc!');
                              return;
                            }
                            // Check if payment status transitioned to 'paid'
                            const list = store.getAttendees();
                            const orig = list.find(a => a.id === detailEditForm.id);
                            const wasPaid = orig ? orig.paymentStatus === 'paid' : false;

                            // Save modifications
                            store.saveAttendee(detailEditForm);
                            
                            if (!wasPaid && detailEditForm.paymentStatus === 'paid') {
                              try {
                                const templates = store.getTemplates();
                                const zTmpl = templates.find(t => t.channel === 'zalo' && t.type === 'payment_confirmed');
                                const eTmpl = templates.find(t => t.channel === 'email' && t.type === 'payment_confirmed');
                                const wTmpl = templates.find(t => t.channel === 'whatsapp' && t.type === 'payment_confirmed');

                                store.sendZaloZNS(detailEditForm, zTmpl?.id || 'payment_confirmed');
                                store.sendEmail(detailEditForm, undefined, undefined, eTmpl?.id || 'payment_confirmed');
                                store.sendWhatsapp(detailEditForm, wTmpl?.id || 'payment_confirmed');
                              } catch (err) {
                                console.error('Lỗi gửi tin nhắn khi lưu sửa đổi và xác nhận thanh toán:', err);
                              }
                            }

                            setViewDetailAttendee(detailEditForm);
                            setIsEditingDetail(false);
                            loadAll();
                            playSoundSound('success');
                          }}
                          className="px-5 py-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg flex items-center gap-1.5 shadow transition-all border-none"
                        >
                          <Save className="w-3.5 h-3.5 animate-pulse" />
                          Lưu Hồ Sơ 💾
                        </button>
                      </div>

                    </div>
                  )}

                </div>

                {/* SHARED MODAL FOOTER ACTIONS (Only at bottom of profile details panel) */}
                {!isEditingDetail && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    
                    {/* Payment VietQR or notification fast CTA */}
                    <div>
                      {(viewDetailAttendee.paymentStatus === 'unpaid' || viewDetailAttendee.paymentStatus === 'pending_verification') ? (
                        <button
                          type="button"
                          onClick={() => {
                            setUnpaidAttendeeForQR(viewDetailAttendee);
                            setViewDetailAttendee(null);
                          }}
                          className="px-4 py-2 text-[11px] font-bold text-indigo-700 hover:text-white bg-indigo-50 border border-indigo-200 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <QrCode className="w-4 h-4 text-indigo-600" />
                          VietQR Đối Soát Thu Phí
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-xl">
                          ✓ ĐÃ HOÀN TẤT NGHĨA VỤ TÀI CHÍNH
                        </span>
                      )}
                    </div>

                    {/* Main Checkin Status change button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleCheckIn(viewDetailAttendee.id);
                        setViewDetailAttendee(null);
                      }}
                      className={`py-2 px-5 rounded-xl text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer max-w-full border-none select-none ${
                        viewDetailAttendee.isCheckedIn 
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-250'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      {viewDetailAttendee.isCheckedIn ? 'HỦY CHECK-IN HỒ SƠ' : 'QUÉT VÀO SẢNH (CHECK-IN NOW)'}
                    </button>

                  </div>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC QR CODE BANK TRANSFER GENERATOR MODAL FOR UNPAID ATTENDEES */}
      {unpaidAttendeeForQR && (() => {
        const standardMemo = `PAY PARS2026 ${unpaidAttendeeForQR.id} ${removeVietnameseTones(unpaidAttendeeForQR.fullName).replace(/\s+/g, '')}`;
        const finalMemo = customMemoAdd ? customMemoAdd.toUpperCase() : standardMemo;
        const finalAmount = unpaidAttendeeForQR.packageFee + customFeeSurcharge;
        
        // Dynamic VietQR generator link
        const vietQrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(finalMemo)}&accountName=${encodeURIComponent(accountHolder)}`;

        return (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in text-slate-900 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-indigo-950 p-5 border-b border-indigo-900 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <QrCode className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs tracking-wider uppercase">Bộ Tạo Mã QR Động Thanh Toán Chuyển Khoản</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ đối soát và giao dịch nhanh qua chuẩn quét mã Liên ngân hàng Quốc gia VietQR</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUnpaidAttendeeForQR(null)}
                  className="text-slate-400 hover:text-white font-bold p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer text-sm border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Modal scrollable body content utilizing beautiful Bento layout */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/40">
                {/* Left side: Interactive form configs (Col span 7) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Delegate overview strip card */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0">
                      {unpaidAttendeeForQR.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">
                        {formatName(unpaidAttendeeForQR.title, unpaidAttendeeForQR.fullName)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {unpaidAttendeeForQR.packageName} | Mã số: <span className="font-mono text-indigo-650 font-bold">{unpaidAttendeeForQR.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block border-b border-slate-100 pb-2">
                      Cấu hình Đơn vị Thu thụ hưởng & Giao dịch
                    </span>

                    {/* Choose Bank Brand Select */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">Chọn Ngân hàng thụ hưởng:</label>
                        <select
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                          className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="MB">MB Bank (Quân Đội)</option>
                          <option value="VCB">Vietcombank (Ngoại Thương)</option>
                          <option value="TCB">Techcombank (Kỹ Thương)</option>
                          <option value="ACB">ACB (Á Châu)</option>
                          <option value="BIDV">BIDV (Đầu tư & Phát triển)</option>
                          <option value="CTG">VietinBank (Công Thương)</option>
                        </select>
                      </div>

                      {/* Recipient Account number */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">Số tài khoản nhận phí:</label>
                        <input
                          type="text"
                          value={accountNo}
                          onChange={(e) => setAccountNo(e.target.value)}
                          placeholder="ví dụ: 10112026..."
                          className="w-full text-xs font-semibold font-mono p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Account holder name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Tên người thụ hưởng chủ quản:</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                        placeholder="BAN TO CHUC PARS..."
                        className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 uppercase"
                      />
                    </div>

                    {/* Surcharges Add configs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 block">Phụ thu (Nếu có):</label>
                          <span className="text-[9px] text-slate-400 italic">Ví dụ: CME/Tài liệu phụ</span>
                        </div>
                        <input
                          type="number"
                          value={customFeeSurcharge || ''}
                          onChange={(e) => setCustomFeeSurcharge(Number(e.target.value))}
                          placeholder="Phụ phí..."
                          className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">Biểu phí gốc gói học:</label>
                        <div className="p-2 bg-slate-100 rounded-lg text-xs font-extrabold text-slate-600 font-mono flex items-center h-[34px]">
                          {unpaidAttendeeForQR.packageFee.toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    {/* Transfer Message modifiers */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-700 block">Nội dung chuyển khoản (Memo):</label>
                        <button 
                          type="button"
                          onClick={() => setCustomMemoAdd('')}
                          className="text-[9px] font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                        >
                          Reset mẫu chuẩn
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customMemoAdd === '' ? standardMemo : customMemoAdd}
                        onChange={(e) => setCustomMemoAdd(e.target.value.toUpperCase())}
                        className="w-full text-xs font-mono font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-indigo-900 uppercase"
                      />
                      <p className="text-[9px] text-slate-400">Nội dung chuyển khoản tự động hóa hoàn toàn không dấu nhằm tránh lỗi hiển thị ngân hàng.</p>
                    </div>
                  </div>

                  {/* Fast Action Board to copy details */}
                  <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold text-indigo-950 uppercase">Sao chép thủ dụng (Quét thất bại)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Bấm để copy nhanh nếu camera của đại biểu gặp vấn đề.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(accountNo);
                          setSyncFeedback('📋 Nút bấm: Đã sao chép SỐ TÀI KHOẢN vào clipboard!');
                          setTimeout(() => setSyncFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1 text-[9.5px] bg-white hover:bg-slate-100 text-indigo-800 font-bold rounded border border-indigo-150 transition-all cursor-pointer shadow-xs border-none"
                      >
                        Sao chép STK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(finalMemo);
                          setSyncFeedback('📋 Nút bấm: Đã sao chép NỘI DUNG CHUYỂN KHOẢN vào clipboard!');
                          setTimeout(() => setSyncFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1 text-[9.5px] bg-white hover:bg-slate-100 text-indigo-800 font-bold rounded border border-indigo-150 transition-all cursor-pointer shadow-xs border-none"
                      >
                        Sao chép Nội dung
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: Dynamic QR code viewer block (Col span 5) */}
                <div className="md:col-span-5 flex flex-col justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/75 shadow-sm space-y-4">
                  <div className="text-center w-full">
                    <span className="text-[10px] font-black tracking-widest text-indigo-950 uppercase block mb-1">Mã Quét Thu Phí Liên Ngân Hàng</span>
                    <h5 className="text-[10px] text-teal-600 font-extrabold bg-teal-50 px-2.5 py-0.5 rounded w-fit mx-auto border border-teal-150">TIÊU CHUẨN QUỐC GIA VIETQR</h5>
                  </div>

                  {/* QR Image Frame with dynamic visualizer layout */}
                  <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50 flex items-center justify-center relative w-full aspect-square max-w-[210px] shadow-inner overflow-hidden group">
                    <img 
                      src={vietQrCodeUrl} 
                      alt="VietQR bank transfer code" 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                    {/* Animated scanning line overlay */}
                    <div className="absolute inset-x-0 h-0.5 bg-indigo-500/50 animate-bounce top-1/2 opacity-65" />
                  </div>

                  {/* Total Amount Panel inside QR card */}
                  <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                    <span className="text-[9px] text-slate-500 block">Lượng phí cần quét:</span>
                    <span className="text-lg font-black font-mono text-indigo-905 block mt-0.5">
                      {finalAmount.toLocaleString()}đ
                    </span>
                    <span className="text-[8px] font-serif italic text-indigo-650 block">({finalMemo})</span>
                  </div>

                  {/* Manual trigger help text */}
                  <p className="text-[10px] text-slate-450 text-center leading-relaxed font-sans">
                    * Đại biểu kích hoạt ứng dụng Mobile Banking bất kỳ tuyển Việt Nam để quét tự động nhận diện tài khoản & số tiền.
                  </p>
                </div>
              </div>

              {/* Modal Control Footer with actions to override and save delegate paymentStatus */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <span className="text-[10px] text-slate-500 italic font-mono font-bold uppercase">Quầy thao tác thủ quỹ • PARS 2026</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnpaidAttendeeForQR(null)}
                    className="px-4 py-2 text-xs text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Đóng cửa sổ
                  </button>

                  {/* Dynamic update transition confirming Paid details */}
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePayment(unpaidAttendeeForQR.id, 'paid');
                      playSoundSound('success');
                      setSyncFeedback(`🟢 THÀNH CÔNG: Chuyển sang Đã đóng phí cho đại biểu ${unpaidAttendeeForQR.fullName}!`);
                      setTimeout(() => setSyncFeedback(null), 5000);
                      setUnpaidAttendeeForQR(null);
                    }}
                    className="px-5 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 border-none font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Xác nhận Đã nộp phí 🟢
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const attendeeToDelete = attendees.find(a => a.id === deleteConfirmId);
        if (!attendeeToDelete) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Xác nhận xóa đại biểu</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa đại biểu <span className="font-extrabold text-slate-800">{attendeeToDelete.fullName}</span> ({attendeeToDelete.id}) khỏi hệ thống? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    store.deleteAttendee(deleteConfirmId);
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

      {/* Name-Badge Print Modal (Dynamic Format Design based on settings) */}
      {selectedBadgeAttendee && (() => {
        const printerPaperSize = localStorage.getItem('pars_printer_papersize') || '80x50';
        const printerMargin = localStorage.getItem('pars_printer_margin') || 'none';
        
        let badgeWidth = '8cm';
        let badgeHeight = '5cm';
        let nameFontSize = '17px';
        let orgFontSize = '9.5px';
        let groupFontSize = '9.5px';
        let labelFontSize = '6.5px';
        let idFontSize = '7.5px';
        let qrSize = '28px';

        if (printerPaperSize === '100x150') {
          badgeWidth = '10cm';
          badgeHeight = '15cm';
          nameFontSize = '28px';
          orgFontSize = '14px';
          groupFontSize = '14px';
          labelFontSize = '10px';
          idFontSize = '12px';
          qrSize = '64px';
        } else if (printerPaperSize === '80x50') {
          badgeWidth = '8cm';
          badgeHeight = '5cm';
          nameFontSize = '17px';
          orgFontSize = '9.5px';
          groupFontSize = '9.5px';
          labelFontSize = '6.5px';
          idFontSize = '7.5px';
          qrSize = '28px';
        } else if (printerPaperSize === '70x50') {
          badgeWidth = '7cm';
          badgeHeight = '5cm';
          nameFontSize = '15px';
          orgFontSize = '8.5px';
          groupFontSize = '8.5px';
          labelFontSize = '6px';
          idFontSize = '7px';
          qrSize = '24px';
        } else if (printerPaperSize === 'K80') {
          badgeWidth = '8cm';
          badgeHeight = '8cm';
          nameFontSize = '18px';
          orgFontSize = '10px';
          groupFontSize = '10px';
          labelFontSize = '7px';
          idFontSize = '8px';
          qrSize = '32px';
        }

        const marginCss = printerMargin === 'none' ? '0' : printerMargin === 'minimum' ? '2mm' : 'auto';

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in text-slate-900">
              <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">Căn Lề In Thẻ Đeo ({badgeWidth} x {badgeHeight})</h4>
                </div>
                <button 
                  onClick={() => setSelectedBadgeAttendee(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 bg-slate-105 flex flex-col items-center justify-center gap-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Xem trước tỷ lệ nhãn in ({badgeWidth} x {badgeHeight})</p>
                
                {/* Printable name badge container */}
                <div 
                  id="pars-physical-badge"
                  ref={badgePrintRef}
                  className="bg-white border-2 border-dashed border-slate-300 p-3 flex flex-col justify-between select-none relative shadow-md rounded-md overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] print:border-none print:shadow-none print:m-0"
                  style={{ width: badgeWidth, height: badgeHeight }}
                >
                  <style dangerouslySetInnerHTML={{ __html: `
                    @page {
                      size: ${badgeWidth} ${badgeHeight};
                      margin: ${marginCss};
                    }
                    @media print {
                      body {
                        -webkit-print-color-adjust: exact;
                      }
                      #pars-physical-badge {
                        width: ${badgeWidth} !important;
                        height: ${badgeHeight} !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: ${printerMargin === 'none' ? '8px' : '16px'} !important;
                      }
                    }
                  `}} />

                  {/* Header - No conference name */}
                  <div className="flex justify-end items-center border-b border-slate-150 pb-1.5 mb-1">
                    <div className="text-right">
                      <span className="text-[7px] font-black bg-rose-600 text-white px-1 py-0.2 rounded font-mono">OCT 2026</span>
                    </div>
                  </div>

                  {/* Central Body: Title & Name extreme bold */}
                  <div className="my-auto text-center py-2">
                    <h2 
                      className="font-black text-slate-950 uppercase leading-none tracking-tight"
                      style={{ fontSize: nameFontSize }}
                    >
                      {formatName(selectedBadgeAttendee.title, selectedBadgeAttendee.fullName)}
                    </h2>
                    <p 
                      className="font-bold text-teal-750 truncate mt-1.5"
                      style={{ fontSize: orgFontSize }}
                    >
                      Cơ quan: {selectedBadgeAttendee.organization}
                    </p>
                  </div>

                  {/* Bottom row: Classification & QR bar code */}
                  <div className="flex justify-between items-end border-t border-slate-100 pt-1.5">
                    <div>
                      <span 
                        className="text-slate-400 font-mono block"
                        style={{ fontSize: labelFontSize }}
                      >
                        PHÂN NHÓM ĐẠI BIỂU
                      </span>
                      <span 
                        className={`font-black uppercase px-2 py-0.5 rounded tracking-wide block mt-1 ${
                          selectedBadgeAttendee.packageId === 'pkg-vip' ? 'bg-amber-500 text-white' :
                          selectedBadgeAttendee.id.includes('SPK') ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                        }`}
                        style={{ fontSize: groupFontSize }}
                      >
                        ★ {selectedBadgeAttendee.packageId === 'pkg-vip' ? 'ĐẠI BIỂU VIP' : 
                            selectedBadgeAttendee.id.includes('SPK') ? 'BÁO CÁO VIÊN' : 'ĐẠI BIỂU'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="font-mono text-slate-450 font-bold block"
                        style={{ fontSize: idFontSize }}
                      >
                        {selectedBadgeAttendee.id}
                      </span>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedBadgeAttendee.qrCodeValue)}`}
                        alt="Mini Code"
                        className="object-contain"
                        style={{ width: qrSize, height: qrSize }}
                      />
                    </div>
                  </div>
                </div>

                {/* Technical help notes */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[10.5px] text-amber-900 w-full space-y-1">
                  <p className="font-bold">💡 Gợi ý cấu hình máy in nhiệt ({printerPaperSize}):</p>
                  <p>• Khổ giấy hiện tại: <strong>{badgeWidth} x {badgeHeight}</strong>. Căn lề lề: <strong>{printerMargin === 'none' ? '0mm (Không lề)' : printerMargin === 'minimum' ? '2mm (Tối thiểu)' : 'Mặc định'}</strong>.</p>
                  <p>• Nhấn <strong>"Mở Print Dialog"</strong> để gửi lệnh trực tiếp tới máy in nhãn nhiệt tại sảnh tiếp đón.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedBadgeAttendee(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    playSoundSound('success');
                    handlePrintBadge();
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In Thẻ Nhãn ({badgeWidth} x {badgeHeight})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Draft & Send Quick Participation Confirmation Email Modal */}
      {notifyAttendee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in text-slate-900 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h4 className="font-extrabold text-xs tracking-wider uppercase">Soạn Gửi Thông Báo Xác Nhận</h4>
              </div>
              <button 
                onClick={() => setNotifyAttendee(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-5">
              
              {/* Attendee Summary Badge Card */}
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider block">Người nhận thông báo / Delegate</span>
                  <h3 className="text-sm font-black text-slate-900">
                    {formatName(notifyAttendee.title, notifyAttendee.fullName)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    📧 {notifyAttendee.email} | 📞 {notifyAttendee.phone}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                    notifyAttendee.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    notifyAttendee.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-100 text-slate-650 border-slate-150'
                  }`}>
                    {notifyAttendee.paymentStatus === 'paid' ? 'Đã Thanh Toán' :
                     notifyAttendee.paymentStatus === 'pending_verification' ? 'Chờ Đối Soát' : 'Chưa Thanh Toán'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400">{notifyAttendee.id}</span>
                </div>
              </div>

              {/* Preset template chooser */}
              <div className="space-y-2">
                <label className="text-[10.5px] font-black uppercase text-slate-500 tracking-wider block">Chọn mẫu thông báo sẵn có / Ready templates</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenNotifyModal(notifyAttendee, 'tmpl-confirmation')}
                    className={`p-3 text-left rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                      notifyTemplateId === 'tmpl-confirmation'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-805 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${notifyTemplateId === 'tmpl-confirmation' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      Mẫu 1: Xác nhận tham gia
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">Sử dụng cho đại biểu đã đóng phí, gửi mã QR và lời mời</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenNotifyModal(notifyAttendee, 'tmpl-reminder')}
                    className={`p-3 text-left rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                      notifyTemplateId === 'tmpl-reminder'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-805 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${notifyTemplateId === 'tmpl-reminder' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      Mẫu 2: Nhắc nợ đóng phí
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">Sử dụng khi đại biểu chưa đóng phí, nhắc chuyển khoản đối soát</span>
                  </button>
                </div>
              </div>

              {/* Display Subject */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black uppercase text-slate-500 tracking-wider block">Tiêu đề Thư (Subject)</label>
                <input
                  type="text"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-250 focus:border-indigo-500 rounded-xl text-xs font-bold focus:outline-none text-slate-900"
                  placeholder="Nhập tiêu đề email thông báo..."
                />
              </div>

              {/* Display Body draft details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10.5px] font-black uppercase text-slate-500 tracking-wider block">Nội dung thư thông báo (Body draft)</label>
                  <span className="text-[9.5px] text-indigo-600 font-semibold font-mono">Dữ liệu tự động đồng bộ</span>
                </div>
                <textarea
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  rows={10}
                  className="w-full p-3 bg-white border border-slate-250 focus:border-indigo-500 rounded-xl text-xs font-medium font-sans focus:outline-none text-slate-800 leading-relaxed"
                  placeholder="Nội dung thư thông báo gửi đại biểu..."
                />
              </div>

              {/* Feedbacks notification status success or fail */}
              {notificationFeedback && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
                  notificationFeedback.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${notificationFeedback.success ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <span>{notificationFeedback.msg}</span>
                  </div>
                  {notificationFeedback.success && (
                    <span className="text-[9px] font-black font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      ĐÃ LƯU NHẬT KÝ
                    </span>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(`Tiêu đề: ${notifySubject}\n\nNội dung:\n${notifyBody}`);
                    alert("📋 Đã sao chép tiêu đề và nội dung email vào khay nhớ tạm!");
                  } catch (e) {
                    // Fallback
                  }
                }}
                className="px-3.5 py-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all border border-indigo-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Sao chép nội dung 📋</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyAttendee(null)}
                  className="px-4 py-2 text-xs text-slate-650 bg-white hover:bg-slate-100 border border-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hủy / Đóng
                </button>
                
                <button
                  type="button"
                  disabled={isSendingNotification}
                  onClick={handleSendQuickNotification}
                  className={`px-5 py-2 text-xs text-white font-extrabold rounded-xl shadow border-none cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSendingNotification 
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSendingNotification ? (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      Đang gửi Thư...
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      Xác nhận gửi thông báo ✉️
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Official CME accreditation certificate template viewer */}
      {selectedCmeAttendee && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col text-slate-900">
            <div className="bg-gradient-to-r from-red-850 to-amber-700 bg-red-800 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300 animate-pulse" />
                <h4 className="font-extrabold text-sm uppercase tracking-wide">Xuất bản CME Chứng chỉ số hóa (Điện tử)</h4>
              </div>
              <button 
                onClick={() => setSelectedCmeAttendee(null)}
                className="text-white hover:text-amber-200 font-bold text-sm cursor-pointer"
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
                  #cme-paper-acc, #cme-paper-acc * {
                    visibility: visible !important;
                  }
                  #cme-paper-acc {
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
                id="cme-paper-acc"
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
                <div className="absolute top-4 right-4 text-[9px] text-slate-400 font-mono tracking-wider font-bold">CMEID: {selectedCmeAttendee.id}</div>

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
                    {formatName(selectedCmeAttendee.title, selectedCmeAttendee.fullName)}
                  </h2>
                  
                  <div className="grid grid-cols-2 text-left max-w-md mx-auto text-[11px] text-slate-700 font-sans bg-amber-50/40 p-2.5 rounded border border-amber-100/50">
                    <p>• Năm sinh: <strong>{selectedCmeAttendee.yearOfBirth || '1980'}</strong></p>
                    <p>• Quốc tịch: <strong>{selectedCmeAttendee.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài'}</strong></p>
                    <p className="col-span-2 mt-1">• Đơn vị: <strong>{selectedCmeAttendee.organization}</strong></p>
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80&data=${encodeURIComponent(`VERIFIED-CME-${selectedCmeAttendee.id}`)}`}
                      alt="Mini Verified"
                      className="w-12 h-12 object-contain bg-white p-0.5 border border-slate-200"
                    />
                    <div>
                      <span className="text-[7.5px] font-mono text-slate-450 block italic">Mã xác minh Sở Y Tế</span>
                      <span className="text-[8.5px] font-mono font-bold text-slate-600 block">{selectedCmeAttendee.id}-CME</span>
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
              <span className="text-[10px] text-slate-450 italic">Công nghệ Chứng nhận điện tử e-CME đảm bảo tính pháp trị lưu trữ hội đồng Sở Y Tế.</span>
              <div className="flex gap-2.5 font-sans">
                <button
                  onClick={() => setSelectedCmeAttendee(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer"
                >
                  Hủy xem
                </button>
                <button
                  onClick={() => {
                    playSoundSound('success');
                    const originalTitle = document.title;
                    document.title = `CHUNG_NHAN_CME_${selectedCmeAttendee.fullName.replace(/\s+/g, '_')}`;
                    window.print();
                    document.title = originalTitle;
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  In Bản Cương Quy CME / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal dialog for bulk text importing via tab grid pasting */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-900">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm tracking-wide">NHẬP DANH SÁCH BÁC SĨ THƯ MỜI HÀNG LOẠT</h4>
                <p className="text-[11px] text-slate-450 mt-0.5">Tải lên tệp tin Excel (CSV / TXT) hoặc Sao chép & Dán thủ công.</p>
              </div>
              <button 
                onClick={() => {
                  setShowBulkForm(false);
                  setBulkInputText('');
                  setUploadFeedback(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkImportTextSubmit} className="p-6 space-y-4 font-sans">
              
              {/* Drag and Drop File Upload Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  isDragActive 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-slate-500'
                }`}
              >
                <input 
                  type="file" 
                  id="bulk-file-input"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                />
                <label htmlFor="bulk-file-input" className="cursor-pointer block space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-705">Kéo & Thả tệp tin Excel (.xlsx, .xls, .csv, .txt) tại đây</p>
                    <p className="text-[10px] text-slate-400 mt-1">Hoặc nhấp chuột để chọn tệp tin từ máy tính</p>
                  </div>
                </label>
              </div>

              {uploadFeedback && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 text-[11px] font-medium flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-1">Xem trước dữ liệu tải lên hoặc Dán khối văn bản phân tách bằng dấu gạch đứng (|):</label>
                <p className="text-[9.5px] text-indigo-750 bg-indigo-50/50 p-2 rounded leading-snug mb-2 font-mono text-indigo-800">
                  Định dạng dòng: Học vị | Họ và Tên | Điện thoại | Email | Cơ quan | Năm Sinh
                </p>
                <textarea
                  required
                  rows={6}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder="BS. | NGUYỄN VĂN A | 0987112233 | nva@hmu.edu.vn | Bệnh viện Bạch Mai | 1980&#10;TS.BS. | TRẦN THỊ BÚT | 0912343212 | ttbut@ump.edu.vn | BV Chợ Rẫy | 1975"
                  className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs font-mono h-[140px] focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded text-[10px] text-slate-500 space-y-1 w-full">
                <p className="font-bold text-slate-700">• Quy tắc xử lý tự động:</p>
                <p>• Hệ thống sẽ tự tạo các mã số đại biểu duy nhất dạng `{store.getBusinessConfig().attendeeIdPrefix || 'PARS2026'}-XXX` và sinh mã QR bảo mật tương ứng.</p>
                <p>• Trạng thái thanh toán của khối import được kích hoạt thành <strong>Đã thanh toán (Paid)</strong> theo danh sách biểu mời sảnh.</p>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkForm(false);
                    setBulkInputText('');
                    setUploadFeedback(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg cursor-pointer border-none shadow-sm"
                >
                  Nạp Vào Cơ Sở Dữ Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bureaucratic CME Administrative list report spreadsheet template (Sở Y Tế) */}
      {showCmeDeclarationModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col text-slate-900">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">Tờ khai CME Đào Tạo Y Khoa Liên Tục</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Biểu mẫu danh sách điểm danh nghiệm thu hành chính trình Sở Y tế HCM.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCmeDeclarationModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 font-serif">
              <div 
                id="cme-moh-official-table"
                className="bg-white p-8 border border-slate-250 shadow text-[11px] leading-relaxed text-slate-900 pr-10 pl-10 pt-10"
                style={{ width: '100%', minWidth: '700px', fontFamily: '"Times New Roman", Times, serif' }}
              >
                {/* Header of VN standard administration */}
                <div className="flex justify-between items-start mb-6 text-xs text-slate-800">
                  <div className="text-center font-bold font-sans">
                    <span className="block text-[10px] uppercase font-bold text-slate-700 leading-tight">HỘI PHẪU THUẬT TẠO HÌNH PARS</span>
                    <span className="block text-[9.5px] uppercase font-bold text-indigo-700 border-b border-slate-900 pb-0.5">BAN THƯ KÝ ĐÀO TẠO CME</span>
                  </div>
                  <div className="text-center font-sans">
                    <span className="block text-[10.5px] uppercase font-bold text-slate-900 leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                    <span className="block text-[10px] font-bold text-slate-700">Độc lập - Tự do - Hạnh phúc</span>
                    <span className="block text-[9px] text-slate-500 italic mt-0.5 border-t border-slate-350 pt-0.5">---------------------</span>
                  </div>
                </div>

                <div className="text-center my-6">
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-wide font-sans">
                    DANH SÁCH BÁO CÁO ĐẠI BIỂU ĐỦ ĐIỀU KIỆN HOÀN THÀNH CME
                  </h2>
                  <p className="text-xs italic text-slate-500 pt-0.5 mt-0.5 font-sans">
                    (Phê duyệt đào tạo y học liên tục chuyên đề khoa học: "Tiến bộ thẩm mỹ phẫu thuật 2026")
                  </p>
                </div>

                {/* Core lists who registered CME, are paid, and checkedIn */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-900 border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 uppercase tracking-wide font-bold font-sans text-[9px] text-slate-900">
                        <th className="border border-slate-950 p-2 text-center w-12">STT</th>
                        <th className="border border-slate-950 p-2 text-center w-16">Mã Số</th>
                        <th className="border border-slate-950 p-2">Học vị / Tên Đại Biểu</th>
                        <th className="border border-slate-950 p-2 text-center">Năm sinh</th>
                        <th className="border border-slate-950 p-2 text-center">Quốc tịch</th>
                        <th className="border border-slate-950 p-2">Cơ quan đơn vị công tác</th>
                        <th className="border border-slate-950 p-2 text-center">Check-in</th>
                        <th className="border border-slate-950 p-2 text-center">Xác nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.filter(a => a.paymentStatus === 'paid').length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-slate-950 p-4 text-center italic text-slate-400">Không có dữ liệu đại biểu hoàn tất đóng phí để báo cáo CME Sở Y Tế tại sảnh hiện hành.</td>
                        </tr>
                      ) : (
                        attendees.filter(a => a.paymentStatus === 'paid').map((a, index) => (
                          <tr key={a.id} className="hover:bg-slate-50 font-serif">
                            <td className="border border-slate-950 p-2 text-center font-sans">{index + 1}</td>
                            <td className="border border-slate-950 p-2 text-center font-mono text-[9px] font-bold text-slate-650">{a.id}</td>
                            <td className="border border-slate-950 p-2 font-bold uppercase">{formatName(a.title, a.fullName)}</td>
                            <td className="border border-slate-950 p-2 text-center font-sans">{a.yearOfBirth || '1982'}</td>
                            <td className="border border-slate-950 p-2 text-center font-sans font-semibold text-xs">{a.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài'}</td>
                            <td className="border border-slate-950 p-2 text-slate-700">{a.organization}</td>
                            <td className="border border-slate-950 p-2 text-center font-sans font-bold text-[10px]">
                              <span className={a.isCheckedIn ? 'text-emerald-700' : 'text-slate-400'}>
                                {a.isCheckedIn ? 'Có mặt' : 'Vắng'}
                              </span>
                            </td>
                            <td className="border border-slate-950 p-2 text-center font-sans italic text-slate-400 text-[9px]">
                              {a.isCheckedIn ? '✓ Đã hoàn thành' : 'Chưa điểm danh'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-start mt-8 font-serif leading-relaxed text-xs text-slate-800">
                  <div className="font-sans">
                    <p className="font-bold underline uppercase text-slate-700 text-[10px]">Cơ quan thẩm định Sở Y Tế:</p>
                    <p className="italic text-slate-500 mt-1 text-[10px]">✔️ Phòng đào tạo nghiên cứu khoa học Sở Y tế HCM kiểm duyệt</p>
                  </div>
                  <div className="text-center pr-4 font-sans">
                    <span className="block italic text-[11px] text-slate-500">TP. Hồ Chí Minh, ngày 15 tháng 10 năm 2026</span>
                    <span className="block font-bold uppercase mt-1 text-slate-900 text-[10px]">CƠ QUAN CHỦ QUẢN PHÊ DUYỆT</span>
                    <span className="block italic text-[10px] text-slate-400 mt-6">(Ký đóng dấu điện tử đỏ của ban thư ký hội)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 font-sans">
              <button
                onClick={() => setShowCmeDeclarationModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                onClick={() => {
                  playSoundSound('success');
                  const originalTitle = document.title;
                  document.title = `TO_KHAI_CME_SO_Y_TE_PARS2026`;
                  window.print();
                  document.title = originalTitle;
                }}
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                In Tờ Khai CME Sở Y Tế
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ZNS SENDING MODAL */}
      {showBulkZnsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className={`text-white p-5 flex justify-between items-center shrink-0 transition-all duration-300 ${
              bulkChannel === 'zalo' 
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600' 
                : 'bg-gradient-to-r from-emerald-600 to-green-600'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-100">
                  <Database className="w-4 h-4 text-emerald-250 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-left">
                    Hệ Thống Gửi Tin Hàng Loạt (${bulkChannel === 'zalo' ? 'Zalo ZNS' : 'WhatsApp'})
                  </h3>
                  <p className="text-[10px] text-teal-100/80 text-left">Cổng truyền tin sandbox Open API v2.6.2</p>
                </div>
              </div>
              <button
                type="button"
                disabled={bulkSendingStatus === 'sending'}
                onClick={() => {
                  setShowBulkZnsModal(false);
                  setSelectedAttendeeIds([]);
                }}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center transition-all border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              
              {/* Step 1: Chọn Kênh Gửi & Mẫu Tin */}
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[11px] uppercase font-black tracking-wider text-slate-500 block mb-2">
                    1. Chọn Kênh Gửi Tin Nhắn Hàng Loạt
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      disabled={bulkSendingStatus === 'sending'}
                      onClick={() => {
                        setBulkChannel('zalo');
                        const zaloTemplates = store.getTemplates().filter(t => t.channel === 'zalo');
                        const approvedZns = zaloTemplates.find(t => t.status === 'approved');
                        setBulkZnsTemplateId(approvedZns ? approvedZns.id : (zaloTemplates[0]?.id || ''));
                      }}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        bulkChannel === 'zalo'
                          ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <svg className="w-8 h-8 fill-current text-blue-600" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 2.22.73 4.27 1.96 5.93L2.24 22l4.24-1.63C8.04 21.23 9.94 21.6 12 21.6c5.52 0 10-4.48 10-9.6S17.52 2 12 2zm9 9h6v1.5l-3.5 4.5h3.5v1.5h-6v-1.5l3.5-4.5h-3.5V9z" />
                      </svg>
                      <span className="text-xs font-black">Zalo ZNS</span>
                      <span className="text-[10px] text-slate-400">Gửi qua Zalo OA Cloud</span>
                    </button>
                    <button
                      type="button"
                      disabled={bulkSendingStatus === 'sending'}
                      onClick={() => {
                        setBulkChannel('whatsapp');
                        const waTemplates = store.getTemplates().filter(t => t.channel === 'whatsapp');
                        const approvedWa = waTemplates.find(t => t.status === 'approved');
                        setBulkZnsTemplateId(approvedWa ? approvedWa.id : (waTemplates[0]?.id || ''));
                      }}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        bulkChannel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <svg className="w-8 h-8 fill-current text-emerald-600" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.709 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="text-xs font-black text-emerald-600">WhatsApp</span>
                      <span className="text-[10px] text-slate-400">Gửi qua Cloud API</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-black tracking-wider text-slate-500 block">
                    2. Chọn Mẫu Tin Nhắn Chuyên Biệt ({bulkChannel === 'zalo' ? 'Zalo Cloud Status' : 'WhatsApp Cloud Status'})
                  </label>
                  <select
                    value={bulkZnsTemplateId}
                    disabled={bulkSendingStatus === 'sending'}
                    onChange={(e) => setBulkZnsTemplateId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-250 focus:border-teal-500 rounded-xl text-xs font-semibold focus:outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">-- Chọn Mẫu {bulkChannel === 'zalo' ? 'Zalo ZNS' : 'WhatsApp'} --</option>
                    {store.getTemplates()
                      .filter(t => t.channel === bulkChannel)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Code: {t.znsTemplateId || t.id}) - [{t.status === 'approved' ? 'DUYỆT CHÍNH THỨC' : t.status === 'rejected' ? 'BỊ TỪ CHỐI' : 'CHỜ DUYỆT'}]
                        </option>
                      ))
                    }
                  </select>

                  {/* Sub-alert for verification status based on selected template */}
                  {(() => {
                    const tmpl = store.getTemplates().find(t => t.id === bulkZnsTemplateId);
                    if (!tmpl) return null;
                    
                    if (tmpl.status === 'approved') {
                      return (
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-[11px] font-medium flex items-start gap-2 animate-fade-in text-left">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>✓ Trạng thái phê duyệt: APPROVED</strong>
                            <p className="text-slate-500 text-[10px] mt-0.5">Biểu mẫu này đã vượt qua quy trình kiểm duyệt chất lượng. Nội dung sẽ được gửi thực tế không qua sandbox.</p>
                          </div>
                        </div>
                      );
                    } else if (tmpl.status === 'rejected') {
                      return (
                        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-150 rounded-xl text-[11px] font-medium flex items-start gap-2 animate-fade-in text-left">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>✗ Trạng thái phê duyệt: REJECTED (Bị từ chối)</strong>
                            <p className="text-slate-500 text-[10px] mt-0.5">Mẫu bị từ chối do vi phạm quy tắc thương hiệu hoặc spam. Sử dụng mẫu này sẽ kích hoạt cơ chế mô phỏng Sandbox của hệ thống.</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 bg-amber-50 text-amber-850 border border-amber-150 rounded-xl text-[11px] font-medium flex items-start gap-2 animate-fade-in text-left">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>⏳ Trạng thái phê duyệt: PENDING (Chờ duyệt)</strong>
                            <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Đang chờ cổng kiểm duyệt cấp phép. Trên hệ thống ảo, tin nhắn vẫn sẽ gửi thông qua cơ chế mô phỏng Sandbox.</p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Step 2: Recipients Preview */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center animate-fade-in">
                  <label className="text-[11px] uppercase font-black tracking-wider text-slate-500">
                    2. Danh Sách Đại Biểu Đang Chờ ({selectedAttendeeIds.length} người)
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    Channel: {bulkChannel === 'zalo' ? 'Zalo ZNS' : 'WhatsApp'}
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  {attendees
                    .filter(a => selectedAttendeeIds.includes(a.id))
                    .map((a, idx) => {
                      // find if there is a result yet
                      const res = bulkSendResults[idx];
                      let badge = (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-lg uppercase">
                          Chờ phát sóng
                        </span>
                      );

                      if (bulkSendingStatus === 'sending') {
                        if (idx === bulkSendResults.length) {
                          badge = (
                            <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-lg uppercase flex items-center gap-1">
                              <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
                              Đang gửi...
                            </span>
                          );
                        } else if (idx < bulkSendResults.length) {
                          const state = bulkSendResults[idx];
                          badge = state.status === 'success' ? (
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg uppercase">
                              ✓ Thành công
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-lg uppercase" title={state.detail}>
                              ✗ Lỗi gửi
                            </span>
                          );
                        }
                      } else if (bulkSendingStatus === 'completed') {
                        const state = bulkSendResults[idx];
                        if (state) {
                          badge = state.status === 'success' ? (
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg uppercase">
                              ✓ Thành công
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-lg uppercase" title={state.detail}>
                              ✗ Lỗi gửi
                            </span>
                          );
                        }
                      }

                      return (
                        <div key={a.id} className="p-3 flex items-center justify-between text-xs font-medium hover:bg-white/80 transition-all">
                          <div className="flex items-center gap-2.5 text-left">
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 w-6 h-6 flex items-center justify-center rounded-lg font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800">{formatName(a.title, a.fullName)}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{a.id} • {a.phone}</p>
                            </div>
                          </div>
                          <div>
                            {badge}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Step 3: Progress indicators & Logs details */}
              {(bulkSendingStatus === 'sending' || bulkSendingStatus === 'completed') && (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 animate-fade-in text-left">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-teal-850">
                      Tiến trình triển khai cổng ${bulkChannel === 'zalo' ? 'Zalo ZNS' : 'WhatsApp'}:
                    </span>
                    <span className="font-mono text-teal-700">${bulkProgress}% Hoàn tất</span>
                  </div>

                  {/* Progress bar wrapper */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        bulkChannel === 'zalo' 
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-emerald-500 to-green-500'
                      }`}
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>

                  {/* Sending summary description list */}
                  <div className="flex justify-between text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono pt-1">
                    <span>Thành công: <strong className="text-emerald-600">${bulkSendResults.filter(r => r.status === 'success').length}</strong></span>
                    <span>Thất bại: <strong className="text-rose-600">${bulkSendResults.filter(r => r.status === 'failed').length}</strong></span>
                    <span>Tổng số: <strong>${selectedAttendeeIds.length}</strong></span>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 shrink-0 font-sans">
              <button
                type="button"
                disabled={bulkSendingStatus === 'sending'}
                onClick={() => {
                  setShowBulkZnsModal(false);
                  setSelectedAttendeeIds([]);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Đóng lại
              </button>
              
              ${bulkSendingStatus !== 'completed' ? (
                <button
                  type="button"
                  disabled={bulkSendingStatus === 'sending' || !bulkZnsTemplateId}
                  onClick={async () => {
                    await handleStartBulkZns();
                  }}
                  className={`px-5 py-2 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    bulkChannel === 'zalo' 
                      ? 'bg-teal-600 hover:bg-teal-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  ${bulkSendingStatus === 'sending' ? (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      Đang bắn ${bulkChannel === 'zalo' ? 'ZNS' : 'WhatsApp'}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-0.5 text-white/80" />
                      Bắt Đầu Gửi Hàng Loạt
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkZnsModal(false);
                    setSelectedAttendeeIds([]);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer border-none shadow-md transition-all"
                >
                  Hoàn thành xuất sắc ✓
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* KIOSK CHECK-IN DETAIL POPUP */}
      {kioskCheckInAttendee && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in text-slate-900 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase">Thông Tin Đại Biểu Tiếp Đón</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Xác nhận thông tin hồ sơ và thực hiện check-in</p>
                </div>
              </div>
              <button 
                onClick={() => setKioskCheckInAttendee(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6 text-left">
              
              {/* Profile Card */}
              <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shrink-0 overflow-hidden">
                  {kioskCheckInAttendee.avatarUrl ? (
                    <img src={kioskCheckInAttendee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{kioskCheckInAttendee.fullName ? kioskCheckInAttendee.fullName.split(' ').pop()?.substring(0, 2) : 'DB'}</span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-indigo-105 text-indigo-800 px-2 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase">
                      {kioskCheckInAttendee.id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                      kioskCheckInAttendee.packageId === 'pkg-vip' ? 'bg-amber-100 text-amber-800' :
                      kioskCheckInAttendee.id.includes('SPK') ? 'bg-indigo-150 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {kioskCheckInAttendee.packageId === 'pkg-vip' ? '★ VIP' : 
                       kioskCheckInAttendee.id.includes('SPK') ? 'Báo cáo viên' : 'Đại biểu'}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-black text-slate-900 leading-tight uppercase truncate">
                    {formatName(kioskCheckInAttendee.title, kioskCheckInAttendee.fullName)}
                  </h3>
                  
                  <p className="text-xs text-slate-500 font-medium truncate">
                    🏢 {kioskCheckInAttendee.organization} {kioskCheckInAttendee.department && `• ${kioskCheckInAttendee.department}`}
                  </p>
                </div>
              </div>

              {/* Informative list split into columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left column: contact and details */}
                <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3 shadow-xs">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                    Thông Tin Liên Hệ
                  </h5>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Số điện thoại:</span>
                      <strong className="text-slate-800 font-mono">{kioskCheckInAttendee.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Email:</span>
                      <strong className="text-slate-800 break-all">{kioskCheckInAttendee.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Địa chỉ / Tỉnh thành:</span>
                      <strong className="text-slate-800">{kioskCheckInAttendee.address}{kioskCheckInAttendee.province && `, ${kioskCheckInAttendee.province}`}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Năm sinh & Quốc tịch:</span>
                      <strong className="text-slate-800">
                        {kioskCheckInAttendee.yearOfBirth || 'Chưa rõ'} • {kioskCheckInAttendee.nationality === 'vietname' ? 'Việt Nam' : 'Nước ngoài'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Right column: Ticket & Add-ons */}
                <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3 shadow-xs">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                    Gói Đăng Ký & Dịch Vụ
                  </h5>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Gói hội nghị:</span>
                      <strong className="text-indigo-850 font-bold">{kioskCheckInAttendee.packageName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Phí tham dự:</span>
                      <strong className="text-slate-800 font-mono text-sm">
                        {kioskCheckInAttendee.packageFee.toLocaleString('vi-VN')} VNĐ
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px]">Thanh toán:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                        kioskCheckInAttendee.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                        kioskCheckInAttendee.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                        'bg-rose-50 text-rose-700 border border-rose-150'
                      }`}>
                        {kioskCheckInAttendee.paymentStatus === 'paid' ? '✓ Đã Thanh Toán' :
                         kioskCheckInAttendee.paymentStatus === 'pending_verification' ? '⏳ Chờ Đối Soát' : '✗ Chưa Thanh Toán'}
                      </span>
                    </div>
                    <div className="pt-1.5 flex flex-wrap gap-1">
                      {kioskCheckInAttendee.cmeRequired && (
                        <span className="text-[9px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.2 rounded font-bold">
                          CME
                        </span>
                      )}
                      {kioskCheckInAttendee.galaRequired && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded font-bold">
                          Gala Dinner
                        </span>
                      )}
                      
                    </div>
                  </div>
                </div>

              </div>

              {/* Status details for checkin */}
              <div className="bg-slate-100/80 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-[9.5px] uppercase font-black tracking-wider text-slate-400 block">Trạng thái điểm danh hiện tại:</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${kioskCheckInAttendee.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <strong className={kioskCheckInAttendee.isCheckedIn ? 'text-emerald-700' : 'text-slate-600'}>
                      {kioskCheckInAttendee.isCheckedIn 
                        ? `ĐÃ CÓ MẶT (Lúc ${kioskCheckInAttendee.checkInTime || 'Không rõ'})` 
                        : 'CHƯA ĐIỂM DANH'}
                    </strong>
                  </div>
                </div>
                {kioskCheckInAttendee.notes && (
                  <div className="w-full border-t border-slate-200/50 pt-2 text-[10.5px] text-slate-500 italic">
                    📌 Ghi chú: {kioskCheckInAttendee.notes}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setKioskCheckInAttendee(null)}
                className="px-4.5 py-2.5 bg-white hover:bg-slate-100 text-slate-650 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                Đóng lại
              </button>
              
              <button
                type="button"
                onClick={() => handleConfirmKioskCheckIn(kioskCheckInAttendee)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md border-none transition-all active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                {kioskCheckInAttendee.isCheckedIn ? 'Đã Check-in - In lại thẻ' : 'Check-in & In thẻ đeo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LOCAL OFFLINE CACHE DELEGATE CHECK-IN LIST MODAL */}
      {showOfflineListModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col text-slate-900">
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">Cơ sở dữ liệu đại biểu cục bộ (Chế độ Ngoại tuyến)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hiển thị các thao tác điểm danh ngoại tuyến chưa được đồng bộ lên máy chủ đám mây.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOfflineListModal(false)}
                className="text-slate-400 hover:text-white font-extrabold text-lg p-1 hover:bg-slate-800 rounded-full transition-all cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Sub-Header / Search / Stats */}
            {(() => {
              const pendingIds = store.getPendingSyncAttendeeIds();
              const filtered = attendees.filter(a => 
                pendingIds.includes(a.id) && (
                  a.fullName.toLowerCase().includes(offlineSearchQuery.toLowerCase()) ||
                  a.phone.includes(offlineSearchQuery) ||
                  a.id.toLowerCase().includes(offlineSearchQuery.toLowerCase()) ||
                  a.organization.toLowerCase().includes(offlineSearchQuery.toLowerCase())
                )
              );
              
              const unsyncedCount = pendingIds.length;
              const offlineCheckedCount = attendees.filter(a => pendingIds.includes(a.id) && a.isCheckedIn).length;
              const offlineAbsentCount = attendees.filter(a => pendingIds.includes(a.id) && !a.isCheckedIn).length;

              return (
                <>
                  <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-wrap justify-between items-center gap-3 shrink-0">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-650">
                      <span>Chờ đồng bộ: <span className="text-slate-900 font-black">{unsyncedCount}</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Có mặt ngoại tuyến: <span className="text-emerald-700 font-black">{offlineCheckedCount}</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Chưa điểm danh ngoại tuyến: <span className="text-slate-500 font-black">{offlineAbsentCount}</span></span>
                    </div>
                    
                    <div className="flex gap-2">
                      {filtered.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            let csvContent = 'ID,Danh xưng,Họ và tên,Cơ quan,Số ĐT,Email,Gói Đăng Ký,Phí (VNĐ),Thanh Toán,Check In,Thời gian Check In\n';
                            filtered.forEach(a => {
                              csvContent += `"${a.id}","${a.title}","${a.fullName}","${a.organization}","${a.phone}","${a.email}","${a.packageName}",${a.packageFee},"${a.paymentStatus}","${a.isCheckedIn ? 'Đã có mặt' : 'Chưa'}","${a.checkInTime || ''}"\n`;
                            });
                            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', `DS_Chua_Dong_Bo_Offline_${new Date().toISOString().split('T')[0]}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                        >
                          <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                          Xuất Excel chưa đồng bộ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Local search bar */}
                  <div className="p-4 border-b border-slate-100 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={offlineSearchQuery}
                        onChange={(e) => setOfflineSearchQuery(e.target.value)}
                        placeholder="Tìm nhanh đại biểu chưa đồng bộ theo Họ tên, SĐT, hoặc Mã ID..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold focus:outline-none placeholder-slate-400 transition-all uppercase"
                      />
                    </div>
                  </div>

                  {/* List Table Area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {(() => {
                      if (filtered.length === 0) {
                        if (unsyncedCount === 0) {
                          return (
                            <div className="text-center p-12 text-slate-500 flex flex-col items-center justify-center gap-3">
                              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                                <Check className="w-6 h-6 animate-pulse" />
                              </div>
                              <div className="font-extrabold text-sm text-slate-800">Tất cả dữ liệu đã được đồng bộ!</div>
                              <p className="text-xs text-slate-400 max-w-sm text-center">
                                Không có thao tác check-in ngoại tuyến nào chưa đồng bộ. Hệ thống của bạn đang khớp hoàn toàn với máy chủ Cloud.
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="text-center p-8 text-slate-400 italic text-xs">
                            Không tìm thấy đại biểu chưa đồng bộ nào khớp với từ khóa tìm kiếm...
                          </div>
                        );
                      }

                      return (
                        <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                          <table className="w-full text-xs text-left text-slate-500 border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-150 text-[9px] uppercase font-mono tracking-wider font-bold text-slate-500">
                              <tr>
                                <th className="p-3 pl-4">Mã Số</th>
                                <th className="p-3">Họ Và Tên</th>
                                <th className="p-3">Số ĐT / Đơn vị</th>
                                <th className="p-3">Gói Vé</th>
                                <th className="p-3 text-center">Check-In Offline</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 bg-white">
                              {filtered.map(att => (
                                <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 pl-4 font-mono font-bold text-slate-900 select-all">{att.id}</td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-800 uppercase">{formatName(att.title, att.fullName)}</div>
                                    {att.cmeRequired && (
                                      <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 px-1 py-0.2 rounded font-black mt-1 inline-block uppercase">Cấp CME</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="font-mono text-slate-700">{att.phone}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={att.organization}>{att.organization}</div>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-650">{att.packageName}</td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleToggleCheckIn(att.id);
                                        }}
                                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border cursor-pointer ${
                                          att.isCheckedIn
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                        }`}
                                      >
                                        {att.isCheckedIn ? '✓ ĐÃ CÓ MẶT' : '✗ CHƯA CHECK-IN'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest">
                        Trình duyệt ngoại tuyến sảnh // Local Storage active
                      </span>
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          <Wifi className="w-2.5 h-2.5 text-emerald-600" /> Có Internet
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                          <WifiOff className="w-2.5 h-2.5 text-amber-600 animate-pulse" /> Không Internet
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOnline && unsyncedCount > 0 && (
                        <button
                          type="button"
                          disabled={isSyncingOffline}
                          onClick={handleSyncOfflineData}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer border-none shadow flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <RefreshCcw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                          {isSyncingOffline ? 'Đang đồng bộ...' : 'Đồng bộ lên Cloud ⚡'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowOfflineListModal(false)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer border-none shadow"
                      >
                        Đóng lại
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BULK EMAIL QUEUE MODAL — Gửi email hàng loạt chống spam
          Cơ chế: delay 2s/email, batch pause 8s/20 email, retry 2× backoff
          ═══════════════════════════════════════════════════════════════════ */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center">
                  <Send className="w-4.5 h-4.5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase">Gửi Email Hàng Loạt (Queue + Anti-Spam)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Xếp hàng FIFO · Delay 2s/email · Batch pause 8s/20 email · Auto-retry 2×</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (emailQueueRunning) emailQueue.cancel();
                  setShowBulkEmailModal(false);
                }}
                disabled={emailQueueRunning && emailQueueStatus?.state !== 'completed' && emailQueueStatus?.state !== 'cancelled'}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer border-none bg-transparent disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-900">

              {/* Config section — only when not yet started */}
              {!emailQueueStatus && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-800 leading-relaxed">
                    <p className="font-black text-sm mb-1">📋 Cơ chế hàng đợi chống Spam Gmail SMTP</p>
                    <ul className="space-y-1 list-none pl-1">
                      <li>⏱ <strong>Delay cố định 2 giây</strong> giữa mỗi email — tránh flood SMTP</li>
                      <li>🔁 <strong>Retry tự động 2 lần</strong> với backoff 5s → 10s khi lỗi tạm thời</li>
                      <li>⚡ <strong>Batch pause 8 giây</strong> sau mỗi 20 email — tránh bị block IP</li>
                      <li>🚫 <strong>Không retry</strong> với lỗi vĩnh viễn (email không tồn tại)</li>
                    </ul>
                  </div>

                  {/* Recipient count */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                      {selectedAttendeeIds.length}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">Đại biểu đã chọn</p>
                      <p className="text-slate-500 font-mono">
                        Dự kiến hoàn thành trong ~{Math.ceil(selectedAttendeeIds.length * 5 / 60)} phút
                        {selectedAttendeeIds.length > 20 && ` (bao gồm ${Math.floor(selectedAttendeeIds.length / 20)} lần batch pause)`}
                      </p>
                    </div>
                  </div>

                  {/* Template selector */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-1.5 uppercase">Mẫu email sẽ gửi</label>
                    <select
                      value={bulkEmailTemplateId}
                      onChange={e => setBulkEmailTemplateId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">— Mẫu mặc định (đăng ký thành công) —</option>
                      {store.getTemplates().filter(t => t.channel === 'email').map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Attendee preview list */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Danh sách ({selectedAttendeeIds.length} người)</p>
                    <div className="max-h-48 overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100">
                      {attendees.filter(a => selectedAttendeeIds.includes(a.id)).map((a, idx) => (
                        <div key={a.id} className="flex items-center gap-2.5 p-2.5 text-xs hover:bg-slate-50">
                          <span className="text-[10px] font-mono text-slate-400 w-6 text-right shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">{formatName(a.title, a.fullName)}</p>
                            <p className="text-slate-400 font-mono text-[10px] truncate">{a.email}</p>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            a.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            a.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {a.paymentStatus === 'paid' ? '✓ Đã TT' : a.paymentStatus === 'pending_verification' ? '⏳ Chờ' : 'Chưa TT'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Queue progress — shown while running or after done */}
              {emailQueueStatus && (
                <div className="space-y-4 animate-fade-in">

                  {/* Overall progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700">
                        {emailQueueStatus.state === 'running' ? '⚙️ Đang xử lý queue...' :
                         emailQueueStatus.state === 'paused' ? '⏸ Đang nghỉ chống spam...' :
                         emailQueueStatus.state === 'completed' ? '✅ Hoàn thành!' :
                         emailQueueStatus.state === 'cancelled' ? '🛑 Đã hủy' : '⏳ Đang khởi động...'}
                      </span>
                      <span className="font-mono text-indigo-700">
                        {emailQueueStatus.processed}/{emailQueueStatus.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${emailQueueStatus.total > 0 ? Math.round(emailQueueStatus.processed / emailQueueStatus.total * 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>✓ Thành công: <strong className="text-emerald-600">{emailQueueStatus.succeeded}</strong></span>
                      <span>✗ Thất bại: <strong className="text-rose-600">{emailQueueStatus.failed}</strong></span>
                      <span>Tổng: <strong className="text-slate-700">{emailQueueStatus.total}</strong></span>
                    </div>
                  </div>

                  {/* Delay countdown indicator */}
                  {(emailQueueStatus.state === 'running' || emailQueueStatus.state === 'paused') && emailQueueStatus.delayRemaining > 0 && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 animate-pulse ${
                      emailQueueStatus.state === 'paused'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <div className="text-2xl shrink-0">{emailQueueStatus.state === 'paused' ? '☕' : '⏱'}</div>
                      <div>
                        <p className="font-black">
                          {emailQueueStatus.state === 'paused'
                            ? `Batch pause — nghỉ ${(emailQueueStatus.delayRemaining / 1000).toFixed(1)}s để tránh spam filter`
                            : `Delay chống spam — gửi tiếp sau ${(emailQueueStatus.delayRemaining / 1000).toFixed(1)}s`}
                        </p>
                        <p className="text-[10px] opacity-70 mt-0.5">
                          Email hiện tại: <strong>#{emailQueueStatus.currentIndex + 1}</strong> / {emailQueueStatus.total}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Per-job results log */}
                  {emailQueueStatus.results.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1.5">Nhật ký gửi email</p>
                      <div className="max-h-52 overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100">
                        {[...emailQueueStatus.results].reverse().map((r: EmailJobResult) => (
                          <div key={r.jobId} className={`flex items-start gap-2.5 p-2.5 text-xs ${
                            r.status === 'success' ? 'bg-emerald-50/40' : 'bg-rose-50/40'
                          }`}>
                            <span className={`mt-0.5 shrink-0 text-base ${
                              r.status === 'success' ? 'text-emerald-600' : 'text-rose-500'
                            }`}>
                              {r.status === 'success' ? '✓' : '✗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate">{r.recipientName}</p>
                              <p className="text-slate-400 font-mono text-[10px] truncate">{r.recipientEmail}</p>
                              {r.status === 'failed' && r.error && (
                                <p className="text-rose-600 text-[10px] mt-0.5 font-medium truncate" title={r.error}>{r.error}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {r.attempts > 1 && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                  {r.attempts} lần thử
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary when done */}
                  {(emailQueueStatus.state === 'completed' || emailQueueStatus.state === 'cancelled') && (
                    <div className={`p-4 rounded-2xl border text-sm font-bold text-center ${
                      emailQueueStatus.state === 'completed'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}>
                      {emailQueueStatus.state === 'completed'
                        ? `🎉 Hoàn thành! ${emailQueueStatus.succeeded}/${emailQueueStatus.total} email đã gửi thành công.`
                        : `⚠️ Queue bị hủy. Đã gửi được ${emailQueueStatus.processed}/${emailQueueStatus.total} email.`
                      }
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center gap-3 shrink-0">
              <div className="text-[10px] text-slate-400 font-mono">
                {emailQueueStatus && emailQueueStatus.state !== 'idle'
                  ? `${emailQueueStatus.state.toUpperCase()} · ${emailQueueStatus.processed}/${emailQueueStatus.total} processed`
                  : `${selectedAttendeeIds.length} đại biểu đã chọn`
                }
              </div>
              <div className="flex gap-2">
                {/* Cancel button while running */}
                {emailQueueRunning && emailQueueStatus?.state === 'running' && (
                  <button
                    type="button"
                    onClick={() => emailQueue.cancel()}
                    className="px-4 py-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 cursor-pointer transition-all"
                  >
                    🛑 Hủy Queue
                  </button>
                )}

                {/* Close button — disabled while running */}
                <button
                  type="button"
                  onClick={() => {
                    if (emailQueueRunning && emailQueueStatus?.state === 'running') {
                      emailQueue.cancel();
                    }
                    setShowBulkEmailModal(false);
                  }}
                  disabled={emailQueueRunning && emailQueueStatus?.state !== 'completed' && emailQueueStatus?.state !== 'cancelled' && emailQueueStatus?.state !== 'paused'}
                  className="px-4 py-2 text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer transition-all disabled:opacity-40"
                >
                  {emailQueueStatus?.state === 'completed' || emailQueueStatus?.state === 'cancelled' ? 'Đóng lại' : 'Thoát'}
                </button>

                {/* Start / Done button */}
                {!emailQueueStatus && (
                  <button
                    type="button"
                    onClick={handleStartBulkEmail}
                    className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-md transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Bắt Đầu Gửi Email 🚀
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CAMPAIGN MODAL — Chiến dịch gửi email nhiều ngày (8000 email)
          Mỗi ngày chỉ gửi 1 đợt ≤ 700 người, tự động lưu tiến trình
          ═══════════════════════════════════════════════════════════════════ */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[94vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900 via-violet-950 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/25 flex items-center justify-center">
                  <CalendarDays className="w-4.5 h-4.5 text-violet-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase">Chiến Dịch Email Nhiều Ngày</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {campaign
                      ? `${campaign.name} · ${campaignStats?.batchesCompleted ?? 0}/${campaign.estimatedDays} đợt`
                      : 'Thiết lập chiến dịch gửi email tự động theo ngày'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (!campaignSending) setShowCampaignModal(false); }}
                disabled={campaignSending}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer border-none bg-transparent disabled:opacity-30"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── SETUP PANEL (khi chưa có chiến dịch) ─────────────────── */}
              {!campaign && (
                <div className="p-5 space-y-4">
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl text-xs text-violet-900 leading-relaxed">
                    <p className="font-black text-sm mb-2">📅 Cách hoạt động</p>
                    <ul className="space-y-1.5 list-none">
                      <li>1️⃣ Chọn danh sách đại biểu (hoặc dùng toàn bộ {attendees.length.toLocaleString()} người hiện tại)</li>
                      <li>2️⃣ Hệ thống chia thành các đợt <strong>{campaignDailyLimit} người/ngày</strong></li>
                      <li>3️⃣ Mỗi ngày mở app → bấm <strong>"Gửi Đợt Hôm Nay"</strong></li>
                      <li>4️⃣ Sau khi gửi xong đợt → tự động khóa đến ngày mai</li>
                      <li>5️⃣ Tiến trình được lưu tự động, đóng app không mất dữ liệu</li>
                    </ul>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-1.5 uppercase">Tên chiến dịch</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1.5 uppercase">Mẫu email</label>
                      <select
                        value={campaignTemplateId}
                        onChange={e => setCampaignTemplateId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500"
                      >
                        <option value="">— Mẫu mặc định —</option>
                        {store.getTemplates().filter(t => t.channel === 'email').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1.5 uppercase">Giới hạn email/ngày</label>
                      <select
                        value={campaignDailyLimit}
                        onChange={e => setCampaignDailyLimit(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500"
                      >
                        <option value={500}>500/ngày (~3.3h)</option>
                        <option value={700}>700/ngày (~4.7h) ✅</option>
                        <option value={800}>800/ngày (~5.3h)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Dự kiến tiến trình</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Tổng email', value: (selectedAttendeeIds.length > 0 ? selectedAttendeeIds.length : attendees.length).toLocaleString(), color: 'text-violet-700' },
                        { label: 'Số đợt', value: Math.ceil((selectedAttendeeIds.length > 0 ? selectedAttendeeIds.length : attendees.length) / campaignDailyLimit), color: 'text-indigo-700' },
                        { label: 'Số ngày', value: Math.ceil((selectedAttendeeIds.length > 0 ? selectedAttendeeIds.length : attendees.length) / campaignDailyLimit), color: 'text-emerald-700' },
                      ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl p-3 border border-slate-150 shadow-xs">
                          <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    {selectedAttendeeIds.length > 0 && (
                      <p className="text-[10px] text-violet-600 font-bold mt-2 text-center">
                        📌 Dùng {selectedAttendeeIds.length.toLocaleString()} đại biểu đã chọn
                      </p>
                    )}
                    {selectedAttendeeIds.length === 0 && (
                      <p className="text-[10px] text-slate-400 mt-2 text-center">
                        💡 Sẽ dùng toàn bộ {attendees.length.toLocaleString()} đại biểu hiện tại
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-md transition-all active:scale-[.99]"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Tạo Chiến Dịch Email
                  </button>
                </div>
              )}

              {/* ── CAMPAIGN DASHBOARD (khi đã có chiến dịch) ─────────────── */}
              {campaign && campaignStats && (
                <div className="p-5 space-y-4">

                  {/* Overall progress */}
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-black text-violet-900 truncate max-w-xs">{campaign.name}</p>
                        <p className="text-[10px] text-violet-600 font-mono mt-0.5">
                          Đợt {campaignStats.batchesCompleted} / {campaign.estimatedDays} · {campaign.status === 'completed' ? '🎉 Hoàn thành!' : `Còn ~${campaignStats.estimatedDaysLeft} ngày`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-violet-800">{campaignStats.progressPercent}%</p>
                        <p className="text-[10px] text-violet-500 font-mono">{campaignStats.sentCount.toLocaleString()}/{campaignStats.totalCount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-violet-200/60 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${campaignStats.progressPercent}%` }}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                      {[
                        { label: 'Đã gửi', value: campaignStats.sentCount.toLocaleString(), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-150' },
                        { label: 'Còn lại', value: campaignStats.pendingCount.toLocaleString(), color: 'text-violet-700', bg: 'bg-violet-50 border-violet-150' },
                        { label: 'Lỗi vĩnh viễn', value: campaignStats.failedCount.toLocaleString(), color: 'text-rose-700', bg: 'bg-rose-50 border-rose-150' },
                        { label: 'Số đợt xong', value: String(campaignStats.batchesCompleted), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-150' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl p-2 border ${s.bg}`}>
                          <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Today's batch status / send area */}
                  {campaign.status === 'active' && (
                    <div className={`rounded-2xl border p-4 ${campaignStats.canSendToday ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      {campaignStats.canSendToday ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs font-black text-emerald-800">
                              Đợt {campaignStats.nextBatchNo} — Sẵn sàng gửi hôm nay ({campaignStats.nextBatchSize.toLocaleString()} email)
                            </p>
                          </div>
                          <p className="text-[10px] text-emerald-700 font-mono">
                            Thời gian dự kiến: ~{Math.ceil(campaignStats.nextBatchSize * 5 / 60)} phút
                            {campaignStats.nextBatchSize > 20 && ` · ${Math.floor(campaignStats.nextBatchSize / 20)} lần batch pause`}
                          </p>

                          {/* Queue progress while sending */}
                          {campaignSending && campaignQueueStatus && (
                            <div className="space-y-2 mt-2">
                              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                <span>{campaignQueueStatus.state === 'paused' ? '☕ Batch pause...' : '⚙️ Đang gửi...'}</span>
                                <span className="font-mono">{campaignQueueStatus.processed}/{campaignQueueStatus.total}</span>
                              </div>
                              <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${campaignQueueStatus.total > 0 ? Math.round(campaignQueueStatus.processed / campaignQueueStatus.total * 100) : 0}%` }}
                                />
                              </div>
                              {campaignQueueStatus.delayRemaining > 0 && (
                                <p className="text-[10px] text-emerald-700 font-mono animate-pulse">
                                  {campaignQueueStatus.state === 'paused'
                                    ? `⏸ Nghỉ ${(campaignQueueStatus.delayRemaining / 1000).toFixed(1)}s...`
                                    : `⏱ Gửi tiếp sau ${(campaignQueueStatus.delayRemaining / 1000).toFixed(1)}s`}
                                </p>
                              )}
                              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>✓ {campaignQueueStatus.succeeded} thành công</span>
                                <span>✗ {campaignQueueStatus.failed} thất bại</span>
                              </div>
                            </div>
                          )}

                          {!campaignSending && (
                            <button
                              type="button"
                              onClick={handleSendTodayBatch}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-md transition-all active:scale-[.99]"
                            >
                              <Send className="w-4 h-4" />
                              Gửi Đợt {campaignStats.nextBatchNo} Hôm Nay ({campaignStats.nextBatchSize.toLocaleString()} email)
                            </button>
                          )}
                          {campaignSending && (
                            <button
                              type="button"
                              onClick={() => emailQueue.cancel()}
                              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer border border-rose-200 transition-all"
                            >
                              🛑 Dừng khẩn cấp
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">✅</div>
                          <div>
                            <p className="text-xs font-black text-slate-700">Đã gửi đợt hôm nay ({campaign.lastBatchDate})</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Quay lại vào <strong>ngày mai</strong> để gửi đợt {campaignStats.nextBatchNo} ({campaignStats.nextBatchSize.toLocaleString()} email tiếp theo).
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {campaign.status === 'completed' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <p className="text-2xl mb-1">🎉</p>
                      <p className="text-sm font-black text-emerald-800">Chiến dịch hoàn thành!</p>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        Đã gửi {campaignStats.sentCount.toLocaleString()} email trong {campaignStats.batchesCompleted} đợt.
                      </p>
                    </div>
                  )}

                  {/* Batch history */}
                  {campaign.batches.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Lịch sử các đợt đã gửi</p>
                      <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {[...campaign.batches].reverse().map(b => (
                          <div key={b.batchNo} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                {b.batchNo}
                              </span>
                              <div>
                                <p className="font-bold text-slate-800">Đợt {b.batchNo} — {b.date}</p>
                                <p className="text-slate-400 font-mono text-[10px]">{b.attendeeIds.length} người</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-emerald-600">✓ {b.sent}</p>
                              {b.failed > 0 && <p className="text-rose-500 font-bold">✗ {b.failed}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Danger zone */}
                  <div className="pt-2 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm('Xóa toàn bộ chiến dịch? Tiến trình sẽ mất!')) return;
                        campaignManager.delete();
                        setCampaign(null);
                        setCampaignStats(null);
                        setCampaignQueueStatus(null);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer bg-transparent border-none"
                    >
                      🗑 Xóa chiến dịch và bắt đầu lại
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center shrink-0">
              <div className="text-[10px] text-slate-400 font-mono">
                {campaign
                  ? `ID: ${campaign.id.slice(0, 18)}... · Tạo: ${new Date(campaign.createdAt).toLocaleDateString('vi-VN')}`
                  : 'Tiến trình lưu tự động vào trình duyệt'}
              </div>
              <button
                type="button"
                onClick={() => { if (!campaignSending) setShowCampaignModal(false); }}
                disabled={campaignSending}
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer border-none disabled:opacity-40"
              >
                {campaignSending ? 'Đang gửi...' : 'Đóng'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
