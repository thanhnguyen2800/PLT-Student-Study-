import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Headphones, 
  Clock, 
  Mail, 
  User, 
  Tag, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClientFirestore } from '../../lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';

interface SupportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}

export const SupportContactModal: React.FC<SupportContactModalProps> = ({
  isOpen,
  onClose,
  initialSubject = '',
}) => {
  const { currentUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    ticketCode: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      if (initialSubject && !subject) {
        setSubject(initialSubject);
      }
      setErrorMessage(null);
      setSubmitSuccess(null);

      // Check client anti-spam cooldown
      const lastSubmit = localStorage.getItem('last_support_submit_ts');
      if (lastSubmit) {
        const diff = Math.floor((Date.now() - Number(lastSubmit)) / 1000);
        if (diff < 20) {
          setCooldownSeconds(20 - diff);
        }
      }
    }
  }, [isOpen, initialSubject]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (!isOpen) return null;

  // Validation rules (anti-spam & format)
  const cleanName = fullName.trim();
  const isNameValid = cleanName.length >= 2 && cleanName.length <= 50;

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test(cleanEmail) && cleanEmail.length <= 100;

  const cleanSubject = subject.trim();
  const isSubjectValid = cleanSubject.length >= 5 && cleanSubject.length <= 100;

  const cleanMessage = message.trim();
  const isMessageValid = cleanMessage.length >= 10 && cleanMessage.length <= 1000;

  const isFormValid = isNameValid && isEmailValid && isSubjectValid && isMessageValid && cooldownSeconds === 0;

  const quickSubjects = [
    'Góp ý tính năng mới',
    'Báo lỗi câu hỏi / bài thi',
    'Hỗ trợ tài khoản & bảo mật',
    'Phòng thi trực tuyến Live',
    'Hợp tác & Đào tạo',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, subject: true, message: true });

    if (!isFormValid || isSubmitting) return;

    // Check honeypot for bot traffic
    if (honeypot) {
      setSubmitSuccess({
        ticketCode: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'Cảm ơn bạn! Yêu cầu hỗ trợ đã được ghi nhận.',
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticketCode = messageId.replace('msg_', 'TK-').toUpperCase();

    const payload: Record<string, any> = {
      id: messageId,
      fullName: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    if (currentUser?.uid) payload.userId = currentUser.uid;
    if (currentUser?.role) payload.userRole = currentUser.role;

    try {
      // 1. Save directly to Firebase Firestore collection 'supportMessages'
      let savedToFirestore = false;
      const firestore = getClientFirestore();
      if (firestore) {
        try {
          const docRef = doc(firestore, 'supportMessages', messageId);
          await setDoc(docRef, payload, { merge: true });
          savedToFirestore = true;
        } catch (fbErr) {
          console.warn('[Firebase] Client Firestore write error:', fbErr);
        }
      }

      // 2. Also send to server proxy route for database synchronization & email alerts
      let savedToServer = false;
      try {
        const response = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (response.ok && json.success) {
            savedToServer = true;
          } else if (!savedToFirestore && !response.ok) {
            throw new Error(json.error?.message || 'Không thể gửi tin nhắn hỗ trợ lúc này.');
          }
        } else if (response.ok) {
          savedToServer = true;
        }
      } catch (apiErr: any) {
        console.warn('[API] Support route notification:', apiErr);
        if (!savedToFirestore) {
          throw new Error(
            apiErr.message?.includes('JSON')
              ? 'Máy chủ không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.'
              : (apiErr.message || 'Không thể kết nối đến máy chủ.')
          );
        }
      }

      // Verify that at least one storage layer succeeded
      if (!savedToFirestore && !savedToServer) {
        throw new Error('Đã có lỗi xảy ra khi lưu tin nhắn hỗ trợ. Vui lòng kiểm tra lại kết nối mạng.');
      }

      // Success
      localStorage.setItem('last_support_submit_ts', String(Date.now()));
      setCooldownSeconds(20);
      setSubmitSuccess({
        ticketCode: ticketCode,
        message: 'Yêu cầu của bạn đã được gửi thành công!',
      });
    } catch (err: any) {
      console.error('Error submitting support ticket:', err);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTouched({});
    setSubmitSuccess(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Top Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Liên hệ với chúng tôi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gửi bất kỳ câu hỏi hoặc góp ý nào cho đội ngũ phát triển
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitSuccess ? (
            /* Success State Confirmation */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Đã gửi yêu cầu hỗ trợ thành công!
                </h3>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <span>Mã phiếu:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{submitSuccess.ticketCode}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Gửi thêm câu hỏi khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Contact Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Anti-spam Bot Honeypot (hidden from real users) */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Row 1: Họ và tên & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Họ và tên</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {fullName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    maxLength={50}
                    onChange={e => setFullName(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                    placeholder="Nhập họ và tên..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-none transition-all ${
                      touched.fullName && !isNameValid
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {touched.fullName && !isNameValid && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      Họ và tên từ 2 đến 50 ký tự
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email liên hệ</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      RFC định dạng
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    maxLength={100}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    placeholder="example@domain.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-none transition-all ${
                      touched.email && !isEmailValid
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {touched.email && !isEmailValid && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      Email phải đúng định dạng (VD: ten@gmail.com)
                    </p>
                  )}
                </div>
              </div>

              {/* Chủ đề */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chủ đề</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {subject.length}/100 (tối thiểu 5)
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  maxLength={100}
                  onChange={e => setSubject(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                  placeholder="Ví dụ: Góp ý tính năng, Báo lỗi câu hỏi..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-none transition-all ${
                    touched.subject && !isSubjectValid
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                
                {/* Quick Subject Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 mr-1">Gợi ý nhanh:</span>
                  {quickSubjects.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSubject(s);
                        setTouched(prev => ({ ...prev, subject: true }));
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {touched.subject && !isSubjectValid && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Chủ đề phải có độ dài từ 5 đến 100 ký tự
                  </p>
                )}
              </div>

              {/* Nội dung tin nhắn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nội dung tin nhắn</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${message.length > 900 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                    {message.length}/1000 (tối thiểu 10)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  maxLength={1000}
                  onChange={e => setMessage(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                  placeholder="Mô tả chi tiết câu hỏi, thắc mắc hoặc góp ý của bạn để đội ngũ hỗ trợ giải quyết nhanh chóng..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-none transition-all resize-none ${
                    touched.message && !isMessageValid
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {touched.message && !isMessageValid && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Nội dung tin nhắn phải từ 10 đến 1000 ký tự để tránh spam
                  </p>
                )}
              </div>

              {/* Cooldown note if active */}
              {cooldownSeconds > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Vui lòng chờ {cooldownSeconds}s trước khi gửi yêu cầu tiếp theo</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đến hệ thống...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi tin nhắn</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
