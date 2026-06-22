/**
 * Data Mappers: camelCase (TypeScript) ↔ snake_case (PostgreSQL/Supabase)
 * Chuyển đổi dữ liệu giữa frontend types và database rows
 */
import type {
  Attendee, SpeakerRegistration, Sponsor, ConferenceSession,
  InternalTask, FinanceTransaction, RegistrationPackage, UserAccount,
  NotificationTemplate, SentNotificationLog, SpecialtyTrack,
  BusinessConfig, EmbedScript, ZaloConfig, EmailConfig, Contact,
  MarketingPost, UserRole, SendingCampaign
} from '../types';

// ============================================================
// ATTENDEES
// ============================================================
export function mapAttendeeToDb(a: Attendee): Record<string, any> {
  return {
    id: a.id,
    title: a.title,
    full_name: a.fullName,
    organization: a.organization,
    department: a.department,
    phone: a.phone,
    email: a.email,
    address: a.address,
    nationality: a.nationality,
    package_id: a.packageId,
    package_name: a.packageName,
    package_fee: a.packageFee,
    payment_status: a.paymentStatus,
    payment_method: a.paymentMethod,
    transaction_proof_url: a.transactionProofUrl || null,
    registration_date: a.registrationDate,
    qr_code_value: a.qrCodeValue,
    is_checked_in: a.isCheckedIn,
    check_in_time: a.checkInTime || null,
    notes: a.notes || null,
    year_of_birth: a.yearOfBirth || null,
    gender: a.gender || null,
    cme_required: a.cmeRequired || false,
    cme_identity_no: a.cmeIdentityNo || null,
    gala_required: a.galaRequired || false,
    masterclass_required: a.masterclassRequired || false,
    tour_required: a.tourRequired || false,
    registration_period: a.registrationPeriod || null,
    province: a.province || null,
    avatar_url: a.avatarUrl || null,
  };
}

export function mapDbToAttendee(row: any): Attendee {
  return {
    id: row.id,
    title: row.title || '',
    fullName: row.full_name || '',
    organization: row.organization || '',
    department: row.department || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    nationality: row.nationality || 'vietname',
    packageId: row.package_id || '',
    packageName: row.package_name || '',
    packageFee: Number(row.package_fee) || 0,
    paymentStatus: row.payment_status || 'unpaid',
    paymentMethod: row.payment_method || 'bank_transfer',
    transactionProofUrl: row.transaction_proof_url || undefined,
    registrationDate: row.registration_date || new Date().toISOString().split('T')[0],
    qrCodeValue: row.qr_code_value || '',
    isCheckedIn: Boolean(row.is_checked_in),
    checkInTime: row.check_in_time || undefined,
    notes: row.notes || undefined,
    yearOfBirth: row.year_of_birth || undefined,
    gender: row.gender || undefined,
    cmeRequired: Boolean(row.cme_required),
    cmeIdentityNo: row.cme_identity_no || undefined,
    galaRequired: Boolean(row.gala_required),
    masterclassRequired: Boolean(row.masterclass_required),
    tourRequired: Boolean(row.tour_required),
    registrationPeriod: row.registration_period || undefined,
    province: row.province || undefined,
    avatarUrl: row.avatar_url || undefined,
  };
}

// ============================================================
// SPEAKERS
// ============================================================
export function mapSpeakerToDb(s: SpeakerRegistration): Record<string, any> {
  return {
    id: s.id,
    title: s.title,
    full_name: s.fullName,
    organization: s.organization,
    department: s.department,
    phone: s.phone,
    email: s.email,
    bio: s.bio,
    presentation_title: s.presentationTitle,
    presentation_track: s.presentationTrack,
    abstract_text: s.abstractText,
    document_url: s.documentUrl || null,
    document_name: s.documentName || null,
    calendar_synced: s.calendarSynced,
    status: s.status,
    scheduled_session_id: s.scheduledSessionId || null,
    registration_date: s.registrationDate,
    avatar_url: s.avatarUrl || null,
  };
}

export function mapDbToSpeaker(row: any): SpeakerRegistration {
  return {
    id: row.id,
    title: row.title || '',
    fullName: row.full_name || '',
    organization: row.organization || '',
    department: row.department || '',
    phone: row.phone || '',
    email: row.email || '',
    bio: row.bio || '',
    presentationTitle: row.presentation_title || '',
    presentationTrack: row.presentation_track || '',
    abstractText: row.abstract_text || '',
    documentUrl: row.document_url || undefined,
    documentName: row.document_name || undefined,
    calendarSynced: Boolean(row.calendar_synced),
    status: row.status || 'pending',
    scheduledSessionId: row.scheduled_session_id || undefined,
    registrationDate: row.registration_date || new Date().toISOString(),
    avatarUrl: row.avatar_url || undefined,
  };
}

// ============================================================
// SPONSORS
// ============================================================
export function mapSponsorToDb(s: Sponsor): Record<string, any> {
  return {
    id: s.id,
    name: s.name,
    tier: s.tier,
    logo_url: s.logoUrl || null,
    pledged_amount: s.pledgedAmount,
    paid_amount: s.paidAmount,
    payment_status: s.paymentStatus,
    contact_person: s.contactPerson,
    contact_email: s.contactEmail,
    contact_phone: s.contactPhone,
    booth_location: s.boothLocation || null,
    benefits_signed: s.benefitsSigned || [],
    notes: s.notes || null,
    contract_no: s.contractNo || null,
    contract_sign_date: s.contractSignDate || null,
    contract_value: s.contractValue || null,
    contract_status: s.contractStatus || null,
    contract_file_url: s.contractFileUrl || null,
    contract_file_name: s.contractFileName || null,
  };
}

export function mapDbToSponsor(row: any): Sponsor {
  return {
    id: row.id,
    name: row.name || '',
    tier: row.tier || 'bronze',
    logoUrl: row.logo_url || undefined,
    pledgedAmount: Number(row.pledged_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    paymentStatus: row.payment_status || 'unpaid',
    contactPerson: row.contact_person || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    boothLocation: row.booth_location || undefined,
    benefitsSigned: row.benefits_signed || [],
    notes: row.notes || undefined,
    contractNo: row.contract_no || undefined,
    contractSignDate: row.contract_sign_date || undefined,
    contractValue: row.contract_value ? Number(row.contract_value) : undefined,
    contractStatus: row.contract_status || undefined,
    contractFileUrl: row.contract_file_url || undefined,
    contractFileName: row.contract_file_name || undefined,
  };
}

// ============================================================
// CONFERENCE SESSIONS
// ============================================================
export function mapSessionToDb(s: ConferenceSession): Record<string, any> {
  return {
    id: s.id,
    title: s.title,
    speaker_name: s.speakerName,
    speaker_title: s.speakerTitle,
    room_name: s.roomName,
    date: s.date,
    start_time: s.startTime,
    end_time: s.endTime,
    track: s.track,
    description: s.description,
  };
}

export function mapDbToSession(row: any): ConferenceSession {
  return {
    id: row.id,
    title: row.title || '',
    speakerName: row.speaker_name || '',
    speakerTitle: row.speaker_title || '',
    roomName: row.room_name || '',
    date: row.date || '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    track: row.track || '',
    description: row.description || '',
  };
}

// ============================================================
// INTERNAL TASKS
// ============================================================
export function mapTaskToDb(t: InternalTask): Record<string, any> {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    assigned_to_name: t.assignedToName,
    assigned_to_id: t.assignedToId,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    progress: t.progress,
    notes: t.notes || null,
    detailed_content: t.detailedContent || '',
    checklist: t.checklist || [],
    comments: t.comments || [],
  };
}

export function mapDbToTask(row: any): InternalTask {
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    assignedToName: row.assigned_to_name || '',
    assignedToId: row.assigned_to_id || '',
    priority: row.priority || 'medium',
    status: row.status || 'todo',
    deadline: row.deadline || '',
    progress: Number(row.progress) || 0,
    notes: row.notes || undefined,
    detailedContent: row.detailed_content || '',
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
  };
}

// ============================================================
// FINANCE TRANSACTIONS
// ============================================================
export function mapFinanceToDb(f: FinanceTransaction): Record<string, any> {
  return {
    id: f.id,
    date: f.date,
    type: f.type,
    category: f.category,
    amount: f.amount,
    description: f.description,
    reference_id: f.referenceId || null,
    payment_method: f.paymentMethod,
    verified_by: f.verifiedBy,
    is_verified: f.isVerified,
  };
}

export function mapDbToFinance(row: any): FinanceTransaction {
  return {
    id: row.id,
    date: row.date || '',
    type: row.type || 'income',
    category: row.category || '',
    amount: Number(row.amount) || 0,
    description: row.description || '',
    referenceId: row.reference_id || undefined,
    paymentMethod: row.payment_method || '',
    verifiedBy: row.verified_by || '',
    isVerified: Boolean(row.is_verified),
  };
}

// ============================================================
// REGISTRATION PACKAGES
// ============================================================
export function mapPackageToDb(p: RegistrationPackage): Record<string, any> {
  return {
    id: p.id,
    name: p.name,
    fee: p.fee,
    benefits: p.benefits || [],
    is_active: p.isActive,
    description: p.description || null,
    includes_cme: p.includesCme || false,
    includes_gala: p.includesGala || false,
  };
}

export function mapDbToPackage(row: any): RegistrationPackage {
  return {
    id: row.id,
    name: row.name || '',
    fee: Number(row.fee) || 0,
    benefits: row.benefits || [],
    isActive: row.is_active !== false,
    description: row.description || undefined,
    includesCme: Boolean(row.includes_cme),
    includesGala: Boolean(row.includes_gala),
  };
}

// ============================================================
// USER ACCOUNTS
// ============================================================
export function mapUserToDb(u: UserAccount): Record<string, any> {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    last_active: u.lastActive || null,
    permissions: u.permissions || [],
  };
}

export function mapDbToUser(row: any): UserAccount {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    role: row.role || 'ctv',
    status: row.status || 'active',
    lastActive: row.last_active || undefined,
    permissions: row.permissions || undefined,
  };
}

// ============================================================
// NOTIFICATION TEMPLATES
// ============================================================
export function mapTemplateToDb(t: NotificationTemplate): Record<string, any> {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    channel: t.channel,
    subject: t.subject || null,
    content: t.content,
    status: t.status || 'approved',
    zns_template_id: t.znsTemplateId || null,
    zns_type: t.znsType || null,
  };
}

export function mapDbToTemplate(row: any): NotificationTemplate {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type,
    channel: row.channel,
    subject: row.subject || undefined,
    content: row.content || '',
    status: row.status || 'approved',
    znsTemplateId: row.zns_template_id || undefined,
    znsType: row.zns_type || undefined,
  };
}

// ============================================================
// NOTIFICATION LOGS
// ============================================================
export function mapNotifLogToDb(l: SentNotificationLog): Record<string, any> {
  return {
    id: l.id,
    recipient: l.recipient,
    type: l.type,
    template_id: l.templateId,
    template_name: l.templateName,
    sender: l.sender,
    sent_at: l.sentAt,
    status: l.status,
    payload: l.payload,
    response: l.response || null,
  };
}

export function mapDbToNotifLog(row: any): SentNotificationLog {
  return {
    id: row.id,
    recipient: row.recipient || '',
    type: row.type,
    templateId: row.template_id || '',
    templateName: row.template_name || '',
    sender: row.sender || '',
    sentAt: row.sent_at || '',
    status: row.status || 'pending',
    payload: row.payload || {},
    response: row.response || undefined,
  };
}

// ============================================================
// SPECIALTY TRACKS
// ============================================================
export function mapTrackToDb(t: SpecialtyTrack): Record<string, any> {
  return {
    id: t.id,
    name: t.name,
    name_en: t.nameEn || null,
    description: t.description || null,
  };
}

export function mapDbToTrack(row: any): SpecialtyTrack {
  return {
    id: row.id,
    name: row.name || '',
    nameEn: row.name_en || undefined,
    description: row.description || undefined,
  };
}

// ============================================================
// BUSINESS CONFIG
// ============================================================
export function mapBusinessConfigToDb(c: BusinessConfig): Record<string, any> {
  return {
    id: 'default',
    event_name: c.eventName,
    organizer_name: c.organizerName,
    event_date: c.eventDate,
    event_location: c.eventLocation,
    max_registrations: c.maxRegistrations,
    require_payment_proof: c.requirePaymentProof,
    allow_self_cancellation: c.allowSelfCancellation,
    auto_send_zns: c.autoSendZns,
    require_practice_code: c.requirePracticeCode,
    pwa_name: c.pwaName || '',
    pwa_short_name: c.pwaShortName || '',
    pwa_description: c.pwaDescription || '',
    pwa_logo_url: c.pwaLogoUrl || '',
    pwa_theme_color: c.pwaThemeColor || '',
    pwa_background_color: c.pwaBackgroundColor || '',
    app_url: c.appUrl || 'https://pars2026.vercel.app',
    attendee_id_prefix: c.attendeeIdPrefix || 'PARS2026',
    delegate_form_config: c.delegateFormConfig || null,
    speaker_form_config: c.speakerFormConfig || null,
    sponsor_form_config: c.sponsorFormConfig || null,
    add_on_services: c.addOnServices || null,
    cme_template_config: c.cmeTemplateConfig || null,
  };
}

export function mapDbToBusinessConfig(row: any): BusinessConfig {
  return {
    eventName: row.event_name || '',
    organizerName: row.organizer_name || '',
    eventDate: row.event_date || '',
    eventLocation: row.event_location || '',
    maxRegistrations: Number(row.max_registrations) || 1500,
    requirePaymentProof: row.require_payment_proof !== false,
    allowSelfCancellation: Boolean(row.allow_self_cancellation),
    autoSendZns: row.auto_send_zns !== false,
    requirePracticeCode: row.require_practice_code !== false,
    pwaName: row.pwa_name || '',
    pwaShortName: row.pwa_short_name || '',
    pwaDescription: row.pwa_description || '',
    pwaLogoUrl: row.pwa_logo_url || '',
    pwaThemeColor: row.pwa_theme_color || '',
    pwaBackgroundColor: row.pwa_background_color || '',
    appUrl: row.app_url || 'https://pars2026.vercel.app',
    attendeeIdPrefix: row.attendee_id_prefix || 'PARS2026',
    delegateFormConfig: row.delegate_form_config || undefined,
    speakerFormConfig: row.speaker_form_config || undefined,
    sponsorFormConfig: row.sponsor_form_config || undefined,
    addOnServices: row.add_on_services || undefined,
    cmeTemplateConfig: row.cme_template_config || undefined,
  };
}


// ============================================================
// EMBED SCRIPTS
// ============================================================
export function mapEmbedScriptToDb(s: EmbedScript): Record<string, any> {
  return {
    id: s.id,
    name: s.name,
    target_type: s.targetType,
    code: s.code,
    is_active: s.isActive,
    notes: s.notes || null,
    created_at: s.createdAt,
  };
}

export function mapDbToEmbedScript(row: any): EmbedScript {
  return {
    id: row.id,
    name: row.name || '',
    targetType: row.target_type || 'custom',
    code: row.code || '',
    isActive: row.is_active !== false,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ============================================================
// CONFIG (Zalo, Email) — stored as JSONB in system_config table
// ============================================================
export function mapZaloConfigToDb(c: ZaloConfig): Record<string, any> {
  return { key: 'zalo_config', value: c };
}

export function mapEmailConfigToDb(c: EmailConfig): Record<string, any> {
  return { key: 'email_config', value: c };
}

// ============================================================
// CONTACTS (Excel Upload List preservation)
// ============================================================
export function mapContactToDb(c: Contact): Record<string, any> {
  return {
    id: c.id,
    name: c.name,
    email: c.email || null,
    phone: c.phone || null,
    group_name: c.groupName || 'Mặc định',
  };
}

export function mapDbToContact(row: any): Contact {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    groupName: row.group_name || 'Mặc định',
    createdAt: row.created_at || undefined,
  };
}

// ============================================================
// EVENT MARKETING POSTS
// ============================================================
export function mapMarketingPostToDb(p: MarketingPost): Record<string, any> {
  return {
    id: p.id,
    title: p.title,
    content: p.content || null,
    type: p.type,
    platforms: p.platforms || [],
    status: p.status,
    scheduled_at: p.scheduledAt || null,
    published_at: p.publishedAt || null,
    metrics: p.metrics || {},
    media_url: p.mediaUrl || null,
    video_script: p.videoScript || null,
    created_at: p.createdAt,
  };
}

export function mapDbToMarketingPost(row: any): MarketingPost {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    type: row.type || 'news_feed',
    platforms: row.platforms || [],
    status: row.status || 'draft',
    scheduledAt: row.scheduled_at || undefined,
    publishedAt: row.published_at || undefined,
    metrics: row.metrics || {},
    mediaUrl: row.media_url || undefined,
    videoScript: row.video_script || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ============================================================
// USER ROLES
// ============================================================
export function mapRoleToDb(r: UserRole): Record<string, any> {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description || null,
    permissions: r.permissions || [],
    is_system: r.isSystem || false,
    created_at: r.createdAt || new Date().toISOString()
  };
}

export function mapDbToRole(row: any): UserRole {
  return {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    description: row.description || undefined,
    permissions: row.permissions || [],
    isSystem: row.is_system || false,
    createdAt: row.created_at || undefined
  };
}

// ============================================================
// SENDING CAMPAIGNS
// ============================================================
export function mapCampaignToDb(c: SendingCampaign): Record<string, any> {
  return {
    id: c.id,
    name: c.name,
    channel: c.channel,
    template_id: c.templateId || null,
    subject: c.subject || null,
    body: c.body || null,
    status: c.status,
    total_recipients: c.totalRecipients,
    success_count: c.successCount,
    failed_count: c.failedCount,
    recipients: c.recipients || [],
    logs: c.logs || []
  };
}

export function mapDbToCampaign(row: any): SendingCampaign {
  return {
    id: row.id,
    name: row.name || '',
    channel: row.channel || 'email',
    templateId: row.template_id || undefined,
    subject: row.subject || undefined,
    body: row.body || undefined,
    status: row.status || 'draft',
    totalRecipients: Number(row.total_recipients) || 0,
    successCount: Number(row.success_count) || 0,
    failedCount: Number(row.failed_count) || 0,
    recipients: row.recipients || [],
    logs: row.logs || [],
    createdAt: row.created_at || new Date().toISOString()
  };
}
