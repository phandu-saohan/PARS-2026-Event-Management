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
        "role": "President, International Society of Aesthetic Plastic Surgery (ISAPS)",
        "highlight": "Plastic, Aesthetic & Reconstructive Surgeon – Monterrey, Mexico",
        "country": "Mexico",
        "type": "foreign",
        "initials": "AR",
        "avatarBg": "from-amber-600 via-red-700 to-rose-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/arturo-ramirez-montanana-md-phd-(1).png"
      },
      {
        "id": "spk-f2",
        "name": "Prof. Kotaro Yoshimura, MD, PhD",
        "role": "Chairman of Department of Plastic Surgery at Jichi Medical University, Japan",
        "highlight": "Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản",
        "country": "Nhật Bản",
        "type": "foreign",
        "initials": "KY",
        "avatarBg": "from-teal-600 via-sky-700 to-indigo-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/prof-kotaro-yoshimura-md-phd-(1).png"
      },
      {
        "id": "spk-f3",
        "name": "Bertha Torres Gómez, MD, PhD",
        "role": "Chair, National Secretary of ISAPS",
        "highlight": "Mexican Association of Plastic, Aesthetic, and Reconstructive Surgery (AMCPER)",
        "country": "Mexico",
        "type": "foreign",
        "initials": "BG",
        "avatarBg": "from-pink-600 via-rose-700 to-purple-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/bertha-torres-gomez-md-phd.png"
      },
      {
        "id": "spk-f4",
        "name": "Prof. Fabio Santanelli, MD",
        "role": "Secretary General of the European Association of Plastic Surgeons",
        "highlight": "Lecturer at Sapienza University of Rome, Italy",
        "country": "Ý",
        "type": "foreign",
        "initials": "FS",
        "avatarBg": "from-emerald-600 via-teal-700 to-cyan-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/prof-fabio-santanelli-md-(1).png"
      },
      {
        "id": "spk-f5",
        "name": "C. Bob Basu, MD, MBA, MPH, FACS",
        "role": "President, American Society of Plastic Surgeons",
        "highlight": "Board-Certified Plastic Surgeon, American Board of Plastic Surgery",
        "country": "Mỹ",
        "type": "foreign",
        "initials": "BB",
        "avatarBg": "from-blue-600 via-indigo-700 to-slate-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/c-bob-basu-md-mba-mph-facs.png"
      },
      {
        "id": "spk-f6",
        "name": "Constantin Stan, MD, PhD",
        "role": "Founder Of The Cronos Med Group Of Clinics",
        "highlight": "Medic specialist Chirurgie Estetica, Plastica si Reconstructiva si Medic primar ORL",
        "country": "Romania",
        "type": "foreign",
        "initials": "CS",
        "avatarBg": "from-indigo-600 via-purple-700 to-pink-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/constantin-stan-md-phd.png"
      },
      {
        "id": "spk-f7",
        "name": "Robert Francis Parkyn, MD",
        "role": "Clinical Associate Professor, Discipline of Surgery, since 2009;Adelaide University",
        "highlight": "Trung tâm Phẫu thuật Tuyến vú và Nội tiết Norwood",
        "country": "Úc",
        "type": "foreign",
        "initials": "RP",
        "avatarBg": "from-slate-700 via-slate-800 to-teal-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/robert-francis-parkyn-md-(1).png"
      },
      {
        "id": "spk-f8",
        "name": "Amin Kalaji, MD",
        "role": "Chair of the Membership Committee for the International Society of Regenerative Plastic Surgery (ISPRES)",
        "highlight": "Chủ tịch Nhóm Tổng thư ký ISAPS",
        "country": "Thụy Điển",
        "type": "foreign",
        "initials": "AK",
        "avatarBg": "from-orange-600 via-rose-700 to-amber-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/amin-kalaji-md.png"
      },
      {
        "id": "spk-f9",
        "name": "Prof. Mark W. Clemens, MD, MBA, FACS",
        "role": "Professor, Department of Plastic Surgery, The University of Texas MD Anderson Cancer Center, Houston",
        "highlight": "Chuyên gia đầu ngành về tái tạo tuyến vú và an toàn túi ngực (BIA-ALCL)",
        "country": "Mỹ",
        "type": "foreign",
        "initials": "MC",
        "avatarBg": "from-sky-600 via-indigo-750 to-slate-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/prof-mark-w-clemens-md-mba-facs.png"
      },
      {
        "id": "spk-f10",
        "name": "Assoc. Prof. Yuko, MD",
        "role": "Breast Center Director – Kameda Medical Hospital",
        "highlight": "Chuyên gia hàng đầu về phẫu thuật robot và cấy ghép mỡ tự thân tái tạo ngực",
        "country": "Nhật Bản",
        "type": "foreign",
        "initials": "YA",
        "avatarBg": "from-rose-500 via-pink-700 to-violet-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/assoc-prof-yuko-md.png"
      }
    ],
    "domestic": [
      {
        "id": "spk-d1",
        "name": "Major General, Assoc. Prof. Dr. Meritorious Physician Vu Ngoc Lam",
        "role": "Director of the Craniofacial and Plastic Surgery Center, Military Central Hospital 108",
        "highlight": "Giám đốc Trung tâm Phẫu thuật Sọ mặt và Tạo hình, Bệnh viện Trung ương Quân đội 108",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "VL",
        "avatarBg": "from-emerald-700 via-teal-850 to-indigo-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/assoc-prof-vu-ngoc-lam-md-phd.png"
      },
      {
        "id": "spk-d2",
        "name": "Assoc. Prof. Dr. Pham Hieu Liem",
        "role": "Head of Plastic Surgery Department, Pham Ngoc Thach University of Medicine",
        "highlight": "Trưởng Bộ môn Phẫu thuật Tạo hình Thẩm mỹ Đại học Y khoa Phạm Ngọc Thạch & Trưởng khoa PTTM Đại học Y Dược TP.HCM",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "PL",
        "avatarBg": "from-indigo-700 via-rose-800 to-amber-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/assoc-prof-pham-hieu-liem-phd.png"
      },
      {
        "id": "spk-d3",
        "name": "Assoc. Prof. Pham Van Phuc, PhD",
        "role": "Director of the Stem Cell Institute, Ho Chi Minh City National University",
        "highlight": "Viện trưởng Viện Tế bào gốc, Đại học Quốc gia TP.HCM",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "VP",
        "avatarBg": "from-cyan-700 via-sky-800 to-slate-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/assoc-prof-pham-van-phuc-phd.png"
      },
      {
        "id": "spk-d4",
        "name": "Assoc. Prof. Nguyen Dinh Tung, MD, PhD",
        "role": "Medical Director of EMCAS Plastic Surgery Hospital",
        "highlight": "Thư ký Quốc gia ISAPS Việt Nam",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "NT",
        "avatarBg": "from-amber-600 via-orange-850 to-stone-900",
        "photoUrl": "https://parsvn.com/uploads/speaker/assoc-prof-nguyen-dinh-tung-md-phd.png"
      },
      {
        "id": "spk-d5",
        "name": "Pham Le Buu Truc, MD, PhD",
        "role": "Ho Chi Minh City Biotechnology Center",
        "highlight": "Trung tâm Công nghệ Sinh học TP.HCM",
        "country": "Việt Nam",
        "type": "domestic",
        "initials": "PT",
        "avatarBg": "from-violet-750 via-purple-900 to-slate-950",
        "photoUrl": "https://parsvn.com/uploads/speaker/pham-le-buu-truc-md-phd.png"
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
