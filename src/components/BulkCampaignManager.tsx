import React, { useState, useEffect, useRef } from 'react';
import { Mail, Smartphone, Trash2, Plus, Check, X, Smartphone as PhoneIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Code, Palette, Upload, Play, Pause, Square, Users, CheckSquare, ChevronLeft, Search, History, BarChart3, Info, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { store } from '../dataStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { NotificationTemplate, SentNotificationLog, Contact, SendingCampaign, CampaignRecipient } from '../types';

export default function BulkCampaignManager() {
  const [campaigns, setCampaigns] = useState<SendingCampaign[]>(() => store.getCampaigns());
  const [activeCampaign, setActiveCampaign] = useState<SendingCampaign | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignSearchText, setCampaignSearchText] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('all');
  const [recipientSearchText, setRecipientSearchText] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('all');

  // Composer states
  const [bulkChannel, setBulkChannel] = useState<'email' | 'zalo'>('email');
  const [resendConfig, setResendConfigState] = useState(() => store.getResendConfig());
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [bulkSubject, setBulkSubject] = useState('Thư xác nhận tham dự Hội nghị Khoa học Thẩm mỹ PARS 2026');
  const [bulkBody, setBulkBody] = useState('<p>Kính gửi anh/chị <strong>{{Tên}}</strong>,</p>\n<p>Ban tổ chức Hội nghị Khoa học Thẩm mỹ Quốc tế Thường niên PARS 2026 trân trọng xác nhận thông tin đăng ký của anh/chị.</p>\n<p>Thông tin chi tiết:</p>\n<ul>\n<li>Hộp thư: {{Email}}</li>\n<li>Điện thoại: {{Số điện thoại}}</li>\n</ul>\n<p>Hệ thống tự động đã kích hoạt vé tham dự của anh/chị. Vui lòng mang theo email này để quét mã QR check-in tại sảnh chính.</p>\n<p>Trân trọng,<br>Ban tổ chức PARS 2026</p>');
  const [bulkEditorMode, setBulkEditorMode] = useState<'visual' | 'code'>('visual');
  const bulkEditorRef = useRef<HTMLDivElement>(null);

  // Zalo OA templates
  const [zaloTemplates, setZaloTemplates] = useState<NotificationTemplate[]>(() =>
    store.getTemplates().filter(t => t.channel === 'zalo')
  );
  const [selectedZaloTemplate, setSelectedZaloTemplate] = useState<NotificationTemplate | null>(zaloTemplates[0] || null);

  // Queue states
  const [sendingIndex, setSendingIndex] = useState(-1);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isBulkPaused, setIsBulkPaused] = useState(false);
  const [bulkLogs, setBulkLogs] = useState<any[]>([]);
  const isBulkSendingRef = useRef(false);
  const isBulkPausedRef = useRef(false);

  // Contacts integration
  const [contacts, setContacts] = useState<Contact[]>(() => store.getContacts());
  const [listSource, setListSource] = useState<'file' | 'saved' | 'attendees' | 'speakers'>('file');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [saveToContacts, setSaveToContacts] = useState<boolean>(true);
  const [contactGroupName, setContactGroupName] = useState<string>('');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  // Synchronize store updates
  useEffect(() => {
    const handleStoreUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.table === 'contacts') {
        setContacts(store.getContacts());
      }
      if (detail && detail.table === 'system_config') {
        setResendConfigState(store.getResendConfig());
      }
      if (detail && detail.table === 'sending_campaigns') {
        setCampaigns(store.getCampaigns());
        setActiveCampaign(prev => {
          if (!prev) return null;
          const updated = store.getCampaigns().find(c => c.id === prev.id);
          if (updated && !isBulkSendingRef.current) {
            return updated;
          }
          return prev;
        });
      }
      if (detail && detail.table === 'notification_templates') {
        setZaloTemplates(store.getTemplates().filter(t => t.channel === 'zalo'));
      }
    };
    window.addEventListener('store-updated', handleStoreUpdate);
    return () => {
      window.removeEventListener('store-updated', handleStoreUpdate);
    };
  }, []);

  // Update Visual editor value when code mode edits body
  useEffect(() => {
    if (bulkEditorRef.current && bulkEditorMode === 'visual') {
      if (bulkEditorRef.current.innerHTML !== bulkBody) {
        bulkEditorRef.current.innerHTML = bulkBody;
      }
    }
  }, [bulkEditorMode, bulkChannel, bulkBody]);

  const handleBulkEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setBulkBody(e.currentTarget.innerHTML);
  };

  const handleBulkFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (bulkEditorRef.current) {
      setBulkBody(bulkEditorRef.current.innerHTML);
      bulkEditorRef.current.focus();
    }
  };

  const insertBulkPlaceholder = (ph: string) => {
    const textToInsert = `{{${ph}}}`;
    if (bulkChannel === 'email' && bulkEditorMode === 'visual') {
      bulkEditorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        if (bulkEditorRef.current) {
          bulkEditorRef.current.innerHTML += textToInsert;
        }
      }
      if (bulkEditorRef.current) {
        setBulkBody(bulkEditorRef.current.innerHTML);
      }
    } else {
      const textarea = document.getElementById('bulk-body-textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + textToInsert + text.substring(end);
        setBulkBody(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        }, 10);
      }
    }
  };

  const generateContactId = (groupName: string, name: string, email: string, phone: string): string => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanName = (name || '').trim();
    const rawStr = `${groupName.trim()}_${cleanName}_${cleanEmail}_${cleanPhone}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hashPart = Math.abs(hash).toString(36).toUpperCase();
    return `CON-${hashPart}`;
  };

  const handleSaveToContacts = async () => {
    if (excelData.length === 0) {
      alert('Không có dữ liệu để lưu.');
      return;
    }
    const groupName = (contactGroupName || excelFileName || 'Nhóm mặc định').replace(/\.[^/.]+$/, "").trim();
    const contactsToSave: Contact[] = excelData.map(d => ({
      id: generateContactId(groupName, d.name, d.email, d.phone),
      name: d.name,
      email: d.email,
      phone: d.phone,
      groupName: groupName
    }));
    try {
      await store.saveContacts(contactsToSave);
      setIsSavedSuccessfully(true);
      setTimeout(() => setIsSavedSuccessfully(false), 3000);
      alert(`Đã lưu thành công ${contactsToSave.length} liên hệ vào nhóm danh bạ "${groupName}"!`);
    } catch (err: any) {
      alert('Lỗi lưu liên hệ: ' + err.message);
    }
  };

  const loadSavedGroup = (groupName: string) => {
    if (!groupName) {
      setExcelData([]);
      setExcelFileName('');
      return;
    }
    const groupContacts = contacts.filter(c => c.groupName === groupName);
    const records = groupContacts.map((c, index) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const isEmailValid = emailRegex.test(c.email || '');
      const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 11;
      return {
        id: index + 1,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        isEmailValid,
        isPhoneValid,
        status: 'pending' as const,
        error: ''
      };
    });
    setExcelData(records);
    setExcelFileName(`Danh bạ: ${groupName}`);
    setContactGroupName(groupName);
    setSendingIndex(-1);
    setBulkLogs([]);
  };

  const loadAttendeesList = () => {
    const list = store.getAttendees();
    const records = list.map((a, index) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanPhone = (a.phone || '').replace(/[^0-9]/g, '');
      const isEmailValid = emailRegex.test(a.email || '');
      const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 11;
      const payStatusText = a.paymentStatus === 'paid' ? 'Đã Thanh Toán' : a.paymentStatus === 'pending_verification' ? 'Chờ Đối Soát' : 'Chưa Thanh Toán';
      return {
        id: index + 1,
        name: a.fullName,
        email: a.email || '',
        phone: a.phone || '',
        isEmailValid,
        isPhoneValid,
        status: 'pending' as const,
        error: '',
        title: a.title || '',
        fullname: a.fullName || '',
        package: a.packageName || '',
        code: a.id || '',
        payment_status: payStatusText,
        package_fee: a.packageFee ? new Intl.NumberFormat('vi-VN').format(a.packageFee) : '0',
        organization: a.organization || '',
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(a.qrCodeValue)}`
      };
    });
    setExcelData(records);
    setExcelFileName(`Danh sách Đại biểu (${list.length} người)`);
    setContactGroupName('Đại biểu');
    setSendingIndex(-1);
    setBulkLogs([]);
  };

  const loadSpeakersList = () => {
    const list = store.getSpeakers();
    const records = list.map((s, index) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
      const isEmailValid = emailRegex.test(s.email || '');
      const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 11;
      return {
        id: index + 1,
        name: s.fullName,
        email: s.email || '',
        phone: s.phone || '',
        isEmailValid,
        isPhoneValid,
        status: 'pending' as const,
        error: '',
        title: s.title || '',
        fullname: s.fullName || '',
        presentation_title: s.presentationTitle || '',
        track: s.presentationTrack || '',
        organization: s.organization || ''
      };
    });
    setExcelData(records);
    setExcelFileName(`Danh sách Báo cáo viên (${list.length} người)`);
    setContactGroupName('Báo cáo viên');
    setSendingIndex(-1);
    setBulkLogs([]);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const defaultGroupName = file.name.replace(/\.[^/.]+$/, "");
    setContactGroupName(defaultGroupName);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          alert('Tập tin trống hoặc không hợp lệ.');
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').trim());
        const nameIdx = headers.findIndex(h => /tên|name|họ tên/i.test(h));
        const emailIdx = headers.findIndex(h => /email|thư/i.test(h));
        const phoneIdx = headers.findIndex(h => /điện thoại|phone|sđt|sdt/i.test(h));

        if (nameIdx === -1 && emailIdx === -1 && phoneIdx === -1) {
          alert('Không tìm thấy cột Tên, Email hoặc Số điện thoại trong file.');
          return;
        }

        const records = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== null && cell !== ''))
          .map((row, index) => {
            const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
            const email = emailIdx !== -1 ? String(row[emailIdx] || '').trim() : '';
            const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const isEmailValid = emailRegex.test(email);
            const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 11;
            return {
              id: index + 1,
              name,
              email,
              phone,
              isEmailValid,
              isPhoneValid,
              status: 'pending' as const,
              error: ''
            };
          });

        setExcelData(records);
        setBulkLogs([]);
        setSendingIndex(-1);
      } catch (err: any) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const startBulkSending = async (campaignToStart?: SendingCampaign) => {
    let currentCampaign = campaignToStart || activeCampaign;

    if (excelData.length === 0 && (!currentCampaign || currentCampaign.recipients.length === 0)) {
      alert('Vui lòng nạp danh sách người nhận trước.');
      return;
    }

    if (bulkChannel === 'email') {
      const currentResend = store.getResendConfig();
      if (!currentResend.apiKey || !currentResend.senderEmail) {
        alert('Vui lòng vào mục "Cài đặt hệ thống" để cấu hình Resend API Key và Email gửi đi trước khi bắt đầu.');
        return;
      }
    } else {
      const zConfig = store.getZaloConfig();
      const isRealZalo = (zConfig.accessToken && zConfig.accessToken !== 'zalo-oa-token-active-2026-ready-pars') || isSupabaseConfigured();
      if (!isRealZalo) {
        alert('Zalo OA chưa được cấu hình. Vui lòng thiết lập cấu hình Zalo OA trong mục Cài Đặt Hệ Thống.');
        return;
      }
    }

    if (!currentCampaign && listSource === 'file' && saveToContacts && excelData.length > 0) {
      const groupName = (contactGroupName || excelFileName || 'Nhóm mặc định').replace(/\.[^/.]+$/, "").trim();
      const contactsToSave: Contact[] = excelData.map(d => ({
        id: generateContactId(groupName, d.name, d.email, d.phone),
        name: d.name,
        email: d.email,
        phone: d.phone,
        groupName: groupName
      }));
      try {
        await store.saveContacts(contactsToSave);
      } catch (err) {
        console.error('Lỗi tự động lưu danh bạ:', err);
      }
    }

    setIsBulkSending(true);
    setIsBulkPaused(false);
    isBulkSendingRef.current = true;
    isBulkPausedRef.current = false;

    if (!currentCampaign) {
      const campaignId = 'CMP-' + Math.floor(Math.random() * 900000 + 100000);
      currentCampaign = {
        id: campaignId,
        name: campaignName.trim() || `Chiến dịch gửi ${bulkChannel === 'email' ? 'Email' : 'Zalo'} - ${new Date().toLocaleString()}`,
        channel: bulkChannel,
        templateId: bulkChannel === 'email' ? 'resend-bulk' : (selectedZaloTemplate?.id || 'zalo-bulk'),
        subject: bulkChannel === 'email' ? bulkSubject : undefined,
        body: bulkChannel === 'email' ? bulkBody : undefined,
        status: 'sending',
        totalRecipients: excelData.length,
        successCount: 0,
        failedCount: 0,
        recipients: excelData.map(item => ({ ...item, status: 'pending', error: '' })),
        logs: [`[${new Date().toLocaleTimeString()}] Khởi tạo chiến dịch`],
        createdAt: new Date().toISOString()
      };
      setExcelData(currentCampaign.recipients);
      setSendingIndex(0);
      setBulkLogs(currentCampaign.logs);
      setIsCreatingCampaign(false);
    } else {
      currentCampaign = {
        ...currentCampaign,
        status: 'sending',
        subject: bulkChannel === 'email' ? bulkSubject : currentCampaign.subject,
        body: bulkChannel === 'email' ? bulkBody : currentCampaign.body,
      };
    }

    setActiveCampaign(currentCampaign);
    await store.saveCampaign(currentCampaign);

    const recipients = [...currentCampaign.recipients];
    let successCount = currentCampaign.successCount;
    let failedCount = currentCampaign.failedCount;
    let logsList = [...currentCampaign.logs];

    let startIndex = recipients.findIndex(r => r.status === 'pending');
    if (startIndex === -1) {
      const hasFailed = recipients.some(r => r.status === 'failed');
      if (hasFailed) {
        recipients.forEach(r => {
          if (r.status === 'failed') {
            r.status = 'pending';
            r.error = '';
          }
        });
        startIndex = recipients.findIndex(r => r.status === 'pending');
      } else {
        startIndex = 0;
      }
    }

    for (let i = startIndex; i < recipients.length; i++) {
      if (!isBulkSendingRef.current) {
        currentCampaign.status = 'paused';
        currentCampaign.recipients = recipients;
        currentCampaign.successCount = successCount;
        currentCampaign.failedCount = failedCount;
        currentCampaign.logs = logsList;
        await store.saveCampaign(currentCampaign);
        setActiveCampaign({ ...currentCampaign });
        break;
      }

      while (isBulkPausedRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (!isBulkSendingRef.current) break;
      }

      if (!isBulkSendingRef.current) {
        currentCampaign.status = 'paused';
        currentCampaign.recipients = recipients;
        currentCampaign.successCount = successCount;
        currentCampaign.failedCount = failedCount;
        currentCampaign.logs = logsList;
        await store.saveCampaign(currentCampaign);
        setActiveCampaign({ ...currentCampaign });
        break;
      }

      setSendingIndex(i);
      recipients[i].status = 'sending';
      setExcelData([...recipients]);

      const recipient = recipients[i];
      let success = false;
      let errorMsg = '';

      if (bulkChannel === 'email') {
        if (!recipient.isEmailValid) {
          errorMsg = 'Email không hợp lệ';
        } else {
          try {
            let compiledBody = bulkBody
              .replace(/\{\{Tên\}\}/g, recipient.name || '')
              .replace(/\{\{Email\}\}/g, recipient.email || '')
              .replace(/\{\{Số điện thoại\}\}/g, recipient.phone || '');
            let compiledSubject = bulkSubject
              .replace(/\{\{Tên\}\}/g, recipient.name || '');

            Object.keys(recipient).forEach(key => {
              const val = recipient[key];
              if (val !== undefined && val !== null && typeof val !== 'object') {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                compiledBody = compiledBody.replace(regex, String(val));
                compiledSubject = compiledSubject.replace(regex, String(val));
              }
            });

            const res = await fetch('/api/email/send-resend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey: resendConfig.apiKey,
                from: resendConfig.senderEmail,
                to: recipient.email,
                subject: compiledSubject,
                html: compiledBody
              })
            });

            const resData = await res.json();
            if (resData.success) {
              success = true;
            } else {
              errorMsg = resData.error || 'Lỗi gửi email qua Resend';
            }
          } catch (err: any) {
            errorMsg = err.message || 'Lỗi kết nối API Resend';
          }
        }
      } else {
        if (!recipient.isPhoneValid) {
          errorMsg = 'Số điện thoại không hợp lệ';
        } else {
          try {
            let formattedPhone = recipient.phone.replace(/[^0-9]/g, '');
            if (formattedPhone.startsWith('0')) {
              formattedPhone = '84' + formattedPhone.substring(1);
            }

            const znsData: any = {
              title: recipient.title || 'Đại biểu',
              fullname: recipient.fullname || recipient.name || '',
              phone: recipient.phone || '',
              email: recipient.email || '',
              code: recipient.code || ('ATT-' + Math.floor(Math.random() * 9000 + 1000)),
              package: recipient.package || 'Tiêu chuẩn',
              payment_status: recipient.payment_status || 'Đã thanh toán',
              package_fee: recipient.package_fee || '0',
              organization: recipient.organization || 'Cá nhân',
              presentation_title: recipient.presentation_title || '',
              track: recipient.track || '',
              qr_url: recipient.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(recipient.code || ('PARS-BULK-' + formattedPhone))}`
            };

            const znsTemplateId = selectedZaloTemplate?.znsTemplateId || selectedZaloTemplate?.id || 'tmpl-reg-zalo';

            const response = await fetch('/api/zalo/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: store.getZaloConfig(),
                payload: {
                  recipient: { phone: formattedPhone },
                  template_id: znsTemplateId,
                  template_data: znsData
                }
              })
            });

            const resData = await response.json();
            if (resData.success && (!resData.data || resData.data.error === 0)) {
              success = true;
            } else {
              errorMsg = resData.error || (resData.data && resData.data.message) || 'Lỗi gửi Zalo ZNS';
            }
          } catch (err: any) {
            errorMsg = err.message || 'Lỗi kết nối API Zalo';
          }
        }
      }

      recipient.status = success ? 'success' : 'failed';
      recipient.error = errorMsg;
      if (success) successCount++;
      else failedCount++;

      const timeStr = new Date().toLocaleTimeString();
      const logEntry = `[${timeStr}] Gửi tới ${recipient.name} (${bulkChannel === 'email' ? recipient.email : recipient.phone}): ${success ? 'Thành công' : 'Thất bại - ' + errorMsg}`;
      logsList = [logEntry, ...logsList];
      setBulkLogs(logsList);
      setExcelData([...recipients]);

      currentCampaign.recipients = recipients;
      currentCampaign.successCount = successCount;
      currentCampaign.failedCount = failedCount;
      currentCampaign.logs = logsList;

      if (i === recipients.length - 1) {
        currentCampaign.status = 'completed';
      }

      await store.saveCampaign(currentCampaign);
      setActiveCampaign({ ...currentCampaign });

      const storeLog: SentNotificationLog = {
        id: 'NTF-' + Math.floor(Math.random() * 90000 + 10000),
        recipient: bulkChannel === 'email' ? recipient.email : recipient.phone,
        type: bulkChannel,
        templateId: bulkChannel === 'email' ? 'resend-bulk' : (selectedZaloTemplate?.id || 'zalo-bulk'),
        templateName: bulkChannel === 'email' ? 'Gửi Email Hàng Loạt qua Resend' : (selectedZaloTemplate?.name || 'Gửi Zalo OA Hàng Loạt'),
        sender: bulkChannel === 'email' ? resendConfig.senderEmail : (store.getZaloConfig().oaId || 'Zalo OA'),
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: success ? 'success' : 'failed',
        payload: { name: recipient.name, email: recipient.email, phone: recipient.phone },
        response: { success, error: errorMsg }
      };
      store.addNotificationLog(storeLog);

      await new Promise(r => setTimeout(r, 800));
    }

    setIsBulkSending(false);
    isBulkSendingRef.current = false;
  };

  const pauseBulkSending = async () => {
    setIsBulkPaused(true);
    isBulkPausedRef.current = true;
    if (activeCampaign) {
      const updated = { ...activeCampaign, status: 'paused' as const };
      setActiveCampaign(updated);
      await store.saveCampaign(updated);
    }
  };

  const resumeBulkSending = () => {
    setIsBulkPaused(false);
    isBulkPausedRef.current = false;
    startBulkSending(activeCampaign || undefined);
  };

  const stopBulkSending = async () => {
    setIsBulkSending(false);
    isBulkSendingRef.current = false;
    setIsBulkPaused(false);
    isBulkPausedRef.current = false;
    if (activeCampaign) {
      const updated = { ...activeCampaign, status: 'paused' as const };
      setActiveCampaign(updated);
      await store.saveCampaign(updated);
    }
  };

  const saveDraftCampaign = async () => {
    if (excelData.length === 0) {
      alert('Vui lòng nạp danh sách người nhận trước.');
      return;
    }
    const campaignId = 'CMP-' + Math.floor(Math.random() * 900000 + 100000);
    const draftCampaign: SendingCampaign = {
      id: campaignId,
      name: campaignName.trim() || `Bản nháp gửi ${bulkChannel === 'email' ? 'Email' : 'Zalo'} - ${new Date().toLocaleString()}`,
      channel: bulkChannel,
      templateId: bulkChannel === 'email' ? 'resend-bulk' : (selectedZaloTemplate?.id || 'zalo-bulk'),
      subject: bulkChannel === 'email' ? bulkSubject : undefined,
      body: bulkChannel === 'email' ? bulkBody : undefined,
      status: 'draft',
      totalRecipients: excelData.length,
      successCount: 0,
      failedCount: 0,
      recipients: excelData.map(item => ({ ...item, status: 'pending', error: '' })),
      logs: [`[${new Date().toLocaleTimeString()}] Đã lưu bản nháp chiến dịch`],
      createdAt: new Date().toISOString()
    };
    await store.saveCampaign(draftCampaign);
    setIsCreatingCampaign(false);
    setActiveCampaign(null);
    alert('Đã lưu bản nháp thành công!');
  };

  return (
    <div className="space-y-6">
      {/* VIEW 1: CAMPAIGN HISTORY LIST */}
      {!activeCampaign && !isCreatingCampaign && (
        <div className="space-y-6 animate-fadeIn">
          {/* Thống kê chiến dịch */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng chiến dịch</span>
                <span className="text-2xl font-black text-slate-800">{campaigns.length}</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng tin đã gửi</span>
                <span className="text-2xl font-black text-slate-800">
                  {campaigns.reduce((sum, c) => sum + (c.successCount + c.failedCount), 0)}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gửi thành công</span>
                <span className="text-2xl font-black text-slate-800 font-extrabold text-emerald-600">
                  {campaigns.reduce((sum, c) => sum + c.successCount, 0)}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tỷ lệ thành công</span>
                <span className="text-2xl font-black text-slate-800">
                  {(() => {
                    const total = campaigns.reduce((sum, c) => sum + (c.successCount + c.failedCount), 0);
                    const success = campaigns.reduce((sum, c) => sum + c.successCount, 0);
                    return total > 0 ? `${Math.round((success / total) * 100)}%` : '0%';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Bộ lọc & Danh sách chiến dịch */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 text-sm">Lịch sử Chiến dịch gửi tin</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{campaigns.length}</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chiến dịch..."
                    value={campaignSearchText}
                    onChange={(e) => setCampaignSearchText(e.target.value)}
                    className="pl-9 pr-4 py-2 w-60 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-700"
                  />
                </div>

                <select
                  value={campaignStatusFilter}
                  onChange={(e) => setCampaignStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-semibold text-slate-700"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Bản nháp</option>
                  <option value="sending">Đang gửi</option>
                  <option value="paused">Tạm dừng</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>

                <button
                  onClick={() => {
                    setIsCreatingCampaign(true);
                    setCampaignName(`Chiến dịch ngày ${new Date().toLocaleDateString('vi-VN')} - ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
                    setExcelData([]);
                    setExcelFileName('');
                    setSendingIndex(-1);
                    setBulkLogs([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Chiến Dịch Mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    <th className="px-5 py-3">Mã</th>
                    <th className="px-5 py-3">Tên chiến dịch</th>
                    <th className="px-5 py-3">Kênh</th>
                    <th className="px-5 py-3">Tiến độ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {campaigns
                    .filter(c => {
                      const matchesSearch = c.name.toLowerCase().includes(campaignSearchText.toLowerCase()) || c.id.toLowerCase().includes(campaignSearchText.toLowerCase());
                      const matchesStatus = campaignStatusFilter === 'all' || c.status === campaignStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(c => {
                      const successCount = c.successCount || 0;
                      const failedCount = c.failedCount || 0;
                      const total = c.totalRecipients || 0;
                      const sent = successCount + failedCount;
                      const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
                      
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-mono font-bold text-slate-400">{c.id}</td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            <button 
                              onClick={() => {
                                setActiveCampaign(c);
                                setBulkChannel(c.channel);
                                setExcelData(c.recipients);
                                setSendingIndex(c.recipients.findIndex(r => r.status === 'pending'));
                                setBulkLogs(c.logs);
                                if (c.channel === 'email') {
                                  setBulkSubject(c.subject || '');
                                  setBulkBody(c.body || '');
                                } else {
                                  const tmpl = zaloTemplates.find(t => t.id === c.templateId);
                                  setSelectedZaloTemplate(tmpl || null);
                                }
                              }}
                              className="text-left font-bold text-indigo-600 hover:text-indigo-800 bg-transparent border-none p-0 cursor-pointer text-xs"
                            >
                              {c.name}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              c.channel === 'email' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {c.channel === 'email' ? <Mail className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                              {c.channel === 'email' ? 'Email' : 'Zalo ZNS'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1 w-36">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{sent}/{total}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${c.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              c.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                              c.status === 'sending' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                              c.status === 'paused' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-655'
                            }`}>
                              {c.status === 'completed' ? 'Hoàn thành' :
                               c.status === 'sending' ? 'Đang gửi' :
                               c.status === 'paused' ? 'Tạm dừng' : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-bold">
                            {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => {
                                  setActiveCampaign(c);
                                  setBulkChannel(c.channel);
                                  setExcelData(c.recipients);
                                  setSendingIndex(c.recipients.findIndex(r => r.status === 'pending'));
                                  setBulkLogs(c.logs);
                                  if (c.channel === 'email') {
                                    setBulkSubject(c.subject || '');
                                    setBulkBody(c.body || '');
                                  } else {
                                    const tmpl = zaloTemplates.find(t => t.id === c.templateId);
                                    setSelectedZaloTemplate(tmpl || null);
                                  }
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-indigo-50 border-none cursor-pointer text-slate-500 transition-colors"
                                title="Xem chi tiết & Điều khiển"
                              >
                                <Play className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Bạn có chắc chắn muốn xoá chiến dịch "${c.name}"?`)) {
                                    await store.deleteCampaign(c.id);
                                  }
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-rose-50 border-none cursor-pointer text-slate-500 transition-colors"
                                title="Xoá chiến dịch"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-450 italic">
                        Chưa có chiến dịch gửi tin nào. Nhấp "Tạo Chiến Dịch Mới" để bắt đầu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: NEW CAMPAIGN COMPOSER */}
      {isCreatingCampaign && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tiêu đề & Back button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => {
                setIsCreatingCampaign(false);
                setExcelData([]);
                setExcelFileName('');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại Lịch sử
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-550 block uppercase">Chiến Dịch Mới</span>
              <span className="text-xs font-bold text-slate-500">{campaignName || 'Nhập tên chiến dịch...'}</span>
            </div>
          </div>

          {/* Tên chiến dịch input */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-600 block">Tên chiến dịch *</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Nhập tên chiến dịch gửi tin..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Excel Uploader & Channel config */}
            <div className="space-y-6 lg:col-span-1">
              {/* File upload card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 font-extrabold">
                  1. Nạp danh sách liên hệ
                </span>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 block">Nguồn danh sách</label>
                  <select
                    value={listSource}
                    onChange={(e) => {
                      const src = e.target.value as 'file' | 'saved' | 'attendees' | 'speakers';
                      setListSource(src);
                      setExcelData([]);
                      setExcelFileName('');
                      setSelectedGroup('');
                      setContactGroupName('');
                      
                      if (src === 'attendees') {
                        loadAttendeesList();
                      } else if (src === 'speakers') {
                        loadSpeakersList();
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-semibold text-slate-700"
                  >
                    <option value="file">📁 Tải file Excel/CSV mới</option>
                    <option value="saved">👥 Chọn từ danh bạ đã lưu ({Array.from(new Set(contacts.map(c => c.groupName).filter(Boolean))).length} nhóm)</option>
                    <option value="attendees">🎓 Tất cả Đại biểu đã đăng ký ({store.getAttendees().length} người)</option>
                    <option value="speakers">🎙️ Tất cả Báo cáo viên đã đăng ký ({store.getSpeakers().length} người)</option>
                  </select>
                </div>

                {listSource === 'file' && (
                  <>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Tải lên tập tin Excel (.xlsx, .xls) hoặc CSV. Hệ thống tự động so khớp cột chứa <strong>Tên, Email, Số điện thoại</strong>.
                    </p>
                    
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 transition-all text-center group bg-slate-50/50 hover:bg-white">
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {excelFileName ? excelFileName : 'Chọn tệp Excel hoặc kéo thả vào đây'}
                        </div>
                        <div className="text-[10px] text-slate-400">Hỗ trợ .xlsx, .xls, .csv</div>
                      </div>
                    </div>

                    {excelData.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            Đã nạp <strong>{excelData.length}</strong> dòng từ Excel. Trong đó có <strong>{excelData.filter(d => d.isEmailValid || d.isPhoneValid).length}</strong> bản ghi hợp lệ.
                          </div>
                        </div>

                        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveToContacts}
                              onChange={(e) => setSaveToContacts(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Lưu vào danh bạ để tái sử dụng
                          </label>
                          
                          {saveToContacts && (
                            <div className="space-y-2 pt-1.5">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Tên nhóm danh bạ</label>
                                <input
                                  type="text"
                                  value={contactGroupName}
                                  onChange={(e) => setContactGroupName(e.target.value)}
                                  placeholder="Ví dụ: Hội viên khu vực miền Nam"
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveToContacts}
                                className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border-none cursor-pointer"
                              >
                                {isSavedSuccessfully ? '✓ Đã lưu thành công' : '💾 Lưu ngay vào danh bạ'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {listSource === 'saved' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Chọn một nhóm danh bạ đã được lưu từ các đợt tải file trước đó để nạp trực tiếp danh sách người nhận.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nhóm danh bạ đã lưu *</label>
                        <select
                          value={selectedGroup}
                          onChange={(e) => {
                            setSelectedGroup(e.target.value);
                            loadSavedGroup(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-bold text-slate-700"
                        >
                          <option value="">-- Chọn nhóm danh bạ --</option>
                          {Array.from(new Set(contacts.map(c => c.groupName).filter(Boolean))).map(g => (
                            <option key={g} value={g}>{g} ({contacts.filter(c => c.groupName === g).length} liên hệ)</option>
                          ))}
                        </select>
                      </div>

                      {selectedGroup && excelData.length > 0 && (
                        <div className="bg-indigo-50 text-indigo-800 p-3.5 rounded-xl text-xs font-medium border border-indigo-100 flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-650 shrink-0" />
                          <div>
                            Đã nạp <strong>{excelData.length}</strong> liên hệ từ nhóm <strong>{selectedGroup}</strong>.
                          </div>
                        </div>
                      )}

                      {Array.from(new Set(contacts.map(c => c.groupName).filter(Boolean))).length === 0 && (
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs leading-relaxed border border-amber-100">
                          Chưa có nhóm danh bạ nào được lưu. Hãy chuyển sang phần <strong>Tải file Excel mới</strong> và tích chọn <strong>Lưu vào danh bạ</strong> để bắt đầu tích luỹ liên hệ.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {listSource === 'attendees' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Nguồn này sẽ tự động nạp toàn bộ danh sách <strong>Đại biểu đã đăng ký</strong> từ cơ sở dữ liệu hệ thống sự kiện.
                    </p>
                    
                    {excelData.length > 0 ? (
                      <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          Đã nạp <strong>{excelData.length}</strong> đại biểu. Có <strong>{excelData.filter(d => d.isEmailValid || d.isPhoneValid).length}</strong> bản ghi có thông tin liên hệ hợp lệ.
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl text-xs leading-relaxed border border-amber-100">
                        Chưa có đại biểu nào đăng ký trong hệ thống sự kiện.
                      </div>
                    )}
                  </div>
                )}

                {listSource === 'speakers' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Nguồn này sẽ tự động nạp toàn bộ danh sách <strong>Báo cáo viên đăng ký đề tài</strong> từ cơ sở dữ liệu hệ thống sự kiện.
                    </p>
                    
                    {excelData.length > 0 ? (
                      <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          Đã nạp <strong>{excelData.length}</strong> báo cáo viên. Có <strong>{excelData.filter(d => d.isEmailValid || d.isPhoneValid).length}</strong> bản ghi có thông tin liên hệ hợp lệ.
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl text-xs leading-relaxed border border-amber-100">
                        Chưa có báo cáo viên nào đăng ký đề tài trong hệ thống sự kiện.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Config sending channel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 font-extrabold">
                  2. Thiết lập cổng truyền tin
                </span>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setBulkChannel('email')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border-none ${
                      bulkChannel === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Gửi Mail Resend
                  </button>
                  <button
                    onClick={() => setBulkChannel('zalo')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border-none ${
                      bulkChannel === 'zalo' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Gửi Zalo OA ZNS
                  </button>
                </div>

                {bulkChannel === 'email' ? (
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl border border-indigo-100 leading-relaxed text-[10.5px]">
                      📧 <strong>Cổng gửi Email Resend</strong>: Hệ thống sử dụng cấu hình API Key và Email gửi đi của **Resend** được thiết lập trong mục <strong>Cài đặt hệ thống</strong>.
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-bold">Email gửi:</span>
                        <span className="font-mono text-slate-700 font-extrabold">{resendConfig.senderEmail || '(Chưa cấu hình)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-bold">API Key:</span>
                        <span className="font-bold text-slate-750">
                          {resendConfig.apiKey ? '🟢 Đã cấu hình' : '🔴 Chưa cấu hình'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="bg-teal-50 text-teal-800 p-3 rounded-xl border border-teal-100 leading-relaxed text-[10.5px]">
                      📢 <strong>Gửi Zalo OA qua ZNS</strong>: Hệ thống sử dụng token Zalo OA đã liên kết. Phải thiết lập tham số truyền tin khớp với template đã được Zalo phê duyệt.
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Mẫu tin nhắn Zalo OA *</label>
                      <select
                        value={selectedZaloTemplate?.id || ''}
                        onChange={(e) => {
                          const tmpl = zaloTemplates.find(t => t.id === e.target.value);
                          setSelectedZaloTemplate(tmpl || null);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-700"
                      >
                        {zaloTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (ZNS ID: {t.znsTemplateId || t.id})</option>
                        ))}
                      </select>
                    </div>

                    {selectedZaloTemplate && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[9.5px] font-black text-slate-400 block uppercase">Nội dung mẫu Zalo:</span>
                        <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap font-medium">{selectedZaloTemplate.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Composer and Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Composer Card (Only for Email since Zalo uses pre-defined templates) */}
              {bulkChannel === 'email' ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block font-extrabold">
                      3. Soạn thảo thư hàng loạt (Email Template)
                    </span>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setBulkEditorMode('visual')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                          bulkEditorMode === 'visual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Trực quan
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkEditorMode('code')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                          bulkEditorMode === 'code' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        Mã HTML
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tiêu đề thư (Email Subject)</label>
                      <input
                        type="text"
                        value={bulkSubject}
                        onChange={(e) => setBulkSubject(e.target.value)}
                        placeholder="Nhập tiêu đề..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Placeholder Quick inserter */}
                    <div className="flex items-center gap-2 bg-slate-55 p-2.5 border border-slate-150 rounded-xl">
                      <span className="text-[9.5px] font-bold text-slate-500 select-none shrink-0">Chèn nhanh biến:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { code: 'Tên', label: 'Họ và Tên (Từ Excel)' },
                          { code: 'Email', label: 'Địa chỉ Email (Từ Excel)' },
                          { code: 'Số điện thoại', label: 'Số điện thoại (Từ Excel)' },
                          { code: 'title', label: 'Danh xưng (BS., GS.)' },
                          { code: 'fullname', label: 'Họ & Tên đầy đủ' },
                          { code: 'code', label: 'Mã Đại biểu' },
                          { code: 'package', label: 'Gói đăng ký' },
                          { code: 'payment_status', label: 'Trạng thái thanh toán' },
                          { code: 'organization', label: 'Đơn vị công tác' },
                          { code: 'qr_url', label: 'Mã QR check-in' }
                        ].map(ph => (
                          <button
                            key={ph.code}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertBulkPlaceholder(ph.code);
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[9px] font-bold text-slate-755 hover:text-indigo-755 transition-all cursor-pointer shadow-sm"
                            title={ph.label}
                          >
                            {`{{${ph.code}}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rich editor toolbar */}
                    {bulkEditorMode === 'visual' && (
                      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-xl mb-1 select-none">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('bold'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('italic'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('underline'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-350 mx-1" />

                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyLeft'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyCenter'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyRight'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-350 mx-1" />

                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('insertUnorderedList'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('insertOrderedList'); }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-350 mx-1" />

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
                            if (url) handleBulkFormat('createLink', url);
                          }}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('removeFormat'); }}
                          className="px-2 py-0.5 hover:bg-slate-200 rounded text-slate-500 font-mono text-[9px] border border-slate-200 transition-colors cursor-pointer"
                        >
                          Xoá định dạng
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nội dung thư (HTML body)</label>
                      {bulkEditorMode === 'visual' ? (
                        <div className="relative">
                          <div
                            ref={bulkEditorRef}
                            contentEditable
                            onInput={handleBulkEditorInput}
                            className="w-full min-h-[220px] max-h-[350px] overflow-y-auto px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 text-[13px] leading-relaxed rich-editor-content"
                            style={{ borderStyle: 'solid' }}
                          />
                        </div>
                      ) : (
                        <textarea
                          id="bulk-body-textarea"
                          rows={10}
                          value={bulkBody}
                          onChange={(e) => setBulkBody(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-[11px]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Zalo OA preview card in composer
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 font-extrabold">
                    Xem trước kịch bản ZNS Zalo
                  </span>
                  {selectedZaloTemplate ? (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          Z
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">Zalo Notification Service</span>
                          <span className="text-[10px] text-slate-400 block">Mẫu tin ID: {selectedZaloTemplate.znsTemplateId || selectedZaloTemplate.id}</span>
                        </div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-650 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedZaloTemplate.content}
                      </div>
                      <p className="text-[10px] text-slate-455 italic">
                        * Ghi chú: Hệ thống sẽ tự động liên kết các biến tương ứng của người nhận (Họ tên, SĐT, Mã QR...) trước khi đẩy qua API Zalo OA.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-450 italic">Vui lòng thiết lập hoặc chọn mẫu tin nhắn Zalo OA bên trái.</div>
                  )}
                </div>
              )}

              {/* Composer Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    setIsCreatingCampaign(false);
                    setExcelData([]);
                    setExcelFileName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={saveDraftCampaign}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-indigo-50 hover:text-indigo-650 text-slate-750 font-bold text-xs cursor-pointer border-none transition-all"
                >
                  💾 Lưu Bản Nháp
                </button>
                <button
                  onClick={() => startBulkSending(undefined)}
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs cursor-pointer border-none shadow transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Tạo &amp; Bắt Đầu Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CAMPAIGN DETAILS & SENDING CONSOLE */}
      {activeCampaign && !isCreatingCampaign && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tiêu đề & Back button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => {
                if (isBulkSending) {
                  if (!confirm('Chiến dịch đang gửi tin. Quay lại danh sách sẽ KHÔNG dừng việc gửi tin. Bạn có chắc chắn muốn quay lại?')) {
                    return;
                  }
                }
                setActiveCampaign(null);
                setExcelData([]);
                setSendingIndex(-1);
                setBulkLogs([]);
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại Lịch sử
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-550 block uppercase">Điều phối Chiến dịch</span>
              <span className="text-xs font-bold text-slate-700">{activeCampaign.name} ({activeCampaign.id})</span>
            </div>
          </div>

          {/* Bảng chỉ số thống kê chiến dịch */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tổng số người nhận</span>
              <span className="text-2xl font-black text-slate-800">{activeCampaign.totalRecipients}</span>
            </div>
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider block mb-1">Gửi thành công</span>
              <span className="text-2xl font-black text-emerald-700">{activeCampaign.successCount}</span>
            </div>
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 shadow-sm">
              <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wider block mb-1">Gửi thất bại</span>
              <span className="text-2xl font-black text-rose-700">{activeCampaign.failedCount}</span>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-wider block mb-1">Tiến độ gửi tin</span>
              <span className="text-2xl font-black text-indigo-700">
                {activeCampaign.totalRecipients > 0 
                  ? `${Math.round(((activeCampaign.successCount + activeCampaign.failedCount) / activeCampaign.totalRecipients) * 100)}%` 
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Thanh tiến độ */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 ${activeCampaign.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-650 animate-pulse'}`}
              style={{ width: `${activeCampaign.totalRecipients > 0 ? ((activeCampaign.successCount + activeCampaign.failedCount) / activeCampaign.totalRecipients) * 100 : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Campaign Config */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 font-extrabold">
                  Chi tiết cấu hình
                </span>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-450 font-bold">Kênh gửi:</span>
                    <span className="font-extrabold text-slate-700 uppercase">
                      {activeCampaign.channel === 'email' ? '📧 Email Resend' : '📢 Zalo ZNS'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-455 font-bold">Trạng thái:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                      activeCampaign.status === 'completed' ? 'bg-emerald-100 text-emerald-850' :
                      activeCampaign.status === 'sending' ? 'bg-indigo-100 text-indigo-855 animate-pulse' :
                      activeCampaign.status === 'paused' ? 'bg-amber-100 text-amber-855' :
                      'bg-slate-150 text-slate-600'
                    }`}>
                      {activeCampaign.status === 'completed' ? 'Hoàn thành' :
                       activeCampaign.status === 'sending' ? 'Đang gửi' :
                       activeCampaign.status === 'paused' ? 'Tạm dừng' : 'Bản nháp'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-450 font-bold">Thời gian tạo:</span>
                    <span className="font-bold text-slate-600">
                      {new Date(activeCampaign.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {activeCampaign.channel === 'email' ? (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Tiêu đề gửi:</span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">{activeCampaign.subject}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Nội dung (Preview):</span>
                      <div 
                        className="mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-655 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-medium"
                        dangerouslySetInnerHTML={{ __html: activeCampaign.body || '' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Mẫu tin ZNS đã dùng:</span>
                    <span className="text-xs font-bold text-slate-700 block">{activeCampaign.templateId}</span>
                    {zaloTemplates.find(t => t.id === activeCampaign.templateId) && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                        {zaloTemplates.find(t => t.id === activeCampaign.templateId)?.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Send Console & Recipient details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 font-extrabold">
                  Bảng điều khiển &amp; Tiến trình gửi
                </span>

                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    {!isBulkSending ? (
                      <>
                        {activeCampaign.status !== 'completed' ? (
                          <button
                            onClick={() => startBulkSending(activeCampaign)}
                            className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                          >
                            <Play className="w-3.5 h-3.5" />
                            {activeCampaign.status === 'paused' ? 'Tiếp Tục Gửi' : 'Bắt Đầu Gửi'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn gửi lại toàn bộ chiến dịch này từ đầu?')) {
                                const restartedCampaign = {
                                  ...activeCampaign,
                                  status: 'draft' as const,
                                  successCount: 0,
                                  failedCount: 0,
                                  recipients: activeCampaign.recipients.map(r => ({ ...r, status: 'pending' as const, error: '' })),
                                  logs: [`[${new Date().toLocaleTimeString()}] Gửi lại chiến dịch từ đầu`]
                                };
                                setExcelData(restartedCampaign.recipients);
                                setSendingIndex(-1);
                                setBulkLogs(restartedCampaign.logs);
                                startBulkSending(restartedCampaign);
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-655 hover:bg-slate-755 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Gửi Lại Từ Đầu
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {isBulkPaused ? (
                          <button
                            onClick={resumeBulkSending}
                            className="px-4 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Tiếp Tục
                          </button>
                        ) : (
                          <button
                            onClick={pauseBulkSending}
                            className="px-4 py-2 rounded-xl bg-amber-650 hover:bg-amber-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Tạm Dừng
                          </button>
                        )}
                        <button
                          onClick={stopBulkSending}
                          className="px-4 py-2 rounded-xl bg-rose-650 hover:bg-rose-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                        >
                          <Square className="w-3.5 h-3.5" />
                          Dừng Hẳn
                        </button>
                      </>
                    )}
                  </div>

                  {isBulkSending && sendingIndex !== -1 && (
                    <div className="text-xs text-slate-500 font-bold">
                      Đang gửi dòng: {sendingIndex + 1} / {excelData.length} ({Math.round(((sendingIndex + 1) / excelData.length) * 100)}%)
                    </div>
                  )}
                </div>

                {/* Bộ lọc người nhận */}
                <div className="flex flex-wrap gap-2 items-center justify-between border-t border-slate-100 pt-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Tìm người nhận..."
                      value={recipientSearchText}
                      onChange={(e) => setRecipientSearchText(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-48 border border-slate-200 rounded-lg text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700 font-semibold"
                    />
                  </div>
                  
                  <select
                    value={recipientStatusFilter}
                    onChange={(e) => setRecipientStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-755 font-bold"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="success">Thành công</option>
                    <option value="failed">Thất bại</option>
                    <option value="pending">Chờ gửi</option>
                  </select>
                </div>

                {/* Danh sách người nhận */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                  <table className="w-full border-collapse text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[9.5px]">
                        <th className="px-4 py-2.5">STT</th>
                        <th className="px-4 py-2.5">Tên</th>
                        <th className="px-4 py-2.5">Email / Số điện thoại</th>
                        <th className="px-4 py-2.5 text-center">Trạng thái</th>
                        <th className="px-4 py-2.5">Chi tiết/Lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelData
                        .filter(r => {
                          const matchesSearch = r.name.toLowerCase().includes(recipientSearchText.toLowerCase()) || 
                            (r.email && r.email.toLowerCase().includes(recipientSearchText.toLowerCase())) || 
                            (r.phone && r.phone.toLowerCase().includes(recipientSearchText.toLowerCase()));
                          const matchesStatus = recipientStatusFilter === 'all' || r.status === recipientStatusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .map((item, idx) => {
                          const contact = activeCampaign.channel === 'email' ? item.email : item.phone;
                          return (
                            <tr key={item.id || idx} className={`hover:bg-slate-50/50 ${idx === sendingIndex ? 'bg-indigo-50/40 font-bold' : ''}`}>
                              <td className="px-4 py-2 font-mono text-slate-400">{idx + 1}</td>
                              <td className="px-4 py-2 font-bold text-slate-700">{item.name}</td>
                              <td className="px-4 py-2 text-slate-600">{contact || <span className="text-red-500 italic">Trống</span>}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold text-[8.5px] ${
                                  item.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                  item.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                  item.status === 'sending' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                                  'bg-slate-100 text-slate-550'
                                }`}>
                                  {item.status === 'success' ? 'Thành công' :
                                   item.status === 'failed' ? 'Thất bại' :
                                   item.status === 'sending' ? 'Đang gửi...' : 'Chờ gửi'}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-medium text-slate-500 max-w-xs truncate" title={item.error}>{item.error || '-'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Live activity log */}
                {bulkLogs.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <span className="text-[9px] font-mono font-black text-indigo-400 tracking-wider">NHẬT KÝ ĐƯỜNG TRUYỀN PHÁT LOGS</span>
                      <span className="text-[8px] font-mono text-slate-500">LIVE FEED</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto space-y-1">
                      {bulkLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('Thất bại') ? 'text-rose-455' : 'text-emerald-450'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
