/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, Award, Calendar, CheckSquare, Coins, Megaphone, Settings, 
  BarChart2, Globe, Shield, User, FileText, RefreshCw, LogOut, Send,
  HelpCircle, Search, Share2
} from 'lucide-react';
import { Role } from '../types';
import { useAuth } from './AuthProvider';
import { store } from '../dataStore';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentRole: Role;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, onNavigate, currentRole, isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const menuItems = [
    { id: 'overview', name: 'Tổng Quan', icon: BarChart2, permission: 'overview.view' },
    { id: 'schedule', name: 'Lịch Trình Hội Nghị', icon: Calendar, permission: 'schedule.view' },
    { id: 'speakers', name: 'Báo Cáo Viên', icon: FileText, permission: 'speakers.view' },
    { id: 'attendees', name: 'Đại Biểu', icon: Users, permission: 'attendees.view' },
    { id: 'sponsors', name: 'Nhà Tài Trợ', icon: Award, permission: 'sponsors.view' },
    { id: 'notifications', name: 'Thông Báo Tự Động', icon: Megaphone, permission: 'notifications.view' },
    { id: 'bulk-send', name: 'Gửi Tin Hàng Loạt', icon: Send, permission: 'notifications.send' },
    { id: 'tasks', name: 'Công Việc Nội Bộ', icon: CheckSquare, permission: 'tasks.view' },
    { id: 'finances', name: 'Đối Soát Tài Chính', icon: Coins, permission: 'finances.view' },
    { id: 'marketing', name: 'Marketing Sự Kiện', icon: Share2, permission: 'marketing.view' },
    { id: 'settings', name: 'Cài Đặt Hệ Thống', icon: Settings, permission: 'settings.view' },
    { id: 'user-guide', name: 'Hướng Dẫn Sử Dụng', icon: HelpCircle },
  ];


  const publicLinks = [
    { id: 'event-details', name: 'Trang Tin Sự Kiện', icon: Globe },
    { id: 'register-delegate', name: 'Đăng Ký Đại Biểu (Form)', icon: Users },
    { id: 'register-speaker', name: 'Đăng Ký Báo Cáo (Form)', icon: FileText },
    { id: 'register-sponsor', name: 'Đăng Ký Tài Trợ (Form)', icon: Award },
    { id: 'check-registration', name: 'Tra Cứu Vé Điện Tử', icon: Search },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/65 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 md:sticky md:z-0
        w-64 bg-indigo-950 text-indigo-100 flex flex-col justify-between shrink-0 border-r border-[#1e293b]/40 h-screen overflow-y-auto font-sans
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
        {/* Brand visual header with Pink accent gradient logo */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-indigo-900/50 pb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-650 flex items-center justify-center text-white font-extrabold text-sm tracking-widest shadow-md shadow-amber-500/10">
            PA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight leading-none">PARS 2026</h1>
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping" />
            </div>
            <p className="text-[9px] text-[#94a3b8] font-mono tracking-wider mt-1.5 uppercase font-semibold">Hệ thống Quản lý Sự kiện</p>
          </div>
        </div>
 
  
 
        {/* Dashboard Menu Section */}
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase text-indigo-400/80 block mb-3.5 tracking-widest px-1">PHÂN HỆ NGHIỆP VỤ</span>
          {menuItems.map((item) => {
            const hasAccess = !item.permission || (user && store.hasPermission(user, item.permission));
            const Icon = item.icon;
            
            if (!hasAccess) return null;
 
            const isActive = currentView === item.id;
 
            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold select-none transition-all cursor-pointer border-0 ${
                  isActive 
                    ? 'bg-slate-900/60 text-white font-bold border-l-4 border-pink-600 pl-2 shadow-inner' 
                    : 'hover:bg-indigo-900/40 hover:text-white text-indigo-200/80 pl-3'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-pink-500 drop-shadow-[0_0_6px_rgba(219,39,119,0.4)]' : 'text-indigo-450'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
 
        {/* Public testing pages */}
        <div className="mt-8 space-y-1">
          <span className="text-[9px] font-black uppercase text-indigo-400/80 block mb-3.5 tracking-widest px-1">XEM GIAO DIỆN PUBLIC</span>
          {publicLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                id={`menu-item-${link.id}`}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-xs transition-all font-semibold select-none cursor-pointer border-0 ${
                  isActive 
                    ? 'bg-slate-900/60 text-white font-bold border-l-4 border-pink-600 pl-2 shadow-inner' 
                    : 'hover:bg-indigo-900/40 hover:text-white text-indigo-200/80 pl-3'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-pink-500 drop-shadow-[0_0_6px_rgba(219,39,119,0.4)]' : 'text-indigo-450'}`} />
                <span>{link.name}</span>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Footer controls with subtle pink indicator */}
      <div className="p-4 border-t border-indigo-900/50 bg-indigo-950/40 text-[11px] space-y-3.5 shrink-0">

        {user && (
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
                signOut();
              }
            }}
            className="w-full py-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-[10.5px] text-rose-300 hover:text-white transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer border border-rose-950/50"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            Đăng Xuất ({user.name})
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
