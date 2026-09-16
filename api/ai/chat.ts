import { GoogleGenAI } from '@google/genai';

const MODEL_NAMES = new Set([
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite',
]);

function getSystemInstruction(roleType: string): string {
  if (roleType === 'SOCRATIC_TUTOR') {
    return 'Bạn là Giáo viên Socratic. Thay vì đưa ngay câu trả lời cuối cùng, hãy đặt câu hỏi gợi mở từng bước để học sinh tự suy nghĩ và giải quyết vấn đề.';
  }
  if (roleType === 'QUIZ_MASTER') {
    return 'Bạn là Quiz Master. Nhiệm vụ của bạn là kiểm tra nhanh kiến thức của người học, tạo các câu hỏi trắc nghiệm thử thách với 4 đáp án và giải thích đáp án ngắn gọn, hấp dẫn.';
  }
  if (roleType === 'STEM_COACH') {
    return 'Bạn là Huấn luyện viên STEM và Lập trình. Hãy giải thích các nguyên lý thuật toán, cấu trúc mã nguồn, và kiến thức khoa học tự nhiên một cách chính xác, kèm ví dụ minh họa.';
  }
  return 'Bạn là Trợ lý Học tập Thông minh của nền tảng STUDENT STUDY. Bạn luôn hỗ trợ học sinh và giáo viên giải thích kiến thức sư phạm, logic bài giảng, và tạo câu hỏi tương tác.';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: 'Method Not Allowed' } });
  }

  try {
    const { messages = [], roleType = 'GENERAL', model, userId } = req.body || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Yêu cầu đăng nhập tài khoản để sử dụng Trợ giảng AI.' },
      });
    }

    const selectedModel = MODEL_NAMES.has(model) ? model : 'gemini-3.5-flash';
    const apiKey = process.env.GEMINI_API_KEY;
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        data: {
          reply: `[Chế độ Demo]: Tôi đã nhận câu hỏi "${String(lastUserMessage).slice(0, 120)}". Hãy cấu hình GEMINI_API_KEY trên Vercel để bật phản hồi Gemini đầy đủ.`,
          modelUsed: selectedModel,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents = messages.map((message: { role: string; content: string }) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: getSystemInstruction(roleType),
        temperature: 0.7,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        reply: response.text || 'Xin lỗi, tôi chưa thể tạo câu trả lời lúc này.',
        modelUsed: selectedModel,
      },
    });
  } catch (error: any) {
    console.error('[AI Chat] Gemini request failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'AI_CHAT_ERROR', message: error.message || 'Không thể kết nối Gemini.' },
    });
  }
}
