/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = string;

export interface UserRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
}

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
}

export interface PermissionGroup {
  module: string;
  name: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'overview',
    name: 'Tổng Quan & Báo Cáo',
    permissions: [
      { code: 'overview.view', name: 'Xem tổng quan', description: 'Xem biểu đồ, thống kê, hoạt động gần đây' }
    ]
  },
  {
    module: 'schedule',
    name: 'Lịch Trình Hội Nghị',
    permissions: [
      { code: 'schedule.view', name: 'Xem lịch trình', description: 'Xem danh sách ca, phòng, buổi và phiên' },
      { code: 'schedule.edit', name: 'Quản lý lịch trình', description: 'Thêm, sửa, xóa các phòng, ca và phiên báo cáo' }
    ]
  },
  {
    module: 'speakers',
    name: 'Báo Cáo Viên',
    permissions: [
      { code: 'speakers.view', name: 'Xem báo cáo viên', description: 'Xem hồ sơ và tài liệu của báo cáo viên' },
      { code: 'speakers.edit', name: 'Quản lý báo cáo viên', description: 'Phê duyệt đăng ký, sửa đổi thông tin báo cáo viên' }
    ]
  },
  {
    module: 'attendees',
    name: 'Đại Biểu',
    permissions: [
      { code: 'attendees.view', name: 'Xem đại biểu', description: 'Xem danh sách và chi tiết đại biểu' },
      { code: 'attendees.edit', name: 'Quản lý đại biểu', description: 'Thêm mới, sửa đổi thông tin đại biểu' },
      { code: 'attendees.checkin', name: 'Quản lý check-in', description: 'Check-in đại biểu tại quầy hoặc qua QR code' }
    ]
  },
  {
    module: 'sponsors',
    name: 'Nhà Tài Trợ',
    permissions: [
      { code: 'sponsors.view', name: 'Xem nhà tài trợ', description: 'Xem danh sách nhà tài trợ và gian hàng' },
      { code: 'sponsors.edit', name: 'Quản lý nhà tài trợ', description: 'Thêm mới, duyệt và sửa thông tin tài trợ' }
    ]
  },
  {
    module: 'notifications',
    name: 'Thông Báo Tự Động',
    permissions: [
      { code: 'notifications.view', name: 'Xem cấu hình thông báo', description: 'Xem mẫu tin nhắn và nhật ký gửi' },
      { code: 'notifications.edit', name: 'Cấu hình mẫu tin', description: 'Chỉnh sửa mẫu tin ZNS, Email, SMS' },
      { code: 'notifications.send', name: 'Gửi tin hàng loạt', description: 'Gửi chiến dịch tin nhắn hàng loạt cho các đối tượng' }
    ]
  },
  {
    module: 'tasks',
    name: 'Công Việc Nội Bộ',
    permissions: [
      { code: 'tasks.view', name: 'Xem công việc', description: 'Xem danh sách công việc được giao' },
      { code: 'tasks.edit', name: 'Quản lý công việc', description: 'Tạo công việc mới, phân công nhiệm vụ, cập nhật tiến độ' }
    ]
  },
  {
    module: 'finances',
    name: 'Đối Soát Tài Chính',
    permissions: [
      { code: 'finances.view', name: 'Xem báo cáo tài chính', description: 'Xem số dư tài khoản, giao dịch, đối soát ngân hàng' },
      { code: 'finances.edit', name: 'Xử lý giao dịch', description: 'Phê duyệt giao dịch, đối soát thủ công và hoàn tiền' }
    ]
  },
  {
    module: 'marketing',
    name: 'Marketing Sự Kiện',
    permissions: [
      { code: 'marketing.view', name: 'Xem marketing', description: 'Xem bài viết, video short và kênh liên kết' },
      { code: 'marketing.edit', name: 'Soạn thảo nội dung', description: 'Tạo bài viết mới, kịch bản video, xem trước (preview) tin bài' },
      { code: 'marketing.publish', name: 'Liên kết & Xuất bản', description: 'Liên kết tài khoản mạng xã hội, làm mới token, xuất bản bài viết' }
    ]
  },
  {
    module: 'settings',
    name: 'Cài Đặt Hệ Thống',
    permissions: [
      { code: 'settings.view', name: 'Truy cập cài đặt', description: 'Xem cấu hình chung của hệ thống' },
      { code: 'settings.edit', name: 'Sửa cấu hình hệ thống', description: 'Thay đổi cấu hình nghiệp vụ, gói đăng ký, cấu hình CME, sao lưu dữ liệu' },
      { code: 'settings.roles', name: 'Quản lý phân quyền', description: 'Tạo vai trò mới và phân quyền chi tiết cho vai trò' }
    ]
  }
];

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  lastActive?: string;
  permissions?: string[];
}

export interface Attendee {
  id: string;
  title: string; // GS.TS.BS, PGS.TS.BS, TS.BS, ThS.BS, BS, v.v.
  fullName: string;
  organization: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  nationality: 'vietname' | 'foreign';
  packageId: string;
  packageName: string;
  packageFee: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending_verification';
  paymentMethod: 'bank_transfer' | 'vnpay' | 'stripe' | 'credit_card' | 'cash';
  transactionProofUrl?: string;
  registrationDate: string;
  qrCodeValue: string;
  isCheckedIn: boolean;
  checkInTime?: string;
  notes?: string;
  yearOfBirth?: string;
  gender?: string;
  cmeRequired?: boolean;
  cmeIdentityNo?: string;
  galaRequired?: boolean;
  masterclassRequired?: boolean;
  tourRequired?: boolean;
  registrationPeriod?: 'pre_10_11' | 'post_10_11';
  province?: string;
  avatarUrl?: string;
  doctorProofUrl?: string;
  source?: string;
  invoiceInfo?: any;
  createdAt?: string;
}

export interface SpeakerRegistration {
  id: string;
  title: string; // GS.TS.BS, PGS.TS.BS, TS.BS, v.v.
  fullName: string;
  organization: string;
  department: string;
  phone: string;
  email: string;
  bio: string;
  presentationTitle: string;
  presentationTrack: string; // ví dụ: Ngoại khoa, Nội khoa, Gây mê hồi sức
  abstractText: string;
  documentUrl?: string;
  documentName?: string;
  calendarSynced: boolean;
  status: 'pending' | 'approved' | 'rejected';
  scheduledSessionId?: string;
  registrationDate: string;
  avatarUrl?: string;
}

export interface SpecialtyTrack {
  id: string;
  name: string;       // Tên tiếng Việt (luôn có)
  nameEn?: string;    // Tên tiếng Anh (tùy chọn, dùng cho form đăng ký ngoại quốc)
  description?: string;
}

export interface ConferenceShift {
  id: string;
  name: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface VirtualSection {
  id: string;
  date: string;
  roomName: string;
  trackName: string;
  buoiId: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  description?: string;
  buoi?: 'sang' | 'chieu';
}

export interface ConferenceSession {
  id: string;
  title: string;
  titleEn?: string;
  speakerName: string;
  speakerTitle: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  track: string;
  description: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: string;
  logoUrl?: string; // or base64
  pledgedAmount: number;
  paidAmount: number;
  paymentStatus: 'fully_paid' | 'partially_paid' | 'unpaid';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  boothLocation?: string;
  benefitsSigned: string[]; // ví dụ: Banner, Booth, Kỷ niệm chương
  notes?: string;
  contractNo?: string;
  contractSignDate?: string;
  contractValue?: number;
  contractStatus?: 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';
  contractFileUrl?: string;
  contractFileName?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string; // YYYY-MM-DD HH:mm
}

export interface InternalTask {
  id: string;
  title: string;
  description: string;
  assignedToName: string;
  assignedToId: string; // maps to a UserAccount.id
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  deadline: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  notes?: string;
  detailedContent?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  comments?: TaskComment[];
}

export interface FinanceTransaction {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  type: 'income' | 'expense';
  category: string; // Gói đại biểu, Nhà tài trợ, Khách sạn, Tiệc, In ấn, Marketing, Khác
  amount: number;
  description: string;
  referenceId?: string; // links to Attendee.id or Sponsor.id
  paymentMethod: string;
  verifiedBy: string; // Tên người đối soát
  isVerified: boolean; // Trạng thái đối soát thời gian thực
}

export interface AddOnService {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  fee: number; // VNĐ
  isEnabled: boolean;
  color?: string; // teal | amber | purple | pink | indigo | rose
}

export interface RegistrationPackage {
  id: string;
  name: string;
  fee: number; // VNĐ
  benefits: string[];
  isActive: boolean;
  description?: string;
  includesCme?: boolean;
  includesGala?: boolean;
}

export interface SponsorPackage {
  id: string;
  name: string;
  nameEn?: string;
  fee: number; // VNĐ
  color?: string;
  benefits: string[];
  benefitsEn?: string[];
  isActive: boolean;
}

export interface ZaloConfig {
  appId: string;
  secretKey: string;
  oaId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenUpdatedAt?: string;
  isConfigured: boolean;
  testPhone: string;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  senderEmail: string;
  isConfigured: boolean;
  testEmail: string;
}

export interface ResendConfig {
  apiKey: string;
  senderEmail: string;
  isConfigured: boolean;
}

export interface CloudflareEmailConfig {
  workerUrl: string;
  apiToken: string;
  senderEmail: string;
  isConfigured: boolean;
}

export interface AwsSesConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  senderEmail: string;
  isConfigured: boolean;
}

export interface WhatsappConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  isConfigured: boolean;
  testPhone: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'registration_success' | 'payment_confirmed' | 'abstract_approved' | 'reminder_event' | 'sponsor_registered' | 'sponsor_paid' | 'sponsor_contract' | 'thank_you_survey';
  channel: 'email' | 'zalo' | 'whatsapp';
  subject?: string;
  content: string; // Chứa placeholder {{fullname}}, {{package}}, {{code}}...
  status?: 'approved' | 'pending' | 'rejected' | string; // Trạng thái phê duyệt ZNS Zalo
  znsTemplateId?: string; // Mã số mẫu tin thực tế bên Zalo hoặc Meta template name
  znsType?: 'transaction' | 'promotion' | string; // Loại tin
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface SepayConfig {
  /** API Token từ my.sepay.vn → Company Settings → API Access */
  apiToken: string;
  /** Số tài khoản ngân hàng liên kết trên SePay */
  accountNumber: string;
  /** Tên ngân hàng (VCB, TCB, MB, ACB, ...) */
  bankCode: string;
  /** Số tài khoản in đúng format (dùng cho VietQR) */
  bankAccountNo: string;
  /** Tên chủ tài khoản */
  accountName: string;
  /** Bật/tắt tích hợp SePay */
  isEnabled: boolean;
  /** Webhook secret key (Apikey header từ SePay webhook config) */
  webhookSecret?: string;
}

export interface RegisterWebhookConfig {
  isEnabled: boolean;
  apiKey: string;
}

export interface OneSignalConfig {
  appId: string;
  restApiKey: string;
  safariWebId?: string;
  isEnabled: boolean;
}

export interface SentNotificationLog {
  id: string;
  recipient: string;
  type: 'zalo' | 'email' | 'whatsapp';
  templateId: string;
  templateName: string;
  sender: string;
  sentAt: string;
  status: 'success' | 'failed' | 'pending';
  payload: any;
  response?: any;
}

/** Label song ngữ cho một mục */
export interface BilingualLabel {
  vi: string;
  en: string;
}

/** Cấu hình từng trang form public (delegate, speaker, sponsor) */
export interface PublicFormConfig {
  /** Bật/tắt form này — khi false hiển thị thông báo đóng */
  isOpen: boolean;
  /** Bật/tắt hiển thị header của form public */
  hideHeader?: boolean;
  /** Thông báo hiển thị khi form đóng */
  closedMessage?: string;
  /** Tiêu đề chính của form (H1) */
  formTitle?: string;
  /** Mô tả ngắn dưới tiêu đề */
  formDescription?: string;
  /** Tên ban tổ chức/đơn vị hiển thị trên header */
  organizerLabel?: string;
  /** Màu nền header (hex, default teal/slate) */
  headerBgColor?: string;
  /** Màu chữ accent (badge, icon) */
  accentColor?: string;
  /** Ảnh banner/logo hiển thị trên header */
  bannerImageUrl?: string;
  /** Ghi chú footer form */
  footerNote?: string;
  /** Giới hạn đăng ký riêng cho form này (0 = không giới hạn) */
  maxEntries?: number;
  /** Chế độ song ngữ: 'vi' = chỉ tiếng Việt, 'en' = chỉ tiếng Anh, 'both' = song ngữ VI/EN */
  language?: 'vi' | 'en' | 'both';
  /** Tên các section tùy chỉnh — key: section id, value: label song ngữ */
  sectionLabels?: Record<string, BilingualLabel>;
  fieldLabels?: Record<string, BilingualLabel>;
  sponsorPackages?: SponsorPackage[];
}

export interface CmeTemplateConfig {
  certificateTitle: string;
  certificateSubtitle: string;
  awardBodyTitle: string;
  awardBodySubtitle: string;
  paragraphText: string;
  courseTitle: string;
  durationText: string;
  signerName: string;
  signerTitle: string;
  sealText1: string;
  sealText2: string;
  sealText3: string;
  locationDateText: string;
  borderColor: string;
  bgColor: string;
  logoUrl?: string;
}

/**
 * Cấu hình từng cổng thanh toán tích hợp vào form đăng ký công khai
 */
export interface PaymentGatewayConfig {
  /** VietQR chuyển khoản ngân hàng nội địa */
  vietqr?: {
    bankCode: string;        // Ví dụ: VCB, MB, TCB, ACB...
    accountNo: string;       // Số tài khoản
    accountName: string;     // Tên chủ tài khoản
    isEnabled: boolean;
  };
  /** VNPay QR deeplink */
  vnpay?: {
    merchantId: string;      // Mã terminal / merchant VNPay
    deeplink?: string;       // URL deeplink hoặc merchant ref
    isEnabled: boolean;
  };
  /** Stripe Checkout cho Visa/Mastercard quốc tế */
  stripe?: {
    publishableKey: string;  // pk_live_... hoặc pk_test_...
    priceId?: string;        // Stripe Price ID (nếu dùng fixed price)
    successUrl?: string;     // URL redirect sau khi thanh toán
    cancelUrl?: string;      // URL redirect nếu hủy
    isEnabled: boolean;
  };
}

export interface BusinessConfig {
  eventName: string;
  organizerName: string;
  eventDate: string;
  eventLocation: string;
  maxRegistrations: number;
  requirePaymentProof: boolean;
  allowSelfCancellation: boolean;
  autoSendZns: boolean;
  requirePracticeCode: boolean;
  pwaName?: string;
  pwaShortName?: string;
  pwaDescription?: string;
  pwaLogoUrl?: string;
  pwaThemeColor?: string;
  pwaBackgroundColor?: string;
  /** URL domain production của app (dúng để tạo mã nhúng WordPress) */
  appUrl?: string;
  /** Tiếp đầu ngữ của mã ID đại biểu (vd: PARS, PARS2026, ATT...) */
  attendeeIdPrefix?: string;
  /** Cấu hình trang đăng ký đại biểu */
  delegateFormConfig?: PublicFormConfig;
  /** Cấu hình trang đăng ký báo cáo viên */
  speakerFormConfig?: PublicFormConfig;
  /** Cấu hình trang đăng ký nhà tài trợ */
  sponsorFormConfig?: PublicFormConfig;
  /** Danh sách dịch vụ phụ trợ tùy chọn (CME, Gala, Masterclass, Tour...) */
  addOnServices?: AddOnService[];
  /** Cấu hình cổng thanh toán (VietQR, VNPay, Stripe) */
  paymentConfig?: PaymentGatewayConfig;
  /** Cấu hình layout chứng chỉ CME điện tử */
  cmeTemplateConfig?: CmeTemplateConfig;
  /** Các cấu hình hình ảnh cho trang landing page công khai */
  landingLogoUrl?: string;
  landingLandmarksUrl?: string;
  landingSlide1Url?: string;
  landingSlide2Url?: string;
  landingSlide3Url?: string;
  landingSlide4Url?: string;
  landingPageSections?: LandingPageSections;
}

export interface SpeakerConfig {
  id: string;
  name: string;
  role: string;
  highlight: string;
  country: string;
  type: 'foreign' | 'domestic';
  photoUrl?: string;
  initials?: string;
  avatarBg?: string;
}

export interface LandingPageSections {
  hero?: {
    tag?: string;
    title?: string;
    year?: string;
    themeEn?: string;
    themeVi?: string;
    date?: string;
    location?: string;
    btnRegisterText?: string;
    btnProgramText?: string;
  };
  intro?: {
    title?: string;
    text1?: string;
    text2?: string;
    highlight1Title?: string;
    highlight1Desc?: string;
    highlight2Title?: string;
    highlight2Desc?: string;
    highlight3Title?: string;
    highlight3Desc?: string;
    block1Title?: string;
    block1Desc?: string;
    block1BtnText?: string;
    block2Title?: string;
    block2Desc?: string;
    block2BtnText?: string;
    block3Title?: string;
    block3Desc?: string;
    block3BtnText?: string;
    block4Title?: string;
    block4Desc?: string;
    block4BtnText?: string;
  };
  speakers?: {
    foreign: SpeakerConfig[];
    domestic: SpeakerConfig[];
  };
  sectionBg?: {
    /** Màu nền section Giới thiệu hội nghị */
    intro?: string;
    /** Màu nền section Báo cáo viên Quốc tế */
    speakersForeign?: string;
    /** Màu nền section Báo cáo viên Trong nước */
    speakersDomestic?: string;
    /** Màu nền section Đăng ký tham dự */
    register?: string;
    /** Màu nền section Nhà tài trợ */
    sponsors?: string;
    /** Màu nền section Địa điểm */
    location?: string;
  };
  sectionTitles?: {
    introTitleVi?: string;
    introTitleEn?: string;
    introSubtitleVi?: string;
    introSubtitleEn?: string;
    
    speakersForeignTitleVi?: string;
    speakersForeignTitleEn?: string;
    speakersForeignSubtitleVi?: string;
    speakersForeignSubtitleEn?: string;

    speakersDomesticTitleVi?: string;
    speakersDomesticTitleEn?: string;
    speakersDomesticSubtitleVi?: string;
    speakersDomesticSubtitleEn?: string;

    programTitleVi?: string;
    programTitleEn?: string;
    programSubtitleVi?: string;
    programSubtitleEn?: string;
    programDescVi?: string;
    programDescEn?: string;

    registerTitleVi?: string;
    registerTitleEn?: string;
    registerSubtitleVi?: string;
    registerSubtitleEn?: string;
    registerDescVi?: string;
    registerDescEn?: string;

    sponsorsTitleVi?: string;
    sponsorsTitleEn?: string;
    sponsorsSubtitleVi?: string;
    sponsorsSubtitleEn?: string;

    locationTitleVi?: string;
    locationTitleEn?: string;
    locationSubtitleVi?: string;
    locationSubtitleEn?: string;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
}


export interface EmbedScript {
  id: string;
  name: string;
  targetType: 'delegate' | 'speaker' | 'sponsor' | 'analytics' | 'custom';
  code: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupName: string;
  createdAt?: string;
}

export interface MarketingPost {
  id: string;
  title: string;
  content: string;
  type: 'news_feed' | 'video_short';
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    reach?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  mediaUrl?: string;
  videoScript?: string;
  createdAt: string;
}

export interface MarketingChannelsConfig {
  facebook: {
    appId: string;
    pageId: string;
    pageAccessToken: string;
    pageName: string;
    isConfigured: boolean;
    // Facebook long-lived token does not use refresh token flow
  };
  zalo: {
    appId: string;
    secretKey: string;
    oaId: string;
    accessToken: string;
    refreshToken: string;      // Zalo Refresh Token (3 months)
    oaName: string;
    isConfigured: boolean;
    tokenExpiresAt?: string;   // ISO timestamp khi token sẽ hết hạn
  };
  tiktok: {
    clientKey: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;      // TikTok Refresh Token (1 year)
    accountName: string;
    isConfigured: boolean;
    tokenExpiresAt?: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;      // Google Refresh Token (permanent until revoked)
    channelName: string;
    isConfigured: boolean;
    tokenExpiresAt?: string;
  };
}

export interface CampaignRecipient {
  id: number;
  name: string;
  email: string;
  phone: string;
  isEmailValid: boolean;
  isPhoneValid: boolean;
  status: 'pending' | 'sending' | 'success' | 'failed';
  error: string;
  openedAt?: string;
  clickedAt?: string;
  [key: string]: any;
}

export interface SendingCampaign {
  id: string;
  name: string;
  channel: 'email' | 'zalo';
  templateId?: string;
  subject?: string;
  body?: string;
  status: 'draft' | 'sending' | 'paused' | 'completed';
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  openCount?: number;
  clickCount?: number;
  recipients: CampaignRecipient[];
  logs: string[];
  createdAt: string;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  placeholder?: string;
  options?: string[]; // for select, checkbox, radio
  required: boolean;
  isEnabled: boolean;
  isSystem?: boolean;
}

export interface CustomFormConfig {
  id: string;
  title: string;
  headerTitle?: string;
  headerSubtitle?: string;
  headerLogoUrl?: string;
  headerBannerUrl?: string;
  footerText?: string;
  fields: {
    title: boolean;
    fullName: boolean;
    organization: boolean;
    department: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
    yearOfBirth: boolean;
    gender: boolean;
    cmeRequired: boolean;
    cmeIdentityNo: boolean;
    galaRequired: boolean;
    masterclassRequired: boolean;
    tourRequired: boolean;
    province: boolean;
    avatarUrl: boolean;
    doctorProofUrl: boolean;
    fieldsOrder?: string[];
    customFieldsList?: FormFieldConfig[];
    customLabels?: Record<string, string>;
    customPlaceholders?: Record<string, string>;
  };
  requiredFields: {
    fullName: boolean;
    phone: boolean;
    email: boolean;
    organization: boolean;
  };
  packages: {
    id: string;
    name: string;
    fee: number;
    isActive: boolean;
  }[];
  paymentQrEnabled: boolean;
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bgType?: 'color' | 'image';
  bgColor?: string;
  createdAt: string;
  isActive: boolean;
}


