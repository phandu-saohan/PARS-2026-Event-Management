/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, MapPin, Users, Award, ShieldAlert, Cpu, CheckCircle, 
  FileText, ArrowRight, HeartHandshake, Clock, Search, Star, Bookmark, 
  Filter, X, Info, HelpCircle
} from 'lucide-react';
import { store } from '../dataStore';
import { ConferenceSession } from '../types';

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
  if (session.id === 'SES-204') {
    return {
      abstract: `ĐẶT VẤN ĐỀ: Ngành phẫu thuật tạo hình thẩm mỹ đang trải qua một bước ngoặt lớn với sự xuất hiện của các công nghệ robot và mô phỏng 3D. Nghiên cứu này đánh giá hiệu quả của phẫu thuật tạo hình ngực kết hợp với công nghệ mô phỏng thực thực tế ảo tăng cường (AR).\n\nPHƯƠNG PHÁP: Nghiên cứu tiến cứu trên 150 bệnh nhân được lập kế hoạch nâng ngực sử dụng mô phỏng 3D Crisp-Fit trước khi can thiệp. Đánh giá độ chính xác về thể tích túi, sự hài lòng của bệnh nhân sau 6 tháng lâm sàng.\n\nKẾT QUẢ: Tỷ lệ không khớp kích thước túi giảm xuống còn dưới 1.2%. Thời gian phẫu thuật trung bình giảm 15 phút. Độ cân đối hai bên đạt mức lý tưởng đối với 98% số bệnh nhân tham gia.\n\nKẾT LUẬN: Việc lập sơ đồ ảo và sử dụng công nghệ định vị AR giúp tối ưu hóa kết quả phẫu thuật thẩm mỹ vóc dáng, giảm thiểu tối đa các biến chứng lệch túi hoặc không cân xứng bẩm sinh.`,
      bio: `GS.TS. danh dự chuyên khoa Phẫu thuật Thẩm mỹ vóc dáng với hơn 25 năm kinh nghiệm lâm sàng trên toàn cầu. Ông là cựu chủ nhiệm khoa tạo hình tại Đại học Y lớn, thành viên hội đồng khoa học quốc tế PARS. Đã công bố trên 50 bài báo nghiên cứu chuyên sâu về nâng ngực nâng cao.`
    };
  }
  
  if (session.id === 'SES-213') {
    return {
      abstract: `ĐẶT VẤN ĐỀ: Kỹ thuật căng da mặt sâu (SMAS Facelift) là tiêu chuẩn vàng trong trẻ hóa vùng mặt nhưng chứa đựng nguy cơ tổn thương nhánh thần kinh số VII. Nghiên cứu đề xuất giải pháp bóc tách vùng an toàn kết hợp với định vị siêu âm năng lượng cao.\n\nPHƯƠNG PHÁP: Mô tả cắt ngang trên 80 ca phẫu thuật căng chỉ sâu kết hợp thắt dải SMAS cơ cổ vai bám da. Tiến hành dò đường đi thần kinh VII trước phẫu thuật bằng đầu dò siêu âm siêu vi.\n\nKẾT QUẢ: 100% bệnh nhân không gặp biến chứng liệt mặt cơ học tạm thời hay vĩnh viễn. Kết quả căng mướt trẻ trung duy trì trên 5 năm đối với 95% mẫu thử.\n\nKẾT LUẬN: Phương pháp dò siêu âm nhiệt an toàn trước khi xẻ dải cơ sâu là đột phá giúp tối ưu chuẩn an toàn trong trẻ hóa toàn diện khuôn mặt.`,
      bio: `PGS.TS.BS. Thành viên cố vấn cấp cao hội phẫu thuật tạo hình Sài Gòn, có nhiều năm học tập và chuyển giao công nghệ căng da cơ sâu tại Seoul, Hàn Quốc. Tác giả của cuốn sách "Cẩm nang căng da mặt SMAS" uy tín.`
    };
  }

  if (session.id === 'SES-218') {
    return {
      abstract: `ĐẶT VẤN ĐỀ: Co thắt bao xơ (Capsular Contracture) là biến chứng nghiêm trọng hàng đầu trong nâng ngực túi silicone. Chúng tôi đánh giá hiệu quả bọc phủ túi ngực bằng màng nanofiber thế hệ mới kết hợp kháng sinh dự phòng tại chỗ.\n\nPHƯƠNG PHÁP: Nghiên cứu thử nghiệm lâm sàng ngẫu nhiên có đối chứng trên 120 ca phẫu thuật nâng ngực thứ phát sau biến chứng co thắt.\n\nKẾT QUẢ: Sau 18 tháng theo dõi, nhóm sử dụng màng bao phủ sinh học có tỷ lệ co thắt bao xơ tái phát bằng 0%, so với 8.5% ở nhóm đối chứng không bọc màng.\n\nKẾT LUẬN: Ứng dụng công nghệ màng bao phủ sinh học nanofiber là giải pháp đột phá tháo gỡ hoàn toàn bài toán biến chứng bao xơ của túi silicone.`,
      bio: `PGS.TS.BS. Chuyên khoa phẫu thuật vú hàng đầu, nổi tiếng với kỹ năng sửa bao xơ ngực phức tạp. Ông thường xuyên giảng dạy tại các khóa đào tạo quốc gia và chuyển giao kỹ nghệ nội soi ngực không đau.`
    };
  }

  // General fallbacks based on session topic keywords
  const lowerTitle = title.toLowerCase();
  let abstract = '';
  let bio = '';

  if (lowerTitle.includes('khai mạc') || lowerTitle.includes('bế mạc') || lowerTitle.includes('đại hội')) {
    abstract = `Nội dung tổng luận điều hành: Trình bày báo cáo tổng quan sự phát triển vượt bậc của đại hội thẩm mỹ PARS qua 10 năm thành lập. Đi sâu vào phân tích bài học quản lý nhân lực, xu thế chuyển dịch định vị chuẩn học thuật và lộ trình chuẩn hóa CME quốc gia.\n\nMục tiêu: Định hướng chung cho toàn bộ các bác sĩ hội viên về sự phối hợp giữa tạo hình thẩm mỹ chuyên sâu cùng tôn trọng y đức và an toàn tối đa cho khách hàng.`;
    bio = `Đoàn Chủ Tịch, Hội đồng Ban Chấp Hành trung ương PARS, tập hợp các Giáo sư, Phó Giáo sư đầu ngành có cống hiến to lớn cho nền y học phẫu thuật tạo hình nước nhà.`;
  } else if (lowerTitle.includes('live surgery') || lowerTitle.includes('mổ trực tiếp')) {
    abstract = `Trình diễn kỹ năng lâm sàng tại chỗ (Live Video Surgery): Truyền hình trực tiếp độ sảnh phân giải cao 4K từ phòng mổ chuẩn mực của Bệnh viện Quân y 175 về hội nghị. Thuyết giảng chi tiết về các đường rạch ngầm, phương án tách khoang SMAS bảo vệ tuyến dẫn truyền thần kinh, cùng bí quyết đặt túi nâng cơ thắt ngực ít sang chấn.\n\nTrường hợp nghiên cứu: Áp dụng trên dải bệnh nhân thật được tuyển lựa sát sao, giúp đại biểu học hỏi thực chiến thao tác khâu đóng giấu sẹo thẩm mỹ đỉnh cao.`;
    bio = `Báo cáo viên & Phẫu thuật viên danh tiếng, chuyên gia mổ rạch lâm sàng với trên 25 năm kinh nghiệm, khách mời danh dự điều phối các phiên live trực quan bậc cao.`;
  } else if (lowerTitle.includes('hands-on') || lowerTitle.includes('thực hành')) {
    abstract = `Khóa Đào tạo Thực hành Lâm nghiệp (Hands-on Workshop): Học viên trực tiếp thao tác thực nghiệm trên các mô hình nhân tạo giả lập cao cấp và dải chất liệu sinh học tiên tiến.\n\nPhương pháp giảng dạy: Cầm tay chỉ việc dưới sự giám sát chặt chẽ của 2 chuyên gia huấn luyện trên mỗi sảnh bàn. Cân chỉnh tỉ mỉ từng góc kim luồn dải chỉ collagen, lực nén của bơm tiêm meso hay dải tần số laser phù hợp để mang lại kết quả an toàn toàn diện.`;
    bio = `Cố vấn công nghệ lâm sàng chuyên trách, huấn luyện viên dạn dày kinh nghiệm điều phối hàng chục khóa thực nghiệm y khoa chuyên đề quốc gia và quốc tế.`;
  } else if (lowerTitle.includes('master class') || lowerTitle.includes('lớp học')) {
    abstract = `Lớp giảng dạy tinh hoa nâng cao (Specialized Master Class): Tập trung mổ xẻ các ca lâm sàng hỏng, biến dạng khó lường hoặc hoại tử da thứ phát sau phẫu thuật lỗi từ cơ sở không phép.\n\nNội dung học thuật: Giới thiệu hệ quy chiếu nhân trắc học ba chiều, kỹ năng bóc tách bù đắp dải cơ bằng chất liệu vạt tự thân nâng cao, thiết kế lại đường nâng hạ sụn sườn, và giải quyết triệt để sẹo co rút lâu năm.`;
    bio = `Giảng viên Thượng Đỉnh được PARS cấp chứng nhận danh dự, là bậc thầy đầu ngành sở hữu các giáo trình bồi dưỡng y học độc quyền và nổi tiếng toàn quốc.`;
  } else if (lowerTitle.includes('ngực') || lowerTitle.includes('vú') || lowerTitle.includes('mông') || lowerTitle.includes('bụng')) {
    abstract = `ĐẶT VẤN ĐỀ: Nhu cầu tạo hình vóc dáng (Body Contouring) đang bùng nổ mạnh mẽ nhưng đòi hỏi gắt gao về chuẩn ranh giới an toàn cơ học. Nghiên cứu tiến hành đánh giá việc kết hợp phác đồ hút mỡ xoáy nước (Water-jet Liposuction) và thắt màng bụng nâng đỡ.\n\nPHƯƠNG PHÁP: Mô tả kết quả 110 ca phẫu thuật tạo hình bụng ngực toàn diện sử dụng hệ thống đo áp lực khoang điện tử.\n\nKẾT QUẢ: Rút ngắn thời gian phục hồi xuống dưới 5 ngày, vết sẹo tệp màu da đạt mức thẩm mỹ tối đa, tỷ lệ hài lòng của khách hàng đạt mức 97.4%.\n\nKẾT LUẬN: Việc phối hợp hút mỡ áp lực nước và bảo vệ cơ vách giúp ngăn biến chứng hoại tử mỡ thứ phát hiệu quả.`;
    bio = `Bác sĩ phẫu thuật chính chuyên khoa tạo hình vóc dáng, thành viên BCH PARS, có nhiều công bố học thuật xuất sắc trên các tạp chí phẫu thuật thẩm mỹ châu Á.`;
  } else if (lowerTitle.includes('mặt') || lowerTitle.includes('hàm') || lowerTitle.includes('sọ') || lowerTitle.includes('cằm') || lowerTitle.includes('xương')) {
    abstract = `ĐẶT VẤN ĐỀ: Phẫu thuật chỉnh hình xương hàm mặt phức tạp luôn đối mặt với rủi ro lệch trục cắn hoặc tổn thương thần kinh dưới ổ mắt. Chúng tôi báo cáo hiệu quả ứng dụng máng định vị in 3D sinh học chính xác.\n\nPHƯƠNG PHÁP: Nghiên cứu trên 65 ca phẫu thuật cắt sọ, gọt góc hàm và di lệch cằm theo thiết kế mô phỏng ảo cắt lớp vi tính.\n\nKẾT QUẢ: Độ bám khít dải vít đạt tỉ lệ chính xác đến 0.2mm, bảo toàn an toàn tuyệt đối khớp cắn và cảm giác nhai của người bệnh ngay sau mổ.\n\nKẾT LUẬN: Công nghệ máng ảo 3D là cuộc cách mạng giúp loại bỏ sai số chủ quan, mang lại diện mạo cân xứng tự nhiên.`;
    bio = `Tiến sĩ bác sĩ chuyên khoa chỉnh hình hàm mặt tuyến cuối, tu học nhiều năm tại Cộng hòa Pháp, có kinh nghiệm xử lý hàng ngàn ca sập gãy sọ mặt nặng.`;
  } else if (lowerTitle.includes('chỉ') || lowerTitle.includes('laser') || lowerTitle.includes('botox') || lowerTitle.includes('filler') || lowerTitle.includes('trẻ hóa') || lowerTitle.includes('da')) {
    abstract = `ĐẶT VẤN ĐỀ: Sự suy giảm collagen đa tầng là nguyên nhân cốt lõi gây lão hóa cơ mặt. Nghiên cứu đánh giá tính hiệu quả khi phối hợp căng chỉ collagen xoắn kép và tiêm dải Exosome sinh học.\n\nPHƯƠNG PHÁP: Thử nghiệm ngẫu nhiên trên 140 phụ nữ tuổi trung niên có biểu hiện nhão cơ nông. Tiến hành đo mật độ sợi elastin bằng máy chụp quét quang học tầng sâu.\n\nKẾT QUẢ: Tăng sản sợi collagen gấp 3.2 lần sau 3 tháng trị liệu, cải thiện đáng kể độ đàn hồi căng mịn và xóa mờ 85% các nếp rãnh sâu.\n\nKẾT LUẬN: Phối hợp cơ học căng chỉ chỉ định kết hợp hoạt lực exosome là xu hướng bùng nổ sắp tới trong thẩm mỹ nội khoa không sâm lấn.`;
    bio = `Bác sĩ chuyên khoa II Da liễu, cố vấn cao cấp của các hãng thiết bị laser y tế hàng đầu châu Âu, diễn giả quen thuộc tại các diễn đàn thẩm mỹ nội khoa Đông Nam Á.`;
  } else {
    abstract = `TÓM TẮT ĐỀ TÀI (ABSTRACT):\nĐặt vấn đề: Đề mục nghiên cứu nhằm tổng kết các bằng chứng lâm sàng tiên phong trong khuôn khổ chủ đề khoa học tạo hình thẩm mỹ thường niên PARS 2026. Giải quyết thách thức lâm sàng, nâng chuẩn chất lượng đào tạo liên tục CME.\n\nPhương pháp: Tiến hành phân tích tiến cứu kết hợp đo đạc cắt lớp vi tính trục tọa độ cơ thể. Khảo sát mù đôi trên mẫu bệnh nhân sau 12 tháng.\n\nKết quả: Rút ngắn thời gian dưỡng thương, bảo toàn sự phân bố vi mạch tự nhiên và nâng tỷ lệ thẩm mỹ hài lòng toàn diện.\n\nKết luận: Phương án cải tiến đề xuất hoạt tải tối ưu, xứng đáng tích hợp sâu rộng vào cẩm nang chỉ định điều trị thực địa.`;
    bio = `Báo cáo viên chuyên đề: ${speakerName} (${speakerTitle}). Nhà khoa học hoạt động nhiệt thành, có đóng góp hữu ích cho hội đồng đào tạo kịch xạ PARS.`;
  }

  return { abstract, bio };
}

export default function PublicEventDetails({ onNavigate }: PublicEventDetailsProps) {
  const sessions = store.getSessions();
  const sponsors = store.getSponsors();
  const packages = store.getPackages().filter(p => p.isActive);
  const [activeTab, setActiveTab ] = useState<'intro' | 'schedule' | 'sponsors'>('schedule');

  // Interactive schedule states
  const [selectedDate, setSelectedDate] = useState<string>('2026-12-12'); // Default to main day (Day 2)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('All');
  const [onlyMyAgenda, setOnlyMyAgenda] = useState<boolean>(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<ConferenceSession | null>(null);
  const [modalTab, setModalTab] = useState<'abstract' | 'bio'>('abstract');

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

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-teal-950 via-sky-950 to-slate-950 text-white py-20 px-4 overflow-hidden border-b border-teal-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold mb-6 animate-pulse">
            <Award className="w-3.5 h-3.5" />
            PARS 10TH ANNUAL MEETING & CONFERENCE
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 max-w-4xl text-teal-50 uppercase leading-snug">
            Đại Hội Nhiệm Kỳ III & Hội Nghị Khoa Học Thường Niên PARS Lần Thứ 10
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed font-medium">
            Chủ đề: <span className="text-amber-400 font-black">&ldquo;Cùng nhau định hình tương lai ngành Phẫu Thuật Tạo Hình Thẩm Mỹ&rdquo;</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mb-10">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <Calendar className="w-8 h-8 text-teal-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-black">THỜI GIAN</p>
                <p className="text-sm font-extrabold text-white">11 - 13 Tháng 12, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <MapPin className="w-8 h-8 text-teal-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-black">ĐỊA ĐIỂM</p>
                <p className="text-sm font-extrabold text-white">Bệnh viện Quân y 175, TP.HCM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <Users className="w-8 h-8 text-teal-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-black">QUY MÔ</p>
                <p className="text-sm font-extrabold text-white">1200 - 1500 Đại biểu</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              id="btn-nav-reg-delegate"
              onClick={() => onNavigate('register-delegate')}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 font-semibold text-white transition-all shadow-lg shadow-teal-500/20 inline-flex items-center gap-2"
            >
              Đăng Ký Tham Dự (Đại Biểu)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-nav-reg-speaker"
              onClick={() => onNavigate('register-speaker')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-semibold text-white border border-white/20 transition-all inline-flex items-center gap-2"
            >
              Gửi Bài Báo Cáo (Báo Cáo Viên)
              <FileText className="w-4 h-4" />
            </button>
            <button
              id="btn-nav-reg-sponsor"
              onClick={() => onNavigate('register-sponsor')}
              className="px-6 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 font-semibold text-white transition-all shadow-lg inline-flex items-center gap-2"
            >
              Đăng Ký Tài Trợ (Doanh Nghiệp)
              <HeartHandshake className="w-4 h-4" />
            </button>
            <button
              id="btn-nav-check-reg"
              onClick={() => onNavigate('check-registration')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 font-semibold text-slate-950 transition-all shadow-lg inline-flex items-center gap-2"
            >
              Tra Cứu Hồ Sơ & Tải Vé / CME
              <Search className="w-4 h-4" />
            </button>
            <button
              id="btn-nav-portal"
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium border border-teal-500/20 transition-all"
            >
              Cổng Ban Tổ Chức (BTC) & CTV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('intro')}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'intro' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Giới Thiệu Sự Kiện
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'schedule' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Chương Trình Khoa Học
            </button>
            <button
              onClick={() => setActiveTab('sponsors')}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'sponsors' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Nhà Tài Trợ & Đăng Ký Gói
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {activeTab === 'intro' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Cpu className="text-teal-600 w-5 h-5" />
                  Mục tiêu trọng tâm PARS 2026
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Hội nghị khoa học thường niên PARS 2026 là điểm hẹn học thuật uy tín dành cho giới y khoa toàn quốc. Trong bối cảnh công nghệ số phát hiện vượt bậc, PARS 2026 cam kết nâng cao chuẩn mực an toàn bệnh nhân, chia sẻ các kết quả lâm sàng xuất sắc dựa trên bằng chứng, kết hợp trí tuệ nhân tạo và các công nghệ can thiệp ít xâm lấn.
                </p>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Chúng tôi tập trung vào 4 chủ đề cốt lõi: Phẫu thuật Robot chính xác, Gây mê hồi sức kỹ thuật cao tối ưu hóa hồi phục sau mổ (ERAS), Chẩn đoán hình ảnh tiên tiến và Thẩm mỹ tạo hình an toàn y học.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                    <CheckCircle className="text-teal-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Cấp chứng nhận CME chính thức</h4>
                      <p className="text-xs text-slate-500">Được cấp bởi Đại học Y Dược uy tín dành cho các Bác sỹ, Thầy thuốc tham dự đủ số tiết quy định.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                    <CheckCircle className="text-teal-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Giao lưu doanh nghiệp toàn cầu</h4>
                      <p className="text-xs text-slate-500">Tiếp cận 30+ gian hàng triển lãm vật tư y khoa thế hệ mới, thiết bị chuẩn đoán hình ảnh hàng đầu.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speaker Highlights info */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="text-teal-600 w-5 h-5" />
                  Báo cáo viên chuyên đề nổi bật
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-sky-600 flex items-center justify-center text-white font-bold shrink-0 text-sm shadow">
                      TQ
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">PGS.TS.BS. Trần Quốc Bảo</h4>
                      <p className="text-xs text-teal-600 font-medium mb-1">Trưởng khoa Ngoại Lồng Ngực - Bệnh viện 108</p>
                      <p className="text-xs text-slate-500">Chuyên đề: &ldquo;Phẫu thuật Robot điều trị u trung thất trước: Kinh nghiệm tại Việt Nam&rdquo;</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 via-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0 text-sm shadow">
                      LM
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">PGS.TS.BS. Lê Hoàng Mỹ</h4>
                      <p className="text-xs text-teal-600 font-medium mb-1">Giảng viên bộ môn Thần Kinh - ĐH Y Dược TP.HCM</p>
                      <p className="text-xs text-slate-500">Chuyên đề: &ldquo;Cập nhật liệu pháp kháng thể đơn dòng trong điều trị bệnh Alzheimer giai đoạn sớm&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical info sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4 text-md">Thông Tin Liên Hệ Ban Tổ Chức</h4>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <div>
                    <span className="font-bold text-slate-800 block uppercase">Đơn vị chủ trì:</span>
                    <span className="font-semibold text-slate-900">HỘI PHẪU THUẬT TẠO HÌNH THẨM MỸ VIỆT NAM (PARS)</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase">Chủ tịch hiệp hội:</span>
                    <span className="font-semibold text-slate-900">PGS. TS. BS. LÊ HÀNH</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-800 block uppercase">Thư ký liên hệ chính:</span>
                    <span className="text-teal-900 font-extrabold text-sm">Thái Võ Ngọc Thư</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase">Hotline / Zalo hỗ trợ:</span>
                    <span className="text-emerald-600 font-bold text-sm">+84964551151</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase">Email tiếp nhận:</span>
                    <span className="text-sky-700 font-semibold text-xs font-mono select-all">pars.events@gmail.com</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-800 block uppercase">Website chính thức:</span>
                    <a href="https://pars.vn" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-semibold font-mono">https://pars.vn/</a>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase">Fanpage sự nghiệp:</span>
                    <a href="https://www.facebook.com/parsevent" target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline font-semibold text-[11px] font-mono break-all">facebook.com/parsevent</a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-950 shadow-md">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-teal-400" />
                  Bạn là Báo Cáo Viên?
                </h4>
                <p className="text-xs text-indigo-200 mb-6 leading-relaxed">
                  Hạn đệ trình tóm tắt báo cáo (abstract) và tài liệu đính kèm là ngày **15/09/2026**. Sau khi submit, hội đồng khoa học sẽ phản hồi trong vòng 5 ngày làm việc và đồng bộ lịch trình tự động.
                </p>
                <button
                  id="btn-nav-reg-speaker-action"
                  onClick={() => onNavigate('register-speaker')}
                  className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs transition-all shadow"
                >
                  Nộp Bài Báo Cáo Ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-8">
            {/* Header controls & Quick tabs */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Award className="w-6 h-6 text-teal-600" />
                    LỊCH TRÌNH KHOA HỌC PHÂN PHÒNG SONG SONG
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Sơ đồ phân bố báo cáo y khoa theo Timeline Gantt chuyên sâu. Nhấp chọn nhanh vào bài báo cáo để xem tóm tắt học thuật (Abstract) và tiểu sử Báo cáo viên (Bio).
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
                    Lịch Trình Cá Nhân ({personalAgenda.length})
                  </button>
                </div>
              </div>

              {/* Day selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { date: '2026-12-11', title: 'NGÀY 1: 11/12/2026', subtitle: 'Trù bị & Đào tạo Hands-on' },
                  { date: '2026-12-12', title: 'NGÀY 2: 12/12/2026', subtitle: 'Khai mạc & Phiên toàn thể' },
                  { date: '2026-12-13', title: 'NGÀY 3: 13/12/2026', subtitle: 'Chuyên sâu & Bế mạc Đại hội' }
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

              {/* Search & Track Filters */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1.5 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Lọc chuyên đề:
                  </span>
                  {['All', 'Live Surgery', 'Hands-on', 'Hội nghị', 'Master Class'].map((track) => (
                    <button
                      key={track}
                      onClick={() => setSelectedTrackFilter(track)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedTrackFilter === track
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {track === 'All' ? 'Tất cả học phần' : track}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên bài báo cáo hoặc báo cáo viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sơ đồ phân bố Phòng / Hội trường */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-100/50 p-4 rounded-2xl border border-slate-200/40">
              {ROOMS_CONFIG.map((room) => (
                <div key={room.id} className="text-xs bg-white p-3 rounded-xl border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded font-black uppercase text-[10px] mb-1.5 ${room.tagBg}`}>
                      {room.vietnameseName}
                    </span>
                    <p className="font-bold text-slate-850 leading-tight">{room.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* MAIN TIMELINE CHART */}
            {(() => {
              // 1. Filter sessions
              const filteredSessions = sessions.filter((s) => {
                if (s.date !== selectedDate) return false;
                
                if (onlyMyAgenda && !personalAgenda.includes(s.id)) return false;

                if (selectedTrackFilter !== 'All' && s.track !== selectedTrackFilter) return false;

                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  return (
                    s.title.toLowerCase().includes(query) ||
                    s.speakerName.toLowerCase().includes(query) ||
                    s.description.toLowerCase().includes(query)
                  );
                }

                return true;
              });

              if (filteredSessions.length === 0) {
                return (
                  <div className="bg-white p-16 rounded-3xl border border-slate-150 text-center space-y-3">
                    <Info className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">Không tìm thấy bài báo cáo khoa học nào thỏa mãn bộ lọc.</p>
                    <p className="text-xs text-slate-400">Vui lòng thay đổi từ khóa, lọc chuyên đề hoặc tắt chế độ "Lịch trình cá nhân".</p>
                  </div>
                );
              }

              // 2. Identify all unique time slots for this day
              const daySessions = sessions.filter(s => s.date === selectedDate);
              const timeBlocksMap = new Map<string, string>();
              daySessions.forEach(s => {
                timeBlocksMap.set(s.startTime, s.endTime);
              });
              const sortedTimeBlocks = Array.from(timeBlocksMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

              // Helper check if time slot should be visible
              const hasVisibleSession = (startTime: string) => {
                return filteredSessions.some(s => s.startTime === startTime);
              };

              return (
                <div className="space-y-6">
                  {/* DESKTOP TIMELINE GANTT (Visible on MD screens and up) */}
                  <div className="hidden md:block bg-white border border-slate-205 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header bar of Room tracks */}
                    <div className="grid grid-cols-[115px_1fr_1fr_1fr_1fr] border-b border-slate-200 bg-slate-900 text-white font-extrabold text-xs text-center uppercase tracking-wider divide-x divide-slate-800 select-none">
                      <div className="p-4 bg-slate-950 text-slate-300 flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        GIỜ PHIÊN
                      </div>
                      {ROOMS_CONFIG.map((room) => (
                        <div key={room.id} className="p-4 flex flex-col justify-center items-center">
                          <span className="bg-white/10 text-teal-300 font-mono px-2 py-0.5 rounded text-[10px] mb-1">
                            {room.vietnameseName}
                          </span>
                          <span className="text-[10px] text-slate-300 font-medium leading-tight max-w-[160px] text-center normal-case">
                            {room.subtitle}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Timeline rows of blocks */}
                    <div className="divide-y divide-slate-150">
                      {sortedTimeBlocks.map(([startTime, endTime]) => {
                        if (!hasVisibleSession(startTime)) return null;

                        // Get all sessions inside this slot
                        const slots = daySessions.filter(s => s.startTime === startTime);
                        
                        const representative = slots[0];
                        const isGeneral = slots.length === 1 && (
                          (!representative.roomName.includes('Hội trường 1') &&
                           !representative.roomName.includes('Hội trường 2') &&
                           !representative.roomName.includes('Hội trường 3') &&
                           !representative.roomName.includes('Hội trường 4')) ||
                          representative.roomName.toLowerCase().includes('bàn check') ||
                          representative.roomName.toLowerCase().includes('ăn trưa') ||
                          representative.roomName.toLowerCase().includes('dinner') ||
                          representative.roomName.toLowerCase().includes('tiệc')
                        );

                        return (
                          <div key={startTime} className="grid grid-cols-[115px_1fr_1fr_1fr_1fr] divide-x divide-slate-150 items-stretch">
                            {/* Time Block Column */}
                            <div className="bg-slate-50 font-mono text-[11px] font-extrabold text-teal-900 flex flex-col items-center justify-center p-3">
                              <span className="px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 shadow-sm leading-none text-center">
                                {startTime} - {endTime}
                              </span>
                            </div>

                            {/* Session Contents columns */}
                            {isGeneral ? (
                              <div className="col-span-4 p-4 flex items-center justify-center min-h-[90px]">
                                {(() => {
                                  const isFilteredIn = filteredSessions.some(s => s.id === representative.id);
                                  if (!isFilteredIn) {
                                    return (
                                      <p className="text-xs text-slate-300 italic">Sảnh sinh hoạt chung bị ẩn bởi bộ lọc</p>
                                    );
                                  }

                                  const isBookmarked = personalAgenda.includes(representative.id);
                                  
                                  return (
                                    <div 
                                      onClick={() => setSelectedSessionDetail(representative)}
                                      className={`w-full max-w-4xl p-4 rounded-2xl border transition-all cursor-pointer text-center text-slate-800 bg-gradient-to-r from-teal-50/50 via-sky-50/30 to-indigo-50/50 border-teal-200 hover:scale-[1.012] hover:shadow-md hover:border-teal-300 relative group`}
                                    >
                                      {/* Star bookmark badge */}
                                      <button
                                        onClick={(e) => handleToggleBookmark(representative.id, e)}
                                        className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/60 text-amber-500 transition-all"
                                        title={isBookmarked ? "Xóa khỏi Lịch trình cá nhân" : "Lưu vào Lịch trình cá nhân"}
                                      >
                                        <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : 'text-slate-300 hover:text-amber-500'}`} />
                                      </button>

                                      <span className="inline-block px-2 py-0.5 rounded bg-teal-600/10 text-teal-800 font-bold text-[9px] uppercase tracking-widest mb-1 select-none">
                                        {representative.track}
                                      </span>
                                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-700 transition-all">
                                        {representative.title}
                                      </h4>
                                      <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto line-clamp-2">
                                        {representative.description}
                                      </p>
                                      
                                      <div className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-slate-100">
                                        <MapPin className="w-3 h-3 text-slate-405" />
                                        <span>Địa điểm chính: <strong>{representative.roomName}</strong></span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              // Render 4 parallel columns
                              [0, 1, 2, 3].map((colIndex) => {
                                const roomConfig = ROOMS_CONFIG[colIndex];
                                const currentSession = slots.find(s => s.roomName.includes(roomConfig.id));
                                
                                if (!currentSession) {
                                  return (
                                    <div key={colIndex} className="bg-slate-50/20 p-3 flex items-center justify-center select-none text-[9px] text-slate-350 font-mono uppercase tracking-wider relative min-h-[140px]">
                                      <div className="absolute inset-2 border border-dashed border-slate-205/65 rounded-xl" />
                                      Sẵn sàng sảnh
                                    </div>
                                  );
                                }

                                const isFilteredIn = filteredSessions.some(s => s.id === currentSession.id);
                                if (!isFilteredIn) {
                                  return (
                                    <div key={colIndex} className="bg-slate-50/20 p-3 flex items-center justify-center text-[10px] text-slate-300 italic select-none min-h-[140px]">
                                      Bị ẩn bởi bộ lọc
                                    </div>
                                  );
                                }

                                const isBookmarked = personalAgenda.includes(currentSession.id);

                                return (
                                  <div 
                                    key={colIndex}
                                    onClick={() => setSelectedSessionDetail(currentSession)}
                                    className={`p-4 hover:bg-slate-50/60 transition-all cursor-pointer flex flex-col justify-between min-h-[145px] relative group border-t-2 border-slate-100/50 ${
                                      isBookmarked ? 'bg-amber-50/40' : 'bg-white'
                                    }`}
                                  >
                                    {/* Star bookmark badge */}
                                    <button
                                      onClick={(e) => handleToggleBookmark(currentSession.id, e)}
                                      className="absolute right-3 top-3 p-1 rounded-full hover:bg-slate-100 text-amber-500 transition-all z-10"
                                      title={isBookmarked ? "Xóa khỏi Lịch trình cá nhân" : "Lưu vào Lịch trình cá nhân"}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
                                    </button>

                                    <div>
                                      {/* Track tag */}
                                      <div className="flex items-center gap-1.5 mb-1.5 select-none">
                                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                          currentSession.track === 'Live Surgery' ? 'bg-rose-50 text-rose-700' :
                                          currentSession.track === 'Hands-on' ? 'bg-indigo-50 text-indigo-700' :
                                          currentSession.track === 'Master Class' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
                                        }`}>
                                          {currentSession.track}
                                        </span>
                                      </div>

                                      <h4 className="font-extrabold text-slate-900 text-[13px] leading-snug group-hover:text-teal-700 transition-all line-clamp-3">
                                        {currentSession.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-550 mt-1 line-clamp-2">
                                        {currentSession.description}
                                      </p>
                                    </div>

                                    {/* Speaker identity card */}
                                    <div className="flex items-center gap-2 border-t border-slate-100 pt-2 mt-3 select-none">
                                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-extrabold text-[9px] shrink-0 shadow-sm">
                                        {currentSession.speakerName.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                                          {currentSession.speakerName}
                                        </p>
                                        <p className="text-[8.5px] text-slate-450 truncate leading-none mt-0.5">
                                          {currentSession.speakerTitle}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* MOBILE RESPONSIVE TIMELINE LIST (Visible only on small viewports) */}
                  <div className="block md:hidden space-y-4">
                    <p className="text-slate-500 font-black text-[10px] tracking-wider uppercase mb-2 select-none">
                      📱 Hiển thị theo Chuỗi ký tự Thời gian lũy tiến
                    </p>
                    {filteredSessions.map((session) => {
                      const isBookmarked = personalAgenda.includes(session.id);
                      const matchingRoom = ROOMS_CONFIG.find(r => session.roomName.includes(r.id));
                      
                      return (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSessionDetail(session)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                            isBookmarked 
                              ? 'bg-amber-50/50 border-amber-300 shadow-xs' 
                              : 'bg-white border-slate-150 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          {/* Star bookmark badge */}
                          <button
                            onClick={(e) => handleToggleBookmark(session.id, e)}
                            className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 text-amber-500 transition-all"
                          >
                            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : 'text-slate-400'}`} />
                          </button>

                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] font-black text-teal-850 bg-teal-50 px-2.5 py-1 rounded-md">
                                {session.startTime} - {session.endTime}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                session.track === 'Live Surgery' ? 'bg-rose-50 text-rose-700' :
                                session.track === 'Hands-on' ? 'bg-indigo-50 text-indigo-700' :
                                session.track === 'Master Class' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
                              }`}>
                                {session.track}
                              </span>
                              {matchingRoom ? (
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${matchingRoom.tagBg}`}>
                                  {matchingRoom.vietnameseName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase bg-slate-100 text-slate-500">
                                  Hội trường lớn
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {session.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1">
                                {session.description}
                              </p>
                            </div>

                            {matchingRoom && (
                              <p className="text-[10px] text-slate-450 italic mt-1 leading-none">
                                Chuyên đề: {matchingRoom.subtitle}
                              </p>
                            )}

                            <div className="flex items-center gap-2.5 pt-2.5 border-t border-slate-100">
                              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-extrabold text-[10px] shrink-0">
                                {session.speakerName.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 leading-tight">
                                  {session.speakerName}
                                </p>
                                <p className="text-[10px] text-slate-450 leading-none mt-0.5 font-medium">
                                  {session.speakerTitle}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'sponsors' && (
          <div className="space-y-12">
            {/* Gói đăng ký */}
            <div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-2 uppercase tracking-tight">HƯỚNG DẪN ĐĂNG KÝ & BIỂU PHÍ THAM DỰ HỘI NGHỊ</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Lựa chọn các hạng mục đăng ký tối ưu được Ban Chấp Hành hội PARS 2026 phê chuẩn chính thức</p>

              {/* Official Pricing Guideline Table */}
              <div className="bg-white rounded-2xl border border-slate-205 shadow-md overflow-hidden p-6 mb-10 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="bg-teal-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">INFO</span>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Bảng Biểu Phí Đăng Ký Hệ Thống Năm 2026</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-950 font-bold border-b border-slate-200">
                        <th className="p-3 text-left">Hạng Mục Phí Đăng Ký</th>
                        <th className="p-3">Trước 10/11/2026 (Ưu đãi)</th>
                        <th className="p-3">Từ 10/11/2026 đến Hội Nghị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Thành viên HPASS/HSPAS/PARS</td>
                        <td className="p-3 text-teal-700 font-bold font-mono">2,500,000 ₫</td>
                        <td className="p-3 text-slate-600 font-mono">3,000,000 ₫</td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="p-3 font-semibold text-slate-900">Không phải Hội viên</td>
                        <td className="p-3 text-teal-700 font-bold font-mono">3,000,000 ₫</td>
                        <td className="p-3 text-slate-600 font-mono">3,500,000 ₫</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Học viên chuyên ngành PTTM</td>
                        <td className="p-3 text-teal-700 font-bold font-mono">1,000,000 ₫</td>
                        <td className="p-3 text-slate-600 font-mono">1,500,000 ₫</td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="p-3 font-semibold text-slate-900">BS Nước ngoài (Foreign Doctor)</td>
                        <td className="p-3 text-teal-700 font-bold font-mono">$150 (3,750,000 ₫)</td>
                        <td className="p-3 text-slate-600 font-mono">$200 (5,000,000 ₫)</td>
                      </tr>
                      <tr className="border-t border-slate-300">
                        <td className="p-3 font-semibold text-slate-900">Chương trình CME</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">350,000 ₫</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">350,000 ₫</td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="p-3 font-semibold text-slate-900">Tiệc tối Gala Dinner</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">700,000 ₫</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">700,000 ₫</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Chuyên đề Master class</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">500,000 ₫</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">500,000 ₫</td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="p-3 font-semibold text-slate-900">Hành trình Tour tham quan</td>
                        <td className="p-3 text-teal-700 font-mono font-bold">4,500,000 ₫</td>
                        <td className="p-3 text-rose-650 font-mono font-bold">5,000,000 ₫</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-teal-50/50 p-4 rounded-xl text-teal-900 text-[11px] leading-relaxed space-y-1">
                  <p>• <strong>Miễn phí tham dự</strong> đối với Chủ tọa và Báo cáo viên của phiên hội đồng.</p>
                  <p>• <strong>Miễn trừ hoàn phí:</strong> Toàn bộ đăng ký là chính thức và Ban tổ chức <strong>không hoàn lại phí đăng ký</strong> dưới mọi hình thức tự hủy.</p>
                  <p>• <strong>Thông tin chuyển khoản:</strong> Đại biểu chuyển khoản quét VietQR trên hóa đơn sau khi hoàn thành điền phiếu đăng ký.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => {
                  const today = new Date();
                  const targetDate = new Date('2026-11-10');
                  const isPost = today >= targetDate;
                  
                  let feeDisplay = '';
                  if (pkg.id === 'pkg-free') {
                    feeDisplay = 'Miễn Phí';
                  } else {
                    const PRICING = {
                      'pkg-member': isPost ? 3000000 : 2500000,
                      'pkg-standard': isPost ? 3500000 : 3000000,
                      'pkg-student': isPost ? 1500000 : 1000000,
                      'pkg-foreign': isPost ? 5000000 : 3750000,
                    };
                    const fee = PRICING[pkg.id as keyof typeof PRICING] ?? pkg.fee;
                    if (pkg.id === 'pkg-foreign') {
                      feeDisplay = isPost ? `$200 (${fee.toLocaleString('vi-VN')} VNĐ)` : `$150 (${fee.toLocaleString('vi-VN')} VNĐ)`;
                    } else {
                      feeDisplay = `${fee.toLocaleString('vi-VN')} VNĐ`;
                    }
                  }

                  return (
                    <div key={pkg.id} className={`bg-white rounded-2xl border ${pkg.id === 'pkg-standard' ? 'border-2 border-teal-500 shadow-xl relative' : 'border-slate-100 shadow-md'} overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg`}>
                      {pkg.id === 'pkg-standard' && (
                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          Khuyên Dùng
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        <span className="text-[9px] font-bold text-teal-600 tracking-wider uppercase bg-teal-50 px-2 py-0.5 rounded mb-2 inline-block">Category Package</span>
                        <h4 className="font-extrabold text-slate-900 text-md leading-snug mb-2">{pkg.name}</h4>
                        <div className="text-xl font-black text-slate-950 mb-4 border-b border-dashed border-slate-100 pb-3">
                          {feeDisplay}
                        </div>

                      <ul className="space-y-3">
                        {pkg.benefits.map((benefit, i) => (
                          <li key={i} className="text-xs text-slate-600 flex gap-2">
                            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => onNavigate('register-delegate')}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${pkg.id === 'pkg-standard' ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                      >
                        Đăng Ký {pkg.name.replace('Gói ', '')}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* Dịch vụ Tự chọn thêm cho Đại biểu */}
            <div className="bg-amber-50/40 rounded-3xl border border-amber-200/50 p-6 flex flex-col md:flex-row items-center gap-6 justify-between shadow-sm">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded tracking-wider">Học phần dịch vụ bổ sung tự chọn</span>
                <h4 className="text-base font-black text-slate-900 uppercase">Tùy Chọn Đăng Ký Cấp CME, GALA DINNER, MASTERCLASS & TOUR</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Bảng giá tự chọn linh hoạt cho phép đại biểu đính kèm hoặc bổ sung dịch vụ phù hợp với nhu cầu công việc của từng cá nhân:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-white rounded-2xl border border-amber-100/60 shadow-inner">
                    <span className="font-extrabold text-xs text-slate-850 block">✓ Đăng ký Chứng chỉ CME đào tạo:</span>
                    <span className="text-[11px] text-slate-500 font-medium">Phụ thu: <strong className="text-teal-700 font-mono">350.000 VNĐ</strong> / Đại biểu</span>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-amber-100/60 shadow-inner">
                    <span className="font-extrabold text-xs text-slate-850 block">✓ Tham dự bữa tiệc Gala Dinner:</span>
                    <span className="text-[11px] text-slate-500 font-medium">Phụ thu: <strong className="text-amber-700 font-mono">700.000 VNĐ</strong> / Đại biểu</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('register-delegate')}
                className="px-5 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow shrink-0 whitespace-nowrap cursor-pointer transition-all"
              >
                Mở Form Đăng Ký Ngay ⚡
              </button>
            </div>

            {/* CTA Đăng ký tài trợ Doanh Nghiệp */}
            <div className="bg-gradient-to-r from-teal-900 to-indigo-950 p-8 rounded-3xl border border-teal-500/20 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.1),transparent)]" />
              <div className="space-y-2 relative z-10 max-w-xl text-center md:text-left">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest font-mono">PARS 2026 PARTNER OPPORTUNITIES</span>
                <h4 className="text-xl font-black uppercase">Đồng Hành Phát Triển Cùng Hội Nghị PARS 2026</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Trở thành đối tác vinh danh chính thức tại sảnh khoa học, khai thác quyền trưng bày quảng nghị và tiếp cận trực tiếp mạng lưới hàng vạn y bác sĩ toàn quốc.
                </p>
              </div>
              <button
                onClick={() => onNavigate('register-sponsor')}
                className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 rounded-2xl text-xs font-black uppercase text-white shadow-md hover:shadow-teal-500/10 transition-all shrink-0 relative z-10 border-none cursor-pointer flex items-center gap-2"
              >
                <HeartHandshake className="w-4 h-4" />
                Đăng Ký Tài Trợ Ngay
              </button>
            </div>

            {/* Đồng hành của doanh tài trợ */}
            <div className="border-t border-slate-205 pt-12">
              <h3 className="text-xl font-bold text-slate-900 text-center mb-6 uppercase tracking-wider">Doanh nghiệp Đồng Hành Tài Trợ</h3>
              
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                {sponsors.map(sponsor => (
                  <div key={sponsor.id} className="text-center group">
                    <div className="px-6 py-4 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-teal-300 transition-all flex items-center justify-center min-h-[70px] min-w-[160px] cursor-pointer">
                      <span className="font-black text-slate-700 text-sm tracking-tight capitalize group-hover:text-teal-700 transition-all">
                        {sponsor.name.split(' ').slice(0, 3).join(' ')}
                      </span>
                    </div>
                    <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      sponsor.tier === 'platinum' ? 'bg-indigo-50 text-indigo-700' :
                      sponsor.tier === 'gold' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sponsor.tier} Sponsor
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACADEMIC ABSTRACT & BIO DETAIL DIALOG POPUP */}
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
                  className="absolute right-4 top-4 text-slate-400 hover:text-white transition-all p-1 rounded-full hover:bg-white/10"
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
                  <div className="w-10 h-10 rounded-full bg-teal-800 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
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
                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-all border-b-2 outline-none ${
                    modalTab === 'abstract'
                      ? 'border-teal-600 text-teal-800 bg-teal-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  Tóm Tắt Đề Tài (Abstract)
                </button>
                <button
                  onClick={() => setModalTab('bio')}
                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-all border-b-2 outline-none ${
                    modalTab === 'bio'
                      ? 'border-teal-600 text-teal-800 bg-teal-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  Tiểu Sử Báo Cáo Viên (Bio)
                </button>
              </div>

              {/* Dynamic scrollable body content */}
              <div className="p-6 overflow-y-auto text-sm leading-relaxed text-slate-700 flex-1 bg-slate-50/30 animate-fade-in">
                {modalTab === 'abstract' ? (
                  <div className="space-y-4 font-sans">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold uppercase tracking-wider bg-indigo-50 w-fit px-2.5 py-1 rounded">
                      <FileText className="w-3.5 h-3.5" />
                      Công bố học thuật chính thức
                    </div>
                    {/* Render split paragraphs for clean aesthetics */}
                    <div className="whitespace-pre-line text-slate-800 text-justify text-[13px] bg-white p-4 rounded-2xl border border-slate-100 shadow-xs leading-relaxed">
                      {enrichment.abstract}
                    </div>
                    <div className="flex items-start gap-2 bg-slate-100/55 p-3.5 rounded-xl border border-slate-205/50 text-xs text-slate-500">
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Ý kiến phản hồi lâm sàng, phản biện khoa học toàn quốc hoặc hồ sơ câu hỏi tiếp dẫn trực tiếp có thể gửi về email ban tổ chức để chuẩn bị trước tọa đàm.</span>
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
                      <p className="text-xs text-teal-700 font-semibold italic bg-teal-50/30 px-2 py-1 rounded border border-teal-100/40">
                        Chức danh: {selectedSessionDetail.speakerTitle}
                      </p>
                      <div className="whitespace-pre-line text-slate-750 text-justify text-[13px] pt-1">
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
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Footer space */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800 text-center text-sm">
        <div className="max-w-6xl mx-auto space-y-4">
          <p className="font-bold text-white tracking-widest text-base">PARS 2026 EVENT MANAGEMENT</p>
          <p>Hội nghị Khoa học thường niên Hiệp hội Phẫu thuật Thẩm mỹ Y khoa Việt Nam</p>
          <p className="text-xs text-slate-600">Bản quyền thuộc về PARS © 2026. Phục vụ quản trị và hoạt động y học chính xác.</p>
        </div>
      </footer>
    </div>
  );
}
