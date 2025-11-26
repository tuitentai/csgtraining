import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Gemini features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateTrainingOutline = async (topic: string, requirements: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Chưa cấu hình API Key.";

  try {
    const prompt = `
      Bạn là một trợ lý ảo chuyên nghiệp cho câu lạc bộ sinh viên Cóc Sài Gòn.
      Hãy soạn một khung giáo án đào tạo (outline) ngắn gọn, súc tích cho buổi training về chủ đề: "${topic}".
      Yêu cầu tối thiểu của buổi học: "${requirements}".
      
      Hãy trình bày dưới dạng Markdown, bao gồm các mục chính, mục phụ và phân bổ thời gian dự kiến (tổng thời gian 45 phút).
      Giọng văn thân thiện, năng động, phù hợp với sinh viên.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Không thể tạo nội dung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã xảy ra lỗi khi gọi AI. Vui lòng kiểm tra API Key.";
  }
};
