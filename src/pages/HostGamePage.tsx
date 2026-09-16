import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Play, 
  Trophy, 
  Radio, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Database,
  Share2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { GameSession, Quiz } from '../types';
import { speakText } from '../utils/tts';
import { useAuth } from '../context/AuthContext';
import { getClientFirestore } from '../lib/firebase/client';

interface HostGameProps {
  quizId: string;
  onBack: () => void;
}

export const HostGamePage: React.FC<HostGameProps> = ({ quizId, onBack }) => {
  const { currentUser } = useAuth();
  const [session, setSession] = useState<GameSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const pollingRef = useRef<any>(null);

  // Initialize Game Session
  useEffect(() => {
    setInitError(null);
    fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId,
        hostId: currentUser?.uid || 'host_teacher',
        hostName: currentUser?.displayName || 'ThS. Trần Văn Minh',
      }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setSession(json.data.session);
          setQuiz(json.data.quiz);
          startPolling(json.data.session.id);
        } else {
          setInitError(json.error?.message || 'Không thể tạo phòng thi đấu.');
        }
      })
      .catch(err => {
        console.error(err);
        setInitError('Lỗi kết nối máy chủ khi tạo phòng thi.');
      });

    return () => clearInterval(pollingRef.current);
  }, [quizId, currentUser]);

  // Firestore Realtime listener for zero-latency multiplayer updates
  useEffect(() => {
    if (!session?.id) return;
    const db = getClientFirestore();
    if (!db) return;

    try {
      const unsub = onSnapshot(doc(db, 'gameSessions', session.id), (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as GameSession;
          if (cloudData) {
            setSession(cloudData);
          }
        }
      }, (err) => {
        console.warn('[Firestore Live] onSnapshot note:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('[Firestore Live] Listener setup note:', e);
    }
  }, [session?.id]);

  const startPolling = (sessionId: string) => {
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/game/${sessionId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSession(json.data);
        }
      } catch (e) {
        console.warn(e);
      }
    }, 1500);
  };

  const handleCopyPin = () => {
    if (!session?.pin) return;
    navigator.clipboard.writeText(session.pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyLink = () => {
    if (!session?.pin) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?tab=multiplayer&pin=${session.pin}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/game/${session.id}/start`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setTimeLeft(quiz?.questions[0]?.timeLimit || 20);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    setShowExplanation(false);
    try {
      const res = await fetch(`/api/game/${session.id}/next`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        if (json.data.status === 'FINISHED') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        } else {
          const nextQ = quiz?.questions[json.data.currentQuestionIndex];
          setTimeLeft(nextQ?.timeLimit || 20);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndSessionAndExit = async () => {
    if (session?.id) {
      try {
        await fetch(`/api/game/${session.id}/end`, { method: 'POST' });
      } catch (e) {
        console.warn('Could not end session:', e);
      }
    }
    onBack();
  };

  // Timer tick for question
  useEffect(() => {
    if (session?.status !== 'QUESTION_ACTIVE') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time up: reveal answers
          setShowExplanation(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status, session?.currentQuestionIndex]);

  if (initError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Không thể khởi tạo phòng</h3>
        <p className="text-xs text-slate-400">{initError}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
        >
          Quay lại kho Quiz
        </button>
      </div>
    );
  }

  if (!session || !quiz) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Đang khởi tạo phòng thi đấu Multiplayer & kết nối Cloud Firestore...</p>
      </div>
    );
  }

  // --- LOBBY SCREEN (Waiting for players) ---
  if (session.status === 'WAITING') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleEndSessionAndExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Hủy & Đóng phòng thi đấu
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>Realtime DB: Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
              Live Lobby
            </div>
          </div>
        </div>

        {/* PIN Banner */}
        <div className="bg-linear-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
              Mời người chơi truy cập Multiplayer và nhập Game PIN:
            </p>
            
            <div className="inline-flex items-center gap-3 bg-black/20 backdrop-blur-xs px-6 py-2 rounded-2xl border border-white/10">
              <span className="text-5xl sm:text-7xl font-black tracking-widest font-mono text-amber-300 drop-shadow-md select-all">
                {session.pin}
              </span>
              <button
                onClick={handleCopyPin}
                title="Sao chép mã PIN"
                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white cursor-pointer"
              >
                {copiedPin ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép link tham gia!' : 'Sao chép link tham gia nhanh'}</span>
              </button>
            </div>

            <p className="text-xs text-indigo-100 pt-1">
              Chủ đề: <strong className="text-white">{quiz.title}</strong> • {quiz.questions.length} câu hỏi • Host: <strong className="text-white">{session.hostName}</strong>
            </p>
          </div>
        </div>

        {/* Players List Grid */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Người chơi đã vào phòng ({session.players.length})
              </h3>
            </div>

            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Bắt đầu trò chơi
            </button>
          </div>

          {session.players.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping mx-auto" />
              <p>Đang chờ người chơi tham gia với mã PIN <strong>{session.pin}</strong>...</p>
              <p className="text-[11px] text-slate-400">(Mẹo: Mở trang Multiplayer trên tab khác để thử vai người chơi)</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {session.players.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95"
                >
                  <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</p>
                    <span className="text-[10px] text-emerald-500 font-medium">Sẵn sàng</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- QUESTION ACTIVE / REVEAL SCREEN ---
  const currentQ = quiz.questions[session.currentQuestionIndex];
  const answeredCount = Object.keys(session.answers[currentQ?.id] || {}).length;

  if (session.status === 'QUESTION_ACTIVE') {
    const kahootColors = [
      { bg: 'bg-rose-600 hover:bg-rose-700', shape: '▲', label: 'A' },
      { bg: 'bg-blue-600 hover:bg-blue-700', shape: '◆', label: 'B' },
      { bg: 'bg-amber-500 hover:bg-amber-600', shape: '●', label: 'C' },
      { bg: 'bg-emerald-600 hover:bg-emerald-700', shape: '■', label: 'D' },
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Câu {session.currentQuestionIndex + 1} / {quiz.questions.length}
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Đã trả lời: <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> / {session.players.length}
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Question Header Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {currentQ.question}
            </h2>
            <button
              onClick={() => speakText(currentQ.question)}
              title="Đọc câu hỏi TTS"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-indigo-600"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {currentQ.imageUrl && (
            <div className="max-h-56 mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
              <img src={currentQ.imageUrl} alt="Diagram" className="h-full object-contain mx-auto" />
            </div>
          )}
        </div>

        {/* 4 Kahoot-style blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((opt, idx) => {
            const color = kahootColors[idx] || kahootColors[0];
            const isCorrect = Number(currentQ.correctAnswer) === idx;

            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center gap-4 shadow-md transition-all ${color.bg} ${
                  showExplanation && !isCorrect ? 'opacity-30' : ''
                }`}
              >
                <span className="text-2xl">{color.shape}</span>
                <span className="flex-1">{opt}</span>
                {showExplanation && isCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Controls & Next Question */}
        <div className="flex items-center justify-between pt-2">
          {!showExplanation ? (
            <button
              onClick={() => setShowExplanation(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hiện đáp án ngay
            </button>
          ) : (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Đã hiển thị đáp án đúng cho cả phòng
            </div>
          )}

          <button
            onClick={handleNextQuestion}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <span>Bảng xếp hạng / Câu tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- LEADERBOARD SCREEN ---
  if (session.status === 'LEADERBOARD') {
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Bảng Xếp Hạng Trực Tiếp
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Sau Câu {session.currentQuestionIndex + 1}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                idx === 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                  idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  #{idx + 1}
                </span>
                <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</p>
                  {p.streak > 1 && (
                    <span className="text-[10px] text-amber-500 font-bold">🔥 {p.streak} câu liên tiếp!</span>
                  )}
                </div>
              </div>

              <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                {p.score} pts
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleNextQuestion}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <span>{session.currentQuestionIndex + 1 < quiz.questions.length ? 'Câu hỏi kế tiếp' : 'Tổng kết & Vinh danh'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- FINAL PODIUM SCREEN ---
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className="max-w-3xl mx-auto text-center space-y-8 py-8 animate-in fade-in">
      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
          🎉 Trận đấu kết thúc
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Bảng Vinh Danh Nhà Vô Địch
        </h1>
      </div>

      {/* Podium Display */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 pt-12 pb-6">
        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center space-y-2">
            <img src={second.avatar} alt={second.name} className="w-14 h-14 rounded-2xl border-2 border-slate-300 object-cover shadow-md" />
            <p className="font-bold text-xs text-slate-900 dark:text-white max-w-[90px] truncate">{second.name}</p>
            <span className="text-[11px] font-mono text-indigo-500 font-bold">{second.score} pts</span>
            <div className="w-24 sm:w-28 h-32 rounded-t-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-2xl text-slate-500">
              2
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex flex-col items-center space-y-2 -mt-8">
            <div className="relative">
              <Trophy className="w-7 h-7 text-amber-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
              <img src={first.avatar} alt={first.name} className="w-18 h-18 rounded-2xl border-4 border-amber-400 object-cover shadow-xl" />
            </div>
            <p className="font-extrabold text-sm text-slate-900 dark:text-white max-w-[110px] truncate">{first.name}</p>
            <span className="text-xs font-mono text-amber-500 font-extrabold">{first.score} pts</span>
            <div className="w-28 sm:w-36 h-44 rounded-t-2xl bg-linear-to-b from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-4xl shadow-lg">
              1
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center space-y-2">
            <img src={third.avatar} alt={third.name} className="w-14 h-14 rounded-2xl border-2 border-amber-700 object-cover shadow-md" />
            <p className="font-bold text-xs text-slate-900 dark:text-white max-w-[90px] truncate">{third.name}</p>
            <span className="text-[11px] font-mono text-indigo-500 font-bold">{third.score} pts</span>
            <div className="w-24 sm:w-28 h-24 rounded-t-2xl bg-amber-800/40 dark:bg-amber-900/60 flex items-center justify-center font-black text-2xl text-amber-600">
              3
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <button
          onClick={handleEndSessionAndExit}
          className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
        >
          Hoàn tất & Đóng phòng thi đấu (Hết hiệu lực PIN)
        </button>
      </div>
    </div>
  );
};
