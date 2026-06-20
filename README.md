<div align="center">

<img width="100" alt="PARS Logo" src="https://img.icons8.com/fluency/100/conference-call.png" />

# 🏥 PARS 2026 — Hệ Thống Quản Lý Hội Nghị

**Nền tảng quản lý hội nghị y khoa toàn diện dành cho Ban Tổ Chức**  
Đại biểu · Báo cáo viên · Nhà tài trợ · Lịch trình · Tài chính · Check-in

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

</div>

---

## 📖 Giới Thiệu

**PARS 2026** là hệ thống quản lý hội nghị y khoa chuyên biệt được xây dựng để phục vụ **Hội Thẩm Mỹ Việt Nam (PARS)**. Hệ thống cung cấp bộ công cụ quản trị toàn diện — từ đăng ký online, đối soát thanh toán tự động, phê duyệt bài báo cáo khoa học, sắp xếp lịch trình, đến check-in và in thẻ tên ngay tại sự kiện.

### Luồng Vận Hành Chính

```
Đại biểu đăng ký online
        ↓
Hệ thống gửi hướng dẫn thanh toán (Email / Zalo ZNS)
        ↓
SePay tự động đối soát chuyển khoản & duyệt vé
        ↓
Đại biểu nhận QR Code check-in
        ↓
Ngày hội nghị: Quét QR → In thẻ tên trong 2 giây
```

---

## ✨ Tính Năng Chính

### 👥 Quản Lý Đại Biểu
- Đăng ký trực tuyến (form public)
- Import hàng loạt qua file **Excel (.xlsx, .xls)** hoặc CSV
- Quản lý gói đăng ký và dịch vụ bổ sung (Add-on)
- In thẻ tên (badge) check-in tự động
- Xác thực chứng chỉ bác sĩ / chuyên khoa

### 🎤 Quản Lý Báo Cáo Viên
- Form đăng ký nộp tóm tắt báo cáo (abstract)
- Duyệt / từ chối đề tài theo chuyên khoa
- Xếp lịch báo cáo vào các phiên / phòng hội thảo
- Đồng bộ lịch báo cáo (Google Calendar)
- Xuất báo cáo danh sách báo cáo viên (CSV)

### 🤝 Quản Lý Nhà Tài Trợ
- Đăng ký tài trợ trực tuyến với nhiều gói (Bạch Kim, Vàng, Bạc...)
- Chọn **vị trí gian hàng** trên sơ đồ triển lãm
- Xuất hợp đồng tài trợ PDF
- Quản lý quyền lợi theo từng gói tài trợ

### 📅 Quản Lý Lịch Trình
- Sắp xếp phiên báo cáo theo phòng và khung giờ
- Giao diện kéo thả trực quan
- Xuất file lịch trình cho đại biểu

### 💰 Đối Soát Tài Chính
- Tích hợp **SePay** — tự động nhận biết chuyển khoản theo mã đơn
- Duyệt thanh toán thủ công khi cần
- Báo cáo thu chi, thống kê doanh thu theo gói
- Xuất Excel đối soát kế toán

### 🔔 Hệ Thống Thông Báo
- Gửi **Email** (Nodemailer / Resend)
- Gửi **Zalo ZNS** (thông báo OA chính thức)
- Template thông báo tùy chỉnh theo từng sự kiện
- Gửi thông báo hàng loạt

### ⚙️ Cài Đặt Hệ Thống
- Quản lý tài khoản và phân quyền (Admin / BTC / CTV)
- Cấu hình thông tin sự kiện, địa điểm, thời gian
- Quản lý gói đăng ký và gói tài trợ
- Nhúng form đăng ký vào website bên ngoài (Embed Script)
- Cài đặt máy in thẻ tên

---

## 🏗️ Kiến Trúc Hệ Thống

```
pars2026/
├── api/                     # Backend API (Express / Vercel Serverless)
│   ├── proxy.js             # CORS proxy cho SePay, Zalo, Email
│   └── ...
├── src/
│   ├── views/               # Các màn hình chính
│   │   ├── LoginPage.tsx            # Đăng nhập
│   │   ├── DashboardOverview.tsx    # Tổng quan bảng điều khiển
│   │   ├── AttendeeManagement.tsx   # Quản lý đại biểu
│   │   ├── SpeakerManagement.tsx    # Quản lý báo cáo viên
│   │   ├── SponsorManagement.tsx    # Quản lý nhà tài trợ
│   │   ├── ScheduleManagement.tsx   # Quản lý lịch trình
│   │   ├── FinanceReconciliation.tsx# Đối soát tài chính
│   │   ├── NotificationSystem.tsx   # Hệ thống thông báo
│   │   ├── SettingsPanel.tsx        # Cài đặt hệ thống
│   │   ├── UserGuide.tsx            # Tài liệu hướng dẫn
│   │   ├── PublicDelegateRegister.tsx   # Form đăng ký đại biểu
│   │   ├── PublicSpeakerRegister.tsx    # Form đăng ký báo cáo viên
│   │   ├── PublicSponsorRegister.tsx    # Form đăng ký tài trợ
│   │   └── PublicEventDetails.tsx       # Trang thông tin sự kiện
│   ├── components/          # UI components dùng chung
│   ├── dataStore.ts         # Store + Supabase data layer
│   ├── types.ts             # TypeScript interfaces
│   └── App.tsx              # Router chính
├── supabase/
│   ├── schema.sql           # Schema database
│   ├── supabase_setup.sql   # Script thiết lập đầy đủ
│   └── seed.sql             # Dữ liệu mẫu
├── public/                  # Static assets
├── vercel.json              # Cấu hình deploy Vercel
└── vite.config.ts           # Cấu hình Vite + TailwindCSS
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Tài khoản Supabase | Free tier trở lên |

### 1. Clone Repository

```bash
git clone https://github.com/parsinfo-afk/pars2026.git
cd pars2026
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường

Tạo file `.env.local` từ file mẫu:

```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local` với các thông tin của bạn:

```env
# ===== SUPABASE (Bắt buộc) =====
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ===== GEMINI AI (Tùy chọn - cho tính năng AI) =====
GEMINI_API_KEY=your-gemini-api-key

# ===== URL Ứng dụng =====
APP_URL=http://localhost:5173

# ===== EMAIL (Tùy chọn) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# ===== SEPAY (Tùy chọn - đối soát thanh toán) =====
VITE_SEPAY_API_KEY=your-sepay-api-key
```

### 4. Thiết Lập Database Supabase

Đăng nhập vào [Supabase Dashboard](https://app.supabase.com) → **SQL Editor** → Chạy lần lượt:

```sql
-- Bước 1: Chạy toàn bộ schema và setup
-- Copy nội dung file: supabase/supabase_setup.sql

-- Bước 2 (Tùy chọn): Chèn dữ liệu mẫu
-- Copy nội dung file: supabase/seed.sql
```

Hoặc dùng script tự động:

```bash
npm run db:setup
```

### 5. Chạy Ứng Dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

---

## 👤 Phân Quyền Hệ Thống

| Vai trò | Quyền hạn |
|---|---|
| **Admin** | Toàn quyền — cài đặt, tài khoản, tài chính, dữ liệu |
| **BTC** (Ban Tổ Chức) | Quản lý đại biểu, báo cáo viên, nhà tài trợ, lịch trình |
| **CTV** (Cộng Tác Viên) | Xem danh sách, check-in đại biểu, in thẻ tên |

**Tài khoản mặc định (sau khi chạy seed.sql):**

```
Email:    admin@pars.vn
Password: admin123456
```

> ⚠️ **Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!**

---

## 🔧 Tích Hợp Bên Thứ Ba

### SePay — Đối Soát Thanh Toán Tự Động
- Kết nối webhook SePay để tự động nhận diện chuyển khoản
- Cài đặt tại: **Cài Đặt → Tài Chính → Cổng Thanh Toán SePay**
- Hỗ trợ cả sandbox (test) và production

### Zalo ZNS — Thông Báo OA
- Gửi thông báo chính thức qua Zalo Official Account
- Cài đặt tại: **Cài Đặt → Thông Báo → Zalo ZNS**
- Yêu cầu: Tài khoản Zalo OA đã được duyệt template

### Email (SMTP / Resend)
- Hỗ trợ SMTP tùy chỉnh (Gmail, Outlook, ...) hoặc [Resend](https://resend.com)
- Cài đặt tại: **Cài Đặt → Thông Báo → Email**

### Gemini AI
- Hỗ trợ tính năng AI (tóm tắt, phân tích báo cáo)
- Cấu hình `GEMINI_API_KEY` trong `.env.local`

---

## 📦 Deploy Lên Vercel

```bash
# Cài Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Hoặc kết nối GitHub repository với [Vercel Dashboard](https://vercel.com) để tự động deploy khi push code.

**Biến môi trường cần thiết lập trên Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `APP_URL` (URL production của bạn)

---

## 🛠️ Scripts Hữu Ích

```bash
npm run dev          # Chạy development server
npm run build        # Build production bundle
npm run start        # Preview production build
npm run lint         # Kiểm tra lỗi TypeScript
npm run db:setup     # Thiết lập database Supabase
```

---

## 📋 Stack Công Nghệ

| Layer | Công Nghệ |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | TailwindCSS 4, Lucide React Icons |
| **Animation** | Motion (Framer Motion) |
| **Database** | Supabase (PostgreSQL) |
| **Backend API** | Express.js (Vercel Serverless Functions) |
| **Email** | Nodemailer, Resend |
| **Excel** | SheetJS (xlsx) |
| **AI** | Google Gemini API |
| **Thanh Toán** | SePay |
| **Deploy** | Vercel |

---

## 🗄️ Cấu Trúc Database

Các bảng chính trong Supabase:

| Bảng | Mô tả |
|---|---|
| `attendees` | Danh sách đại biểu tham dự |
| `speakers` | Danh sách báo cáo viên |
| `sponsors` | Danh sách nhà tài trợ |
| `sessions` | Phiên báo cáo / lịch trình |
| `notification_templates` | Template thông báo |
| `registration_packages` | Gói đăng ký |
| `sponsor_packages` | Gói tài trợ |
| `user_accounts` | Tài khoản hệ thống |
| `contacts` | Danh bạ liên lạc |

> Chi tiết schema xem tại [`supabase/schema.sql`](supabase/schema.sql)

---

## 📄 License

Dự án này được phân phối dưới giấy phép [Apache License 2.0](LICENSE).

---

<div align="center">

**Phát triển bởi đội ngũ kỹ thuật PARS** · [GitHub](https://github.com/parsinfo-afk/pars2026)

*Hệ thống Quản lý Hội nghị PARS 2026 — Powered by React + Supabase*

</div>

# PARS-2026-Event-Management
