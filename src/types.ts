/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'btc' | 'ctv';

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
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash';
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
  fee: number; // VNĐ — giá trước 10/11
  feePost?: number; // VNĐ — giá từ 10/11 trở đi (nếu khác)
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
  /** URL domain production của app (dùng để tạo mã nhúng WordPress) */
  appUrl?: string;
  /** Cấu hình trang đăng ký đại biểu */
  delegateFormConfig?: PublicFormConfig;
  /** Cấu hình trang đăng ký báo cáo viên */
  speakerFormConfig?: PublicFormConfig;
  /** Cấu hình trang đăng ký nhà tài trợ */
  sponsorFormConfig?: PublicFormConfig;
  /** Danh sách dịch vụ phụ trợ tùy chọn (CME, Gala, Masterclass, Tour...) */
  addOnServices?: AddOnService[];
  /** Cấu hình layout chứng chỉ CME điện tử */
  cmeTemplateConfig?: CmeTemplateConfig;
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

