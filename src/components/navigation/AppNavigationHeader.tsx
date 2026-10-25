import React from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Home, 
  BookOpen, 
  Layers, 
  Radio, 
  Gamepad2, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Edit, 
  Bot, 
  User, 
  LogIn,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface HistoryEntry {
  tab: string;
  extra?: string;
  label: string;
}

interface AppNavigationHeaderProps {
  currentTab: string;
  selectedQuizTitle?: string;
  onNavigate: (tab: string, extra?: string) => void;
  onGoBack: () => void;
  previousPageLabel?: string;
  hasHistory: boolean;
  openAIChat?: () => void;
}

export const AppNavigationHeader: React.FC<AppNavigationHeaderProps> = ({
  currentTab,
  selectedQuizTitle,
  onNavigate,
  onGoBack,
  previousPageLabel,
  hasHistory,
  openAIChat,
}) => {
  const { currentUser } = useAuth();

  // If on pure default home landing page, don't show large back bar, show quiet location indicator or omit
  if (currentTab === 'intro') {
    return null;
  }

  // Determine breadcrumb segments based on currentTab
  const getBreadcrumbs = () => {
    const rootLabel = currentUser ? 'Bàn học' : 'Trang chủ';
    const rootTab = currentUser ? 'dashboard' : 'intro';

    const crumbs: { label: string; tab?: string; extra?: string; icon?: React.ReactNode }[] = [
      { label: rootLabel, tab: rootTab, icon: <Home className="w-3.5 h-3.5" /> }
    ];

    switch (currentTab) {
      case 'tinhnang':
        crumbs.push({ label: 'Tính năng Đột phá', icon: <Sparkles className="w-3.5 h-3.5 text-sky-500" /> });
        break;

      case 'dashboard':
        // If currentUser is viewing dashboard
        if (!crumbs.some(c => c.label === 'Bàn học')) {
          crumbs.push({ label: 'Bàn học cá nhân', icon: <User className="w-3.5 h-3.5 text-emerald-500" /> });
        }
        break;

      case 'quizzes':
        crumbs.push({ label: 'Kho Quiz & Học liệu', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        break;

      case 'study':
        crumbs.push({ label: 'Kho Quiz', tab: 'quizzes', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        crumbs.push({ 
          label: selectedQuizTitle ? `Luyện thi: ${selectedQuizTitle}` : 'Luyện thi Solo',
          icon: <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
        });
        break;

      case 'flashcards':
        crumbs.push({ label: 'Kho Quiz', tab: 'quizzes', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        crumbs.push({ 
          label: selectedQuizTitle ? `Flashcards: ${selectedQuizTitle}` : 'Thẻ ghi nhớ Flashcards',
          icon: <Layers className="w-3.5 h-3.5 text-indigo-500" />
        });
        break;

      case 'host':
        crumbs.push({ label: 'Kho Quiz', tab: 'quizzes', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        crumbs.push({ 
          label: selectedQuizTitle ? `Host phòng thi: ${selectedQuizTitle}` : 'Tạo phòng thi đấu',
          icon: <Radio className="w-3.5 h-3.5 text-amber-500" />
        });
        break;

      case 'multiplayer':
        crumbs.push({ label: 'Đấu trường Live', icon: <Radio className="w-3.5 h-3.5 text-amber-500" /> });
        break;

      case 'minigames':
        crumbs.push({ label: 'Mini Games Giáo Dục', icon: <Gamepad2 className="w-3.5 h-3.5 text-purple-500" /> });
        break;

      case 'create-quiz':
        crumbs.push({ label: 'Kho Quiz', tab: 'quizzes', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        crumbs.push({ label: 'Tạo bộ Quiz mới', icon: <Plus className="w-3.5 h-3.5 text-indigo-500" /> });
        break;

      case 'edit-quiz':
        crumbs.push({ label: 'Kho Quiz', tab: 'quizzes', icon: <BookOpen className="w-3.5 h-3.5 text-sky-500" /> });
        crumbs.push({ label: 'Chỉnh sửa Quiz', icon: <Edit className="w-3.5 h-3.5 text-amber-500" /> });
        break;

      case 'admin':
        crumbs.push({ label: 'Quản trị hệ thống', icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> });
        break;

      case 'login':
        crumbs.push({ label: 'Đăng nhập', icon: <LogIn className="w-3.5 h-3.5 text-slate-500" /> });
        break;

      default:
        crumbs.push({ label: currentTab });
        break;
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];

  // Default fallback back label if not specified
  const effectiveBackLabel = previousPageLabel || (currentUser ? 'Quay lại Bàn học' : 'Quay lại Trang chủ');

  return (
    <div 
      id="app-navigation-header"
      data-testid="app-navigation-header"
      className="mb-6 w-full animate-in fade-in slide-in-from-top-1"
    >
      <div className="bg-white/90 dark:bg-[#081f38]/90 backdrop-blur-md rounded-2xl border border-sky-100 dark:border-sky-900/60 p-3 sm:px-4 sm:py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Side: Back Button & Breadcrumbs */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          
          {/* Back Button */}
          <button
            type="button"
            id="nav-btn-back"
            data-testid="nav-btn-back"
            onClick={onGoBack}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 border border-slate-200/80 dark:border-slate-700"
            title={`Bấm để quay lại trang trước (${effectiveBackLabel})`}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-sky-600 dark:text-sky-400" />
            <span>Quay lại</span>
            {previousPageLabel && (
              <span className="hidden md:inline font-normal text-slate-500 dark:text-slate-400">
                ({previousPageLabel})
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Breadcrumb Path */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs flex-wrap min-w-0">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  )}
                  {crumb.tab && !isLast ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(crumb.tab!, crumb.extra)}
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 font-semibold hover:underline cursor-pointer transition-colors shrink-0"
                    >
                      {crumb.icon}
                      <span>{crumb.label}</span>
                    </button>
                  ) : (
                    <span 
                      className={`inline-flex items-center gap-1 font-bold truncate max-w-[200px] sm:max-w-[320px] ${
                        isLast 
                          ? 'text-sky-700 dark:text-sky-300' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                      title={crumb.label}
                    >
                      {crumb.icon}
                      <span className="truncate">{crumb.label}</span>
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Location Badge & Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          
          {/* Quick Home / Dashboard Jump */}
          <button
            type="button"
            id="nav-quick-btn-home"
            data-testid="nav-quick-btn-home"
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'intro')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            title={currentUser ? "Về Bàn học cá nhân" : "Về Trang chủ"}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{currentUser ? 'Bàn học' : 'Trang chủ'}</span>
          </button>

          {/* Quick Ask AI button if available */}
          {openAIChat && (
            <button
              type="button"
              id="nav-quick-btn-ai"
              data-testid="nav-quick-btn-ai"
              onClick={openAIChat}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-linear-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Hỏi trợ lý ảo AI Gemini"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Trợ giảng AI</span>
            </button>
          )}

          {/* Location Badge */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-800 dark:text-sky-200 text-[11px] font-semibold">
            <MapPin className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="max-w-[140px] truncate">{currentCrumb?.label || 'Hệ thống'}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
