/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Megaphone, Mail, Phone, Settings, Send, CheckCircle, Sparkles, AlertCircle, AlertTriangle, Info, FileText, ToggleLeft, ToggleRight, Trash2, Plus, Check, X, Bell, Radio, Wifi, Volume2, BellOff, Smartphone, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Type, Code, Eye, RefreshCw, Palette, Upload, Play, Pause, Square, Users, CheckSquare } from 'lucide-react';
import * as XLSX from 'xlsx';
import { store } from '../dataStore';
import { sendRealtimeNotification } from '../lib/realtime';
import { NotificationTemplate, SentNotificationLog, Contact } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface NotificationSystemProps {
  defaultTab?: 'templates' | 'bulk';
  hideTabs?: boolean;
}

export default function NotificationSystem({ defaultTab = 'templates', hideTabs = true }: NotificationSystemProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(store.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(templates[0]);
  const [logs, setLogs] = useState<SentNotificationLog[]>(store.getNotificationLogs());

  // Tab State
  const [activeTab, setActiveTab] = useState<'templates' | 'bulk'>(defaultTab);
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Bulk sending state
  const [bulkChannel, setBulkChannel] = useState<'email' | 'zalo'>('email');
  const [resendConfig, setResendConfigState] = useState(() => store.getResendConfig());
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [bulkSubject, setBulkSubject] = useState('Thư xác nhận tham dự Hội nghị Khoa học Thẩm mỹ PARS 2026');
  const [bulkBody, setBulkBody] = useState('<p>Kính gửi anh/chị <strong>{{Tên}}</strong>,</p>\n<p>Ban tổ chức Hội nghị Khoa học Thẩm mỹ Quốc tế Thường niên PARS 2026 trân trọng xác nhận thông tin đăng ký của anh/chị.</p>\n<p>Thông tin chi tiết:</p>\n<ul>\n<li>Hộp thư: {{Email}}</li>\n<li>Điện thoại: {{Số điện thoại}}</li>\n</ul>\n<p>Hệ thống tự động đã kích hoạt vé tham dự của anh/chị. Vui lòng mang theo email này để quét mã QR check-in tại sảnh chính.</p>\n<p>Trân trọng,<br>Ban tổ chức PARS 2026</p>');
  const [bulkEditorMode, setBulkEditorMode] = useState<'visual' | 'code'>('visual');
  const bulkEditorRef = React.useRef<HTMLDivElement>(null);

  // Zalo bulk templates
  const [zaloTemplates, setZaloTemplates] = useState<NotificationTemplate[]>(() =>
    store.getTemplates().filter(t => t.channel === 'zalo')
  );
  const [selectedZaloTemplate, setSelectedZaloTemplate] = useState<NotificationTemplate | null>(zaloTemplates[0] || null);

  // Queue states
  const [sendingIndex, setSendingIndex] = useState(-1);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isBulkPaused, setIsBulkPaused] = useState(false);
  const [bulkLogs, setBulkLogs] = useState<any[]>([]);
  const isBulkSendingRef = React.useRef(false);
  const isBulkPausedRef = React.useRef(false);

  // Contacts integration states
  const [contacts, setContacts] = useState<Contact[]>(() => store.getContacts());
  const [listSource, setListSource] = useState<'file' | 'saved' | 'attendees' | 'speakers'>('file');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [saveToContacts, setSaveToContacts] = useState<boolean>(true);
  const [contactGroupName, setContactGroupName] = useState<string>('');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  React.useEffect(() => {
    const handleStoreUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.table === 'contacts') {
        setContacts(store.getContacts());
      }
      if (detail && detail.table === 'system_config') {
        setResendConfigState(store.getResendConfig());
      }
    };
    window.addEventListener('store-updated', handleStoreUpdate);
    return () => {
      window.removeEventListener('store-updated', handleStoreUpdate);
    };
  }, []);

  // React to template reload
  React.useEffect(() => {
    setZaloTemplates(store.getTemplates().filter(t => t.channel === 'zalo'));
  }, [templates]);

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
    
    let hash2 = 17;
    for (let i = 0; i < rawStr.length; i++) {
      hash2 = (hash2 * 31) + rawStr.charCodeAt(i);
      hash2 |= 0;
    }
    const hashPart2 = Math.abs(hash2).toString(36).toUpperCase();
    
    return `CON-${hashPart}-${hashPart2}`;
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
        // Extra properties for placeholders
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
        // Extra properties for placeholders
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

        // Find indices for Tên, Email, Số điện thoại
        const nameIdx = headers.findIndex(h => /tên|name|họ tên/i.test(h));
        const emailIdx = headers.findIndex(h => /email|thư/i.test(h));
        const phoneIdx = headers.findIndex(h => /điện thoại|phone|sđt|sđt|sdt/i.test(h));

        if (nameIdx === -1 && emailIdx === -1 && phoneIdx === -1) {
          alert('Không tìm thấy các cột Tên, Email hoặc Số điện thoại trong file. Vui lòng kiểm tra lại dòng tiêu đề (dòng 1).');
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
              status: 'pending' as 'pending' | 'sending' | 'success' | 'failed',
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

  const startBulkSending = async () => {
    if (excelData.length === 0) {
      alert('Vui lòng tải lên danh sách người nhận từ Excel trước.');
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

    // Auto-save to contacts if enabled and source is file upload
    if (listSource === 'file' && saveToContacts && excelData.length > 0) {
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

    let startIndex = sendingIndex === -1 || sendingIndex >= excelData.length ? 0 : sendingIndex;

    for (let i = startIndex; i < excelData.length; i++) {
      if (!isBulkSendingRef.current) break;

      while (isBulkPausedRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (!isBulkSendingRef.current) break;
      }

      if (!isBulkSendingRef.current) break;

      setSendingIndex(i);
      setExcelData(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'sending' } : item));

      const recipient = excelData[i];
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

            // Support dynamic placeholder replacements for database columns (e.g. {{fullname}}, {{code}}, {{package}}, etc.)
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

      setExcelData(prev => prev.map((item, idx) => idx === i ? {
        ...item,
        status: success ? 'success' : 'failed',
        error: errorMsg
      } : item));

      const timeStr = new Date().toLocaleTimeString();
      const logEntry = `[${timeStr}] Gửi tới ${recipient.name} (${bulkChannel === 'email' ? recipient.email : recipient.phone}): ${success ? 'Thành công' : 'Thất bại - ' + errorMsg}`;
      setBulkLogs(prev => [logEntry, ...prev]);

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

  const pauseBulkSending = () => {
    setIsBulkPaused(true);
    isBulkPausedRef.current = true;
  };

  const resumeBulkSending = () => {
    setIsBulkPaused(false);
    isBulkPausedRef.current = false;
  };

  const stopBulkSending = () => {
    setIsBulkSending(false);
    isBulkSendingRef.current = false;
    setIsBulkPaused(false);
    isBulkPausedRef.current = false;
  };

  // Form edit fields
  const [subject, setSubject] = useState(templates[0]?.subject || '');
  const [content, setContent] = useState(templates[0]?.content || '');
  const [znsTemplateId, setZnsTemplateId] = useState(templates[0]?.znsTemplateId || '');
  const [status, setStatus] = useState(templates[0]?.status || 'pending');
  const [znsType, setZnsType] = useState(templates[0]?.znsType || 'transaction');

  // Rich Text Editor & Preview States
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [editTab, setEditTab] = useState<'edit' | 'preview'>('edit');
  const editorRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lastLoadedTemplateId = React.useRef<string | null>(null);

  // Sync content when selected template changes
  React.useEffect(() => {
    if (selectedTemplate) {
      if (lastLoadedTemplateId.current !== selectedTemplate.id) {
        setContent(selectedTemplate.content);
        setSubject(selectedTemplate.subject || '');
        setZnsTemplateId(selectedTemplate.znsTemplateId || '');
        setStatus(selectedTemplate.status || 'pending');
        setZnsType(selectedTemplate.znsType || 'transaction');
        lastLoadedTemplateId.current = selectedTemplate.id;
        setEditTab('edit'); // Reset to edit tab
        if (editorRef.current && selectedTemplate.channel === 'email' && editorMode === 'visual') {
          editorRef.current.innerHTML = selectedTemplate.content;
        }
      }
    }
  }, [selectedTemplate]);

  // Sync contenteditable content when switching to visual mode
  React.useEffect(() => {
    if (editorMode === 'visual' && editorRef.current && selectedTemplate?.channel === 'email') {
      editorRef.current.innerHTML = content;
    }
  }, [editorMode]);

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const insertPlaceholder = (ph: string) => {
    const textToInsert = `{{${ph}}}`;
    if (selectedTemplate?.channel === 'email' && editorMode === 'visual') {
      // visual mode: insert at cursor in contenteditable
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);
        
        // Move cursor after the inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // Fallback: append at the end
        if (editorRef.current) {
          editorRef.current.innerHTML += textToInsert;
        }
      }
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    } else {
      // code mode / other channels: insert at cursor in textarea
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const newVal = val.substring(0, start) + textToInsert + val.substring(end);
        setContent(newVal);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        }, 10);
      } else {
        // Fallback
        setContent(prev => prev + textToInsert);
      }
    }
  };

  // Sync contenteditable content when switching to visual mode in bulk tab
  React.useEffect(() => {
    if (bulkEditorMode === 'visual' && bulkEditorRef.current && bulkChannel === 'email') {
      if (bulkEditorRef.current.innerHTML !== bulkBody) {
        bulkEditorRef.current.innerHTML = bulkBody;
      }
    }
  }, [bulkEditorMode, bulkChannel]);

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
      // visual mode: insert at cursor in contenteditable
      bulkEditorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);
        
        // Move cursor after the inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // Fallback: append at the end
        if (bulkEditorRef.current) {
          bulkEditorRef.current.innerHTML += textToInsert;
        }
      }
      if (bulkEditorRef.current) {
        setBulkBody(bulkEditorRef.current.innerHTML);
      }
    } else {
      // code mode: insert at cursor in textarea
      const textarea = document.getElementById('bulk-body-textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const nextValue = before + textToInsert + after;
        setBulkBody(nextValue);
        
        // Focus & set cursor position back
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
      } else {
        setBulkBody(prev => prev + textToInsert);
      }
    }
  };

  const getPreviewHtml = () => {
    const mockAttendee = {
      id: 'ATT-2026',
      title: 'PGS.TS.BS.',
      fullName: 'Nguyễn Xuân Sơn',
      packageName: 'Gói Đại Biểu VIP',
      packageFee: 3000000,
      paymentStatus: 'paid',
      organization: 'Bệnh viện Trung ương Quân đội 108',
      qrCodeValue: 'PARS2026-ATT-2026-SON',
      email: 'xuanson.nguyen@hospital108.vn',
      phone: '0987654321'
    };

    const payStatusText = 'Đã Thanh Toán';
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    const formattedBody = isHtml ? content : content.replace(/\n/g, '<br/>');
    
    // Replace placeholders in the body
    let previewBody = formattedBody
      .replace(/\{\{title\}\}/g, mockAttendee.title)
      .replace(/\{\{fullname\}\}/g, mockAttendee.fullName)
      .replace(/\{\{package\}\}/g, mockAttendee.packageName)
      .replace(/\{\{code\}\}/g, mockAttendee.id)
      .replace(/\{\{payment_status\}\}/g, payStatusText)
      .replace(/\{\{organization\}\}/g, mockAttendee.organization)
      .replace(/\{\{presentation_title\}\}/g, 'Báo cáo đột phá trong Công nghệ phẫu thuật thẩm mỹ sọ mặt')
      .replace(/\{\{track\}\}/g, 'Phẫu thuật Thẩm mỹ Sọ mặt')
      .replace(/\{\{email\}\}/g, mockAttendee.email)
      .replace(/\{\{phone\}\}/g, mockAttendee.phone);

    const isSpeakerEmail = selectedTemplate?.type === 'abstract_approved' || selectedTemplate?.id === 'tmpl-speaker-email';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; text-align: left; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <div style="text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1e1b4b; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Hội Nghị PARS 2026</h2>
          <p style="color: #4f46e5; font-size: 11px; margin: 5px 0 0 0; font-weight: bold;">Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên</p>
        </div>
        
        <div class="rich-editor-content" style="font-size: 14px; color: #334155; line-height: 1.6;">
          ${previewBody}
        </div>
        
        ${!isSpeakerEmail ? `
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 130px;">Mã Đại Biểu:</td><td style="padding: 6px 0; color: #4f46e5; font-family: monospace; font-weight: bold;">${mockAttendee.id}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Gói Tham Dự:</td><td style="padding: 6px 0;">${mockAttendee.packageName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Lệ Phí:</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${mockAttendee.packageFee.toLocaleString()} VNĐ</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Trạng Thái:</td><td style="padding: 6px 0; font-weight: bold; color: #10b981;">${payStatusText}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 25px 0; background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
          <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: bold;">MÃ QR CHECK-IN (SIMULATED)</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mockAttendee.qrCodeValue)}" alt="QR Code" style="width: 150px; height: 150px; display: inline-block; border: 4px solid white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
        </div>
        ` : ''}
      </div>
    `;
  };


  // Test send simulations states
  const [testReceiver, setTestReceiver] = useState('phandu8899@gmail.com');
  const [testType, setTestType] = useState('email');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Real-time Push broadcast states
  const [pushTitle, setPushTitle] = useState('Thông báo khẩn từ BTC');
  const [pushMessage, setPushMessage] = useState('Hội nghị chuẩn bị đón đại biểu tại sảnh chính lúc 08h30. Đề nghị các phân ban tập trung.');
  const [pushCategory, setPushCategory] = useState<'info' | 'success' | 'warning' | 'system' | 'badge'>('badge');
  const [isPushing, setIsPushing] = useState(false);



  const handleSendRealtimePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) return;
    setIsPushing(true);
    const ok = await sendRealtimeNotification(pushTitle, pushMessage, pushCategory);
    setIsPushing(false);
    if (ok) {
      // Clear message inputs to prevent duplicate pushes
      setPushTitle('Thông báo mới từ BTC');
      setPushMessage('');
    } else {
      alert('Phát sóng thất bại. Vui lòng kiểm tra lại kết nối!');
    }
  };

  // Filter logs states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'zalo' | 'email' | 'whatsapp'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadAll = () => {
    setTemplates([...store.getTemplates()]);
    setLogs([...store.getNotificationLogs()]);
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.recipient.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                        log.id.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchType = filterType === 'all' || log.type === filterType;
    return matchSearch && matchType;
  });

  const handleAddNewTemplateClick = () => {
    setIsCreating(true);
    setSelectedTemplate({
      id: '',
      name: '',
      channel: 'email',
      type: 'registration_success',
      content: ''
    });
    setSubject('');
    setContent('');
    setZnsTemplateId('');
    setStatus('pending');
    setZnsType('transaction');
  };

  const getTemplateForFlow = (categoryCode: string, itemCode: string, channel: 'email' | 'zalo' | 'whatsapp') => {
    if (categoryCode === 'speaker') {
      if (itemCode === 'submitted') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-speaker-email' || t.id === 'tmpl-speaker-wa' || (t.type === 'abstract_approved' && (t.id.includes('submit') || t.id === 'tmpl-speaker-email' || t.id === 'tmpl-speaker-wa'))));
      }
      if (itemCode === 'approved') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-speaker-approved' || (t.type === 'abstract_approved' && t.id.includes('approve'))));
      }
      if (itemCode === 'reminder') {
        return templates.find(t => t.channel === channel && t.type === 'reminder_event' && (t.id.includes('speaker') || t.name.toLowerCase().includes('báo cáo viên')));
      }
      if (itemCode === 'survey') {
        return templates.find(t => t.channel === channel && t.type === 'thank_you_survey' && (t.id.includes('speaker') || t.name.toLowerCase().includes('báo cáo viên')));
      }
    } else if (categoryCode === 'attendee') {
      if (itemCode === 'registered') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-reg-email' || t.id === 'tmpl-reg-zalo' || t.id === 'tmpl-reg-wa' || (t.type === 'registration_success' && !t.id.includes('sponsor'))));
      }
      if (itemCode === 'paid') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-pay-zalo' || (t.type === 'payment_confirmed' && !t.id.includes('sponsor'))));
      }
      if (itemCode === 'reminder') {
        return templates.find(t => t.channel === channel && t.type === 'reminder_event' && !t.id.includes('speaker') && !t.id.includes('sponsor'));
      }
      if (itemCode === 'survey') {
        return templates.find(t => t.channel === channel && t.type === 'thank_you_survey' && !t.id.includes('speaker') && !t.id.includes('sponsor'));
      }
    } else if (categoryCode === 'sponsor') {
      if (itemCode === 'registered') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-sponsor-registered' || t.type === 'sponsor_registered'));
      }
      if (itemCode === 'contract') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-sponsor-contract' || t.type === 'sponsor_contract'));
      }
      if (itemCode === 'paid') {
        return templates.find(t => t.channel === channel && (t.id === 'tmpl-sponsor-paid' || t.type === 'sponsor_paid'));
      }
      if (itemCode === 'reminder') {
        return templates.find(t => t.channel === channel && t.type === 'reminder_event' && (t.id.includes('sponsor') || t.name.toLowerCase().includes('nhà tài trợ')));
      }
      if (itemCode === 'survey') {
        return templates.find(t => t.channel === channel && t.type === 'thank_you_survey' && (t.id.includes('sponsor') || t.name.toLowerCase().includes('nhà tài trợ')));
      }
    }
    return null;
  };

  const handleCreateMissingTemplate = (categoryCode: string, itemCode: string, channel: 'email' | 'zalo' | 'whatsapp', type: string) => {
    setIsCreating(true);
    const categoryName = categoryCode === 'speaker' ? 'Báo cáo viên' : categoryCode === 'attendee' ? 'Đại biểu' : 'Nhà tài trợ';
    const subName = itemCode === 'submitted' ? 'Nộp bài thành công' :
                    itemCode === 'approved' ? 'Phê duyệt đề tài' :
                    itemCode === 'registered' ? 'Đăng ký thành công' :
                    itemCode === 'paid' ? 'Thanh toán thành công' :
                    itemCode === 'contract' ? 'Ký hợp đồng thành công' :
                    itemCode === 'survey' ? 'Cảm ơn & Khảo sát' : 'Nhắc nhở lịch trình';
                    
    const newId = `tmpl-${categoryCode}-${itemCode}-${channel}`;
    const newName = `${subName} (${categoryName} - ${channel.toUpperCase()})`;
    
    setSelectedTemplate({
      id: newId,
      name: newName,
      channel: channel,
      type: type as any,
      content: ''
    });
    setSubject('');
    setContent('');
    setZnsTemplateId('');
    setStatus('pending');
    setZnsType('transaction');
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    const existing = store.getTemplates();
    if (existing.length > 0) {
      setSelectedTemplate(existing[0]);
      handleSelectTemplate(existing[0]);
    } else {
      setSelectedTemplate(null);
    }
  };

  const handleDeleteTemplateClick = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu tin "${id}" này không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      store.deleteTemplate(id);
      setIsCreating(false);
      loadAll();
      alert('Đã xóa mẫu tin nhắn thành công!');
      
      const remaining = store.getTemplates();
      if (remaining.length > 0) {
        handleSelectTemplate(remaining[0]);
      } else {
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error('Lỗi khi xóa mẫu tin:', err);
      alert('Không thể xóa mẫu tin này.');
    }
  };

  const handleSelectTemplate = (tmpl: NotificationTemplate) => {
    setIsCreating(false);
    setSelectedTemplate(tmpl);
    setSubject(tmpl.subject || '');
    setContent(tmpl.content);
    setZnsTemplateId(tmpl.znsTemplateId || '');
    setStatus(tmpl.status || 'pending');
    setZnsType(tmpl.znsType || 'transaction');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    if (isCreating) {
      if (!selectedTemplate.id.trim() || !selectedTemplate.name.trim()) {
        alert('Vui lòng nhập đầy đủ Mã số mẫu (ID) và Tên mẫu tin.');
        return;
      }
      
      // Check for duplicate ID
      const existing = store.getTemplates().find(t => t.id === selectedTemplate.id);
      if (existing) {
        alert(`Mã số mẫu (ID) "${selectedTemplate.id}" đã tồn tại. Vui lòng chọn ID khác.`);
        return;
      }
    }

    const updated: NotificationTemplate = {
      ...selectedTemplate,
      subject: selectedTemplate.channel === 'email' ? subject : undefined,
      content,
      znsTemplateId: ['zalo', 'whatsapp'].includes(selectedTemplate.channel) ? znsTemplateId : undefined,
      status: ['zalo', 'whatsapp'].includes(selectedTemplate.channel) ? status : undefined,
      znsType: ['zalo', 'whatsapp'].includes(selectedTemplate.channel) ? znsType : undefined,
    };

    store.saveTemplate(updated);
    setIsCreating(false);
    loadAll();
    alert(isCreating ? 'Đã tạo mẫu tin mới thành công!' : 'Đã chỉnh sửa và lưu trữ Mẫu tin nhắn sự kiện thành công!');
    
    // Select the newly created template
    handleSelectTemplate(updated);
  };

  // Automated SMTP / Zalo OA simulated connection logger
  const handleTriggerTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testReceiver) return;

    setIsSending(true);
    setLogMessages([]);

    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setLogMessages(prev => [...prev, `[2026-05-29 ${new Date().toLocaleTimeString()}] ${msg}`]);
      }, delay);
    };

    const testAttendee = {
      id: 'ATT-' + Math.floor(Math.random() * 9000 + 1000),
      title: 'BS.',
      fullName: 'Phan Minh Dư (Test)',
      organization: 'Bệnh viện Da liễu Trung ương',
      department: 'Thẩm mỹ Da',
      phone: testType === 'zalo' ? testReceiver : '0912345678',
      email: testType === 'email' ? testReceiver : 'phandu8899@gmail.com',
      address: 'Hà Nội',
      nationality: 'vietname' as const,
      packageId: 'pkg-member',
      packageName: 'Thành viên PARS',
      packageFee: 2500000,
      paymentStatus: 'paid' as const,
      paymentMethod: 'bank_transfer' as const,
      registrationDate: new Date().toISOString().split('T')[0],
      qrCodeValue: 'PARS-ATT-TEST-' + Math.floor(Math.random() * 90000 + 10000),
      isCheckedIn: false,
    };

    if (testType === 'email') {
      addLog('Đang khởi động tiến trình gửi SMTP Real-time...', 100);
      addLog('Thiết lập kết nối với cổng SMTP Server: default.gmail.com:587...', 300);
      addLog(`Nạp mẫu thông báo Email: "${selectedTemplate?.name}"`, 600);
      addLog(`Tiến hành biên dịch placeholders: {{title}} => "${testAttendee.title}", {{fullname}} => "${testAttendee.fullName}"...`, 900);
      
      try {
        const res = await store.sendEmail(testAttendee, subject, content);
        addLog(`Kết nạp thông số và ký chữ ký số đại biểu thành công!`, 1200);
        addLog(`[SUCCESS 200] Đã chuyển tiếp Email thành công tới: ${testReceiver}`, 1500);
        addLog(`Message ID: ${res.response?.message_id || 'N/A'}. Lịch sử đã lưu!`, 1800);
      } catch (err: any) {
        addLog(`[ERROR] Gửi email thất bại: ${err.message}`, 1200);
      }
    } else if (testType === 'zalo') {
      addLog('Khởi động API Zalo ZNS Gateway v2...', 100);
      addLog('Thẩm định Access Token & OA ID trong thiết đặt liên minh...', 400);
      addLog(`Biên dịch payload cấu trúc ZNS: SĐT=${testReceiver}, Mẫu=${selectedTemplate?.id || 'tmpl-reg-zalo'}...`, 800);
      
      try {
        const res = await store.sendZaloZNS(testAttendee, selectedTemplate?.id);
        addLog(`Tiến hành gọi thủ tục HTTP POST trực tiếp đến Zalo Open API...`, 1100);
        if (res.status === 'success') {
          addLog(`[ZALO API SUCCESS] Bắn tin Zalo Official Account (ZNS) thành công!`, 1400);
          addLog(`Mã phản hồi từ Zalo: Error=0 (Thành công), MsgID=${res.response?.data?.msg_id || 'N/A'}`, 1750);
        } else {
          addLog(`[ZALO API FAILED] Zalo trả về mã lỗi: ${res.response?.message || 'N/A'}`, 1400);
        }
      } catch (err: any) {
        addLog(`[ERROR] Bắn tin Zalo ZNS thất bại: ${err.message}`, 1200);
      }
    } else if (testType === 'whatsapp') {
      addLog('Khởi động WhatsApp Business Cloud API v18.0...', 100);
      addLog('Xác thực Access Token & Phone Number ID...', 400);
      addLog(`Biên dịch payload cấu trúc WhatsApp: SĐT=${testReceiver}, Mẫu=${selectedTemplate?.znsTemplateId || 'pars_registration_success'}...`, 800);
      
      try {
        const res = await store.sendWhatsapp(testAttendee, selectedTemplate?.id);
        addLog(`Tiến hành gọi thủ tục HTTP POST trực tiếp đến Meta Graph API...`, 1100);
        if (res.status === 'success') {
          addLog(`[WHATSAPP API SUCCESS] Bắn tin WhatsApp Template thành công!`, 1400);
          addLog(`Mã phản hồi từ Meta: MsgID=${res.response?.data?.messages?.[0]?.id || res.response?.message_id || 'N/A'}`, 1750);
        } else {
          addLog(`[WHATSAPP API FAILED] Meta trả về mã lỗi: ${res.response?.message || res.response?.error?.message || 'N/A'}`, 1400);
        }
      } catch (err: any) {
        addLog(`[ERROR] Bắn tin WhatsApp thất bại: ${err.message}`, 1200);
      }
    }

    setTimeout(() => {
      setIsSending(false);
      loadAll();
    }, 2000);
  };

  const matchedIds = new Set<string>();

  return (
    <div className="space-y-6 font-sans text-slate-805">
      <style dangerouslySetInnerHTML={{__html: `
        .rich-editor-content ul {
          list-style-type: disc !important;
          margin-left: 1.5rem !important;
          padding-left: 0.5rem !important;
          list-style-position: outside !important;
        }
        .rich-editor-content ol {
          list-style-type: decimal !important;
          margin-left: 1.5rem !important;
          padding-left: 0.5rem !important;
          list-style-position: outside !important;
        }
        .rich-editor-content a {
          color: #4f46e5 !important;
          text-decoration: underline !important;
        }
        .rich-editor-content p {
          margin-bottom: 0.75rem !important;
        }
      `}} />

      {/* Tabs navigation */}
      {!hideTabs && (
        <div className="flex border-b border-slate-200 select-none">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === 'templates'
                ? 'border-indigo-650 text-indigo-650'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            ⚙️ Mẫu Tin Nhắn &amp; Gửi Thử
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === 'bulk'
                ? 'border-indigo-650 text-indigo-650'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            📬 Gửi Tin Hàng Loạt (Excel Upload)
          </button>
        </div>
      )}

      {activeTab === 'templates' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Templates list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Các Mẫu Thông Tin Tự Động</span>
            <button
              type="button"
              onClick={handleAddNewTemplateClick}
              className="px-2.5 py-1 text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg border-none cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm mới
            </button>
          </div>
          
          <div className="space-y-5">
            {[
              {
                id: 'speaker',
                name: '1. Báo cáo viên',
                items: [
                  { code: 'submitted', label: '1.1 Nộp bài báo cáo thành công', type: 'abstract_approved' },
                  { code: 'approved', label: '1.2 Phê duyệt đề tài thành công', type: 'abstract_approved' },
                  { code: 'reminder', label: '1.3 Nhắc nhở lịch trình hội nghị', type: 'reminder_event' },
                  { code: 'survey', label: '1.4 Tin nhắn cảm ơn và gửi thông tin khảo sát', type: 'thank_you_survey' }
                ]
              },
              {
                id: 'attendee',
                name: '2. Đại biểu',
                items: [
                  { code: 'registered', label: '2.1 Xác nhận đăng ký thành công', type: 'registration_success' },
                  { code: 'paid', label: '2.2 Xác nhận thanh toán thành công', type: 'payment_confirmed' },
                  { code: 'reminder', label: '2.3 Nhắc nhở lịch trình hội nghị', type: 'reminder_event' },
                  { code: 'survey', label: '2.4 Tin nhắn cảm ơn và gửi thông tin khảo sát', type: 'thank_you_survey' }
                ]
              },
              {
                id: 'sponsor',
                name: '3. Nhà tài trợ',
                items: [
                  { code: 'registered', label: '3.1 Xác nhận đăng ký tài trợ', type: 'sponsor_registered' },
                  { code: 'contract', label: '3.2 Xác nhận ký hợp đồng thành công', type: 'sponsor_contract' },
                  { code: 'paid', label: '3.3 Xác nhận thanh toán thành công', type: 'sponsor_paid' },
                  { code: 'reminder', label: '3.4 Nhắc nhở lịch trình hội nghị', type: 'reminder_event' },
                  { code: 'survey', label: '3.5 Tin nhắn cảm ơn và gửi thông tin khảo sát', type: 'thank_you_survey' }
                ]
              }
            ].map(cat => {
              return (
                <div key={cat.id} className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>{cat.name}</span>
                  </h5>
                  
                  <div className="space-y-3">
                    {cat.items.map(item => {
                      const waTmpl = getTemplateForFlow(cat.id, item.code, 'whatsapp');
                      const zaloTmpl = getTemplateForFlow(cat.id, item.code, 'zalo');
                      const emailTmpl = getTemplateForFlow(cat.id, item.code, 'email');
                      
                      // Track matched IDs to filter other templates
                      if (waTmpl) matchedIds.add(waTmpl.id);
                      if (zaloTmpl) matchedIds.add(zaloTmpl.id);
                      if (emailTmpl) matchedIds.add(emailTmpl.id);
                      
                      return (
                        <div key={item.code} className="space-y-1.5 text-left">
                          <p className="text-[11px] font-bold text-slate-700 leading-normal">{item.label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {/* WhatsApp Badge */}
                            {waTmpl ? (
                              <button
                                type="button"
                                onClick={() => handleSelectTemplate(waTmpl)}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-black border transition cursor-pointer ${
                                  selectedTemplate?.id === waTmpl.id
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                Whatsapp
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreateMissingTemplate(cat.id, item.code, 'whatsapp', item.type)}
                                className="px-2 py-0.5 rounded text-[8.5px] font-medium border border-dashed border-slate-300 text-slate-400 bg-white hover:bg-slate-50 cursor-pointer"
                                title="Mẫu chưa có. Bấm để thêm mới."
                              >
                                + Whatsapp
                              </button>
                            )}

                            {/* Zalo Badge */}
                            {zaloTmpl ? (
                              <button
                                type="button"
                                onClick={() => handleSelectTemplate(zaloTmpl)}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-black border transition cursor-pointer ${
                                  selectedTemplate?.id === zaloTmpl.id
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                    : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                                }`}
                              >
                                Zalo
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreateMissingTemplate(cat.id, item.code, 'zalo', item.type)}
                                className="px-2 py-0.5 rounded text-[8.5px] font-medium border border-dashed border-slate-300 text-slate-400 bg-white hover:bg-slate-50 cursor-pointer"
                                title="Mẫu chưa có. Bấm để thêm mới."
                              >
                                + Zalo
                              </button>
                            )}

                            {/* Email Badge */}
                            {emailTmpl ? (
                              <button
                                type="button"
                                onClick={() => handleSelectTemplate(emailTmpl)}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-black border transition cursor-pointer ${
                                  selectedTemplate?.id === emailTmpl.id
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                              >
                                Email
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreateMissingTemplate(cat.id, item.code, 'email', item.type)}
                                className="px-2 py-0.5 rounded text-[8.5px] font-medium border border-dashed border-slate-300 text-slate-400 bg-white hover:bg-slate-50 cursor-pointer"
                                title="Mẫu chưa có. Bấm để thêm mới."
                              >
                                + Email
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Other Templates Group */}
            {templates.filter(t => !matchedIds.has(t.id)).length > 0 && (
              <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1.5 select-none text-left">
                  4. Mẫu tùy chỉnh khác
                </h5>
                <div className="space-y-2">
                  {templates
                    .filter(t => !matchedIds.has(t.id))
                    .map(tmpl => (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${
                          selectedTemplate?.id === tmpl.id 
                            ? 'bg-teal-50/50 border-teal-500 shadow-sm' 
                            : 'bg-white border-slate-250 hover:border-slate-350'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded border uppercase ${
                            tmpl.channel === 'email' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : tmpl.channel === 'whatsapp' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {tmpl.channel.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">{tmpl.id}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{tmpl.name}</h4>
                        <p className="text-[10.5px] text-slate-400 mt-1 truncate">{tmpl.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Content Template Customizer Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hiệu Chỉnh Mẫu Tin Thông Báo</h3>
              <p className="text-xs text-slate-400">Thay đổi câu từ, đính kèm placeholder hệ thống {"{{fullName}}"} để tự động hoá.</p>
            </div>
            
            <span className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-700 rounded font-bold uppercase font-mono tracking-wider">
              {selectedTemplate?.channel} editor
            </span>
          </div>

          {selectedTemplate ? (
            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              {isCreating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-205 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã số mẫu (ID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: tmpl-reg-zalo-v2"
                      value={selectedTemplate.id}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, id: e.target.value.trim() })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên mẫu tin *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đăng ký thành công (Mẫu mới)"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Kênh truyền phát (Channel) *</label>
                    <select
                      value={selectedTemplate.channel}
                      onChange={(e) => {
                        const newChan = e.target.value as 'email' | 'zalo' | 'whatsapp';
                        setSelectedTemplate({ ...selectedTemplate, channel: newChan });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-semibold text-xs cursor-pointer"
                    >
                      <option value="email">Email 📧</option>
                      <option value="zalo">Zalo ZNS 💬</option>
                      <option value="whatsapp">WhatsApp 🟢</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Loại sự kiện (Type) *</label>
                    <select
                      value={selectedTemplate.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setSelectedTemplate({ ...selectedTemplate, type: newType });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-semibold text-xs cursor-pointer"
                    >
                      <option value="registration_success">Đăng ký thành công (registration_success)</option>
                      <option value="payment_confirmed">Xác nhận thanh toán (payment_confirmed)</option>
                      <option value="abstract_approved">Duyệt bài báo cáo (abstract_approved)</option>
                      <option value="reminder_event">Nhắc nhở sự kiện (reminder_event)</option>
                      <option value="thank_you_survey">Cảm ơn & Khảo sát (thank_you_survey)</option>
                      <option value="sponsor_registered">Đăng ký tài trợ (sponsor_registered)</option>
                      <option value="sponsor_contract">Ký hợp đồng tài trợ (sponsor_contract)</option>
                      <option value="sponsor_paid">Thanh toán tài trợ (sponsor_paid)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedTemplate.channel === 'email' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tiêu đề Gửi Thư (Email Subject) *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Zalo ZNS / WhatsApp Template config */}
              {(selectedTemplate.channel === 'zalo' || selectedTemplate.channel === 'whatsapp') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      {selectedTemplate.channel === 'zalo' ? 'Mã mẫu tin Zalo ZNS (Template ID) *' : 'Meta Template Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={znsTemplateId}
                      onChange={(e) => setZnsTemplateId(e.target.value)}
                      placeholder={selectedTemplate.channel === 'zalo' ? 'Ví dụ: 298516' : 'Ví dụ: pars_registration_success'}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Loại Mẫu Tin (Type)</label>
                    <select
                      value={znsType}
                      onChange={(e) => setZnsType(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none font-semibold bg-white"
                    >
                      <option value="transaction">Tin Giao dịch (transaction)</option>
                      <option value="promotion">Tin Truyền thông (promotion)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Trạng thái duyệt Zalo</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none font-semibold bg-white"
                    >
                      <option value="approved">Đã duyệt (Approved)</option>
                      <option value="pending">Chờ phê duyệt (Pending)</option>
                      <option value="rejected">Bị từ chối (Rejected)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab Switcher & Editor mode switches (only for email) */}
              {selectedTemplate.channel === 'email' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2 select-none">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setEditTab('edit')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                        editTab === 'edit' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Soạn Thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTab('preview')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                        editTab === 'preview' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem Trước (Preview)
                    </button>
                  </div>

                  {editTab === 'edit' && (
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setEditorMode('visual')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                          editorMode === 'visual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Trực quan (Visual)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('code')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                          editorMode === 'code' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        Mã HTML (Code)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Placeholder Inserter Buttons */}
              {editTab === 'edit' && (
                <div className="flex items-center gap-2 mb-2 bg-slate-55 p-2.5 border border-slate-150 rounded-xl">
                  <span className="text-[9.5px] font-bold text-slate-500 select-none shrink-0">Chèn nhanh biến:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: 'title', label: 'Danh xưng (ví dụ: BS.)' },
                      { code: 'fullname', label: 'Họ & Tên' },
                      { code: 'code', label: 'Mã Đại biểu' },
                      { code: 'package', label: 'Gói đăng ký' },
                      { code: 'payment_status', label: 'Trạng thái thanh toán' },
                      { code: 'organization', label: 'Đơn vị công tác' },
                      { code: 'presentation_title', label: 'Đề tài báo cáo' },
                      { code: 'track', label: 'Chuyên khoa/Chương trình' },
                      { code: 'email', label: 'Email đại biểu' },
                      { code: 'phone', label: 'Số điện thoại' }
                    ].map(ph => (
                      <button
                        key={ph.code}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertPlaceholder(ph.code);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-teal-50 border border-slate-205 hover:border-teal-350 rounded-lg text-[9px] font-bold text-slate-700 hover:text-teal-700 transition-all cursor-pointer shadow-sm"
                        title={ph.label}
                      >
                        {`{{${ph.code}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatting Toolbar (Only for Visual Editor Mode) */}
              {selectedTemplate.channel === 'email' && editTab === 'edit' && editorMode === 'visual' && (
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-55 border border-slate-200 rounded-xl mb-1 select-none">
                  {/* Basic typography */}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chữ đậm"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chữ nghiêng"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Gạch chân"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 bg-slate-350 mx-1" />

                  {/* Alignment */}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyLeft'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Căn lề trái"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyCenter'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Căn lề giữa"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyRight'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Căn lề phải"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 bg-slate-350 mx-1" />

                  {/* Lists */}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Danh sách dấu chấm"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Danh sách số"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 bg-slate-350 mx-1" />

                  {/* Link insertion */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
                      if (url) handleFormat('createLink', url);
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn liên kết"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </button>

                  {/* Color selector dropdown */}
                  <div className="relative group flex items-center">
                    <button
                      type="button"
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Chọn màu chữ"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 p-1.5 rounded-lg shadow-lg gap-1.5 z-30">
                      {[
                        { color: '#000000', name: 'Đen' },
                        { color: '#4b5563', name: 'Xám' },
                        { color: '#4f46e5', name: 'Indigo' },
                        { color: '#0d9488', name: 'Teal' },
                        { color: '#dc2626', name: 'Đỏ' },
                        { color: '#ea580c', name: 'Cam' }
                      ].map(item => (
                        <button
                          key={item.color}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleFormat('foreColor', item.color);
                          }}
                          className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-px h-4 bg-slate-350 mx-1" />

                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleFormat('removeFormat'); }}
                    className="px-2 py-0.5 hover:bg-slate-250 rounded text-slate-500 font-mono text-[9px] border border-slate-200 transition-colors cursor-pointer"
                    title="Xóa định dạng"
                  >
                    Xóa định dạng
                  </button>
                </div>
              )}

              {/* Editor/Preview Display Body */}
              {editTab === 'edit' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nội dung mẫu tin (Message Body) *</label>
                  
                  {selectedTemplate.channel === 'email' && editorMode === 'visual' ? (
                    <div className="relative">
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        className="w-full min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none text-slate-800 text-[13px] leading-relaxed rich-editor-content"
                        style={{ borderStyle: 'solid' }}
                      />
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      required
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl font-mono leading-relaxed focus:ring-1 focus:ring-teal-500 focus:outline-none focus:bg-white text-[11.5px]"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Bản xem trước thư gửi đi (Live Email Preview)</label>
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 max-h-[600px] overflow-y-auto">
                    <div
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                  </div>
                </div>
              )}

              {/* Guide of placeholders */}
              <div className="bg-slate-55 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-600 leading-normal">
                  <span className="font-bold text-slate-800 block">Danh mục Placeholder đính được:</span>
                  <span>{"{{title}}"} (Danh xưng Bác sĩ), {"{{fullname}}"} (Tên), {"{{code}}"} (Mã ATT-ID), {"{{package}}"} (Tên gói đăng ký), {"{{payment_status}}"} (Nộp phí), {"{{presentation_title}}"} (Tên đề tài), {"{{email}}"} (Email), {"{{phone}}"} (Số điện thoại).</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-150">
                <div>
                  {!isCreating && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplateClick(selectedTemplate.id)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-205 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa mẫu này
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {isCreating && (
                    <button
                      type="button"
                      onClick={handleCancelCreate}
                      className="px-4 py-2 rounded-xl bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-all border-none"
                    >
                      Hủy bỏ
                    </button>
                  )}
                  <button
                    id="btn-save"
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-all border-none shadow-sm"
                  >
                    {isCreating ? 'Tạo Mẫu Mới ✨' : 'Lưu Trữ Mẫu Thiết Đặt'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">Chọn một mẫu tin bên trái để tiến hành hiệu chỉnh.</div>
          )}
        </div>
      </div>

      {/* Gateway Connection Testing Tool */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase block tracking-wider mb-2">Kiểm Tra Truyền Gửi Thử Nghiệm</span>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">Hỗ trợ kiểm tra đường truyền liên kết SMTP Server & Zalo OA API để xác nhận gửi tin nhắn và thư điện tử tự động trực tiếp.</p>

          <form onSubmit={handleTriggerTest} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Chọn cổng bắn</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                >
                  <option value="email">SMTP Email Server</option>
                  <option value="zalo">Zalo OA ZNS Gateway</option>
                  <option value="whatsapp">WhatsApp Business API</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  {testType === 'email' ? 'Địa chỉ hộp thư nhận *' : 'Số ĐT nhận SMS/WhatsApp *'}
                </label>
                <input
                  type="text"
                  required
                  value={testReceiver}
                  onChange={(e) => setTestReceiver(e.target.value)}
                  placeholder={testType === 'email' ? 'nhập email...' : 'ví dụ: 0912345678'}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-trigger-test"
                type="submit"
                disabled={isSending}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1 cursor-pointer w-full sm:w-auto text-center justify-center transition-all shadow"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Đang kích hoạt...' : 'Bắn Thử Ngay'}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time terminal log viewer corresponding to triggers */}
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[9px] font-mono font-black text-teal-400 tracking-widest uppercase">SOCKET TRANSMISSION PROTOCOL INBOUND</span>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-slate-350 leading-relaxed overflow-y-auto max-h-36">
              {logMessages.length === 0 ? (
                <p className="text-slate-600 italic">Hệ thống tĩnh lặng. Vui lòng nhập thông tin bên trái và bấm &ldquo;Bắn Thử Ngay&rdquo; để xem nhật ký truyền kết nối socket logs.</p>
              ) : (
                logMessages.map((log, idx) => (
                  <p key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : ''}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-600 font-mono">
            <span>SOCKET GATEWAY: ACTIVE</span>
            <span>PORT 1120_PARS</span>
          </div>
        </div>
      </div>



      {/* Real-time Push Notification Broadcast Gateway */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden" id="realtime-push-gateway">
        {/* Abstract design elements representation */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider">REALTIME PUSH</span>
            <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping" />
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cổng Phát Sóng Toàn Sảnh</span>
          </div>
          <h3 className="text-sm font-black text-slate-150 uppercase tracking-wider mb-2">Phát Báo thông báo Đẩy Real-time</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Hỗ trợ phát báo khẩn cấp, nhắc nhở hoặc cập nhật trạng thái hội nghị tức thời đến tất cả màn hình điều phối viên, máy trạm check-in và kiosk đại biểu đang kết nối trực tuyến.
          </p>

          <form onSubmit={handleSendRealtimePush} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mức độ khẩn cấp (Phân loại)</label>
                <select
                  value={pushCategory}
                  onChange={(e: any) => setPushCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="badge">🔊 Loa Thông báo (Badge)</option>
                  <option value="success">✅ Trạng Thái Thành công (Success)</option>
                  <option value="warning">⚠️ Cảnh báo Thiết lập (Warning)</option>
                  <option value="system">🔥 Thông báo Hệ thống (System)</option>
                  <option value="info">ℹ️ Thông tin Sự kiện (Info)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="Tiêu đề thông báo..."
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 font-semibold leading-none focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Nội dung thông báo (Mô tả chi tiết) *</label>
              <textarea
                required
                rows={2}
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Ví dụ: Đón đoàn khách danh dự tại phân ban..."
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPushing}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center gap-1.5 cursor-pointer justify-center transition-all shadow-lg hover:shadow-indigo-500/20 w-full sm:w-auto text-center"
              >
                <Radio className="w-4 h-4 shrink-0 animate-pulse text-indigo-300" />
                {isPushing ? 'Đang truyền phát...' : 'Phát Sóng Ngay (Broadcast)'}
              </button>
            </div>
          </form>
        </div>

        {/* Realtime Client Notification Simulator Card Preview */}
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-4">
              <span className="text-[9px] font-mono font-black text-indigo-400 tracking-widest uppercase">PREVIEW SẼ HIỂN THỊ TRÊN CÁC THIẾT BỊ</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[8px] font-mono text-slate-500 uppercase">ACTIVE SOCKET MESH</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-indigo-900/40 p-4 rounded-xl shadow-lg relative max-w-sm mx-auto">
              <div className="flex gap-3">
                <div className="shrink-0">
                  {pushCategory === 'success' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {pushCategory === 'warning' && (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                  {pushCategory === 'system' && (
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-450 border border-rose-500/30 flex items-center justify-center">
                      <Wifi className="w-4 h-4" />
                    </div>
                  )}
                  {pushCategory === 'info' && (
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                  {pushCategory === 'badge' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                      <Megaphone className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <h5 className="text-[11px] font-extrabold text-slate-100 truncate">{pushTitle || 'Tiêu đề thông báo...'}</h5>
                    <span className="text-[8px] font-mono text-slate-500">Bây giờ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed text-left">
                    {pushMessage || 'Vui lòng nhập nội dung thông báo để hiển thị xem trước...'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[8px] uppercase font-black text-indigo-400">
                    <Radio className="w-2.5 h-2.5" />
                    <span>Real-time push alert</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-indigo-550" />
              <span>SOUND FX: CHIME OVERLAY ENABLED</span>
            </span>
            <span>BROADCAST ALL CLIENTS</span>
          </div>
        </div>
      </div>

      {/* Real-time Notification Dispatch History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-650" />
              Lịch Sử Truyền Gửi Tự Động (Zalo ZNS / Mail Tickets)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Gói tin gửi đi và phản hồi từ hệ thống Zalo OpenAPI sandbox / SMTP Server.
            </p>
          </div>
          {logs.length > 0 && (
            <button
               onClick={() => {
                 if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn toàn bộ lịch sử log truyền tin tự động?')) {
                   store.clearNotificationLogs();
                   loadAll();
                 }
               }}
               className="px-3 py-1.5 rounded-lg border border-red-200 text-red-650 hover:bg-red-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Lịch Sử
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <input
            type="text"
            placeholder="Tìm theo ID hoặc số/email người nhận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-full sm:w-64"
          />
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="all">Tất cả kênh thông báo</option>
            <option value="zalo">Chỉ Zalo ZNS</option>
            <option value="email">Chỉ SMTP Email</option>
            <option value="whatsapp">Chỉ WhatsApp</option>
          </select>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3">Mã Log</th>
                <th className="px-4 py-3">Kênh truyền</th>
                <th className="px-4 py-3">Người nhận đích</th>
                <th className="px-4 py-3">Mẫu tin sử dụng</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    Chưa có hoạt động truyền gửi tự động nào phát sinh. Đăng ký đại biểu mới hoặc dùng cổng bắn thử để kích hoạt.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                            log.type === 'email' ? 'bg-indigo-50 text-indigo-700' : log.type === 'whatsapp' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {log.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{log.recipient}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.templateName}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{log.sentAt}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {log.status === 'success' ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer"
                          >
                            {isExpanded ? 'Đóng' : 'Payload'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950 text-slate-300 font-mono text-[10px]">
                          <td colSpan={7} className="p-4 border-t border-b border-slate-900 leading-relaxed">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-teal-400 font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">
                                  [OUTBOUND REQUEST PAYLOAD / TICKET DATA]
                                </div>
                                <pre className="whitespace-pre-wrap overflow-x-auto max-h-60 bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <div className="text-amber-400 font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">
                                  [INBOUND RESPONSE / LOG STATE]
                                </div>
                                <pre className="whitespace-pre-wrap overflow-x-auto max-h-60 bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                                  {JSON.stringify(log.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Excel Uploader & Channel config */}
          <div className="space-y-6 lg:col-span-1">
            {/* File upload card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
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
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
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
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
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
                    📧 <strong>Cổng gửi Email Resend</strong>: Hệ thống sẽ sử dụng thông số cấu hình API Key và Email gửi đi của **Resend** được thiết lập trong mục <strong>Cài đặt hệ thống</strong>.
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Email gửi đi:</span>
                      <span className="font-mono text-slate-700 font-extrabold">{resendConfig.senderEmail || '(Chưa cấu hình)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Trạng thái API Key:</span>
                      <span className="font-bold text-slate-750">
                        {resendConfig.apiKey ? '🟢 Đã cấu hình' : '🔴 Chưa cấu hình'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="bg-teal-50 text-teal-800 p-3 rounded-xl border border-teal-100 leading-relaxed text-[10.5px]">
                    📢 <strong>Gửi Zalo OA qua ZNS (Zalo Notification Service)</strong>: Hệ thống sử dụng token Zalo OA đã được liên kết. Phải cấu hình các tham số truyền tin khớp với ZNS Template duyệt.
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Chọn mẫu tin nhắn Zalo OA *</label>
                    <select
                      value={selectedZaloTemplate?.id || ''}
                      onChange={(e) => {
                        const tmpl = zaloTemplates.find(t => t.id === e.target.value);
                        setSelectedZaloTemplate(tmpl || null);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold"
                    >
                      {zaloTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (ZNS ID: {t.znsTemplateId || t.id})</option>
                      ))}
                    </select>
                  </div>

                  {selectedZaloTemplate && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9.5px] font-black text-slate-400 block uppercase">Nội dung mẫu Zalo:</span>
                      <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{selectedZaloTemplate.content}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle & Right Panel: Composer, Preview & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Composer Card (Only for Email since Zalo uses pre-defined templates) */}
            {bulkChannel === 'email' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
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
                      Trực quan (Visual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkEditorMode('code')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all border-none bg-transparent ${
                        bulkEditorMode === 'code' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      Mã HTML (Code)
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

                  {/* Quick Placeholder Inserter Buttons */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 border border-slate-150 rounded-xl">
                    <span className="text-[9.5px] font-bold text-slate-500 select-none shrink-0">Chèn nhanh biến:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'Tên', label: 'Họ và Tên (Từ Excel)' },
                        { code: 'Email', label: 'Địa chỉ Email (Từ Excel)' },
                        { code: 'Số điện thoại', label: 'Số điện thoại (Từ Excel)' },
                        { code: 'title', label: 'Danh xưng (ví dụ: BS.)' },
                        { code: 'fullname', label: 'Họ & Tên đầy đủ' },
                        { code: 'code', label: 'Mã Đại biểu / Báo cáo viên' },
                        { code: 'package', label: 'Gói đăng ký' },
                        { code: 'payment_status', label: 'Trạng thái thanh toán' },
                        { code: 'organization', label: 'Đơn vị công tác' },
                        { code: 'qr_url', label: 'Link ảnh mã QR check-in' }
                      ].map(ph => (
                        <button
                          key={ph.code}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertBulkPlaceholder(ph.code);
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-[9px] font-bold text-slate-755 hover:text-teal-755 transition-all cursor-pointer shadow-sm"
                          title={ph.label}
                        >
                          {`{{${ph.code}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatting Toolbar (Only for Visual Editor Mode) */}
                  {bulkEditorMode === 'visual' && (
                    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-55 border border-slate-200 rounded-xl mb-1 select-none">
                      {/* Basic typography */}
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('bold'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Chữ đậm"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('italic'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Chữ nghiêng"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('underline'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Gạch chân"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-4 bg-slate-350 mx-1" />

                      {/* Alignment */}
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyLeft'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Căn lề trái"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyCenter'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Căn lề giữa"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('justifyRight'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Căn lề phải"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-4 bg-slate-350 mx-1" />

                      {/* Lists */}
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('insertUnorderedList'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Danh sách dấu chấm"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('insertOrderedList'); }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Danh sách số"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-4 bg-slate-350 mx-1" />

                      {/* Link insertion */}
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
                          if (url) handleBulkFormat('createLink', url);
                        }}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        title="Chèn liên kết"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>

                      {/* Color selector dropdown */}
                      <div className="relative group flex items-center">
                        <button
                          type="button"
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Chọn màu chữ"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 p-1.5 rounded-lg shadow-lg gap-1.5 z-30">
                          {[
                            { color: '#000000', name: 'Đen' },
                            { color: '#4b5563', name: 'Xám' },
                            { color: '#4f46e5', name: 'Indigo' },
                            { color: '#0d9488', name: 'Teal' },
                            { color: '#dc2626', name: 'Đỏ' },
                            { color: '#ea580c', name: 'Cam' }
                          ].map(item => (
                            <button
                              key={item.color}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleBulkFormat('foreColor', item.color);
                              }}
                              className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer transition-transform hover:scale-110"
                              style={{ backgroundColor: item.color }}
                              title={item.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="w-px h-4 bg-slate-350 mx-1" />

                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleBulkFormat('removeFormat'); }}
                        className="px-2 py-0.5 hover:bg-slate-250 rounded text-slate-500 font-mono text-[9px] border border-slate-200 transition-colors cursor-pointer"
                        title="Xóa định dạng"
                      >
                        Xóa định dạng
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
                          className="w-full min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 text-[13px] leading-relaxed rich-editor-content"
                          style={{ borderStyle: 'solid' }}
                        />
                      </div>
                    ) : (
                      <textarea
                        id="bulk-body-textarea"
                        rows={8}
                        value={bulkBody}
                        onChange={(e) => setBulkBody(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-[11px]"
                      />
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2 text-[10px] text-slate-650">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      Có thể sử dụng các từ khoá thay thế tương ứng với cột Excel:
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold">{"{{Tên}}"}</span>
                        <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold">{"{{Email}}"}</span>
                        <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold">{"{{Số điện thoại}}"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controller & Progress Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Bảng điều khiển &amp; Tiến trình gửi
              </span>

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  {!isBulkSending ? (
                    <button
                      onClick={startBulkSending}
                      className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all border-none"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Bắt Đầu Gửi Hàng Loạt
                    </button>
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

                {sendingIndex !== -1 && (
                  <div className="text-xs text-slate-500 font-bold">
                    Tiến độ: {sendingIndex + 1} / {excelData.length} ({Math.round(((sendingIndex + 1) / excelData.length) * 100)}%)
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {isBulkSending && (
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((sendingIndex + 1) / excelData.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Recipient preview and sending states table */}
              {excelData.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                  <table className="w-full border-collapse text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[9.5px]">
                        <th className="px-4 py-2.5">STT</th>
                        <th className="px-4 py-2.5">Tên</th>
                        <th className="px-4 py-2.5">Email / Số điện thoại</th>
                        <th className="px-4 py-2.5 text-center">Kiểm tra</th>
                        <th className="px-4 py-2.5 text-center">Trạng thái</th>
                        <th className="px-4 py-2.5">Chi tiết/Lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelData.map((item, idx) => {
                        const contact = bulkChannel === 'email' ? item.email : item.phone;
                        const isContactValid = bulkChannel === 'email' ? item.isEmailValid : item.isPhoneValid;
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50/50 ${idx === sendingIndex ? 'bg-indigo-50/40 font-bold' : ''}`}>
                            <td className="px-4 py-2 font-mono text-slate-400">{item.id}</td>
                            <td className="px-4 py-2 font-bold text-slate-700">{item.name}</td>
                            <td className="px-4 py-2 text-slate-600">{contact || <span className="text-red-500 italic">Trống</span>}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                isContactValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {isContactValid ? 'Hợp lệ' : 'Lỗi định dạng'}
                              </span>
                            </td>
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
              )}

              {/* Live activity log */}
              {bulkLogs.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="text-[9px] font-mono font-black text-indigo-400 tracking-wider">NHẬT KÝ ĐƯỜNG TRUYỀN PHÁT HÀNG LOẠT LOGS</span>
                    <span className="text-[8px] font-mono text-slate-500">LIVE FEED</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto space-y-1">
                    {bulkLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('Thất bại') ? 'text-rose-455' : 'text-emerald-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
