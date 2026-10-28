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

interface FieldDef {
  name: string;
  type: string;
  desc: string;
}

interface TableDef {
  number: number;
  tableName: string;
  displayName: string;
  fields: FieldDef[];
}

const tableDefs: TableDef[] = [
  {
    number: 1,
    tableName: 'users',
    displayName: 'Người dùng & Tài khoản',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính (Primary Key), định danh duy nhất người dùng' },
      { name: 'email', type: 'varchar(255)', desc: 'Email đăng nhập hệ thống (Bắt buộc, Duy nhất)' },
      { name: 'google_email', type: 'varchar(255)', desc: 'Email tài khoản Google của học viên dùng để cấp quyền đọc trên Google Drive' },
      { name: 'google_id', type: 'varchar(100)', desc: 'Định danh người dùng Google OAuth (Duy nhất)' },
      { name: 'password_hash', type: 'varchar(255)', desc: 'Mật khẩu đã băm (Argon2id/Bcrypt), cho phép null nếu đăng nhập qua OAuth' },
      { name: 'name', type: 'varchar(100)', desc: 'Họ tên đầy đủ / Nghệ danh của người dùng' },
      { name: 'avatar_url', type: 'varchar(500)', desc: 'Đường dẫn URL ảnh đại diện' },
      {
        name: 'tier',
        type: 'varchar(20)',
        desc: 'Hạng thành viên hội viên:\n- FREE: Hội viên tiêu chuẩn\n- GOLD: Hội viên Gold (giảm giá 10%)\n- SUPREME: Hội viên Supreme VIP (giảm giá 30%)\n- ADMIN: Tài khoản quản trị',
      },
      {
        name: 'role',
        type: 'varchar(20)',
        desc: 'Vai trò phân quyền trong hệ thống:\n- USER: Học viên / Người dùng thông thường\n- INSTRUCTOR: Giảng viên / Tác giả khóa học\n- ADMIN: Quản trị viên toàn quyền',
      },
      { name: 'credits', type: 'int', desc: 'Số dư ví Xu (Credits) dùng để mở khóa bài học, tài nguyên' },
      { name: 'points', type: 'int', desc: 'Điểm tích lũy hoạt động (nhận từ điểm danh, đăng bài, bình luận)' },
      { name: 'balance_vnd', type: 'bigint', desc: 'Số dư ví tiền mặt VND của học viên' },
      { name: 'bio', type: 'text', desc: 'Giới thiệu bản thân / Tiểu sử nghệ sĩ' },
      { name: 'heat', type: 'int', desc: 'Điểm nhiệt độ hoạt động và tương tác cộng đồng' },
      {
        name: 'is_banned',
        type: 'boolean',
        desc: 'Trạng thái hoạt động tài khoản:\n- 1. Hoạt động bình thường (false)\n- 0. Bị khóa tài khoản (true)',
      },
      { name: 'ban_reason', type: 'text', desc: 'Lý do tài khoản bị xử lý kỷ luật / khóa' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian tạo tài khoản' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời gian cập nhật thông tin gần nhất' },
      { name: 'deleted_at', type: 'timestamp', desc: 'Thời gian xóa mềm (Soft delete)' },
    ],
  },
  {
    number: 2,
    tableName: 'refresh_tokens',
    displayName: 'Phiên làm việc & Xoay vòng Token',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính, định danh duy nhất của phiên' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến users.id (ON DELETE CASCADE)' },
      { name: 'token_hash', type: 'varchar(255)', desc: 'Chuỗi hash SHA-256 của Refresh Token bảo mật' },
      { name: 'expires_at', type: 'timestamp', desc: 'Thời điểm token hết hiệu lực' },
      { name: 'revoked_at', type: 'timestamp', desc: 'Thời điểm token bị thu hồi thủ công hoặc đăng xuất' },
      { name: 'replaced_by_token', type: 'varchar(255)', desc: 'Mã băm của token mới thay thế trong cơ chế xoay vòng (Token Rotation)' },
      { name: 'ip_address', type: 'varchar(45)', desc: 'Địa chỉ IP của thiết bị khi đăng nhập' },
      { name: 'user_agent', type: 'varchar(500)', desc: 'Thông tin trình duyệt và hệ điều hành của thiết bị đăng nhập' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian cấp phát token' },
    ],
  },
  {
    number: 3,
    tableName: 'checkin_logs',
    displayName: 'Nhật ký điểm danh nhận thưởng',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh lượt điểm danh' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến users.id' },
      { name: 'checkin_date', type: 'varchar(10)', desc: 'Ngày điểm danh theo định dạng chuẩn YYYY-MM-DD' },
      { name: 'points_rewarded', type: 'int', desc: 'Số điểm thưởng tích lũy nhận được (mặc định: 15)' },
      { name: 'credits_rewarded', type: 'int', desc: 'Số xu nội bộ thưởng nhận được (mặc định: 5)' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm thực hiện điểm danh' },
    ],
  },
  {
    number: 4,
    tableName: 'user_follows',
    displayName: 'Theo dõi tác giả & Giảng viên',
    fields: [
      { name: 'follower_id', type: 'UUID', desc: 'Khóa chính kết hợp 1, tham chiếu đến users.id (Người bấm theo dõi)' },
      { name: 'following_id', type: 'UUID', desc: 'Khóa chính kết hợp 2, tham chiếu đến users.id (Tác giả được theo dõi)' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm bắt đầu theo dõi' },
    ],
  },
  {
    number: 5,
    tableName: 'categories',
    displayName: 'Danh mục khóa học & tài nguyên',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh danh mục' },
      { name: 'slug', type: 'varchar(50)', desc: 'Đường dẫn định danh duy nhất (VD: coloso, blender, 2d-concept)' },
      { name: 'name', type: 'varchar(100)', desc: 'Tên hiển thị của chuyên mục đồ họa' },
      { name: 'description', type: 'text', desc: 'Mô tả chi tiết về danh mục' },
      { name: 'sort_order', type: 'int', desc: 'Thứ tự ưu tiên sắp xếp hiển thị trên thanh Menu điều hướng' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian tạo danh mục' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời gian cập nhật gần nhất' },
    ],
  },
  {
    number: 6,
    tableName: 'tags',
    displayName: 'Thẻ phân loại nội dung',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh thẻ tag' },
      { name: 'slug', type: 'varchar(50)', desc: 'Mã định danh thẻ duy nhất (VD: anatomy, lighting, cyber-mech)' },
      { name: 'name', type: 'varchar(50)', desc: 'Tên nhãn thẻ hiển thị' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian tạo thẻ' },
    ],
  },
  {
    number: 7,
    tableName: 'course_tags',
    displayName: 'Liên kết khóa học & thẻ tag',
    fields: [
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến courses.id' },
      { name: 'tag_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến tags.id' },
    ],
  },
  {
    number: 8,
    tableName: 'courses',
    displayName: 'Khóa học vẽ & Đồ họa CG',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh khóa học' },
      { name: 'code', type: 'varchar(50)', desc: 'Mã số nhận diện trên giao diện (VD: [484], [FREE-01])' },
      { name: 'title', type: 'varchar(255)', desc: 'Tiêu đề khóa học tiếng Việt / Quốc tế' },
      { name: 'title_zh', type: 'varchar(255)', desc: 'Tiêu đề gốc chữ Hán kèm ngày phát hành' },
      { name: 'subtitle', type: 'text', desc: 'Phụ đề mô tả ngắn gọn nội dung giảng dạy' },
      { name: 'description', type: 'text', desc: 'Nội dung giáo trình chi tiết' },
      { name: 'category_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu categories.id' },
      { name: 'instructor_name', type: 'varchar(100)', desc: 'Tên giảng viên / Nghệ sĩ phụ trách' },
      { name: 'instructor_role', type: 'varchar(150)', desc: 'Chức vụ, nơi công tác của giảng viên (VD: Lead Concept Artist)' },
      { name: 'author_avatar_url', type: 'varchar(500)', desc: 'Đường dẫn ảnh đại diện tác giả' },
      { name: 'thumbnail_url', type: 'varchar(500)', desc: 'Ảnh bìa đại diện khóa học (Poster ngang)' },
      { name: 'trailer_video_url', type: 'varchar(500)', desc: 'Đường dẫn video giới thiệu / Teaser khóa học' },
      { name: 'original_credits', type: 'int', desc: 'Giá gốc tính bằng Xu (Credits)' },
      { name: 'gold_credits', type: 'int', desc: 'Giá ưu đãi dành cho hội viên Gold' },
      { name: 'supreme_credits', type: 'int', desc: 'Giá ưu đãi dành cho hội viên Supreme VIP' },
      { name: 'price_vnd', type: 'bigint', desc: 'Giá niêm yết tính bằng tiền đồng (VND)' },
      { name: 'is_free', type: 'boolean', desc: 'Cờ đánh dấu khóa học miễn phí hoàn toàn (true: Miễn phí, false: Trả phí)' },
      {
        name: 'status',
        type: 'varchar(20)',
        desc: 'Trạng thái phát hành:\n- DRAFT: Bản nháp\n- PUBLISHED: Đã công khai\n- ARCHIVED: Tạm ẩn lưu trữ',
      },
      { name: 'views_count', type: 'int', desc: 'Tổng lượt xem trang khóa học' },
      { name: 'likes_count', type: 'int', desc: 'Tổng lượt người dùng thả tim / thích' },
      { name: 'comments_count', type: 'int', desc: 'Tổng số lượng bình luận thảo luận' },
      { name: 'event_date', type: 'varchar(50)', desc: 'Ngày phát hành hoặc thông tin sự kiện đợt mua chung' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm tạo khóa học' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật dữ liệu khóa học' },
      { name: 'deleted_at', type: 'timestamp', desc: 'Thời điểm xóa mềm' },
    ],
  },
  {
    number: 9,
    tableName: 'course_sections',
    displayName: 'Chương & Phần học',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh phần học' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến courses.id' },
      { name: 'title', type: 'varchar(255)', desc: 'Tiêu đề chương học (VD: Phần 1 - Tư duy thiết kế khối cơ bản)' },
      { name: 'sort_order', type: 'int', desc: 'Số thứ tự sắp xếp của chương học trong khóa' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian tạo chương' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời gian cập nhật gần nhất' },
    ],
  },
  {
    number: 10,
    tableName: 'lessons',
    displayName: 'Bài học video & File Drive',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh bài học' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu trực tiếp đến courses.id' },
      { name: 'section_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến course_sections.id (cho phép null)' },
      { name: 'title', type: 'varchar(255)', desc: 'Tiêu đề bài học' },
      { name: 'duration', type: 'varchar(20)', desc: 'Thời lượng phát video hiển thị (VD: 25:40)' },
      { name: 'sort_order', type: 'int', desc: 'Thứ tự phát bài học trong khóa' },
      {
        name: 'is_free_preview',
        type: 'boolean',
        desc: 'Cho phép xem thử miễn phí không cần đăng nhập / thanh toán:\n- true: Được xem thử tự do\n- false: Khóa bảo vệ bản quyền',
      },
      { name: 'drive_file_id', type: 'varchar(150)', desc: 'Mã định danh File ID trên Google Drive (Ẩn bảo mật)' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời gian tạo bài học' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời gian cập nhật bài học' },
      { name: 'deleted_at', type: 'timestamp', desc: 'Thời gian xóa mềm' },
    ],
  },
  {
    number: 11,
    tableName: 'resources',
    displayName: 'Tài nguyên đồ họa tải về',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh tài nguyên đồ họa' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu courses.id (null nếu là gói bán lẻ độc lập)' },
      { name: 'category_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu categories.id' },
      { name: 'title', type: 'varchar(255)', desc: 'Tên bộ tài nguyên (VD: Bộ 50+ Brushes Photoshop & Texture 4K)' },
      { name: 'description', type: 'text', desc: 'Mô tả chi tiết nội dung gói tài nguyên' },
      { name: 'file_type', type: 'varchar(50)', desc: 'Định dạng tệp tin (PSD, ABR, BLEND, CUBE, ZIP, FBX, OBJ)' },
      { name: 'file_size_bytes', type: 'bigint', desc: 'Dung lượng tệp tin tính theo Bytes' },
      { name: 'drive_file_id', type: 'varchar(150)', desc: 'Mã định danh File/Folder trên Google Drive được phân quyền' },
      { name: 'is_free', type: 'boolean', desc: 'Trạng thái miễn phí tải về' },
      { name: 'price_vnd', type: 'bigint', desc: 'Giá bán lẻ bằng tiền đồng (VND)' },
      { name: 'price_credits', type: 'int', desc: 'Giá tải về tính bằng Xu (Credits)' },
      { name: 'downloads_count', type: 'int', desc: 'Số lượt tải thành công của tài nguyên' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm tạo tài nguyên' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật' },
      { name: 'deleted_at', type: 'timestamp', desc: 'Thời điểm xóa mềm' },
    ],
  },
  {
    number: 12,
    tableName: 'course_media',
    displayName: 'Hình ảnh & Video preview',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh media minh họa' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu courses.id' },
      { name: 'media_type', type: 'varchar(20)', desc: 'Thể loại media: IMAGE hoặc PREVIEW_VIDEO' },
      { name: 'url', type: 'varchar(500)', desc: 'Đường dẫn liên kết CDN chứa ảnh hoặc video demo tác phẩm' },
      { name: 'caption', type: 'varchar(255)', desc: 'Chú thích bức tranh hoặc giai đoạn vẽ minh họa' },
      { name: 'sort_order', type: 'int', desc: 'Thứ tự hiển thị trong bộ sưu tập gallery' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm tải lên' },
    ],
  },
  {
    number: 13,
    tableName: 'orders',
    displayName: 'Đơn hàng mua khóa học & Nạp tiền',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh đơn hàng' },
      { name: 'order_code', type: 'varchar(50)', desc: 'Mã đơn hàng hiển thị với người dùng (VD: GGC-842911)' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến học viên đặt mua (users.id)' },
      { name: 'total_amount_vnd', type: 'bigint', desc: 'Tổng giá trị đơn hàng tính theo VND trước giảm giá' },
      { name: 'discount_amount_vnd', type: 'bigint', desc: 'Số tiền chiết khấu giảm giá theo hạng thành viên (Gold 10%, VIP 30%)' },
      { name: 'final_amount_vnd', type: 'bigint', desc: 'Số tiền thực tế người dùng phải thanh toán' },
      { name: 'total_credits', type: 'int', desc: 'Tổng số xu Credits bị trừ (nếu chọn trả qua ví xu)' },
      {
        name: 'payment_method',
        type: 'varchar(20)',
        desc: 'Phương thức thanh toán:\n- CREDITS: Thanh toán bằng Xu nội bộ\n- VNPAY: Thanh toán cổng VNPay QR/ATM/Visa\n- MOMO: Ví MoMo\n- BANK_TRANSFER: Chuyển khoản trực tiếp\n- FREE: Đơn hàng 0đ',
      },
      {
        name: 'status',
        type: 'varchar(20)',
        desc: 'Trạng thái xử lý đơn hàng:\n- PENDING: Chờ thanh toán\n- COMPLETED: Đã hoàn tất & kích hoạt quyền\n- FAILED: Thất bại\n- CANCELLED: Đã hủy\n- REFUNDED: Đã hoàn tiền & thu hồi quyền',
      },
      { name: 'idempotency_key', type: 'varchar(100)', desc: 'Khóa chống trùng lặp giao dịch (Idempotent Key)' },
      { name: 'notes', type: 'text', desc: 'Ghi chú đơn hàng' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm khởi tạo đơn hàng' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật trạng thái đơn hàng' },
    ],
  },
  {
    number: 14,
    tableName: 'order_items',
    displayName: 'Chi tiết mặt hàng trong đơn',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh dòng hàng' },
      { name: 'order_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến orders.id' },
      { name: 'item_type', type: 'varchar(20)', desc: 'Thể loại sản phẩm: COURSE, RESOURCE, VIP_UPGRADE, CREDIT_TOPUP' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu courses.id (nếu là mua khóa học)' },
      { name: 'resource_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu resources.id (nếu là mua tài nguyên)' },
      { name: 'price_vnd', type: 'bigint', desc: 'Giá tiền mặt VND tại thời điểm đặt hàng' },
      { name: 'price_credits', type: 'int', desc: 'Giá xu Credits tại thời điểm đặt hàng' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm ghi nhận dòng hàng' },
    ],
  },
  {
    number: 15,
    tableName: 'payments',
    displayName: 'Giao dịch cổng thanh toán',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh bản ghi giao dịch' },
      { name: 'order_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến orders.id' },
      { name: 'payment_gateway', type: 'varchar(20)', desc: 'Cổng thanh toán phụ trách: VNPAY, MOMO, CREDITS' },
      { name: 'transaction_id', type: 'varchar(150)', desc: 'Mã giao dịch do cổng thanh toán trả về (VD: VNPay vnp_TransactionNo)' },
      { name: 'amount_vnd', type: 'bigint', desc: 'Số tiền VND thực tế thanh toán qua cổng' },
      {
        name: 'status',
        type: 'varchar(20)',
        desc: 'Trạng thái xác thực:\n- PENDING: Chờ phản hồi IPN\n- SUCCESS: Chữ ký số HMAC hợp lệ, giao dịch thành công\n- FAILED: Giao dịch bị hủy hoặc sai số tiền',
      },
      { name: 'signature', type: 'varchar(500)', desc: 'Chữ ký điện tử HMAC-SHA512 đính kèm để đối soát bảo mật' },
      { name: 'webhook_payload', type: 'jsonb', desc: 'Toàn bộ dữ liệu IPN thô nhận được từ cổng thanh toán' },
      { name: 'paid_at', type: 'timestamp', desc: 'Thời điểm cổng thanh toán xác nhận trừ tiền thành công' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm bắt đầu giao dịch' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật cuối cùng' },
    ],
  },
  {
    number: 16,
    tableName: 'enrollments',
    displayName: 'Quyền sở hữu nội dung học tập',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh quyền sở hữu' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu học viên sở hữu (users.id)' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu khóa học được cấp (courses.id)' },
      { name: 'resource_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu tài nguyên được mở khóa (resources.id)' },
      { name: 'order_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đơn hàng gốc (orders.id)' },
      {
        name: 'status',
        type: 'varchar(20)',
        desc: 'Trạng thái quyền hạn:\n- ACTIVE: Đang có hiệu lực xem/tải\n- REVOKED: Đã bị thu hồi do hoàn tiền hoặc vi phạm\n- EXPIRED: Đã hết hạn quyền xem',
      },
      { name: 'enrolled_at', type: 'timestamp', desc: 'Thời điểm được kích hoạt quyền sở hữu' },
      { name: 'expires_at', type: 'timestamp', desc: 'Hạn kết thúc quyền truy cập (null: Sở hữu vĩnh viễn trọn đời)' },
      { name: 'revoked_at', type: 'timestamp', desc: 'Thời điểm quản trị viên thực hiện thu hồi quyền' },
      { name: 'reason', type: 'text', desc: 'Lý do thu hồi quyền sở hữu (nếu có)' },
    ],
  },
  {
    number: 17,
    tableName: 'drive_access_grants',
    displayName: 'Cấp phát quyền Google Drive',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính bản ghi cấp quyền Google Drive' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến học viên nhận quyền (users.id)' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu khóa học cần chia sẻ thư mục' },
      { name: 'lesson_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu bài học cụ thể (nếu cấp quyền lẻ)' },
      { name: 'resource_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu tài nguyên Drive cần tải' },
      { name: 'google_email', type: 'varchar(255)', desc: 'Email Google của học viên được thêm vào quyền Reader' },
      { name: 'drive_file_id', type: 'varchar(150)', desc: 'Mã file/folder trên Google Drive của trung tâm' },
      { name: 'permission_id', type: 'varchar(150)', desc: 'Mã định danh quyền do Google Drive API sinh ra để phục vụ thu hồi' },
      { name: 'role', type: 'varchar(50)', desc: 'Quyền được cấp (mặc định: reader, chống chia sẻ lại và cấm chỉnh sửa)' },
      {
        name: 'status',
        type: 'varchar(20)',
        desc: 'Trạng thái gọi API Google Drive:\n- GRANTED: Đã cấp quyền thành công\n- REVOKED: Đã thu hồi quyền thành công\n- FAILED: Gặp sự cố kết nối tới Google',
      },
      { name: 'error_message', type: 'text', desc: 'Chi tiết thông điệp lỗi từ Google Drive API (nếu thất bại)' },
      { name: 'granted_at', type: 'timestamp', desc: 'Thời điểm gọi API cấp quyền thành công' },
      { name: 'revoked_at', type: 'timestamp', desc: 'Thời điểm gọi API xóa quyền khỏi Google Drive' },
    ],
  },
  {
    number: 18,
    tableName: 'course_comments',
    displayName: 'Bình luận khóa học',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh bình luận' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu courses.id' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu users.id (Người đăng bình luận)' },
      { name: 'content', type: 'text', desc: 'Nội dung nhận xét, góp ý hoặc hỏi bài' },
      { name: 'likes_count', type: 'int', desc: 'Số lượt thích bình luận từ học viên khác' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm đăng bình luận' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật bình luận' },
    ],
  },
  {
    number: 19,
    tableName: 'comment_replies',
    displayName: 'Phản hồi bình luận khóa học',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh phản hồi' },
      { name: 'parent_comment_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu bình luận cha (course_comments.id)' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu người phản hồi (users.id)' },
      { name: 'content', type: 'text', desc: 'Nội dung câu trả lời thảo luận' },
      { name: 'likes_count', type: 'int', desc: 'Số lượt yêu thích câu trả lời' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm đăng phản hồi' },
    ],
  },
  {
    number: 20,
    tableName: 'course_likes',
    displayName: 'Lượt yêu thích khóa học',
    fields: [
      { name: 'user_id', type: 'UUID', desc: 'Khóa chính kết hợp 1, tham chiếu users.id' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa chính kết hợp 2, tham chiếu courses.id' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm bấm thích khóa học' },
    ],
  },
  {
    number: 21,
    tableName: 'wishlists',
    displayName: 'Danh sách khóa học quan tâm',
    fields: [
      { name: 'user_id', type: 'UUID', desc: 'Khóa chính kết hợp 1, tham chiếu users.id' },
      { name: 'course_id', type: 'UUID', desc: 'Khóa chính kết hợp 2, tham chiếu courses.id' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm lưu vào bộ sưu tập cá nhân' },
    ],
  },
  {
    number: 22,
    tableName: 'forum_boards',
    displayName: 'Chuyên mục diễn đàn',
    fields: [
      { name: 'id', type: 'varchar(50)', desc: 'Khóa chính mã chuyên mục (VD: board-inspiration, board-asset, board-qa)' },
      { name: 'title', type: 'varchar(100)', desc: 'Tên chuyên mục hiển thị trên giao diện' },
      { name: 'description', type: 'text', desc: 'Lời giới thiệu quy định và nội dung chuyên mục' },
      { name: 'icon_type', type: 'varchar(50)', desc: 'Tên biểu tượng minh họa giao diện' },
      { name: 'posts_count', type: 'int', desc: 'Tổng số bài viết đang có trong chuyên mục' },
      { name: 'heat_count', type: 'int', desc: 'Chỉ số nhiệt kế quan tâm của cộng đồng' },
      { name: 'likes_count', type: 'int', desc: 'Tổng số lượt like các bài viết trong mục' },
      { name: 'is_locked', type: 'boolean', desc: 'Trạng thái khóa chuyên mục (chỉ xem, không cho đăng mới)' },
      { name: 'has_flame_badge', type: 'boolean', desc: 'Gắn huy hiệu ngọn lửa xu hướng nổi bật' },
      { name: 'sort_order', type: 'int', desc: 'Thứ tự hiển thị chuyên mục' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm tạo chuyên mục' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật' },
    ],
  },
  {
    number: 23,
    tableName: 'forum_posts',
    displayName: 'Bài viết thảo luận cộng đồng',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh bài viết' },
      { name: 'board_id', type: 'varchar(50)', desc: 'Khóa ngoại tham chiếu forum_boards.id' },
      { name: 'author_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu tác giả bài viết (users.id)' },
      { name: 'title', type: 'varchar(255)', desc: 'Tiêu đề bài thảo luận / Trưng bày tranh vẽ' },
      { name: 'content', type: 'text', desc: 'Nội dung chi tiết bài viết (Hỗ trợ Markdown)' },
      { name: 'cover_image_url', type: 'varchar(500)', desc: 'Ảnh bìa minh họa chính của bài viết' },
      { name: 'images', type: 'jsonb', desc: 'Mảng danh sách đường dẫn các ảnh đính kèm: ["url1", "url2"]' },
      { name: 'tags', type: 'jsonb', desc: 'Mảng danh sách các thẻ chủ đề thảo luận: ["blender", "render"]' },
      {
        name: 'category',
        type: 'varchar(20)',
        desc: 'Thể loại bài viết:\n- SUMMARY: Tổng hợp\n- ATTENTION: Quan tâm theo dõi\n- SECTION: Chuyên đề kỹ thuật\n- POPULAR: Thịnh hành\n- ESSENCE: Bài viết tinh hoa / Chọn lọc\n- QA: Hỏi đáp lỗi kỹ thuật\n- VOTING: Thăm dò ý kiến / PK Vote',
      },
      {
        name: 'reading_permission',
        type: 'varchar(20)',
        desc: 'Quyền đọc bài viết:\n- PUBLIC: Công khai ai cũng đọc được\n- GOLD: Chỉ thành viên Gold trở lên\n- SUPREME: Dành riêng cho thành viên Supreme VIP\n- PASSWORD: Khóa bằng mật khẩu riêng',
      },
      { name: 'password_hash', type: 'varchar(255)', desc: 'Mật khẩu bài viết đã băm (nếu đặt quyền PASSWORD)' },
      { name: 'reads_count', type: 'int', desc: 'Số lượt đọc bài viết' },
      { name: 'likes_count', type: 'int', desc: 'Số lượt yêu thích bài viết' },
      { name: 'comments_count', type: 'int', desc: 'Tổng số bình luận dưới bài viết' },
      { name: 'is_voting_enabled', type: 'boolean', desc: 'Bật chức năng thăm dò / Bỏ phiếu ý kiến cộng đồng' },
      { name: 'status', type: 'varchar(20)', desc: 'Trạng thái bài: PUBLISHED, DRAFT, ARCHIVED' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm đăng tải bài viết' },
      { name: 'updated_at', type: 'timestamp', desc: 'Thời điểm cập nhật bài viết' },
      { name: 'deleted_at', type: 'timestamp', desc: 'Thời điểm xóa mềm' },
    ],
  },
  {
    number: 24,
    tableName: 'poll_options',
    displayName: 'Tùy chọn bình chọn / Thăm dò',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh phương án lựa chọn' },
      { name: 'post_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu đến bài viết forum_posts.id' },
      { name: 'option_text', type: 'varchar(255)', desc: 'Nội dung của phương án bình chọn (VD: Học Blender, Học ZBrush)' },
      { name: 'votes_count', type: 'int', desc: 'Tổng số phiếu bình chọn cho phương án này' },
      { name: 'sort_order', type: 'int', desc: 'Thứ tự hiển thị các phương án' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm tạo phương án' },
    ],
  },
  {
    number: 25,
    tableName: 'poll_votes',
    displayName: 'Phiếu bình chọn của học viên',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh phiếu bầu' },
      { name: 'poll_option_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu phương án đã chọn (poll_options.id)' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu học viên tham gia bình chọn (users.id)' },
      { name: 'post_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu bài viết bình chọn (forum_posts.id)' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm bỏ phiếu (Mỗi user chỉ được vote 1 lần / bài)' },
    ],
  },
  {
    number: 26,
    tableName: 'forum_comments',
    displayName: 'Bình luận bài viết diễn đàn',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh bình luận diễn đàn' },
      { name: 'post_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu bài viết forum_posts.id' },
      { name: 'author_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu tác giả bình luận (users.id)' },
      { name: 'content', type: 'text', desc: 'Nội dung phản hồi, thảo luận bài viết' },
      { name: 'image_url', type: 'varchar(500)', desc: 'Ảnh đính kèm trong bình luận (Ảnh trả bài tập / Lỗi phần mềm)' },
      { name: 'likes_count', type: 'int', desc: 'Số lượt thích bình luận diễn đàn' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm đăng bình luận' },
    ],
  },
  {
    number: 27,
    tableName: 'notifications',
    displayName: 'Thông báo học viên',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh thông báo' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu người nhận thông báo (users.id)' },
      {
        name: 'type',
        type: 'varchar(20)',
        desc: 'Phân loại thông báo:\n- COMMENT: Có người phản hồi bình luận\n- GROUP_BUY: Cập nhật tiến độ đợt mua chung\n- SYSTEM: Thông báo bảo trì / sự kiện hệ thống\n- VIP: Chúc mừng nâng hạng thành viên\n- CREDIT: Biến động số dư ví Xu\n- ORDER: Thông báo trạng thái thanh toán đơn hàng',
      },
      { name: 'title', type: 'varchar(255)', desc: 'Tiêu đề thông báo ngắn gọn' },
      { name: 'message', type: 'text', desc: 'Chi tiết nội dung thông báo' },
      { name: 'link_url', type: 'varchar(500)', desc: 'Đường dẫn điều hướng khi người dùng nhấp vào thông báo' },
      { name: 'course_id', type: 'varchar(100)', desc: 'Mã khóa học liên quan đến thông báo (nếu có)' },
      { name: 'is_read', type: 'boolean', desc: 'Trạng thái đọc thông báo (true: Đã xem, false: Chưa xem)' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm hệ thống gửi thông báo' },
    ],
  },
  {
    number: 28,
    tableName: 'chat_messages',
    displayName: 'Tin nhắn trò chuyện trực tiếp',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh tin nhắn chat' },
      { name: 'user_id', type: 'UUID', desc: 'Khóa ngoại tham chiếu người gửi tin nhắn (users.id)' },
      { name: 'message', type: 'text', desc: 'Nội dung trao đổi trò chuyện' },
      { name: 'is_announcement', type: 'boolean', desc: 'Đánh dấu tin nhắn thông báo nổi bật từ Ban Quản Trị' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm gửi tin nhắn' },
    ],
  },
  {
    number: 29,
    tableName: 'audit_logs',
    displayName: 'Nhật ký kiểm toán thao tác hệ thống',
    fields: [
      { name: 'id', type: 'UUID', desc: 'Khóa chính định danh lượt ghi nhật ký' },
      { name: 'user_id', type: 'UUID', desc: 'Người thực hiện thao tác (null nếu do hệ thống chạy định kỳ)' },
      { name: 'action', type: 'varchar(100)', desc: 'Tên hành động nghiệp vụ (VD: REFUND_ORDER, GRANT_DRIVE_PERMISSION, BAN_USER)' },
      { name: 'target_type', type: 'varchar(50)', desc: 'Đối tượng bị tác động (USER, ORDER, COURSE, RESOURCE, ENROLLMENT)' },
      { name: 'target_id', type: 'varchar(100)', desc: 'Mã định danh ID của đối tượng bị tác động' },
      { name: 'old_values', type: 'jsonb', desc: 'Dữ liệu trạng thái cũ trước khi thay đổi' },
      { name: 'new_values', type: 'jsonb', desc: 'Dữ liệu trạng thái mới sau khi cập nhật' },
      { name: 'ip_address', type: 'varchar(45)', desc: 'Địa chỉ IP của người thao tác' },
      { name: 'user_agent', type: 'varchar(500)', desc: 'Trình duyệt và thiết bị của người thao tác' },
      { name: 'created_at', type: 'timestamp', desc: 'Thời điểm phát sinh hành động kiểm toán' },
    ],
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
  left: 150,
  right: 150,
};

function createDbDocx(): Document {
  const children: (Paragraph | Table)[] = [];

  // Tiêu đề tài liệu
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ CƠ SỞ DỮ LIỆU (DATABASE SPECIFICATION)',
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
          text: 'Dự án: Nền tảng chia sẻ Khóa học & Tài nguyên Đồ họa Nghệ thuật (GGC Studio / Whale)\nHệ quản trị CSDL: PostgreSQL 15+ | ORM: Prisma ORM',
          italics: true,
          size: 22, // 11pt
          font: 'Times New Roman',
          color: '595959',
        }),
      ],
    })
  );

  // Tạo từng bảng theo mẫu Ảnh 1
  for (const t of tableDefs) {
    // Tiêu đề bảng: VD "1. Bảng user: Người dùng"
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: `${t.number}. Bảng ${t.tableName}: ${t.displayName}`,
            bold: true,
            size: 26, // 13pt
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      })
    );

    const rows: TableRow[] = [];

    // Header Row (Orange color #E36C0A / #ED7D31)
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: 'ED7D31', type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Tên',
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: 'ED7D31', type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'DataType',
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'ED7D31', type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Ý nghĩa',
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Data rows
    for (let i = 0; i < t.fields.length; i++) {
      const f = t.fields[i];
      // Tách các dòng mô tả có xuống dòng
      const descLines = f.desc.split('\n');
      const descParagraphs = descLines.map(
        (line) =>
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({
                text: line,
                size: 21,
                font: 'Times New Roman',
                color: line.startsWith('-') ? '1F497D' : '000000',
              }),
            ],
          })
      );

      // Xen kẽ màu nền nhẹ cho dễ đọc như trong ảnh (#FDF2E9 cho các hàng có phân loại)
      const isSpecial = f.desc.includes('\n');
      const rowFill = isSpecial ? 'FDF2E9' : (i % 2 === 1 ? 'FAF9F8' : 'FFFFFF');

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: f.name,
                      bold: f.name === 'id' || f.name.endsWith('_id'),
                      size: 21,
                      font: 'Times New Roman',
                      color: '1F497D',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: f.type,
                      size: 21,
                      font: 'Times New Roman',
                      color: '385723',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: cellMargins,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              children: descParagraphs,
            }),
          ],
        })
      );
    }

    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
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
  const doc = createDbDocx();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('tailieu_word/01_Tai_Lieu_Database_Cac_Bang.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Đã xuất thành công: ${outPath} (${buffer.length} bytes)`);
}

run().catch(console.error);
