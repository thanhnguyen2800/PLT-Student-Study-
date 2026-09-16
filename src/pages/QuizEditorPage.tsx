import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Volume2, 
  Image as ImageIcon, 
  FileJson, 
  Download, 
  Upload, 
  HelpCircle,
  Clock,
  Award
} from 'lucide-react';
import { Quiz, Question, QuestionType, QuizDifficulty } from '../types';
import { useAuth } from '../context/AuthContext';
import { ImageGeneratorModal } from '../components/ai/ImageGeneratorModal';
import { speakText } from '../utils/tts';

interface QuizEditorProps {
  quizId?: string; // If provided, edit mode
  onBack: () => void;
  onSaved: (quiz: Quiz) => void;
}

export const QuizEditorPage: React.FC<QuizEditorProps> = ({ quizId, onBack, onSaved }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Công nghệ thông tin');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('MEDIUM');
  const [tags, setTags] = useState('TypeScript, Next.js, Web');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'SHARED'>('PUBLIC');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalTarget, setImageModalTarget] = useState<'cover' | 'question'>('cover');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetch(`/api/quizzes/${quizId}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const q: Quiz = json.data;
            setTitle(q.title);
            setDescription(q.description);
            setCategory(q.category);
            setDifficulty(q.difficulty);
            setTags(q.tags.join(', '));
            setCoverImageUrl(q.coverImageUrl || '');
            setVisibility(q.visibility);
            setQuestions(q.questions || []);
          }
        });
    } else {
      // Default empty question
      setQuestions([
        {
          id: 'q_' + Date.now(),
          quizId: '',
          type: 'MULTIPLE_CHOICE',
          question: 'Nhập câu hỏi của bạn tại đây...',
          options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
          correctAnswer: 0,
          explanation: 'Giải thích lý do lựa chọn này là chính xác.',
          points: 100,
          timeLimit: 20,
          order: 1,
        },
      ]);
    }
  }, [quizId]);

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: 'q_' + Date.now(),
      quizId: quizId || '',
      type: 'MULTIPLE_CHOICE',
      question: 'Câu hỏi mới...',
      options: ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3', 'Lựa chọn 4'],
      correctAnswer: 0,
      explanation: '',
      points: 100,
      timeLimit: 20,
      order: questions.length + 1,
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Bài Quiz cần có tối thiểu 1 câu hỏi.');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (activeQuestionIndex >= updated.length) {
      setActiveQuestionIndex(Math.max(0, updated.length - 1));
    }
  };

  const updateActiveQuestion = (field: keyof Question, value: any) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[activeQuestionIndex] = {
        ...copy[activeQuestionIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài Quiz');
      return;
    }

    setIsSaving(true);
    const payload = {
      title,
      description,
      category,
      difficulty,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      visibility,
      status: 'PUBLISHED',
      ownerId: currentUser?.uid || 'user-teacher-01',
      ownerName: currentUser?.displayName || 'ThS. Trần Văn Minh',
      creatorRole: currentUser?.role,
      questions,
    };

    try {
      const url = quizId ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = quizId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onSaved(json.data);
      } else {
        throw new Error(json.error?.message || 'Lỗi lưu bài Quiz');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu Quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const activeQ = questions[activeQuestionIndex] || questions[0];

  const canManage = currentUser && ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(currentUser.role);

  if (!canManage) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Quyền Hạn Tạo & Chỉnh Sửa Bộ Câu Hỏi
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Chỉ Quản trị viên, Quản lý và Giảng viên mới có quyền tạo và chỉnh sửa các bộ câu hỏi / đề thi Quiz cho học viên.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-transform active:scale-95"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJsonModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileJson className="w-4 h-4 text-amber-500" />
            Import / Export JSON
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : quizId ? 'Lưu cập nhật' : 'Xuất bản Quiz'}
          </button>
        </div>
      </div>

      {/* Main Form Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quiz Metadata */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Thông tin tổng quan bài Quiz
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề bài Quiz *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra trắc nghiệm Lập trình Next.js"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả nội dung, mục tiêu của bài Quiz..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Danh mục
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                <option value="Khoa học & Trí tuệ nhân tạo">Khoa học & AI</option>
                <option value="Ngoại ngữ">Ngoại ngữ</option>
                <option value="Kinh tế & Quản trị">Kinh tế & Quản trị</option>
                <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Độ khó
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="EASY">Cơ bản (Easy)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HARD">Nâng cao (Hard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thẻ từ khóa (Tags)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="VD: Next.js, React, TypeScript"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          {/* Cover Image & AI Generator Affordance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ảnh bìa bài Quiz
              </label>
              <button
                type="button"
                onClick={() => {
                  setImageModalTarget('cover');
                  setShowImageModal(true);
                }}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Sinh ảnh AI (1K/2K/4K)
              </button>
            </div>

            <input
              type="text"
              value={coverImageUrl}
              onChange={e => setCoverImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none mb-2"
            />

            {coverImageUrl && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Editor */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Question Tabs Slider */}
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-none">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeQuestionIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Câu {idx + 1}
              </button>
            ))}
            <button
              onClick={handleAddQuestion}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm câu
            </button>
          </div>

          {/* Active Question Editor Card */}
          {activeQ && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Chỉnh sửa Câu {activeQuestionIndex + 1}
                </span>

                <div className="flex items-center gap-2">
                  {/* TTS Speak Question Button */}
                  <button
                    type="button"
                    onClick={() => speakText(activeQ.question)}
                    title="Đọc câu hỏi bằng AI Voice (gemini-3.1-flash-tts-preview)"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1 text-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Đọc thử (TTS)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                    title="Xóa câu hỏi này"
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Type & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dạng câu hỏi
                  </label>
                  <select
                    value={activeQ.type}
                    onChange={e => {
                      const newType = e.target.value as QuestionType;
                      updateActiveQuestion('type', newType);
                      if (newType === 'TRUE_FALSE') {
                        updateActiveQuestion('options', ['Đúng', 'Sai']);
                        updateActiveQuestion('correctAnswer', 0);
                      } else if (newType === 'MULTIPLE_CHOICE' && activeQ.options.length < 4) {
                        updateActiveQuestion('options', ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm 4 lựa chọn</option>
                    <option value="TRUE_FALSE">Đúng / Sai</option>
                    <option value="MULTIPLE_SELECT">Chọn nhiều đáp án đúng</option>
                    <option value="IMAGE_QUESTION">Câu hỏi kèm hình ảnh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian trả lời
                  </label>
                  <select
                    value={activeQ.timeLimit}
                    onChange={e => updateActiveQuestion('timeLimit', parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="10">10 giây (Siêu nhanh)</option>
                    <option value="15">15 giây</option>
                    <option value="20">20 giây (Mặc định)</option>
                    <option value="30">30 giây</option>
                    <option value="60">60 giây (Giải thích sâu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm số
                  </label>
                  <input
                    type="number"
                    value={activeQ.points}
                    onChange={e => updateActiveQuestion('points', parseInt(e.target.value, 10) || 100)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  value={activeQ.question}
                  onChange={e => updateActiveQuestion('question', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                />
              </div>

              {/* Image Question Attachment */}
              {activeQ.type === 'IMAGE_QUESTION' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hình ảnh minh họa câu hỏi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageModalTarget('question');
                        setShowImageModal(true);
                      }}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Tạo ảnh AI (1K/2K/4K)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={activeQ.imageUrl || ''}
                    onChange={e => updateActiveQuestion('imageUrl', e.target.value)}
                    placeholder="URL hình ảnh hoặc tạo bằng AI..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                  />
                  {activeQ.imageUrl && (
                    <div className="h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                      <img src={activeQ.imageUrl} alt="Question media" className="w-full h-full object-contain bg-slate-900" />
                    </div>
                  )}
                </div>
              )}

              {/* Answer Options & Correct Indicator */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Các lựa chọn đáp án (Tích chọn đáp án đúng):
                </label>

                <div className="space-y-2">
                  {activeQ.options.map((opt, oIdx) => {
                    const isSelected = activeQ.type === 'MULTIPLE_SELECT'
                      ? Array.isArray(activeQ.correctAnswer) && (activeQ.correctAnswer as number[]).includes(oIdx)
                      : Number(activeQ.correctAnswer) === oIdx;

                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                        }`}
                      >
                        <input
                          type={activeQ.type === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                          name={`correct_${activeQ.id}`}
                          checked={isSelected}
                          onChange={() => {
                            if (activeQ.type === 'MULTIPLE_SELECT') {
                              const currentArr = Array.isArray(activeQ.correctAnswer) ? [...activeQ.correctAnswer] : [];
                              const nextArr = currentArr.includes(oIdx)
                                ? currentArr.filter(x => x !== oIdx)
                                : [...currentArr, oIdx];
                              updateActiveQuestion('correctAnswer', nextArr);
                            } else {
                              updateActiveQuestion('correctAnswer', oIdx);
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                        />

                        <span className="w-6 text-xs font-bold text-slate-400">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>

                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...activeQ.options];
                            newOpts[oIdx] = e.target.value;
                            updateActiveQuestion('options', newOpts);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giải thích đáp án chi tiết (Hiển thị cho học viên sau khi trả lời)
                </label>
                <textarea
                  value={activeQ.explanation}
                  onChange={e => updateActiveQuestion('explanation', e.target.value)}
                  rows={2}
                  placeholder="Giải thích tại sao đáp án này là đúng..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none resize-none"
                />
              </div>

            </div>
          )}

        </div>

      </div>

      {/* AI Image Generator Modal with 1K, 2K, 4K affordance */}
      <ImageGeneratorModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        initialPrompt={imageModalTarget === 'cover' ? title : activeQ?.question}
        onSelectImage={(url) => {
          if (imageModalTarget === 'cover') {
            setCoverImageUrl(url);
          } else {
            updateActiveQuestion('imageUrl', url);
          }
        }}
      />

      {/* JSON Import / Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Import / Export JSON Quiz</h3>
            <textarea
              value={jsonInput || JSON.stringify(questions, null, 2)}
              onChange={e => setJsonInput(e.target.value)}
              rows={10}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput);
                    if (Array.isArray(parsed)) {
                      setQuestions(parsed);
                      setShowJsonModal(false);
                      setJsonInput('');
                    } else {
                      alert('JSON phải là danh sách câu hỏi (Array)');
                    }
                  } catch (e) {
                    alert('Định dạng JSON không hợp lệ');
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
              >
                Nhập (Import JSON)
              </button>
              <button
                onClick={() => {
                  setShowJsonModal(false);
                  setJsonInput('');
                }}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
