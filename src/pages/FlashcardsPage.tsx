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
  HelpCircle
} from 'lucide-react';
import { Quiz, Question } from '../types';
import { speakText } from '../utils/tts';

interface FlashcardsProps {
  quizId: string;
  onBack: () => void;
}

export const FlashcardsPage: React.FC<FlashcardsProps> = ({ quizId, onBack }) => {
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
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Rời Flashcard
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <p className="text-[11px] text-slate-400">
            Đã thuộc: {masteredIds.length}/{cards.length}
          </p>
        </div>

        <button
          onClick={handleShuffle}
          title="Xáo trộn ngẫu nhiên"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer h-96 w-full rounded-3xl [perspective:1000px]"
      >
        <div 
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-3xl shadow-xl ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front Face (Question) */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                Mặt trước: Câu hỏi / Khái niệm
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.question);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-indigo-600"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
                {currentCard.question}
              </h3>
              {currentCard.imageUrl && (
                <div className="max-h-36 mx-auto rounded-xl overflow-hidden">
                  <img src={currentCard.imageUrl} alt="Diagram" className="h-full object-contain mx-auto" />
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              Nhấn để lật xem đáp án (hoặc ấn Phím Cách)
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-indigo-50/80 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-indigo-400 dark:border-indigo-600 rounded-3xl p-8 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                Mặt sau: Đáp án chuẩn
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(correctAnswerText + '. ' + (currentCard.explanation || ''));
                }}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 hover:text-indigo-600"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/50 shadow-xs">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Đáp án chính xác:
                </p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {correctAnswerText}
                </p>
              </div>

              {currentCard.explanation && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-indigo-600 font-semibold mb-1">Giải thích chi tiết:</strong>
                  {currentCard.explanation}
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              Nhấn để lật lại mặt trước
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Mastered Toggle */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => toggleMastered(currentCard.id)}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
            isMastered
              ? 'bg-emerald-600 text-white'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
          }`}
        >
          <Check className="w-4 h-4" />
          {isMastered ? 'Đã ghi nhớ thẻ này' : 'Đánh dấu đã thuộc'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex + 1 === cards.length}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
