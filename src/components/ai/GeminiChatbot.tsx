import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  BrainCircuit, 
  Zap, 
  GraduationCap, 
  HelpCircle,
  Lock,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiChatbot: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onRequireLogin?: () => void;
}> = ({ isOpen, onClose, onRequireLogin }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ giảng AI của STUDENT STUDY. Bạn có thể hỏi tôi về bất kỳ bài học, câu hỏi quiz nào, hoặc yêu cầu giải thích chi tiết!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roleType, setRoleType] = useState<'GENERAL' | 'SOCRATIC_TUTOR' | 'QUIZ_MASTER' | 'STEM_COACH'>('GENERAL');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          roleType,
          model: selectedModel,
          userId: currentUser.uid,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            role: 'assistant',
            content: json.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: json.data.modelUsed,
          },
        ]);
      } else {
        throw new Error(json.error?.message || 'Không thể tạo phản hồi');
      }
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          role: 'assistant',
          content: `Lỗi: ${error.message || 'Không thể kết nối đến dịch vụ AI. Vui lòng thử lại.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ bạn câu hỏi tiếp theo!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div 
      className={`fixed z-50 transition-all duration-200 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${
        isExpanded 
          ? 'inset-4 md:inset-10' 
          : 'bottom-4 right-4 w-[95vw] md:w-[480px] h-[600px] max-h-[85vh]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">STUDENT STUDY AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Gemini
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Trợ giảng & Cố vấn học tập thông minh</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {currentUser && (
            <button
              onClick={clearChat}
              title="Làm mới hội thoại"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            title="Đóng cửa sổ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Yêu Cầu Đăng Nhập Hệ Thống
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
            Tính năng Trợ Giảng AI thông minh chỉ khả dụng cho tài khoản học viên và giảng viên đã đăng nhập hệ thống.
          </p>
          <button
            onClick={() => {
              if (onRequireLogin) {
                onRequireLogin();
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập ngay</span>
          </button>
        </div>
      ) : (
        <>
          {/* Role & Model Controls */}
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <select 
                value={roleType} 
                onChange={e => setRoleType(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-none font-medium text-xs cursor-pointer"
              >
                <option value="GENERAL">Trợ giảng toàn năng</option>
                <option value="SOCRATIC_TUTOR">Phương pháp Socratic (Gợi mở)</option>
                <option value="QUIZ_MASTER">Quiz Master (Hỏi đáp nhanh)</option>
                <option value="STEM_COACH">STEM & Lập trình</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto">
              {selectedModel === 'gemini-3.1-pro-preview' ? (
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
              ) : selectedModel === 'gemini-3.1-flash-lite' ? (
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              )}
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-none font-medium text-xs cursor-pointer"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (Chuẩn)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Suy luận sâu)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Phản hồi siêu tốc)</option>
              </select>
            </div>
          </div>

          {/* Message History Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                  {m.modelUsed && (
                    <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                      {m.modelUsed}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
                <span>AI đang soạn thảo câu trả lời...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto text-xs border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-none">
            <button
              type="button"
              onClick={() => setInput('Giải thích cho tôi về React Server Components và Client Components')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px]"
            >
              💡 RSC vs Client Components
            </button>
            <button
              type="button"
              onClick={() => setInput('Tạo giúp tôi 3 câu hỏi trắc nghiệm ôn tập về TypeScript')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px]"
            >
              📝 Tạo 3 câu hỏi Quiz
            </button>
            <button
              type="button"
              onClick={() => setInput('Quy tắc bảo mật Firebase Security Rules tốt nhất là gì?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px]"
            >
              🛡️ Firebase Security Rules
            </button>
          </div>

          {/* Input Field */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hỏi bất kỳ điều gì về bài học..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
