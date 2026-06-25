/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Role } from './types';
import { store } from './dataStore';
import { RealtimeNotification, subscribeToNotifications, clearServerNotifications } from './lib/realtime';
import { Bell, X, Check, Info, AlertTriangle, AlertCircle, Wifi, Megaphone, BarChart2, Users, FileText, Award, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AuthProvider, useAuth } from './components/AuthProvider';

// Dynamic imports for views
const LoginPage = lazy(() => import('./views/LoginPage'));

// Admin views
const DashboardOverview = lazy(() => import('./views/DashboardOverview'));
const AttendeeManagement = lazy(() => import('./views/AttendeeManagement'));
const SpeakerManagement = lazy(() => import('./views/SpeakerManagement'));
const ScheduleManagement = lazy(() => import('./views/ScheduleManagement'));
const InternalTasks = lazy(() => import('./views/InternalTasks'));
const FinanceReconciliation = lazy(() => import('./views/FinanceReconciliation'));
const SponsorManagement = lazy(() => import('./views/SponsorManagement'));
const NotificationSystem = lazy(() => import('./views/NotificationSystem'));
const SettingsPanel = lazy(() => import('./views/SettingsPanel'));
const UserGuide = lazy(() => import('./views/UserGuide'));
const EventMarketing = lazy(() => import('./views/EventMarketing'));

// Public views
const PublicEventDetails = lazy(() => import('./views/PublicEventDetails'));
const PublicDelegateRegister = lazy(() => import('./views/PublicDelegateRegister'));
const PublicSpeakerRegister = lazy(() => import('./views/PublicSpeakerRegister'));
const PublicSponsorRegister = lazy(() => import('./views/PublicSponsorRegister'));
const PublicCheckRegistration = lazy(() => import('./views/PublicCheckRegistration'));

// Required permission for each view
const VIEW_REQUIRED_PERMISSIONS: Record<string, string> = {
  overview: 'overview.view',
  attendees: 'attendees.view',
  speakers: 'speakers.view',
  schedule: 'schedule.view',
  tasks: 'tasks.view',
  finances: 'finances.view',
  sponsors: 'sponsors.view',
  notifications: 'notifications.view',
  'bulk-send': 'notifications.send',
  settings: 'settings.view',
  marketing: 'marketing.view',
};

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const validViews = [
        'overview', 'attendees', 'speakers', 'schedule', 'tasks', 'finances', 'sponsors', 'notifications', 'bulk-send', 'settings', 'marketing',
        'event-details', 'register-delegate', 'register-speaker', 'register-sponsor', 'check-registration'
      ];
      if (viewParam && validViews.includes(viewParam)) {
        return viewParam;
      }
    } catch (e) {
      console.error('Error parsing view parameter:', e);
    }
    return 'event-details';
  });
  const [role, setRole] = useState<Role>('admin');

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
    // Clear reload flag on successful load
    sessionStorage.removeItem('reloaded_once');
  }, [user]);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Real-time Push Notifications State
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [activeToast, setActiveToast] = useState<RealtimeNotification | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(true);



  // Apply PWA logo & theme-color from config to DOM on startup
  useEffect(() => {
    const applyPwaAssets = () => {
      const cfg = store.getBusinessConfig();
      const logoUrl = cfg.pwaLogoUrl;
      const themeColor = cfg.pwaThemeColor || '#be6940';

      if (logoUrl) {
        // Update favicon
        let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = logoUrl;
        favicon.type = logoUrl.startsWith('data:image/png') ? 'image/png'
          : logoUrl.startsWith('data:image/svg') ? 'image/svg+xml'
          : logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'image/jpeg'
          : 'image/png';

        // Update apple-touch-icon
        let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          document.head.appendChild(appleIcon);
        }
        appleIcon.href = logoUrl;
      }

      // Always update theme-color
      const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeMeta) themeMeta.content = themeColor;
    };

    // Run immediately then again once store finishes loading from Supabase
    applyPwaAssets();
    const onStoreLoaded = () => applyPwaAssets();
    window.addEventListener('store-loaded', onStoreLoaded);
    return () => window.removeEventListener('store-loaded', onStoreLoaded);
  }, []);

  // Real-time Push Notifications Listening (Supabase Realtime / Local Fallback)
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(
      (payload) => {
        setNotifications(prev => [payload, ...prev]);
        setActiveToast(payload);
        
        // Try playing customized system sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2857/2857-84.wav');
          audio.volume = 0.25;
          audio.play().catch(() => {});
        } catch (soundErr) {
          console.log('Audio autoplay blocked by browser policy');
        }


      },
      (history) => {
        setNotifications(history);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);



  // Dynamically load and initialize OneSignal Push Notification if enabled in settings
  useEffect(() => {
    let isInitialized = false;

    const initOneSignal = () => {
      try {
        const rawConfig = localStorage.getItem('pars_config_onesignal');
        if (rawConfig) {
          const config = JSON.parse(rawConfig);
          if (config && config.isEnabled && config.appId) {
            if (isInitialized) return;
            isInitialized = true;

            let script = document.querySelector('script[src*="OneSignalSDK.page.js"]') as HTMLScriptElement;
            if (!script) {
              script = document.createElement('script');
              script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
              script.defer = true;
              document.head.appendChild(script);
            }

            const windowObj = window as any;
            windowObj.OneSignalDeferred = windowObj.OneSignalDeferred || [];
            windowObj.OneSignalDeferred.push(async (OneSignal: any) => {
              if (OneSignal.isInitialized && OneSignal.isInitialized()) {
                console.log('[OneSignal] SDK already initialized, skipping init');
                return;
              }
              await OneSignal.init({
                appId: config.appId,
                safari_web_id: config.safariWebId || undefined,
                serviceWorkerPath: 'sw.js',
                serviceWorkerParam: { scope: '/' },
                serviceWorkerOverrideForTypical: true,
                notifyButton: {
                  enable: true,
                  size: 'medium',
                  position: 'bottom-right',
                },
              });
            });
          }
        }
      } catch (e) {
        console.error('Error loading OneSignal Web SDK:', e);
      }
    };

    // Run on mount
    initOneSignal();

    // Listen to store load changes
    window.addEventListener('store-loaded', initOneSignal);
    window.addEventListener('store-updated', initOneSignal);
    return () => {
      window.removeEventListener('store-loaded', initOneSignal);
      window.removeEventListener('store-updated', initOneSignal);
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = async () => {
    try {
      await clearServerNotifications();
      setNotifications([]);
      setActiveToast(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Check if current view is public or admin-side
  const isPublicView = ['event-details', 'register-delegate', 'register-speaker', 'register-sponsor', 'check-registration'].includes(currentView);

  // Middleware effect: watch role and view changes, block and redirect unauthorized access
  useEffect(() => {
    if (isPublicView || !user) return;

    const requiredPermission = VIEW_REQUIRED_PERMISSIONS[currentView];
    if (requiredPermission && !store.hasPermission(user, requiredPermission)) {
      // Set notice and redirect smoothly
      setAuthError(`Bạn không có quyền truy cập chuyên phân hệ "${currentView.toUpperCase()}". Đang chuyển hướng về Bảng điều khiển.`);
      setCurrentView('overview');
      
      const timer = setTimeout(() => {
        setAuthError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentView, user, isPublicView]);

  const handleNavigate = (view: string) => {
    const isPublic = ['event-details', 'register-delegate', 'register-speaker', 'register-sponsor', 'check-registration'].includes(view);
    if (!isPublic && user) {
      const requiredPermission = VIEW_REQUIRED_PERMISSIONS[view];
      if (requiredPermission && !store.hasPermission(user, requiredPermission)) {
        alert(`Tài khoản phân quyền của bạn không được phép truy cập phân hệ này!`);
        return;
      }
    }
    
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const handleResetData = () => {
    store.resetToDefaults();
  };

  const renderActiveView = () => {
    switch (currentView) {
      // Admin-side views
      case 'overview':
        return <DashboardOverview role={role} />;
      case 'attendees':
        return <AttendeeManagement role={role} />;
      case 'speakers':
        return <SpeakerManagement role={role} />;
      case 'schedule':
        return <ScheduleManagement role={role} />;
      case 'tasks':
        return <InternalTasks role={role} />;
      case 'finances':
        return <FinanceReconciliation role={role} />;
      case 'sponsors':
        return <SponsorManagement role={role} onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationSystem defaultTab="templates" hideTabs={true} />;
      case 'bulk-send':
        return <NotificationSystem defaultTab="bulk" hideTabs={true} />;
      case 'settings':
        return (
          <SettingsPanel role={role} />
        );
      case 'marketing':
        return <EventMarketing role={role} />;
      case 'user-guide':
        return <UserGuide />;

      // Public-side pages
      case 'event-details':
        return <PublicEventDetails onNavigate={handleNavigate} />;
      case 'register-delegate':
        return <PublicDelegateRegister onNavigate={handleNavigate} />;
      case 'register-speaker':
        return <PublicSpeakerRegister onNavigate={handleNavigate} />;
      case 'register-sponsor':
        return <PublicSponsorRegister onNavigate={handleNavigate} />;
      case 'check-registration':
        return <PublicCheckRegistration onNavigate={handleNavigate} />;
      
      default:
        return <DashboardOverview role={role} />;
    }
  };

  // ⚡ Perf: Show skeleton layout instead of blank spinner during auth verification
  // This renders the actual app shell immediately from localStorage cache
  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen overflow-hidden">
        {/* Skeleton Sidebar */}
        <div className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200 p-4 gap-3 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl mb-2" />
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
        {/* Skeleton Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Skeleton Header */}
          <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-3 shrink-0 animate-pulse">
            <div className="h-7 w-36 bg-slate-100 rounded-lg" />
            <div className="flex-1" />
            <div className="h-7 w-7 bg-slate-100 rounded-full" />
            <div className="h-7 w-7 bg-slate-100 rounded-full" />
          </div>
          {/* Skeleton content cards */}
          <div className="flex-1 p-6 animate-pulse">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl" />
                ))}
              </div>
              <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
              <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (!user && !isPublicView) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
        <LoginPage />
      </Suspense>
    );
  }

  if (isPublicView) {
    // Render public layout standing alone
    return (
      <div className="bg-slate-50 min-h-screen pt-[env(safe-area-inset-top,0px)]">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
          {renderActiveView()}
        </Suspense>
      </div>
    );
  }

  // Render Admin Layout with Sidebar + Header
  return (
    <div className="flex bg-slate-50 min-h-screen overflow-hidden text-slate-800">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentRole={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Admin Column Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Unauthorized Access Notification Overlay Banner */}
        {authError && (
          <div className="absolute top-20 right-6 z-50 bg-rose-500 text-white p-3.5 rounded-xl shadow-xl text-xs font-black tracking-wide border border-rose-600 animate-bounce flex items-center gap-2 max-w-sm">
            <span className="text-sm">⚠️</span>
            <span>{authError}</span>
          </div>
        )}

        {/* Header container */}
        <Header 
          currentView={currentView} 
          role={role} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearNotifications={handleClearNotifications}
          sseConnected={sseConnected}
        />

        {/* Inner page content container layout */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6 bg-slate-50/70">
          <div className="max-w-7xl mx-auto" key={currentView}>
            <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
              {renderActiveView()}
            </Suspense>
          </div>
        </main>

        {/* Mobile Bottom Navigation Menu */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)] h-[calc(4rem+env(safe-area-inset-bottom,0px))] select-none">
          {[
            { id: 'overview', name: 'Tổng Quan', icon: BarChart2 },
            { id: 'attendees', name: 'Đại Biểu', icon: Users },
            { id: 'speakers', name: 'Báo Cáo', icon: FileText },
            { id: 'sponsors', name: 'Tài Trợ', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all cursor-pointer border-none bg-transparent ${
                  isActive ? 'text-indigo-650 font-bold scale-105' : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                <div className={`p-1 mt-0.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <span className="text-[9px] font-bold tracking-tight mb-0.5">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Real-time Push Notifications Toast Overlay banner with framer motion */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-755 text-white p-4 rounded-2xl shadow-xl flex gap-3.5"
              id="realtime-toast"
            >
              {/* Category Icon indicator */}
              <div className="shrink-0">
                {activeToast.category === 'success' && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-5 h-5 shrink-0" />
                  </div>
                )}
                {activeToast.category === 'warning' && (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  </div>
                )}
                {activeToast.category === 'system' && (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-450 border border-rose-500/30 flex items-center justify-center">
                    <Wifi className="w-5 h-5 shrink-0" />
                  </div>
                )}
                {activeToast.category === 'info' && (
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <Info className="w-5 h-5 shrink-0" />
                  </div>
                )}
                {activeToast.category === 'badge' && (
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 shrink-0" />
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2.5">
                  <h4 className="text-xs font-black tracking-wide text-slate-100 truncate">{activeToast.title}</h4>
                  <span className="text-[9px] font-mono font-bold text-slate-500">{activeToast.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-sans">{activeToast.message}</p>
                <div className="mt-2 text-[10px] font-black text-indigo-400 tracking-wide flex items-center gap-1 uppercase">
                  <span>● realtime notification push</span>
                </div>
              </div>

              {/* Close action */}
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white self-start cursor-pointer transition-all shrink-0 p-0.5 hover:bg-slate-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Mobile Installation Prompt Banner */}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
