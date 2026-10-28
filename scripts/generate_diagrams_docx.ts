import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';

interface WorkflowStep {
  step: number;
  actor: string;
  action: string;
  systemProcessing: string;
  dataState: string;
}

interface WorkflowDef {
  number: number;
  title: string;
  purpose: string;
  actors: string;
  precondition: string;
  postcondition: string;
  steps: WorkflowStep[];
  flowText: string[];
  mermaidCode: string;
}

const workflows: WorkflowDef[] = [
  {
    number: 1,
    title: 'Luồng Xác thực & Phân quyền bảo mật 2 lớp (Authentication & 2-Tier Entitlement Guard)',
    purpose: 'Xác minh danh tính người dùng bằng JWT Token, kiểm tra vai trò RBAC (Admin/User) và kiểm tra quyền sở hữu nội dung trả phí qua bảng enrollments.',
    actors: 'Khách vãng lai, Học viên, Quản trị viên, Backend API Gateway, PostgreSQL Database.',
    precondition: 'Người dùng gửi HTTP Request tới hệ thống (kèm hoặc không kèm Authorization Header).',
    postcondition: 'Truy cập thành công tài nguyên hoặc bị chặn với mã lỗi tương ứng (401 Unauthorized, 403 Forbidden, 403 Payment Required).',
    steps: [
      {
        step: 1,
        actor: 'Client (Frontend)',
        action: 'Gửi request kèm Header: Authorization: Bearer <access_token>',
        systemProcessing: 'Middleware auth.middleware trích xuất và xác thực chữ ký JWT bằng secret key.',
        dataState: 'Nếu hết hạn: Chuyển sang luồng refresh token qua HttpOnly Cookie.',
      },
      {
        step: 2,
        actor: 'Auth Middleware',
        action: 'Giải mã Payload: { sub: userId, role, tier }',
        systemProcessing: 'Gắn đối tượng req.user vào request context để các middleware phía sau sử dụng.',
        dataState: 'Context: req.user được gán thông tin định danh.',
      },
      {
        step: 3,
        actor: 'RBAC Guard (Lớp 1)',
        action: 'Kiểm tra quyền truy cập route',
        systemProcessing: 'Nếu endpoint yêu cầu quyền quản trị: đối chiếu req.user.role === "ADMIN". Nếu không phải ADMIN -> Chặn 403 Forbidden.',
        dataState: 'Không thay đổi dữ liệu.',
      },
      {
        step: 4,
        actor: 'Entitlement Guard (Lớp 2)',
        action: 'Kiểm tra quyền xem bài học / tải tài nguyên',
        systemProcessing: 'Nếu bài học có isFreePreview = true -> Cho phép xem ngay cả khi chưa đăng nhập. Nếu bài trả phí -> Truy vấn bảng enrollments tìm bản ghi status = ACTIVE.',
        dataState: 'Tra cứu bảng enrollments trong PostgreSQL.',
      },
      {
        step: 5,
        actor: 'Backend Router',
        action: 'Điều phối xử lý nghiệp vụ',
        systemProcessing: 'Nếu có quyền sở hữu -> Tiếp tục gọi Controller trả về dữ liệu. Nếu chưa mua -> Chặn 403 PAYMENT_REQUIRED.',
        dataState: 'Phản hồi 200 OK hoặc 403 PAYMENT_REQUIRED.',
      },
    ],
    flowText: [
      '[Khách / Học viên gửi Request]',
      '       │',
      '       ▼',
      '〈Có Access Token?〉─── Không ───►〈Endpoint miễn phí / Preview?〉─── Có ──► [Cho phép truy cập]',
      '       │                                   │',
      '      Có                                Không',
      '       │                                   │',
      '       ▼                                   ▼',
      '[Xác minh chữ ký JWT]                [Chặn 401 / 403]',
      '       │',
      '       ▼',
      '〈Token hợp lệ?〉─── Hết hạn ──► [Làm mới qua Refresh Cookie]',
      '       │',
      '      Có',
      '       ▼',
      '〈Quyền Admin?〉─── Không là Admin ──► [Chặn 403 Forbidden]',
      '       │',
      '      Có',
      '       ▼',
      '〈Bài Free Preview?〉─── Có ──► [Phát video dùng thử]',
      '       │',
      '     Không (Trả phí)',
      '       │',
      '       ▼',
      '〈Có Enrollment ACTIVE trong CSDL?〉─── Có ──► [200 OK: Mở khóa nội dung]',
      '       │',
      '     Không',
      '       │',
      '       ▼',
      '[Chặn 403 PAYMENT_REQUIRED: Yêu cầu mở khóa]',
    ],
    mermaidCode: `flowchart TD
    A[Gửi Request] --> B{Có Token?}
    B -- Không --> C{Free Preview?}
    C -- Có --> D[Cho phép xem]
    C -- Không --> E[401 / 403 Error]
    B -- Có --> F[Verify JWT]
    F --> G{Quyền Admin?}
    G -- Không đạt --> H[403 Forbidden]
    G -- Đạt --> I{Bài học miễn phí?}
    I -- Có --> J[Cho phép xem]
    I -- Không --> K{Enrollment ACTIVE?}
    K -- Có --> L[200 OK Mở khóa]
    K -- Không --> M[403 PAYMENT_REQUIRED]`,
  },
  {
    number: 2,
    title: 'Luồng Xem trước bài học & Phát video bảo mật không lộ link Drive (Signed Stream Proxy HTTP Range 206)',
    purpose: 'Phát video bài học mượt mà qua chuẩn HTML5 Video Player nhưng tuyệt đối không để lộ URL Google Drive gốc trong Network tab.',
    actors: 'Học viên, HTML5 Video Player, Whale Backend, Stream Proxy Server, Google Drive Storage.',
    precondition: 'Bài học có cờ isFreePreview = true hoặc học viên đã có quyền sở hữu (Enrollment ACTIVE).',
    postcondition: 'Video phát mượt mà hỗ trợ tua (seek) qua giao thức HTTP Range 206 Partial Content.',
    steps: [
      {
        step: 1,
        actor: 'Học viên (UI Player)',
        action: 'Bấm chọn bài học trong giáo trình',
        systemProcessing: 'Frontend gọi API: GET /api/v1/courses/:courseId/lessons/:lessonId/stream.',
        dataState: 'Gửi kèm Bearer token (nếu đã đăng nhập).',
      },
      {
        step: 2,
        actor: 'Backend API',
        action: 'Kiểm tra phân quyền sở hữu',
        systemProcessing: 'Xác thực qua Entitlement Guard: Xác nhận bài học được phép truy cập.',
        dataState: 'Tra cứu bảng lessons và enrollments.',
      },
      {
        step: 3,
        actor: 'Backend API',
        action: 'Khởi tạo Signed Stream Token',
        systemProcessing: 'Ký số HMAC SHA-256 chứa: userId, lessonId, driveFileId, client IP, thời hạn 15 phút. Trả về streamUrl: /api/v1/learning/stream/proxy?token=...',
        dataState: 'Sinh token ký số ngắn hạn.',
      },
      {
        step: 4,
        actor: 'Video Player (Browser)',
        action: 'Nạp URL proxy vào thẻ <video src="...">',
        systemProcessing: 'Trình duyệt gửi request GET /learning/stream/proxy kèm header Range: bytes=0-1048576.',
        dataState: 'Client bắt đầu yêu cầu các chunk nhị phân.',
      },
      {
        step: 5,
        actor: 'Stream Proxy Server',
        action: 'Xử lý luồng nhị phân video',
        systemProcessing: 'Xác minh chữ ký token -> Đọc file video từ kho lưu trữ -> Trả về HTTP 206 Partial Content kèm header Content-Range.',
        dataState: 'Truyền dữ liệu nhị phân từng phần (Chunked Transfer).',
      },
    ],
    flowText: [
      '[Học viên chọn bài học]',
      '       │',
      '       ▼',
      '[Gọi GET /courses/:id/lessons/:lessonId/stream]',
      '       │',
      '       ▼',
      '〈Entitlement Guard: Hợp lệ?〉─── Không ──► [403 PAYMENT_REQUIRED]',
      '       │',
      '      Có',
      '       ▼',
      '[Backend sinh Signed Stream Token (TTL 15m, gán IP)]',
      '       │',
      '       ▼',
      '[Trả về URL: /learning/stream/proxy?token=...]',
      '       │',
      '       ▼',
      '[Trình duyệt gửi HTTP Range: bytes=0-1048576]',
      '       │',
      '       ▼',
      '[Proxy xác minh Token -> Đọc chunk video -> Trả về HTTP 206]',
      '       │',
      '       ▼',
      '[Video phát mượt mà, ẩn 100% link Google Drive]',
    ],
    mermaidCode: `sequenceDiagram
    Học viên->>Backend: 1. Yêu cầu luồng bài học
    Backend->>Entitlement: 2. Kiểm tra bản quyền
    Entitlement-->>Backend: 3. Hợp lệ
    Backend-->>Học viên: 4. Trả Signed Token & Proxy URL
    Học viên->>Proxy: 5. Gửi Range: bytes=0-
    Proxy->>GoogleDrive: 6. Đọc chunk nhị phân
    GoogleDrive-->>Proxy: 7. Binary chunk
    Proxy-->>Học viên: 8. Trả 206 Partial Content`,
  },
  {
    number: 3,
    title: 'Luồng Mua khóa học & Kích hoạt quyền sở hữu bằng Xu (Credits Purchase & Auto-Enrollment)',
    purpose: 'Học viên sử dụng số dư ví Xu nội bộ để mở khóa khóa học tức thì trong 1 Database Transaction nguyên tử (ACID).',
    actors: 'Học viên, Giỏ hàng / Checkout, Orders Service, Users Wallet, PostgreSQL Database.',
    precondition: 'Học viên đã đăng nhập và số dư ví Xu >= Giá khóa học sau chiết khấu.',
    postcondition: 'Ví xu bị trừ, đơn hàng chuyển sang COMPLETED, quyền enrollment ACTIVE được tạo, video được mở khóa ngay lập tức.',
    steps: [
      {
        step: 1,
        actor: 'Học viên',
        action: 'Bấm nút "Mở khóa ngay bằng Xu"',
        systemProcessing: 'Frontend gửi POST /api/v1/orders { items, paymentMethod: "CREDITS" }.',
        dataState: 'Khởi tạo payload đơn hàng.',
      },
      {
        step: 2,
        actor: 'Orders Service',
        action: 'Tính toán giá theo Hạng hội viên',
        systemProcessing: 'Hạng Free: 100% giá gốc | Hạng Gold: Giảm 10% | Hạng Supreme: Giảm 30%.',
        dataState: 'Tính ra finalCredits.',
      },
      {
        step: 3,
        actor: 'Database Transaction',
        action: 'Kiểm tra số dư và trừ tiền',
        systemProcessing: 'Kiểm tra user.credits >= finalCredits. Nếu thiếu -> Hủy bỏ (Rollback) và báo lỗi.',
        dataState: 'Khóa bản ghi User (Row Locking).',
      },
      {
        step: 4,
        actor: 'Database Transaction',
        action: 'Cập nhật trạng thái và tạo quyền',
        systemProcessing: 'Trừ user.credits -> Tạo đơn hàng status = COMPLETED -> Tạo bản ghi enrollments status = ACTIVE -> Commit.',
        dataState: 'Cập nhật bảng users, orders, order_items, enrollments.',
      },
      {
        step: 5,
        actor: 'Realtime Service',
        action: 'Thông báo hoàn tất',
        systemProcessing: 'Bắn thông báo Toast chúc mừng và kích hoạt video player trên giao diện học viên.',
        dataState: 'Giao diện đổi trạng thái sang "Đã mở khóa".',
      },
    ],
    flowText: [
      '[Học viên bấm Mở khóa bằng Xu]',
      '       │',
      '       ▼',
      '[Hệ thống tính chiết khấu theo Hạng hội viên: Free 0%, Gold -10%, VIP -30%]',
      '       │',
      '       ▼',
      '〈Số dư ví Xu đủ?〉─── Không ──► [Thông báo thiếu Xu & Gợi ý nạp VNPay]',
      '       │',
      '      Đủ',
      '       ▼',
      '[Bắt đầu Database Transaction]',
      '       │',
      '       ├─► 1. Trừ số dư Xu trong users.credits',
      '       ├─► 2. Tạo đơn hàng orders trạng thái COMPLETED',
      '       ├─► 3. Tạo bản ghi enrollments trạng thái ACTIVE',
      '       ▼',
      '[Commit Transaction thành công]',
      '       │',
      '       ▼',
      '[Bắn thông báo Toast & Đổi nút trên giao diện thành "Đã mở khóa"]',
    ],
    mermaidCode: `flowchart TD
    A[Bấm Mở khóa bằng Xu] --> B[Tính giá theo Hạng VIP]
    B --> C{Số dư Xu đủ?}
    C -- Không --> D[Báo thiếu Xu]
    C -- Đủ --> E[Bắt đầu Transaction]
    E --> F[Trừ Xu ví User]
    F --> G[Tạo Order COMPLETED]
    G --> H[Tạo Enrollment ACTIVE]
    H --> I[Commit Transaction]
    I --> J[Mở khóa video trên UI]`,
  },
  {
    number: 4,
    title: 'Luồng Nạp tiền mặt & Thanh toán qua VNPay với Xác minh Chữ ký số Webhook IPN',
    purpose: 'Xử lý thanh toán tiền đồng qua cổng VNPay có xác minh chữ ký HMAC-SHA512 chống giả mạo và chống xử lý trùng lặp giao dịch (Idempotent).',
    actors: 'Học viên, VNPay Payment Gateway, Ngân hàng / App VietQR, Whale Backend, IPN Webhook Handler.',
    precondition: 'Học viên chọn phương thức thanh toán VNPay.',
    postcondition: 'Đơn hàng được xác nhận hợp lệ, số dư tiền mặt hoặc khóa học được kích hoạt tự động.',
    steps: [
      {
        step: 1,
        actor: 'Học viên',
        action: 'Chọn thanh toán qua VNPay',
        systemProcessing: 'Frontend gọi POST /api/v1/payments/vnpay/create-url { orderId }.',
        dataState: 'Backend khởi tạo tham số thanh toán VNPay.',
      },
      {
        step: 2,
        actor: 'Backend Payment',
        action: 'Sinh chữ ký số HMAC-SHA512',
        systemProcessing: 'Sắp xếp tham số theo alphabet, băm HMAC-SHA512 với secret key VNP_HASH_SECRET, trả về URL VNPay.',
        dataState: 'Chuyển hướng học viên sang https://sandbox.vnpayment.vn/...',
      },
      {
        step: 3,
        actor: 'Học viên',
        action: 'Quét mã VietQR hoặc nhập thẻ ATM',
        systemProcessing: 'Cổng VNPay xác nhận trừ tiền từ tài khoản ngân hàng của học viên.',
        dataState: 'Giao dịch ngân hàng hoàn tất.',
      },
      {
        step: 4,
        actor: 'Cổng VNPay (Server)',
        action: 'Bắn Webhook IPN ngầm về Whale',
        systemProcessing: 'Gửi GET /api/v1/payments/vnpay/ipn kèm vnp_SecureHash và mã đơn hàng vnp_TxnRef.',
        dataState: 'Kênh giao tiếp Server-to-Server an toàn.',
      },
      {
        step: 5,
        actor: 'Whale IPN Handler',
        action: 'Kiểm tra bảo mật và đối soát',
        systemProcessing: '1. Tính lại hash đối chiếu -> 2. Kiểm tra đơn hàng có tồn tại và đúng số tiền? -> 3. Kiểm tra idempotency -> 4. Kích hoạt đơn hàng và tạo enrollment.',
        dataState: 'Cập nhật orders: COMPLETED, enrollments: ACTIVE.',
      },
      {
        step: 6,
        actor: 'Whale Backend',
        action: 'Phản hồi cổng VNPay',
        systemProcessing: 'Trả về JSON { RspCode: "00", Message: "Confirm Success" }.',
        dataState: 'Kết thúc quy trình đối soát.',
      },
    ],
    flowText: [
      '[Học viên chọn thanh toán VNPay]',
      '       │',
      '       ▼',
      '[Backend ký số HMAC-SHA512 & Trả về URL cổng VNPay]',
      '       │',
      '       ▼',
      '[Học viên quét mã VietQR / Chuyển khoản ngân hàng]',
      '       │',
      '       ▼',
      '[Cổng VNPay gọi Webhook IPN ngầm về Backend]',
      '       │',
      '       ▼',
      '〈Xác minh chữ ký số HMAC-SHA512 hợp lệ?〉─── Sai ──► [Phản hồi RspCode 97: Chữ ký không hợp lệ]',
      '       │',
      '      Đúng',
      '       ▼',
      '〈Đúng số tiền & Đơn chưa xử lý (Idempotent)?〉─── Sai ──► [Phản hồi RspCode 02/04]',
      '       │',
      '      Đúng',
      '       ▼',
      '[Cập nhật đơn hàng: COMPLETED & Kích hoạt enrollment: ACTIVE]',
      '       │',
      '       ▼',
      '[Phản hồi VNPay RspCode 00: Thành công]',
    ],
    mermaidCode: `sequenceDiagram
    Học viên->>Backend: 1. Tạo URL thanh toán VNPay
    Backend-->>Học viên: 2. URL kèm chữ ký HMAC-SHA512
    Học viên->>VNPay: 3. Quét mã QR thanh toán
    VNPay->>Backend: 4. Gửi IPN Webhook ngầm
    Backend->>Backend: 5. Xác minh chữ ký số & Idempotency
    Backend->>Backend: 6. Kích hoạt đơn hàng & Enrollment
    Backend-->>VNPay: 7. Phản hồi RspCode: "00"
    VNPay-->>Học viên: 8. Chuyển hướng về trang Cảm ơn`,
  },
  {
    number: 5,
    title: 'Luồng Cấp phát & Thu hồi quyền Google Drive tự động (Google Drive Reader Access Automation)',
    purpose: 'Tự động phân quyền xem (role: reader) trên Google Drive cho học viên khi mua khóa học và thu hồi ngay khi bị hủy/hoàn tiền.',
    actors: 'Học viên, Whale Backend, Google Drive Service Account, Google Drive API, Bảng drive_access_grants.',
    precondition: 'Học viên có Enrollment ACTIVE và đã cập nhật địa chỉ google_email trong hồ sơ.',
    postcondition: 'Quyền truy cập thư mục được ghi nhận trên Google Drive và lưu trữ permission_id trong database.',
    steps: [
      {
        step: 1,
        actor: 'Học viên',
        action: 'Bấm "Nhận quyền truy cập Google Drive"',
        systemProcessing: 'Frontend gọi POST /api/v1/learning/courses/:courseId/request-drive-access.',
        dataState: 'Gửi yêu cầu chia sẻ thư mục.',
      },
      {
        step: 2,
        actor: 'Backend Service',
        action: 'Kiểm tra điều kiện tiên quyết',
        systemProcessing: '1. Kiểm tra enrollment ACTIVE? -> 2. Kiểm tra user.googleEmail đã có chưa? Nếu chưa có email Google -> Yêu cầu học viên cập nhật.',
        dataState: 'Xác thực tài khoản Google của học viên.',
      },
      {
        step: 3,
        actor: 'Drive Adapter',
        action: 'Gọi Google Drive API (Service Account)',
        systemProcessing: 'Gửi yêu cầu permissions.create với role: "reader", type: "user", emailAddress: googleEmail, copyRequiresWriterPermission: true.',
        dataState: 'Tạo quyền trên máy chủ Google.',
      },
      {
        step: 4,
        actor: 'Backend Database',
        action: 'Lưu vết quyền hạn vào CSDL',
        systemProcessing: 'Lưu bản ghi vào bảng drive_access_grants chứa: userId, courseId, googleEmail, driveFileId, permissionId, status = GRANTED.',
        dataState: 'Ghi nhận quyền hạn để phục vụ thu hồi khi cần.',
      },
      {
        step: 5,
        actor: 'Drive Adapter (Khi hoàn tiền)',
        action: 'Tự động thu hồi quyền',
        systemProcessing: 'Khi có lệnh hoàn tiền -> Tra cứu permission_id -> Gọi Google Drive API: permissions.delete -> Đổi trạng thái sang REVOKED.',
        dataState: 'Học viên lập tức mất quyền truy cập thư mục Drive.',
      },
    ],
    flowText: [
      '[CẤP QUYỀN DRIVE]',
      'Học viên yêu cầu nhận Drive ──► Đã có google_email? ──► Gọi Google Drive API (role: reader)',
      '                                      │                                 │',
      '                                   Chưa có                              ▼',
      '                                      │                 [Lưu permission_id vào drive_access_grants]',
      '                                      ▼',
      '                             [Yêu cầu nhập email]',
      '',
      '[THU HỒI QUYỀN DRIVE]',
      'Admin hoàn tiền đơn hàng ──► Tra cứu permission_id ──► Gọi Google Drive API (permissions.delete)',
      '                                                               │',
      '                                                               ▼',
      '                                             [Đổi drive_access_grants -> REVOKED]',
      '                                                               │',
      '                                                               ▼',
      '                                             [Học viên mất quyền truy cập Drive]',
    ],
    mermaidCode: `flowchart TD
    subgraph Cấp quyền
    A[Học viên yêu cầu Drive] --> B{Có google_email?}
    B -- Chưa --> C[Yêu cầu nhập email Google]
    B -- Có --> D[Gọi Drive API: permissions.create]
    D --> E[Lưu permission_id vào CSDL]
    end
    subgraph Thu hồi quyền
    F[Sự kiện: Hoàn tiền] --> G[Lấy permission_id từ CSDL]
    G --> H[Gọi Drive API: permissions.delete]
    H --> I[Cập nhật CSDL: REVOKED]
    end`,
  },
  {
    number: 6,
    title: 'Luồng Điểm danh hàng ngày nhận thưởng & Tương tác Diễn đàn cộng đồng',
    purpose: 'Kích thích học viên duy trì thói quen học vẽ: Điểm danh nhận thưởng mỗi ngày và trao đổi thảo luận, giải đáp lỗi phần mềm đồ họa.',
    actors: 'Học viên, Checkin Controller, Forum Posts Service, Poll Votes, PostgreSQL Database.',
    precondition: 'Người dùng đã đăng nhập hệ thống.',
    postcondition: 'Số dư ví Xu/Points tăng lên; bài viết và bình luận được công khai trên diễn đàn cộng đồng.',
    steps: [
      {
        step: 1,
        actor: 'Học viên',
        action: 'Bấm nút "Điểm danh ngay"',
        systemProcessing: 'Frontend gọi POST /api/v1/users/checkin.',
        dataState: 'Gửi yêu cầu điểm danh trong ngày.',
      },
      {
        step: 2,
        actor: 'Backend Database',
        action: 'Kiểm tra ràng buộc UNIQUE trong ngày',
        systemProcessing: 'Đối chiếu bảng checkin_logs theo cặp (userId, checkinDate). Nếu đã điểm danh -> Báo lỗi chặn spam.',
        dataState: 'Ràng buộc duy nhất theo ngày YYYY-MM-DD.',
      },
      {
        step: 3,
        actor: 'Backend Database',
        action: 'Cộng điểm và Xu thưởng',
        systemProcessing: 'Ghi bản ghi vào checkin_logs -> Cộng +15 Points và +5 Xu vào bảng users.',
        dataState: 'Cập nhật users.points và users.credits.',
      },
      {
        step: 4,
        actor: 'Học viên',
        action: 'Đăng tranh hoặc bình luận diễn đàn',
        systemProcessing: 'Gọi POST /api/v1/posts hoặc /posts/:id/comments kèm ảnh minh họa và phương án bình chọn Poll.',
        dataState: 'Lưu dữ liệu vào bảng forum_posts, poll_options, forum_comments.',
      },
      {
        step: 5,
        actor: 'Học viên khác',
        action: 'Bỏ phiếu bình chọn (PK Poll)',
        systemProcessing: 'Gọi POST /api/v1/posts/:id/vote. CSDL kiểm tra UNIQUE(userId, postId) -> Cập nhật votesCount và tỷ lệ % biểu đồ.',
        dataState: 'Cập nhật poll_votes và poll_options.',
      },
    ],
    flowText: [
      '[ĐIỂM DANH HÀNG NGÀY]',
      'Bấm Điểm danh ──► Đã điểm danh hôm nay? ──► [Báo: Hôm nay đã nhận thưởng rồi]',
      '                        │',
      '                      Chưa',
      '                        ▼',
      '       [Ghi checkin_logs & Cộng +15 Points, +5 Xu]',
      '',
      '[TƯƠNG TÁC DIỄN ĐÀN]',
      'Đăng bài viết ──► Tải ảnh tranh vẽ & Tạo bình chọn Poll ──► Lưu forum_posts',
      '                                                                   │',
      '                                                                   ▼',
      '                              Học viên bỏ phiếu ──► Kiểm tra UNIQUE(user, post) ──► Cập nhật tỷ lệ %',
    ],
    mermaidCode: `flowchart TD
    A[Bấm Điểm danh] --> B{Đã điểm danh hôm nay?}
    B -- Đã điểm danh --> C[Thông báo đã nhận rồi]
    B -- Chưa --> D[Ghi checkin_logs]
    D --> E[Cộng +15 Points, +5 Xu]
    E --> F[Kích hoạt Toast chúc mừng]
    G[Đăng bài diễn đàn] --> H[Đính kèm ảnh & Tạo Poll]
    H --> I[Lưu vào forum_posts]
    I --> J[Học viên khác bình chọn Poll]
    J --> K[Cập nhật % thanh tiến độ PK]`,
  },
  {
    number: 7,
    title: 'Luồng Quản trị viên xử lý Đơn hàng, Hoàn tiền & Thu hồi quyền tự động',
    purpose: 'Quy trình xử lý hoàn tiền an toàn: Thu hồi Enrollment ngay lập tức và tự động xóa quyền Google Drive, ghi nhật ký kiểm toán Audit Log.',
    actors: 'Quản trị viên (Admin), Admin Dashboard, Orders Service, Google Drive API, Audit Logs.',
    precondition: 'Quản trị viên có role = ADMIN và đơn hàng ở trạng thái COMPLETED.',
    postcondition: 'Đơn hàng đổi thành REFUNDED, quyền học tập bị thu hồi, học viên mất quyền xem video và tải file Drive.',
    steps: [
      {
        step: 1,
        actor: 'Quản trị viên',
        action: 'Chọn đơn hàng và bấm "Hoàn tiền (Refund)"',
        systemProcessing: 'Frontend gọi POST /api/v1/admin/orders/:orderId/refund { reason } kèm Admin token.',
        dataState: 'Khởi tạo quy trình hoàn tiền.',
      },
      {
        step: 2,
        actor: 'Admin Controller',
        action: 'Xác thực quyền quản trị',
        systemProcessing: 'Kiểm tra req.user.role === "ADMIN". Kiểm tra đơn hàng có tồn tại và đang COMPLETED?',
        dataState: 'Xác nhận tính hợp lệ.',
      },
      {
        step: 3,
        actor: 'Database Transaction',
        action: 'Cập nhật trạng thái trong CSDL',
        systemProcessing: '1. Đổi orders.status = "REFUNDED" -> 2. Đổi enrollments.status = "REVOKED", revokedAt = now() -> 3. Tra cứu quyền Google Drive liên quan.',
        dataState: 'Cập nhật bảng orders và enrollments.',
      },
      {
        step: 4,
        actor: 'Drive Adapter',
        action: 'Gọi Google Drive API xóa quyền',
        systemProcessing: 'Gọi permissions.delete với permissionId của học viên. Cập nhật drive_access_grants.status = "REVOKED".',
        dataState: 'Thu hồi quyền trên Google Drive.',
      },
      {
        step: 5,
        actor: 'Audit Service',
        action: 'Ghi nhật ký kiểm toán hệ thống',
        systemProcessing: 'Lưu bản ghi vào audit_logs: adminId, action = "REFUND_ORDER", targetId = orderId, lý do hoàn tiền, IP.',
        dataState: 'Bảo toàn lịch sử kiểm toán kế toán.',
      },
      {
        step: 6,
        actor: 'Học viên',
        action: 'Cố gắng truy cập lại bài học sau khi hoàn tiền',
        systemProcessing: 'Entitlement Guard phát hiện enrollment.status === "REVOKED" -> Lập tức chặn 403 PAYMENT_REQUIRED.',
        dataState: 'Không thể truy cập nội dung.',
      },
    ],
    flowText: [
      '[Admin chọn Đơn hàng cần Hoàn tiền]',
      '       │',
      '       ▼',
      '[Bắt đầu Database Transaction]',
      '       │',
      '       ├─► 1. Cập nhật orders sang trạng thái REFUNDED',
      '       ├─► 2. Cập nhật enrollments sang trạng thái REVOKED',
      '       ├─► 3. Tìm permission_id trong drive_access_grants',
      '       ▼',
      '[Gọi Google Drive API: Xóa quyền Reader của học viên]',
      '       │',
      '       ▼',
      '[Ghi nhật ký kiểm toán vào bảng audit_logs]',
      '       │',
      '       ▼',
      '[Học viên cố truy cập lại ──► Bị chặn 403 PAYMENT_REQUIRED]',
    ],
    mermaidCode: `sequenceDiagram
    Admin->>Backend: 1. POST /admin/orders/:id/refund
    Backend->>Database: 2. orders -> REFUNDED
    Backend->>Database: 3. enrollments -> REVOKED
    Backend->>DriveAPI: 4. permissions.delete (Xóa quyền)
    DriveAPI-->>Backend: 5. Xác nhận thu hồi
    Backend->>Database: 6. Ghi nhật ký audit_logs
    Backend-->>Admin: 7. Hoàn tiền thành công
    Học viên->>Backend: 8. Cố truy cập lại bài học
    Backend-->>Học viên: 9. Chặn 403 PAYMENT_REQUIRED`,
  },
];

const borderStyle = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const cellBorders = {
  top: borderStyle,
  bottom: borderStyle,
  left: borderStyle,
  right: borderStyle,
};

const cellMargins = {
  top: 100,
  bottom: 100,
  left: 140,
  right: 140,
};

function createWorkflowDoc(): Document {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU BIỂU ĐỒ HOẠT ĐỘNG CÁC LUỒNG CHÍNH (ACTIVITY DIAGRAMS)',
          bold: true,
          size: 32, // 16pt
          font: 'Times New Roman',
          color: '1F497D',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'Dự án: Nền tảng chia sẻ Khóa học & Tài nguyên Đồ họa Nghệ thuật (Whale / GGC Studio)\nĐặc tả chi tiết 7 luồng quy trình nghiệp vụ cốt lõi theo chuẩn UML Activity & Sequence Specification',
          italics: true,
          size: 22,
          font: 'Times New Roman',
          color: '595959',
        }),
      ],
    })
  );

  for (const wf of workflows) {
    // Heading 1
    children.push(
      new Paragraph({
        spacing: { before: 350, after: 120 },
        children: [
          new TextRun({
            text: `${wf.number}. ${wf.title}`,
            bold: true,
            size: 26,
            font: 'Times New Roman',
            color: '004B87',
          }),
        ],
      })
    );

    // Bảng thông số nghiệp vụ tổng quan
    const summaryRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'ED7D31', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Mục', bold: true, size: 21, font: 'Times New Roman', color: '000000' })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'ED7D31', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Nội dung chi tiết', bold: true, size: 21, font: 'Times New Roman', color: '000000' })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Mục đích', bold: true, size: 21, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: wf.purpose, size: 21, font: 'Times New Roman' })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Tác nhân (Actors)', bold: true, size: 21, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: wf.actors, size: 21, font: 'Times New Roman', color: '1F497D' })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Điều kiện tiên quyết', bold: true, size: 21, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: wf.precondition, size: 21, font: 'Times New Roman' })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Kết quả thành công', bold: true, size: 21, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: wf.postcondition, size: 21, font: 'Times New Roman', color: '385723' })] })],
          }),
        ],
      }),
    ];

    children.push(
      new Table({
        rows: summaryRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Tiêu đề: Các bước hoạt động chi tiết
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: 'Bảng các bước hoạt động chi tiết (Activity Flow Steps)',
            bold: true,
            size: 22,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      })
    );

    // Bảng phân bước
    const stepRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bước', bold: true, size: 20, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Tác nhân', bold: true, size: 20, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Hành động', bold: true, size: 20, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 27, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Hệ thống xử lý', bold: true, size: 20, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Trạng thái dữ liệu', bold: true, size: 20, font: 'Times New Roman' })] })],
          }),
        ],
      }),
    ];

    for (const s of wf.steps) {
      stepRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.step), size: 20, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              children: [new Paragraph({ children: [new TextRun({ text: s.actor, bold: true, color: '1F497D', size: 20, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              children: [new Paragraph({ children: [new TextRun({ text: s.action, size: 20, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 27, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              children: [new Paragraph({ children: [new TextRun({ text: s.systemProcessing, size: 20, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              children: [new Paragraph({ children: [new TextRun({ text: s.dataState, size: 20, font: 'Times New Roman', color: '595959' })] })],
            }),
          ],
        })
      );
    }

    children.push(
      new Table({
        rows: stepRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Sơ đồ trực quan dạng Text Flowchart
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: 'Sơ đồ luồng hoạt động trực quan (Visual Flowchart)',
            bold: true,
            size: 22,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      })
    );

    const flowParagraphs = wf.flowText.map(
      (line) =>
        new Paragraph({
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({
              text: line,
              font: 'Consolas',
              size: 19,
              color: line.includes('──►') || line.includes('▼') || line.includes('├─►') ? 'C00000' : '1F497D',
            }),
          ],
        })
    );

    children.push(...flowParagraphs);
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });
}

async function run() {
  const doc = createWorkflowDoc();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('tailieu_word/03_Tai_Lieu_Bieu_Do_Hoat_Dong_Activity_Diagrams.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Đã xuất: ${outPath} (7 Workflows, ${buffer.length} bytes)`);
}

run().catch(console.error);
