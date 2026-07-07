import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Case-insensitive flexible key extractor
function extractValue(body: any, aliases: string[]): any {
  if (!body || typeof body !== 'object') return undefined;
  
  // 1. Try exact matches first
  for (const alias of aliases) {
    if (body[alias] !== undefined) {
      return body[alias];
    }
  }

  // 2. Try case-insensitive matching
  const lowercaseAliases = aliases.map(a => a.toLowerCase());
  for (const key of Object.keys(body)) {
    const lowerKey = key.toLowerCase();
    if (lowercaseAliases.includes(lowerKey)) {
      return body[key];
    }
  }
  
  return undefined;
}

// Simple Vietnamese tone remover for QR code value mapping
function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apikey, X-Api-Key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, message: 'Supabase credentials are not configured on the server.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch register webhook configuration from system_config
    let isWebhookEnabled = false;
    let configuredApiKey = '';

    const { data: configData, error: configErr } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'register_webhook_config')
      .maybeSingle();

    if (!configErr && configData && configData.value) {
      const cfg = configData.value;
      isWebhookEnabled = !!cfg.isEnabled;
      configuredApiKey = cfg.apiKey || '';
    }

    // 2. Validate API Authorization if webhook is enabled and apiKey is configured
    if (isWebhookEnabled && configuredApiKey) {
      const authHeader = (req.headers['authorization'] as string) || '';
      const apiKeyHeader = (req.headers['x-api-key'] as string) || (req.headers['apikey'] as string) || '';
      const apiKeyQuery = (req.query.apiKey as string) || (req.query.apikey as string) || '';

      let incomingToken = apiKeyHeader || apiKeyQuery;
      if (!incomingToken && authHeader.trim()) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && (parts[0].toLowerCase() === 'bearer' || parts[0].toLowerCase() === 'apikey')) {
          incomingToken = parts[1];
        } else {
          incomingToken = authHeader.trim();
        }
      }

      if (incomingToken !== configuredApiKey) {
        console.warn('[Register Webhook] Unauthorized attempt. Configured API Key does not match incoming token.');
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
      }
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid JSON request body' });
    }

    // 3. Flexible extraction of registration data
    const fullName = extractValue(payload, ['fullName', 'full_name', 'name', 'hoTen', 'ho_ten', 'HoTen', 'Name']);
    const email = extractValue(payload, ['email', 'mail', 'Email', 'Mail']);
    const phone = extractValue(payload, ['phone', 'phoneNumber', 'phone_number', 'telephone', 'tel', 'sdt', 'soDienThoai', 'so_dien_thoai']);
    const organization = extractValue(payload, ['organization', 'org', 'company', 'workplace', 'donVi', 'don_vi', 'DonVi']);
    const department = extractValue(payload, ['department', 'dept', 'position', 'chucVu', 'chuc_vu', 'ChucVu']);
    const title = extractValue(payload, ['title', 'danhXuong', 'danh_xuong', 'DanhXuong']) || 'BS';
    const address = extractValue(payload, ['address', 'street', 'diaChi', 'dia_chi']) || '';
    const province = extractValue(payload, ['province', 'city', 'tinh', 'tinhThanh', 'tinh_thanh']) || '';
    const nationality = extractValue(payload, ['nationality', 'quocTich', 'quoc_tich']) || 'vietname';
    
    // Package mappings
    const packageInputId = extractValue(payload, ['packageId', 'package_id', 'goi', 'goiVe', 'goi_ve']);
    const packageInputName = extractValue(payload, ['packageName', 'package_name']);
    const packageInputFee = extractValue(payload, ['packageFee', 'package_fee', 'fee', 'price', 'amount']);

    // CME details
    const cmeRequiredVal = extractValue(payload, ['cmeRequired', 'cme_required', 'cme', 'capCme', 'cap_cme']);
    const cmeRequired = cmeRequiredVal === true || String(cmeRequiredVal).toLowerCase() === 'true' || String(cmeRequiredVal) === '1';
    const cmeIdentityNo = extractValue(payload, ['cmeIdentityNo', 'cme_identity_no', 'cmeNo', 'cme_no', 'soCchn', 'so_cchn']) || '';

    // Addons
    const galaRequiredVal = extractValue(payload, ['galaRequired', 'gala_required', 'gala', 'galaDinner', 'gala_dinner']);
    const galaRequired = galaRequiredVal === true || String(galaRequiredVal).toLowerCase() === 'true' || String(galaRequiredVal) === '1';

    const masterclassRequiredVal = extractValue(payload, ['masterclassRequired', 'masterclass_required', 'masterclass']);
    const masterclassRequired = masterclassRequiredVal === true || String(masterclassRequiredVal).toLowerCase() === 'true' || String(masterclassRequiredVal) === '1';

    const tourRequiredVal = extractValue(payload, ['tourRequired', 'tour_required', 'tour']);
    const tourRequired = tourRequiredVal === true || String(tourRequiredVal).toLowerCase() === 'true' || String(tourRequiredVal) === '1';

    // Metadata
    const gender = extractValue(payload, ['gender', 'gioiTinh', 'gioi_tinh']) || 'Nam';
    const birthYearVal = extractValue(payload, ['yearOfBirth', 'year_of_birth', 'birthYear', 'birth_year', 'namSinh', 'nam_sinh']);
    const yearOfBirth = birthYearVal ? parseInt(String(birthYearVal), 10) : null;
    const paymentStatus = extractValue(payload, ['paymentStatus', 'payment_status']) || 'unpaid';
    const paymentMethod = extractValue(payload, ['paymentMethod', 'payment_method']) || 'bank_transfer';
    const notes = extractValue(payload, ['notes', 'note', 'ghiChu', 'ghi_chu']) || 'Registered via Webhook';
    const avatarUrl = extractValue(payload, ['avatarUrl', 'avatar_url']) || '';

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Missing required field: fullName' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Missing required field: phone' });
    }

    // 4. Resolve package details from the database if available
    let packageId = packageInputId || 'pkg-standard';
    let packageName = packageInputName || 'Gói Đại Biểu Tiêu Chuẩn';
    let packageFee = packageInputFee ? parseFloat(String(packageInputFee)) : 1500000;

    const { data: dbPackages } = await supabase.from('packages').select('*');
    if (dbPackages && dbPackages.length > 0) {
      // Try to find matching package by id first
      let matchedPkg = dbPackages.find(p => p.id === packageId);
      if (!matchedPkg && packageInputName) {
        // Try match by package name
        const lowerInputName = String(packageInputName).toLowerCase();
        matchedPkg = dbPackages.find(p => p.name.toLowerCase().includes(lowerInputName));
      }
      if (matchedPkg) {
        packageId = matchedPkg.id;
        packageName = matchedPkg.name;
        packageFee = matchedPkg.fee;
      }
    }

    // 5. Fetch attendeeIdPrefix from business_config
    let prefix = 'PARS2026';
    const { data: bizData } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'business_config')
      .maybeSingle();

    if (bizData && bizData.value && bizData.value.attendeeIdPrefix) {
      prefix = bizData.value.attendeeIdPrefix;
    }

    // 6. Generate a unique participant ID (ID check retry loop)
    let newId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomSeq = Math.floor(Math.random() * 900000 + 100000);
      newId = `${prefix}-${randomSeq}`;

      const { data: existing } = await supabase
        .from('attendees')
        .select('id')
        .eq('id', newId)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ success: false, message: 'Failed to generate a unique participant ID after multiple attempts.' });
    }

    // Generate security QR Code value
    const normalizedName = removeVietnameseTones(fullName).toUpperCase();
    const qrCodeValue = `${newId}-${normalizedName}`;

    // Registration date (format YYYY-MM-DD)
    const registrationDate = new Date().toISOString().split('T')[0];

    // 7. Insert the attendee record into Supabase
    const dbRecord = {
      id: newId,
      title: String(title),
      full_name: String(fullName).toUpperCase(),
      organization: organization ? String(organization) : '',
      department: department ? String(department) : '',
      phone: String(phone),
      email: email ? String(email) : '',
      address: String(address),
      nationality: String(nationality),
      package_id: packageId,
      package_name: packageName,
      package_fee: packageFee,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      registration_date: registrationDate,
      qr_code_value: qrCodeValue,
      is_checked_in: false,
      notes: String(notes),
      year_of_birth: yearOfBirth,
      gender: String(gender),
      cme_required: cmeRequired,
      cme_identity_no: cmeIdentityNo,
      gala_required: galaRequired,
      masterclass_required: masterclassRequired,
      tour_required: tourRequired,
      province: province ? String(province) : '',
      avatar_url: avatarUrl ? String(avatarUrl) : ''
    };

    const { error: insertErr } = await supabase
      .from('attendees')
      .insert(dbRecord);

    if (insertErr) {
      console.error('[Register Webhook] Database insert error:', insertErr);
      return res.status(500).json({ success: false, message: 'Failed to save attendee to database.', error: insertErr.message });
    }

    console.log(`[Register Webhook] ✅ Successfully registered attendee ${newId}: ${fullName} (${phone}) via webhook.`);

    return res.status(200).json({
      success: true,
      message: 'Attendee registered successfully via webhook',
      attendee: {
        id: newId,
        title: title,
        fullName: fullName.toUpperCase(),
        phone: phone,
        email: email || '',
        organization: organization || '',
        packageName: packageName,
        packageFee: packageFee,
        paymentStatus: paymentStatus,
        qrCodeValue: qrCodeValue,
        registrationDate: registrationDate
      }
    });

  } catch (err: any) {
    console.error('[Register Webhook] Unhandled exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message || String(err) });
  }
}
