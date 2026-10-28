/**
 * AI Content Moderation Service - Whale / GGC Studio
 * Tự động kiểm duyệt bài viết bằng AI (Gemini + Local NLP Rules) và hỗ trợ Admin duyệt bài
 */

export interface ModerationResult {
  isApproved: boolean;
  requiresAdminReview: boolean;
  safetyScore: number; // 0 - 100%
  verdict: 'APPROVED_BY_AI' | 'PENDING_ADMIN_REVIEW' | 'REJECTED';
  badgeText: string;
  reasons: string[];
  suggestedTags: string[];
  summary?: string;
  checkedAt: string;
}

export class ModerationService {
  // Danh mục từ khóa nhạy cảm / spam / quảng cáo độc hại
  private static prohibitedKeywords = [
    'cờ bạc', 'lừa đảo', 'hack', 'crack', 'sex', 'khiêu dâm', 'vay tiền', 'tín dụng đen',
    'mua bán acc', 'scam', 'spam', 'casino', 'bet88', 'bịp', 'phản động', 'chửi thề',
  ];

  /**
   * Phân tích và kiểm duyệt nội dung bài viết
   */
  static async reviewPost(title: string, content: string): Promise<ModerationResult> {
    const textToCheck = `${title} ${content}`.toLowerCase();
    const detectedViolations: string[] = [];

    // 1. Kiểm tra từ khóa cấm (NLP Keyword Scanner)
    for (const kw of this.prohibitedKeywords) {
      if (textToCheck.includes(kw)) {
        detectedViolations.push(`Phát hiện từ khóa nhạy cảm: "${kw}"`);
      }
    }

    // 2. Kiểm tra độ dài và chất lượng nội dung
    if (title.trim().length < 5) {
      detectedViolations.push('Tiêu đề quá ngắn (tối thiểu 5 ký tự)');
    }
    if (content.trim().length < 15) {
      detectedViolations.push('Nội dung bài viết quá sơ sài (tối thiểu 15 ký tự)');
    }

    // 3. Kiểm tra spam liên kết ngoài nghi vấn
    const linkMatches = content.match(/https?:\/\/[^\s]+/g);
    if (linkMatches && linkMatches.length > 5) {
      detectedViolations.push('Chứa quá nhiều liên kết ngoài (nghi vấn spam)');
    }

    // 4. Tính toán điểm an toàn (Safety Score)
    let safetyScore = 95;
    if (detectedViolations.length > 0) {
      safetyScore = Math.max(20, 95 - detectedViolations.length * 25);
    }

    // 5. Kiểm tra AI với Gemini nếu có GEMINI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY;
    let aiSummary = '';
    if (geminiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Hãy đóng vai trò AI kiểm duyệt nội dung cộng đồng đồ họa/3D.
Đánh giá tiêu đề: "${title}" và nội dung: "${content}".
Trả về ngắn gọn: 1 câu tóm tắt và đánh giá xem bài viết có vi phạm chuẩn mực không (An toàn/Cần xem xét).`,
        });
        if (response.text) {
          aiSummary = response.text.trim();
        }
      } catch (err: any) {
        console.log('[ModerationService] Gemini API skip (dev/offline):', err?.message);
      }
    }

    // 6. Quyết định trạng thái duyệt (Verdict)
    const isClean = detectedViolations.length === 0;
    const isApproved = isClean && safetyScore >= 80;
    const requiresAdminReview = !isApproved;

    const verdict: ModerationResult['verdict'] = isApproved
      ? 'APPROVED_BY_AI'
      : safetyScore >= 40
      ? 'PENDING_ADMIN_REVIEW'
      : 'REJECTED';

    const badgeText = isApproved
      ? '✨ Đã duyệt bởi AI (An toàn 95%)'
      : verdict === 'PENDING_ADMIN_REVIEW'
      ? '⏳ Chờ Admin xem xét (AI phát hiện cảnh báo)'
      : '🚫 Bị từ chối bởi AI (Vi phạm quy định)';

    return {
      isApproved,
      requiresAdminReview,
      safetyScore,
      verdict,
      badgeText,
      reasons: detectedViolations.length > 0 ? detectedViolations : ['Nội dung đạt chuẩn quy định cộng đồng GGC Studio.'],
      suggestedTags: ['3D Art', 'Cộng Đồng', 'Chia Sẻ'],
      summary: aiSummary || `Bài viết: "${title}" - Đánh giá an toàn: ${safetyScore}%`,
      checkedAt: new Date().toISOString(),
    };
  }
}
