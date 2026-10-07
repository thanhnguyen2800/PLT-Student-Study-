import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Check, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'DISCLAIMER' | 'TERMS' | 'PRIVACY';
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'DISCLAIMER',
}) => {
  const [tab, setTab] = useState<'DISCLAIMER' | 'TERMS' | 'PRIVACY'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {tab === 'DISCLAIMER' && 'Cảnh báo & Miễn trừ trách nhiệm'}
                {tab === 'TERMS' && 'Điều khoản sử dụng dịch vụ'}
                {tab === 'PRIVACY' && 'Chính sách bảo mật thông tin'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quy định & cam kết chất lượng của nền tảng giáo dục STUDENT STUDY
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

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setTab('DISCLAIMER')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              tab === 'DISCLAIMER'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Cảnh báo (Disclaimer)
          </button>
          <button
            type="button"
            onClick={() => setTab('TERMS')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              tab === 'TERMS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Điều khoản sử dụng
          </button>
          <button
            type="button"
            onClick={() => setTab('PRIVACY')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              tab === 'PRIVACY'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Chính sách bảo mật
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {tab === 'DISCLAIMER' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-black text-sm block">Thông báo pháp lý quan trọng:</span>
                <p className="text-[11px] leading-relaxed">
                  Website chỉ cung cấp thông tin tham khảo, tài liệu ôn thi và môi trường học tập trực quan tương tác. Mọi nội dung và câu hỏi cần được đối chiếu với chương trình đào tạo chính quy của cơ sở giáo dục hoặc nhà trường.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  1. Mục đích học thuật & đào tạo
                </h4>
                <p>
                  STUDENT STUDY là nền tảng số hỗ trợ giảng viên và học viên rèn luyện kỹ năng, làm bài thi thử nghiệm và củng cố kiến thức khoa học, công nghệ. Chúng tôi không cấp văn bằng chứng chỉ pháp lý thay thế cho các tổ chức giáo dục chính quy.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  2. Trợ lý AI và giải thích tự động
                </h4>
                <p>
                  Các gợi ý và phản hồi từ Trợ lý Trí tuệ Nhân tạo (Gemini AI) được cung cấp với mục đích tham khảo mở rộng tư duy. Người học cần kiểm tra chéo kiến thức chuẩn với giáo trình môn học.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  3. Quyền sở hữu trí tuệ & Bản quyền
                </h4>
                <p>
                  Toàn bộ mã nguồn, cấu trúc giao diện và tài liệu độc quyền thuộc sở hữu của PLT SOLUTIONS. Nghiêm cấm mọi hành vi sao chép, thu thập dữ liệu trái phép hoặc kinh doanh lại khi chưa có văn bản chấp thuận.
                </p>
              </div>
            </div>
          )}

          {tab === 'TERMS' && (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  1. Chấp thuận điều khoản
                </h4>
                <p>
                  Bằng việc truy cập hoặc tạo tài khoản trên hệ thống STUDENT STUDY, người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản sử dụng hiện hành.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  2. Trách nhiệm của người sử dụng
                </h4>
                <p>
                  Học viên và Giảng viên có trách nhiệm bảo mật thông tin đăng nhập cá nhân, không chia sẻ mã PIN phòng thi công khai trái phép và không đăng tải các nội dung vi phạm pháp luật hoặc thuần phong mỹ tục.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  3. Quyền hạn của Quản trị viên
                </h4>
                <p>
                  Ban quản trị có quyền tạm khóa hoặc vô hiệu hóa các tài khoản có hành vi gian lận bài thi, tấn công từ chối dịch vụ (DDoS) hoặc spam dữ liệu vào hệ thống hỗ trợ.
                </p>
              </div>
            </div>
          )}

          {tab === 'PRIVACY' && (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Thu thập dữ liệu tối thiểu
                </h4>
                <p>
                  Chúng tôi chỉ lưu trữ các thông tin cần thiết phục vụ học tập như: Họ tên, Email, Vai trò học vụ, Lịch sử điểm số bài thi và Nội dung tin nhắn hỗ trợ do bạn gửi.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. Bảo mật dữ liệu đám mây
                </h4>
                <p>
                  Dữ liệu được lưu trữ an toàn trên cơ sở dữ liệu Firebase Firestore với các quy tắc bảo mật (Security Rules) đa tầng, mã hóa chuẩn TLS/SSL khi truyền tải.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  3. Cam kết không thương mại hóa dữ liệu
                </h4>
                <p>
                  PLT SOLUTIONS cam kết không bán, chia sẻ hoặc tiết lộ thông tin người học cho bất kỳ bên thứ ba nào vì mục đích quảng cáo thương mại.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer transition-transform active:scale-95"
          >
            Đã hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
