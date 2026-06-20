/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen, Search, Users, FileText, Calendar, Coins, Award,
  Megaphone, Settings, Printer, Shield, Check, Info, AlertTriangle,
  HelpCircle, ChevronRight, Copy, Terminal, ExternalLink,
  FileSpreadsheet, MapPin, Plug, Upload, Table, CheckCircle, Bell
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const sections: GuideSection[] = [
    {
      id: 'intro',
      title: '1. Giới Thiệu Tổng Quan',
      shortDesc: 'Tổng quan giao diện điều hành và luồng vận hành chính.',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-indigo-950">
            <h4 className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-indigo-900">
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
              Hệ thống Quản lý Sự kiện PARS 2026
            </h4>
            <p className="text-xs leading-relaxed mt-2 text-indigo-800">
              Chào mừng bạn đến với hệ thống vận hành hội nghị thẩm mỹ **PARS 2026**. Đây là giải pháp quản lý toàn diện giúp Ban tổ chức (BTC) kiểm soát danh sách đại biểu, phê duyệt bài báo cáo, sắp xếp lịch trình khoa học, đối soát tài chính tự động và hỗ trợ in ấn thẻ tên (badge) check-in lập tức tại sự kiện.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🌟 Luồng Vận Hành Chính Của Hệ Thống</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:shadow-xs transition-shadow">
                <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 font-extrabold flex items-center justify-center text-xs">01</span>
                <h6 className="text-xs font-bold text-slate-900">Đăng Ký & Nhận Tin</h6>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Đại biểu đăng ký qua form public. Hệ thống tự gửi email/Zalo ZNS hướng dẫn thanh toán kèm mã tra cứu.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:shadow-xs transition-shadow">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-xs">02</span>
                <h6 className="text-xs font-bold text-slate-900">Đối Soát & Duyệt Vé</h6>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cổng SePay tự động phát hiện chuyển khoản trùng mã đơn và duyệt vé, hoặc BTC duyệt thủ công. Hệ thống gửi mã QR Code check-in.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:shadow-xs transition-shadow">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-xs">03</span>
                <h6 className="text-xs font-bold text-slate-900">Check-in & In Thẻ Tên</h6>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Đến ngày hội nghị, đại biểu xuất trình QR Code. Tình nguyện viên quét mã, máy in tự động xuất thẻ tên đeo cổ trong 2 giây.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">👥 Phân Quyền Vận Hành Trên Hệ Thống</h5>
            <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-700">Vai Trò (Role)</th>
                    <th className="p-3 font-bold text-slate-700">Quyền Hạn Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  <tr>
                    <td className="p-3 font-bold text-slate-950 bg-slate-50/40">Trưởng BTC (Admin)</td>
                    <td className="p-3 text-slate-600">Toàn quyền hệ thống. Quản lý tài khoản, thay đổi biểu phí gói đăng ký, cấu hình tích hợp (Zalo/SMTP/Supabase), khôi phục dữ liệu gốc.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-950 bg-slate-50/40">Thành Viên BTC (btc)</td>
                    <td className="p-3 text-slate-600">Duyệt đại biểu, báo cáo viên, sắp xếp lịch trình, đối soát tài chính, in thẻ nhãn, quản lý công việc và gửi thông báo.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-950 bg-slate-50/40">Cộng Tác Viên (ctv)</td>
                    <td className="p-3 text-slate-600">Hỗ trợ check-in sự kiện, in thẻ nhãn đại biểu, tạo/cập nhật công việc nội bộ và cập nhật danh sách đại biểu. Bị khóa chức năng tài chính và cấu hình hệ thống.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'attendees',
      title: '2. Quản Lý Đại Biểu & Check-in',
      shortDesc: 'Kiểm soát thông tin đại biểu, in thẻ tên (badge) và quét mã QR check-in.',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📌 Các Trạng Thái Thanh Toán Của Đại Biểu</h5>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                <span className="px-2 py-0.5 rounded bg-slate-250 text-slate-700 text-[10px] font-black uppercase">Chờ thanh toán</span>
                <p className="text-[10.5px] text-slate-500 mt-2">Đại biểu mới gửi form, chưa hoàn tất chuyển khoản.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-amber-50/50 text-center border-amber-200">
                <span className="px-2 py-0.5 rounded bg-amber-105 text-amber-800 text-[10px] font-black uppercase">Chờ đối soát</span>
                <p className="text-[10.5px] text-slate-500 mt-2">Đại biểu đã tải ảnh bill lên, chờ BTC phê duyệt thủ công.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-emerald-50/50 text-center border-emerald-200">
                <span className="px-2 py-0.5 rounded bg-emerald-105 text-emerald-800 text-[10px] font-black uppercase">Đã thanh toán</span>
                <p className="text-[10.5px] text-slate-500 mt-2">Hệ thống đã nhận đủ tiền và kích hoạt gửi mã QR Code.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-rose-50/50 text-center border-rose-200">
                <span className="px-2 py-0.5 rounded bg-rose-105 text-rose-800 text-[10px] font-black uppercase">Đã Hủy</span>
                <p className="text-[10.5px] text-slate-500 mt-2">Đăng ký ảo hoặc đại biểu tự yêu cầu hủy bỏ.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🛠️ Thao Tác Nghiệp Vụ Tại Danh Sách Đại Biểu</h5>
            <ul className="space-y-2 text-xs text-slate-650">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900">Thêm Đại Biểu Thủ Công:</strong> Bấm nút <strong className="text-indigo-600">"+ Thêm đại biểu"</strong> góc trên bên phải để tạo trực tiếp (thường dùng cho khách mời đặc biệt, VIP không qua form public).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900">Duyệt Thanh Toán Nhanh:</strong> Tại cột "Thanh toán", click vào biểu tượng kiểm duyệt hoặc chỉnh sửa thông tin thanh toán từ **Chờ chuyển khoản** sang **Đã thanh toán**. Hệ thống sẽ tự động kích hoạt tiến trình gửi Email/Zalo ZNS chứa vé QR code thành công.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900">Bộ Lọc Danh Sách:</strong> Có thể lọc nhanh đại biểu theo *Phân hạng đăng ký* (Gói standard, Gói VIP, CME...), *Trạng thái thanh toán*, *Trạng thái check-in* và ô tìm kiếm thông minh (tìm theo Tên, Số điện thoại, Email, Mã số đại biểu).
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🖨️ Quy Trình Check-in & In Thẻ Tên (Badge) Tại Hội Nghị</h5>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed font-bold">
                Có hai cách để check-in và in thẻ tên cho đại biểu khi họ đến hội trường sự kiện:
              </p>
              
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <h6 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                    Cách 1: Quét mã QR bằng Camera (Khuyên dùng)
                  </h6>
                  <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-500 leading-normal">
                    <li>Nhân sự check-in bấm vào nút <strong className="text-indigo-600">"Quét QR Check-in"</strong> ở màn hình quản lý đại biểu để kích hoạt Camera.</li>
                    <li>Đại biểu đưa mã QR trên điện thoại (được gửi từ Zalo/Email) vào khung quét.</li>
                    <li>Hệ thống khớp mã QR, tự động đánh dấu trạng thái <strong>Đã Check-in</strong> kèm mốc thời gian thực.</li>
                    <li>Nếu trong cài đặt có bật "Tự động in thẻ nhãn", lệnh in nhãn sẽ được truyền trực tiếp đến máy in để xuất thẻ tên ngay lập tức.</li>
                  </ol>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-150">
                  <h6 className="font-bold text-slate-900">Cách 2: Check-in và In Thẻ Thủ Công</h6>
                  <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-500 leading-normal">
                    <li>Sử dụng ô tìm kiếm tại danh sách đại biểu để tìm kiếm theo Tên hoặc Số điện thoại.</li>
                    <li>Bấm nút <strong className="text-emerald-600">"Check-in"</strong> trên hàng đại biểu tương ứng.</li>
                    <li>Bấm biểu tượng <strong className="text-slate-650">Máy In (Printer)</strong> cạnh nút Check-in để gửi lệnh in nhãn thẻ tên riêng lẻ.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'speakers',
      title: '3. Quản Lý Báo Cáo Viên & Lịch Trình',
      shortDesc: 'Kiểm duyệt đề tài báo cáo khoa học, gán phiên diễn thuyết và cập nhật lịch trình hội nghị.',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🎤 Kiểm Duyệt Thông Tin Báo Cáo Viên</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Các chuyên gia, Báo cáo viên đăng ký thông tin đề tài nghiên cứu qua biểu mẫu trực tuyến. BTC quản lý hồ sơ tại phân hệ **Báo Cáo Viên**:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1 leading-normal">
              <li>Kiểm tra thông tin liên hệ, học hàm/học vị, tóm tắt nội dung bài trình bày (abstract) và slide đính kèm.</li>
              <li>Phê duyệt đề tài bằng cách đổi trạng thái sang <span className="text-indigo-650 font-bold">"Đã duyệt" (Approved)</span> hoặc từ chối chỉnh sửa lại.</li>
              <li>Chỉnh sửa trực tiếp tên bài báo cáo và thời lượng diễn thuyết của từng diễn giả.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📅 Lập Lịch Trình Hội Nghị (Sessions & Tracks)</h5>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
              <p className="text-slate-700 leading-relaxed">
                Phân hệ **Lịch Trình Hội Nghị** giúp phân bổ bài giảng vào các phiên hội nghị diễn ra song song (Tracks/Rooms):
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Bấm <strong className="text-indigo-600">"+ Thêm phiên hội nghị"</strong> để định nghĩa khung giờ, tên phiên chính (ví dụ: *Phiên thẩm mỹ da liễu sáng*, *Hội thảo khoa học laser*).</li>
                <li>Chọn Phòng hội nghị (Hội trường A, Hội trường B), bổ sung Tên chủ tọa (Moderators) điều phối phiên giảng.</li>
                <li>Gán danh sách các bài báo cáo đã duyệt của Báo cáo viên vào khung thời gian của phiên này. Có thể kéo thả hoặc sắp xếp thứ tự diễn giảng của các bài báo cáo.</li>
              </ol>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900/90 flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-950 block">Mẹo nhỏ khi sắp xếp lịch:</strong>
              Hãy đảm bảo tổng thời gian diễn thuyết của các bài báo cáo trong một phiên không vượt quá tổng thời lượng của phiên chính đó. Lịch trình này sẽ được đồng bộ trực tiếp lên trang thông tin Public để đại biểu tra cứu tức thời.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'finances',
      title: '4. Đối Soát Tài Chính & Tích Hợp SePay',
      shortDesc: 'Theo dõi dòng tiền, thống kê chi phí sự kiện và cấu hình quét giao dịch ngân hàng tự động.',
      icon: Coins,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📊 Báo Cáo Tài Chính Thu Chi</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Phân hệ **Đối Soát Tài Chính** hiển thị toàn bộ báo cáo về doanh thu thu được từ gói đại biểu, mức đóng góp của nhà tài trợ và chi phí vận hành (khách sạn, in ấn, tiệc gala...). Bạn có thể lập phiếu thu/chi thủ công để cập nhật bảng cân đối ngân sách.
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">⚡ Tự Động Phê Duyệt Qua SePay</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống tích hợp sâu với **SePay** thông qua kết nối webhook ngân hàng. Khi đại biểu chuyển khoản đúng số tiền kèm mã nội dung giao dịch (ví dụ: `PARS-102`), SePay gửi tín hiệu về webhook của ứng dụng và tự động nâng trạng thái đại biểu thành "Đã thanh toán".
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🔌 Các Bước Thiết Lập Webhook SePay Tự Động</h5>
            <ol className="list-decimal pl-5 text-xs text-slate-650 space-y-2 leading-relaxed">
              <li>Truy cập mục <strong>Cài Đặt Hệ Thống</strong> → chọn tab <strong>SePay - Xác nhận CK</strong>.</li>
              <li>Sao chép <strong>Địa chỉ Webhook nhận dữ liệu</strong> được hiển thị tại màn hình cài đặt.</li>
              <li>Đăng nhập tài khoản SePay của bạn, tạo tích hợp webhook mới và dán URL vừa copy vào mục cấu hình.</li>
              <li>Điền mã <strong>API Key (Bearer Token Authorization)</strong> do SePay cung cấp vào mục cài đặt tương ứng trên hệ thống này và nhấn lưu cấu hình.</li>
              <li>Kiểm định kết nối bằng nút <strong>"Kiểm tra kết nối cổng SePay"</strong>.</li>
            </ol>
          </div>

          <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 text-xs font-mono">
            <div className="flex justify-between items-center mb-1 text-slate-450 text-[10px] font-bold">
              <span>ĐỊA CHỈ WEBHOOK WEBAPP CỦA BẠN (DÙNG ĐỂ KHAI BÁO TRÊN SEPAY)</span>
              <button 
                onClick={() => handleCopyCode(`${window.location.origin}/api/sepay/webhook`, 'sepay-webhook')}
                className="text-indigo-650 hover:text-indigo-800 font-bold border-none bg-transparent cursor-pointer flex items-center gap-1 text-[9.5px]"
              >
                <Copy className="w-3 h-3" />
                {copiedTextId === 'sepay-webhook' ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg select-all break-all text-[11px] leading-relaxed">
              {window.location.origin}/api/sepay/webhook
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sponsors',
      title: '5. Quản Lý Nhà Tài Trợ',
      shortDesc: 'Lưu trữ thông tin đối tác tài trợ, phân cấp hạng mức và hiển thị trên giao diện công cộng.',
      icon: Award,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🎯 Phân Cấp Hạng Mức Nhà Tài Trợ</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Nhà tài trợ có vai trò quan trọng trong việc đóng góp ngân sách hội nghị. Giao diện **Nhà Tài Trợ** hỗ trợ lưu trữ hồ sơ đối tác bao gồm: Logo công ty, website liên kết, đại diện liên hệ và đặc biệt là phân cấp nhà tài trợ:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50/20 p-3 rounded-xl border-amber-200">
                <span className="font-extrabold text-amber-800 block text-[11px]">💎 Nhà Tài Trợ Kim Cương</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Vị trí logo ưu tiên lớn nhất tại Header trang thông tin và backdrop.</span>
              </div>
              <div className="border border-slate-200 bg-gradient-to-br from-yellow-50 to-amber-50/20 p-3 rounded-xl border-yellow-200">
                <span className="font-extrabold text-yellow-800 block text-[11px]">🥇 Nhà Tài Trợ Vàng</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Hiển thị ở khu vực trung tâm trang tin sự kiện.</span>
              </div>
              <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-50/20 p-3 rounded-xl border-slate-300">
                <span className="font-extrabold text-slate-700 block text-[11px]">🥈 Nhà Tài Trợ Bạc</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Hiển thị dạng ô cỡ trung ở phần thân của chân trang.</span>
              </div>
              <div className="border border-slate-200 bg-gradient-to-br from-amber-900/5 to-amber-900/10 p-3 rounded-xl border-amber-700/20">
                <span className="font-extrabold text-amber-900 block text-[11px]">🥉 Nhà Tài Trợ Đồng</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Hiển thị logo kích thước tối giản ở hàng cuối cùng của sự kiện.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🌐 Hiển Thị Ra Public</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Các nhà tài trợ ở trạng thái **Đang Hoạt Động (Active)** và có liên kết hình ảnh Logo đầy đủ sẽ tự động được hiển thị mượt mà trên **Trang Tin Sự Kiện Public** giúp gia tăng uy tín thương hiệu đối tác. Khi thêm mới nhà tài trợ, bạn có thể nhập số tiền tài trợ thực tế để hệ thống tự động cộng dồn doanh số thu được vào biểu đồ tài chính.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: '6. Cấu Hình Gửi Tin (Zalo OA, Email, WhatsApp)',
      shortDesc: 'Thiết lập các kênh truyền phát tin nhắn tự động và gửi thông báo hàng loạt cho đại biểu.',
      icon: Megaphone,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📧 Cổng SMTP Email & Resend API</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Hệ thống cung cấp hai cơ chế gửi email chuyên nghiệp cho đại biểu:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block">1. Outgoing SMTP Server</strong>
                <p className="text-slate-550 text-[11px]">Gửi trực tiếp bằng máy chủ Mail Server doanh nghiệp hoặc Gmail App Password. Thích hợp cho số lượng thư vừa phải.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block">2. Cổng Resend Bulk API</strong>
                <p className="text-slate-550 text-[11px]">Tích hợp qua dịch vụ Resend. Khuyên dùng khi cần gửi hàng loạt thư xác nhận vé, thư mời tham dự mà không sợ bị đưa vào hòm thư rác (Spam).</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📱 Cổng Zalo OA & ZNS (Zalo Notification Service)</h5>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
              <p className="text-slate-700 leading-relaxed font-bold">
                Quy trình cấu hình và gia hạn mã Token Zalo OA:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                <li>
                  <strong>Nhập Cấu Hình Ban Đầu:</strong> Điền đầy đủ *App ID*, *Secret Key* và *Zalo OA ID* nhận được từ cổng Zalo Cloud Developer vào mục **Cổng Tích Hợp API** trong cài đặt.
                </li>
                <li>
                  <strong>Gia Hạn Access Token:</strong> Zalo Access Token chỉ có hiệu lực trong **24 giờ**. Khi Token hết hạn, bạn hãy lấy mã *Refresh Token* mới từ cổng quản trị Zalo OA dán vào cài đặt, sau đó bấm nút <strong className="text-indigo-650">"Gia hạn Access Token"</strong> để hệ thống tự động làm mới mã thông hành.
                </li>
                <li>
                  <strong>Chạy Tin Thử Nghiệm:</strong> Điền số điện thoại test của bạn và nhấn nút <strong className="text-emerald-600">"Gửi tin Zalo OA test"</strong> để kiểm tra cấu hình.
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🚀 Cách Gửi Thông Báo Hàng Loạt (Bulk Send)</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Khi có thay đổi về lịch trình đột xuất, hoặc muốn gửi thư cảm ơn sau sự kiện, hãy truy cập phân hệ **Gửi Tin Hàng Loạt**:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1 leading-normal">
              <li>Chọn **Bộ lọc đại biểu** nhận tin (ví dụ: Chỉ gửi đại biểu Đã check-in, hoặc Chỉ gửi đại biểu Chưa thanh toán).</li>
              <li>Chọn **Kênh gửi** mong muốn (Email cá nhân, Zalo ZNS, WhatsApp).</li>
              <li>Chọn **Mẫu tin nhắn** biên soạn sẵn hoặc chỉnh sửa nội dung thư bằng trình soạn thảo văn bản phong phú trực quan (Rich Text Editor).</li>
              <li>Nhấn **Bắt đầu gửi tin** để hệ thống chạy ngầm tiến trình bắn tin. Hệ thống hiển thị thanh tiến trình trực quan và log trạng thái gửi thành công/thất bại của từng đại biểu.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'settings-guide',
      title: '7. Cấu Hình PWA, Máy In Nhãn & Khôi Phục Gốc',
      shortDesc: 'Cấu hình chế độ ngoại tuyến PWA, thiết lập máy in thẻ tên và cách khôi phục cài đặt gốc.',
      icon: Settings,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📱 Tải Ứng Dụng Di Động & Chế Độ Offline (PWA)</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Hệ thống được phát triển theo tiêu chuẩn ứng dụng web tiến tiến (PWA). Khi truy cập bằng điện thoại di động hoặc iPad, trình duyệt sẽ tự động gợi ý **"Thêm vào Màn hình chính"** hoặc **"Cài đặt Ứng dụng"**. 
              Sau khi cài đặt:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1 leading-normal">
              <li>Hệ thống có thể chạy độc lập như một app di động chuyên nghiệp (không có thanh địa chỉ trình duyệt).</li>
              <li>Hỗ trợ lưu đệm dữ liệu đại biểu để phục vụ check-in ngay cả khi kết nối mạng chập chờn (Offline Mode).</li>
              <li>Bạn có thể tùy chỉnh *Tên App*, *Màu sắc giao diện chủ đạo* và *Logo PWA* trong phần Cài đặt Hệ thống để đồng bộ nhận diện thương hiệu.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🖨️ Cấu Hình Kết Nối Máy In Thẻ Tên</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Hệ thống tương thích tốt với các dòng máy in nhãn mã vạch nhiệt chuyên dụng tại quầy sự kiện (như Xprinter, Brother, Bixolon...). Cách cấu hình:
            </p>
            <ol className="list-decimal pl-5 text-xs text-slate-550 space-y-1 leading-normal">
              <li>Truy cập <strong>Cài Đặt Hệ Thống</strong> → chọn tab <strong>Cấu hình Máy In Nhãn</strong>.</li>
              <li>Thiết lập <strong>Khổ giấy in nhãn</strong> phù hợp với cuộn giấy (ví dụ: <code>80x50 mm</code> hoặc <code>80x80 mm</code>).</li>
              <li>Chọn <strong>Kiểu kết nối</strong>: Khuyên dùng kết nối qua máy chủ in cục bộ của trình duyệt để có hiệu quả cao nhất.</li>
              <li>Bật tính năng <strong>"Tự động in nhãn sau khi check-in thành công"</strong> để tối ưu hóa quy trình đón tiếp.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🔄 Khôi Phục Dữ Liệu Gốc (Factory Reset)</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Tính năng **Khôi Phục Dữ Liệu Gốc** giúp bạn xóa sạch toàn bộ các bản ghi giả định hoặc dữ liệu thử nghiệm trong quá trình setup để chuẩn bị cho sự kiện thực tế.
            </p>
            
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-2 text-rose-950">
              <strong className="text-rose-900 block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                LƯU Ý CỰC KỲ QUAN TRỌNG:
              </strong>
              <p className="leading-relaxed">
                Chức năng này chỉ được cấp quyền cho vai trò **Trưởng BTC (Admin)** hoặc **Thành viên BTC**. Khi nhấn kích hoạt:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-rose-800">
                <li>Toàn bộ dữ liệu đại biểu, báo cáo viên, lịch trình khoa học, nhật ký gửi tin, hóa đơn đối soát sẽ bị xóa sạch khỏi bộ nhớ máy (LocalStorage) và đám mây tích hợp (Supabase Cloud).</li>
                <li>Hệ thống tải lại từ đầu dữ liệu mẫu thiết lập nguyên bản của Ban tổ chức.</li>
                <li>Nút Khôi phục dữ liệu gốc có thể truy cập ở **dưới cùng Sidebar** hoặc tại mục **Danger Zone** ở cuối trang **Cấu hình nghiệp vụ cài đặt hệ thống**.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'installation-guide',
      title: '8. Triển Khai & Cài Đặt Hệ Thống Chi Tiết',
      shortDesc: 'Cấu hình mã nguồn, thiết lập biến môi trường, đồng bộ dữ liệu Supabase và Vercel.',
      icon: Terminal,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📦 Yêu Cầu Môi Trường Kỹ Thuật</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Để cài đặt và vận hành mã nguồn hệ thống PARS 2026 ổn định, máy chủ hoặc máy tính lập trình viên cần đáp ứng các điều kiện sau:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1 leading-normal">
              <li><strong>Node.js:</strong> Phiên bản v18.0.0 trở lên.</li>
              <li><strong>Package Manager:</strong> Sử dụng <code>npm</code> (đi kèm Node.js) hoặc <code>yarn</code>.</li>
              <li><strong>Cơ sở dữ liệu:</strong> Một dự án trống trên <strong>Supabase Cloud</strong> (hoặc bất kỳ hệ quản trị PostgreSQL nào).</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🔑 Cấu Hình File Biến Môi Trường (.env)</h5>
            <p className="text-xs text-slate-650 leading-relaxed">
              Tạo tệp tin <code>.env.local</code> ở thư mục gốc dự án và sao chép cấu hình mẫu sau:
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono">
              <div className="flex justify-between items-center mb-1 text-slate-450 text-[10px] font-bold">
                <span>MẪU CẤU HÌNH FILE .ENV.LOCAL</span>
                <button 
                  onClick={() => handleCopyCode(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=your-email@gmail.com\nSMTP_PASS=your-app-password\nSMTP_SENDER="PARS 2026 <no-reply@pars2026.com>"`, 'env-template')}
                  className="text-indigo-650 hover:text-indigo-800 font-bold border-none bg-transparent cursor-pointer flex items-center gap-1 text-[9.5px]"
                >
                  <Copy className="w-3 h-3" />
                  {copiedTextId === 'env-template' ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
              <pre className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg select-all overflow-x-auto text-[11px] leading-relaxed">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SENDER="PARS 2026 <no-reply@pars2026.com>"`}
              </pre>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🗄️ Khởi Tạo Cấu Trúc Cơ Sở Dữ Liệu SQL</h5>
            <p className="text-xs text-slate-655 leading-relaxed">
              Hệ thống cung cấp một script khởi tạo cơ sở dữ liệu tự động để đồng bộ cấu trúc bảng lên Supabase. Thực thi các bước sau:
            </p>
            <ol className="list-decimal pl-5 text-xs text-slate-550 space-y-1.5 leading-normal">
              <li>Cài đặt tất cả các package phụ thuộc bằng lệnh: <code>npm install</code>.</li>
              <li>Điền chính xác các biến Supabase ở file <code>.env.local</code> ở trên.</li>
              <li>Chạy lệnh khởi tạo bảng tự động:
                <div className="bg-slate-900 text-indigo-300 p-2 rounded-lg my-1.5 font-mono text-[10.5px] select-all max-w-sm">
                  npm run db:setup
                </div>
              </li>
              <li>Script sẽ tự động tạo các bảng cần thiết: <code>attendees</code>, <code>speakers</code>, <code>sessions</code>, <code>sponsors</code>, <code>internal_tasks</code>, <code>finance_transactions</code>, <code>notification_logs</code> trên Supabase của bạn.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🚀 Khởi Chạy Và Triển Khai Thực Tế</h5>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div>
                <strong className="text-slate-900 block">Chạy Thử Nghiệm Local (Development Server):</strong>
                <p className="text-slate-500 mt-0.5">Thực thi lệnh <code>npm run dev</code>. Ứng dụng sẽ được chạy trực tiếp trên địa chỉ <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline">http://localhost:5173</a>.</p>
              </div>
              <div className="border-t border-slate-200/60 pt-2.5">
                <strong className="text-slate-900 block">Biên Dịch Cho Môi Trường Production:</strong>
                <p className="text-slate-500 mt-0.5">Chạy lệnh <code>npm run build</code> để tối ưu hóa mã nguồn và xuất bản các tệp tin tĩnh ra thư mục <code>dist</code>. Thư mục này có thể deploy trực tiếp lên Vercel, Netlify hoặc Hosting tĩnh.</p>
              </div>
              <div className="border-t border-slate-200/60 pt-2.5">
                <strong className="text-slate-900 block">Lưu Ý Triển Khai API Serverless:</strong>
                <p className="text-slate-500 mt-0.5">Dự án đã định cấu hình sẵn file <code>vercel.json</code>. Khi deploy lên Vercel, các API Endpoint phục vụ Zalo OA, Webhook SePay và Gửi Email sẽ tự động hoạt động như các Serverless Function mà không cần cài đặt thêm server Node.js rời.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    ,
    {
      id: 'excel-import',
      title: '9. Import Hàng Loạt Bằng Excel',
      shortDesc: 'Đăng ký đại biểu hàng loạt từ file Excel (.xlsx, .xls) hoặc CSV chỉ trong vài giây.',
      icon: FileSpreadsheet,
      content: (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-2 text-indigo-900">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
              Import Hàng Loạt Đại Biểu Từ File Excel
            </h4>
            <p className="text-xs leading-relaxed mt-2 text-indigo-800">
              Tính năng này cho phép Ban tổ chức nhập danh sách đại biểu từ file Excel hoặc CSV sẵn có — không cần nhập tay từng người. Rất hữu ích khi bạn đã có danh sách từ Google Form, hệ thống đăng ký cũ hoặc file Excel từ phòng hành chính.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📋 Định Dạng File Được Hỗ Trợ</h5>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-center">
                <span className="font-extrabold text-emerald-800 block">.xlsx</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Excel 2007+ (Khuyên dùng)</span>
              </div>
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 text-center">
                <span className="font-extrabold text-blue-800 block">.xls</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Excel 97–2003</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 text-center">
                <span className="font-extrabold text-slate-700 block">.csv</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Văn bản phân cách dấu phẩy</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📊 Cấu Trúc Cột Bắt Buộc Trong File Excel</h5>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 text-[10px] font-black uppercase">
                    <th className="p-3">Tên Cột (Header)</th>
                    <th className="p-3">Mô Tả</th>
                    <th className="p-3">Bắt buộc?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr><td className="p-3 font-mono text-indigo-700">fullName</td><td className="p-3">Họ và tên đầy đủ của đại biểu</td><td className="p-3 text-emerald-600 font-bold">✅ Bắt buộc</td></tr>
                  <tr className="bg-slate-50"><td className="p-3 font-mono text-indigo-700">email</td><td className="p-3">Địa chỉ Email nhận thông báo và QR Code</td><td className="p-3 text-emerald-600 font-bold">✅ Bắt buộc</td></tr>
                  <tr><td className="p-3 font-mono text-indigo-700">phone</td><td className="p-3">Số điện thoại / Zalo nhận thông báo</td><td className="p-3 text-emerald-600 font-bold">✅ Bắt buộc</td></tr>
                  <tr className="bg-slate-50"><td className="p-3 font-mono text-indigo-700">organization</td><td className="p-3">Tên bệnh viện / cơ sở công tác</td><td className="p-3 text-slate-400">Tùy chọn</td></tr>
                  <tr><td className="p-3 font-mono text-indigo-700">title</td><td className="p-3">Học hàm / học vị (BS, ThS, PGS...)</td><td className="p-3 text-slate-400">Tùy chọn</td></tr>
                  <tr className="bg-slate-50"><td className="p-3 font-mono text-indigo-700">registrationPackage</td><td className="p-3">Tên gói đăng ký (phải khớp với gói đã cài)</td><td className="p-3 text-slate-400">Tùy chọn</td></tr>
                  <tr><td className="p-3 font-mono text-indigo-700">paymentStatus</td><td className="p-3">Trạng thái: <code>paid</code> / <code>pending</code> / <code>cancelled</code></td><td className="p-3 text-slate-400">Tùy chọn</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🚀 Các Bước Thực Hiện Import</h5>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li>Vào phân hệ <strong className="text-indigo-600">Quản Lý Đại Biểu</strong> trên thanh điều hướng bên trái.</li>
              <li>Nhấn nút <strong className="text-indigo-600">"Nhập từ Excel"</strong> (biểu tượng bảng tính) ở góc trên bên phải.</li>
              <li>Kéo thả file Excel vào vùng <strong>Drag &amp; Drop</strong> hoặc bấm <strong>"Chọn File"</strong> để duyệt file từ máy tính.</li>
              <li>Hệ thống tự động đọc và <strong>hiển thị xem trước dữ liệu</strong> — kiểm tra lại danh sách trước khi xác nhận.</li>
              <li>Nhấn <strong className="text-emerald-600">"Xác Nhận Import"</strong> để lưu toàn bộ vào hệ thống.</li>
              <li>Mỗi đại biểu sẽ được cấp mã số tự động và có thể gửi email/Zalo thông báo ngay sau khi import.</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Lưu ý khi chuẩn bị file:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-800">
                <li>Dòng đầu tiên phải là <strong>tiêu đề cột (header row)</strong> — không được để trống hay gộp ô.</li>
                <li>Không cần đúng thứ tự cột — hệ thống tự nhận diện tên cột.</li>
                <li>Nếu cột <code>paymentStatus</code> để trống, hệ thống mặc định là <code>pending</code> (chờ thanh toán).</li>
                <li>Dữ liệu trùng email sẽ được bỏ qua để tránh nhập hai lần.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sponsor-booth',
      title: '10. Quản Lý Gian Hàng Nhà Tài Trợ',
      shortDesc: 'Chọn và quản lý vị trí gian hàng triển lãm cho từng nhà tài trợ.',
      icon: MapPin,
      content: (
        <div className="space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
            <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-2 text-teal-900">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              Vị Trí Gian Hàng (Booth Location) Triển Lãm
            </h4>
            <p className="text-xs leading-relaxed mt-2 text-teal-800">
              Tính năng Vị trí Gian hàng cho phép BTC phân bổ và theo dõi vị trí triển lãm của từng nhà tài trợ trên sơ đồ hội nghị — giúp quản lý mặt bằng gian hàng chuyên nghiệp và tránh xung đột vị trí.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🗺️ Cách Đặt Vị Trí Gian Hàng</h5>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <p className="text-slate-700 font-bold">Có 2 cách gán vị trí gian hàng cho nhà tài trợ:</p>
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <h6 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">A</span>
                    Qua Form Đăng Ký Tài Trợ (Public)
                  </h6>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-500 leading-relaxed">
                    <li>Nhà tài trợ truy cập trang đăng ký tài trợ trực tuyến.</li>
                    <li>Tại mục <strong>"Vị trí gian hàng mong muốn"</strong>, chọn từ danh sách vị trí sẵn có (A1, A2, B1...) hoặc nhập mô tả tùy chỉnh.</li>
                    <li>Sau khi gửi form, yêu cầu vị trí được lưu vào hồ sơ và BTC duyệt xác nhận.</li>
                  </ol>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <h6 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-black">B</span>
                    Qua Giao Diện Quản Trị (Admin)
                  </h6>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-500 leading-relaxed">
                    <li>Vào <strong className="text-indigo-600">Quản Lý Nhà Tài Trợ</strong> → tìm nhà tài trợ cần gán.</li>
                    <li>Nhấn nút <strong>"Chỉnh sửa"</strong> (bút chì) trên thẻ nhà tài trợ.</li>
                    <li>Trong form chỉnh sửa, tìm trường <strong>"Vị trí gian hàng"</strong> → nhập hoặc chọn vị trí.</li>
                    <li>Nhấn <strong className="text-emerald-600">"Lưu thay đổi"</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📋 Quản Lý Gói Đăng Ký Nhà Tài Trợ</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              BTC có thể tùy chỉnh các gói tài trợ (Bạch Kim, Vàng, Bạc, Đồng) và quyền lợi đi kèm tại <strong>Cài Đặt → Gói Tài Trợ</strong>:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-550 space-y-1.5 leading-normal">
              <li>Đặt tên gói, mức phí tài trợ và số lượng gian hàng kèm theo mỗi gói.</li>
              <li>Mô tả quyền lợi hiển thị trên trang đăng ký public để nhà tài trợ tự chọn gói phù hợp.</li>
              <li>Xuất báo cáo danh sách nhà tài trợ kèm vị trí gian hàng ra file Excel để in sơ đồ mặt bằng.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">📄 Xuất Hợp Đồng Tài Trợ PDF</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống tự động tạo hợp đồng tài trợ PDF chứa đầy đủ thông tin: tên công ty, gói tài trợ, số tiền, quyền lợi và <strong>vị trí gian hàng được xác nhận</strong>.
            </p>
            <ol className="list-decimal pl-5 text-xs text-slate-550 space-y-1 leading-relaxed">
              <li>Tại danh sách nhà tài trợ, nhấn icon <strong>"In / Tải hợp đồng"</strong>.</li>
              <li>Hệ thống render PDF ngay trên trình duyệt — xem trước rồi tải về hoặc in trực tiếp.</li>
              <li>Hợp đồng có đầy đủ thông tin vị trí gian hàng, thích hợp để ký kết chính thức.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'integrations',
      title: '11. Hướng Dẫn Tích Hợp Bên Thứ Ba',
      shortDesc: 'Kết nối SePay, Zalo ZNS, Email SMTP/Resend và Google Gemini AI vào hệ thống.',
      icon: Plug,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SePay */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[11px] font-black">💳</span>
                SePay — Đối Soát Tự Động
              </h5>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Vào <strong>Cài Đặt → SePay - Xác nhận CK</strong>.</li>
                <li>Copy địa chỉ <strong>Webhook URL</strong> hiển thị trên màn hình.</li>
                <li>Đăng nhập <a href="https://sepay.vn" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">sepay.vn</a> → Tạo tích hợp Webhook → Dán URL vừa copy.</li>
                <li>Điền <strong>API Key</strong> của SePay vào ô cấu hình → Nhấn <strong className="text-emerald-600">"Lưu & Kiểm tra"</strong>.</li>
              </ol>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[10px] break-all">
                {window.location.origin}/api/sepay/webhook
              </div>
            </div>

            {/* Zalo ZNS */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-[11px] font-black">💬</span>
                Zalo ZNS — Thông Báo OA
              </h5>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Truy cập <a href="https://developers.zalo.me" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">developers.zalo.me</a> → Tạo ứng dụng mới.</li>
                <li>Lấy <strong>App ID</strong>, <strong>Secret Key</strong> và <strong>OA ID</strong> của Zalo Official Account.</li>
                <li>Điền vào <strong>Cài Đặt → Tích Hợp API → Zalo OA</strong>.</li>
                <li>Lấy <strong>Refresh Token</strong> từ cổng Zalo → Nhấn <strong>"Gia hạn Access Token"</strong> (token ZNS có hạn 24h).</li>
                <li>Gửi tin test để kiểm tra kết nối.</li>
              </ol>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800">
                ⚠️ Access Token Zalo chỉ có hiệu lực <strong>24 giờ</strong> — cần gia hạn định kỳ mỗi ngày.
              </div>
            </div>

            {/* WhatsApp Business API */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[11px] font-black">🟢</span>
                WhatsApp Business Cloud API
              </h5>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Truy cập <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">developers.facebook.com</a> → Đăng nhập → Tạo ứng dụng mới loại <strong>Doanh nghiệp (Business)</strong>.</li>
                <li>Thiết lập sản phẩm <strong>WhatsApp</strong> trong bảng điều khiển ứng dụng để kết nối với tài khoản Meta Business Suite.</li>
                <li>Lấy <strong>Phone Number ID</strong> và <strong>WhatsApp Business Account ID</strong> tại mục <strong>WhatsApp &rarr; Bắt đầu (Get Started)</strong>.</li>
                <li>Tạo Access Token vĩnh viễn:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Vào mục <strong>System Users (Người dùng hệ thống)</strong> trong Cài đặt doanh nghiệp Meta.</li>
                    <li>Thêm một tài khoản system user mới vai trò quản trị viên.</li>
                    <li>Nhấn <strong>Generate token (Tạo token)</strong> và tích chọn 2 quyền: <code>whatsapp_business_messaging</code> và <code>whatsapp_business_management</code>.</li>
                  </ul>
                </li>
                <li>Điền toàn bộ 3 thông số này vào mục <strong>Cài Đặt &rarr; Cổng Tích Hợp API &rarr; WhatsApp Business Cloud API</strong> và thực hiện gửi test.</li>
              </ol>
            </div>

            {/* Email SMTP */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-700 text-[11px] font-black">📧</span>
                Email SMTP / Resend
              </h5>
              <div className="text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800">Cách 1 — SMTP Server (Gmail):</p>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li>Host: <code>smtp.gmail.com</code>, Port: <code>587</code></li>
                  <li>Bật <strong>"Xác minh 2 bước"</strong> cho Gmail → Tạo <strong>App Password</strong> (16 ký tự).</li>
                  <li>Dùng App Password làm mật khẩu SMTP (không dùng mật khẩu Gmail thường).</li>
                </ul>
                <p className="font-bold text-slate-800 pt-1">Cách 2 — Resend API (Khuyên dùng):</p>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li>Đăng ký tại <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">resend.com</a> → Tạo API Key.</li>
                  <li>Điền vào <strong>Cài Đặt → Thông Báo → Resend API</strong>.</li>
                  <li>Gửi được 3.000 email/tháng miễn phí — không bị rơi vào hòm thư Spam.</li>
                </ul>
              </div>
            </div>

            {/* Gemini AI */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 text-[11px] font-black">✨</span>
                Google Gemini AI
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gemini AI được tích hợp để hỗ trợ các tính năng trợ lý thông minh trong hệ thống.
              </p>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Truy cập <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">aistudio.google.com</a> → <strong>Get API Key</strong>.</li>
                <li>Copy API Key (dạng <code>AIza...</code>).</li>
                <li>Điền vào file <code>.env.local</code>: <code>GEMINI_API_KEY=AIza...</code></li>
                <li>Khởi động lại server để áp dụng.</li>
              </ol>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-[10px] text-purple-800">
                💡 Free tier Gemini API: 1.500 requests/ngày — đủ dùng cho hội nghị quy mô vừa.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">✅ Bảng Kiểm Tra Kết Nối Tích Hợp</h5>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 text-[10px] font-black uppercase">
                    <th className="p-3">Dịch Vụ</th>
                    <th className="p-3">Vị Trí Kiểm Tra</th>
                    <th className="p-3">Cách Xác Nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr><td className="p-3 font-bold">SePay</td><td className="p-3">Cài Đặt → SePay</td><td className="p-3">Nút "Kiểm tra kết nối" → Hiện trạng thái xanh</td></tr>
                  <tr className="bg-slate-50"><td className="p-3 font-bold">Zalo ZNS</td><td className="p-3">Cài Đặt → Zalo OA</td><td className="p-3">Gửi tin test → Nhận Zalo trên điện thoại</td></tr>
                  <tr><td className="p-3 font-bold">Email SMTP</td><td className="p-3">Cài Đặt → Email</td><td className="p-3">Gửi email test → Kiểm tra hộp thư</td></tr>
                  <tr className="bg-slate-50"><td className="p-3 font-bold">Supabase DB</td><td className="p-3">Cài Đặt → Supabase</td><td className="p-3">Nút "Kiểm tra kết nối" → Hiện số bản ghi</td></tr>
                  <tr><td className="p-3 font-bold">Gemini AI</td><td className="p-3">.env.local</td><td className="p-3">Khởi động server → Không có lỗi API key</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notification-templates',
      title: '12. Quản Lý Mẫu Thông Báo Tự Động',
      shortDesc: 'Thiết lập, thêm mới và cập nhật các mẫu email, tin nhắn Zalo ZNS tự động gửi cho đại biểu.',
      icon: Bell,
      content: (
        <div className="space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 text-teal-950">
            <h4 className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-teal-900">
              <Bell className="w-4 h-4 text-teal-600 shrink-0" />
              Hệ Thống Mẫu Thông Báo Tự Động PARS 2026
            </h4>
            <p className="text-xs leading-relaxed mt-2 text-teal-800">
              Hệ thống hỗ trợ gửi thông báo tự động (Email/Zalo ZNS) tới đại biểu dựa trên các trạng thái và hành động tương ứng (khi đăng ký thành công, khi đối soát duyệt thanh toán thành công, nhắc nhở lịch trình...). Phân hệ này cho phép Ban tổ chức thiết lập nội dung động thông qua các biến hệ thống để cá nhân hóa thông tin của từng đại biểu.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🛠️ Các Bước Thêm Mới Mẫu Thông Báo</h5>
            <ol className="space-y-2 text-xs text-slate-650 list-decimal pl-4">
              <li>
                <strong className="text-slate-900">Truy cập phân hệ:</strong> Vào mục <strong className="text-indigo-600">Hệ Thống Thông Báo</strong> trên thanh menu bên trái, chọn tab <strong className="text-indigo-600">Cấu hình mẫu tin</strong>.
              </li>
              <li>
                <strong className="text-slate-900">Tạo mẫu mới:</strong> Bấm nút <strong className="text-teal-600 font-bold border border-teal-200 bg-teal-50 px-2 py-0.5 rounded">+ Thêm mới</strong> ở cột danh sách mẫu tin phía bên trái.
              </li>
              <li>
                <strong className="text-slate-900">Thiết lập thông tin chung:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-500">
                  <li><strong>Mã số mẫu (ID):</strong> Nhập mã định danh duy nhất (dạng chữ thường không dấu, phân tách bằng dấu gạch ngang, ví dụ: <code>tmpl-registration-welcome</code>).</li>
                  <li><strong>Tên mẫu tin:</strong> Tên mô tả trực quan (ví dụ: <code>Email Chào mừng Đại biểu đăng ký</code>).</li>
                  <li><strong>Kênh truyền phát (Channel):</strong> Chọn <strong>Email</strong>, <strong>Zalo ZNS</strong> hoặc <strong>WhatsApp</strong>.</li>
                  <li><strong>Loại sự kiện (Type):</strong> Gán sự kiện kích hoạt gửi tự động (Đăng ký thành công, Xác nhận thanh toán, Duyệt bài báo cáo, Nhắc nhở sự kiện).</li>
                </ul>
              </li>
              <li>
                <strong className="text-slate-900">Soạn thảo nội dung:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-500">
                  <li><strong>Đối với Email:</strong> Nhập <strong>Tiêu đề thư (Subject)</strong>. Sử dụng trình soạn thảo trực quan (Visual Editor) với thanh công cụ định dạng (In đậm, In nghiêng, Căn lề, Danh sách...) hoặc chuyển sang chế độ <strong>Mã HTML (Code Editor)</strong> để chèn các mẫu layout email chuyên nghiệp.</li>
                  <li><strong>Đối với Zalo ZNS / WhatsApp:</strong> Điền <strong>Mã mẫu tin Zalo ZNS (Template ID)</strong> đã được duyệt trước trên hệ thống Zalo OA, thiết lập <strong>Loại mẫu tin</strong> (Tin Giao dịch / Tin Truyền thông) và <strong>Trạng thái duyệt Zalo</strong>.</li>
                </ul>
              </li>
              <li>
                <strong className="text-slate-900">Lưu lại:</strong> Bấm nút <strong className="text-emerald-600">"Lưu mẫu tin"</strong> ở góc dưới bên phải để hoàn tất và đưa mẫu tin vào trạng thái sẵn sàng sử dụng.
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">🔄 Cập Nhật &amp; Hiệu Chỉnh Mẫu Có Sẵn</h5>
            <ul className="space-y-2 text-xs text-slate-650">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900">Chọn mẫu cần sửa:</strong> Trong tab <strong className="text-indigo-600">Cấu hình mẫu tin</strong>, bấm chọn mẫu tương ứng từ danh sách cột bên trái. Thông tin chi tiết của mẫu sẽ được tải lên biểu mẫu hiệu chỉnh ở giữa.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900">Sử dụng biến động (Placeholders):</strong> Hệ thống cung cấp các nút chèn nhanh các biến số của đại biểu ở phía trên khung soạn thảo. Khi chèn, hệ thống sẽ sử dụng định dạng <code>{"{{variable_name}}"}</code> để tự động ánh xạ thông tin tương ứng khi gửi:
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{"{{title}}"} (Danh xưng BS/TS...)</span>
                    <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{"{{fullname}}"} (Họ tên)</span>
                    <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{"{{code}}"} (Mã số đại biểu)</span>
                    <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{"{{package}}"} (Gói vé đăng ký)</span>
                    <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{"{{payment_status}}"} (Tình trạng thanh toán)</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900">Kiểm tra hiển thị (Preview):</strong> Bấm chọn tab <strong className="text-indigo-600">Xem Trước (Preview)</strong> phía trên khung soạn thảo để kiểm tra cách hiển thị nội dung mẫu thư thực tế sau khi đã thay thế các biến mẫu thử nghiệm.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900">Gửi thử nghiệm thực tế (Test Send):</strong> Sử dụng tính năng gửi test ở dưới cùng. Nhập thông tin/chọn đại biểu chạy thử, nhấn <strong className="text-teal-600 font-bold border border-teal-200 bg-teal-50 px-2 py-0.5 rounded">Gửi thử Email</strong> hoặc <strong className="text-teal-600 font-bold border border-teal-200 bg-teal-50 px-2 py-0.5 rounded">Gửi thử Zalo</strong> để kiểm tra xem tin nhắn đến hộp thư/điện thoại có đúng định dạng và căn lề chuẩn hay không.
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Lưu ý cực kỳ quan trọng đối với Zalo ZNS:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-800">
                <li>Mẫu Zalo ZNS <strong>bắt buộc phải đăng ký và được duyệt thành công bởi Zalo Cloud</strong> trước khi tích hợp vào hệ thống.</li>
                <li>Nội dung văn bản và tên các tham số truyền đi trong trường <code>content</code> (ví dụ: <code>{"{{customer_name}}"}</code>, <code>{"{{order_id}}"}</code>) phải <strong>trùng khớp 100%</strong> với cấu trúc đã được Zalo phê duyệt. Mọi sai khác dù là nhỏ nhất (khoảng trắng, viết hoa) cũng sẽ khiến Zalo từ chối gửi tin nhắn.</li>
                <li>Hệ thống PARS 2026 sẽ tự động ánh xạ các tham số từ đại biểu vào cấu trúc tham số Zalo tương ứng khi tiến hành kích hoạt lệnh gửi tự động.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Filter sections by search query
  const filteredSections = sections.filter(sec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    return sec.title.toLowerCase().includes(query) || 
           sec.shortDesc.toLowerCase().includes(query) ||
           sec.id.toLowerCase().includes(query);
  });

  const activeSection = sections.find(sec => sec.id === activeTab) || sections[0];
  const ActiveIcon = activeSection.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header section with help visuals */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 animate-pulse" />
            TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cẩm nang hướng dẫn thao tác vận hành đầy đủ từ khâu đăng ký, phê duyệt tài chính, lập lịch đến check-in in thẻ tên tại chỗ.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm hướng dẫn nhanh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-800 placeholder-slate-400 shadow-inner bg-slate-50/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left-hand Navigation Menu within the view */}
        <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-2 mb-1">MỤC LỤC TÀI LIỆU</span>
          
          <div className="space-y-1">
            {filteredSections.map((sec) => {
              const IconComp = sec.icon;
              const isActive = activeTab === sec.id;
              
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTab(sec.id);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs transition-all flex items-start gap-3 border-none cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-905 bg-transparent'
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div>
                    <span className="block">{sec.title}</span>
                    <span className={`text-[10px] block mt-0.5 leading-tight font-medium ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {sec.shortDesc}
                    </span>
                  </div>
                </button>
              );
            })}
            
            {filteredSections.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy chủ đề hướng dẫn phù hợp.</p>
            )}
          </div>
          
          <div className="pt-4 mt-2 border-t border-slate-200 px-2 space-y-2 text-[10px] text-slate-400 leading-normal">
            <span className="font-extrabold text-slate-700 block text-[9.5px]">📞 HỖ TRỢ KỸ THUẬT:</span>
            <p>Trong quá trình vận hành tại hội trường sự kiện, nếu gặp sự cố về máy in nhãn hoặc nghẽn cổng Webhook SePay, vui lòng liên hệ Trưởng nhóm Công nghệ để được hỗ trợ khẩn cấp.</p>
          </div>
        </div>

        {/* Right-hand Detail Panel */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ActiveIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                {activeSection.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeSection.shortDesc}
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-[9px] font-mono text-slate-450 uppercase font-bold tracking-wider">
              PARS-DOCS-2026
            </div>
          </div>

          <div className="text-slate-700">
            {activeSection.content}
          </div>
        </div>

      </div>
    </div>
  );
}
