import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Play, 
  Radio, 
  Copy, 
  Edit, 
  Trash2, 
  Layers, 
  Lock, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Quiz } from '../types';
import { useAuth } from '../context/AuthContext';
import { DifficultyBadge } from '../components/common/Badge';

interface QuizzesPageProps {
  onNavigate: (tab: string, extraId?: string) => void;
}

// 3 Default / Pre-installed quizzes available for guest preview
const DEFAULT_QUIZ_IDS = ['quiz-web-dev-01', 'quiz-science-ai-02', 'quiz-english-comm-03'];

export const QuizzesPage: React.FC<QuizzesPageProps> = ({ onNavigate }) => {
  const { currentUser, canAccess } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/quizzes');
      const json = await res.json();
      if (json.success && json.data) {
        setQuizzes(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDuplicate = async (quizId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser.uid,
          ownerName: currentUser.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteFeedback({ type: 'success', message: 'Đã nhân bản Quiz thành công.' });
        setTimeout(() => setDeleteFeedback(null), 3000);
        fetchQuizzes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    const targetId = quizToDelete.id;
    const targetTitle = quizToDelete.title;
    setIsDeleting(true);
    setDeleteFeedback(null);
    try {
      // Optimistic delete from UI state immediately
      setQuizzes(prev => prev.filter(q => q.id !== targetId));

      const res = await fetch(`/api/quizzes/${targetId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeleteFeedback({ type: 'success', message: `Đã xóa Quiz "${targetTitle}" thành công.` });
        setTimeout(() => setDeleteFeedback(null), 4000);
        fetchQuizzes();
      } else {
        setDeleteFeedback({ type: 'error', message: json.error?.message || 'Không thể xóa Quiz' });
        fetchQuizzes();
      }
    } catch (e: any) {
      console.error(e);
      setDeleteFeedback({ type: 'error', message: e.message || 'Lỗi kết nối khi xóa Quiz' });
      fetchQuizzes();
    } finally {
      setIsDeleting(false);
      setQuizToDelete(null);
    }
  };

  const categories = ['ALL', 'Công nghệ thông tin', 'Khoa học & Trí tuệ nhân tạo', 'Ngoại ngữ'];

  const isGuest = !currentUser;
  const canManage = canAccess(['TEACHER', 'ADMIN', 'SUPER_ADMIN']);

  const userVisibleQuizzes = isGuest
    ? quizzes.filter(q => DEFAULT_QUIZ_IDS.includes(q.id))
    : quizzes;

  const newQuizzesCount = quizzes.filter(q => !DEFAULT_QUIZ_IDS.includes(q.id)).length;

  const filteredQuizzes = userVisibleQuizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === 'ALL' || q.category === categoryFilter;
    const matchDiff = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      
      {/* Delete Feedback Toast/Banner */}
      {deleteFeedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all ${
          deleteFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {deleteFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{deleteFeedback.message}</span>
          </div>
          <button 
            onClick={() => setDeleteFeedback(null)} 
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Create Quiz Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Kho Quiz & Học Liệu
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">
            Học tập qua câu hỏi trắc nghiệm tương tác, flashcard và bài kiểm tra
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('create-quiz')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center gap-2 shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Tạo Quiz Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Guest Notice Banner */}
      {isGuest && (
        <div className="p-6 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Chế độ trải nghiệm dành cho Khách (Chưa đăng nhập)
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-0.5">
                Bạn đang trải nghiệm 3 bộ Quiz có sẵn của hệ thống. Đăng nhập tài khoản Học viên do nhà trường cấp để mở khóa {newQuizzesCount > 0 ? `${newQuizzesCount} bộ câu hỏi mới nhất` : 'toàn bộ kho học liệu'}!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shrink-0 shadow-md transition-all cursor-pointer hover:shadow-lg"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, từ khóa, tác giả..."
            className="w-full pl-12 pr-4 py-3 text-base rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả danh mục' : cat}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value)}
          className="px-4 py-2.5 text-sm sm:text-base font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
        >
          <option value="ALL">Độ khó: Tất cả</option>
          <option value="EASY">Cơ bản (Easy)</option>
          <option value="MEDIUM">Trung bình (Medium)</option>
          <option value="HARD">Nâng cao (Hard)</option>
        </select>
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-base">Đang tải danh sách Quiz...</div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bài Quiz nào</p>
          <p className="text-base text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc danh mục.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              {/* Cover & Tag */}
              <div>
                <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={quiz.coverImageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <DifficultyBadge difficulty={quiz.difficulty} />
                  </div>
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-bold font-mono">
                    {quiz.questions?.length || quiz.questionCount || 0} câu hỏi
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                    <span className="uppercase tracking-wider">{quiz.category}</span>
                    <span className="text-slate-400">{quiz.playCount || 0} lượt chơi</span>
                  </div>

                  <h3 className="font-bold text-xl text-slate-900 dark:text-white line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {quiz.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5 space-y-2.5">
                {/* Row 1: Primary Study Actions */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('study', quiz.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Làm Solo</span>
                  </button>

                  <button
                    onClick={() => onNavigate('flashcards', quiz.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Flashcard
                  </button>
                </div>

                {/* Row 2: Management Toolbar for Teacher / Admin */}
                {canManage && (
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100/70 dark:border-slate-800/60">
                    <button
                      onClick={() => onNavigate('host', quiz.id)}
                      title="Tổ chức thi đấu Live"
                      className="flex-1 py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Radio className="w-3.5 h-3.5 text-amber-600" />
                      <span>Host Live</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(quiz.id)}
                      title="Nhân bản Quiz"
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('edit-quiz', quiz.id)}
                      title="Chỉnh sửa Quiz"
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setQuizToDelete(quiz)}
                      title="Xóa Quiz"
                      className="w-8 h-8 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}

          {/* Locked Teaser Card for Guests */}
          {isGuest && newQuizzesCount > 0 && (
            <div className="bg-linear-to-b from-slate-50 to-emerald-50/40 dark:from-slate-900/60 dark:to-emerald-950/20 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[340px]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Dành riêng cho Học viên
                </span>
                <h4 className="font-extrabold text-xl text-slate-900 dark:text-white mt-2">
                  +{newQuizzesCount} Bộ Đề & Quiz Mới
                </h4>
                <p className="text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
                  Các bộ câu hỏi mới do Giảng viên cập nhật chỉ hiển thị cho Học viên đã đăng nhập tài khoản.
                </p>
              </div>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                Đăng nhập tài khoản Học viên
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (In-app, iframe safe) */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {quizToDelete.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chuyên mục: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quizToDelete.category}</span> • {quizToDelete.questions?.length || quizToDelete.questionCount || 0} câu hỏi
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setQuizToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
