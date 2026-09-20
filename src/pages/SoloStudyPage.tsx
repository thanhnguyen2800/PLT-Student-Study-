import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  BookOpen, 
  ChevronRight,
  Flame,
  HelpCircle,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quiz, Question, QuizAttempt } from '../types';
import { speakText } from '../utils/tts';
import { useAuth } from '../context/AuthContext';

const DEFAULT_QUIZ_IDS = ['quiz-web-dev-01', 'quiz-science-ai-02', 'quiz-english-comm-03'];

interface SoloStudyProps {
  quizId: string;
  onBack: () => void;
  onRequireLogin?: () => void;
}

export const SoloStudyPage: React.FC<SoloStudyProps> = ({ quizId, onBack, onRequireLogin }) => {
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [score, setScore] = useState(0);
  const [answersHistory, setAnswersHistory] = useState<{
    questionId: string;
    selectedAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken: number;
  }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setQuiz(json.data);
          if (json.data.questions?.[0]) {
            setTimeRemaining(json.data.questions[0].timeLimit || 20);
          }
        }
      });
  }, [quizId]);

  // Active question
  const questionsList = isReviewMode ? wrongQuestions : (quiz?.questions || []);
  const currentQ = questionsList[currentIndex];

  // Timer loop
  useEffect(() => {
    if (!currentQ || isAnswerSubmitted || isFinished) return;

    setTimeRemaining(currentQ.timeLimit || 20);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isAnswerSubmitted, isFinished, isReviewMode, currentQ]);

  const handleTimeExpired = () => {
    if (isAnswerSubmitted) return;
    handleSubmitAnswer(-1, true);
  };

  const handleSubmitAnswer = (answerIdx: any, isTimeout: boolean = false) => {
    if (isAnswerSubmitted || !currentQ) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(answerIdx);
    setIsAnswerSubmitted(true);

    let isCorrect = false;
    if (!isTimeout) {
      if (Array.isArray(currentQ.correctAnswer)) {
        if (Array.isArray(answerIdx)) {
          isCorrect = currentQ.correctAnswer.length === answerIdx.length &&
            currentQ.correctAnswer.every(val => answerIdx.includes(val));
        }
      } else {
        isCorrect = Number(currentQ.correctAnswer) === Number(answerIdx);
      }
    }

    const timeSpent = (currentQ.timeLimit || 20) - timeRemaining;
    const pointsEarned = isCorrect ? (currentQ.points || 100) : 0;
    setScore(prev => prev + pointsEarned);

    setAnswersHistory(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        selectedAnswer: answerIdx,
        isCorrect,
        pointsEarned,
        timeTaken: timeSpent,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questionsList.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finished Quiz
      setIsFinished(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      // Save attempt to backend
      const totalCorrect = answersHistory.filter(a => a.isCorrect).length + (isCurrentCorrect() ? 1 : 0);
      const totalQuestions = questionsList.length;

      const attemptData = {
        userId: currentUser?.uid || 'guest_user',
        userName: currentUser?.displayName || 'Học viên',
        userEmail: currentUser?.email,
        quizId: quiz?.id,
        quizTitle: quiz?.title || '',
        score: score + (isCurrentCorrect() ? (currentQ.points || 100) : 0),
        totalPoints: questionsList.reduce((acc, q) => acc + (q.points || 100), 0),
        totalQuestions,
        correctAnswers: totalCorrect,
        wrongAnswers: totalQuestions - totalCorrect,
        duration: answersHistory.reduce((acc, a) => acc + a.timeTaken, 0),
        answers: answersHistory,
        createdAt: new Date().toISOString(),
      };

      fetch('/api/quizzes/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptData),
      }).catch(console.error);

      // Also persist to local storage for instant offline / client reflection
      try {
        const stored = localStorage.getItem('studentstudy_attempts_v1');
        const parsed = stored ? JSON.parse(stored) : [];
        parsed.unshift({ ...attemptData, id: 'att_' + Date.now() });
        localStorage.setItem('studentstudy_attempts_v1', JSON.stringify(parsed.slice(0, 100)));
      } catch (err) {
        console.warn('Could not save local attempt:', err);
      }

      // Collect wrong questions for review mode
      const wrongs = questionsList.filter((q, idx) => {
        const ans = answersHistory[idx];
        return ans ? !ans.isCorrect : !isCurrentCorrect();
      });
      setWrongQuestions(wrongs);
    }
  };

  const isCurrentCorrect = (): boolean => {
    if (!currentQ || selectedAnswer === null || selectedAnswer === -1) return false;
    if (Array.isArray(currentQ.correctAnswer)) {
      return Array.isArray(selectedAnswer) &&
        currentQ.correctAnswer.length === selectedAnswer.length &&
        currentQ.correctAnswer.every(val => selectedAnswer.includes(val));
    }
    return Number(currentQ.correctAnswer) === Number(selectedAnswer);
  };

  const startReviewMode = () => {
    if (wrongQuestions.length === 0) return;
    setIsReviewMode(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsFinished(false);
    setScore(0);
    setAnswersHistory([]);
  };

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
          Bài quiz này do Giảng viên vừa tạo mới và chỉ dành riêng cho Học viên đã được cấp tài khoản. Người dùng chưa đăng nhập chỉ có thể trải nghiệm 3 bộ Quiz mẫu mặc định của hệ thống.
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

  if (!quiz || !currentQ) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Đang chuẩn bị câu hỏi bài thi...
      </div>
    );
  }

  // Final Results Screen
  if (isFinished) {
    const totalCorrect = answersHistory.filter(a => a.isCorrect).length;
    const accuracy = Math.round((totalCorrect / questionsList.length) * 100);

    return (
      <div className="max-w-xl mx-auto py-8 animate-in fade-in space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-md shadow-amber-500/15">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {isReviewMode ? 'Hoàn thành Ôn tập' : 'Hoàn thành bài Quiz'}
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {quiz.title}
            </h1>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tổng điểm</p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{score}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Đúng</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalCorrect} / {questionsList.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Độ chính xác</p>
              <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{accuracy}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            {wrongQuestions.length > 0 && !isReviewMode && (
              <button
                onClick={startReviewMode}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Ôn tập {wrongQuestions.length} câu làm sai (Review Mode)
              </button>
            )}

            <button
              onClick={() => {
                setIsReviewMode(false);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setIsAnswerSubmitted(false);
                setIsFinished(false);
                setScore(0);
                setAnswersHistory([]);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Làm lại toàn bộ Quiz
            </button>

            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
            >
              Quay về danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeLimit = currentQ.timeLimit || 20;
  const timeRatio = (timeRemaining / timeLimit) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Top Bar: Back & Progress & Timer */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Rời bài thi
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Câu {currentIndex + 1} / {questionsList.length}
          </span>
          {isReviewMode && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              Review Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          <Clock className={`w-4 h-4 ${timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <span>{timeRemaining}s</span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 rounded-full ${
            timeRemaining <= 5 ? 'bg-rose-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${timeRatio}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        {/* Header with TTS button */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {currentQ.question}
          </h2>

          <button
            onClick={() => speakText(currentQ.question)}
            title="Đọc câu hỏi bằng AI Voice (gemini-3.1-flash-tts-preview)"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Question Image if present */}
        {currentQ.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 aspect-video bg-slate-950">
            <img src={currentQ.imageUrl} alt="Question Diagram" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = Array.isArray(currentQ.correctAnswer)
              ? (currentQ.correctAnswer as number[]).includes(idx)
              : Number(currentQ.correctAnswer) === idx;

            let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-400';

            if (isAnswerSubmitted) {
              if (isCorrectOption) {
                btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
              } else if (isSelected) {
                btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200';
              } else {
                btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleSubmitAnswer(idx)}
                className={`w-full text-left p-4 rounded-2xl border-2 text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 shadow-xs ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {isAnswerSubmitted && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswerSubmitted && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {currentQ.explanation && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Giải thích đáp án:
                </p>
                <p className="leading-relaxed pl-5">{currentQ.explanation}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
            >
              <span>{currentIndex + 1 < questionsList.length ? 'Câu hỏi tiếp theo' : 'Xem kết quả tổng kết'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
