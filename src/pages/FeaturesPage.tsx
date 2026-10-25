import React, { useState } from 'react';
import { 
  BookOpen, 
  Radio, 
  Layers, 
  Bot, 
  Gamepad2, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  ArrowRight,
  Zap,
  GraduationCap
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (tab: string, extraId?: string) => void;
  openAIChat: () => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigate,
  openAIChat,
  onOpenLogin,
  isLoggedIn,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'STUDY' | 'COMPETE' | 'AI_SECURITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      id: 'quizzes',
      title: 'Kho Quiz Đa Ngành',
      subtitle: 'Ngân hàng đề thi trắc nghiệm',
      description: 'Hàng trăm bộ câu hỏi chuẩn đầu ra thuộc các ngành CNTT, Kinh tế, Ngoại ngữ và Khoa học. Mỗi câu hỏi đi kèm giải thích cặn kẽ, chế độ đếm ngược và kiểm tra lại đáp án sai.',
      icon: BookOpen,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
      category: 'STUDY',
      actionLabel: 'Xem kho đề thi',
      actionTab: 'quizzes',
      badge: 'Đề thi chuẩn',
    },
    {
      id: 'multiplayer',
      title: 'Đấu Trường Multiplayer',
      subtitle: 'Thi đấu trực tiếp thời gian thực',
      description: 'Phòng thi trực tuyến với mã PIN 6 số. Học viên thi đấu đối kháng, tính điểm phản xạ theo từng giây và vinh danh trên bảng vàng Leaderboard thời gian thực.',
      icon: Radio,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      category: 'COMPETE',
      actionLabel: 'Vào phòng thi đấu',
      actionTab: 'multiplayer',
      badge: 'Realtime Live',
    },
    {
      id: 'flashcards',
      title: 'Thẻ Ghi Nhớ Flashcards',
      subtitle: 'Ghi nhớ ngắt quãng (Spaced Repetition)',
      description: 'Lật thẻ 3D tương tác, hỗ trợ phát âm chuẩn từ vựng và thuật ngữ quốc tế. Tự động gom các thẻ chưa thuộc để ôn luyện sâu đến khi thuần thục.',
      icon: Layers,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      category: 'STUDY',
      actionLabel: 'Học qua Flashcards',
      actionTab: 'flashcards',
      extraId: 'quiz-web-dev-01',
      badge: '3D Flip Cards',
    },
    {
      id: 'ai-tutor',
      title: 'Trợ Giảng AI Gemini 24/7',
      subtitle: 'Trí tuệ nhân tạo hỗ trợ học thuật',
      description: 'Giải thích nguyên lý sâu xa vì sao đáp án đúng hay sai, phân tích lỗi tư duy của học viên và gợi ý lộ trình ôn tập cá nhân hóa bất kỳ lúc nào.',
      icon: Bot,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      category: 'AI_SECURITY',
      actionLabel: 'Hỏi Trợ giảng AI',
      customAction: openAIChat,
      badge: 'Gemini AI',
    },
    {
      id: 'minigames',
      title: 'Mini Games Vừa Chơi Vừa Học',
      subtitle: 'Trò chơi tri thức kích thích phản xạ',
      description: '5 trò chơi độc đáo: Đua xe tri thức, Sút luân lưu Penalty, Lật thẻ trí nhớ, Thử thách Sinh tồn và Đố vui Chớp nhoáng giúp học tập tràn ngập niềm vui.',
      icon: Gamepad2,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      category: 'COMPETE',
      actionLabel: 'Khám phá trò chơi',
      actionTab: 'minigames',
      badge: '5 Games Tương Tác',
    },
    {
      id: 'rbac',
      title: 'Bảo Mật Phân Quyền 100% RBAC',
      subtitle: 'Bảo mật tiêu chuẩn giáo dục',
      description: 'Không mở đăng ký công khai trái phép. Kiểm soát khép kín vai trò Học viên, Giảng viên và Ban Quản Trị, bảo vệ tuyệt đối bản quyền ngân hàng đề thi.',
      icon: ShieldCheck,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      category: 'AI_SECURITY',
      actionLabel: isLoggedIn ? 'Đến Bàn học' : 'Đăng nhập bảo mật',
      actionTab: isLoggedIn ? 'dashboard' : 'login',
      badge: 'An toàn dữ liệu',
    },
  ];

  const filteredFeatures = features.filter(item => {
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-10 animate-in fade-in pb-16">
      
      {/* Top Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold shadow-2xs border border-sky-200/60 dark:border-sky-800/60">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Hệ sinh thái giáo dục số toàn diện</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Tính năng <span className="bg-linear-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Đột phá</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Được thiết kế nhằm mang lại trải nghiệm ôn luyện trực quan, tương tác cao và giúp học viên nâng cao điểm số một cách hào hứng mỗi ngày.
        </p>

        {/* Filter and Search Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('STUDY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'STUDY'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ôn thi & Quiz
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('COMPETE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'COMPETE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Thi đấu & Game
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('AI_SECURITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'AI_SECURITY'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              AI & Bảo mật
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tính năng..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

        </div>
      </div>

      {/* Grid of Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredFeatures.map(feat => {
          const Icon = feat.icon;
          return (
            <div 
              key={feat.id}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${feat.iconBg}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {feat.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {feat.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              {/* Action Button with clear indicator of where it leads */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (feat.customAction) {
                      feat.customAction();
                    } else if (feat.actionTab) {
                      onNavigate(feat.actionTab, feat.extraId);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer group-hover:translate-x-1 transition-transform"
                >
                  <span>{feat.actionLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {feat.category === 'STUDY' ? 'Học vụ' : feat.category === 'COMPETE' ? 'Tương tác' : 'Hệ thống'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          Không tìm thấy tính năng nào khớp với từ khóa "{searchQuery}".
        </div>
      )}

      {/* Bottom CTA Card */}
      <div className="rounded-3xl p-8 bg-linear-to-r from-sky-600 via-sky-700 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="text-sm text-sky-100 max-w-xl">
            Tham gia luyện tập trắc nghiệm, thử thách thi đấu và trải nghiệm học tập cùng Trợ lý AI ngay hôm nay!
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('quizzes')}
            className="px-5 py-3 rounded-2xl bg-white text-sky-900 font-extrabold text-sm hover:bg-sky-50 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            Vào Kho Đề Thi
          </button>
          <button
            type="button"
            onClick={openAIChat}
            className="px-5 py-3 rounded-2xl bg-sky-500/30 hover:bg-sky-500/50 border border-white/20 text-white font-extrabold text-sm cursor-pointer transition-all"
          >
            Hỏi Trợ Lý AI
          </button>
        </div>
      </div>

    </div>
  );
};
