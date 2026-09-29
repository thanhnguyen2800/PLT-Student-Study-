import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Check, 
  X, 
  Sparkles,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Quiz, Question } from '../types';
import { speakText } from '../utils/tts';
import { useAuth } from '../context/AuthContext';

const DEFAULT_QUIZ_IDS = ['quiz-web-dev-01', 'quiz-science-ai-02', 'quiz-english-comm-03'];

interface FlashcardsProps {
  quizId: string;
  onBack: () => void;
  onRequireLogin?: () => void;
}

export const FlashcardsPage: React.FC<FlashcardsProps> = ({ quizId, onBack, onRequireLogin }) => {
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [cards, setCards] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setQuiz(json.data);
          setCards(json.data.questions || []);
        }
      });
  }, [quizId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleMastered = (cardId: string) => {
    setMasteredIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const currentCard = cards[currentIndex];

  if (!currentUser && !DEFAULT_QUIZ_IDS.includes(quizId)) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Yêu Cầu Đăng Nhập Học Viên
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Bộ Flashcard này do Giảng viên vừa tạo mới và chỉ dành riêng cho Học viên đã được cấp tài khoản. Người dùng chưa đăng nhập chỉ có thể trải nghiệm 3 bộ Quiz mẫu mặc định của hệ thống.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Quay lại kho Quiz
          </button>
          <button
            onClick={() => {
              if (onRequireLogin) onRequireLogin();
              else onBack();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !currentCard) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Đang tải bộ thẻ Flashcard...
      </div>
    );
  }

  // Determine correct answer text for the back of the card
  let correctAnswerText = '';
  if (Array.isArray(currentCard.correctAnswer)) {
    correctAnswerText = currentCard.correctAnswer.map(i => currentCard.options[i]).join(', ');
  } else {
    correctAnswerText = currentCard.options[Number(currentCard.correctAnswer)] || '';
  }

  const isMastered = masteredIds.includes(currentCard.id);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in select-none pb-16">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Rời Flashcard</span>
        </button>

        <div className="text-center">
          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            Đã thuộc: {masteredIds.length}/{cards.length}
          </p>
        </div>

        <button
          onClick={handleShuffle}
          title="Xáo trộn ngẫu nhiên"
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <Shuffle className="w-5 h-5" />
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer h-[420px] w-full rounded-3xl [perspective:1000px]"
      >
        <div 
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-3xl shadow-2xl ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front Face (Question) */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-between [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                Mặt trước: Câu hỏi / Khái niệm
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.question);
                }}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-emerald-600 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center my-auto space-y-4">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-relaxed">
                {currentCard.question}
              </h3>
              {currentCard.imageUrl && (
                <div className="max-h-40 mx-auto rounded-2xl overflow-hidden">
                  <img src={currentCard.imageUrl} alt="Diagram" className="h-full object-contain mx-auto" />
                </div>
              )}
            </div>

            <div className="text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <RotateCw className="w-4 h-4" />
              <span>Nhấn để lật xem đáp án (hoặc ấn Phím Cách)</span>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-emerald-50/80 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-emerald-500 dark:border-emerald-600 rounded-3xl p-8 sm:p-10 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                Mặt sau: Đáp án chuẩn
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(correctAnswerText + '. ' + (currentCard.explanation || ''));
                }}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-600 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/50 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                  Đáp án chính xác:
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {correctAnswerText}
                </p>
              </div>

              {currentCard.explanation && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/80 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="block text-emerald-700 dark:text-emerald-400 font-bold mb-1">Giải thích chi tiết:</strong>
                  {currentCard.explanation}
                </div>
              )}
            </div>

            <div className="text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <RotateCw className="w-4 h-4" />
              <span>Nhấn để lật lại mặt trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Mastered Toggle */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => toggleMastered(currentCard.id)}
          className={`flex-1 py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isMastered
              ? 'bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-700'
              : 'border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>{isMastered ? 'Đã ghi nhớ thẻ này' : 'Đánh dấu đã thuộc'}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex + 1 === cards.length}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};
