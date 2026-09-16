import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flame, 
  Trophy, 
  Sparkles, 
  Send, 
  PlusCircle, 
  BookOpen, 
  Database,
  HelpCircle,
  AlertCircle,
  Lock,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { GameSession, Player, Quiz, Question } from '../types';
import { useAuth } from '../context/AuthContext';
import { getClientFirestore } from '../lib/firebase/client';

interface PlayerGameProps {
  initialPin?: string;
  onBack: () => void;
  onHostQuiz?: (quizId: string) => void;
  onRequireLogin?: () => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
];

export const PlayerGamePage: React.FC<PlayerGameProps> = ({ 
  initialPin = '', 
  onBack, 
  onHostQuiz,
  onRequireLogin
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [pin, setPin] = useState(initialPin);
  const [playerName, setPlayerName] = useState(currentUser?.displayName || 'Player ' + Math.floor(Math.random() * 900 + 100));
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [joinedSession, setJoinedSession] = useState<GameSession | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const pollingRef = useRef<any>(null);

  // Load available quizzes for the host tab only (No suggested rooms per user requirement)
  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setAvailableQuizzes(json.data);
        }
      })
      .catch(console.warn);
  }, []);

  // Fetch quiz details when joined if not already available
  useEffect(() => {
    if (!joinedSession?.quizId || quiz) return;
    fetch(`/api/quizzes/${joinedSession.quizId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setQuiz(json.data);
        }
      })
      .catch(console.warn);
  }, [joinedSession?.quizId, quiz]);

  // Firestore Realtime Listener for instant synchronization
  useEffect(() => {
    if (!joinedSession?.id) return;
    const db = getClientFirestore();
    if (!db) return;

    try {
      const unsub = onSnapshot(doc(db, 'gameSessions', joinedSession.id), (snap) => {
        if (snap.exists()) {
          const updated = snap.data() as GameSession;
          if (updated) {
            if (updated.currentQuestionIndex !== joinedSession.currentQuestionIndex) {
              setSelectedAnswer(null);
              setHasAnswered(false);
              setAnswerResult(null);
            }
            setJoinedSession(updated);
          }
        } else {
          // Document was deleted / room ended
          setJoinedSession(prev => prev ? { ...prev, status: 'FINISHED', isExpired: true } : null);
        }
      }, (err) => {
        console.warn('[Player Live] onSnapshot note:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('[Player Live] Setup note:', e);
    }
  }, [joinedSession?.id, joinedSession?.currentQuestionIndex]);

  // Fallback Polling to keep game synchronized across all network conditions
  useEffect(() => {
    if (!joinedSession || joinedSession.status === 'FINISHED') return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/game/${joinedSession.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const updatedSession: GameSession = json.data;

          // Check if moved to new question
          if (updatedSession.currentQuestionIndex !== joinedSession.currentQuestionIndex) {
            setSelectedAnswer(null);
            setHasAnswered(false);
            setAnswerResult(null);
          }

          if (json.data.quiz && !quiz) {
            setQuiz(json.data.quiz);
          }

          setJoinedSession(updatedSession);
        } else if (!json.success && (res.status === 404 || res.status === 400)) {
          // Room closed by host
          setJoinedSession(prev => prev ? { ...prev, status: 'FINISHED', isExpired: true } : null);
        }
      } catch (e) {
        console.warn(e);
      }
    }, 1200);

    return () => clearInterval(pollingRef.current);
  }, [joinedSession?.id, joinedSession?.currentQuestionIndex, joinedSession?.status, quiz]);

  // Countdown timer when QUESTION_ACTIVE
  useEffect(() => {
    if (joinedSession?.status !== 'QUESTION_ACTIVE') return;

    const currentQ = 
      quiz?.questions?.[joinedSession.currentQuestionIndex] || 
      joinedSession.currentQuestion || 
      joinedSession.questions?.[joinedSession.currentQuestionIndex];

    const initialLimit = currentQ?.timeLimit || 20;
    setTimeLeft(initialLimit);

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [joinedSession?.status, joinedSession?.currentQuestionIndex, quiz]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !playerName.trim()) return;
    setJoinError(null);

    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
          name: playerName.trim(),
          playerName: playerName.trim(),
          avatar: selectedAvatar,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Mã PIN không chính xác hoặc phòng thi đã kết thúc');
      }

      setJoinedSession(json.data.session);
      setPlayerId(json.data.player.id);
      if (json.data.quiz) {
        setQuiz(json.data.quiz);
      }
    } catch (err: any) {
      setJoinError(err.message || 'Lỗi khi tham gia phòng thi');
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (hasAnswered || !joinedSession) return;
    setSelectedAnswer(optionIndex);
    setHasAnswered(true);

    const currentQ = 
      quiz?.questions?.[joinedSession.currentQuestionIndex] || 
      joinedSession.currentQuestion || 
      joinedSession.questions?.[joinedSession.currentQuestionIndex];

    const timeLimit = currentQ?.timeLimit || 20;
    const timeSpent = Math.max(1, timeLimit - timeLeft);

    try {
      const res = await fetch(`/api/game/${joinedSession.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          questionId: currentQ?.id || ('q_' + joinedSession.currentQuestionIndex),
          answer: optionIndex,
          timeTaken: timeSpent,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnswerResult(json.data);
        if (json.data.isCorrect) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Find my current player state
  const myPlayer = joinedSession?.players.find(p => p.id === playerId);

  // --- 1. LOBBY ENTRY SCREEN (ONLY ENTER PIN - NO ROOM SUGGESTIONS) ---
  if (!joinedSession) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in space-y-6">
        {/* Realtime Database Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Multiplayer Realtime Database: Cloud Firestore Sync</span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sẵn sàng kết nối
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Vào phòng thi đấu (Player)
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Tạo phòng thi đấu (Host)
          </button>
        </div>

        {/* TAB 1: JOIN GAME ROOM (ONLY PIN INPUT - NO SUGGESTED ROOMS) */}
        {activeTab === 'join' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mx-auto shadow-md mb-2">
                <Radio className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Vào Phòng Thi Trực Tiếp
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Nhập chính xác mã Game PIN 6 chữ số do Giảng viên hoặc người tạo phòng cung cấp để tham gia
              </p>
            </div>

            {joinError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã Game PIN (6 chữ số)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-widest font-mono text-3xl sm:text-4xl font-black py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên hiển thị của bạn
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Chọn hình đại diện
                </label>
                <div className="flex items-center justify-between gap-2">
                  {AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform cursor-pointer ${
                        selectedAvatar === av ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-300' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pin.length !== 6 || !playerName.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Vào Đấu Trường</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={onBack}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Quay lại Dashboard
            </button>
          </div>
        )}

        {/* TAB 2: CREATE GAME ROOM (HOST LIVE) */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {!currentUser ? (
              <div className="py-8 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Quyền Hạn Tạo Phòng Thi (Host)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Bạn đang ở chế độ <strong>Khách chưa đăng nhập</strong>. Khách chỉ có quyền tham gia vào phòng thi trực tiếp bằng mã Game PIN. Để mở phòng thi và làm Host cho lớp học, vui lòng đăng nhập bằng tài khoản Giảng viên hoặc Quản lý.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={() => setActiveTab('join')}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Quay lại nhập mã PIN
                  </button>
                  <button
                    onClick={() => {
                      if (onRequireLogin) onRequireLogin();
                      else onBack();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-102 cursor-pointer"
                  >
                    Đăng nhập Giảng viên
                  </button>
                </div>
              </div>
            ) : !['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(currentUser.role) ? (
              <div className="py-8 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Dành Cho Giảng Viên & Quản Lý
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Tài khoản Học viên chỉ có quyền tham gia vào các phòng thi trực tuyến do Giảng viên tổ chức. Quyền tạo phòng và làm Host thuộc về Giảng viên và Quản lý.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('join')}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Tham gia phòng thi bằng mã PIN
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-indigo-600" />
                      Tạo Phòng Thi Đấu Mới
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chọn đề Quiz từ kho dữ liệu để mở phòng thi đấu multiplayer realtime
                    </p>
                  </div>
                </div>

                {availableQuizzes.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Đang tải danh sách Quiz...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {availableQuizzes.map(quizItem => (
                      <div
                        key={quizItem.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                              {quizItem.category || 'Quiz'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {quizItem.questions?.length || 0} câu hỏi
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {quizItem.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {quizItem.description || 'Đề thi trắc nghiệm học tập'}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (onHostQuiz) {
                              onHostQuiz(quizItem.id);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Mở phòng thi</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Chế độ Host Giảng Viên:
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                    Sau khi mở phòng thi, hệ thống sẽ cấp mã PIN 6 số và tự động đồng bộ thời gian thực lên Cloud Firestore để các thí sinh vào cùng tranh tài. Khi Host kết thúc hoặc đóng phòng, mã PIN sẽ hết hiệu lực ngay lập tức.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- ROOM ENDED / EXPIRED NOTICE (If host ends or closes while player is inside) ---
  if (joinedSession.isExpired && joinedSession.status !== 'FINISHED') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Phòng Thi Đã Kết Thúc</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Giảng viên hoặc Host đã đóng phòng thi đấu này. Mã PIN <span className="font-mono font-bold text-rose-600">{joinedSession.pin}</span> hiện đã hết hiệu lực.
          </p>
          <div className="pt-4">
            <button
              onClick={() => {
                setJoinedSession(null);
                setPin('');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Quay lại màn hình chính
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. WAITING LOBBY SCREEN ---
  if (joinedSession.status === 'WAITING') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <img src={selectedAvatar} alt={playerName} className="w-full h-full rounded-3xl object-cover shadow-lg" />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 text-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{playerName}</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Đã tham gia phòng PIN: <span className="font-mono font-black">{joinedSession.pin}</span>
            </p>
            {joinedSession.quizTitle && (
              <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">
                Chủ đề: {joinedSession.quizTitle}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping mx-auto" />
            <p className="text-xs text-indigo-900 dark:text-indigo-200 font-bold">
              Đang chờ Giảng viên nhấn <strong>Bắt đầu trò chơi</strong>...
            </p>
            <p className="text-[11px] text-slate-400">
              Câu hỏi và các đáp án sẽ xuất hiện trực tiếp ngay trên màn hình của bạn!
            </p>
          </div>

          <button
            onClick={() => {
              setJoinedSession(null);
              setPin('');
            }}
            className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
          >
            Rời phòng
          </button>
        </div>
      </div>
    );
  }

  // --- 3. QUESTION ACTIVE: PLAYER SEES QUESTION & ANSWER OPTIONS DIRECTLY ---
  const kahootButtons = [
    { 
      color: 'bg-rose-600 hover:bg-rose-700 active:scale-98', 
      shape: '▲', 
      label: 'A',
      border: 'border-rose-500',
    },
    { 
      color: 'bg-blue-600 hover:bg-blue-700 active:scale-98', 
      shape: '◆', 
      label: 'B',
      border: 'border-blue-500',
    },
    { 
      color: 'bg-amber-500 hover:bg-amber-600 active:scale-98', 
      shape: '●', 
      label: 'C',
      border: 'border-amber-400',
    },
    { 
      color: 'bg-emerald-600 hover:bg-emerald-700 active:scale-98', 
      shape: '■', 
      label: 'D',
      border: 'border-emerald-500',
    },
  ];

  const currentQ: Question | undefined = 
    quiz?.questions?.[joinedSession.currentQuestionIndex] || 
    joinedSession.currentQuestion || 
    joinedSession.questions?.[joinedSession.currentQuestionIndex];

  const questionText = currentQ?.question || (currentQ as any)?.text || `Câu hỏi số ${joinedSession.currentQuestionIndex + 1}`;
  const questionOptions: string[] = currentQ?.options || ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
  const totalQuestions = joinedSession.totalQuestions || quiz?.questions?.length || joinedSession.questions?.length || 1;
  const questionImage = currentQ?.imageUrl || (currentQ as any)?.image;

  if (joinedSession.status === 'QUESTION_ACTIVE') {
    return (
      <div className="max-w-3xl mx-auto py-4 px-3 sm:px-4 space-y-4 sm:space-y-5 animate-in fade-in">
        {/* Top Info Bar: Player Stats & Timer */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={selectedAvatar} alt={playerName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs border border-indigo-200 dark:border-indigo-800" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">{playerName}</p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5">
                {myPlayer?.score || 0} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {myPlayer && myPlayer.streak > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50">
                <Flame className="w-4 h-4 fill-current" />
                <span>{myPlayer.streak}🔥</span>
              </div>
            )}

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black text-xs sm:text-sm shadow-xs ${
              timeLeft <= 5 
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-bounce' 
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Clock className="w-4 h-4 text-current" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Question Header Card: Question Text displayed directly for player */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
              Câu {joinedSession.currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Chủ đề: {joinedSession.quizTitle || 'Quiz'}
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
            {questionText}
          </h2>

          {questionImage && (
            <div className="rounded-2xl overflow-hidden max-h-56 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={questionImage} alt="Hình ảnh câu hỏi" className="w-full h-full object-contain mx-auto" />
            </div>
          )}
        </div>

        {/* Answer Options: Prominent Cards with shapes AND full option text */}
        {!hasAnswered ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {kahootButtons.map((btn, idx) => {
              const optionText = questionOptions[idx] !== undefined ? questionOptions[idx] : `Phương án ${btn.label}`;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`rounded-2xl sm:rounded-3xl ${btn.color} text-white p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 shadow-lg transition-all duration-150 cursor-pointer text-left group`}
                >
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black drop-shadow-xs">{btn.shape}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-wider opacity-85 mb-0.5">
                      PHƯƠNG ÁN {btn.label}
                    </span>
                    <span className="text-sm sm:text-base font-bold leading-snug line-clamp-3 break-words">
                      {optionText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in zoom-in-95">
            {/* Show which option user picked */}
            {selectedAnswer !== null && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 block mb-1">Phương án bạn đã chọn:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                  {kahootButtons[selectedAnswer]?.label}. {questionOptions[selectedAnswer]}
                </span>
              </div>
            )}

            {answerResult ? (
              answerResult.isCorrect ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">CHÍNH XÁC!</h3>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                    +{answerResult.points} điểm
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">CHƯA CHÍNH XÁC!</h3>
                  <p className="text-xs text-slate-400">Đừng nản lòng, hãy tập trung ở câu hỏi tiếp theo!</p>
                </div>
              )
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 animate-ping mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Đã gửi câu trả lời!</h3>
                <p className="text-xs text-slate-400">Đang chờ hết thời gian để công bố kết quả...</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">
                Chờ Giảng viên chuyển tiếp câu hỏi để tiếp tục thi đấu...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 4. LEADERBOARD OR FINISHED SCREEN ---
  const sorted = [...(joinedSession.players || [])].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex(p => p.id === playerId) + 1;
  const isFinal = joinedSession.status === 'FINISHED' || joinedSession.isExpired;

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6 text-center animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {isFinal ? 'Trận đấu đã kết thúc' : 'Bảng xếp hạng vòng này'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Hạng #{myRank || 1} / {joinedSession.players?.length || 1}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng điểm tích lũy: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{myPlayer?.score || 0}</strong> pts
          </p>
        </div>

        {myRank <= 3 && myRank > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-bold">
            🎉 Chúc mừng bạn đã lọt vào TOP 3 của trận đấu!
          </div>
        )}

        {isFinal && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            Phòng thi này đã kết thúc, mã PIN <span className="font-mono font-bold">{joinedSession.pin}</span> đã hết hiệu lực.
          </div>
        )}

        {!isFinal && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping mx-auto mb-2" />
            <span>Đang chờ Giảng viên mở câu hỏi tiếp theo...</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setJoinedSession(null);
              setPin('');
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Rời phòng thi đấu
          </button>
        </div>
      </div>
    </div>
  );
};
