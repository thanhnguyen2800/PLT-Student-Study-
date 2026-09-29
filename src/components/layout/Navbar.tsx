import React, { useState } from 'react';
import { 
  BookOpen, 
  Gamepad2, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Menu, 
  X,
  Sun,
  Moon,
  Sparkles,
  Home,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RoleBadge } from '../common/Badge';
import { PltLogo } from '../common/PltLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAIChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAIChat }) => {
  const { currentUser, logout, canAccess } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tabId: string) => {
    if (tabId === 'tinhnang') {
      if (currentTab !== 'intro') {
        setCurrentTab('intro');
      }
      setTimeout(() => {
        const el = document.getElementById('tinh-nang');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      setMobileMenuOpen(false);
      return;
    }

    if (tabId === 'ai') {
      openAIChat();
      setMobileMenuOpen(false);
      return;
    }

    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-clip bg-white/90 dark:bg-[#07192d]/90 backdrop-blur-md border-b border-sky-100 dark:border-sky-900/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo - Matching image.png */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0 select-none" 
          onClick={() => handleNavClick('intro')}
        >
          <PltLogo size="md" />
          <div className="hidden sm:block">
            <span className="font-black text-xl lg:text-2xl tracking-tight bg-linear-to-r from-sky-700 via-sky-600 to-indigo-700 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">
              STUDENT STUDY
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links - Matching layout and enlarged typography of image.png */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          
          {/* 1. Trang chủ */}
          <button
            onClick={() => handleNavClick('intro')}
            className={`px-4 py-2 rounded-xl text-base font-semibold transition-all ${
              currentTab === 'intro'
                ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/70 dark:bg-sky-950/50'
                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30'
            }`}
          >
            Trang chủ
          </button>

          {/* 2. Bàn học (Khi đã đăng nhập) */}
          {currentUser && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`px-4 py-2 rounded-xl text-base font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/70 dark:bg-sky-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30'
              }`}
            >
              Bàn học
            </button>
          )}

          {/* 3. Tính năng */}
          <button
            onClick={() => handleNavClick('tinhnang')}
            className="px-4 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all"
          >
            Tính năng
          </button>

          {/* 4. Kho Quiz */}
          <button
            onClick={() => handleNavClick('quizzes')}
            className={`px-4 py-2 rounded-xl text-base font-semibold transition-all ${
              currentTab === 'quizzes'
                ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/70 dark:bg-sky-950/50'
                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30'
            }`}
          >
            Kho Quiz
          </button>

          {/* 5. Đấu trường Live (with HOT badge matching image.png) */}
          <button
            onClick={() => handleNavClick('multiplayer')}
            className={`px-4 py-2 rounded-xl text-base font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'multiplayer'
                ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/70 dark:bg-sky-950/50'
                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30'
            }`}
          >
            <span>Đấu trường Live</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-xs tracking-wider">
              HOT
            </span>
          </button>

          {/* 6. Trợ giảng AI (with AI badge matching image.png) */}
          <button
            onClick={() => handleNavClick('ai')}
            className="px-4 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all flex items-center gap-1.5"
          >
            <span>Trợ giảng AI</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black shadow-xs tracking-wider">
              AI
            </span>
          </button>

          {/* 7. Mini Games */}
          <button
            onClick={() => handleNavClick('minigames')}
            className={`px-4 py-2 rounded-xl text-base font-semibold transition-all ${
              currentTab === 'minigames'
                ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/70 dark:bg-sky-950/50'
                : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/30'
            }`}
          >
            Mini Games
          </button>

          {/* 8. Admin Page (Only if Admin/Super Admin) */}
          {canAccess(['ADMIN', 'SUPER_ADMIN']) && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-4 py-2 rounded-xl text-base font-semibold transition-all flex items-center gap-1.5 ${
                currentTab.startsWith('admin')
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60'
                  : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Quản trị</span>
            </button>
          )}

        </nav>

        {/* Right Section: Theme Toggle & Login/User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Login Button (If Guest) - Matching image.png right top button */}
          {!currentUser ? (
            <button
              onClick={() => setCurrentTab('login')}
              className="px-6 py-2.5 rounded-full border-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white font-bold text-base transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            /* User Profile Dropdown (If Logged In) */
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-xs text-slate-500">
                    <RoleBadge role={currentUser.role} />
                  </div>
                </div>
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.email}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <RoleBadge role={currentUser.role} />
                      <span className="text-xs text-slate-400">{currentUser.department || 'Khoa CNTT'}</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setCurrentTab('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Bàn học của tôi</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        setCurrentTab('intro');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất hệ thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => handleNavClick('intro')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Trang chủ
          </button>
          {currentUser && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bàn học
            </button>
          )}
          <button
            onClick={() => handleNavClick('tinhnang')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tính năng
          </button>
          <button
            onClick={() => handleNavClick('quizzes')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Kho Quiz
          </button>
          <button
            onClick={() => handleNavClick('multiplayer')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
          >
            <span>Đấu trường Live</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-black">HOT</span>
          </button>
          <button
            onClick={() => handleNavClick('ai')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
          >
            <span>Trợ giảng AI</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">AI</span>
          </button>
          <button
            onClick={() => handleNavClick('minigames')}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Mini Games
          </button>

          {!currentUser ? (
            <div className="pt-2">
              <button
                onClick={() => {
                  setCurrentTab('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập hệ thống</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  setCurrentTab('intro');
                }}
                className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-base flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      )}

    </header>
  );
};
