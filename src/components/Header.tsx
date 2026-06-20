/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Bell, AlertTriangle, CheckCircle, Database, ShieldAlert, BadgeCheck, Menu, Wifi, WifiOff, Trash2, Check, Radio } from 'lucide-react';
import { store } from '../dataStore';
import { RealtimeNotification, sendRealtimeNotification } from '../lib/realtime';
import { useAuth } from './AuthProvider';

interface HeaderProps {
  currentView: string;
  role: string;
  onToggleSidebar: () => void;
  notifications?: RealtimeNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotifications?: () => void;
  sseConnected?: boolean;
}

export default function Header({ 
  currentView, 
  role, 
  onToggleSidebar,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  sseConnected = true
}: HeaderProps) {
  const { user } = useAuth();
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getHeadlineName = () => {
    switch (currentView) {
      case 'overview': return 'Bảng Điều Khiển Tổng Quan';
      case 'attendees': return 'Danh Sách Đại Biểu Tham Dự';
      case 'speakers': return 'Phê Duyệt Bài Báo Cáo & Tác Giả';
      case 'schedule': return 'Quản Lý Lịch Trình Hội Nghị';
      case 'tasks': return 'Quản Lý Công Việc Nội Bộ';
      case 'finances': return 'Đối Soát & Thu Chi Tài Chính';
      case 'sponsors': return 'Danh Sách Nhà Tài Trợ & Đồng Hành';
      case 'notifications': return 'Hệ Thống Thông Báo Tự Động (Zalo/Email)';
      case 'settings': return 'Thiết Lập Vai Trò, Gói Thước & Supabase';
      default: return 'PARS 2026 Admin Portal';
    }
  };

  const handleInstantCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketIdInput) return;
    
    const id = ticketIdInput.trim().toUpperCase();
    const attendees = store.getAttendees();
    
    const findAtt = attendees.find(a => a.id === id || a.qrCodeValue === id || a.phone === id);
    if (findAtt) {
      if (findAtt.isCheckedIn) {
        setCheckInResult({ success: false, msg: `Đại biểu ${findAtt.title} ${findAtt.fullName} đã check-in trước đó vào lúc ${findAtt.checkInTime}.` });
      } else {
        findAtt.isCheckedIn = true;
        findAtt.checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
        store.saveAttendee(findAtt);
        setCheckInResult({ success: true, msg: `CHECK-IN THÀNH CÔNG: Chào mừng đại biểu ${findAtt.title} ${findAtt.fullName}!` });
        
        // Broadcast to all connected clients
        sendRealtimeNotification(
          'Đại biểu Điểm Danh sảnh',
          `Đại biểu ${findAtt.title} ${findAtt.fullName} (${findAtt.organization}) vừa quét mã QR và điểm danh thành công!`,
          'success'
        );
      }
    } else {
      setCheckInResult({ success: false, msg: `Không tìm thấy thông tin Đại biểu có ID hoặc SĐT: "${id}"` });
    }
    setTicketIdInput('');
    setTimeout(() => setCheckInResult(null), 8500);
  };

  const dbConfig = store.getSupabaseConfig();

  return (
    <header className="bg-white border-b border-slate-200 pt-[env(safe-area-inset-top,0px)] h-[calc(4rem+env(safe-area-inset-top,0px))] px-4 md:px-6 flex items-center justify-between gap-3 font-sans shrink-0 relative select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Hamburger Toggle Button for Mobile Navigation */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 rounded-xl md:hidden focus:outline-none cursor-pointer border-none bg-transparent flex items-center justify-center shrink-0"
          title="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight leading-none mb-1 truncate">
            {getHeadlineName()}
          </h2>
          <p className="text-[8px] sm:text-[9.5px] text-slate-450 font-bold tracking-wider uppercase font-mono">
            Hội nghị PARS 2026 Admin
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Real-time Bell Dropdown Component Container */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(prev => !prev)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer relative border border-slate-200/80 hover:border-indigo-400"
            title="Thông báo sảnh Real-time"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black tracking-tighter flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-55 overflow-hidden text-slate-800">
              <div className="bg-slate-900 p-3.5 text-white flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping" />
                  <span className="text-[11px] font-black tracking-wider uppercase">THÔNG BÁO REALTIME</span>
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        onMarkAllAsRead && onMarkAllAsRead();
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold cursor-pointer"
                    >
                      Đọc hết
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn chắc muốn xóa toàn bộ thông báo sảnh hiện tại?')) {
                          onClearNotifications && onClearNotifications();
                        }
                      }}
                      className="text-[10px] text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Xóa tất
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic font-medium">Không có thông báo mới nào từ sảnh.</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => onMarkAsRead && onMarkAsRead(n.id)}
                      className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 relative ${
                        !n.read ? 'bg-indigo-50/20 font-medium' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          n.category === 'success' ? 'bg-emerald-50 text-emerald-750 border border-emerald-150' : 
                          n.category === 'warning' ? 'bg-amber-50 text-amber-750 border border-amber-150' : 
                          n.category === 'system' ? 'bg-rose-50 text-rose-750 border border-rose-150' : 
                          n.category === 'badge' ? 'bg-indigo-50 text-indigo-750 border border-indigo-150' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {n.category}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{n.timestamp}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-[11.5px] leading-snug">{n.title}</h5>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-normal">{n.message}</p>
                      
                      {!n.read && (
                        <div className="absolute right-2 top-2.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-50 py-2 px-3 text-center border-t border-slate-100">
                <span className="text-[9px] text-slate-400 font-mono">Bản tin điểm danh & đăng ký thành viên</span>
              </div>
            </div>
          )}
        </div>

        {/* User Account Info Display */}
        {(() => {
          const getUserProfile = () => {
            const roleVal = user?.role || role;
            const nameVal = user?.name || (roleVal === 'admin' ? 'GS.TS. Phạm Minh Chi' : roleVal === 'btc' ? 'Đặng Thùy Dương' : 'Trần Thế Minh');
            const emailVal = user?.email || (roleVal === 'admin' ? 'chi.pham@pars.org' : roleVal === 'btc' ? 'duong.dt@pars.org' : 'minh.tt@pars.org');
            
            const initials = nameVal
              .split(' ')
              .filter(Boolean)
              .map(n => n[0])
              .slice(-2)
              .join('')
              .toUpperCase() || 'US';

            switch (roleVal) {
              case 'admin':
                return {
                  name: nameVal,
                  email: emailVal,
                  roleLabel: 'Toàn Trị',
                  badgeClass: 'bg-rose-50 border-rose-200 text-rose-700',
                  avatarInitials: initials,
                  avatarClass: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                };
              case 'btc':
                return {
                  name: nameVal,
                  email: emailVal,
                  roleLabel: 'Ban Tổ Chức',
                  badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                  avatarInitials: initials,
                  avatarClass: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                };
              case 'ctv':
              default:
                return {
                  name: nameVal,
                  email: emailVal,
                  roleLabel: 'Cộng Tác Viên',
                  badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  avatarInitials: initials,
                  avatarClass: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                };
            }
          };
          const userProfile = getUserProfile();
          return (
            <div className="flex items-center gap-2 bg-slate-50 md:bg-slate-50 border border-slate-200 p-1 md:p-1.5 rounded-xl text-xs select-none shadow-sm md:shadow-none">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black tracking-wider uppercase shadow-inner ${userProfile.avatarClass}`}>
                {userProfile.avatarInitials}
              </div>
              <div className="hidden md:block text-left leading-none">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="font-bold text-slate-800 text-[11px] whitespace-nowrap">{userProfile.name}</span>
                  <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border leading-none ${userProfile.badgeClass}`}>
                    {userProfile.roleLabel}
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 font-mono font-semibold">{userProfile.email}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Check In Results toast in header */}
      {checkInResult && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-indigo-600 text-white text-xs font-semibold shadow-md flex items-center gap-2 animate-slide-down z-40">
          <CheckCircle className="w-4 h-4 shrink-0 text-white" />
          <span>{checkInResult.msg}</span>
        </div>
      )}
    </header>
  );
}
