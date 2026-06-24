/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, MapPin, Users, Award, ShieldAlert, Cpu, CheckCircle, 
  FileText, ArrowRight, HeartHandshake, Clock, Search, Star, Bookmark, 
  Filter, X, Info, HelpCircle, ChevronLeft, ChevronRight, Menu, Map, 
  Building, Check, Sparkles, Send, Phone, Mail, Globe, ExternalLink
} from 'lucide-react';
import { store } from '../dataStore';
import { ConferenceSession } from '../types';
import PublicDelegateRegister from './PublicDelegateRegister';

interface PublicEventDetailsProps {
  onNavigate: (view: string) => void;
}

// Configuration for reporting rooms mapping to make interactive multi-track grid
const ROOMS_CONFIG = [
  {
    id: 'Hội trường 1',
    vietnameseName: 'Hội trường A',
    subtitle: 'Phẫu thuật thẩm mỹ vú & Tạo hình vóc dáng',
    colorClass: 'border-l-4 border-rose-500 bg-rose-500/5',
    textTag: 'text-rose-600',
    tagBg: 'bg-rose-50 text-rose-700'
  },
  {
    id: 'Hội trường 2',
    vietnameseName: 'Hội trường B',
    subtitle: 'Chấn thương sọ sập & Tạo hình sọ mặt',
    colorClass: 'border-l-4 border-indigo-500 bg-indigo-500/5',
    textTag: 'text-indigo-600',
    tagBg: 'bg-indigo-50 text-indigo-700'
  },
  {
    id: 'Hội trường 3',
    vietnameseName: 'Hội trường C',
    subtitle: 'Hài hòa hàm mặt & Phục hình nụ cười',
    colorClass: 'border-l-4 border-amber-500 bg-amber-500/5',
    textTag: 'text-amber-600',
    tagBg: 'bg-amber-50 text-amber-700'
  },
  {
    id: 'Hội trường 4',
    vietnameseName: 'Hội trường D',
    subtitle: 'Thẩm mỹ nội khoa & Chỉ sợi, Laser da liễu',
    colorClass: 'border-l-4 border-teal-500 bg-teal-500/5',
    textTag: 'text-teal-600',
    tagBg: 'bg-teal-50 text-teal-700'
  }
];

// Speakers lists extracted from the posters
const FOREIGN_SPEAKERS = [
  {
    name: 'Arturo Ramírez Montañana, MD, PhD',
    title: 'Arturo Ramírez Montañana, MD, PhD',
    role: 'President, International Society of Aesthetic Plastic Surgery (ISAPS)',
    highlight: 'Plastic, Aesthetic & Reconstructive Surgeon – Monterrey, Mexico',
    country: 'Mexico',
    initials: 'AR',
    avatarBg: 'from-amber-600 via-red-700 to-rose-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/arturo-ramirez-montanana-md-phd-(1).png'
  },
  {
    name: 'Prof. Kotaro Yoshimura, MD, PhD',
    title: 'Prof. Kotaro Yoshimura, MD, PhD',
    role: 'Chairman of Department of Plastic Surgery at Jichi Medical University, Japan',
    highlight: 'Trưởng khoa Phẫu thuật Tạo hình, Đại học Y khoa Jichi, Nhật Bản',
    country: 'Nhật Bản',
    initials: 'KY',
    avatarBg: 'from-teal-600 via-sky-700 to-indigo-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/prof-kotaro-yoshimura-md-phd-(1).png'
  },
  {
    name: 'Bertha Torres Gómez, MD, PhD',
    title: 'Bertha Torres Gómez, MD, PhD',
    role: 'Chair, National Secretary of ISAPS',
    highlight: 'Mexican Association of Plastic, Aesthetic, and Reconstructive Surgery (AMCPER)',
    country: 'Mexico',
    initials: 'BG',
    avatarBg: 'from-pink-600 via-rose-700 to-purple-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/bertha-torres-gomez-md-phd.png'
  },
  {
    name: 'Prof. Fabio Santanelli, MD',
    title: 'Prof. Fabio Santanelli, MD',
    role: 'Secretary General of the European Association of Plastic Surgeons',
    highlight: 'Lecturer at Sapienza University of Rome, Italy',
    country: 'Ý',
    initials: 'FS',
    avatarBg: 'from-emerald-600 via-teal-700 to-cyan-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/prof-fabio-santanelli-md-(1).png'
  },
  {
    name: 'C. Bob Basu, MD, MBA, MPH, FACS',
    title: 'C. Bob Basu, MD, MBA, MPH, FACS',
    role: 'President, American Society of Plastic Surgeons',
    highlight: 'Board-Certified Plastic Surgeon, American Board of Plastic Surgery',
    country: 'Mỹ',
    initials: 'BB',
    avatarBg: 'from-blue-600 via-indigo-700 to-slate-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/c-bob-basu-md-mba-mph-facs.png'
  },
  {
    name: 'Constantin Stan, MD, PhD',
    title: 'Constantin Stan, MD, PhD',
    role: 'Founder Of The Cronos Med Group Of Clinics',
    highlight: 'Medic specialist Chirurgie Estetica, Plastica si Reconstructiva si Medic primar ORL',
    country: 'Romania',
    initials: 'CS',
    avatarBg: 'from-indigo-600 via-purple-700 to-pink-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/constantin-stan-md-phd.png'
  },
  {
    name: 'Robert Francis Parkyn, MD',
    title: 'Robert Francis Parkyn, MD',
    role: 'Clinical Associate Professor, Discipline of Surgery, since 2009;Adelaide University',
    highlight: 'Trung tâm Phẫu thuật Tuyến vú và Nội tiết Norwood',
    country: 'Úc',
    initials: 'RP',
    avatarBg: 'from-slate-700 via-slate-800 to-teal-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/robert-francis-parkyn-md-(1).png'
  },
  {
    name: 'Amin Kalaji, MD',
    title: 'Amin Kalaji, MD',
    role: 'Chair of the Membership Committee for the International Society of Regenerative Plastic Surgery (ISPRES)',
    highlight: 'Chủ tịch Nhóm Tổng thư ký ISAPS',
    country: 'Thụy Điển',
    initials: 'AK',
    avatarBg: 'from-orange-600 via-rose-700 to-amber-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/amin-kalaji-md.png'
  },
  {
    name: 'Prof. Mark W. Clemens, MD, MBA, FACS',
    title: 'Prof. Mark W. Clemens, MD, MBA, FACS',
    role: 'Professor, Department of Plastic Surgery, The University of Texas MD Anderson Cancer Center, Houston',
    highlight: 'Chuyên gia đầu ngành về tái tạo tuyến vú và an toàn túi ngực (BIA-ALCL)',
    country: 'Mỹ',
    initials: 'MC',
    avatarBg: 'from-sky-600 via-indigo-750 to-slate-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/prof-mark-w-clemens-md-mba-facs.png'
  },
  {
    name: 'Assoc. Prof. Yuko, MD',
    title: 'Assoc. Prof. Yuko, MD',
    role: 'Breast Center Director – Kameda Medical Hospital',
    highlight: 'Chuyên gia hàng đầu về phẫu thuật robot và cấy ghép mỡ tự thân tái tạo ngực',
    country: 'Nhật Bản',
    initials: 'YA',
    avatarBg: 'from-rose-500 via-pink-700 to-violet-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/assoc-prof-yuko-md.png'
  }
];

const DOMESTIC_SPEAKERS = [
  {
    name: 'Major General, Assoc. Prof. Dr. Meritorious Physician Vu Ngoc Lam',
    title: 'Major General, Assoc. Prof. Dr. Meritorious Physician Vu Ngoc Lam',
    role: 'Director of the Craniofacial and Plastic Surgery Center, Military Central Hospital 108',
    highlight: 'Giám đốc Trung tâm Phẫu thuật Sọ mặt và Tạo hình, Bệnh viện Trung ương Quân đội 108',
    country: 'Việt Nam',
    initials: 'VL',
    avatarBg: 'from-emerald-700 via-teal-850 to-indigo-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/assoc-prof-vu-ngoc-lam-md-phd.png'
  },
  {
    name: 'Assoc. Prof. Dr. Pham Hieu Liem',
    title: 'Assoc. Prof. Dr. Pham Hieu Liem',
    role: 'Head of Plastic Surgery Department, Pham Ngoc Thach University of Medicine',
    highlight: 'Trưởng Bộ môn Phẫu thuật Tạo hình Thẩm mỹ Đại học Y khoa Phạm Ngọc Thạch & Trưởng khoa PTTM Đại học Y Dược TP.HCM',
    country: 'Việt Nam',
    initials: 'PL',
    avatarBg: 'from-indigo-700 via-rose-800 to-amber-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/assoc-prof-pham-hieu-liem-phd.png'
  },
  {
    name: 'Assoc. Prof. Pham Van Phuc, PhD',
    title: 'Assoc. Prof. Pham Van Phuc, PhD',
    role: 'Director of the Stem Cell Institute, Ho Chi Minh City National University',
    highlight: 'Viện trưởng Viện Tế bào gốc, Đại học Quốc gia TP.HCM',
    country: 'Việt Nam',
    initials: 'VP',
    avatarBg: 'from-cyan-700 via-sky-800 to-slate-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/assoc-prof-pham-van-phuc-phd.png'
  },
  {
    name: 'Assoc. Prof. Nguyen Dinh Tung, MD, PhD',
    title: 'Assoc. Prof. Nguyen Dinh Tung, MD, PhD',
    role: 'Medical Director of EMCAS Plastic Surgery Hospital',
    highlight: 'Thư ký Quốc gia ISAPS Việt Nam',
    country: 'Việt Nam',
    initials: 'NT',
    avatarBg: 'from-amber-600 via-orange-850 to-stone-900',
    photoUrl: 'https://parsvn.com/uploads/speaker/assoc-prof-nguyen-dinh-tung-md-phd.png'
  },
  {
    name: 'Pham Le Buu Truc, MD, PhD',
    title: 'Pham Le Buu Truc, MD, PhD',
    role: 'Ho Chi Minh City Biotechnology Center',
    highlight: 'Trung tâm Công nghệ Sinh học TP.HCM',
    country: 'Việt Nam',
    initials: 'PT',
    avatarBg: 'from-violet-750 via-purple-900 to-slate-950',
    photoUrl: 'https://parsvn.com/uploads/speaker/pham-le-buu-truc-md-phd.png'
  }
];


// Helper to get professional speaker avatar SVGs
function getSpeakerAvatar(name: string) {
  const isFemale = name.includes('Bertha') || name.includes('Yuko') || name.includes('ASANO') || name.includes('Bửu Trúc');
  if (isFemale) {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#fdf2f8"/>
        <circle cx="32" cy="25" r="11" fill="#fdd1e8"/>
        <path d="M18 25c0-9 7-11 14-11s14 2 14 11c0 8-2 12-4 12s-3-5-10-5-8 5-10 5-4-4-4-12z" fill="#475569"/>
        <circle cx="28" cy="24" r="1.5" fill="#1e293b"/>
        <circle cx="36" cy="24" r="1.5" fill="#1e293b"/>
        <path d="M29 30c2 1.2 4 1.2 6 0" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <path d="M16 49c0-9 8-11 16-11s16 2 16 11v15H16V49z" fill="#0891b2"/>
        <path d="M27 38l5 12 5-12" fill="none" stroke="#f8fafc" strokeWidth="2"/>
        <path d="M16 49c2-5 6-7 10-7M48 49c-2-5-6-7-10-7" stroke="#f8fafc" strokeWidth="3" fill="none"/>
        <path d="M25 39c0 7 14 7 14 0" fill="none" stroke="#64748b" strokeWidth="2"/>
        <circle cx="32" cy="45" r="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5"/>
      </svg>
    );
  } else {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#f0f9ff"/>
        <circle cx="32" cy="24" r="12" fill="#ffedd5"/>
        <path d="M20 24c0-8 6-10 12-10s12 2 12 10c0 2-2 3-4 3s-4-2-8-2-4 2-8 2-4-1-4-3z" fill="#334155"/>
        <circle cx="28" cy="23" r="1.5" fill="#1e293b"/>
        <circle cx="36" cy="23" r="1.5" fill="#1e293b"/>
        <path d="M29 29c2 1.5 4 1.5 6 0" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M16 48c0-10 8-12 16-12s16 2 16 12v16H16V48z" fill="#0d9488"/>
        <path d="M26 36l6 14 6-14" fill="none" stroke="#f8fafc" strokeWidth="2"/>
        <path d="M16 48c2-6 6-8 10-8M48 48c-2-6-6-8-10-8" stroke="#f8fafc" strokeWidth="3" fill="none"/>
        <path d="M24 38c0 8 16 8 16 0" fill="none" stroke="#64748b" strokeWidth="2"/>
        <circle cx="32" cy="44" r="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5"/>
      </svg>
    );
  }
}

// Helper to get beautiful custom country flags
function getCountryFlag(country: string) {
  const norm = country.trim().toLowerCase();
  if (norm.includes('viet') || norm.includes('việt')) {
    return (
      <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="3" height="2" fill="#da251d"/>
        <polygon points="1.5,0.4 1.62,0.78 2.01,0.78 1.7,1.02 1.82,1.4 1.5,1.16 1.18,1.4 1.3,1.02 0.99,0.78 1.38,0.78" fill="#ffff00"/>
      </svg>
    );
  }
  if (norm.includes('nhật') || norm.includes('japan')) {
    return (
      <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="3" height="2" fill="#ffffff"/>
        <circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/>
      </svg>
    );
  }
  if (norm.includes('mỹ') || norm.includes('usa') || norm.includes('america')) {
    return (
      <svg viewBox="0 0 7410 3900" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="7410" height="3900" fill="#b22234"/>
        <path d="M0,300H7410M0,900H7410M0,1500H7410M0,2100H7410M0,2700H7410M0,3300H7410" stroke="#fff" strokeWidth="300"/>
        <rect width="2964" height="2100" fill="#3c3b6e"/>
        <circle cx="1482" cy="1050" r="400" fill="#fff" opacity="0.8"/>
      </svg>
    );
  }
  if (norm.includes('mexico')) {
    return (
      <svg viewBox="0 0 7 4" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="2.33" height="4" fill="#006847"/>
        <rect x="2.33" width="2.33" height="4" fill="#ffffff"/>
        <rect x="4.66" width="2.34" height="4" fill="#c8102e"/>
        <circle cx="3.5" cy="2" r="0.4" fill="#7d5d2b"/>
      </svg>
    );
  }
  if (norm.includes('ý') || norm.includes('italy')) {
    return (
      <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="1" height="2" fill="#009246"/>
        <rect x="1" width="1" height="2" fill="#ffffff"/>
        <rect x="2" width="1" height="2" fill="#ce2b37"/>
      </svg>
    );
  }
  if (norm.includes('romania')) {
    return (
      <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="1" height="2" fill="#002b7f"/>
        <rect x="1" width="1" height="2" fill="#fcd116"/>
        <rect x="2" width="1" height="2" fill="#ce1126"/>
      </svg>
    );
  }
  if (norm.includes('úc') || norm.includes('australia')) {
    return (
      <svg viewBox="0 0 2 1" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="2" height="1" fill="#00003f"/>
        <path d="M0,0 L2,1 M0,1 L2,0" stroke="#fff" strokeWidth="0.15"/>
        <path d="M0,0 L2,1 M0,1 L2,0" stroke="#cc002c" strokeWidth="0.08"/>
        <rect x="0.9" width="0.2" height="1" fill="#fff"/>
        <rect y="0.4" width="2" height="0.2" fill="#fff"/>
        <rect x="0.95" width="0.1" height="1" fill="#cc002c"/>
        <rect y="0.45" width="2" height="0.1" fill="#cc002c"/>
        <circle cx="1.5" cy="0.75" r="0.12" fill="#fff" opacity="0.7"/>
      </svg>
    );
  }
  if (norm.includes('thụy điển') || norm.includes('sweden')) {
    return (
      <svg viewBox="0 0 16 10" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="10" fill="#006aa7"/>
        <rect x="5" width="2" height="10" fill="#fecc00"/>
        <rect y="4" width="16" height="2" fill="#fecc00"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-xs border border-slate-200 shrink-0 shadow-xs" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#94a3b8"/>
    </svg>
  );
}

// Helper to provide realistic rich academic abstracts and bios
function getSessionEnrichment(session: ConferenceSession) {
  const title = session.title;
  const speakerName = session.speakerName;
  const speakerTitle = session.speakerTitle;

  // Check if session has a registered speaker in the store first
  const registeredSpeakers = store.getSpeakers();
  const matched = registeredSpeakers.find(s => 
    s.fullName.toLowerCase() === speakerName.toLowerCase() ||
    title.toLowerCase().includes(s.presentationTitle.toLowerCase())
  );

  if (matched) {
    return {
      abstract: matched.abstractText || `Đề tài tóm tắt: Trình bày nghiên cứu chuyên đề lâm sàng về "${matched.presentationTitle}". Nội dung hướng dẫn cải tiến kỹ thuật, đánh giá phản hồi trên tập hợp mẫu bệnh nhân thực tế và đề xuất chuẩn hóa quy chuẩn y khoa tối ưu an toàn.`,
      bio: matched.bio || `Báo cáo viên chuyên trách có thâm niên công tác dày dạn, là tác giả của nhiều công bố khoa học uy tín trong ngành.`
    };
  }

  // Pre-configured prominent examples
  if (session.id === 'SES-102') {
    return {
      abstract: `ĐẶT VẤN ĐỀ: Co thắt tụ máu sau căng da mặt là biến chứng đáng ngại ảnh hưởng thẩm mỹ và thần kinh mặt. Báo cáo đánh giá quy trình quản lý tụ máu sớm kết hợp cắt bỏ chọn lọc một phần tuyến nước bọt dưới hàm phì đại.\n\nPHƯƠNG PHÁP: Nghiên cứu trên 70 ca căng da mặt sâu có can thiệp bóc tách sâu khoang SMAS và điều chỉnh tuyến dưới hàm dư thừa.\n\nKẾT QUẢ: Tỷ lệ tụ máu giảm đáng kể nhờ kiểm soát huyết áp động mạch tỉ mỉ. Kết quả đường viền hàm thon gọn nâng cao tính thẩm mỹ hài lòng của bệnh nhân.\n\nKẾT LUẬN: Bóc tách chọn lọc và cắt bỏ tuyến nước bọt dưới hàm là phương án an toàn giúp định hình hàm mặt tối ưu khi kết hợp SMAS Facelift.`,
      bio: `TS.BS. Arturo Ramírez Montañana là chuyên gia phẫu thuật thẩm mỹ và tạo hình nổi tiếng người Mexico. Ông hiện là Chủ tịch Hiệp hội Phẫu thuật Tạo hình Thẩm mỹ Quốc tế (ISAPS) với hơn 30 năm đóng góp y học lâm sàng.`
    };
  }

  // General fallbacks based on session topic keywords
  const lowerTitle = title.toLowerCase();
  let abstract = '';
  let bio = '';

  if (lowerTitle.includes('khai mạc') || lowerTitle.includes('bế mạc') || lowerTitle.includes('đón khách')) {
    abstract = `Nội dung tổng luận điều hành: Đón tiếp đại biểu và khách mời chính thức. Phát biểu khai mạc Hội nghị Khoa học Quốc tế PARS 2026 bởi Ban tổ chức - Bệnh viện Thẩm mỹ EMCAS. Quán triệt kịch bản y học, xu hướng học thuật thẩm mỹ và phẫu thuật tái sinh chuẩn 2026.\n\nMục tiêu: Định hướng chung cho toàn bộ các bác sĩ hội viên về sự phối hợp giữa tạo hình thẩm mỹ chuyên sâu cùng tôn trọng y đức và an toàn tối đa cho khách hàng.`;
    bio = `Ban Tổ Chức Hội Nghị và Hội đồng Khoa học Bệnh viện Thẩm mỹ EMCAS điều phối tiếp rước chuyên gia.`;
  } else if (lowerTitle.includes('ngực') || lowerTitle.includes('vú') || lowerTitle.includes('túi độn')) {
    abstract = `ĐẶT VẤN ĐỀ: Nâng ngực kết hợp cấy ghép mỡ tự thân (Hybrid Breast Augmentation) và phẫu thuật nội soi robot đang trở thành xu hướng tối ưu hóa thẩm mỹ. Nghiên cứu tập trung phân tích chuẩn an toàn ngăn ngừa biến chứng xơ co thắt và BIA-ALCL.\n\nPHƯƠNG PHÁP: Đánh giá tiến cứu lâm sàng đa trung tâm trên dải bệnh nhân thật trải qua phẫu thuật nâng ngực bảo tồn mô.\n\nKẾT QUẢ: Khả năng tương thích sinh học cao, sẹo rạch nhỏ thẩm mỹ giấu kín, tuyến vú mềm mại tự nhiên và ngăn ngừa biến chứng bao xơ hiệu quả.\n\nKẾT LUẬN: Ứng dụng kỹ thuật bóc tách tối thiểu xâm lấn phối hợp cấy mỡ (cal) mang lại hiệu quả thẩm mỹ vượt bậc và an toàn lâu dài.`;
    bio = `Báo cáo viên chuyên đề: Chuyên gia hàng đầu về phẫu thuật tuyến vú và tái tạo vóc dáng, diễn giả danh dự tại các hội nghị thẩm mỹ lớn.`;
  } else {
    abstract = `TÓM TẮT ĐỀ TÀI (ABSTRACT):\nĐặt vấn đề: Nghiên cứu nhằm tổng kết các bằng chứng lâm sàng tiên phong trong khuôn khổ chủ đề khoa học tạo hình thẩm mỹ và y học tái sinh PARS 2026. Giải quyết thách thức lâm sàng, nâng chuẩn chất lượng đào tạo liên tục CME.\n\nPhương pháp: Tiến hành phân tích tiến cứu kết hợp kỹ thuật can thiệp ít xâm lấn và theo dõi dọc sau điều trị.\n\nKết quả: Rút ngắn thời gian dưỡng thương, bảo toàn sự phân bố mô tự nhiên và nâng tỷ lệ thẩm mỹ hài lòng toàn diện.\n\nKết luận: Phương án cải tiến đề xuất mang tính đột phá, xứng đáng tích hợp sâu rộng vào cẩm nang chỉ định điều trị thực tế.`;
    bio = `Báo cáo viên chuyên đề: ${speakerName} (${speakerTitle}). Nhà khoa học hoạt động nhiệt thành, có đóng góp hữu ích cho hội đồng khoa học y tế.`;
  }

  return { abstract, bio };
}

export default function PublicEventDetails({ onNavigate }: PublicEventDetailsProps) {
  const sessions = store.getSessions();
  const sponsors = store.getSponsors();
  const packages = store.getPackages().filter(p => p.isActive);
  const businessConfig = store.getBusinessConfig();
  const sections = businessConfig.landingPageSections || {};
  
  // Hero section dynamic elements with fallbacks
  const heroTag = sections.hero?.tag || "HỘI NGHỊ KHOA HỌC QUỐC TẾ";
  const heroTitle = sections.hero?.title || "PARS";
  const heroYear = sections.hero?.year || "2026";
  const heroThemeEn = sections.hero?.themeEn || "PLASTIC & AESTHETIC REGENERATIVE SURGERY";
  const heroThemeVi = sections.hero?.themeVi || "Phẫu thuật Tạo hình Thẩm mỹ & Y học Tái sinh";
  const heroDate = sections.hero?.date || "12 - 13 THÁNG 09, 2026";
  const heroLocation = sections.hero?.location || "MELIÀ HANOI, HÀ NỘI, VIỆT NAM";
  const heroBtnRegisterText = sections.hero?.btnRegisterText || "Đăng ký ngay";
  const heroBtnProgramText = sections.hero?.btnProgramText || "Chương trình hội nghị";

  // Intro section dynamic elements with fallbacks
  const introTitle = sections.intro?.title || "GIỚI THIỆU HỘI NGHỊ";
  const introText1 = sections.intro?.text1 || "Hội nghị Khoa học Quốc tế PARS 2026 do Bệnh viện Thẩm mỹ EMCAS đăng cai tổ chức là sự kiện y khoa đỉnh cao quy tụ dàn chuyên gia thẩm mỹ uy tín hàng đầu toàn cầu (ISAPS, ASPS, EURAPS) và Việt Nam.";
  const introText2 = sections.intro?.text2 || "Hội nghị tập trung cập nhật các tiến bộ lâm sàng vượt bậc, chuyển giao công nghệ phẫu thuật tạo hình vóc dáng nâng cao, trẻ hóa vùng kín, nâng mũi sụn sườn cấu trúc và kiểm soát toàn diện rủi ro túi ngực (BIA-ALCL).";
  const introHighlight1Title = sections.intro?.highlight1Title || "Đơn vị chủ trì uy tín";
  const introHighlight1Desc = sections.intro?.highlight1Desc || "Bệnh viện Thẩm mỹ EMCAS sở hữu đầy đủ thẩm quyền chuyên môn và chất lượng dịch vụ chuẩn quốc tế.";
  const introHighlight2Title = sections.intro?.highlight2Title || "Chứng chỉ CME 4.5h";
  const introHighlight2Desc = sections.intro?.highlight2Desc || "Cấp chứng nhận đào tạo liên tục y khoa theo quy định của Bộ Y tế, do Bác sĩ Phạm Xuân Khiêm ký duyệt.";
  const introHighlight3Title = sections.intro?.highlight3Title || "Giao lưu chuyên gia đa quốc gia";
  const introHighlight3Desc = sections.intro?.highlight3Desc || "Cơ hội đối thoại trực tiếp và học tập kinh nghiệm thực chiến từ các Giáo sư hàng đầu Hoa Kỳ, Nhật Bản, Thụy Điển, Mexico.";

  // Resolve configured images or fall back to defaults
  const logoUrl = businessConfig.landingLogoUrl || '/media__1782106316692.png';
  const landmarksUrl = businessConfig.landingLandmarksUrl || '/media__1782198647752.png';

  // Speaker lists: read from DB config, fallback to hardcoded arrays
  const configSpeakers = businessConfig.landingPageSections?.speakers;
  const foreignSpeakers = (configSpeakers?.foreign && configSpeakers.foreign.length > 0)
    ? configSpeakers.foreign
    : FOREIGN_SPEAKERS;
  const domesticSpeakers = (configSpeakers?.domestic && configSpeakers.domestic.length > 0)
    ? configSpeakers.domestic
    : DOMESTIC_SPEAKERS;

  // Section background colors from config (fallback to default CSS class colors)
  const bg = businessConfig.landingPageSections?.sectionBg || {};
  const sectionStyle = {
    intro:            bg.intro            ? { backgroundColor: bg.intro }            : undefined,
    speakersForeign:  bg.speakersForeign  ? { backgroundColor: bg.speakersForeign }  : undefined,
    speakersDomestic: bg.speakersDomestic ? { backgroundColor: bg.speakersDomestic } : undefined,
    register:         bg.register         ? { backgroundColor: bg.register }          : undefined,
    sponsors:         bg.sponsors         ? { backgroundColor: bg.sponsors }           : undefined,
    location:         bg.location         ? { backgroundColor: bg.location }           : undefined,
  };
  // Interactive schedule states
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-12'); // Default to Day 1
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('All');
  const [onlyMyAgenda, setOnlyMyAgenda] = useState<boolean>(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<ConferenceSession | null>(null);
  const [modalTab, setModalTab] = useState<'abstract' | 'bio'>('abstract');

  // Header dropdown states
  const [showTicketDropdown, setShowTicketDropdown] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const ticketDropdownRef = useRef<HTMLDivElement>(null);

  // Close ticket dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ticketDropdownRef.current && !ticketDropdownRef.current.contains(event.target as Node)) {
        setShowTicketDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [personalAgenda, setPersonalAgenda] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pars2026_my_agenda') || '[]');
    } catch {
      return [];
    }
  });

  const handleToggleBookmark = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (personalAgenda.includes(sessionId)) {
      updated = personalAgenda.filter(id => id !== sessionId);
    } else {
      updated = [...personalAgenda, sessionId];
    }
    setPersonalAgenda(updated);
    localStorage.setItem('pars2026_my_agenda', JSON.stringify(updated));
  };

  // Scroll Slider logic
  const foreignSliderRef = useRef<HTMLDivElement>(null);
  const domesticSliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Extract unique tracks for filters
  const uniqueTracks = ['All', ...Array.from(new Set(sessions.map(s => s.track))).filter(Boolean)];



  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans scroll-smooth">
      
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-20">
          
          {/* Logo Icon and Text */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src={logoUrl} 
              alt="PARS Logo" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - Centered */}
          <nav className="hidden lg:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('intro')} 
              className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent uppercase tracking-wider"
            >
              INTRODUCE
            </button>
            
            {/* PARS Dropdown Menu */}
            <div className="relative group">
              <button 
                className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent flex items-center uppercase tracking-wider"
              >
                PARS
                <svg className="w-3 h-3 ml-1 opacity-70 transition-transform group-hover:rotate-180 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50">
                <button 
                  onClick={() => scrollToSection('program')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Chương trình khoa học
                </button>
                <button 
                  onClick={() => scrollToSection('speakers')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Báo cáo viên nước ngoài
                </button>
                <button 
                  onClick={() => scrollToSection('speakers')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Báo cáo viên trong nước
                </button>
              </div>
            </div>

            {/* NEWS Dropdown Menu */}
            <div className="relative group">
              <button 
                className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent flex items-center uppercase tracking-wider"
              >
                NEWS
                <svg className="w-3 h-3 ml-1 opacity-70 transition-transform group-hover:rotate-180 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50">
                <button 
                  onClick={() => scrollToSection('program')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Tin tức sự kiện
                </button>
                <button 
                  onClick={() => scrollToSection('program')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  Ấn phẩm y khoa
                </button>
              </div>
            </div>

            <button 
              onClick={() => scrollToSection('register')} 
              className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent uppercase tracking-wider"
            >
              REGISTER
            </button>
            <button 
              onClick={() => scrollToSection('sponsors')} 
              className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent uppercase tracking-wider"
            >
              SPONSORS
            </button>
            <button 
              onClick={() => scrollToSection('footer')} 
              className="text-xs md:text-sm font-extrabold text-[#4E2A14] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent uppercase tracking-wider"
            >
              CONTACT US
            </button>
          </nav>

          {/* Right Section: Flags & Action Button */}
          <div className="flex items-center gap-4">
            
            {/* Language Flags Selector */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                title="English" 
                className="focus:outline-none transition-transform hover:scale-110 cursor-pointer border-none bg-transparent p-0 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" className="w-6 h-4 rounded-xs shadow-xs border border-slate-200">
                  <rect width="7410" height="3900" fill="#b22234"/>
                  <path d="M0,300H7410M0,900H7410M0,1500H7410M0,2100H7410M0,2700H7410M0,3300H7410" stroke="#fff" strokeWidth="300"/>
                  <rect width="2964" height="2100" fill="#3c3b6e"/>
                  <g fill="#fff">
                    <circle cx="400" cy="300" r="80" />
                    <circle cx="900" cy="300" r="80" />
                    <circle cx="1400" cy="300" r="80" />
                    <circle cx="1900" cy="300" r="80" />
                    <circle cx="2400" cy="300" r="80" />
                    <circle cx="650" cy="600" r="80" />
                    <circle cx="1150" cy="600" r="80" />
                    <circle cx="1650" cy="600" r="80" />
                    <circle cx="2150" cy="600" r="80" />
                    <circle cx="400" cy="900" r="80" />
                    <circle cx="900" cy="900" r="80" />
                    <circle cx="1400" cy="900" r="80" />
                    <circle cx="1900" cy="900" r="80" />
                    <circle cx="2400" cy="900" r="80" />
                    <circle cx="650" cy="1200" r="80" />
                    <circle cx="1150" cy="1200" r="80" />
                    <circle cx="1650" cy="1200" r="80" />
                    <circle cx="2150" cy="1200" r="80" />
                    <circle cx="400" cy="1500" r="80" />
                    <circle cx="900" cy="1500" r="80" />
                    <circle cx="1400" cy="1500" r="80" />
                    <circle cx="1900" cy="1500" r="80" />
                    <circle cx="2400" cy="1500" r="80" />
                    <circle cx="650" cy="1800" r="80" />
                    <circle cx="1150" cy="1800" r="80" />
                    <circle cx="1650" cy="1800" r="80" />
                    <circle cx="2150" cy="1800" r="80" />
                  </g>
                </svg>
              </button>
              <button 
                title="Tiếng Việt" 
                className="focus:outline-none transition-transform hover:scale-110 cursor-pointer border-none bg-transparent p-0 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="w-6 h-4 rounded-xs shadow-xs border border-slate-200">
                  <rect width="3" height="2" fill="#da251d"/>
                  <polygon points="1.5,0.4 1.62,0.78 2.01,0.78 1.7,1.02 1.82,1.4 1.5,1.16 1.18,1.4 1.3,1.02 0.99,0.78 1.38,0.78" fill="#ffff00"/>
                </svg>
              </button>
            </div>

            {/* Red outlined action button (Tra cứu vé / Đăng nhập) */}
            <div className="relative" ref={ticketDropdownRef}>
              <button
                onClick={() => setShowTicketDropdown(!showTicketDropdown)}
                className="px-4 py-2.5 rounded-full border border-red-550 hover:bg-red-500/5 text-red-600 font-black text-[10px] md:text-[11px] transition-all tracking-wider uppercase cursor-pointer flex items-center gap-1.5"
              >
                TRA CỨU VÉ / ĐĂNG NHẬP
                <svg className={`w-3.5 h-3.5 transition-transform ${showTicketDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTicketDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowTicketDropdown(false);
                      onNavigate('check-registration');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    Tra cứu vé đại biểu
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setShowTicketDropdown(false);
                      onNavigate('overview');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Đăng nhập Ban tổ chức
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-none cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
            <div className="w-72 bg-white h-full p-6 shadow-2xl flex flex-col justify-between animate-slide-in">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">MENU ĐIỀU HƯỚNG</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('intro'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    INTRODUCE
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('program'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    PROGRAMS (PARS)
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('speakers'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    SPEAKERS
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('register'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    REGISTER
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('sponsors'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    SPONSORS
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); scrollToSection('footer'); }} 
                    className="w-full text-left text-sm font-extrabold text-slate-800 py-2 hover:text-teal-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    CONTACT US
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                {/* Flags in Mobile */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Ngôn ngữ:</span>
                  <button className="w-7 h-5 rounded border border-slate-200 flex items-center justify-center p-0 cursor-pointer bg-transparent">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="w-full h-full">
                      <rect width="3" height="2" fill="#da251d"/>
                      <polygon points="1.5,0.4 1.62,0.78 2.01,0.78 1.7,1.02 1.82,1.4 1.5,1.16 1.18,1.4 1.3,1.02 0.99,0.78 1.38,0.78" fill="#ffff00"/>
                    </svg>
                  </button>
                  <button className="w-7 h-5 rounded border border-slate-200 flex items-center justify-center p-0 cursor-pointer bg-transparent">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" className="w-full h-full">
                      <rect width="7410" height="3900" fill="#b22234"/>
                      <path d="M0,300H7410M0,900H7410M0,1500H7410M0,2100H7410M0,2700H7410M0,3300H7410" stroke="#fff" strokeWidth="300"/>
                      <rect width="2964" height="2100" fill="#3c3b6e"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

            {/* 2. WIDESCREEN HERO BANNER */}
      <section 
        className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[650px] bg-cover bg-center flex items-center border-b border-slate-200"
        style={{ backgroundImage: `url(${landmarksUrl})` }}
      >
        {/* Dark overlay for rich contrast and legibility */}
        <div className="absolute inset-0 bg-slate-950/75 z-10" />
        
        {/* Ambient lighting/glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-10" />

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-16 py-16 md:py-24 w-full text-white flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
          
          {/* Conference name and tag */}
          <div className="flex flex-col items-center space-y-1">
            <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-amber-500/20 border-2 border-amber-400/60 text-amber-300 text-sm md:text-base font-black uppercase tracking-[0.25em] mb-3 shadow-lg shadow-amber-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
              {heroTag}
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-serif tracking-wide leading-none drop-shadow-xl flex items-baseline justify-center">
              <span className="text-white">{heroTitle}</span>
              <span className="text-[#C59B27] ml-3 font-sans bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent">{heroYear}</span>
            </h1>
          </div>

          {/* Theme / Subject */}
          <div className="max-w-4xl space-y-2 mx-auto">
            <p className="text-base md:text-2xl lg:text-3xl font-sans font-bold tracking-wider text-slate-100 uppercase leading-snug drop-shadow-md">
              {heroThemeEn}
            </p>
            <p className="text-xs md:text-base lg:text-lg font-sans font-semibold text-slate-300 tracking-wide uppercase opacity-90">
              {heroThemeVi}
            </p>
          </div>

          {/* Actions: 2 Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 z-30">
            <button
              onClick={() => scrollToSection('register')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs md:text-sm uppercase tracking-widest shadow-lg hover:shadow-red-600/30 hover:scale-102 transition-all transform duration-200 flex items-center gap-2.5 cursor-pointer border-none"
            >
              <span>{heroBtnRegisterText}</span>
              <ArrowRight className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>
            
            <button
              onClick={() => scrollToSection('program')}
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 text-white font-extrabold text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-102 transform duration-200 flex items-center gap-2.5 cursor-pointer backdrop-blur-md"
            >
              <Calendar className="w-4 h-4 md:w-4.5 md:h-4.5 text-amber-400" />
              <span>{heroBtnProgramText}</span>
            </button>
          </div>

          {/* Date + Location Info Badge - Centered at the bottom */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-white/10 w-full max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs md:text-sm font-extrabold tracking-wide shadow-md select-none">
              <Calendar className="w-4.5 h-4.5 text-amber-400" />
              <span>{heroDate}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs md:text-sm font-extrabold tracking-wide shadow-md select-none">
              <MapPin className="w-4.5 h-4.5 text-rose-400" />
              <span>{heroLocation}</span>
            </div>
          </div>

        </div>
      </section>


      {/* 3. EVENT INFO & 4 BLOCKS SECTION */}
      <section id="intro" className="py-16 md:py-24 scroll-mt-20" style={sectionStyle.intro}>
        <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Left Column: Brief Summary */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
            <div className="w-12 h-1 bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full" />
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              {introTitle}
            </h3>
            <p className="text-slate-650 leading-relaxed text-sm md:text-base">
              {introText1}
            </p>
            <p className="text-slate-650 leading-relaxed text-sm md:text-base">
              {introText2}
            </p>

            {/* Bullet Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex gap-3 items-start">
                <CheckCircle className="text-teal-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-850 text-xs uppercase block tracking-wider">{introHighlight1Title}</span>
                  <p className="text-xs text-slate-500">{introHighlight1Desc}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle className="text-teal-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-850 text-xs uppercase block tracking-wider">{introHighlight2Title}</span>
                  <p className="text-xs text-slate-500">{introHighlight2Desc}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle className="text-teal-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-850 text-xs uppercase block tracking-wider">{introHighlight3Title}</span>
                  <p className="text-xs text-slate-500">{introHighlight3Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Blocks */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Block 1: Đăng ký */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-500/20">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  01
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Đăng ký đại biểu</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lệ phí tham dự 1.000.000 vnđ (bao gồm ăn trưa). Add-on CME: 350.000 vnđ. Gala Dinner: 500.000 vnđ. Cổng đăng ký tự động cấp QR code check-in nhanh.
                </p>
              </div>
              <button 
                onClick={() => scrollToSection('register')} 
                className="mt-6 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer w-fit group-hover:translate-x-1 transition-transform border-none bg-transparent"
              >
                Đăng ký trực tiếp
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block 2: Báo cáo viên */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-500/20">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  02
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Dàn báo cáo viên</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Quy tụ 17+ Giáo sư, Tiến sĩ, Bác sĩ danh tiếng quốc tế (ISAPS, ASPS, EURAPS) và Việt Nam trình bày các đề tài nghiên cứu lâm sàng xuất sắc chuẩn CME.
                </p>
              </div>
              <button 
                onClick={() => scrollToSection('speakers')} 
                className="mt-6 text-xs font-bold text-indigo-650 hover:text-indigo-750 flex items-center gap-1 cursor-pointer w-fit group-hover:translate-x-1 transition-transform border-none bg-transparent"
              >
                Xem danh sách diễn giả
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block 3: Chương trình */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-500/20">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-55 text-amber-600 flex items-center justify-center font-bold">
                  03
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Chương trình khoa học</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lịch trình 2 ngày: Ngày 1 (12/09) khai mạc, báo cáo khoa học đa phòng, teabreak & Gala Dinner. Ngày 2 (13/09) chuyên đề đặc biệt, thảo luận bàn tròn & bế mạc.
                </p>
              </div>
              <button 
                onClick={() => scrollToSection('program')} 
                className="mt-6 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer w-fit group-hover:translate-x-1 transition-transform border-none bg-transparent"
              >
                Khám phá timeline nghị sự
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block 4: Địa điểm */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-500/20">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  04
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Địa điểm cao cấp</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tổ chức trang trọng tại Khách sạn Meliá Hà Nội – Số 44B Lý Thường Kiệt, Hoàn Kiếm, Hà Nội. Phòng hội nghị lớn hiện đại bậc nhất Thủ đô.
                </p>
              </div>
              <button 
                onClick={() => scrollToSection('location')} 
                className="mt-6 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer w-fit group-hover:translate-x-1 transition-transform border-none bg-transparent"
              >
                Chỉ dẫn đường đi
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
        </div>
      </section>

      {/* 4. FOREIGN SPEAKERS CAROUSEL */}
      <section id="speakers" className="py-16 md:py-24 bg-slate-900 text-white scroll-mt-20" style={sectionStyle.speakersForeign}>
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-teal-400 text-xs font-extrabold tracking-widest uppercase font-mono block mb-2">INTERNATIONAL PRESENTERS</span>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
                BÁO CÁO VIÊN NƯỚC NGOÀI
              </h2>
            </div>
            
            {/* Slider Controls */}
            <div className="flex gap-2.5">
              <button 
                onClick={() => scrollSlider(foreignSliderRef, 'left')} 
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Slide left"
              >
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
              <button 
                onClick={() => scrollSlider(foreignSliderRef, 'right')} 
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Slide right"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Horizontal Slider */}
          <div 
            ref={foreignSliderRef}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            {foreignSpeakers.map((spk, idx) => (
              <div 
                key={idx} 
                className="w-[290px] md:w-[330px] bg-white/5 border border-white/10 rounded-3xl p-5 shrink-0 snap-start flex flex-col hover:border-teal-500/40 hover:bg-white/10 transition-all group animate-fade-in text-center"
              >
                <div className="space-y-3 flex flex-col items-center">
                  {/* Speaker Avatar - photo or SVG fallback */}
                  <div className="w-28 h-28 md:w-32 h-32 rounded-full border-2 border-teal-500/30 overflow-hidden shrink-0 bg-slate-800 shadow-lg group-hover:scale-105 transition-transform duration-200">
                    {spk.photoUrl
                      ? <img src={spk.photoUrl} alt={spk.name} className="w-full h-full object-cover" />
                      : getSpeakerAvatar(spk.name)
                    }
                  </div>

                  {/* Country & Flag pill badge */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 w-fit text-[10px] text-teal-400 font-extrabold uppercase tracking-wider">
                    {getCountryFlag(spk.country)}
                    <span>{spk.country}</span>
                  </div>

                  {/* Name & Role */}
                  <div className="space-y-1">
                    <h4 className="text-sm md:text-base font-black text-white leading-tight group-hover:text-teal-300 transition-colors">
                      {spk.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      {spk.role}
                    </p>
                  </div>
                </div>

                {/* Highlight box */}
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl text-[10.5px] text-slate-300 leading-relaxed italic border-t border-white/10 mt-4 text-left">
                  {spk.highlight}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. DOMESTIC SPEAKERS CAROUSEL */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200 scroll-mt-20" style={sectionStyle.speakersDomestic}>
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-teal-600 text-xs font-extrabold tracking-widest uppercase font-mono block mb-2">PLENARY SPEAKERS</span>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-slate-900 leading-none">
                BÁO CÁO VIÊN TRONG NƯỚC
              </h2>
            </div>
            
            {/* Slider Controls */}
            <div className="flex gap-2.5">
              <button 
                onClick={() => scrollSlider(domesticSliderRef, 'left')} 
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Slide left"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button 
                onClick={() => scrollSlider(domesticSliderRef, 'right')} 
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Slide right"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Horizontal Slider */}
          <div 
            ref={domesticSliderRef}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            {domesticSpeakers.map((spk, idx) => (
              <div 
                key={idx} 
                className="w-[290px] md:w-[330px] bg-slate-50 border border-slate-200 rounded-3xl p-5 shrink-0 snap-start flex flex-col hover:border-teal-500/30 hover:bg-white hover:shadow-md transition-all group text-center"
              >
                <div className="space-y-3 flex flex-col items-center">
                  {/* Speaker Avatar - photo or SVG fallback */}
                  <div className="w-28 h-28 md:w-32 h-32 rounded-full border-2 border-teal-500/20 overflow-hidden shrink-0 bg-slate-100 shadow-lg group-hover:scale-105 transition-transform duration-200">
                    {spk.photoUrl
                      ? <img src={spk.photoUrl} alt={spk.name} className="w-full h-full object-cover" />
                      : getSpeakerAvatar(spk.name)
                    }
                  </div>

                  {/* Country & Flag pill badge */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 w-fit text-[10px] text-teal-600 font-extrabold uppercase tracking-wider">
                    {getCountryFlag(spk.country)}
                    <span>{spk.country}</span>
                  </div>

                  {/* Name & Role */}
                  <div className="space-y-1">
                    <h4 className="text-sm md:text-base font-black text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
                      {spk.name}
                    </h4>
                    <p className="text-[11px] text-slate-555 font-bold leading-normal">
                      {spk.role}
                    </p>
                  </div>
                </div>

                {/* Highlight box */}
                <div className="bg-teal-50/45 border border-teal-100/40 p-3.5 rounded-2xl text-[10.5px] text-slate-650 leading-relaxed italic mt-4 text-left">
                  {spk.highlight}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. STEPPER REGISTRATION FORM */}
      <section id="register" className="py-16 md:py-24 bg-slate-100 border-y border-slate-200 scroll-mt-20" style={sectionStyle.register}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 max-w-xl mx-auto space-y-2">
            <span className="text-teal-650 text-xs font-extrabold tracking-widest uppercase font-mono block">SECURE REGISTRATION</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase text-slate-900 leading-none">ĐĂNG KÝ THAM DỰ</h2>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Vui lòng hoàn thiện đúng 4 bước thông tin đăng ký bên dưới. Thẻ đại biểu chứa mã QR check-in và chứng chỉ CME (4.5h) sẽ phát hành tự động qua Email & Zalo của bác sĩ.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <PublicDelegateRegister onNavigate={onNavigate} isInline={true} />
          </div>
        </div>
      </section>

      {/* 7. CONFERENCE PROGRAM */}
      <section id="program" className="py-16 md:py-24 max-w-6xl mx-auto px-4 scroll-mt-20">
        <div className="space-y-8">
          {/* Header controls & Quick tabs */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5">
              <div>
                <span className="text-teal-650 text-xs font-extrabold tracking-widest uppercase font-mono block mb-1">CONFERENCE AGENDA</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  CHƯƠNG TRÌNH KHOA HỌC CHI TIẾT
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Nhấp vào bài báo cáo cụ thể trên timeline phân phòng để hiển thị Tóm tắt khoa học (Abstract) và lý lịch Báo cáo viên (Bio).
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  id="btn-filter-my-agenda"
                  onClick={() => setOnlyMyAgenda(!onlyMyAgenda)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                    onlyMyAgenda 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
                      : 'bg-amber-55 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyMyAgenda ? 'fill-white' : 'fill-amber-500 text-amber-500'}`} />
                  Lịch cá nhân ({personalAgenda.length})
                </button>
              </div>
            </div>

            {/* Sơ đồ phân bố Phòng / Hội trường */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/40">
              {ROOMS_CONFIG.map((room) => (
                <div key={room.id} className="text-xs bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded font-black uppercase text-[10px] mb-1.5 ${room.tagBg}`}>
                      {room.vietnameseName}
                    </span>
                    <p className="font-extrabold text-slate-800 leading-tight">{room.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Day selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              {[
                { date: '2026-09-12', title: 'NGÀY 1: 12/09/2026', subtitle: 'Khai mạc & Phiên báo cáo khoa học chính' },
                { date: '2026-09-13', title: 'NGÀY 2: 13/09/2026', subtitle: 'Phiên Chuyên đề nâng cao & Bế mạc' }
              ].map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                    selectedDate === d.date
                      ? 'bg-gradient-to-br from-teal-900 to-slate-900 border-teal-600 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-850'
                  }`}
                >
                  <p className="text-xs font-black tracking-wider opacity-75">{d.title}</p>
                  <p className="text-sm font-bold mt-1">{d.subtitle}</p>
                  {selectedDate === d.date && (
                    <div className="absolute right-3 bottom-3 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Track filter tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase mr-1.5">Lọc Chuyên đề:</span>
              {uniqueTracks.map((t) => {
                const trackStr = t || 'Chưa phân';
                return (
                  <button
                    key={trackStr}
                    onClick={() => setSelectedTrackFilter(trackStr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedTrackFilter === trackStr
                        ? 'bg-teal-650 text-white border-teal-650'
                        : 'bg-slate-55 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {trackStr === 'All' ? 'Tất cả' : trackStr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN TIMELINE CHART */}
          {(() => {
            const filteredSessions = sessions.filter((s) => {
              if (s.date !== selectedDate) return false;
              if (onlyMyAgenda && !personalAgenda.includes(s.id)) return false;
              if (selectedTrackFilter !== 'All' && s.track !== selectedTrackFilter) return false;
              return true;
            });

            if (filteredSessions.length === 0) {
              return (
                <div className="bg-white p-16 rounded-3xl border border-slate-150 text-center space-y-3">
                  <Info className="w-12 h-12 text-slate-350 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">Không có bài báo cáo khoa học nào thỏa mãn bộ lọc.</p>
                  <p className="text-xs text-slate-450">Vui lòng thay đổi lọc chuyên đề hoặc tắt chế độ "Lịch cá nhân".</p>
                </div>
              );
            }

            const daySessions = sessions.filter(s => s.date === selectedDate);
            const timeBlocksMap = new Map<string, string>();
            daySessions.forEach(s => {
              timeBlocksMap.set(s.startTime, s.endTime);
            });
            const sortedTimeBlocks = Array.from(timeBlocksMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

            const hasVisibleSession = (startTime: string) => {
              return filteredSessions.some(s => s.startTime === startTime);
            };

            return (
              <div className="space-y-6 animate-fade-in">
                {/* DESKTOP TIMELINE GANTT */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="grid grid-cols-[115px_1fr_1fr_1fr_1fr] border-b border-slate-200 bg-slate-900 text-white font-extrabold text-xs text-center uppercase tracking-wider divide-x divide-slate-800 select-none">
                    <div className="p-4 bg-slate-950 text-slate-300 flex items-center justify-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      GIỜ PHIÊN
                    </div>
                    {ROOMS_CONFIG.map((room) => (
                      <div key={room.id} className="p-4 flex flex-col justify-center items-center">
                        <span className="bg-white/10 text-teal-300 font-mono px-2 py-0.5 rounded text-[10px] mb-1">
                          {room.vietnameseName}
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold leading-tight max-w-[160px] text-center normal-case">
                          {room.subtitle}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-slate-150">
                    {sortedTimeBlocks.map(([startTime, endTime]) => {
                      if (!hasVisibleSession(startTime)) return null;

                      const slots = daySessions.filter(s => s.startTime === startTime);
                      const representative = slots[0];
                      const isGeneral = slots.length === 1 && (
                        (!representative.roomName.includes('Hội trường 1') &&
                         !representative.roomName.includes('Hội trường 2') &&
                         !representative.roomName.includes('Hội trường 3') &&
                         !representative.roomName.includes('Hội trường 4')) ||
                        representative.roomName.toLowerCase().includes('bàn check') ||
                        representative.roomName.toLowerCase().includes('ăn trưa') ||
                        representative.roomName.toLowerCase().includes('teabreak') ||
                        representative.roomName.toLowerCase().includes('tiệc trà') ||
                        representative.title.toLowerCase().includes('chụp ảnh') ||
                        representative.title.toLowerCase().includes('bế mạc')
                      );

                      return (
                        <div key={startTime} className="grid grid-cols-[115px_1fr] divide-x divide-slate-200 hover:bg-slate-50/40 transition-colors">
                          <div className="p-4 flex flex-col items-center justify-center text-center font-mono select-none">
                            <span className="text-slate-800 font-black text-sm">{startTime}</span>
                            <span className="text-slate-400 font-extrabold text-[10px] block mt-0.5">{endTime}</span>
                          </div>

                          {isGeneral ? (
                            <div className="p-4 flex items-center justify-center text-center bg-slate-50/50">
                              <div className="max-w-2xl">
                                <span className="bg-slate-200/80 text-slate-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1">
                                  {representative.roomName}
                                </span>
                                <h4 className="font-extrabold text-slate-800 text-sm hover:text-teal-650 transition-colors cursor-pointer" onClick={() => setSelectedSessionDetail(representative)}>
                                  {representative.title}
                                </h4>
                                <p className="text-xs text-slate-400 font-semibold mt-1">{representative.speakerName} • {representative.speakerTitle}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 divide-x divide-slate-200">
                              {ROOMS_CONFIG.map((room) => {
                                const currentSession = slots.find(s => s.roomName.includes(room.id));
                                if (!currentSession) {
                                  return <div key={room.id} className="p-4 bg-slate-50/20 text-slate-350 text-center flex items-center justify-center text-[10px] italic select-none">Trống</div>;
                                }

                                const isFilteredOut = !filteredSessions.some(fs => fs.id === currentSession.id);
                                if (isFilteredOut) {
                                  return <div key={room.id} className="p-4 bg-slate-50/10 text-slate-200 text-center flex items-center justify-center text-[10px] select-none">Ẩn</div>;
                                }

                                const isSaved = personalAgenda.includes(currentSession.id);

                                return (
                                  <div
                                    key={room.id}
                                    onClick={() => setSelectedSessionDetail(currentSession)}
                                    className={`p-4 hover:bg-slate-50/80 transition-all flex flex-col justify-between relative cursor-pointer group border-l-3 ${
                                      room.id === 'Hội trường 1' ? 'border-l-rose-500' :
                                      room.id === 'Hội trường 2' ? 'border-l-indigo-500' :
                                      room.id === 'Hội trường 3' ? 'border-l-amber-500' :
                                      'border-l-teal-500'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <h4 className="font-extrabold text-slate-800 text-xs leading-snug group-hover:text-teal-650 transition-colors">
                                        {currentSession.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-bold">{currentSession.speakerName}</p>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-100">
                                      <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        {currentSession.track}
                                      </span>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleBookmark(currentSession.id);
                                        }}
                                        className="text-amber-500 hover:scale-110 transition-transform p-0.5 rounded cursor-pointer border-none bg-transparent"
                                      >
                                        <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MOBILE SCHEDULE LIST */}
                <div className="md:hidden space-y-4">
                  {filteredSessions.map((session) => {
                    const isSaved = personalAgenda.includes(session.id);
                    const matchingRoom = ROOMS_CONFIG.find(r => session.roomName.includes(r.id));
                    
                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionDetail(session)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs active:bg-slate-50 transition-colors relative cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <span className="bg-slate-100 text-slate-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                            {session.startTime} - {session.endTime}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            matchingRoom ? matchingRoom.tagBg : 'bg-slate-100 text-slate-700'
                          }`}>
                            {matchingRoom ? matchingRoom.vietnameseName : session.roomName}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug mb-1">
                          {session.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold mb-3">{session.speakerName} • {session.speakerTitle}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="bg-teal-50 text-teal-700 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                            {session.track}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(session.id);
                            }}
                            className="p-1 rounded text-amber-500 border-none bg-transparent"
                          >
                            <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 8. SPONSORS */}
      <section id="sponsors" className="py-16 md:py-24 bg-white border-t border-slate-200 scroll-mt-20" style={sectionStyle.sponsors}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-teal-650 text-xs font-extrabold tracking-widest uppercase font-mono block mb-2">CONFERENCE SPONSORS</span>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4 leading-none">
            NHÀ TÀI TRỢ & ĐỐI TÁC ĐỒNG HÀNH
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xl mx-auto font-semibold mb-12">
            Hội nghị vinh dự đón nhận sự đồng hành và hỗ trợ từ các tập đoàn thiết bị y tế, dược mỹ phẩm và công nghệ thẩm mỹ danh tiếng trong nước và quốc tế.
          </p>

          {/* Sponsors grid representation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {sponsors.length > 0 ? sponsors.map((spn) => (
              <div 
                key={spn.id} 
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-center items-center hover:bg-white hover:border-teal-500/20 hover:shadow-md transition-all h-28 relative group"
              >
                {spn.logoUrl ? (
                  <img src={spn.logoUrl} alt={spn.name} className="max-h-12 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                ) : (
                  <div className="text-center">
                    <p className="font-extrabold text-slate-800 text-sm leading-tight uppercase group-hover:text-teal-650 transition-colors">{spn.name}</p>
                    <span className="text-[9px] text-teal-650 font-bold uppercase tracking-wider font-mono bg-teal-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">{spn.tier}</span>
                  </div>
                )}
              </div>
            )) : (
              // Fallback default mocked sponsors
              [
                { name: 'Boston Pharma VN', tier: 'Diamond Sponsor' },
                { name: 'Medtronic Vietnam', tier: 'Gold Sponsor' },
                { name: 'Boston Scientific', tier: 'Gold Sponsor' },
                { name: 'Johnson & Johnson', tier: 'Silver Sponsor' }
              ].map((spn, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-center items-center hover:bg-white hover:border-teal-500/20 hover:shadow-md transition-all h-28">
                  <p className="font-extrabold text-slate-800 text-sm leading-tight uppercase">{spn.name}</p>
                  <span className="text-[9px] text-teal-650 font-black uppercase tracking-wider font-mono bg-teal-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">{spn.tier}</span>
                </div>
              ))
            )}
          </div>

          {/* Call for Sponsorship */}
          <div className="mt-12 p-6 rounded-2xl border border-dashed border-teal-500/30 bg-teal-50/20 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="font-extrabold text-slate-900 text-sm">Đồng hành cùng PARS 2026?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Đăng ký tài trợ để quảng bá thương hiệu trực diện tới 500+ Bác sĩ đầu ngành.</p>
            </div>
            <button 
              onClick={() => onNavigate('register-sponsor')} 
              className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors border-none"
            >
              Liên hệ tài trợ
            </button>
          </div>
        </div>
      </section>

      {/* 9. LOCATION & MAP BLOCK */}
      <section id="location" className="py-16 md:py-24 bg-slate-900 text-white scroll-mt-20" style={sectionStyle.location}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
            <span className="text-teal-400 text-xs font-extrabold tracking-widest uppercase font-mono block">EVENT VENUE</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
              ĐỊA ĐIỂM TỔ CHỨC
            </h2>
            <div className="space-y-4 text-slate-350 text-sm leading-relaxed">
              <div className="flex gap-3">
                <Building className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Khách sạn Meliá Hà Nội</strong>
                  <br />
                  Số 44B Lý Thường Kiệt, Phường Cửa Nam, Quận Hoàn Kiếm, TP. Hà Nội.
                </p>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Hotline hỗ trợ chỉ dẫn:</strong>
                  <br />
                  Ban thư ký EMCAS: +84964551151
                </p>
              </div>
              <div className="flex gap-3">
                <Globe className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Trang chủ khách sạn:</strong>
                  <br />
                  <a href="https://www.melia.com" target="_blank" rel="noreferrer" className="text-teal-300 hover:underline flex items-center gap-1">
                    melia.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/5">
              💡 <strong>Lưu ý đỗ xe:</strong> Đại biểu di chuyển bằng phương tiện cá nhân vui lòng đỗ xe tại tầng hầm của Khách sạn Meliá hoặc liên hệ lễ tân hướng dẫn vị trí dự phòng bên ngoài.
            </p>
          </div>

          {/* Right map mock column */}
          <div className="lg:col-span-7 border border-white/10 rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between h-[320px] md:h-[400px] shadow-2xl relative group">
            {/* Ambient Map Grid Design */}
            <div className="absolute inset-0 bg-teal-950/20 opacity-60 pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1),transparent)] z-0" />
            
            {/* Map Placeholder Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 animate-pulse">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-base">BẢN ĐỒ KHÁCH SẠN MELIÁ HÀ NỘI</h4>
                <p className="text-xs text-slate-400">44B Lý Thường Kiệt, Hoàn Kiếm, Hà Nội</p>
              </div>
              <a
                href="https://maps.google.com/?q=Melia+Hotel+Hanoi+44B+Ly+Thuong+Kiet"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-650 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5 transition-all decoration-none"
              >
                Mở trong Google Maps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Bottom details strip */}
            <div className="bg-slate-900 border-t border-white/5 p-4 text-center text-xs text-slate-500 z-10">
              Vị trí đắc địa ngay trung tâm Thủ đô, cách Hồ Hoàn Kiếm 10 phút đi bộ.
            </div>
          </div>

        </div>
      </section>

      {/* 10. PREMIUM FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 border-t border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-650 flex items-center justify-center text-white font-black">
                P
              </div>
              <span className="text-white font-black uppercase tracking-wider text-sm">PARS 2026</span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-slate-400">
              Hệ thống đăng ký & điều phối học thuật trực tuyến của Hội nghị Khoa học Quốc tế PARS 2026. Chủ trì tổ chức bởi Bệnh viện Thẩm mỹ EMCAS.
            </p>
            <div className="text-[11px] text-slate-500 pt-2 space-y-1">
              <p>• <strong>Báo cáo viên:</strong> Hạn nộp tóm tắt abstract đến hết ngày 15/09/2026.</p>
              <p>• <strong>Đại biểu:</strong> Hoàn thành chuyển khoản lệ phí để kích hoạt vé tự động.</p>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">ĐƯỜNG DẪN NHANH</h4>
            <ul className="text-xs space-y-2.5 font-bold list-none p-0 m-0">
              <li><button onClick={() => scrollToSection('intro')} className="hover:text-teal-400 transition-colors cursor-pointer text-left border-none bg-transparent text-slate-400">Giới thiệu chung</button></li>
              <li><button onClick={() => scrollToSection('speakers')} className="hover:text-teal-400 transition-colors cursor-pointer text-left border-none bg-transparent text-slate-400">Báo cáo viên</button></li>
              <li><button onClick={() => scrollToSection('program')} className="hover:text-teal-400 transition-colors cursor-pointer text-left border-none bg-transparent text-slate-400">Chương trình khoa học</button></li>
              <li><button onClick={() => scrollToSection('register')} className="hover:text-teal-400 transition-colors cursor-pointer text-left border-none bg-transparent text-slate-400">Đăng ký tham dự</button></li>
            </ul>
          </div>

          {/* Col 3: Contact details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">LIÊN HỆ BTC</h4>
            <div className="text-xs space-y-2.5 leading-relaxed">
              <p>
                <strong className="text-slate-200 uppercase block font-sans text-[10px]">Đơn vị tổ chức:</strong>
                Bệnh viện Thẩm mỹ EMCAS
              </p>
              <p>
                <strong className="text-slate-200 uppercase block font-sans text-[10px]">Zalo / Hotline:</strong>
                +84964551151 (Ban thư ký)
              </p>
              <p>
                <strong className="text-slate-200 uppercase block font-sans text-[10px]">Hỗ trợ kỹ thuật:</strong>
                pars.events@gmail.com
              </p>
            </div>
          </div>

        </div>

        {/* Copy strip */}
        <div className="max-w-6xl mx-auto border-t border-white/5 mt-12 pt-8 text-center text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Bệnh viện Thẩm mỹ EMCAS. All rights reserved.</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <a href="https://parsvn.com" className="hover:text-slate-400">parsvn.com</a>
            <span className="text-white/10">|</span>
            <button onClick={() => onNavigate('overview')} className="hover:text-slate-400 cursor-pointer border-none bg-transparent text-slate-600">BTC Dashboard</button>
          </div>
        </div>
      </footer>

      {/* 11. ACADEMIC ABSTRACT & BIO DETAIL DIALOG POPUP */}
      {selectedSessionDetail && (() => {
        const enrichment = getSessionEnrichment(selectedSessionDetail);
        const isBookmarked = personalAgenda.includes(selectedSessionDetail.id);
        const matchingConf = ROOMS_CONFIG.find(r => selectedSessionDetail.roomName.includes(r.id));
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedSessionDetail(null)}>
            <div 
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header card with color accents */}
              <div className="p-6 bg-slate-900 text-white relative">
                <button 
                  onClick={() => setSelectedSessionDetail(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white transition-all p-1 rounded-full hover:bg-white/10 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/30">
                    {selectedSessionDetail.startTime} - {selectedSessionDetail.endTime} | {selectedSessionDetail.date}
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-rose-500/30">
                    {selectedSessionDetail.track}
                  </span>
                  {matchingConf && (
                    <span className="bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30">
                      {matchingConf.vietnameseName}
                    </span>
                  )}
                </div>

                <h3 className="text-lg md:text-xl font-black text-slate-100 leading-snug tracking-tight">
                  {selectedSessionDetail.title}
                </h3>
              </div>

              {/* Speaker card overview strip */}
              <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-800 text-white font-extrabold flex items-center justify-center text-sm shadow-sm animate-pulse">
                    {selectedSessionDetail.speakerName.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 leading-tight">
                      {selectedSessionDetail.speakerName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedSessionDetail.speakerTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(selectedSessionDetail.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white text-amber-500' : 'text-amber-500'}`} />
                    {isBookmarked ? 'Đã lưu' : 'Lưu lịch'}
                  </button>
                </div>
              </div>

              {/* Switching Tabs inside Detail Popup */}
              <div className="flex border-b border-slate-155 text-sm select-none">
                <button
                  onClick={() => setModalTab('abstract')}
                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-all border-b-2 outline-none cursor-pointer ${
                    modalTab === 'abstract'
                      ? 'border-teal-600 text-teal-800 bg-teal-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  Tóm Tắt Đề Tài (Abstract)
                </button>
                <button
                  onClick={() => setModalTab('bio')}
                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-all border-b-2 outline-none cursor-pointer ${
                    modalTab === 'bio'
                      ? 'border-teal-600 text-teal-800 bg-teal-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  Tiểu Sử Báo Cáo Viên (Bio)
                </button>
              </div>

              {/* Dynamic scrollable body content */}
              <div className="p-6 overflow-y-auto text-sm leading-relaxed text-slate-700 flex-1 bg-slate-50/30">
                {modalTab === 'abstract' ? (
                  <div className="space-y-4 font-sans">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold uppercase tracking-wider bg-indigo-50 w-fit px-2.5 py-1 rounded">
                      <FileText className="w-3.5 h-3.5" />
                      Công báo học thuật chính thức
                    </div>
                    {/* Render abstract */}
                    <div className="whitespace-pre-line text-slate-800 text-justify text-[13px] bg-white p-4 rounded-2xl border border-slate-100 shadow-xs leading-relaxed">
                      {enrichment.abstract}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 w-fit px-2.5 py-1 rounded">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Lý lịch khoa học trích ngang
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {selectedSessionDetail.speakerName}
                      </p>
                      <p className="text-xs text-teal-700 font-semibold italic bg-teal-50/30 px-2 py-1 rounded border border-teal-100/40 font-mono">
                        Chức danh: {selectedSessionDetail.speakerTitle}
                      </p>
                      <div className="whitespace-pre-line text-slate-700 text-justify text-[13px] pt-1">
                        {enrichment.bio}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom close footer area of modal */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                <button
                  onClick={() => setSelectedSessionDetail(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
    </div>
  );
}
