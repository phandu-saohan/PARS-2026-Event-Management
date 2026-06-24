-- Script SQL cập nhật cấu hình màu nền Section và Báo cáo viên cho Trang Sự Kiện trên Supabase
-- Bảng mục tiêu: public.business_config
-- Chức năng: Đảm bảo tồn tại cột landing_page_sections (JSONB) và hợp nhất (merge) dữ liệu mặc định của Báo cáo viên & Màu nền vào cấu hình hiện tại.

-- 1. Đảm bảo cột landing_page_sections tồn tại trong bảng business_config
ALTER TABLE public.business_config 
ADD COLUMN IF NOT EXISTS landing_page_sections JSONB;

-- 2. Hợp nhất cấu hình mặc định (bao gồm speakers và sectionBg) vào cột landing_page_sections
-- Dữ liệu này sẽ kết hợp với các cấu hình hiện tại (như hero, intro) thông qua toán tử || (jsonb_concat)
UPDATE public.business_config
SET landing_page_sections = COALESCE(landing_page_sections, '{}'::jsonb) || jsonb_build_object(
  -- Danh sách Báo cáo viên mặc định (Quốc tế và Trong nước)
  'speakers', '{
    "foreign": [
      {
        "id": "spk-f1",
        "name": "Arturo Ramírez Montañana, MD, PhD",
        "role": "Aesthetic & Reconstructive Surgeon – Monterrey, Mexico",
        "highlight": "Chủ tịch ISAPS (International Society of Aesthetic Plastic Surgery)",
        "country": "Mexico",
        "type": "foreign",
        "initials": "AR",
        "avatarBg": "from-amber-600 via-red-700 to-rose-900"
      },
      {
        "id": "spk-f2",
        "name": "Prof. Kotaro Yoshimura, MD, PhD",
        "role": "Chairman of Department of Plastic Surgery at Jichi Medical University, Japan",
        "highlight": "Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản",
        "country": "Nhật Bản",
        "type": "foreign",
        "initials": "KY",
        "avatarBg": "from-teal-600 via-sky-700 to-indigo-900"
      },
      {
        "id": "spk-f3",
        "name": "Bertha Torres Gómez, MD, PhD",
        "role": "Mexican Association of Plastic Surgeons (AMCPer)",
        "highlight": "Thư ký Quốc gia của ISAPS",
        "country": "Mexico",
        "type": "foreign",
        "initials": "BG",
        "avatarBg": "from-pink-600 via-rose-700 to-purple-900"
      },
      {
        "id": "spk-f4",
        "name": "C. Bob Basu, MD, MBA, MPh, FAS",
        "role": "President, American Society of Plastic Surgeons",
        "highlight": "Board-Certified Plastic Surgeon, American Board of Plastic Surgery",
        "country": "Mỹ",
        "type": "foreign",
        "initials": "BB",
        "avatarBg": "from-blue-600 via-indigo-700 to-slate-900"
      },
      {
        "id": "spk-f5",
        "name": "Prof. Fabio Santanelli, MD",
        "role": "Secretary General of European Association of Plastic Surgeons (EURAPS)",
        "highlight": "Lecturer at Sapienza University of Rome, Italy",
        "country": "Ý",
        "type": "foreign",
        "initials": "FS",
        "avatarBg": "from-emerald-600 via-teal-700 to-cyan-900"
      },
      {
        "id": "spk-f6",
        "name": "Constantin Stan, MD, PhD",
        "role": "Founder of The Cronus Med Group Of Clinics",
        "highlight": "Chuyên khoa Phẫu thuật Thẩm mỹ, Tạo hình, Tái tạo & Tai Mũi Họng",
        "country": "Romania",
        "type": "foreign",
        "initials": "CS",
        "avatarBg": "from-indigo-600 via-purple-700 to-pink-900"
      },
      {
        "id": "spk-f7",
        "name": "Robert Francis Parkyn, MD",
        "role": "Clinical Associate Professor, Adelaide University",
        "highlight": "Trung tâm Phẫu thuật Tuyến vú và Nội tiết Norwood",
        "country": "Úc",
        "type": "foreign",
        "initials": "RP",
        "avatarBg": "from-slate-700 via-slate-800 to-teal-950"
      },
      {
        "id": "spk-f8",
        "name": "TS. Amin Kalaji, MD",
        "role": "Chair of the Membership Committee for IBRES",
        "highlight": "Chủ tịch Nhóm Tổng thư ký ISAPS",
        "country": "Thụy Điển",
        "type": "foreign",
        "initials": "AK",
        "avatarBg": "from-orange-600 via-rose-700 to-amber-950"
      },
      {
        "id": "spk-f9",
        "name": "Prof. Mark W. Clemens, MD, MBA, FACS",
        "role": "Professor, Department of Plastic Surgery, The University of Texas MD Anderson Cancer Center, Houston",
        "highlight": "Chuyên gia đầu ngành về tái tạo tuyến vú và an toàn túi ngực (BIA-ALCL)",
        "country": "Mỹ",
        "type": "foreign",
        "initials": "MC",
        "avatarBg": "from-sky-600 via-indigo-750 to-slate-900"
      },
      {
        "id": "spk-f10",
        "name": "Assoc. Prof. Yuko ASANO, MD",
        "role": "Director of the Breast Center, Kameda Medical Hospital in Japan",
        "highlight": "Chuyên gia hàng đầu về phẫu thuật robot và cấy ghép mỡ tự thân tái tạo ngực",
        "country": "Nhật Bản",
        "type": "foreign",
        "initials": "YA",
        "avatarBg": "from-rose-500 via-pink-700 to-violet-950"
      }
    ],
    "domestic": [
      {
        "id": "spk-d1",
        "name": "PGS.TS.BS. Vũ Ngọc Lâm",
        "role": "Director of the Aesthetic Center, 108 Military Central Hospital",
        "highlight": "Director of the Vietnam - Japan Medical Research Center",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "VL",
        "avatarBg": "from-emerald-700 via-teal-850 to-indigo-950"
      },
      {
        "id": "spk-d2",
        "name": "PGS.TS.BS. Nguyễn Hồng Hà",
        "role": "Head of Department of Maxillofacial, Plastic and Aesthetic Surgery, Viet Duc University Hospital",
        "highlight": "Trưởng khoa Phẫu thuật Tạo hình Hàm mặt & Thẩm mỹ Bệnh viện Việt Đức",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "NH",
        "avatarBg": "from-sky-750 via-teal-800 to-slate-950"
      },
      {
        "id": "spk-d3",
        "name": "PGS.TS.BS. Phạm Hiếu Liêm",
        "role": "Head of the Department of Plastic and Aesthetic Surgery, Pham Ngoc Thach University of Medicine",
        "highlight": "Trưởng Bộ môn Phẫu thuật Tạo hình Thẩm mỹ Đại học Y khoa Phạm Ngọc Thạch",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "PL",
        "avatarBg": "from-indigo-700 via-rose-800 to-amber-950"
      }
    ]
  }'::jsonb,

  -- Cấu hình màu nền mặc định cho từng Section trong trang Landing Page
  'sectionBg', '{
    "intro": "#ffffff",
    "speakersForeign": "#0f172a",
    "speakersDomestic": "#ffffff",
    "register": "#f1f5f9",
    "sponsors": "#ffffff",
    "location": "#0f172a"
  }'::jsonb
);
