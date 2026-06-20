import React, { useEffect, useState } from 'react';
import { X, Download, Smartphone, Share2 } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    if (isDismissed) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show installation instructions after a short delay for iOS users
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsVisible(false);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:bottom-4 md:w-96 transition-all duration-500 transform translate-y-0 shadow-2xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-white backdrop-blur-md bg-opacity-95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">PARS 2026</h4>
              <p className="text-xs text-slate-400">
                {isIOS 
                  ? "Cài đặt ứng dụng trên iPhone/iPad"
                  : "Cài đặt ứng dụng di động để check-in và nhận thông báo"
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-lg transition duration-150 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="text-[11.5px] text-slate-350 bg-slate-850 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
            Để cài đặt ứng dụng:
            <ol className="list-decimal pl-4 mt-1.5 space-y-1.5">
              <li>
                Nhấp vào nút chia sẻ <strong className="text-indigo-400 inline-flex items-center gap-0.5"><Share2 className="w-3.5 h-3.5 inline" /></strong> ở phía dưới cùng màn hình của Safari.
              </li>
              <li>
                Cuộn xuống dưới và chọn <strong className="text-white">Thêm vào MH chính</strong> (Add to Home Screen).
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={handleInstallClick}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 w-full justify-center cursor-pointer border-none"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt ứng dụng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
