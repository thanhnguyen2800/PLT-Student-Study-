import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Flame, 
  Trophy, 
  Target, 
  Play, 
  Radio, 
  Sparkles, 
  PlusCircle, 
  Gamepad2, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Quiz, QuizAttempt } from '../types';
import { DifficultyBadge } from '../components/common/Badge';

// 3 Pre-installed default quizzes available for guest preview
const DEFAULT_QUIZ_IDS = ['quiz-web-dev-01', 'quiz-science-ai-02', 'quiz-english-comm-03'];

interface DashboardProps {
  onNavigate: (tab: string, extraId?: string) => void;
  openAIChat: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate, openAIChat }) => {
  const { currentUser, canAccess } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const isGuest = !currentUser;

  // Unauthenticated guests can ONLY see and access the 3 default preview quizzes
  // Authenticated students and teachers can see all quizzes including newly created ones
  const visibleQuizzes = isGuest
    ? quizzes.filter(q => DEFAULT_QUIZ_IDS.includes(q.id))
    : quizzes.slice(0, 3);

  const handleStudy = (targetQuizId: string) => {
    if (isGuest && !DEFAULT_QUIZ_IDS.includes(targetQuizId)) {
      onNavigate('login');
      return;
    }
    onNavigate('study', targetQuizId);
  };

  const handleFlashcards = (targetQuizId: string) => {
    if (isGuest && !DEFAULT_QUIZ_IDS.includes(targetQuizId)) {
      onNavigate('login');
      return;
    }
    onNavigate('flashcards', targetQuizId);
  };

  const handleHost = (targetQuizId: string) => {
    if (isGuest) {
      onNavigate('login');
      return;
    }
    if (!canAccess(['TEACHER', 'ADMIN', 'SUPER_ADMIN'])) {
      setNotice('Chỉ Giảng viên, Quản trị viên và Quản lý mới có quyền tạo và điều hành phòng thi trực tuyến (Host). Thí sinh vui lòng tham gia bằng mã PIN.');
      setTimeout(() => setNotice(null), 5000);
      return;
    }
    onNavigate('host', targetQuizId);
  };

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setQuizzes(json.data);
        }
      })
      .catch(console.error);

    // Fetch user-specific attempts
    const fetchUserAttempts = async () => {
      if (currentUser?.uid) {
        try {
          const res = await fetch(`/api/quizzes/attempts?userId=${currentUser.uid}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setAttempts(json.data);
            return;
          }
        } catch (e) {
          console.warn('Could not fetch user attempts from server:', e);
        }
      }

      // Fallback to local storage (strictly filtered by current user)
      try {
        const stored = localStorage.getItem('studentstudy_attempts_v1');
        if (stored) {
          const all = JSON.parse(stored);
          if (Array.isArray(all)) {
            const filtered = currentUser
              ? all.filter((a: any) => a.userId === currentUser.uid || a.userEmail === currentUser.email)
              : all.filter((a: any) => !a.userId || a.userId === 'guest_user');
            setAttempts(filtered);
            return;
          }
        }
        setAttempts([]);
      } catch (e) {
        console.warn(e);
        setAttempts([]);
      }
    };

    fetchUserAttempts();
  }, [currentUser?.uid, currentUser?.email]);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length === 6) {
      onNavigate('multiplayer', pinInput.trim());
    }
  };

  // Calculate real metrics accurately for the current user (0 for new users)
  const totalCompleted = attempts.length;
  const avgAccuracy = totalCompleted > 0
    ? Math.round(
        (attempts.reduce((acc, a) => {
          const totalQ = a.totalQuestions > 0 ? a.totalQuestions : 1;
          const correct = typeof a.correctAnswers === 'number' ? a.correctAnswers : 0;
          return acc + (correct / totalQ);
        }, 0) / totalCompleted) * 100
      )
    : 0;

  const bestScore = totalCompleted > 0
    ? attempts.reduce((max, a) => Math.max(max, a.score || 0), 0)
    : 0;

  // Real continuous study streak in days
  const calculateStreak = (list: QuizAttempt[]): number => {
    if (!list || list.length === 0) return 0;
    const dateStrings = Array.from(
      new Set(
        list
          .map(a => a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-CA') : '')
          .filter(Boolean)
      )
    ).sort().reverse();

    if (dateStrings.length === 0) return 0;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

    // Only active if latest quiz was taken today or yesterday
    if (dateStrings[0] !== todayStr && dateStrings[0] !== yesterdayStr) {
      return 0;
    }

    let count = 1;
    let curr = new Date(dateStrings[0]);
    for (let i = 1; i < dateStrings.length; i++) {
      const prevExpected = new Date(curr);
      prevExpected.setDate(prevExpected.getDate() - 1);
      const prevExpectedStr = prevExpected.toLocaleDateString('en-CA');
      if (dateStrings[i] === prevExpectedStr) {
        count++;
        curr = prevExpected;
      } else {
        break;
      }
    }
    return count;
  };

  const studyStreak = calculateStreak(attempts);

  return (
    <div className="space-y-10 animate-in fade-in pb-12">
      {notice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm sm:text-base font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Welcome Hero Banner - Large Typography with Pastel Sea Blue */}
      <div className="relative overflow-hidden rounded-3xl lg:rounded-4xl bg-linear-to-br from-[#c0eafc] via-[#8ed9fa] to-[#a2f0fc] dark:from-[#0c3152] dark:via-[#10436e] dark:to-[#0a2c4a] p-8 sm:p-10 lg:p-12 shadow-2xl shadow-sky-300/30 dark:shadow-sky-950/40 border border-sky-300/60 dark:border-sky-500/30">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 text-sky-900 dark:text-sky-200 text-sm font-extrabold shadow-sm border border-sky-200/70 dark:border-sky-800">
            <Sparkles className="w-4 h-4 text-sky-600 fill-sky-400" />
            <span>Bàn Học Viên Chuyên Sâu</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#042845] dark:text-white tracking-tight leading-tight">
            Chào mừng trở lại, {currentUser?.displayName || 'Học viên'}!
          </h1>
          <p className="text-[#0b4369] dark:text-sky-100 text-base sm:text-lg leading-relaxed">
            Hôm nay bạn muốn củng cố kiến thức gì? Tham gia bài thi trực tiếp với mã PIN, luyện tập flashcard chuyên sâu, hoặc thử thách kỹ năng qua các mini game.
          </p>

          {/* Quick PIN Join Field */}
          <form onSubmit={handleJoinPin} className="pt-3 flex max-w-lg gap-2.5">
            <div className="relative flex-1">
              <Radio className="w-5 h-5 text-sky-600 dark:text-sky-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã Game PIN (6 chữ số)..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/95 text-[#042845] placeholder:text-sky-700/60 text-base font-bold font-mono outline-none shadow-md border border-sky-200/80 focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <button
              type="submit"
              disabled={pinInput.trim().length !== 6}
              className="px-6 py-3 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-extrabold text-base transition-all shadow-md cursor-pointer shrink-0"
            >
              Vào Game
            </button>
          </form>
        </div>

        {/* Decorative background illustrations */}
        <div className="absolute right-0 bottom-0 text-[#0284c7] opacity-15 pointer-events-none transform translate-x-12 translate-y-8">
          <Trophy className="w-96 h-96" />
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Quiz hoàn thành</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">{totalCompleted}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {totalCompleted === 0 ? 'Chưa làm bài nào' : `${totalCompleted} bài đã nộp`}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Độ chính xác TB</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              {totalCompleted === 0 ? '0%' : `${avgAccuracy}%`}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {totalCompleted === 0 ? 'Chưa có bài thi' : 'Tỷ lệ trả lời đúng'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Chuỗi liên tục</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              {studyStreak} ngày {studyStreak > 0 ? '🔥' : ''}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {studyStreak === 0 ? 'Học ngay hôm nay' : 'Duy trì học đều đặn'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Kỷ lục điểm số</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">{bestScore} pts</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {totalCompleted === 0 ? 'Chưa có điểm thi' : 'Thành tích cao nhất'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Lối tắt chức năng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div 
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Kho Đề Thi Quiz</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Luyện tập trắc nghiệm tự do với ngân hàng câu hỏi có giải thích chi tiết.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('multiplayer')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multiplayer Live</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Tổ chức hoặc tham gia thi đấu trực tiếp theo phong cách Kahoot kịch tính.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('minigames')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">5 Mini Games</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Đua xe tri thức, Bắt bóng thủ môn, Lật thẻ bài, Sinh tồn & Tốc độ.
            </p>
          </div>

          <div 
            onClick={openAIChat}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Trợ Giảng AI Gemini</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Trợ giảng riêng giải thích bài tập với Socratic method và suy luận logic.
            </p>
          </div>

        </div>
      </div>

      {/* Featured Quizzes Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Quiz Nổi Bật
            </h2>
            <p className="text-base text-slate-500 mt-0.5">
              Các chủ đề kiến thức chọn lọc được học nhiều nhất
            </p>
          </div>
          <button
            onClick={() => onNavigate('quizzes')}
            className="text-base font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {visibleQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group"
            >
              {/* Cover Image */}
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={quiz.coverImageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
                  alt={quiz.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <DifficultyBadge difficulty={quiz.difficulty} />
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-bold">
                  {quiz.questions?.length || quiz.questionCount || 0} câu hỏi
                </div>
              </div>

              {/* Quiz Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {quiz.category}
                  </span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
                  <button
                    onClick={() => handleStudy(quiz.id)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Làm bài</span>
                  </button>

                  <button
                    onClick={() => handleFlashcards(quiz.id)}
                    className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-bold transition-colors cursor-pointer"
                  >
                    Flashcard
                  </button>

                  <button
                    onClick={() => handleHost(quiz.id)}
                    title={isGuest ? 'Đăng nhập để tạo phòng thi đấu' : 'Tổ chức thi đấu Kahoot'}
                    className="py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-sm sm:text-base font-bold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
