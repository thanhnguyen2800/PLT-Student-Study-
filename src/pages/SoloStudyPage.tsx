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
  Lock,
  CheckSquare,
  ListChecks
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
  const [selectedMultiple, setSelectedMultiple] = useState<number[]>([]);
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
  const isMultipleSelect = Boolean(currentQ && (currentQ.type === 'MULTIPLE_SELECT' || Array.isArray(currentQ.correctAnswer)));

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
    if (isMultipleSelect) {
      handleSubmitAnswer(selectedMultiple.length > 0 ? selectedMultiple : -1, true);
    } else {
      handleSubmitAnswer(-1, true);
    }
  };

  const toggleMultipleOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedMultiple(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const handleSubmitAnswer = (answerIdx: any, isTimeout: boolean = false) => {
    if (isAnswerSubmitted || !currentQ) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(answerIdx);
    setIsAnswerSubmitted(true);

    let isCorrect = false;
    if (!isTimeout && answerIdx !== -1) {
      if (Array.isArray(currentQ.correctAnswer)) {
        const correctArr = currentQ.correctAnswer.map(Number);
        const userArr = Array.isArray(answerIdx) ? answerIdx.map(Number) : [Number(answerIdx)];
        isCorrect = correctArr.length === userArr.length &&
          correctArr.every(val => userArr.includes(val)) &&
          userArr.every(val => correctArr.includes(val));
      } else if (Array.isArray(answerIdx)) {
        isCorrect = answerIdx.length === 1 && Number(answerIdx[0]) === Number(currentQ.correctAnswer);
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
      setSelectedMultiple([]);
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
      if (!Array.isArray(selectedAnswer)) return false;
      const correctArr = currentQ.correctAnswer.map(Number);
      const userArr = selectedAnswer.map(Number);
      return correctArr.length === userArr.length &&
        correctArr.every(val => userArr.includes(val)) &&
        userArr.every(val => correctArr.includes(val));
    }
    const userVal = Array.isArray(selectedAnswer) ? (selectedAnswer.length === 1 ? Number(selectedAnswer[0]) : -999) : Number(selectedAnswer);
    return Number(currentQ.correctAnswer) === userVal;
  };

  const startReviewMode = () => {
    if (wrongQuestions.length === 0) return;
    setIsReviewMode(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSelectedMultiple([]);
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
                setSelectedMultiple([]);
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-16">
      
      {/* Top Bar: Back & Progress & Timer */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Rời bài thi</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            Câu {currentIndex + 1} / {questionsList.length}
          </span>
          {isReviewMode && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              Chế độ ôn tập
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm sm:text-base font-mono font-bold text-slate-700 dark:text-slate-300">
          <Clock className={`w-5 h-5 ${timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <span>{timeRemaining}s</span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 rounded-full ${
            timeRemaining <= 5 ? 'bg-rose-500' : 'bg-emerald-600'
          }`}
          style={{ width: `${timeRatio}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
        
        {/* Header with TTS button */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug">
            {currentQ.question}
          </h2>

          <button
            onClick={() => speakText(currentQ.question)}
            title="Đọc câu hỏi bằng AI Voice"
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Question Image if present */}
        {currentQ.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72 aspect-video bg-slate-950">
            <img src={currentQ.imageUrl} alt="Question Diagram" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Multi-Select Instructions Badge */}
        {isMultipleSelect && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs sm:text-sm font-bold shadow-xs">
            <ListChecks className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Câu hỏi chọn nhiều đáp án đúng: Bạn có thể chọn nhiều phương án rồi nhấn nút "Xác nhận câu trả lời" bên dưới.</span>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3.5">
          {currentQ.options.map((opt, idx) => {
            const isCorrectOption = (Array.isArray(currentQ.correctAnswer)
              ? currentQ.correctAnswer.map(Number)
              : [Number(currentQ.correctAnswer)]
            ).includes(idx);

            const isChecked = isMultipleSelect
              ? (isAnswerSubmitted
                  ? (Array.isArray(selectedAnswer) ? selectedAnswer.map(Number).includes(idx) : Number(selectedAnswer) === idx)
                  : selectedMultiple.includes(idx))
              : (isAnswerSubmitted
                  ? Number(selectedAnswer) === idx
                  : false);

            let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-500';

            if (!isAnswerSubmitted) {
              if (isMultipleSelect && isChecked) {
                btnStyle = 'border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 font-bold shadow-xs';
              }
            } else {
              if (isCorrectOption && isChecked) {
                btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
              } else if (isCorrectOption && !isChecked) {
                btnStyle = 'border-emerald-400 border-dashed bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300';
              } else if (!isCorrectOption && isChecked) {
                btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold';
              } else {
                btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => {
                  if (isMultipleSelect) {
                    toggleMultipleOption(idx);
                  } else {
                    handleSubmitAnswer(idx);
                  }
                }}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 text-base sm:text-lg font-semibold transition-all flex items-center justify-between gap-4 shadow-xs cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  {isMultipleSelect && (
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? (isAnswerSubmitted
                            ? (isCorrectOption ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')
                            : 'bg-purple-600 text-white')
                        : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                    }`}>
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : null}
                    </div>
                  )}

                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAnswerSubmitted && isCorrectOption && isChecked && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đúng</span>
                    </span>
                  )}
                  {isAnswerSubmitted && isCorrectOption && !isChecked && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bỏ sót</span>
                    </span>
                  )}
                  {isAnswerSubmitted && !isCorrectOption && isChecked && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950 px-2.5 py-1 rounded-full">
                      <XCircle className="w-4 h-4" />
                      <span>Chọn sai</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-select confirm button */}
        {isMultipleSelect && !isAnswerSubmitted && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmitAnswer(selectedMultiple)}
              disabled={selectedMultiple.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {selectedMultiple.length > 0
                  ? `Xác nhận câu trả lời (Đã chọn ${selectedMultiple.length} đáp án)`
                  : 'Vui lòng chọn ít nhất 1 đáp án để xác nhận'}
              </span>
            </button>
          </div>
        )}

        {/* Explanation & Next Button */}
        {isAnswerSubmitted && (
          <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {isCurrentCorrect() ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm sm:text-base">Chính xác tuyệt đối!</p>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    Bạn đã trả lời đúng tất cả các yêu cầu của câu hỏi (+{currentQ.points || 100} điểm)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm sm:text-base">Chưa chính xác!</p>
                  <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    {isMultipleSelect
                      ? 'Dạng câu hỏi chọn nhiều đáp án đúng yêu cầu chọn đủ và chính xác tất cả các phương án đúng.'
                      : 'Đáp án bạn chọn chưa chính xác.'}
                  </p>
                </div>
              </div>
            )}

            {currentQ.explanation && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-sm sm:text-base text-emerald-950 dark:text-emerald-200 space-y-1.5">
                <p className="font-extrabold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  <span>Giải thích đáp án:</span>
                </p>
                <p className="leading-relaxed pl-7">{currentQ.explanation}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <span>{currentIndex + 1 < questionsList.length ? 'Câu hỏi tiếp theo' : 'Xem kết quả tổng kết'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
