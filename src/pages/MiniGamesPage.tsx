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
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakText } from '../utils/tts';

type GameType = 'RACING' | 'PENALTY' | 'MEMORY' | 'SURVIVAL' | 'BLITZ';

export const MiniGamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>('RACING');

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

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Gamepad2 className="w-7 h-7 text-indigo-600" />
          Mini Games Giáo Dục
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Vừa học vừa chơi, ghi nhớ kiến thức qua các trò chơi tương tác hấp dẫn
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {games.map(g => {
          const Icon = g.icon;
          const isActive = activeGame === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
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
        {activeGame === 'RACING' && <RacingTriviaGame />}
        {activeGame === 'PENALTY' && <PenaltyShootoutGame />}
        {activeGame === 'MEMORY' && <MemoryMatchGame />}
        {activeGame === 'SURVIVAL' && <SurvivalQuizGame />}
        {activeGame === 'BLITZ' && <BlitzSpeedGame />}
      </div>
    </div>
  );
};

// ==========================================
// 1. GAME: ĐUA XE TRI THỨC (Racing Trivia)
// ==========================================
const RACING_QUESTIONS = [
  { q: 'Thuật toán nào sắp xếp theo cơ chế chia để trị (Divide and Conquer)?', opts: ['Merge Sort', 'Bubble Sort', 'Insertion Sort', 'Selection Sort'], a: 0 },
  { q: 'Giao thức nào cung cấp kết nối mạng an toàn được mã hóa?', opts: ['HTTP', 'FTP', 'HTTPS', 'Telnet'], a: 2 },
  { q: 'Trong TypeScript, từ khóa nào định nghĩa một kiểu dữ liệu mới?', opts: ['type & interface', 'let & var', 'import & export', 'def & struct'], a: 0 },
  { q: 'Bộ nhớ Cache của CPU thường dùng loại RAM nào?', opts: ['SRAM', 'DRAM', 'VRAM', 'Flash RAM'], a: 0 },
  { q: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In First Out)?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], a: 1 },
];

function RacingTriviaGame() {
  const [qIdx, setQIdx] = useState(0);
  const [playerPos, setPlayerPos] = useState(10);
  const [aiPos, setAiPos] = useState(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

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
    if (isFinished) return;
    const curr = RACING_QUESTIONS[qIdx];
    if (choiceIdx === curr.a) {
      setFeedback('Chính xác! Tăng tốc +25% 🏎️💨');
      const nextPos = playerPos + 25;
      setPlayerPos(nextPos);
      if (nextPos >= 100) {
        setIsFinished(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      setFeedback('Sai rồi! Bị giảm tốc độ ⚠️');
      setPlayerPos(prev => Math.max(0, prev - 5));
    }

    if (qIdx + 1 < RACING_QUESTIONS.length) {
      setQIdx(prev => prev + 1);
    } else {
      setQIdx(0);
    }
  };

  const restart = () => {
    setPlayerPos(10);
    setAiPos(10);
    setQIdx(0);
    setFeedback(null);
    setIsFinished(false);
  };

  const curr = RACING_QUESTIONS[qIdx];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-500" />
          Đua Xe Tri Thức (Đích đến 100m)
        </h3>
        <button onClick={restart} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Race Track Canvas */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 border border-slate-800">
        {/* Player Lane */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>🏎️ Bạn (Player 1)</span>
            <span className="font-mono">{playerPos}%</span>
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
            <span className="font-mono">{aiPos}%</span>
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
      {!isFinished ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Câu hỏi tiếp sức:</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 font-medium text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs"
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
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
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
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
const PENALTY_QUESTIONS = [
  { q: 'Đơn vị đo lường thông tin cơ bản nhỏ nhất là gì?', opts: ['Byte', 'Bit', 'Kilobyte', 'Nibble'], a: 1 },
  { q: 'Ngôn ngữ nào chạy được tự nhiên trong trình duyệt web?', opts: ['JavaScript', 'Python', 'C++', 'Java'], a: 0 },
  { q: 'Số nhị phân 1010 tương ứng với số thập phân nào?', opts: ['8', '10', '12', '14'], a: 1 },
  { q: 'HTML là viết tắt của gì?', opts: ['HyperText Markup Language', 'HighText Machine Language', 'Hyper Tool Multi Language', 'Home Tech Modern Link'], a: 0 },
];

function PenaltyShootoutGame() {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [gkStatus, setGkStatus] = useState<'IDLE' | 'GOAL' | 'SAVED'>('IDLE');

  const handleShoot = (choiceIdx: number) => {
    const curr = PENALTY_QUESTIONS[qIdx];
    if (choiceIdx === curr.a) {
      setGkStatus('GOAL');
      setScore(s => s + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      setGkStatus('SAVED');
    }

    setTimeout(() => {
      setGkStatus('IDLE');
      setQIdx(prev => (prev + 1) % PENALTY_QUESTIONS.length);
    }, 1800);
  };

  const curr = PENALTY_QUESTIONS[qIdx];

  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Sút Phạt Thủ Môn (Penalty Shootout)
        </h3>
        <span className="font-bold text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
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

      {/* Question & 4 Target Buttons */}
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{curr.q}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {curr.opts.map((opt, i) => (
            <button
              key={i}
              disabled={gkStatus !== 'IDLE'}
              onClick={() => handleShoot(i)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 font-bold text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs"
            >
              ⚽ Sút góc: {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. GAME: LẬT THẺ TRÍ NHỚ (Memory Match)
// ==========================================
const MEMORY_PAIRS = [
  { id: '1', term: 'React', desc: 'UI Library' },
  { id: '2', term: 'TypeScript', desc: 'Type Safety' },
  { id: '3', term: 'Firestore', desc: 'NoSQL DB' },
  { id: '4', term: 'Docker', desc: 'Container' },
];

function MemoryMatchGame() {
  const [cards, setCards] = useState<{ uid: number; pairId: string; text: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);

  const initGame = () => {
    const list: any[] = [];
    let counter = 0;
    MEMORY_PAIRS.forEach(p => {
      list.push({ uid: counter++, pairId: p.id, text: p.term, isFlipped: false, isMatched: false });
      list.push({ uid: counter++, pairId: p.id, text: p.desc, isFlipped: false, isMatched: false });
    });
    setCards(list.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchesCount(0);
  };

  useEffect(() => {
    initGame();
  }, []);

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
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-blue-500" />
          Lật Thẻ Trí Nhớ (Ghép cặp Thuật ngữ - Định nghĩa)
        </h3>
        <button onClick={initGame} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
        {cards.map((c, i) => (
          <button
            key={c.uid}
            onClick={() => handleCardClick(i)}
            className={`h-24 rounded-2xl font-bold text-xs transition-all flex items-center justify-center p-2 shadow-xs ${
              c.isMatched
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500'
                : c.isFlipped
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {c.isFlipped || c.isMatched ? c.text : '❓'}
          </button>
        ))}
      </div>

      {matchesCount === MEMORY_PAIRS.length && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in zoom-in">
          🎉 Chúc mừng bạn đã hoàn thành ghép đúng toàn bộ các cặp thẻ!
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. GAME: SINH TỒN TRI THỨC (Survival Rush)
// ==========================================
const SURVIVAL_QUESTIONS = [
  { q: 'Trong mô hình OSI, tầng nào chịu trách nhiệm truyền dữ liệu vật lý?', opts: ['Physical Layer', 'Transport Layer', 'Network Layer', 'Session Layer'], a: 0 },
  { q: 'Cấu trúc giải thuật Dijkstra dùng để tìm gì?', opts: ['Đường đi ngắn nhất', 'Cây khung nhỏ nhất', 'Sắp xếp mảng', 'Mã hóa dữ liệu'], a: 0 },
  { q: 'Độ phức tạp thời gian trung bình của Quick Sort là gì?', opts: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(1)'], a: 0 },
  { q: 'Giao thức nào phân giải tên miền sang địa chỉ IP?', opts: ['DNS', 'DHCP', 'ARP', 'SNMP'], a: 0 },
  { q: 'Trong SQL, lệnh nào xóa toàn bộ bảng dữ liệu không thể rollback?', opts: ['DROP TABLE', 'DELETE', 'REMOVE', 'CLEAR'], a: 0 },
];

function SurvivalQuizGame() {
  const [lives, setLives] = useState(3);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDead, setIsDead] = useState(false);

  const handleAnswer = (choiceIdx: number) => {
    if (isDead) return;
    const curr = SURVIVAL_QUESTIONS[qIdx];
    if (choiceIdx === curr.a) {
      setScore(s => s + 100);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsDead(true);
      }
    }
    setQIdx(prev => (prev + 1) % SURVIVAL_QUESTIONS.length);
  };

  const restart = () => {
    setLives(3);
    setScore(0);
    setQIdx(0);
    setIsDead(false);
  };

  const curr = SURVIVAL_QUESTIONS[qIdx];

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
          Sinh Tồn Tri Thức (3 Mạng)
        </h3>
        <div className="flex items-center gap-1 text-rose-500">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-current' : 'opacity-20'}`} />
          ))}
        </div>
      </div>

      {!isDead ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono">Điểm sinh tồn: {score} pts</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-500 font-medium text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs"
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
            className="px-6 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md"
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
const BLITZ_QUESTIONS = [
  { q: 'React hook nào dùng để quản lý state?', opts: ['useState', 'useCSS', 'useDOM'], a: 0 },
  { q: 'TypeScript là superset của ngôn ngữ nào?', opts: ['JavaScript', 'Python', 'Go'], a: 0 },
  { q: 'Thẻ HTML nào hiển thị hình ảnh?', opts: ['<img>', '<pic>', '<image>'], a: 0 },
  { q: 'Cổng mặc định của dịch vụ web HTTP là?', opts: ['80', '443', '21'], a: 0 },
  { q: 'Bộ nhớ nào mất dữ liệu khi mất nguồn điện?', opts: ['RAM', 'SSD', 'ROM'], a: 0 },
];

function BlitzSpeedGame() {
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

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
    if (isGameOver) return;
    const curr = BLITZ_QUESTIONS[qIdx];
    if (choiceIdx === curr.a) {
      setScore(s => s + 50 * timeLeft); // Speed multiplier
      setTimeLeft(5);
      setQIdx(prev => (prev + 1) % BLITZ_QUESTIONS.length);
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

  const curr = BLITZ_QUESTIONS[qIdx];

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500 fill-current" />
          Chớp Nhoáng 5 Giây (Blitz Speed)
        </h3>
        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
          Điểm: {score} pts
        </span>
      </div>

      {!isGameOver ? (
        <div className="space-y-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft <= 2 ? 'bg-rose-500' : 'bg-purple-600'}`}
              style={{ width: `${(timeLeft / 5) * 100}%` }}
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono font-black text-rose-500">0{timeLeft}s</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{curr.q}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {curr.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-500 font-bold text-xs text-slate-800 dark:text-slate-100 transition-colors shadow-xs"
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
            className="px-6 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md"
          >
            Chơi lại lượt mới
          </button>
        </div>
      )}
    </div>
  );
}
