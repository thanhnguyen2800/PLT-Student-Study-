import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, X, Loader2, Check } from 'lucide-react';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  initialPrompt?: string;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          resolution, // 1K, 2K, 4K
          aspectRatio,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Không thể tạo hình ảnh');
      }

      setGeneratedImageUrl(json.data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo hình ảnh');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedImageUrl) {
      onSelectImage(generatedImageUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Tạo Hình Ảnh AI (gemini-3-pro-image-preview)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tạo ảnh bìa và minh họa câu hỏi chất lượng cao
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả hình ảnh (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Modern technology classroom, students collaborating with holographic displays, vibrant academic atmosphere..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Resolution Selector (1K, 2K, 4K) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Độ phân giải (Image Size)
              </label>
              <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(['1K', '2K', '4K'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      resolution === res
                        ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tỉ lệ khung hình
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="16:9">16:9 (Ảnh bìa ngang)</option>
                <option value="4:3">4:3 (Tiêu chuẩn)</option>
                <option value="1:1">1:1 (Ảnh vuông / Avatar)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo ảnh độ phân giải {resolution}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Tạo hình ảnh {resolution} với Gemini Pro
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
              {error}
            </p>
          )}

          {generatedImageUrl && (
            <div className="space-y-3 pt-2">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                <img
                  src={generatedImageUrl}
                  alt="AI Generated"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                  {resolution} • {aspectRatio}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Sử dụng hình ảnh này
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedImageUrl(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Tạo lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
