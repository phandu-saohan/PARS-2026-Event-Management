import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('pars_remember_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('pars_remember_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('pars_remember_me') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (!res.success) {
        setError(res.error || 'Đăng nhập không thành công');
      } else {
        if (rememberMe) {
          localStorage.setItem('pars_remember_me', 'true');
          localStorage.setItem('pars_remember_email', email);
          localStorage.setItem('pars_remember_password', password);
        } else {
          localStorage.removeItem('pars_remember_me');
          localStorage.removeItem('pars_remember_email');
          localStorage.removeItem('pars_remember_password');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden select-none">
      {/* Background glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px]" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-pink-500/5 rounded-full blur-[150px]" />

      <div className="max-w-md w-full relative z-10 bg-white/80 border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl shadow-slate-100">
        <div className="text-center mb-8">
          <div className="relative group w-20 h-20 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-100 mb-5 border border-indigo-500/10 overflow-hidden">
            {/* Glossy overlay reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <ShieldCheck className="w-10 h-10 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            Cổng Quản Trị Hệ Thống
          </h2>
          <div className="h-0.5 w-12 bg-indigo-600 mx-auto mt-3 rounded-full" />
          <p className="text-xs text-slate-500 mt-3 font-medium tracking-wide">
            HỘI NGHỊ KHOA HỌC THẨM MỸ QUỐC TẾ <span className="text-indigo-600 font-bold">PARS 2026</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-4 text-xs text-rose-600 flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 tracking-wider block uppercase">
              Email Tài Khoản
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-650 transition-colors duration-200">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten.nv@pars.org"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/10 transition-all duration-200 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 tracking-wider block uppercase">
              Mật Khẩu
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-650 transition-colors duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-10 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/10 transition-all duration-200 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 hover:text-slate-650 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <span>Ghi nhớ mật khẩu</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer border-none font-sans tracking-wide"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Đang kiểm tra hệ thống...
              </>
            ) : (
              'Đăng Nhập Hệ Thống'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Hệ Thống Kiểm Soát Sự Kiện
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Thông tin truy cập được mã hóa và bảo mật. Vui lòng không chia sẻ tài khoản.
          </p>
          <p className="text-[9px] text-slate-400/80 font-medium mt-1">
            PARS © 2026 • Bảo mật SSL & Chế độ Offline-First
          </p>
        </div>
      </div>
    </div>
  );
}
