import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Radio, 
  Layers, 
  Bot, 
  Gamepad2, 
  ShieldCheck, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Play, 
  Clock, 
  Users, 
  Award, 
  Check, 
  LogIn,
  ChevronRight,
  HelpCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Quiz } from '../types';
import { PltLogo } from '../components/common/PltLogo';

interface GuestIntroPageProps {
  onNavigate: (tab: string, extraId?: string) => void;
  openAIChat: () => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
}

export const GuestIntroPage: React.FC<GuestIntroPageProps> = ({
  onNavigate,
  openAIChat,
  onOpenLogin,
  isLoggedIn,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pinCode, setPinCode] = useState('');
  
  // Interactive Sample Quiz Demo state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const sampleQuestion = {
    title: 'Câu hỏi thử nghiệm tương tác:',
    question: 'Trong mô hình Spaced Repetition (lặp lại ngắt quãng), việc ôn lại kiến thức ngay trước thời điểm sắp quên mang lại lợi ích gì lớn nhất?',
    options: [
      'A. Giúp chuyển kiến thức từ trí nhớ ngắn hạn sang trí nhớ dài hạn bền vững',
      'B. Giúp làm bài thi đạt điểm tuyệt đối mà không cần hiểu bản chất',
      'C. Tiết kiệm 100% thời gian không cần đọc sách giáo trình',
      'D. Thay thế hoàn toàn vai trò của giảng viên hướng dẫn',
    ],
    correctAnswer: 0,
    explanation: 'Chính xác! Lặp lại ngắt quãng (Spaced Repetition) kích hoạt quá trình củng cố liên kết nơ-ron thần kinh, giúp não bộ chuyển thông tin vào vùng ký ức dài hạn với hiệu suất ghi nhớ cao hơn 80% so với học nhồi nhét.'
  };

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setQuizzes(json.data.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.trim().length === 6) {
      onNavigate('multiplayer', pinCode.trim());
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 animate-in fade-in duration-500 pb-20">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION - Màu Xanh Biển Pastel (Pastel Sea Blue)  */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden rounded-3xl lg:rounded-4xl bg-linear-to-br from-[#c0eafc] via-[#8ed9fa] to-[#a2f0fc] dark:from-[#0c3152] dark:via-[#10436e] dark:to-[#0a2c4a] p-6 sm:p-10 lg:p-14 shadow-2xl shadow-sky-300/30 dark:shadow-sky-950/50 border border-sky-300/60 dark:border-sky-500/30 transition-all">
        
        {/* Subtle Ambient Light Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/45 dark:bg-sky-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-cyan-200/55 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 text-sky-900 dark:text-sky-200 text-sm font-extrabold shadow-sm border border-sky-200/70 dark:border-sky-800">
              <Sparkles className="w-4 h-4 text-sky-600 fill-sky-400" />
              <span>Phiên bản mới 2026</span>
            </div>

            {/* Main Headline - Massive, bold & striking */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#042845] dark:text-white leading-[1.15] tracking-tight">
              Học tập Thông minh, <br />
              <span className="text-[#0284c7] dark:text-[#38bdf8] drop-shadow-xs">Chinh phục Mục tiêu</span>
            </h1>

            {/* Description Paragraph - High legibility, large font */}
            <p className="text-lg sm:text-xl text-[#0b4369] dark:text-sky-100 leading-relaxed font-medium max-w-xl">
              Theo dõi tiến độ học tập, thi đấu trắc nghiệm trực tuyến thời gian thực và nhận lời hướng dẫn từ Trợ lý AI thông minh để đạt được thành tích mơ ước của bạn.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <a
                href="#tinh-nang"
                className="px-7 py-3.5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-base transition-all shadow-lg shadow-sky-600/30 hover:shadow-xl active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Khám phá Tính năng</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {isLoggedIn ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-7 py-3.5 rounded-full bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 font-bold text-base hover:bg-sky-50 dark:hover:bg-slate-800 transition-all shadow-md border border-sky-200/80 dark:border-sky-700 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Vào Bàn Học Của Bạn</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-7 py-3.5 rounded-full bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 font-bold text-base hover:bg-sky-50 dark:hover:bg-slate-800 transition-all shadow-md border border-sky-200/80 dark:border-sky-700 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập Ngay</span>
                </button>
              )}
            </div>

            {/* Quick PIN Room Input Box */}
            <div className="pt-2">
              <form onSubmit={handleJoinPin} className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/90 p-2 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-md backdrop-blur-md max-w-md">
                <Radio className="w-5 h-5 text-sky-600 dark:text-sky-400 ml-2 shrink-0 animate-pulse" />
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập mã PIN 6 số thi đấu..."
                  className="bg-transparent text-[#042845] dark:text-white placeholder-sky-700/60 dark:placeholder-sky-400/60 text-base font-mono font-bold px-2 py-1.5 outline-none flex-1"
                />
                <button
                  type="submit"
                  disabled={pinCode.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white font-bold text-sm transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  Vào Phòng
                </button>
              </form>
              <p className="text-xs text-[#0a4770] dark:text-sky-200 font-medium mt-1.5 ml-2">
                💡 Thí sinh có thể nhập mã PIN trực tiếp để tham gia phòng thi do Giảng viên làm Host.
              </p>
            </div>
          </div>

          {/* Right Column: Hero Visual Card + Floating AI Status */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 dark:border-slate-800 bg-slate-900 group">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80"
                alt="Sinh viên ôn luyện và học tập thông minh cùng Student Study"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" />
                <span>Nền tảng Giáo dục 4.0</span>
              </div>
            </div>

            {/* Floating Trợ Lý AI Widget */}
            <div 
              onClick={openAIChat}
              className="absolute -bottom-5 left-4 sm:left-8 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl shadow-xl border border-sky-100 dark:border-slate-800 flex items-center gap-3.5 cursor-pointer hover:scale-105 transition-all z-20 group"
              title="Bấm để mở cuộc trò chuyện với Trợ lý AI"
            >
              <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#042845] dark:text-white leading-tight">
                  Trợ lý AI
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                  </span>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    Đang trực tuyến
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SECTION: TÍNH NĂNG ĐỘT PHÁ */}
      {/* ========================================================= */}
      <section id="tinh-nang" className="space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tính năng <span className="text-sky-600 dark:text-sky-400">Đột phá</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Hệ sinh thái học tập và ôn tập thông minh được xây dựng đồng bộ, giúp nâng cao điểm số và hứng khởi học tập mỗi ngày.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: Kho Quiz */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Kho Quiz Đa Ngành
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Ngân hàng câu hỏi trắc nghiệm đa dạng chủ đề từ CNTT, Kinh tế, Ngoại ngữ đến Khoa học tự nhiên, hỗ trợ giải thích cặn kẽ từng đáp án.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => onNavigate('quizzes')}
                className="text-base font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem kho đề thi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Multiplayer Live */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Đấu Trường Multiplayer
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Trải nghiệm thi đấu thời gian thực kịch tính với mã PIN 6 số. Bảng xếp hạng cập nhật từng giây theo độ chính xác và tốc độ phản xạ.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => onNavigate('multiplayer')}
                className="text-base font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Vào phòng thi đấu</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Flashcards 3D */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Thẻ Ghi Nhớ Flashcards
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Áp dụng phương pháp ghi nhớ ngắt quãng (Spaced Repetition) kết hợp âm thanh đọc phát âm chuẩn và minh họa trực quan sinh động.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => onNavigate('flashcards', 'quiz-web-dev-01')}
                className="text-base font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Học qua Flashcards</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 4: AI Trợ Giảng */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Trợ Giảng AI Gemini 24/7
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Giải thích vì sao một đáp án đúng hoặc sai, hỗ trợ gỡ rối câu hỏi hóc búa và tự động thiết kế lộ trình ôn tập cá nhân hóa.
            </p>
            <div className="pt-2">
              <button 
                onClick={openAIChat}
                className="text-base font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Hỏi Trợ giảng AI</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 5: Mini Games */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Mini Games Vừa Chơi Vừa Học
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Vòng quay tri thức, lật thẻ nhớ từ vựng và cuộc đua đố vui giúp việc học kiến thức khô khan trở nên hào hứng và lôi cuốn.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => onNavigate('minigames')}
                className="text-base font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Khám phá trò chơi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 6: Bảo Mật RBAC Chuẩn Quốc Tế */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Bảo Mật Phân Quyền 100% RBAC
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Kiểm soát tài khoản khép kín, phân chia minh bạch vai trò Học viên, Giảng viên và Ban Quản Trị, bảo vệ 100% dữ liệu đề thi nội bộ.
            </p>
            <div className="pt-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tiêu chuẩn trường học & doanh nghiệp</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE QUIZ DEMO: Trải nghiệm thử ngay trên trang */}
      {/* ========================================================= */}
      <section className="bg-[#e4f3fd]/85 dark:bg-slate-900/80 p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-4xl border border-sky-200/80 dark:border-slate-800 space-y-8 shadow-sm">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Trải Nghiệm Trực Tiếp</span>
          </div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
            Thử thách trí não: Làm thử 1 câu trắc nghiệm
          </h3>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Chọn một đáp án dưới đây để xem cách hệ thống chấm điểm và giải thích tức thì:
          </p>
        </div>

        {/* Question Container */}
        <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {sampleQuestion.question}
          </p>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {sampleQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === sampleQuestion.correctAnswer;
              let btnClass = 'border-slate-200 dark:border-slate-800 hover:border-sky-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
              
              if (isAnswerSubmitted) {
                if (isCorrect) {
                  btnClass = 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 line-through';
                }
              } else if (isSelected) {
                btnClass = 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAnswer(idx);
                    setIsAnswerSubmitted(true);
                  }}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all text-base sm:text-lg cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-6 h-6 text-sky-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Explanation Feedback */}
          {isAnswerSubmitted && (
            <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-2 animate-in fade-in">
              <p className="text-base font-bold flex items-center gap-2">
                {selectedAnswer === sampleQuestion.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-sky-600" />
                    <span>Chúc mừng! Bạn đã chọn chính xác.</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <span>Chưa chính xác! Xem giải thích bên dưới:</span>
                  </>
                )}
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {sampleQuestion.explanation}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedAnswer(null);
                    setIsAnswerSubmitted(false);
                  }}
                  className="text-sm font-semibold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại câu này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECTION: KHO ĐỀ THI NỔI BẬT DÀNH CHO BẠN */}
      {/* ========================================================= */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Đề thi & Bộ câu hỏi <span className="text-sky-600 dark:text-sky-400">Nổi bật</span>
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Các bài Quiz được biên soạn chuẩn hóa theo khung chương trình giảng dạy.
            </p>
          </div>
          <button
            onClick={() => onNavigate('quizzes')}
            className="text-base font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Xem tất cả bài Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={quiz.coverImageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'}
                  alt={quiz.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-sky-800 dark:text-sky-300">
                  {quiz.category || 'Học tập'}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors line-clamp-2">
                    {quiz.title}
                  </h4>
                  <p className="text-base text-slate-600 dark:text-slate-400 line-clamp-2">
                    {quiz.description || 'Bài tập ôn tập trắc nghiệm kiến thức tổng hợp.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {quiz.questions?.length || 10} câu hỏi
                  </span>
                  <button
                    onClick={() => onNavigate('study', quiz.id)}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Luyện tập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CALL TO ACTION BANNER */}
      {/* ========================================================= */}
      <section className="rounded-3xl lg:rounded-4xl bg-linear-to-r from-[#032e4d] via-[#054b7a] to-[#043354] text-white p-8 sm:p-12 lg:p-16 border border-sky-300/30 text-center space-y-6 shadow-2xl shadow-sky-950/20">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-2xl mx-auto">
          Sẵn sàng bứt phá thành tích học tập của bạn?
        </h3>
        <p className="text-base sm:text-lg text-sky-100 max-w-xl mx-auto leading-relaxed">
          Đăng nhập ngay để lưu lại lịch sử ôn tập, tích lũy điểm thưởng và tham gia các phòng thi đấu trực tiếp cùng giảng viên và bạn bè.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-8 py-4 rounded-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#03253e] font-extrabold text-base transition-all shadow-lg shadow-sky-400/25 cursor-pointer"
            >
              Vào Bàn Làm Việc Học Viên
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#03253e] font-extrabold text-base transition-all shadow-lg shadow-sky-400/25 cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Đăng nhập Vào Hệ Thống</span>
            </button>
          )}
          <a
            href="#tinh-nang"
            className="px-8 py-4 rounded-full border border-sky-300/60 hover:bg-white/10 text-white font-bold text-base transition-all cursor-pointer"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </section>

    </div>
  );
};
