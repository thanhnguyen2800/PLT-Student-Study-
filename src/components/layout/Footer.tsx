import React, { useState } from 'react';
import { 
  Headphones, 
  AlertTriangle, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { PltLogo } from '../common/PltLogo';
import { SupportContactModal } from '../support/SupportContactModal';
import { DisclaimerModal } from '../support/DisclaimerModal';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [disclaimerTab, setDisclaimerTab] = useState<'DISCLAIMER' | 'TERMS' | 'PRIVACY'>('DISCLAIMER');

  const openDisclaimerWithTab = (tab: 'DISCLAIMER' | 'TERMS' | 'PRIVACY') => {
    setDisclaimerTab(tab);
    setIsDisclaimerOpen(true);
  };

  return (
    <>
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#07192d] text-slate-600 dark:text-slate-400">
        {/* ================================================================= */}
        {/* MAIN FOOTER CONTENT (LOGO, HỖ TRỢ, CẢNH BÁO)                      */}
        {/* ================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Col 1: Brand Info (6 cols on lg) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <PltLogo size="md" />
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  STUDENT STUDY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                Hệ thống học tập, ôn luyện kiến thức và thi trắc nghiệm trực tuyến thông minh với trợ lý AI. Được phát triển bởi PLT SOLUTIONS nhằm đem lại trải nghiệm giáo dục số hiện đại, trực quan và hiệu quả.
              </p>
              
              {/* Social Media icons */}
              <div className="flex items-center gap-2 pt-1 text-slate-400">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>

            {/* Col 2: Hỗ trợ (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Hỗ trợ
              </h3>
              <ul className="space-y-2.5 text-xs">
                {/* NÚT HỖ TRỢ - Mở form gửi tin nhắn */}
                <li>
                  <button
                    type="button"
                    onClick={() => setIsSupportOpen(true)}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer group"
                  >
                    <Headphones className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Liên hệ hỗ trợ</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDisclaimerWithTab('TERMS')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Điều khoản sử dụng
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openDisclaimerWithTab('PRIVACY')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Chính sách bảo mật
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Cảnh báo (Disclaimer) (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Cảnh báo (Disclaimer)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Website chỉ cung cấp thông tin tham khảo, tài liệu ôn thi và môi trường học tập trực quan. Mọi tài liệu cần được đối chiếu với chương trình đào tạo chính quy của cơ sở giáo dục.
              </p>
              
              {/* Nút xem chi tiết Cảnh báo */}
              <button
                type="button"
                onClick={() => openDisclaimerWithTab('DISCLAIMER')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer pt-1"
              >
                <span>Xem chi tiết cảnh báo</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM COPYRIGHT BAR                                              */}
        {/* ================================================================= */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 py-5 bg-white dark:bg-[#07192d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p className="text-center sm:text-left">
              © 2026 STUDENT STUDY by PLT SOLUTIONS. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Gửi phản hồi</span>
              </button>
            </div>
          </div>
        </div>

      </footer>

      {/* Support & Contact Modal Form */}
      <SupportContactModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Disclaimer / Terms / Privacy Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        defaultTab={disclaimerTab}
      />
    </>
  );
};
