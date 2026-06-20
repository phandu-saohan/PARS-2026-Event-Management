/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, FileText, Landmark, Clock, AlertCircle, Sparkles, 
  CheckSquare, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { store } from '../dataStore';
import { Role } from '../types';

interface DashboardOverviewProps {
  role: Role;
}

export default function DashboardOverview({ role }: DashboardOverviewProps) {
  const attendees = store.getAttendees();
  const speakers = store.getSpeakers();
  const finance = store.getFinance();
  const tasks = store.getTasks();
  const sponsors = store.getSponsors();
  const logs = store.getNotificationLogs();

  // Calculation Metrics
  const totalAttendees = attendees.length;
  const verifiedPaidAttendees = attendees.filter(a => a.paymentStatus === 'paid').length;
  const checkedInCount = attendees.filter(a => a.isCheckedIn).length;
  const checkInRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  const totalSpeakers = speakers.length;
  const approvedSpeakers = speakers.filter(s => s.status === 'approved').length;
  const pendingSpeakers = speakers.filter(s => s.status === 'pending').length;

  const totalIncome = finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finance.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netFunding = totalIncome - totalExpense;

  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const totalTasksCount = tasks.length;
  const taskProgressPct = totalTasksCount > 0 ? Math.round((tasksDone / totalTasksCount) * 100) : 0;

  // Users role counts
  const users = store.getUsers();
  const btcCount = users.filter(u => u.role === 'btc').length;
  const ctvCount = users.filter(u => u.role === 'ctv').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  // Dynamic income breakdown
  const incomes = finance.filter(f => f.type === 'income');
  const delegateIncome = incomes.filter(f => f.category === 'Gói đại biểu').reduce((acc, curr) => acc + curr.amount, 0);
  const sponsorIncome = incomes.filter(f => f.category === 'Nhà tài trợ').reduce((acc, curr) => acc + curr.amount, 0);
  const delegateIncomePct = totalIncome > 0 ? Math.min(100, Math.max(0, Math.round((delegateIncome / totalIncome) * 100))) : 50;
  const sponsorIncomePct = 100 - delegateIncomePct;

  // Dynamic expense breakdown
  const expenses = finance.filter(f => f.type === 'expense');
  const setupExpense = expenses.filter(f => f.category === 'Khách sạn' || f.category === 'Tiệc').reduce((acc, curr) => acc + curr.amount, 0);
  const adminExpense = expenses.filter(f => f.category === 'In ấn' || f.category === 'Marketing').reduce((acc, curr) => acc + curr.amount, 0);
  const setupExpensePct = totalExpense > 0 ? Math.min(100, Math.max(0, Math.round((setupExpense / totalExpense) * 100))) : 50;
  const adminExpensePct = 100 - setupExpensePct;

  // Alerts needing verification
  const pendingDelegatesToVerify = attendees.filter(a => a.paymentStatus === 'pending_verification');

  // SVG Chart Computations for delegate packages
  const standardCount = attendees.filter(a => a.packageId === 'pkg-standard').length;
  const vipCount = attendees.filter(a => a.packageId === 'pkg-vip').length;
  const onlineCount = attendees.filter(a => a.packageId === 'pkg-online').length;
  const maxVal = Math.max(standardCount, vipCount, onlineCount, 1);

  // Dynamic delegate package share relative to totalAttendees
  const standardPct = totalAttendees > 0 ? Math.round((standardCount / totalAttendees) * 100) : 0;
  const vipPct = totalAttendees > 0 ? Math.round((vipCount / totalAttendees) * 100) : 0;
  const onlinePct = totalAttendees > 0 ? Math.round((onlineCount / totalAttendees) * 100) : 0;

  // Combined and sorted recent registrations
  const recentRegistrations = [
    ...attendees.map(a => ({
      id: a.id,
      date: a.registrationDate || '',
      name: `${a.title || 'BS.'} ${a.fullName || ''}`,
      org: a.organization || '',
      type: 'Đại Biểu',
      badgeText: a.paymentStatus === 'paid' ? 'Email & Zalo OK' : 'Chờ Thanh Toán',
      badgeClass: a.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
    })),
    ...speakers.map(s => ({
      id: s.id,
      date: s.registrationDate || '',
      name: `${s.title || 'BS.'} ${s.fullName || ''}`,
      org: s.organization || '',
      type: 'Báo Cáo Viên',
      badgeText: s.status === 'approved' ? 'Đã duyệt đề tài' : 'Chờ phê duyệt',
      badgeClass: s.status === 'approved' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600',
    }))
  ]
  .filter(r => r.date)
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 5);

  const sortedNotificationLogs = [...logs]
    .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''))
    .slice(0, 5);

  // Dynamic Period Registration Speeds for Charting
  const getRegByPeriod = (startDay: number, endDay: number, month: number = 5) => {
    return attendees.filter(a => {
      if (!a.registrationDate) return false;
      const parts = a.registrationDate.split('-');
      if (parts.length < 3) return false;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return m === month && d >= startDay && d <= endDay;
    }).length;
  };

  const getRegInJune = () => {
    return attendees.filter(a => {
      if (!a.registrationDate) return false;
      const parts = a.registrationDate.split('-');
      if (parts.length < 3) return false;
      const m = parseInt(parts[1], 10);
      return m >= 6;
    }).length;
  };

  const period1 = getRegByPeriod(1, 10); // Tuần 1: 1-10 tháng 5
  const period2 = getRegByPeriod(11, 20); // Tuần 2: 11-20 tháng 5
  const period3 = getRegByPeriod(21, 31); // Tuần 3: 21-31 tháng 5
  const periodJune = getRegInJune(); // Hiện tại (Tháng 6 trở đi)
  const maxPeriodVal = Math.max(period1, period2, period3, periodJune, 1);

  const h1 = Math.max(Math.round((period1 / maxPeriodVal) * 80), 8);
  const h2 = Math.max(Math.round((period2 / maxPeriodVal) * 80), 8);
  const h3 = Math.max(Math.round((period3 / maxPeriodVal) * 80), 8);
  const h4 = Math.max(Math.round((periodJune / maxPeriodVal) * 80), 8);

  const totalCommittedSponsor = sponsors.reduce((acc, curr) => acc + (curr.pledgedAmount || 0), 0);
  const totalPaidSponsor = sponsors.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Alert Banner if action is needed */}
      {pendingDelegatesToVerify.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span className="font-semibold">
              Hành động khẩn cấp: Có {pendingDelegatesToVerify.length} đại biểu đang đợi kiểm chứng thanh toán chuyển khoản trước khi phát hành Thẻ vé điện tử & mã QR!
            </span>
          </div>
          <p className="text-[10px] text-slate-500 italic hidden lg:block">Kiểm tra phân hệ Đối soát tài chính để duyệt.</p>
        </div>
      )}

      {/* Stat Cards - Grid Arrangement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">DOANH THU THUẦN</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{(netFunding).toLocaleString()}đ</h3>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Tổng thu: {(totalIncome).toLocaleString()}đ
              </p>
            </div>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">REAL-TIME</span>
          </div>
        </div>

        {/* Metric 2: Attendees */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">NGƯỜI THAM DỰ</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{totalAttendees} Người</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Đã duyệt phí: <strong className="text-slate-700 font-bold">{verifiedPaidAttendees}</strong>
              </p>
            </div>
            <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">+12%</span>
          </div>
        </div>

        {/* Metric 3: Speakers/Presentations */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">BÁO CÁO VIÊN</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{totalSpeakers} Đề Tài</h3>
              <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                Đã duyệt: {approvedSpeakers} / {totalSpeakers}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium italic">Đang chờ: {pendingSpeakers}</span>
          </div>
        </div>

        {/* Metric 4: Internal Operations */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">CÔNG VIỆC NỘI BỘ</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex-1 mr-4">
              <h3 className="text-2xl font-black text-slate-900">{taskProgressPct}%</h3>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-amber-400" style={{ width: `${taskProgressPct}%` }} />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold shrink-0">{tasksDone}/{totalTasksCount} DONE</span>
          </div>
        </div>

      </div>

      {/* Analytical Visual Flow Section - 12 Columns Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Financial Flow Vector Chart (Left: 8 columns) */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Dòng tiền & Đối soát tài chính</h4>
              <p className="text-[10px] text-slate-400 font-medium">Đối chiếu tỷ lệ nguồn thu - dự kiến chi theo thời gian thực</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">DOANH THU THUẦN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-300 rounded-sm"></div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">TỔNG CHI</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 flex-1 flex flex-col justify-center">
            {/* Visual breakdown for Income */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Khoản Thu lũy kế (Phí đại biểu & Nhà tài trợ đóng góp)</span>
                <span className="text-indigo-650 font-bold">{(totalIncome).toLocaleString()}đ</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                <div className="bg-indigo-600 h-full hover:opacity-90 transition-all" style={{ width: `${delegateIncomePct}%` }} title="Phí đăng ký đại biểu" />
                <div className="bg-indigo-400 h-full hover:opacity-90 transition-all" style={{ width: `${sponsorIncomePct}%` }} title="Nhà tài trợ đồng hành" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-1 leading-snug">
                Phí đăng ký đại biểu ({delegateIncomePct}%) | Tài trợ đồng hành ({sponsorIncomePct}%)
              </span>
            </div>

            {/* Visual breakdown for Expenses */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Khoản Chi lũy kế (Sảnh họp, gala dinner, in ấn ấn phẩm, teabreak)</span>
                <span className="text-slate-605 font-bold">{(totalExpense).toLocaleString()}đ</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                <div className="bg-slate-500 h-full hover:opacity-90 transition-all" style={{ width: `${setupExpensePct}%` }} title="Hạ tầng & Tiệc Gala" />
                <div className="bg-slate-355 h-full hover:opacity-90 transition-all" style={{ width: `${adminExpensePct}%` }} title="In ấn, CME & Teabreak" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-1 leading-snug">
                Chi phí hạ tầng & Tiệc Gala ({setupExpensePct}%) | In ấn, CME & Teabreak ({adminExpensePct}%)
              </span>
            </div>

            {/* Timeline Growth columns simulation */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <p className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Tốc độ đăng ký trực tuyến (Số lượng / Tuần):</p>
              <div className="flex items-end justify-between h-24 bg-slate-50/50 rounded-xl px-10 py-3 border border-slate-150 relative">
                <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-30">
                  <div className="border-b border-dashed border-slate-300 w-full" />
                  <div className="border-b border-dashed border-slate-300 w-full" />
                </div>

                <div className="flex flex-col items-center gap-1.5 relative z-10 w-16">
                  <span className="text-[9px] text-indigo-650 font-bold">{period1} ĐB</span>
                  <div className="w-8 bg-indigo-500/20 border-t-2 border-indigo-500 rounded-t hover:bg-indigo-500 transition-all" style={{ height: `${h1}px` }} />
                  <span className="text-[9px] text-slate-400">1-10/5</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 relative z-10 w-16">
                  <span className="text-[9px] text-indigo-650 font-bold">{period2} ĐB</span>
                  <div className="w-8 bg-indigo-500/20 border-t-2 border-indigo-500 rounded-t hover:bg-indigo-500 transition-all" style={{ height: `${h2}px` }} />
                  <span className="text-[9px] text-slate-400">11-20/5</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 relative z-10 w-16">
                  <span className="text-[9px] text-indigo-650 font-bold">{period3} ĐB</span>
                  <div className="w-8 bg-indigo-500/20 border-t-2 border-indigo-500 rounded-t hover:bg-indigo-500 transition-all" style={{ height: `${h3}px` }} />
                  <span className="text-[9px] text-slate-400">21-31/5</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 relative z-10 w-16">
                  <span className="text-[9px] text-emerald-650 font-extrabold">{periodJune} ĐB</span>
                  <div className="w-8 bg-emerald-605 border-t-2 border-emerald-600 rounded-t shadow-sm animate-pulse" style={{ height: `${h4}px` }} />
                  <span className="font-bold text-[9px] text-emerald-600">Hiện tại</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/30 flex justify-around text-[9px] font-bold text-slate-400 uppercase tracking-widest rounded-b-xl">
            <span>Tuần khởi động</span>
            <span>Tuần truyền thông 1</span>
            <span>Tuần truyền thông 2</span>
            <span>Giai đoạn nước rút (Tháng 6+)</span>
          </div>
        </div>


        {/* Recent Automated Communications Feed (Right: 4 columns) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col font-sans">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo tự động</h4>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9.5px] font-bold uppercase tracking-wider">Hệ Thống Gần Đây</span>
          </div>

          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px]">
            {sortedNotificationLogs.length === 0 ? (
              <div className="space-y-4">
                {/* Fallback illustrative logs for design preservation */}
                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors opacity-80">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-850">Đăng ký thành công (Mẫu)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Gửi Zalo ZNS cho: BS. Hoàng Văn Minh (ATT-001)</p>
                    <span className="text-[9px] text-slate-355 block mt-1">Lịch sử hệ thống</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors opacity-80">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    ✉
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-850">Duyệt bài báo khoa học (Mẫu)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Gửi Email kèm tài liệu đến PGS.TS.BS. Trần Quốc Bảo</p>
                    <span className="text-[9px] text-slate-355 block mt-1">Lịch sử hệ thống</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50/40 border border-dashed border-indigo-150 rounded-xl text-center">
                  <p className="text-[10px] text-indigo-655 font-bold leading-relaxed">Phiên này chưa phát sinh thông báo mới!</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">ZNS và Email sẽ tự động gửi khi bạn phê duyệt thanh toán chuyển khoản đại biểu.</p>
                </div>
              </div>
            ) : (
              sortedNotificationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-300 transition-all shadow-xs">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                    log.type === 'zalo' ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {log.type === 'zalo' ? 'Z' : '✉'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{log.templateName}</p>
                    <p className="text-[10px] text-slate-505 mt-0.5 truncate leading-normal">
                      {log.type === 'zalo' ? 'Zalo ZNS' : 'Email'}: {log.recipient}
                    </p>
                    <span className="text-[9px] text-slate-404 block mt-1">{log.sentAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row - 3 Quick Cards resembling the requested layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Quick Card 1: Internal Task Breakdown */}
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-4">MỤC TIÊU VẬN HÀNH</h4>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-200">Khao sảnh & Setup Booth</span>
                <span className="text-[9px] font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">CTV TEAM</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-200">In ấn Thẻ đại biểu, Tài liệu</span>
                <span className="text-[9px] font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">SẢN XUẤT</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-200">Kiểm tra cổng API Zalo/Email</span>
                <span className="text-[9px] font-bold bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700">ADMIN AD</span>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-semibold text-slate-400">
            <span>Tổng số {totalTasksCount} công việc</span>
            <span className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5">
              Chi tiết công việc →
            </span>
          </div>
        </div>

        {/* Quick Card 2: Sponsor summary */}
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-md border border-indigo-500 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase text-indigo-200 tracking-wider mb-4">QUẢN LÝ NHÀ TÀI TRỢ</h4>
            <p className="text-xs text-indigo-100 mb-6 leading-relaxed">Đồng hành của doanh nghiệp dược phẩm, thiết bị y khoa hỗ trợ lớn nhất cho công tác tổ chức hội nghị.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-500/60 p-3 rounded-lg border border-indigo-400/40 text-center shadow-sm">
                <p className="text-sm font-bold">{(totalCommittedSponsor / 1000000).toFixed(0)}Mđ</p>
                <p className="text-[9px] opacity-80 mt-0.5">Cam kết tài trợ</p>
              </div>
              <div className="bg-indigo-500/60 p-3 rounded-lg border border-indigo-400/40 text-center shadow-sm">
                <p className="text-sm font-bold">{(totalPaidSponsor / 1000000).toFixed(0)}Mđ</p>
                <p className="text-[9px] opacity-80 mt-0.5">Đã giải ngân ({Math.round((totalPaidSponsor / Math.max(totalCommittedSponsor, 1)) * 100)}%)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <div className="w-full bg-indigo-700 text-indigo-100 text-[10px] font-bold py-2 rounded-lg text-center uppercase tracking-wider block border border-indigo-450">
              Đối soát tài trợ thời gian thực
            </div>
          </div>
        </div>

        {/* Quick Card 3: Roles and Access layout */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">PHẦN QUYỀN & VAI TRÒ</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">Ban Tổ Chức (BTC)</span>
                <span className="text-[9px] text-slate-400 font-bold">{btcCount} Account</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">Cộng Tác Viên (CTV)</span>
                <span className="text-[9px] text-slate-400 font-bold">{ctvCount} Account</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">Tổng quản trị (Admin)</span>
                <span className="text-[9px] text-slate-400 font-bold">{adminCount} Account</span>
              </div>
            </div>
          </div>
          <div className="pt-2 text-center">
            <span className="text-[10px] font-black text-indigo-600 hover:underline uppercase block tracking-wider">
              An toàn bảo mật & Phân quyền chủ động
            </span>
          </div>
        </div>

      </div>

      {/* Segment Distribution Ratios Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-655">Phân khúc: GÓI ĐẠI BIỂU VIP</span>
              <span className="text-slate-900 font-black">{vipCount} ({vipPct}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${vipPct}%` }} />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 block mt-2 leading-snug">Gói quyền lợi cao cấp tham dự Gala Dinner và sảnh đón VIP.</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-655">Phân khúc: GÓI TIÊU CHUẨN</span>
              <span className="text-slate-900 font-black">{standardCount} ({standardPct}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-650 h-full rounded-full transition-all" style={{ width: `${standardPct}%` }} />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 block mt-2 leading-snug">Tham dự toàn văn hội nghị trực tiếp kèm tài liệu chuyên san.</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-655">Phân khúc: GÓI TRỰC TUYẾN (ONLINE)</span>
              <span className="text-slate-900 font-black">{onlineCount} ({onlinePct}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${onlinePct}%` }} />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 block mt-2 leading-snug">Truy cập không giới hạn luồng phát sóng, cấp CME số hóa.</span>
        </div>
      </div>

      {/* Attendees & Registration Activity Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Nhật Ký Đăng Ký Hệ Thống Gần Đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[9px] text-slate-400 bg-slate-50 uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3">Mốc Thời Gian</th>
                <th className="px-5 py-3">Đối Tượng</th>
                <th className="px-5 py-3">Đơn Vị Công Tác</th>
                <th className="px-5 py-3">Hình Thức</th>
                <th className="px-5 py-3">Trạng Thái Hệ Thống</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-medium">
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">
                    Chưa có đăng ký nào được ghi nhận trên hệ thống.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">{reg.date}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{reg.name}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-semibold">{reg.org}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        reg.type === 'Đại Biểu' ? 'bg-indigo-50 text-indigo-700/80' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {reg.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold text-[9px] ${reg.badgeClass}`}>
                        {reg.badgeText}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
