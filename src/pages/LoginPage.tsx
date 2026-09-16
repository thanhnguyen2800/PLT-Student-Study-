import React, { useState } from 'react';
import { BookOpen, Lock, Mail, ShieldAlert, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PltLogo } from '../components/common/PltLogo';

export const LoginPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
        
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <PltLogo size="lg" className="mb-4" />
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            STUDENT STUDY
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nền tảng học tập & ôn luyện kiến thức trực tuyến
          </p>
        </div>

        {/* Security Policy Notice */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-300">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Chính sách bảo mật:</strong> Hệ thống không mở đăng ký công khai. Tài khoản học viên và giảng viên được tạo và cấp quyền duy nhất bởi Ban Quản Trị.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            {isLoading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Cấp lại mật khẩu</h3>
            </div>
            {forgotSent ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Yêu cầu đã được gửi đến Ban Quản Trị. Quản trị viên sẽ kiểm tra và cấp mã đặt lại mật khẩu an toàn cho bạn.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Đã hiểu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Do chính sách không công khai tự đặt lại, vui lòng nhập email đã được cấp để gửi thông báo đến Quản trị viên:
                </p>
                <input
                  type="email"
                  defaultValue={email}
                  placeholder="name@school.edu.vn"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => setForgotSent(true)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
