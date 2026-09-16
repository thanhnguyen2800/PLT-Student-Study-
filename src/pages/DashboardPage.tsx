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
  HelpCircle
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
      alert('Chỉ Giảng viên, Quản trị viên và Quản lý mới có quyền tạo và điều hành phòng thi trực tuyến (Host). Thí sinh vui lòng tham gia bằng mã PIN.');
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

    // Read user attempts from local storage if available
    try {
      const stored = localStorage.getItem('studentstudy_attempts_v1');
      if (stored) {
        setAttempts(JSON.parse(stored));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length === 6) {
      onNavigate('multiplayer', pinInput.trim());
    }
  };

  // Calculate metrics
  const totalCompleted = attempts.length;
  const avgAccuracy = totalCompleted > 0
    ? Math.round((attempts.reduce((acc, a) => acc + (a.correctAnswers / (a.totalQuestions || 1)), 0) / totalCompleted) * 100)
    : 85;
  const bestScore = attempts.reduce((max, a) => Math.max(max, a.score), 0) || 1250;

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Học tập & Ôn tập thế hệ mới</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng trở lại, {currentUser?.displayName || 'Học viên'}!
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Hôm nay bạn muốn củng cố kiến thức gì? Tham gia bài thi trực tiếp với mã PIN, luyện tập flashcard chuyên sâu, hoặc thử thách kỹ năng qua các mini game.
          </p>

          {/* Quick PIN Join Field */}
          <form onSubmit={handleJoinPin} className="pt-2 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Radio className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã Game PIN (6 chữ số)..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold outline-none shadow-sm focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={pinInput.trim().length !== 6}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              Vào Game
            </button>
          </form>
        </div>

        {/* Decorative background illustrations */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-8">
          <Trophy className="w-96 h-96" />
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quiz đã hoàn thành</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalCompleted || 12}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Độ chính xác trung bình</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{avgAccuracy}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chuỗi ngày học liên tục</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">5 ngày 🔥</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Điểm kỷ lục cao nhất</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{bestScore} pts</p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Lối tắt chức năng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => onNavigate('quizzes')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Khám phá Quiz</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Luyện tập trắc nghiệm tự do với hàng trăm câu hỏi có giải thích.</p>
          </div>

          <div 
            onClick={() => onNavigate('multiplayer')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Multiplayer Live</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổ chức hoặc tham gia thi đấu trực tiếp theo phong cách Kahoot.</p>
          </div>

          <div 
            onClick={() => onNavigate('minigames')}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">5 Mini Games</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đua xe tri thức, Bắt bóng thủ môn, Lật thẻ bài, Sinh tồn & Tốc độ.</p>
          </div>

          <div 
            onClick={openAIChat}
            className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Gemini Study AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trợ giảng riêng giải thích bài tập với Socratic method và suy luận logic.</p>
          </div>

        </div>
      </div>

      {/* Featured Quizzes Showcase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Quiz Nổi Bật</h2>
            <p className="text-xs text-slate-500">Các chủ đề kiến thức chọn lọc được học nhiều nhất</p>
          </div>
          <button
            onClick={() => onNavigate('quizzes')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
            >
              {/* Cover Image */}
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={quiz.coverImageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
                  alt={quiz.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <DifficultyBadge difficulty={quiz.difficulty} />
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium">
                  {quiz.questions?.length || quiz.questionCount || 0} câu hỏi
                </div>
              </div>

              {/* Quiz Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {quiz.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {quiz.description}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStudy(quiz.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Làm bài
                  </button>

                  <button
                    onClick={() => handleFlashcards(quiz.id)}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Flashcard
                  </button>

                  <button
                    onClick={() => handleHost(quiz.id)}
                    title={isGuest ? 'Đăng nhập để tạo phòng thi đấu' : 'Tổ chức thi đấu Kahoot'}
                    className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
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
