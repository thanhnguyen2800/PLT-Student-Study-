import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Car, 
  Target, 
  Grid3X3, 
  Heart, 
  Zap, 
  RotateCcw, 
  Trophy, 
  Play, 
  Sparkles,
  Volume2,
  Layers,
  PlusCircle,
  Lock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Info,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakText } from '../utils/tts';
import { useAuth } from '../context/AuthContext';
import { Quiz } from '../types';

type GameType = 'RACING' | 'PENALTY' | 'MEMORY' | 'SURVIVAL' | 'BLITZ';

export interface GameQuestion {
  q: string;
  opts: string[];
  a: number;
  explanation?: string;
}

export interface MemoryPair {
  id: string;
  term: string;
  desc: string;
}

interface MiniGamesPageProps {
  onNavigate?: (tab: string, extraId?: string) => void;
}

export const MiniGamesPage: React.FC<MiniGamesPageProps> = ({ onNavigate }) => {
  const { currentUser, canAccess } = useAuth();
  const [activeGame, setActiveGame] = useState<GameType>('RACING');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('DEFAULT');
  const [showAuthModal, setShowAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'LOGIN' | 'STUDENT_INFO';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'LOGIN',
  });

  const isGuest = !currentUser;
  const canCreate = canAccess(['TEACHER', 'ADMIN', 'SUPER_ADMIN']);
  const isStudent = currentUser?.role === 'PLAYER';

  // Fetch available quizzes for question pack selector
  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setQuizzes(json.data);
        }
      })
      .catch(console.warn);
  }, []);

  const games = [
    {
      id: 'RACING' as GameType,
      title: 'Đua Xe Tri Thức',
      desc: 'Trả lời đúng để xe tăng tốc bứt phá về đích trước đối thủ AI!',
      icon: Car,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'PENALTY' as GameType,
      title: 'Sút Phạt Thủ Môn',
      desc: 'Chọn góc sút chuẩn xác qua các câu hỏi trắc nghiệm bóng đá & học thuật.',
      icon: Target,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'MEMORY' as GameType,
      title: 'Lật Thẻ Trí Nhớ',
      desc: 'Ghi nhớ và ghép đôi cặp thẻ thuật ngữ khoa học & công nghệ tương ứng.',
      icon: Grid3X3,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'SURVIVAL' as GameType,
      title: 'Sinh Tồn Tri Thức',
      desc: 'Bảo toàn 3 mạng sống qua các câu hỏi tăng dần độ khó liên tục.',
      icon: Heart,
      color: 'from-rose-500 to-red-600',
    },
    {
      id: 'BLITZ' as GameType,
      title: 'Chớp Nhoáng 5 Giây',
      desc: 'Thử thách phản xạ cực đại với 5 giây mỗi câu hỏi tính điểm x2.',
      icon: Zap,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  // Handle switching quiz / question pack
  const handleSelectQuiz = (quizId: string) => {
    if (quizId === 'DEFAULT') {
      setSelectedQuizId('DEFAULT');
      return;
    }

    // Unauthenticated guest check
    if (isGuest) {
      setShowAuthModal({
        isOpen: true,
        title: 'Giới Hạn Nội Dung Dành Cho Khách',
        message: 'Bạn đang trải nghiệm với tư cách Khách chưa đăng nhập. Khách chỉ có thể trải nghiệm nội dung câu hỏi mặc định của 5 game. Vui lòng đăng nhập tài khoản Học viên hoặc Giảng viên để mở khóa chọn các bộ câu hỏi mới!',
        actionType: 'LOGIN',
      });
      return;
    }

    // Authenticated user (Student, Teacher, Admin) can select any pack
    setSelectedQuizId(quizId);
  };

  const handleCreateQuestionPack = () => {
    if (isGuest) {
      setShowAuthModal({
        isOpen: true,
        title: 'Yêu Cầu Quyền Giảng Viên / Quản Lý',
        message: 'Chỉ Quản trị viên, Quản lý và Giảng viên mới có quyền tạo bộ câu hỏi mới cho học viên. Vui lòng đăng nhập bằng tài khoản có quyền tương ứng.',
        actionType: 'LOGIN',
      });
      return;
    }

    if (!canCreate) {
      setShowAuthModal({
        isOpen: true,
        title: 'Quyền Hạn Học Viên',
        message: 'Tài khoản Học viên chỉ có quyền học tập và áp dụng các bộ câu hỏi đã có vào game. Quyền biên soạn và tạo mới bộ câu hỏi thuộc về Giảng viên và Quản lý.',
        actionType: 'STUDENT_INFO',
      });
      return;
    }

    if (onNavigate) {
      onNavigate('create-quiz');
    }
  };

  // Convert currently selected quiz into game questions
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
  const currentPackTitle = selectedQuizId === 'DEFAULT' 
    ? 'Bộ câu hỏi mặc định (Sẵn có của 5 Game)' 
    : (selectedQuiz?.title || 'Bộ câu hỏi đã chọn');

  const customQuestions: GameQuestion[] = (selectedQuiz?.questions || []).map(q => {
    let ansIdx = 0;
    if (typeof q.correctAnswer === 'number') {
      ansIdx = q.correctAnswer;
    } else if (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0) {
      ansIdx = Number(q.correctAnswer[0]);
    }
    const opts = q.options && q.options.length > 0 
      ? [...q.options] 
      : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];
    if (ansIdx < 0 || ansIdx >= opts.length) ansIdx = 0;
    return {
      q: q.question,
      opts,
      a: ansIdx,
      explanation: q.explanation,
    };
  });

  const customPairs: MemoryPair[] = customQuestions.slice(0, 6).map((q, idx) => {
    const shortQ = q.q.length > 32 ? q.q.slice(0, 30) + '...' : q.q;
    const correctOpt = q.opts[q.a] || 'Đáp án';
    const shortA = correctOpt.length > 24 ? correctOpt.slice(0, 22) + '...' : correctOpt;
    return {
      id: `pair_${idx}`,
      term: `Q${idx + 1}: ${shortQ}`,
      desc: shortA,
    };
  });

  const activeRacingQuestions = selectedQuizId !== 'DEFAULT' && customQuestions.length > 0 ? customQuestions : RACING_QUESTIONS;
  const activePenaltyQuestions = selectedQuizId !== 'DEFAULT' && customQuestions.length > 0 ? customQuestions : PENALTY_QUESTIONS;
  const activeMemoryPairs = selectedQuizId !== 'DEFAULT' && customPairs.length >= 2 ? customPairs : MEMORY_PAIRS;
  const activeSurvivalQuestions = selectedQuizId !== 'DEFAULT' && customQuestions.length > 0 ? customQuestions : SURVIVAL_QUESTIONS;
  const activeBlitzQuestions = selectedQuizId !== 'DEFAULT' && customQuestions.length > 0 
    ? customQuestions.map(q => ({ ...q, opts: q.opts.slice(0, 3), a: q.a < 3 ? q.a : 0 }))
    : BLITZ_QUESTIONS;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-indigo-600" />
            Mini Games Giáo Dục
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vừa học vừa chơi, ghi nhớ kiến thức qua các trò chơi tương tác hấp dẫn
          </p>
        </div>

        {/* Dynamic Question Pack Selector & Teacher Create Button */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreate ? (
            <button
              onClick={handleCreateQuestionPack}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Tạo bộ câu hỏi mới cho học viên"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo Bộ Câu Hỏi Mới</span>
            </button>
          ) : (
            <button
              onClick={handleCreateQuestionPack}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tạo Bộ Câu Hỏi (Giảng viên)</span>
            </button>
          )}
        </div>
      </div>

      {/* QUESTION PACK SELECTOR TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Bộ câu hỏi áp dụng vào Game:</span>
              {isGuest && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Khách (Chỉ chơi sẵn có)
                </span>
              )}
              {!isGuest && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {isStudent ? 'Học viên' : 'Giảng viên / Admin'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đang áp dụng: <strong className="text-indigo-600 dark:text-indigo-400">{currentPackTitle}</strong>
            </p>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="quiz-pack-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Đổi bộ câu hỏi:
          </label>
          <div className="relative min-w-56">
            <select
              id="quiz-pack-select"
              value={selectedQuizId}
              onChange={(e) => handleSelectQuiz(e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="DEFAULT">⭐ Bộ mặc định của 5 Game (Sẵn có)</option>
              
              {quizzes.map(q => {
                const isLockedForGuest = isGuest;
                return (
                  <option key={q.id} value={q.id}>
                    {isLockedForGuest ? `🔒 ${q.title} (Học viên)` : `📚 ${q.title} (${q.questions?.length || 0} câu)`}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Guest Banner if playing as Guest */}
      {isGuest && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn đang ở chế độ <strong>Khách</strong>: Bạn được trải nghiệm 3 quiz mẫu, 5 mini-game nội dung sẵn có và tham gia phòng thi trực tuyến bằng mã PIN.
            </span>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('login')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
          >
            Đăng nhập tài khoản Học viên
          </button>
        </div>
      )}

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {games.map(g => {
          const Icon = g.icon;
          const isActive = activeGame === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl bg-linear-to-tr ${g.color} text-white flex items-center justify-center shadow-xs`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{g.title}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{g.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Game Canvas/Component */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        {activeGame === 'RACING' && (
          <RacingTriviaGame questions={activeRacingQuestions} packTitle={currentPackTitle} />
        )}
        {activeGame === 'PENALTY' && (
          <PenaltyShootoutGame questions={activePenaltyQuestions} packTitle={currentPackTitle} />
        )}
        {activeGame === 'MEMORY' && (
          <MemoryMatchGame pairs={activeMemoryPairs} packTitle={currentPackTitle} />
        )}
        {activeGame === 'SURVIVAL' && (
          <SurvivalQuizGame questions={activeSurvivalQuestions} packTitle={currentPackTitle} />
        )}
        {activeGame === 'BLITZ' && (
          <BlitzSpeedGame questions={activeBlitzQuestions} packTitle={currentPackTitle} />
        )}
      </div>

      {/* Auth Restriction Modal */}
      {showAuthModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              {showAuthModal.actionType === 'LOGIN' ? (
                <Lock className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {showAuthModal.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {showAuthModal.message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => setShowAuthModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {showAuthModal.actionType === 'LOGIN' ? 'Tiếp tục chơi mặc định' : 'Đã hiểu'}
              </button>

              {showAuthModal.actionType === 'LOGIN' && (
                <button
                  onClick={() => {
                    setShowAuthModal(prev => ({ ...prev, isOpen: false }));
                    if (onNavigate) onNavigate('login');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1. GAME: ĐUA XE TRI THỨC (Racing Trivia)
// ==========================================
const RACING_QUESTIONS: GameQuestion[] = [
  { q: 'Thuật toán nào sắp xếp theo cơ chế chia để trị (Divide and Conquer)?', opts: ['Merge Sort', 'Bubble Sort', 'Insertion Sort', 'Selection Sort'], a: 0 },
  { q: 'Giao thức nào cung cấp kết nối mạng an toàn được mã hóa?', opts: ['HTTP', 'FTP', 'HTTPS', 'Telnet'], a: 2 },
  { q: 'Trong TypeScript, từ khóa nào định nghĩa một kiểu dữ liệu mới?', opts: ['type & interface', 'let & var', 'import & export', 'def & struct'], a: 0 },
  { q: 'Bộ nhớ Cache của CPU thường dùng loại RAM nào?', opts: ['SRAM', 'DRAM', 'VRAM', 'Flash RAM'], a: 0 },
  { q: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In First Out)?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], a: 1 },
];

function RacingTriviaGame({ questions, packTitle }: { questions: GameQuestion[]; packTitle: string }) {
  const [qIdx, setQIdx] = useState(0);
  const [playerPos, setPlayerPos] = useState(10);
  const [aiPos, setAiPos] = useState(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Reset state whenever question pack changes
  useEffect(() => {
    setQIdx(0);
    setPlayerPos(10);
    setAiPos(10);
    setFeedback(null);
    setIsFinished(false);
  }, [questions]);

  useEffect(() => {
    // AI slowly moves forward
    if (isFinished) return;
    const interval = setInterval(() => {
      setAiPos(prev => {
        const next = prev + Math.floor(Math.random() * 4 + 2);
        if (next >= 100) {
          setIsFinished(true);
          return 100;
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const handleAnswer = (choiceIdx: number) => {
    if (isFinished || questions.length === 0) return;
    const curr = questions[qIdx % questions.length];
    if (choiceIdx === curr.a) {
      setFeedback('✅ Tuyệt vời! Tăng tốc bứt phá +25%');
      const nextPos = playerPos + 25;
      setPlayerPos(nextPos);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      if (nextPos >= 100) {
        setIsFinished(true);
      }
    } else {
      setFeedback('❌ Chưa chính xác! Xe giảm tốc độ.');
    }

    setTimeout(() => {
      setFeedback(null);
      setQIdx(prev => (prev + 1) % questions.length);
    }, 1200);
  };

  const restart = () => {
    setQIdx(0);
    setPlayerPos(10);
    setAiPos(10);
    setFeedback(null);
    setIsFinished(false);
  };

  const curr = questions[qIdx % questions.length] || questions[0];

  return (
    <div className="space-y-6">
      {/* Game Title & Track Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            Đua Xe Tri Thức (Trivia Racing)
          </h3>
          <p className="text-[11px] text-slate-400">
            Đang áp dụng: <span className="font-bold text-indigo-500">{packTitle}</span> ({questions.length} câu)
          </p>
        </div>
        <button 
          onClick={restart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm mới chặng đua</span>
        </button>
      </div>

      {/* Racetrack Visualizer */}
      <div className="bg-slate-900 rounded-3xl p-6 border-4 border-slate-700 space-y-6 relative overflow-hidden shadow-inner">
        {/* Road markings */}
        <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-20">
          <div className="border-b border-dashed border-white w-full" />
          <div className="border-b border-dashed border-white w-full" />
        </div>

        {/* Player Car Lane */}
        <div>
          <div className="flex justify-between text-[11px] text-amber-400 font-bold mb-1">
            <span>🏎️ Xe của bạn (Người chơi)</span>
            <span className="font-mono">{Math.min(playerPos, 100)}%</span>
          </div>
          <div className="h-6 w-full bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
            <div 
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(playerPos, 100)}%` }}
            />
            <span className="absolute right-2 top-0 bottom-0 flex items-center text-[10px] text-amber-300 font-bold">🏁 ĐÍCH</span>
          </div>
        </div>

        {/* AI Competitor Lane */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>🤖 Đối thủ AI Bot</span>
            <span className="font-mono">{Math.min(aiPos, 100)}%</span>
          </div>
          <div className="h-6 w-full bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
            <div 
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-rose-500 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(aiPos, 100)}%` }}
            />
            <span className="absolute right-2 top-0 bottom-0 flex items-center text-[10px] text-rose-300 font-bold">🏁 ĐÍCH</span>
          </div>
        </div>
      </div>

      {/* Question or Game Over */}
      {!isFinished && curr ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Câu hỏi tiếp sức:</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
            </div>
            <button
              onClick={() => speakText(curr.q)}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
              title="Đọc câu hỏi"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 font-medium text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                <span className="font-bold mr-2 text-indigo-600">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <p className="text-xs font-bold text-center text-amber-600 dark:text-amber-400 animate-pulse">
              {feedback}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <h4 className="text-xl font-black text-slate-900 dark:text-white">
            {playerPos >= 100 ? '🎉 BẠN ĐÃ CHIẾN THẮNG VỀ ĐÍCH ĐẦU TIÊN!' : '🤖 ĐỐI THỦ AI ĐÃ VỀ ĐÍCH TRƯỚC!'}
          </h4>
          <button
            onClick={restart}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md cursor-pointer transition-transform active:scale-95"
          >
            Chơi lại lượt đua mới
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. GAME: SÚT PHẠT THỦ MÔN (Penalty Shootout)
// ==========================================
const PENALTY_QUESTIONS: GameQuestion[] = [
  { q: 'Đơn vị đo lường thông tin cơ bản nhỏ nhất là gì?', opts: ['Byte', 'Bit', 'Kilobyte', 'Nibble'], a: 1 },
  { q: 'Ngôn ngữ nào chạy được tự nhiên trong trình duyệt web?', opts: ['JavaScript', 'Python', 'C++', 'Java'], a: 0 },
  { q: 'Số nhị phân 1010 tương ứng với số thập phân nào?', opts: ['8', '10', '12', '14'], a: 1 },
  { q: 'HTML là viết tắt của gì?', opts: ['HyperText Markup Language', 'HighText Machine Language', 'Hyper Tool Multi Language', 'Home Tech Modern Link'], a: 0 },
];

function PenaltyShootoutGame({ questions, packTitle }: { questions: GameQuestion[]; packTitle: string }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [gkStatus, setGkStatus] = useState<'IDLE' | 'GOAL' | 'SAVED'>('IDLE');

  // Reset when question set changes
  useEffect(() => {
    setQIdx(0);
    setScore(0);
    setGkStatus('IDLE');
  }, [questions]);

  const handleShoot = (choiceIdx: number) => {
    if (questions.length === 0) return;
    const curr = questions[qIdx % questions.length];
    if (choiceIdx === curr.a) {
      setGkStatus('GOAL');
      setScore(s => s + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      setGkStatus('SAVED');
    }

    setTimeout(() => {
      setGkStatus('IDLE');
      setQIdx(prev => (prev + 1) % questions.length);
    }, 1800);
  };

  const curr = questions[qIdx % questions.length] || questions[0];

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="text-left">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Sút Phạt Thủ Môn (Penalty Shootout)
          </h3>
          <p className="text-[11px] text-slate-400">
            Đang áp dụng: <span className="font-bold text-indigo-500">{packTitle}</span>
          </p>
        </div>
        <span className="font-bold text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          Bàn thắng: {score} ⚽
        </span>
      </div>

      {/* Goal Post Visual */}
      <div className="relative h-44 rounded-3xl bg-linear-to-b from-emerald-900 to-emerald-950 border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
        {/* Goal Net */}
        <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded-2xl flex items-center justify-center">
          {gkStatus === 'IDLE' && (
            <div className="text-4xl animate-bounce">🧤 🧍‍♂️</div>
          )}
          {gkStatus === 'GOAL' && (
            <div className="text-center space-y-1 animate-in zoom-in">
              <span className="text-5xl">⚽ 🔥</span>
              <p className="text-sm font-black text-amber-300">VÀOOOOO! BÀN THẮNG ĐẸP MẮT!</p>
            </div>
          )}
          {gkStatus === 'SAVED' && (
            <div className="text-center space-y-1 animate-in zoom-in">
              <span className="text-5xl">🧤 ❌</span>
              <p className="text-sm font-black text-rose-300">THỦ MÔN CẢN PHÁ XUẤT THẦN!</p>
            </div>
          )}
        </div>
      </div>

      {/* Question & Target Buttons */}
      {curr && (
        <div className="space-y-4 max-w-xl mx-auto">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 text-left">{curr.q}</p>
            <button
              onClick={() => speakText(curr.q)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
              title="Đọc câu hỏi"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                disabled={gkStatus !== 'IDLE'}
                onClick={() => handleShoot(i)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 font-bold text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
              >
                ⚽ Sút góc: {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. GAME: LẬT THẺ TRÍ NHỚ (Memory Match)
// ==========================================
const MEMORY_PAIRS: MemoryPair[] = [
  { id: '1', term: 'React', desc: 'UI Library' },
  { id: '2', term: 'TypeScript', desc: 'Type Safety' },
  { id: '3', term: 'Firestore', desc: 'NoSQL DB' },
  { id: '4', term: 'Docker', desc: 'Container' },
];

function MemoryMatchGame({ pairs, packTitle }: { pairs: MemoryPair[]; packTitle: string }) {
  const [cards, setCards] = useState<{ uid: number; pairId: string; text: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);

  const initGame = () => {
    const list: any[] = [];
    let counter = 0;
    pairs.forEach(p => {
      list.push({ uid: counter++, pairId: p.id, text: p.term, isFlipped: false, isMatched: false });
      list.push({ uid: counter++, pairId: p.id, text: p.desc, isFlipped: false, isMatched: false });
    });
    setCards(list.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchesCount(0);
  };

  useEffect(() => {
    initGame();
  }, [pairs]);

  const handleCardClick = (idx: number) => {
    if (flippedCards.length === 2 || cards[idx].isFlipped || cards[idx].isMatched) return;

    const newCards = [...cards];
    newCards[idx].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, idx];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      if (newCards[firstIdx].pairId === newCards[secondIdx].pairId) {
        // Matched!
        setTimeout(() => {
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setCards([...newCards]);
          setFlippedCards([]);
          setMatchesCount(m => m + 1);
        }, 500);
      } else {
        // Mismatch
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="text-left">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-500" />
            Lật Thẻ Trí Nhớ (Ghép cặp Thuật ngữ - Định nghĩa)
          </h3>
          <p className="text-[11px] text-slate-400">
            Đang áp dụng: <span className="font-bold text-indigo-500">{packTitle}</span>
          </p>
        </div>
        <button 
          onClick={initGame} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xáo thẻ</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
        {cards.map((c, i) => (
          <button
            key={c.uid}
            onClick={() => handleCardClick(i)}
            className={`h-24 rounded-2xl font-bold text-xs transition-all flex items-center justify-center p-2.5 shadow-xs cursor-pointer leading-tight ${
              c.isMatched
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500'
                : c.isFlipped
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {c.isFlipped || c.isMatched ? c.text : '❓'}
          </button>
        ))}
      </div>

      {matchesCount === pairs.length && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in zoom-in">
          🎉 Chúc mừng bạn đã hoàn thành ghép đúng toàn bộ các cặp thẻ!
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. GAME: SINH TỒN TRI THỨC (Survival Rush)
// ==========================================
const SURVIVAL_QUESTIONS: GameQuestion[] = [
  { q: 'Trong mô hình OSI, tầng nào chịu trách nhiệm truyền dữ liệu vật lý?', opts: ['Physical Layer', 'Transport Layer', 'Network Layer', 'Session Layer'], a: 0 },
  { q: 'Cấu trúc giải thuật Dijkstra dùng để tìm gì?', opts: ['Đường đi ngắn nhất', 'Cây khung nhỏ nhất', 'Sắp xếp mảng', 'Mã hóa dữ liệu'], a: 0 },
  { q: 'Độ phức tạp thời gian trung bình của Quick Sort là gì?', opts: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(1)'], a: 0 },
  { q: 'Giao thức nào phân giải tên miền sang địa chỉ IP?', opts: ['DNS', 'DHCP', 'ARP', 'SNMP'], a: 0 },
  { q: 'Trong SQL, lệnh nào xóa toàn bộ bảng dữ liệu không thể rollback?', opts: ['DROP TABLE', 'DELETE', 'REMOVE', 'CLEAR'], a: 0 },
];

function SurvivalQuizGame({ questions, packTitle }: { questions: GameQuestion[]; packTitle: string }) {
  const [lives, setLives] = useState(3);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDead, setIsDead] = useState(false);

  useEffect(() => {
    setLives(3);
    setScore(0);
    setQIdx(0);
    setIsDead(false);
  }, [questions]);

  const handleAnswer = (choiceIdx: number) => {
    if (isDead || questions.length === 0) return;
    const curr = questions[qIdx % questions.length];
    if (choiceIdx === curr.a) {
      setScore(s => s + 100);
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.7 } });
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsDead(true);
      }
    }
    setQIdx(prev => (prev + 1) % questions.length);
  };

  const restart = () => {
    setLives(3);
    setScore(0);
    setQIdx(0);
    setIsDead(false);
  };

  const curr = questions[qIdx % questions.length] || questions[0];

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="text-left">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            Sinh Tồn Tri Thức (3 Mạng)
          </h3>
          <p className="text-[11px] text-slate-400">
            Đang áp dụng: <span className="font-bold text-indigo-500">{packTitle}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-rose-500">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-current' : 'opacity-20'}`} />
          ))}
        </div>
      </div>

      {!isDead && curr ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-mono">Điểm sinh tồn: {score} pts</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
            </div>
            <button
              onClick={() => speakText(curr.q)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
              title="Đọc câu hỏi"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-500 font-medium text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-3">
          <div className="text-4xl">💀</div>
          <h4 className="text-xl font-black text-rose-600">HẾT MẠNG SINH TỒN!</h4>
          <p className="text-xs text-slate-400">Bạn đã sống sót đạt được {score} điểm</p>
          <button
            onClick={restart}
            className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            Chơi lại lượt mới
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. GAME: CHỚP NHOÁNG 5 GIÂY (Blitz Speed)
// ==========================================
const BLITZ_QUESTIONS: GameQuestion[] = [
  { q: 'React hook nào dùng để quản lý state?', opts: ['useState', 'useCSS', 'useDOM'], a: 0 },
  { q: 'TypeScript là superset của ngôn ngữ nào?', opts: ['JavaScript', 'Python', 'Go'], a: 0 },
  { q: 'Thẻ HTML nào hiển thị hình ảnh?', opts: ['<img>', '<pic>', '<image>'], a: 0 },
  { q: 'Cổng mặc định của dịch vụ web HTTP là?', opts: ['80', '443', '21'], a: 0 },
  { q: 'Bộ nhớ nào mất dữ liệu khi mất nguồn điện?', opts: ['RAM', 'SSD', 'ROM'], a: 0 },
];

function BlitzSpeedGame({ questions, packTitle }: { questions: GameQuestion[]; packTitle: string }) {
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    setQIdx(0);
    setTimeLeft(5);
    setScore(0);
    setIsGameOver(false);
  }, [questions]);

  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qIdx, isGameOver]);

  const handleAnswer = (choiceIdx: number) => {
    if (isGameOver || questions.length === 0) return;
    const curr = questions[qIdx % questions.length];
    if (choiceIdx === curr.a) {
      setScore(s => s + 50 * timeLeft);
      setTimeLeft(5);
      setQIdx(prev => (prev + 1) % questions.length);
    } else {
      setIsGameOver(true);
    }
  };

  const restart = () => {
    setQIdx(0);
    setTimeLeft(5);
    setScore(0);
    setIsGameOver(false);
  };

  const curr = questions[qIdx % questions.length] || questions[0];

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="text-left">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500 fill-current" />
            Chớp Nhoáng 5 Giây (Blitz Speed)
          </h3>
          <p className="text-[11px] text-slate-400">
            Đang áp dụng: <span className="font-bold text-indigo-500">{packTitle}</span>
          </p>
        </div>
        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
          Điểm: {score} pts
        </span>
      </div>

      {!isGameOver && curr ? (
        <div className="space-y-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft <= 2 ? 'bg-rose-500' : 'bg-purple-600'}`}
              style={{ width: `${(timeLeft / 5) * 100}%` }}
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
            <div className="text-left">
              <span className="text-xs font-mono font-black text-rose-500">0{timeLeft}s</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
            </div>
            <button
              onClick={() => speakText(curr.q)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 cursor-pointer shrink-0"
              title="Đọc câu hỏi"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-500 font-bold text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-3">
          <div className="text-4xl">⚡</div>
          <h4 className="text-xl font-black text-purple-600">HẾT GIỜ CHỚP NHOÁNG!</h4>
          <p className="text-xs text-slate-400">Tổng điểm phản xạ siêu tốc: {score} pts</p>
          <button
            onClick={restart}
            className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            Chơi lại lượt mới
          </button>
        </div>
      )}
    </div>
  );
}
