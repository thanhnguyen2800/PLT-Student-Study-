import React, { useState } from 'react';
import { 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Layers, 
  Menu, 
  X,
  LogIn,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { PltLogo } from '../common/PltLogo';
import { ProfileModal } from '../profile/ProfileModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAIChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAIChat }) => {
  const { currentUser, logout, canAccess } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const navBtnClass = (isActive: boolean) =>
    `px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
      isActive
        ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-100/80 dark:bg-sky-950/60 shadow-xs'
        : 'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/70 dark:hover:bg-sky-950/40'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#07192d]/95 backdrop-blur-md border-b border-sky-100 dark:border-sky-900/40 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 lg:gap-4 flex-nowrap">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0 select-none" 
          onClick={() => handleNavClick('intro')}
        >
          <PltLogo size="md" />
          <span className="font-black text-lg sm:text-xl lg:text-2xl tracking-tight bg-linear-to-r from-sky-700 via-sky-600 to-indigo-700 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
            STUDENT STUDY
          </span>
        </div>

        {/* Desktop Navigation Links - Compact, single horizontal row, smaller font */}
        <nav className="hidden lg:flex items-center flex-nowrap gap-1 lg:gap-1.5 shrink">
          
          {/* 1. Trang chủ */}
          <button
            onClick={() => handleNavClick('intro')}
            className={navBtnClass(currentTab === 'intro')}
          >
            Trang chủ
          </button>

          {/* 2. Bàn học (Khi đã đăng nhập) */}
          {currentUser && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navBtnClass(currentTab === 'dashboard')}
            >
              Bàn học
            </button>
          )}

          {/* 3. Tính năng */}
          <button
            onClick={() => handleNavClick('tinhnang')}
            className={navBtnClass(false)}
          >
            Tính năng
          </button>

          {/* 4. Kho Quiz */}
          <button
            onClick={() => handleNavClick('quizzes')}
            className={navBtnClass(currentTab === 'quizzes')}
          >
            Kho Quiz
          </button>

          {/* 5. Đấu trường Live */}
          <button
            onClick={() => handleNavClick('multiplayer')}
            className={navBtnClass(currentTab === 'multiplayer')}
          >
            <span>Đấu trường Live</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              HOT
            </span>
          </button>

          {/* 6. Mini Games */}
          <button
            onClick={() => handleNavClick('minigames')}
            className={navBtnClass(currentTab === 'minigames')}
          >
            Mini Games
          </button>

          {/* 7. Admin Page (Chỉ Admin / Super Admin) */}
          {canAccess(['ADMIN', 'SUPER_ADMIN']) && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab.startsWith('admin')
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quản trị</span>
            </button>
          )}

        </nav>

        {/* Right Section: Clean horizontal Login / User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">

          {/* Login Button (If Guest) */}
          {!currentUser ? (
            <button
              onClick={() => setCurrentTab('login')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            /* User Profile Button (If Logged In) - 1 single horizontal row */
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
              >
                <div className="hidden sm:flex items-center gap-2 text-left">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px] lg:max-w-[130px]">
                    {currentUser.displayName}
                  </span>
                  <span className="hidden lg:inline-block">
                    <RoleBadge role={currentUser.role} />
                  </span>
                </div>
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Bàn học của tôi</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <UserCog className="w-4 h-4 text-sky-600" />
                      <span>Quản lý tài khoản</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        setCurrentTab('intro');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => handleNavClick('intro')}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Trang chủ
          </button>
          {currentUser && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bàn học
            </button>
          )}
          <button
            onClick={() => handleNavClick('tinhnang')}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tính năng
          </button>
          <button
            onClick={() => handleNavClick('quizzes')}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Kho Quiz
          </button>
          <button
            onClick={() => handleNavClick('multiplayer')}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
          >
            <span>Đấu trường Live</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">HOT</span>
          </button>
          <button
            onClick={() => handleNavClick('minigames')}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Mini Games
          </button>
          {canAccess(['ADMIN', 'SUPER_ADMIN']) && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Quản trị hệ thống</span>
            </button>
          )}

          {!currentUser ? (
            <div className="pt-2">
              <button
                onClick={() => {
                  setCurrentTab('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCog className="w-4 h-4" />
                <span>Quản lý tài khoản cá nhân</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  setCurrentTab('intro');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Personal Profile Management Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

    </header>
  );
};

