import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flame, 
  Trophy, 
  ArrowLeft,
  Sparkles,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameSession, Player } from '../types';
import { useAuth } from '../context/AuthContext';

interface PlayerGameProps {
  initialPin?: string;
  onBack: () => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
];

export const PlayerGamePage: React.FC<PlayerGameProps> = ({ initialPin = '', onBack }) => {
  const { currentUser } = useAuth();
  const [pin, setPin] = useState(initialPin);
  const [playerName, setPlayerName] = useState(currentUser?.displayName || 'Player ' + Math.floor(Math.random() * 900 + 100));
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [joinedSession, setJoinedSession] = useState<GameSession | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const pollingRef = useRef<any>(null);

  // Polling to keep game synchronized
  useEffect(() => {
    if (!joinedSession) return;

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

          setJoinedSession(updatedSession);
        }
      } catch (e) {
        console.warn(e);
      }
    }, 1200);

    return () => clearInterval(pollingRef.current);
  }, [joinedSession?.id, joinedSession?.currentQuestionIndex]);

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
          avatar: selectedAvatar,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Mã PIN không chính xác hoặc phòng chưa sẵn sàng');
      }

      setJoinedSession(json.data.session);
      setPlayerId(json.data.player.id);
    } catch (err: any) {
      setJoinError(err.message || 'Lỗi khi tham gia phòng thi');
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (hasAnswered || !joinedSession) return;
    setSelectedAnswer(optionIndex);
    setHasAnswered(true);

    try {
      const res = await fetch(`/api/game/${joinedSession.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          questionId: 'q_' + joinedSession.currentQuestionIndex,
          answer: optionIndex,
          timeTaken: 5,
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

  // --- 1. JOIN SCREEN ---
  if (!joinedSession) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mx-auto shadow-md mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Vào Phòng Thi Trực Tiếp
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Nhập mã Game PIN từ màn hình của Giảng viên để thi đấu
            </p>
          </div>

          {joinError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-semibold">
              {joinError}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã Game PIN (6 chữ số)
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="VD: 849201"
                className="w-full text-center tracking-widest font-mono text-2xl font-black py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên hiển thị trong game
              </label>
              <input
                type="text"
                required
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Chọn hình đại diện
              </label>
              <div className="flex items-center justify-between gap-2">
                {AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform ${
                      selectedAvatar === av ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent opacity-60'
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
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>Vào Đấu Trường</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Quay lại Dashboard
          </button>
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
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping mx-auto" />
            <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
              Đang chờ Giảng viên nhấn <strong>Bắt đầu trò chơi</strong>...
            </p>
            <p className="text-[11px] text-slate-400">
              Hãy chú ý màn hình chiếu chung để theo dõi nội dung câu hỏi!
            </p>
          </div>

          <button
            onClick={() => setJoinedSession(null)}
            className="text-xs text-slate-400 hover:text-rose-600"
          >
            Rời phòng
          </button>
        </div>
      </div>
    );
  }

  // --- 3. QUESTION ACTIVE: LARGE TACTILE 4 BUTTONS ---
  const kahootButtons = [
    { color: 'bg-rose-600 hover:bg-rose-700 active:scale-95', shape: '▲', label: 'A' },
    { color: 'bg-blue-600 hover:bg-blue-700 active:scale-95', shape: '◆', label: 'B' },
    { color: 'bg-amber-500 hover:bg-amber-600 active:scale-95', shape: '●', label: 'C' },
    { color: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95', shape: '■', label: 'D' },
  ];

  if (joinedSession.status === 'QUESTION_ACTIVE') {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6 animate-in fade-in">
        {/* Player Stats Bar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src={selectedAvatar} alt={playerName} className="w-8 h-8 rounded-xl object-cover" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{playerName}</p>
              <p className="text-[10px] text-slate-400">Điểm: {myPlayer?.score || 0} pts</p>
            </div>
          </div>

          {myPlayer && myPlayer.streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Flame className="w-4 h-4 fill-current" />
              <span>Streak: {myPlayer.streak}🔥</span>
            </div>
          )}
        </div>

        {/* Tactile 4 Answer Buttons or Answer Status */}
        {!hasAnswered ? (
          <div className="grid grid-cols-2 gap-4 h-[420px]">
            {kahootButtons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`rounded-3xl ${btn.color} text-white flex flex-col items-center justify-center gap-2 shadow-xl transition-transform cursor-pointer select-none`}
              >
                <span className="text-5xl font-black drop-shadow-md">{btn.shape}</span>
                <span className="text-xs font-black tracking-widest opacity-80">PHƯƠNG ÁN {btn.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 animate-in zoom-in-95">
            {answerResult ? (
              answerResult.isCorrect ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">CHÍNH XÁC!</h3>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                    +{answerResult.points} điểm
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">CHƯA CHÍNH XÁC!</h3>
                  <p className="text-xs text-slate-400">Đừng nản lòng, cố gắng ở câu tiếp theo nhé!</p>
                </div>
              )
            ) : (
              <div className="space-y-3 py-6">
                <div className="w-8 h-8 rounded-full bg-indigo-600 animate-ping mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Đã gửi câu trả lời!</h3>
                <p className="text-xs text-slate-400">Đang chờ hết giờ và xem kết quả từ Giảng viên...</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- 4. LEADERBOARD / FINISHED SCREEN ---
  const sorted = [...joinedSession.players].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex(p => p.id === playerId) + 1;

  return (
    <div className="max-w-md mx-auto py-10 space-y-6 text-center animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {joinedSession.status === 'FINISHED' ? 'Kết quả chung cuộc' : 'Bảng xếp hạng vòng này'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Hạng #{myRank || 1} / {joinedSession.players.length}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Tổng điểm tích lũy: {myPlayer?.score || 0} pts</p>
        </div>

        {myRank <= 3 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-700 text-xs font-bold">
            🎉 Chúc mừng bạn đã lọt vào TOP 3 của trận đấu!
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setJoinedSession(null)}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
          >
            Rời phòng thi đấu
          </button>
        </div>
      </div>
    </div>
  );
};
