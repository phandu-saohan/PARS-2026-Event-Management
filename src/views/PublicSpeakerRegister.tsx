/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle, FileText, Upload, Calendar, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { store } from '../dataStore';
import { sendRealtimeNotification } from '../lib/realtime';
import { SpeakerRegistration } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import { useFormLabel } from '../hooks/useFormLabel';



// Hiển thị tên chuyên khoa theo ngôn ngữ
// - Ưu tiên field nameEn từ DB nếu có
// - Fallback sang dictionary cứng cho dữ liệu cũ chưa có nameEn
const getTrackDisplayName = (nameVi: string, isEn: boolean, nameEn?: string): string => {
  if (!isEn) return nameVi;
  // Dùng nameEn từ DB nếu đã được nhập
  if (nameEn) return nameEn;
  // Fallback: dictionary tĩnh cho backward compatibility
  const fallbackDict: Record<string, string> = {
    'Ngoại Lồng Ngực & Tim Mạch': 'Thoracic & Cardiovascular Surgery',
    'Phẫu thuật Thẩm mỹ': 'Aesthetic Plastic Surgery',
    'Phẫu thuật Tạo hình Thẩm mỹ': 'Aesthetic Plastic Surgery',
    'Thẩm mỹ Nội khoa': 'Non-Surgical Aesthetics',
    'Laser & Thiết bị năng lượng': 'Laser & Energy-Based Devices',
    'Tế bào gốc & Chống lão hóa': 'Stem Cells & Anti-Aging',
    'Tế bào gốc & Y học tái tạo': 'Stem Cells & Regenerative Medicine',
    'Da liễu': 'Dermatology',
    'Chăm sóc da': 'Skincare',
    'Laser & Công nghệ cao': 'Laser & High Tech',
    'Gây mê hồi sức': 'Anesthesia & Resuscitation',
    'Ngoại khoa': 'Surgical Track',
    'Nội khoa': 'Non-Surgical Track',
    'Hội nghị': 'Conference',
    'Live Surgery': 'Live Surgery',
    'Hands-on': 'Hands-on',
    'Master Class': 'Master Class',
  };
  return fallbackDict[nameVi] || nameVi;
};


interface PublicSpeakerRegisterProps {
  onNavigate: (view: string) => void;
}

export default function PublicSpeakerRegister({ onNavigate }: PublicSpeakerRegisterProps) {
  const businessConfig = store.getBusinessConfig();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const formCfg = businessConfig.speakerFormConfig;
  const [nationality, setNationality] = useState<'vietname' | 'foreign'>('vietname');
  const L = useFormLabel(formCfg, nationality === 'vietname' ? 'vi' : 'en');
  // Form State
  const [title, setTitle] = useState('PGS.TS.BS');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [presentationTitle, setPresentationTitle] = useState('');
  const [presentationTrack, setPresentationTrack] = useState(store.getSpecialtyTracks()[0]?.name || '');
  const [abstractText, setAbstractText] = useState('');
  const [fileName, setFileName] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [calendarSynced, setCalendarSynced] = useState(true);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isDocUploading, setIsDocUploading] = useState(false);

  const tracks = store.getSpecialtyTracks();
  useEffect(() => {
    if (tracks.length > 0) {
      if (!presentationTrack || !tracks.some(t => t.name === presentationTrack)) {
        setPresentationTrack(tracks[0].name);
      }
    }
  }, [tracks, presentationTrack]);
  
  // States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdSpeaker, setCreatedSpeaker] = useState<SpeakerRegistration | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsDocUploading(true);
      const fileNamesArray: string[] = [];
      const fileDataUrlsArray: string[] = [];
      let processedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNamesArray.push(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          fileDataUrlsArray.push(reader.result as string);
          processedCount++;
          if (processedCount === files.length) {
            setFileName(fileNamesArray.join('|'));
            setDocumentUrl(fileDataUrlsArray.join('|'));
            setIsDocUploading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !presentationTitle || !abstractText || !organization) {
      setErrorMsg(nationality === 'vietname' ? 'Vui lòng điền đầy đủ các thông tin bắt buộc (*).' : 'Please fill in all required fields (*).');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const newId = 'SPK-' + Math.floor(Math.random() * 90000 + 10000);

      const speakerData: SpeakerRegistration = {
        id: newId,
        title,
        fullName,
        organization,
        department,
        phone,
        email,
        bio,
        presentationTitle,
        presentationTrack,
        abstractText,
        documentName: fileName || undefined,
        documentUrl: documentUrl || undefined,
        calendarSynced,
        status: 'pending',
        registrationDate: new Date().toISOString().split('T')[0],
        avatarUrl: avatarImage || undefined,
      };

      const saved = await store.saveSpeakerAsync(speakerData);

      // Broadcast realtime push notification to administrators
      await sendRealtimeNotification(
        'Báo cáo viên Đăng ký bài',
        `Báo cáo viên ${saved.title} ${saved.fullName} (${saved.organization}) vừa nộp bài báo cáo: "${saved.presentationTitle}"`,
        'badge'
      );

      // Gửi thông báo tự động (chạy background)
      try {
        store.sendWhatsappToSpeaker(saved);
      } catch (err) {
        console.error('Lỗi khi gửi thông báo tự động:', err);
      }

      setCreatedSpeaker(saved);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Lỗi lưu đăng ký báo cáo viên:', err);
      setErrorMsg(nationality === 'vietname' 
        ? `Không thể hoàn tất gửi bài báo cáo: ${err.message || err.details || 'Lỗi cơ sở dữ liệu.'}` 
        : `Failed to submit presentation: ${err.message || err.details || 'Database error.'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && createdSpeaker) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-800 to-indigo-900 text-white p-8 text-center relative">
            <div className="absolute top-4 left-4">
              <button 
                id="btn-back-event-details"
                onClick={() => onNavigate('event-details')}
                className="p-1 px-3 rounded-lg bg-indigo-950/50 hover:bg-indigo-950 text-xs font-semibold flex items-center gap-1 text-teal-150"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {L.t('Quay lại', 'Back')}
              </button>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">
              <CheckCircle className="w-8 h-8 text-teal-300" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{L.t('Đệ Trình Báo Cáo Thành Công!', 'Presentation Submitted Successfully!')}</h2>
            <p className="text-xs text-indigo-200 uppercase tracking-widest font-mono">{L.t('Mã hồ sơ: ', 'Submission ID: ')}{createdSpeaker.id}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200 text-slate-700 text-xs space-y-2 text-center">
              <Sparkles className="w-4 h-4 text-indigo-600 mx-auto" />
              <p className="font-bold text-slate-900">{L.t('Thông báo liên thông hệ thống tự động đã phát tín:', 'Automated system notifications have been dispatched:')}</p>
              <p>
                {L.t('Email tự động đã được lập trình gửi tới báo cáo viên: ', 'Automated email has been scheduled for the speaker: ')}<strong className="text-slate-950">{createdSpeaker.email}</strong>.
              </p>
              {createdSpeaker.calendarSynced && (
                <p className="text-xs text-slate-500">
                  {L.t('📅 Đã đồng bộ Google Calendar lân cận: Token lịch trích xuất thành công. Lịch trình thuyết trình sẽ tự cập nhật vào thiết bị cá nhân của bác sĩ khi có phê duyệt.', '📅 Google Calendar Sync Enabled: Calendar token generated. The presentation schedule will automatically sync to your personal calendar upon approval.')}
                </p>
              )}
            </div>

            <div className="border border-slate-100 p-6 rounded-2xl bg-slate-50/50 space-y-4">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block font-mono">{L.t('Chi tiết hồ sơ đệ trình của bạn:', 'Your Submission Details:')}</span>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200/50">
                  {createdSpeaker.avatarUrl && (
                    <img 
                      src={createdSpeaker.avatarUrl} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
                    />
                  )}
                  <div>
                    <span className="text-slate-400 font-medium">{L.t('Báo cáo viên:', 'Speaker:')}</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{createdSpeaker.title} {createdSpeaker.fullName}</p>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 font-medium">{L.t('Đơn vị:', 'Institution:')}</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{createdSpeaker.organization} ({createdSpeaker.department})</p>
                </div>
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400 font-medium">{L.t('Đề tài báo cáo đăng ký:', 'Registered Presentation Title:')}</span>
                  <p className="font-bold text-slate-905 mt-0.5 leading-relaxed text-teal-850">“{createdSpeaker.presentationTitle}”</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{L.t('Chuyên mục:', 'Category:')}</span>
                  <p className="font-semibold text-slate-800 mt-0.5 bg-indigo-50 inline-block px-2 py-0.5 rounded text-[11px]">
                    {getTrackDisplayName(
                      createdSpeaker.presentationTrack,
                      nationality === 'foreign',
                      store.getSpecialtyTracks().find(t => t.name === createdSpeaker.presentationTrack)?.nameEn
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{L.t('Tài liệu đính kèm:', 'Attached Document:')}</span>
                  <p className="font-semibold text-teal-700 mt-0.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {createdSpeaker.documentName}
                  </p>
                </div>
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400 font-medium font-mono">{L.t('TRẠNG THÁI KIỂM DUYỆT ACADEMIC:', 'ACADEMIC REVIEW STATUS:')}</span>
                  <span className="inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 font-mono">
                    {L.t('ĐANG THẨM ĐỊNH (PENDING)', 'REVIEW PENDING')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center italic mt-4 leading-relaxed">
              {L.t('Hội đồng Khoa học PARS 2026 sẽ tiến hành bình duyệt tóm tắt đề tài (Review Abstract) trong vòng 5 ngày làm việc. Quý bác sĩ có thể tra cứu trạng thái bài viết hoặc nhận phản hồi sửa đổi thông qua email cá nhân.', 'The PARS 2026 Scientific Committee will review your abstract within 5 working days. You can track the status of your submission or receive revision feedback via your email.')}
            </p>

            <button
              id="btn-speaker-return-home"
              onClick={() => onNavigate('event-details')}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs uppercase tracking-widest transition-all"
            >
              {L.t('Quay lại Trang Chủ Sự Kiện', 'Back to Event Homepage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 text-slate-800">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">

          {/* CLOSED FORM SCREEN */}
          {formCfg?.isOpen === false && (
            <div className="p-12 text-center" style={{ backgroundColor: formCfg?.headerBgColor || '#1e1b4b' }}>
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-white font-black text-xl mb-3">{L.t('Cổng nộp bài đã đóng', 'Submission Portal Closed')}</h2>
              <p className="text-white/70 text-sm max-w-md mx-auto">{formCfg?.closedMessage || L.t('Cổng nộp bài báo cáo hiện đã đóng. Vui lòng liên hệ Ban thư ký khoa học.', 'The presentation submission portal is currently closed. Please contact the Scientific Secretariat.')}</p>
              <button onClick={() => onNavigate('event-details')} className="mt-6 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 cursor-pointer transition-all">{L.t('← Về trang chủ', '← Back to Event Homepage')}</button>
            </div>
          )}

          {formCfg?.isOpen !== false && (<>

          {!formCfg?.hideHeader && (
            <div
              className="text-white p-8 border-b-4"
              style={{ backgroundColor: formCfg?.headerBgColor || '#1e1b4b', borderBottomColor: formCfg?.accentColor || '#818cf8' }}
            >
              {formCfg?.bannerImageUrl && <img src={formCfg.bannerImageUrl} alt="Banner" className="h-10 object-contain mb-3 rounded" />}
              <span className="text-[9px] font-black tracking-widest uppercase block font-mono mb-1"
                style={{ color: formCfg?.accentColor || '#818cf8' }}>
                {formCfg?.organizerLabel || L.t('HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)', 'VIETNAM SOCIETY OF AESTHETIC PLASTIC SURGERY (PARS)')}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {formCfg?.formTitle || L.t('ĐĂNG KÝ BÁO CÁO KHOA HỌC', 'SCIENTIFIC PRESENTATION REGISTRATION')}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {formCfg?.formDescription || L.t('Dành cho báo cáo viên quốc tế và nội địa đệ trình tóm tắt đề tài lâm sàng.', 'For international and domestic speakers to submit scientific abstracts.')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Language Selector (Hidden) */}
            <div className="hidden bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">

              <label className="block text-xs font-extrabold text-slate-800 mb-2 uppercase">
                {L.f('nationality', 'Chọn ngôn ngữ *', 'Select Language *')}
              </label>
              <div className="flex bg-slate-200/50 rounded-lg p-1 gap-2 max-w-sm">
                <button
                  type="button"
                  onClick={() => setNationality('vietname')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    nationality === 'vietname' ? 'bg-teal-900 text-amber-400 shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {L.t('Việt Nam', 'Vietnamese')}
                </button>
                <button
                  type="button"
                  onClick={() => setNationality('foreign')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    nationality === 'foreign' ? 'bg-teal-900 text-amber-400 shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  International
                </button>
              </div>
            </div>

            {/* Speaker block information */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-sm uppercase text-teal-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {L.section('speakerInfo', '1. Thông Tin Báo Cáo Viên', '1. Speaker Information')}
              </h3>

              {/* Speaker Avatar selector */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative group shrink-0 w-20 h-20 rounded-full bg-slate-250 border-2 border-dashed border-teal-600/30 flex items-center justify-center overflow-hidden">
                  {avatarImage ? (
                    <img src={avatarImage} className="w-full h-full object-cover" alt="Speaker Avatar" />
                  ) : (
                    <span className="text-slate-400 text-[10px] font-bold text-center p-1 leading-none select-none">
                      {L.t('Chưa có ảnh', 'No Photo')}
                    </span>
                  )}
                  {isAvatarUploading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-[10px] text-white font-mono">
                      {L.t('Đang tải...', 'Loading...')}
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-850 block uppercase tracking-wide">
                    {L.f('avatar', 'Ảnh Chân Dung / Chân Dung Khoa Học *', 'Scientific Portrait / Avatar *')}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {L.t('Ảnh chân dung của báo cáo viên sẽ được in trên Kỷ yếu Hội nghị, Thẻ đại biểu danh dự & Website chính thức.', 'The portrait photo of the speaker will be printed in the Conference Proceedings, Honorary Badge & Official Website.')}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1.5">
                    <div 
                      role="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-350 text-[11px] font-bold rounded-lg cursor-pointer transition-all select-none"
                    >
                      {L.t('Tải ảnh chân dung', 'Upload Portrait')}
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
                        {L.t('Xóa ảnh', 'Remove Photo')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('academicTitle', 'Học hàm / Học vị *', 'Academic Title *')}
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="GS.TS.BS">{L.t('GS.TS.BS (Giáo sư Tiến sĩ Bác sĩ)', 'Prof. Dr. Med.')}</option>
                    <option value="PGS.TS.BS">{L.t('PGS.TS.BS (Phó Giáo sư Tiến sĩ Bác sĩ)', 'Assoc. Prof. Dr. Med.')}</option>
                    <option value="TS.BS">{L.t('TS.BS (Tiến sĩ Bác sĩ)', 'Dr. Med. / PhD')}</option>
                    <option value="ThS.BS">{L.t('ThS.BS (Thạc sĩ Bác sĩ)', 'M.Med. / Master')}</option>
                    <option value="BSCK1">{L.t('BSCK1 (Bác sĩ Chuyên khoa I)', 'Specialist I')}</option>
                    <option value="BSCK2">{L.t('BSCK2 (Bác sĩ Chuyên khoa II)', 'Specialist II')}</option>
                    <option value="BSNT">{L.t('BSNT (Bác sĩ Nội trú)', 'Resident Physician')}</option>
                    <option value="BS">{L.t('BS (Bác sĩ)', 'MD (Medical Doctor)')}</option>
                    <option value="Professor">{L.t('Professor (International)', 'Professor')}</option>
                    <option value="Dr.">{L.t('Dr. (International)', 'Dr.')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('fullName', 'Họ và Tên *', 'Full Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={L.p('ví dụ: PGS.TS.BS. Trần Quốc Bảo', 'e.g. Prof. John Smith')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('institution', 'Đơn vị công tác chính *', 'Primary Institution *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={L.p('Bệnh viện mổ chính, viện nghiên cứu hoặc Đại học', 'Hospital, research institute, or university')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('department', 'Khoa / Phòng ban / Bộ môn *', 'Department / Specialty *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={L.p('ví dụ: Chuyên bộ môn Chấn thương chỉnh hình', 'e.g., Plastic Surgery Department')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('phone', 'Số điện thoại *', 'Phone Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={L.p('ví dụ: 0912123567', 'e.g. 0912123567')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('email', 'Email liên hệ trao đổi học thuật *', 'Academic Contact Email *')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={L.p('ví dụ: bao.tq@hospital.vn', 'e.g. j.smith@hospital.com')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <RichTextEditor
                  value={bio}
                  onChange={setBio}
                  label={L.f('bio', 'Tiểu sử khoa học tóm tắt (Bio) - Khoảng 100 từ', 'Short Scientific Bio - Around 100 words')}
                  placeholder={L.p('Giới thiệu học hàm học vị, số năm chuyên khoa, các chức vụ danh dự hoặc công trình đại diện...', 'Brief intro, academic title, years of experience, honorary positions, or publication highlights...')}
                  id="speaker-bio"
                />
              </div>
            </div>

            {/* abstract elements info */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-sm uppercase text-teal-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                {L.section('abstractInfo', '2. Nội Dung Đề Tài Đăng Ký Đệ Trình', '2. Abstract & Presentation Details')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('presentationTitle', 'Tên đề tài bài báo cáo khoa học *', 'Presentation Title *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    placeholder={L.p('In thường hoặc in nổi bật đề tài', 'Title of presentation / scientific paper')}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none placeholder-slate-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {L.f('category', 'Chuyên đề *', 'Scientific Topic / Track *')}
                  </label>
                  <select
                    value={presentationTrack}
                    onChange={(e) => setPresentationTrack(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {store.getSpecialtyTracks().map((track) => (
                      <option key={track.id} value={track.name}>
                        {getTrackDisplayName(track.name, nationality === 'foreign', track.nameEn)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <RichTextEditor
                  value={abstractText}
                  onChange={setAbstractText}
                  label={L.f('abstractText', 'Tóm tắt nội dung báo cáo (Abstract) - Giới hạn 500 từ *', 'Abstract text - Limit 500 words *')}
                  placeholder={L.p('Cấu trúc bắt buộc chuẩn Y học: Đặt vấn đề, Đối tượng - Phương pháp nghiên cứu, Kết quả, Kết luận thảo luận...', 'Standard medical structure: Objective, Materials & Methods, Results, Conclusion & Discussion...')}
                  id="speaker-abstract"
                />
              </div>

              {/* Upload element */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    CV/Abstract/Full file
                  </span>
                  <p className="text-[10px] text-slate-505">
                    {L.t('Chấp nhận định dạng .pdf, .docx, .ppt, .pptx tối đa 15MB. Bản này dùng để hội đồng đọc bình duyệt chuyên sâu.', 'Accepts .pdf, .docx, .ppt, .pptx formats, max 15MB. This file will be reviewed by the academic committee.')}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div 
                    role="button"
                    onClick={() => docInputRef.current?.click()}
                    className={`px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm ${isDocUploading ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {isDocUploading ? (
                      <svg className="w-4 h-4 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    {isDocUploading ? L.t('Đang xử lý...', 'Processing...') : L.t('Bấm để tải tệp', 'Click to upload')}
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.docx,.ppt,.pptx"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {fileName && !isDocUploading && (
                    <div className="flex flex-wrap gap-1.5 max-w-[240px] md:max-w-md">
                      {fileName.split('|').map((name, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg">
                          <span className="text-[11px] text-teal-800 font-semibold truncate max-w-[100px] md:max-w-[160px]">📎 {name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const names = fileName.split('|');
                              const urls = (documentUrl || '').split('|');
                              names.splice(idx, 1);
                              urls.splice(idx, 1);
                              if (names.length === 0) {
                                setFileName('');
                                setDocumentUrl(null);
                                if (docInputRef.current) docInputRef.current.value = '';
                              } else {
                                setFileName(names.join('|'));
                                setDocumentUrl(urls.join('|'));
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 text-[11px] shrink-0 cursor-pointer border-none bg-transparent p-0"
                            title="Xóa tệp"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Calendar sync selection */}
              <div className="flex items-start gap-3 p-4 bg-teal-50/20 border border-teal-100 rounded-2xl mt-4">
                <input
                  type="checkbox"
                  id="calendarSync"
                  checked={calendarSynced}
                  onChange={(e) => setCalendarSynced(e.target.checked)}
                  className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 mt-0.5"
                />
                <label htmlFor="calendarSync" className="cursor-pointer text-xs select-none">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    {L.t('Tự động đồng bộ Lịch trình (Calendar Sync)', 'Automated Calendar Sync')}
                  </span>
                  <span className="text-slate-500">
                    {L.t('Nếu đề tài được phê duyệt, hệ thống sẽ tự động đồng bộ thời gian báo cáo chính thức vào Google Calendar của bác sĩ qua file đệ trình .ics đính kèm.', 'If the presentation is approved, the system will automatically sync the schedule into your Google Calendar via an attached .ics file.')}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-submit-speaker"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 rounded-2xl bg-indigo-700 hover:bg-indigo-850 disabled:opacity-50 text-white font-bold text-sm tracking-widest transition-all shadow-lg shadow-indigo-700/10 uppercase cursor-pointer"
              >
                {isSubmitting ? L.t('Đang gửi hồ sơ báo cáo...', 'Submitting presentation details...') : L.t('Gửi Hồ Sơ & Đăng Báo Cáo Khoa Học', 'Submit Presentation & Scientific Abstract')}
              </button>
            </div>
          </form>

          {formCfg?.footerNote && (
            <div className="px-8 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10.5px] text-slate-600 text-center leading-relaxed">{formCfg.footerNote}</div>
            </div>
          )}

          </> )}
        </div>
      </div>
    </div>
  );
}
