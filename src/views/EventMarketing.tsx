/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Share2, Send, Video, TrendingUp, Users, Eye, Sparkles, Plus, Trash2, 
  Settings, CheckCircle2, Calendar, AlertTriangle, FileText, 
  Facebook, Play, Link, ExternalLink, RefreshCw, BarChart2, Loader2
} from 'lucide-react';
import { MarketingPost } from '../types';
import { store } from '../dataStore';

interface EventMarketingProps {
  role: string;
}

const AUDIENCES = [
  { id: 'doctors', name: 'Bác sĩ & Chuyên gia Y tế' },
  { id: 'spa_owners', name: 'Chủ Spa & Clinic Thẩm mỹ' },
  { id: 'general', name: 'Đại biểu & Công chúng quan tâm' }
];

const TOPICS = [
  { id: 'masterclass', name: 'Khóa học Thực chiến Masterclass' },
  { id: 'gala', name: 'Đêm Gala Dinner & Giao lưu Nghệ thuật' },
  { id: 'keynote', name: 'Phiên Báo cáo Chuyên đề Laser & Thiết bị năng lượng' },
  { id: 'early_bird', name: 'Ưu đãi đăng ký sớm (Early Bird)' }
];

export default function EventMarketing({ role }: EventMarketingProps) {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'news_feed' | 'video' | 'channels'>('all');
  
  // Channels simulated connection status
  const [channels, setChannels] = useState({
    facebook: true,
    zalo: true,
    tiktok: false,
    youtube: false
  });

  // News Feed Editor Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsMediaUrl, setNewsMediaUrl] = useState('');
  const [newsPlatforms, setNewsPlatforms] = useState<string[]>(['facebook', 'zalo']);
  const [newsAudience, setNewsAudience] = useState('doctors');
  const [newsTopic, setNewsTopic] = useState('masterclass');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Shorts Script Editor Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoHook, setVideoHook] = useState('');
  const [videoBody, setVideoBody] = useState('');
  const [videoCta, setVideoCta] = useState('');
  const [videoPlatforms, setVideoPlatforms] = useState<string[]>(['tiktok', 'youtube']);
  const [videoTopic, setVideoTopic] = useState('masterclass');
  const [isGeneratingVideoAI, setIsGeneratingVideoAI] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
    // Listen to store updates
    const handleStoreUpdate = (e: any) => {
      if (e.detail && e.detail.table === 'marketing_posts') {
        loadData();
      }
    };
    window.addEventListener('store-updated', handleStoreUpdate);
    return () => window.removeEventListener('store-updated', handleStoreUpdate);
  }, []);

  const loadData = () => {
    const data = store.getMarketingPosts();
    // Sort by created_at descending
    const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPosts(sorted);
    setLoading(false);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // AI Content Generator Mock Logic
  const handleGenerateAIContent = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      let title = '';
      let content = '';
      const selectedAudience = AUDIENCES.find(a => a.id === newsAudience)?.name || '';
      
      if (newsTopic === 'masterclass') {
        title = '🔥 Đăng Ký Khoá Học Masterclass Vùng Mặt PARS 2026';
        content = `Kính gửi quý đồng nghiệp là ${selectedAudience},\n\n` +
          `Nhằm cập nhật những xu hướng thẩm mỹ nội khoa mới nhất, Hội Phẫu thuật Tạo hình Thẩm mỹ Việt Nam tổ chức khoá học đào tạo liên tục đặc biệt: MASTERCLASS 2026.\n\n` +
          `💡 NỘI DUNG CHƯƠNG TRÌNH:\n` +
          `• Trực quan mổ xẻ trên xác tươi (Cadaveric Dissection).\n` +
          `• Kỹ thuật tiêm chất làm đầy (Filler) & Tái cấu trúc sinh học không phẫu thuật.\n` +
          `• Phòng tránh và xử lý tai biến chuyên sâu.\n\n` +
          `👨‍⚕️ CHỦ TỌA & GIẢNG VIÊN: GS.TS.BS Phạm Minh Chi và các chuyên gia quốc tế hàng đầu từ Hàn Quốc, Mỹ.\n` +
          `📅 Thời gian: Ngày 14/11/2026\n` +
          `📍 Địa điểm: Phòng Lab ĐH Y Dược Hà Nội.\n\n` +
          `👉 Số lượng chỗ ngồi giới hạn để đảm bảo chất lượng Hand-on trực tiếp. Đăng ký ngay hôm nay để nhận chứng chỉ CME uy tín từ BTC PARS 2026!`;
      } else if (newsTopic === 'gala') {
        title = '✨ Đêm Nhạc Hội Gala Dinner - Tinh Hoa Hội Tụ PARS 2026';
        content = `Chào đón quý đại biểu và đối tác thuộc nhóm ${selectedAudience},\n\n` +
          `Không chỉ là nơi trao đổi khoa học đỉnh cao, PARS 2026 còn mang đến không gian kết nối giao lưu văn hoá, nghệ thuật ấm cúng và sang trọng qua đêm tiệc Gala Dinner.\n\n` +
          `🎭 ĐIỂM NHẤN ĐẶC BIỆT:\n` +
          `• Trình diễn nghệ thuật ánh sáng và âm nhạc truyền thống kết hợp hiện đại.\n` +
          `• Thưởng thức ẩm thực 5 sao kết tinh văn hóa ba miền.\n` +
          `• Cơ hội networking trực tiếp cùng hơn 500 bác sĩ đầu ngành và doanh nghiệp thẩm mỹ tên tuổi.\n\n` +
          `📅 Thời gian: 19:30 - Ngày 15/11/2026\n` +
          `📍 Địa điểm: Grand Ballroom, Khách sạn Marriott Hà Nội.\n\n` +
          `🎟️ Vé Gala đã được mở bán kèm gói Đại biểu VIP. Hãy chuẩn bị những trang phục dạ tiệc lộng lẫy nhất để toả sáng cùng PARS 2026!`;
      } else if (newsTopic === 'keynote') {
        title = '⚡ Cập nhật Công nghệ Laser & Thiết bị năng lượng tại PARS 2026';
        content = `Kính gửi ${selectedAudience},\n\n` +
          `Phiên báo cáo chuyên đề thu hút sự quan tâm lớn nhất tại PARS 2026 chính thức lộ diện. Hàng loạt báo cáo lâm sàng và trình diễn công nghệ EBD (Energy Based Devices) thế hệ mới nhất.\n\n` +
          `🔬 CHỦ ĐỀ NỔI BẬT:\n` +
          `1. Xu hướng phối hợp Laser Picosecond và RF siêu vi điểm trong trẻ hóa da.\n` +
          `2. Trị nám má Melasma đa tầng: Tiếp cận an toàn dưới góc nhìn da liễu thẩm mỹ.\n` +
          `3. Thực hành an toàn bức xạ và phòng tránh tai biến năng lượng.\n\n` +
          `🎤 Diễn giả trình bày: TS.BS Nguyễn Văn An, PGS.TS.BS Lê Thị Bình cùng 3 giáo sư thỉnh giảng đến từ châu Âu.\n\n` +
          `📌 Hãy lưu lại lịch trình chi tiết và ghé thăm khu trưng bày thiết bị công nghệ cao để trực tiếp trải nghiệm thiết bị thực tế!`;
      } else {
        title = '⏰ Cơ Hội Cuối Cùng Nhận Ưu Đãi Đăng Ký Sớm (Early Bird)';
        content = `Thông báo gửi tới toàn thể quý đại biểu và ${selectedAudience},\n\n` +
          `Chỉ còn 3 ngày duy nhất để quý bác sĩ và đơn vị đăng ký tham gia PARS 2026 với biểu phí Early Bird giảm ngay 20% trên giá gốc.\n\n` +
          `🎁 QUYỀN LỢI THAM DỰ:\n` +
          `• Tiếp cận hơn 80 bài báo cáo khoa học xuất sắc.\n` +
          `• Nhận bộ tài liệu y khoa chính thống & quà tặng từ các nhà tài trợ.\n` +
          `• Cấp chứng nhận đào tạo liên tục (CME) lên tới 24 tiết học.\n\n` +
          `Đăng ký trực tiếp tại link: https://pars2026.vercel.app/register-delegate\n\n` +
          `Đừng bỏ lỡ ngày hội thẩm mỹ lớn nhất năm với chi phí tối ưu nhất!`;
      }

      setNewsTitle(title);
      setNewsContent(content);
      setIsGeneratingAI(false);
      showToast('Tạo nội dung marketing bằng AI hoàn tất!', 'success');
    }, 1200);
  };

  // AI Video Script Generator Mock Logic
  const handleGenerateVideoAI = () => {
    setIsGeneratingVideoAI(true);
    setTimeout(() => {
      let hook = '';
      let body = '';
      let cta = '';
      let title = '';

      if (videoTopic === 'masterclass') {
        title = 'Kịch bản Shorts: Thực hành xác tươi Masterclass';
        hook = '❓ [0-5s Visual: Cận cảnh bác sĩ đang thực hiện thủ thuật chỉ khâu trên mô hình] Bạn có dám tiêm filler vùng thái dương khi chưa nắm rõ giải phẫu mạch máu?';
        body = '🔬 [5-45s Visual: Cận cảnh lớp học Cadaver Lab, giáo sư đang hướng dẫn từng nhóm học viên] Đây là lý do tại sao khóa học Cadaver Masterclass tại PARS 2026 luôn cháy vé. Học viên được trực tiếp phẫu tích trên xác tươi dưới sự chỉ dẫn của các chuyên gia hàng đầu. Từng đường đi của bó mạch thái dương, mạch mặt được hiển thị rõ ràng, giúp bạn tự tin làm chủ mọi ca tiêm chất làm đầy mà không sợ biến chứng tắc mạch.';
        cta = '👉 [45-60s Visual: Slide thông tin đăng ký với mã QR] Bấm ngay vào liên kết bên dưới để đăng ký giữ chỗ. Chỉ còn 5 suất cuối cùng cho lớp học thực chiến Cadaveric Lab năm nay!';
      } else if (videoTopic === 'gala') {
        title = 'Kịch bản Shorts: Đêm Gala hoành tráng Marriott';
        hook = '❓ [0-5s Visual: Đèn sân khấu vụt sáng, ly champagne được nâng lên] Bạn đã sẵn sàng cho đêm tiệc sang trọng bậc nhất ngành thẩm mỹ năm nay chưa?';
        body = '💃 [5-45s Visual: Khách mời mặc đầm dạ hội lộng lẫy check-in thảm đỏ, không gian tiệc Marriott ngập tràn ánh sáng] Gala Dinner PARS 2026 không chỉ là một bữa tiệc. Đây là đêm thăng hoa của nghệ thuật, âm nhạc và cơ hội kết nối giao thương trực tiếp với hàng trăm giáo sư, bác sĩ thẩm mỹ uy tín trong nước và quốc tế. Một ly rượu giao lưu kết nối, mở ra hàng ngàn cơ hội hợp tác mới cho clinic của bạn.';
        cta = '✨ [45-60s Visual: Banner Gala Dinner PARS 2026] Hãy chuẩn bị trang phục dạ hội đẹp nhất và sở hữu ngay tấm vé VIP để cùng bùng nổ trong đêm Gala Dinner PARS 2026!';
      } else if (videoTopic === 'keynote') {
        title = 'Kịch bản Shorts: Xu hướng thiết bị Laser mới';
        hook = '❓ [0-5s Visual: Tia laser quét nhẹ trên bề mặt da thủy tinh] Công nghệ Laser Picosecond nào đang thống trị thị trường thẩm mỹ thế giới năm nay?';
        body = '⚡ [5-45s Visual: Báo cáo viên trình bày slide nghiên cứu so sánh lâm sàng, đại biểu chăm chú ghi chép] Tất cả sẽ được tiết lộ tại phiên báo cáo chuyên đề thiết bị năng lượng của PARS 2026. Hơn 10 báo cáo lâm sàng thực chiến chứng minh hiệu quả phối hợp đa tầng Laser và sóng RF siêu vi điểm giúp nâng cơ trẻ hóa không xâm lấn. Không quảng cáo sáo rỗng, chỉ có khoa học bằng chứng thực tế.';
        cta = '📅 [45-60s Visual: Ngày hội khoa học 14-15/11 Hà Nội] Follow kênh để cập nhật lịch trình khoa học chi tiết nhất của hội nghị thẩm mỹ PARS 2026!';
      } else {
        title = 'Kịch bản Shorts: Đếm ngược ưu đãi đăng ký sớm';
        hook = '⚠️ [0-5s Visual: Đồng hồ cát đang chảy, chữ "-20% Early Bird" nhấp nháy] Ngừng lướt điện thoại lại 3 giây nếu bạn không muốn bỏ lỡ deal hời nhất năm!';
        body = '💸 [5-45s Visual: Các bác sĩ đang quét QR check-in nhận vé, giao diện form đăng ký chạy mượt] Cổng đăng ký Early Bird của Hội nghị Khoa học Thẩm mỹ thường niên PARS 2026 sẽ đóng lại trong 24 giờ tới. Đăng ký sớm giúp bạn tiết kiệm ngay 20% biểu phí tham dự. Vừa nhận CME đào tạo liên tục, vừa tiếp cận 80 báo cáo khoa học, vừa được nhận quà tặng xịn từ Ban Tổ Chức.';
        cta = '👉 [45-60s Visual: Nút đăng ký trên màn hình điện thoại] Link đăng ký ngay ở bio của kênh. Bấm ngay kẻo lỡ giá hời bác sĩ ơi!';
      }

      setVideoTitle(title);
      setVideoHook(hook);
      setVideoBody(body);
      setVideoCta(cta);
      setIsGeneratingVideoAI(false);
      showToast('Tạo kịch bản video ngắn bằng AI hoàn tất!', 'success');
    }, 1200);
  };

  // Create & Publish Post
  const handleSavePost = (publishImmediately: boolean, type: 'news_feed' | 'video_short') => {
    let title = type === 'news_feed' ? newsTitle : videoTitle;
    let content = type === 'news_feed' ? newsContent : '';
    let platforms = type === 'news_feed' ? newsPlatforms : videoPlatforms;
    let mediaUrl = type === 'news_feed' ? newsMediaUrl : '';
    let videoScript = type === 'video_short' ? `${videoHook}\n\n${videoBody}\n\n${videoCta}` : '';

    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài đăng!', 'error');
      return;
    }

    if (type === 'news_feed' && !content.trim()) {
      showToast('Vui lòng nhập nội dung bài viết!', 'error');
      return;
    }

    if (type === 'video_short' && !videoBody.trim()) {
      showToast('Vui lòng nhập nội dung kịch bản video!', 'error');
      return;
    }

    if (platforms.length === 0) {
      showToast('Vui lòng chọn ít nhất một nền tảng đăng tải!', 'error');
      return;
    }

    // Check configuration status of channels
    const missingChannels = platforms.filter(p => !channels[p as keyof typeof channels]);
    if (publishImmediately && missingChannels.length > 0) {
      showToast(`Không thể đăng tự động. Vui lòng bật liên kết kênh cho các nền tảng: ${missingChannels.join(', ').toUpperCase()}`, 'error');
      return;
    }

    const newPost: MarketingPost = {
      id: 'MP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      title,
      content,
      type,
      platforms,
      status: publishImmediately ? 'published' : 'draft',
      createdAt: new Date().toISOString(),
      mediaUrl: mediaUrl || undefined,
      videoScript: videoScript || undefined
    };

    if (publishImmediately) {
      newPost.publishedAt = new Date().toISOString();
      // Generate simulated reach metrics
      newPost.metrics = {
        reach: Math.floor(Math.random() * 12000) + 1500,
        likes: Math.floor(Math.random() * 650) + 40,
        shares: Math.floor(Math.random() * 80) + 5,
        comments: Math.floor(Math.random() * 120) + 3,
        views: type === 'video_short' ? Math.floor(Math.random() * 8000) + 500 : undefined
      };
    }

    try {
      store.saveMarketingPost(newPost);
      showToast(publishImmediately ? 'Đăng tin thành công và tự động đồng bộ lên mạng xã hội!' : 'Đã lưu bài viết vào nháp thành công!');
      
      // Reset Forms
      if (type === 'news_feed') {
        setNewsTitle('');
        setNewsContent('');
        setNewsMediaUrl('');
      } else {
        setVideoTitle('');
        setVideoHook('');
        setVideoBody('');
        setVideoCta('');
      }
      loadData();
    } catch (e) {
      console.error(e);
      showToast('Lỗi lưu bài viết marketing', 'error');
    }
  };

  // Delete Marketing Post
  const handleDeletePost = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng marketing này?')) {
      try {
        store.deleteMarketingPost(id);
        showToast('Đã xóa bài viết marketing.');
        loadData();
      } catch (e) {
        showToast('Lỗi khi xóa bài viết', 'error');
      }
    }
  };

  // Connect / Disconnect Channel Simulation
  const handleToggleChannel = (key: keyof typeof channels) => {
    setChannels(prev => {
      const newVal = !prev[key];
      showToast(`${newVal ? 'Liên kết thành công' : 'Đã hủy liên kết'} kênh ${String(key).toUpperCase()}`);
      return { ...prev, [key]: newVal };
    });
  };

  // Calculate overall metrics
  const totalReach = posts.reduce((sum, p) => sum + (p.metrics?.reach || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
  const totalEngagement = totalLikes + totalComments;
  const avgEngagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'news_feed') return p.type === 'news_feed';
    if (activeTab === 'video') return p.type === 'video_short';
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 border text-xs font-semibold animate-bounce ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500 text-white border-emerald-600' 
            : 'bg-rose-500 text-white border-rose-600'
        }`}>
          <span>{actionMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border border-indigo-900/30">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pointer-events-none">
          <Share2 className="w-80 h-80 -mr-16 -mb-16" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase tracking-widest">
                Phân hệ nghiệp vụ mới
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight">Marketing Sự Kiện</h1>
            <p className="text-xs text-indigo-200/70 mt-1 max-w-xl">
              Biên soạn tin tức truyền thông, soạn thảo kịch bản video ngắn bằng AI và cấu hình phát tin tự động lên mạng xã hội để quảng bá Hội nghị PARS 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reach Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 text-slate-100 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <Users className="w-16 h-16" />
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiếp cận</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{totalReach.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12.5% vs tuần trước
            </p>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 text-slate-100 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <BarChart2 className="w-16 h-16" />
          </div>
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
            <BarChart2 className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ tương tác</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{avgEngagementRate}%</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +1.8% vs trung bình ngành
            </p>
          </div>
        </div>

        {/* Video Views Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 text-slate-100 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <Eye className="w-16 h-16" />
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Eye className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lượt xem Video</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{totalViews.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
              Simulated views trên TikTok & Shorts
            </p>
          </div>
        </div>

        {/* Connected Channels Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 text-slate-100 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <Settings className="w-16 h-16" />
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kênh liên kết</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {Object.values(channels).filter(Boolean).length}/4 Kênh
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Auto-posting status active
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'all' ? 'border-indigo-650 text-indigo-650' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Tất cả bài đăng
        </button>
        <button
          onClick={() => setActiveTab('news_feed')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'news_feed' ? 'border-indigo-650 text-indigo-650' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Soạn tin News Feed
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'video' ? 'border-indigo-650 text-indigo-650' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Kịch bản Video ngắn
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'channels' ? 'border-indigo-650 text-indigo-650' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Kênh liên kết ({Object.values(channels).filter(Boolean).length})
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Bài Đăng Gần Đây ({filteredPosts.length})</h2>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Share2 className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-600 mt-4 text-xs">Không có bài viết marketing nào</h4>
              <p className="text-[10px] mt-1">Bắt đầu tạo bài đăng News Feed hoặc Kịch bản Video ngắn để quảng bá sự kiện.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-shadow duration-300 relative"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        post.type === 'news_feed' ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {post.type === 'news_feed' ? 'News Feed' : 'Shorts Video'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {post.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                        </span>
                        
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-0 cursor-pointer"
                          title="Xoá bài"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-slate-800 text-xs mt-3 leading-snug">{post.title}</h3>

                    {/* Content Preview */}
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {post.type === 'news_feed' ? post.content : post.videoScript}
                    </p>

                    {/* Platforms tag */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.platforms.map(plat => (
                        <span key={plat} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-bold uppercase">
                          {plat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer - Analytics metrics */}
                  <div className="border-t border-slate-100 mt-4 pt-3">
                    {post.status === 'published' && post.metrics ? (
                      <div className="grid grid-cols-4 gap-2 text-center text-slate-550">
                        <div>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase">Reach</span>
                          <strong className="text-xs text-slate-700">{(post.metrics.reach || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase">Thích</span>
                          <strong className="text-xs text-slate-700">{(post.metrics.likes || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase">Chia sẻ</span>
                          <strong className="text-xs text-slate-700">{(post.metrics.shares || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase">
                            {post.type === 'video_short' ? 'Views' : 'Bình luận'}
                          </span>
                          <strong className="text-xs text-slate-700">
                            {post.type === 'video_short' 
                              ? (post.metrics.views || 0).toLocaleString() 
                              : (post.metrics.comments || 0).toLocaleString()
                            }
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Lưu vào nháp lúc: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                        {/* Publish draft button */}
                        <button
                          onClick={() => {
                            post.status = 'published';
                            post.publishedAt = new Date().toISOString();
                            post.metrics = {
                              reach: Math.floor(Math.random() * 8000) + 1200,
                              likes: Math.floor(Math.random() * 450) + 20,
                              shares: Math.floor(Math.random() * 50) + 2,
                              comments: Math.floor(Math.random() * 80) + 1,
                              views: post.type === 'video_short' ? Math.floor(Math.random() * 6000) + 300 : undefined
                            };
                            store.saveMarketingPost(post);
                            showToast('Đã đăng tự động bài viết marketing!');
                            loadData();
                          }}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold border-0 cursor-pointer"
                        >
                          Đăng ngay
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'news_feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-650" /> Trình soạn bài viết News Feed
            </h2>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiêu đề bài đăng *</label>
              <input
                type="text"
                placeholder="Ví dụ: Đăng ký vé sớm hội nghị thẩm mỹ PARS 2026..."
                value={newsTitle}
                onChange={e => setNewsTitle(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nội dung bài viết *</label>
              <textarea
                placeholder="Nhập nội dung tiếp thị chi tiết..."
                value={newsContent}
                onChange={e => setNewsContent(e.target.value)}
                rows={8}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đăng tải lên kênh *</label>
                <div className="flex gap-2">
                  {['facebook', 'zalo'].map(plat => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        setNewsPlatforms(prev => 
                          prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
                        );
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        newsPlatforms.includes(plat)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hình ảnh đính kèm (Media Link URL)</label>
                <input
                  type="text"
                  placeholder="https://imgur.com/example.png"
                  value={newsMediaUrl}
                  onChange={e => setNewsMediaUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSavePost(false, 'news_feed')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 bg-white cursor-pointer"
              >
                Lưu nháp
              </button>
              
              <button
                type="button"
                onClick={() => handleSavePost(true, 'news_feed')}
                className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Đăng tin tự động
              </button>
            </div>
          </div>

          {/* AI Helper Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" /> Trợ lý sáng tạo AI Content
            </h3>
            
            <p className="text-[10.5px] text-slate-300 leading-normal">
              Sinh nhanh các bài viết bán vé, giới thiệu chương trình khoa học theo đối tượng mục tiêu dựa trên AI thông minh.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nhóm đối tượng mục tiêu</label>
                <select
                  value={newsAudience}
                  onChange={e => setNewsAudience(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 outline-none cursor-pointer"
                >
                  {AUDIENCES.map(aud => (
                    <option key={aud.id} value={aud.id}>{aud.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Chủ đề bài đăng</label>
                <select
                  value={newsTopic}
                  onChange={e => setNewsTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 outline-none cursor-pointer"
                >
                  {TOPICS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAIContent}
                disabled={isGeneratingAI}
                className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-650 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity border-0 cursor-pointer shadow-md shadow-amber-500/10"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> AI Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" /> Tạo nội dung AI
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-[10px] text-slate-400 space-y-1.5">
              <strong className="text-slate-300">💡 Hướng dẫn:</strong>
              <p className="leading-normal">
                Nội dung do AI tạo ra sẽ tự động điền vào khung soạn thảo ở bên trái. Bạn có thể tự do điều chỉnh và nhấn đăng tự động ngay.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-4 h-4 text-pink-650" /> Trình soạn Kịch bản Video ngắn
            </h2>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiêu đề kịch bản *</label>
              <input
                type="text"
                placeholder="Ví dụ: Kịch bản Shorts: 3 sai lầm khi chọn filler thái dương..."
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-pink-600">Phần Hook (0-5 giây đầu) *</label>
                <textarea
                  placeholder="Hook kích thích người xem dừng lại..."
                  value={videoHook}
                  onChange={e => setVideoHook(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-indigo-650">Phần Thân (Body Content) *</label>
                <textarea
                  placeholder="Truyền tải giá trị cốt lõi..."
                  value={videoBody}
                  onChange={e => setVideoBody(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Phần CTA (Call to Action) *</label>
                <textarea
                  placeholder="Kêu gọi đăng ký vé hoặc theo dõi..."
                  value={videoCta}
                  onChange={e => setVideoCta(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đăng tải lên nền tảng video ngắn *</label>
              <div className="flex gap-2 max-w-sm">
                {['tiktok', 'youtube'].map(plat => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setVideoPlatforms(prev => 
                        prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
                      );
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      videoPlatforms.includes(plat)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {plat === 'youtube' ? 'YouTube Shorts' : 'TikTok'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSavePost(false, 'video_short')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 bg-white cursor-pointer"
              >
                Lưu nháp kịch bản
              </button>
              
              <button
                type="button"
                onClick={() => handleSavePost(true, 'video_short')}
                className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Đăng video tự động
              </button>
            </div>
          </div>

          {/* AI Helper Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" /> Trợ lý viết Kịch bản AI
            </h3>
            
            <p className="text-[10.5px] text-slate-300 leading-normal">
              Tạo nhanh kịch bản Shorts / TikTok 60 giây thu hút người xem, đầy đủ Hook, nội dung chính và lời kêu gọi chuyển đổi.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Chủ đề video</label>
                <select
                  value={videoTopic}
                  onChange={e => setVideoTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 outline-none cursor-pointer"
                >
                  {TOPICS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateVideoAI}
                disabled={isGeneratingVideoAI}
                className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-pink-650 to-indigo-650 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity border-0 cursor-pointer shadow-md shadow-pink-500/10"
              >
                {isGeneratingVideoAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> AI Đang soạn kịch bản...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" /> Viết kịch bản AI
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-[10px] text-slate-400 space-y-1.5">
              <strong className="text-slate-300">💡 Lưu ý quay dựng:</strong>
              <p className="leading-normal">
                Video ngắn có hiệu quả chuyển đổi cao khi hình ảnh trực quan sinh động. Khuyên dùng kèm công nghệ lồng tiếng AI hoặc tự quay thuyết trình tại phòng mạch.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Liên kết Mạng xã hội truyền thông</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Liên kết các tài khoản/trang Fanpage chính thức để kích hoạt tính năng tự động đồng bộ bài viết và theo dõi đo lường reach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook */}
            <div className="border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Facebook className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Facebook Page</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Trang truyền thông chính thức PARS 2026</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  channels.facebook ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {channels.facebook ? 'Đang hoạt động' : 'Chưa liên kết'}
                </span>
                <button
                  onClick={() => handleToggleChannel('facebook')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    channels.facebook 
                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {channels.facebook ? 'Ngắt kết nối' : 'Kết nối'}
                </button>
              </div>
            </div>

            {/* Zalo */}
            <div className="border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Link className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Zalo Official Account (OA)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kênh tương tác và chăm sóc đại biểu</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  channels.zalo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {channels.zalo ? 'Đang hoạt động' : 'Chưa liên kết'}
                </span>
                <button
                  onClick={() => handleToggleChannel('zalo')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    channels.zalo 
                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {channels.zalo ? 'Ngắt kết nối' : 'Kết nối'}
                </button>
              </div>
            </div>

            {/* TikTok */}
            <div className="border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200">
                  <Play className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">TikTok Channel</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Phát sóng Shorts Video giới thiệu sự kiện</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  channels.tiktok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {channels.tiktok ? 'Đang hoạt động' : 'Chưa liên kết'}
                </span>
                <button
                  onClick={() => handleToggleChannel('tiktok')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    channels.tiktok 
                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {channels.tiktok ? 'Ngắt kết nối' : 'Kết nối'}
                </button>
              </div>
            </div>

            {/* Youtube */}
            <div className="border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <YoutubeIcon className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">YouTube Shorts</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kênh phát video tài liệu học thuật khoa học</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  channels.youtube ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {channels.youtube ? 'Đang hoạt động' : 'Chưa liên kết'}
                </span>
                <button
                  onClick={() => handleToggleChannel('youtube')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    channels.youtube 
                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {channels.youtube ? 'Ngắt kết nối' : 'Kết nối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline YouTube Icon to prevent import failure if not directly in bundle
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
      <polygon points="10 15 15 12 10 9" />
    </svg>
  );
}
