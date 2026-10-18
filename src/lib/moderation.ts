export type ModerationGuideline = {
  id: string;
  code: string;
  category: string;
  title: string;
  summary: string;
  defaultReason: string;
  defaultLocation: string;
  defaultInstructions: string;
};

export type ModerationFeedback = {
  status: 'approved' | 'rejected' | 'pending';
  guidelineId: string;
  guidelineCode: string;
  guidelineTitle: string;
  reason: string;
  location: string;
  instructions: string;
  reviewerNote?: string;
  reviewerName?: string;
  reviewedAt: string;
};

export const MODERATION_GUIDELINES: ModerationGuideline[] = [
  {
    id: 'g-2-1',
    code: 'Tiêu chuẩn 2.1',
    category: 'Quyền truy cập & Liên kết',
    title: 'Quyền truy cập Google Drive / Tệp tải về bị khóa',
    summary: 'Liên kết tải học liệu hoặc thư mục Drive yêu cầu quyền truy cập từ tài khoản người xem.',
    defaultReason: 'Tệp Google Drive liên kết đang ở chế độ giới hạn ("Chỉ người được thêm mới có thể mở"), khiến các thầy cô khác trong cộng đồng không thể tải về bài giảng.',
    defaultLocation: 'Liên kết tải bài giảng trong mục "Đường dẫn tải học liệu / tệp đính kèm".',
    defaultInstructions: 'Thầy cô vui lòng: 1. Mở Google Drive cá nhân -> 2. Nhấp chuột phải vào file bài giảng -> 3. Chọn "Chia sẻ" -> 4. Tại mục "Quyền truy cập chung", đổi thành "Bất kỳ ai có đường liên kết" (Quyền Người xem) -> 5. Sao chép lại link mới và dán vào EduHub rồi gửi lại thẩm định.',
  },
  {
    id: 'g-5-1',
    code: 'Tiêu chuẩn 5.1',
    category: 'Kế hoạch bài dạy GDPT 2018',
    title: 'Thiếu Kế hoạch bài dạy (KHBD) theo Công văn 5512/BGDĐT',
    summary: 'Bài giảng điện tử chưa đính kèm giáo án khung hoặc hướng dẫn tổ chức hoạt động học sinh.',
    defaultReason: 'Bài giảng có hình ảnh trực quan tốt nhưng chưa kèm theo Kế hoạch bài dạy (KHBD 5512) hoặc Phiếu học tập để giáo viên đồng nghiệp có thể triển khai trọn vẹn 4 hoạt động trên lớp.',
    defaultLocation: 'Mục "Tệp đính kèm giáo án" và "Hướng dẫn sử dụng".',
    defaultInstructions: 'Thầy cô vui lòng bổ sung file Word hoặc PDF Kế hoạch bài dạy (theo khung Công văn 5512 gồm: Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng) tại phần Tệp đính kèm để học liệu đạt chuẩn xuất bản.',
  },
  {
    id: 'g-4-1',
    code: 'Tiêu chuẩn 4.1',
    category: 'Định dạng & Trình bày',
    title: 'Lỗi Font chữ tiếng Việt hoặc vỡ bố cục trình chiếu',
    summary: 'Slide bài giảng sử dụng font chữ đặc thù không hỗ trợ Unicode hoặc hiển thị sai dấu.',
    defaultReason: 'Khi mở trên máy chiếu hoặc máy tính khác, một số slide bị lỗi dấu tiếng Việt (mã VNI/TCVN3 thay vì Unicode chuẩn) hoặc chữ bị tràn ra ngoài khung chiếu hình.',
    defaultLocation: 'Các slide nội dung chính (Slide 3, 5, 8) và phần câu hỏi trắc nghiệm.',
    defaultInstructions: 'Thầy cô vui lòng chuyển đổi toàn bộ font chữ trên PowerPoint sang các font Unicode phổ biến (như Roboto, Arial, Montserrat, hoặc Times New Roman), kiểm tra tính tương thích và lưu lại định dạng .pptx trước khi nộp lại.',
  },
  {
    id: 'g-3-1',
    code: 'Tiêu chuẩn 3.1',
    category: 'Bản quyền & Trích dẫn',
    title: 'Chưa ghi rõ nguồn tư liệu / Bản quyền trích dẫn',
    summary: 'Hình ảnh, video hoặc đoạn phim tư liệu trong bài giảng chưa có thông tin nguồn gốc.',
    defaultReason: 'Học liệu có sử dụng các bức tranh lịch sử, video tư liệu khoa học hoặc sơ đồ kỹ thuật nhưng chưa ghi chú nguồn trích dẫn theo quy định bản quyền học liệu số.',
    defaultLocation: 'Slide tư liệu cuối bài và chân trang mô tả tài liệu.',
    defaultInstructions: 'Thầy cô vui lòng thêm chú thích ngắn dưới chân ảnh/video hoặc bổ sung slide "Tài liệu tham khảo & Nguồn tư liệu" ở cuối bài giảng để đảm bảo tính minh bạch học thuật.',
  },
  {
    id: 'g-1-1',
    code: 'Tiêu chuẩn 1.1',
    category: 'Nội dung GDPT 2018',
    title: 'Chưa đồng bộ mục tiêu cần đạt theo Khung chương trình GDPT 2018',
    summary: 'Mục tiêu kiến thức, năng lực và phẩm chất chưa khớp với chuẩn đầu ra môn học của Bộ GD&ĐT.',
    defaultReason: 'Phần mục tiêu bài học đang soạn theo cấu trúc chương trình cũ, chưa làm nổi bật các năng lực đặc thù và phẩm chất chủ yếu của học sinh theo chương trình GDPT 2018.',
    defaultLocation: 'Mục "Mục tiêu bài học" và câu hỏi đánh giá năng lực.',
    defaultInstructions: 'Thầy cô vui lòng cập nhật lại phần Mục tiêu bám sát chuẩn Yêu cầu cần đạt của Thông tư 32/2018/TT-BGDĐT đối với khối lớp và bộ môn tương ứng.',
  },
  {
    id: 'g-2-2',
    code: 'Tiêu chuẩn 2.2',
    category: 'Trải nghiệm số',
    title: 'Liên kết mô phỏng / website tương tác bị lỗi hoặc không phản hồi',
    summary: 'Đường dẫn dùng thử tương tác bị lỗi mạng, tải vô hạn hoặc yêu cầu đăng nhập tài khoản trả phí.',
    defaultReason: 'Liên kết ứng dụng tương tác hoặc website chạy thử trả về mã lỗi 404 hoặc yêu cầu tài khoản cá nhân có trả phí mới cho phép học sinh thao tác.',
    defaultLocation: 'Mục "Đường dẫn dùng thử trực tuyến (Platform URL)".',
    defaultInstructions: 'Thầy cô vui lòng kiểm tra lại liên kết web, đảm bảo học sinh và giáo viên có thể mở trực tiếp không cần đăng nhập tài khoản riêng, hoặc chuyển sang hình thức gửi mã nhúng HTML độc lập.',
  },
];

export function serializeModerationNote(feedback: ModerationFeedback): string {
  return JSON.stringify(feedback);
}

export function parseModerationNote(raw?: string | null): ModerationFeedback | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return {
        status: parsed.status || 'rejected',
        guidelineId: parsed.guidelineId || 'g-custom',
        guidelineCode: parsed.guidelineCode || 'Tiêu chuẩn thẩm định',
        guidelineTitle: parsed.guidelineTitle || 'Yêu cầu điều chỉnh từ Ban Thẩm định',
        reason: parsed.reason || 'Cần hoàn thiện nội dung theo nhận xét.',
        location: parsed.location || 'Toàn bộ bài giảng / học liệu',
        instructions: parsed.instructions || 'Thầy cô vui lòng xem lại nội dung và cập nhật lại bài.',
        reviewerNote: parsed.reviewerNote || undefined,
        reviewerName: parsed.reviewerName || 'Thẩm định viên EduHub',
        reviewedAt: parsed.reviewedAt || new Date().toISOString(),
      };
    }
  } catch {
    // Plain text note fallback
  }

  return {
    status: 'rejected',
    guidelineId: 'g-plain',
    guidelineCode: 'Lưu ý từ BQT',
    guidelineTitle: 'Nhận xét từ Ban Thẩm định EduHub',
    reason: trimmed,
    location: 'Học liệu đã gửi',
    instructions: 'Thầy cô vui lòng chỉnh sửa nội dung theo góp ý trên và bấm Gửi lại để được duyệt công khai.',
    reviewerName: 'Thẩm định viên EduHub',
    reviewedAt: new Date().toISOString(),
  };
}
