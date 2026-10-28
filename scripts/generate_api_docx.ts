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

export interface ParamDef {
  stt: number;
  name: string;
  type: string;
  required: string; // 'x' or ''
  desc: string;
}

export interface ChildObjectDef {
  title: string; // e.g. "- Mô tả object data:"
  fields: ParamDef[];
}

export interface ApiSpec {
  code: string; // e.g. "API-01"
  endpointName: string; // e.g. "auth/register"
  title: string; // e.g. "1.1. API-01 – auth/register"
  desc: string;
  baseUrl: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  header: string;
  controller: string;
  inputs: ParamDef[];
  outputs: ParamDef[];
  children?: ChildObjectDef[];
}

export interface ApiModule {
  filePrefix: string;
  moduleName: string;
  description: string;
  apis: ApiSpec[];
}

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
  top: 80,
  bottom: 80,
  left: 120,
  right: 120,
};

export const apiModules: ApiModule[] = [
  {
    filePrefix: '02_Tai_Lieu_API_01_Auth_Users',
    moduleName: 'PHÂN HỆ XÁC THỰC & NGƯỜI DÙNG (AUTHENTICATION & USERS)',
    description: 'Bao gồm các API xử lý Đăng ký, Đăng nhập, Làm mới token JWT, Đăng xuất, Hồ sơ, Điểm danh, Sở hữu và Theo dõi.',
    apis: [
      {
        code: 'API-01',
        endpointName: 'auth/register',
        title: '1.1. API-01 – auth/register',
        desc: 'Đăng ký tài khoản học viên mới trên hệ thống Whale.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/auth/register',
        method: 'POST',
        header: 'Content-Type: application/json',
        controller: 'AuthController.register',
        inputs: [
          { stt: 1, name: 'email', type: 'string', required: 'x', desc: 'Địa chỉ email đăng ký' },
          { stt: 2, name: 'password', type: 'string', required: 'x', desc: 'Mật khẩu tài khoản (tối thiểu 6 ký tự)' },
          { stt: 3, name: 'name', type: 'string', required: 'x', desc: 'Họ tên đầy đủ / Nghệ danh hiển thị' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Dữ liệu phiên đăng nhập và tài khoản vừa tạo' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'user', type: 'object', required: 'x', desc: 'Thông tin hồ sơ học viên' },
              { stt: 2, name: 'accessToken', type: 'string', required: 'x', desc: 'JWT Access Token có hạn 15 phút' },
            ],
          },
          {
            title: '- Mô tả object user:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID định danh người dùng' },
              { stt: 2, name: 'email', type: 'string', required: 'x', desc: 'Email tài khoản' },
              { stt: 3, name: 'name', type: 'string', required: 'x', desc: 'Tên hiển thị' },
              { stt: 4, name: 'role', type: 'string', required: 'x', desc: 'Quyền hạn: USER' },
              { stt: 5, name: 'tier', type: 'string', required: 'x', desc: 'Hạng hội viên: FREE' },
              { stt: 6, name: 'credits', type: 'int', required: 'x', desc: 'Số dư ví xu khởi tạo (0 xu)' },
            ],
          },
        ],
      },
      {
        code: 'API-02',
        endpointName: 'auth/login',
        title: '1.2. API-02 – auth/login',
        desc: 'Đăng nhập hệ thống bằng email và mật khẩu.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/auth/login',
        method: 'POST',
        header: 'Content-Type: application/json',
        controller: 'AuthController.login',
        inputs: [
          { stt: 1, name: 'email', type: 'string', required: 'x', desc: 'Email tài khoản' },
          { stt: 2, name: 'password', type: 'string', required: 'x', desc: 'Mật khẩu' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Dữ liệu phiên đăng nhập' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'user', type: 'object', required: 'x', desc: 'Hồ sơ người dùng' },
              { stt: 2, name: 'accessToken', type: 'string', required: 'x', desc: 'JWT Access Token Bearer' },
            ],
          },
          {
            title: '- Mô tả object user:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID người dùng' },
              { stt: 2, name: 'email', type: 'string', required: 'x', desc: 'Email đăng nhập' },
              { stt: 3, name: 'googleEmail', type: 'string', required: '', desc: 'Email Google Drive nhận tài liệu' },
              { stt: 4, name: 'role', type: 'string', required: 'x', desc: 'USER | INSTRUCTOR | ADMIN' },
              { stt: 5, name: 'tier', type: 'string', required: 'x', desc: 'FREE | GOLD | SUPREME' },
              { stt: 6, name: 'credits', type: 'int', required: 'x', desc: 'Số dư ví xu' },
              { stt: 7, name: 'balanceVnd', type: 'int', required: 'x', desc: 'Số dư tiền mặt VND' },
            ],
          },
        ],
      },
      {
        code: 'API-03',
        endpointName: 'auth/refresh',
        title: '1.3. API-03 – auth/refresh',
        desc: 'Cấp phát Access Token mới từ HttpOnly Cookie với cơ chế xoay vòng Token Rotation.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/auth/refresh',
        method: 'POST',
        header: 'Cookie: refreshToken={{token}}',
        controller: 'AuthController.refresh',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Dữ liệu token mới' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'accessToken', type: 'string', required: 'x', desc: 'JWT Access Token mới cấp (15 phút)' },
            ],
          },
        ],
      },
      {
        code: 'API-04',
        endpointName: 'auth/logout',
        title: '1.4. API-04 – auth/logout',
        desc: 'Đăng xuất tài khoản và thu hồi Refresh Token.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/auth/logout',
        method: 'POST',
        header: 'Authorization: Bearer {{access_token}}\nCookie: refreshToken={{token}}',
        controller: 'AuthController.logout',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: '{"success": true}' },
        ],
      },
      {
        code: 'API-05',
        endpointName: 'auth/me',
        title: '1.5. API-05 – auth/me',
        desc: 'Lấy thông tin tài khoản và số dư ví của học viên đang đăng nhập.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/auth/me',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'AuthController.getMe',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Hồ sơ người dùng chi tiết' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID' },
              { stt: 2, name: 'email', type: 'string', required: 'x', desc: 'Email' },
              { stt: 3, name: 'name', type: 'string', required: 'x', desc: 'Họ tên' },
              { stt: 4, name: 'googleEmail', type: 'string', required: '', desc: 'Email Google nhận Drive' },
              { stt: 5, name: 'credits', type: 'int', required: 'x', desc: 'Số dư ví Xu' },
              { stt: 6, name: 'points', type: 'int', required: 'x', desc: 'Điểm thưởng hoạt động' },
              { stt: 7, name: 'tier', type: 'string', required: 'x', desc: 'Hạng hội viên' },
            ],
          },
        ],
      },
      {
        code: 'API-06',
        endpointName: 'users/profile',
        title: '1.6. API-06 – users/profile',
        desc: 'Cập nhật thông tin hồ sơ và cấu hình email Google Drive nhận tài liệu.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/users/profile',
        method: 'PUT',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'UsersController.updateProfile',
        inputs: [
          { stt: 1, name: 'name', type: 'string', required: '', desc: 'Tên hiển thị mới' },
          { stt: 2, name: 'googleEmail', type: 'string', required: '', desc: 'Email Google Drive nhận quyền tải' },
          { stt: 3, name: 'avatarUrl', type: 'string', required: '', desc: 'URL ảnh đại diện' },
          { stt: 4, name: 'bio', type: 'string', required: '', desc: 'Tiểu sử cá nhân' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Hồ sơ sau cập nhật' },
        ],
      },
      {
        code: 'API-07',
        endpointName: 'users/checkin',
        title: '1.7. API-07 – users/checkin',
        desc: 'Điểm danh nhận thưởng hàng ngày (+15 Points, +5 Xu).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/users/checkin',
        method: 'POST',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'UsersController.dailyCheckin',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Kết quả nhận thưởng' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'checkinDate', type: 'string', required: 'x', desc: 'Ngày điểm danh YYYY-MM-DD' },
              { stt: 2, name: 'pointsRewarded', type: 'int', required: 'x', desc: 'Điểm thưởng cộng thêm (+15)' },
              { stt: 3, name: 'creditsRewarded', type: 'int', required: 'x', desc: 'Xu thưởng cộng thêm (+5)' },
              { stt: 4, name: 'currentCredits', type: 'int', required: 'x', desc: 'Số dư ví xu mới nhất' },
            ],
          },
        ],
      },
      {
        code: 'API-08',
        endpointName: 'users/enrollments',
        title: '1.8. API-08 – users/enrollments',
        desc: 'Lấy danh sách các khóa học và tài nguyên mà học viên đã mua và sở hữu quyền truy cập.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/users/enrollments',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'UsersController.getMyEnrollments',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách các quyền sở hữu nội dung' },
        ],
        children: [
          {
            title: '- Mô tả phần tử trong mảng data:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID bản ghi enrollment' },
              { stt: 2, name: 'courseId', type: 'string', required: '', desc: 'UUID khóa học' },
              { stt: 3, name: 'resourceId', type: 'string', required: '', desc: 'UUID tài nguyên' },
              { stt: 4, name: 'status', type: 'string', required: 'x', desc: 'ACTIVE | REVOKED | EXPIRED' },
              { stt: 5, name: 'enrolledAt', type: 'string', required: 'x', desc: 'Thời điểm kích hoạt' },
            ],
          },
        ],
      },
      {
        code: 'API-09',
        endpointName: 'users/wishlist',
        title: '1.9. API-09 – users/wishlist',
        desc: 'Xem danh sách hoặc Thêm/Xóa khóa học khỏi bộ sưu tập yêu thích.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/users/wishlist',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'UsersController.toggleWishlist',
        inputs: [
          { stt: 1, name: 'courseId', type: 'string', required: 'x', desc: 'UUID khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: '{"saved": true, "courseId": "..."}' },
        ],
      },
      {
        code: 'API-10',
        endpointName: 'users/follows',
        title: '1.10. API-10 – users/follows',
        desc: 'Theo dõi hoặc Hủy theo dõi một tác giả / giảng viên nghệ thuật.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/users/follows/:targetUserId',
        method: 'POST',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'UsersController.toggleFollow',
        inputs: [
          { stt: 1, name: 'targetUserId', type: 'string (URL Param)', required: 'x', desc: 'UUID giảng viên cần follow' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: '{"following": true}' },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_02_Courses_Catalog',
    moduleName: 'PHÂN HỆ KHÓA HỌC & DANH MỤC (COURSES & CATALOG)',
    description: 'Bao gồm các API lấy danh sách khóa học, xem chi tiết, stream bài học, bình luận, like và danh mục.',
    apis: [
      {
        code: 'API-11',
        endpointName: 'courses/list',
        title: '2.1. API-11 – courses/list',
        desc: 'Lấy danh sách khóa học phân trang, tìm kiếm và lọc theo danh mục.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'CoursesController.listCourses',
        inputs: [
          { stt: 1, name: 'category', type: 'string', required: '', desc: 'Slug danh mục: coloso, blender, 2d-concept, all' },
          { stt: 2, name: 'search', type: 'string', required: '', desc: 'Từ khóa tìm kiếm theo tên hoặc mã [code]' },
          { stt: 3, name: 'isFree', type: 'boolean', required: '', desc: 'Lọc khóa miễn phí (true/false)' },
          { stt: 4, name: 'page', type: 'int', required: '', desc: 'Trang hiện tại (Mặc định: 1)' },
          { stt: 5, name: 'limit', type: 'int', required: '', desc: 'Số phần tử / trang (Mặc định: 20)' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách khóa học' },
          { stt: 2, name: 'pagination', type: 'object', required: 'x', desc: 'Thông tin phân trang' },
        ],
        children: [
          {
            title: '- Mô tả phần tử khóa học trong data:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID khóa học' },
              { stt: 2, name: 'code', type: 'string', required: 'x', desc: 'Mã số (VD: [484])' },
              { stt: 3, name: 'title', type: 'string', required: 'x', desc: 'Tên khóa học' },
              { stt: 4, name: 'instructor', type: 'string', required: 'x', desc: 'Giảng viên' },
              { stt: 5, name: 'thumbnail', type: 'string', required: 'x', desc: 'URL ảnh bìa' },
              { stt: 6, name: 'originalPrice', type: 'int', required: 'x', desc: 'Giá gốc' },
              { stt: 7, name: 'isFree', type: 'boolean', required: 'x', desc: 'Miễn phí hay không' },
            ],
          },
        ],
      },
      {
        code: 'API-12',
        endpointName: 'courses/detail',
        title: '2.2. API-12 – courses/detail',
        desc: 'Lấy chi tiết khóa học và danh sách tất cả các bài học kèm trạng thái xem thử (isFreePreview).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:id',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'CoursesController.getCourseDetail',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID hoặc mã nhận diện của khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Chi tiết khóa học' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID khóa học' },
              { stt: 2, name: 'title', type: 'string', required: 'x', desc: 'Tên khóa học' },
              { stt: 3, name: 'description', type: 'string', required: 'x', desc: 'Giáo trình chi tiết' },
              { stt: 4, name: 'chapters', type: 'object[]', required: 'x', desc: 'Danh sách bài học' },
            ],
          },
          {
            title: '- Mô tả phần tử bài học trong chapters:',
            fields: [
              { stt: 1, name: 'id', type: 'string', required: 'x', desc: 'UUID bài học' },
              { stt: 2, name: 'title', type: 'string', required: 'x', desc: 'Tiêu đề bài học' },
              { stt: 3, name: 'duration', type: 'string', required: 'x', desc: 'Thời lượng (VD: 25:40)' },
              { stt: 4, name: 'isFreePreview', type: 'boolean', required: 'x', desc: 'Có được xem thử miễn phí không' },
            ],
          },
        ],
      },
      {
        code: 'API-13',
        endpointName: 'courses/stream',
        title: '2.3. API-13 – courses/stream',
        desc: 'Cấp Signed Stream Token và URL phát video bài học (Có Entitlement Guard bảo vệ bản quyền).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:courseId/lessons/:lessonId/stream',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}} (Tùy chọn với bài preview)',
        controller: 'CoursesController.getLessonStream',
        inputs: [
          { stt: 1, name: 'courseId', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
          { stt: 2, name: 'lessonId', type: 'string (URL Param)', required: 'x', desc: 'UUID bài học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Dữ liệu luồng video' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'lessonId', type: 'string', required: 'x', desc: 'UUID bài học' },
              { stt: 2, name: 'streamToken', type: 'string', required: 'x', desc: 'Signed Stream Token JWT' },
              { stt: 3, name: 'streamUrl', type: 'string', required: 'x', desc: 'Đường dẫn phát video cho Player HTML5' },
              { stt: 4, name: 'expiresIn', type: 'string', required: 'x', desc: 'Thời hạn hiệu lực (15m)' },
            ],
          },
        ],
      },
      {
        code: 'API-14',
        endpointName: 'courses/comments/list',
        title: '2.4. API-14 – courses/comments/list',
        desc: 'Lấy danh sách các bình luận và phản hồi thảo luận của khóa học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:id/comments',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'CoursesRouter.getComments',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách bình luận có phân nhánh phản hồi' },
        ],
      },
      {
        code: 'API-15',
        endpointName: 'courses/comments/create',
        title: '2.5. API-15 – courses/comments/create',
        desc: 'Đăng bình luận mới cho khóa học và tự động tăng commentsCount.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:id/comments',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'CoursesRouter.createComment',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
          { stt: 2, name: 'content', type: 'string (Body)', required: 'x', desc: 'Nội dung bình luận' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Bình luận vừa tạo' },
        ],
      },
      {
        code: 'API-16',
        endpointName: 'courses/comments/reply',
        title: '2.6. API-16 – courses/comments/reply',
        desc: 'Gửi câu trả lời phản hồi cho một bình luận trong khóa học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:id/comments/:commentId/replies',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'CoursesRouter.createReply',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
          { stt: 2, name: 'commentId', type: 'string (URL Param)', required: 'x', desc: 'UUID bình luận cha' },
          { stt: 3, name: 'content', type: 'string (Body)', required: 'x', desc: 'Nội dung phản hồi' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Bản ghi phản hồi vừa tạo' },
        ],
      },
      {
        code: 'API-17',
        endpointName: 'courses/like',
        title: '2.7. API-17 – courses/like',
        desc: 'Tăng lượt yêu thích likesCount của khóa học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/courses/:id/like',
        method: 'POST',
        header: 'Không bắt buộc',
        controller: 'CoursesRouter.likeCourse',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: '{"id": "...", "likesCount": 128}' },
        ],
      },
      {
        code: 'API-18',
        endpointName: 'categories/list',
        title: '2.8. API-18 – categories/list',
        desc: 'Lấy toàn bộ danh sách danh mục phân loại đồ họa.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/categories',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'TaxonomyController.listCategories',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách danh mục' },
        ],
      },
      {
        code: 'API-19',
        endpointName: 'tags/list',
        title: '2.9. API-19 – tags/list',
        desc: 'Lấy danh sách các thẻ tag chủ đề.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/tags',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'TaxonomyController.listTags',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách thẻ tag' },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_03_Learning_Drive',
    moduleName: 'PHÂN HỆ HỌC TẬP & BẢO VỆ GOOGLE DRIVE (LEARNING & DRIVE PROTECTION)',
    description: 'Bao gồm kiểm tra Entitlement, Signed Stream Token, Proxy Video 206 và Cấp quyền Google Drive Reader.',
    apis: [
      {
        code: 'API-20',
        endpointName: 'learning/entitlement',
        title: '3.1. API-20 – learning/entitlement',
        desc: 'Kiểm tra quyền sở hữu nội dung khóa học của học viên trước khi vào phòng học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/learning/courses/:courseId/entitlement',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'LearningController.getCourseEntitlement',
        inputs: [
          { stt: 1, name: 'courseId', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Trạng thái quyền sở hữu' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'isEntitled', type: 'boolean', required: 'x', desc: 'Đã sở hữu hay chưa' },
              { stt: 2, name: 'enrollmentStatus', type: 'string', required: 'x', desc: 'ACTIVE | REVOKED | NONE' },
              { stt: 3, name: 'hasDriveAccess', type: 'boolean', required: 'x', desc: 'Đã cấp quyền Drive hay chưa' },
            ],
          },
        ],
      },
      {
        code: 'API-21',
        endpointName: 'learning/signed-stream-token',
        title: '3.2. API-21 – learning/signed-stream-token',
        desc: 'Cấp token ngắn hạn (15 phút) gắn IP học viên để chống chia sẻ lậu link stream.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/learning/lessons/:lessonId/signed-stream-token',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'LearningController.getSignedStreamToken',
        inputs: [
          { stt: 1, name: 'lessonId', type: 'string (URL Param)', required: 'x', desc: 'UUID bài học' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'URL proxy kèm token' },
        ],
      },
      {
        code: 'API-22',
        endpointName: 'learning/stream-proxy',
        title: '3.3. API-22 – learning/stream-proxy',
        desc: 'Proxy stream video hỗ trợ HTTP Range 206 Partial Content (ẩn link Drive thật khỏi trình duyệt).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/learning/stream/proxy',
        method: 'GET',
        header: 'Range: bytes=0-1048576',
        controller: 'LearningController.proxyStreamVideo',
        inputs: [
          { stt: 1, name: 'token', type: 'string (Query)', required: 'x', desc: 'Signed Stream Token nhận từ API-21' },
        ],
        outputs: [
          { stt: 1, name: 'Binary Stream', type: 'video/mp4', required: 'x', desc: 'Luồng nhị phân video trả về với mã HTTP 206 Partial Content' },
        ],
      },
      {
        code: 'API-23',
        endpointName: 'learning/request-drive-access',
        title: '3.4. API-23 – learning/request-drive-access',
        desc: 'Tự động gọi Google Drive API cấp quyền Reader cho email học viên.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/learning/courses/:courseId/request-drive-access',
        method: 'POST',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'LearningController.requestDriveAccess',
        inputs: [
          { stt: 1, name: 'courseId', type: 'string (URL Param)', required: 'x', desc: 'UUID khóa học' },
        ],
        outputs: [
          { stt: 1, name: 'success', type: 'boolean', required: 'x', desc: 'Kết quả cấp quyền thành công (true)' },
          { stt: 2, name: 'grantedToEmail', type: 'string', required: 'x', desc: 'Email Google nhận quyền' },
          { stt: 3, name: 'permissionId', type: 'string', required: 'x', desc: 'Mã quyền do Google Drive API cấp' },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_04_Resources',
    moduleName: 'PHÂN HỆ TÀI NGUYÊN ĐỒ HỌA (GRAPHIC RESOURCES)',
    description: 'Bao gồm danh sách cọ vẽ Brushes, Textures, Project Files 3D, chi tiết và cấp link tải bảo mật.',
    apis: [
      {
        code: 'API-24',
        endpointName: 'resources/list',
        title: '4.1. API-24 – resources/list',
        desc: 'Lấy danh sách tài nguyên đồ họa có phân trang và lọc theo định dạng (PSD, ABR, BLEND, CUBE, ZIP).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/resources',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'ResourcesController.listResources',
        inputs: [
          { stt: 1, name: 'category', type: 'string', required: '', desc: 'Slug danh mục' },
          { stt: 2, name: 'fileType', type: 'string', required: '', desc: 'Lọc định dạng: PSD, ABR, BLEND, ZIP...' },
          { stt: 3, name: 'isFree', type: 'boolean', required: '', desc: 'Lọc tài nguyên miễn phí' },
          { stt: 4, name: 'page', type: 'int', required: '', desc: 'Trang truy vấn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách tài nguyên' },
          { stt: 2, name: 'pagination', type: 'object', required: 'x', desc: 'Dữ liệu phân trang' },
        ],
      },
      {
        code: 'API-25',
        endpointName: 'resources/detail',
        title: '4.2. API-25 – resources/detail',
        desc: 'Lấy thông tin chi tiết gói tài nguyên và kiểm tra trạng thái mở khóa của học viên.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/resources/:id',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}} (Tùy chọn)',
        controller: 'ResourcesController.getResourceDetail',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID tài nguyên' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Chi tiết tài nguyên' },
        ],
      },
      {
        code: 'API-26',
        endpointName: 'resources/download',
        title: '4.3. API-26 – resources/download',
        desc: 'Cấp đường dẫn tải file bảo mật có thời hạn (Signed Download URL, có Entitlement Guard).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/resources/:id/download',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}} (Bắt buộc với tài nguyên trả phí)',
        controller: 'ResourcesController.downloadResource',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID tài nguyên cần tải' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Dữ liệu link tải' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'resourceId', type: 'string', required: 'x', desc: 'UUID tài nguyên' },
              { stt: 2, name: 'downloadUrl', type: 'string', required: 'x', desc: 'URL tải có chữ ký số bảo mật' },
              { stt: 3, name: 'expiresIn', type: 'string', required: 'x', desc: 'Thời hạn hiệu lực (15m)' },
            ],
          },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_05_Orders_Payments',
    moduleName: 'PHÂN HỆ ĐƠN HÀNG & CỔNG THANH TOÁN (ORDERS & PAYMENTS)',
    description: 'Bao gồm tạo đơn hàng, thanh toán qua Xu, VNPay Payment Gateway URL, Webhook IPN HMAC-SHA512.',
    apis: [
      {
        code: 'API-27',
        endpointName: 'orders/create',
        title: '5.1. API-27 – orders/create',
        desc: 'Khởi tạo đơn hàng mua khóa học hoặc tài nguyên (tự động chiết khấu theo hạng Gold 10%, Supreme VIP 30%).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/orders',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'OrdersController.createOrder',
        inputs: [
          { stt: 1, name: 'items', type: 'object[]', required: 'x', desc: 'Mảng các mặt hàng (itemType, courseId, resourceId)' },
          { stt: 2, name: 'paymentMethod', type: 'string', required: 'x', desc: 'CREDITS | VNPAY | MOMO | FREE' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Chi tiết đơn hàng vừa khởi tạo' },
        ],
      },
      {
        code: 'API-28',
        endpointName: 'orders/pay-credits',
        title: '5.2. API-28 – orders/pay-credits',
        desc: 'Thanh toán đơn hàng ngay bằng Xu Credits và tự động kích hoạt Enrollment ACTIVE.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/orders/:orderId/pay-credits',
        method: 'POST',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'OrdersController.payWithCredits',
        inputs: [
          { stt: 1, name: 'orderId', type: 'string (URL Param)', required: 'x', desc: 'UUID đơn hàng' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Kết quả thanh toán thành công' },
        ],
      },
      {
        code: 'API-29',
        endpointName: 'orders/my-orders',
        title: '5.3. API-29 – orders/my-orders',
        desc: 'Xem lịch sử đơn hàng của học viên hiện tại.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/orders/my-orders',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'OrdersController.getMyOrders',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách đơn hàng' },
        ],
      },
      {
        code: 'API-30',
        endpointName: 'payments/vnpay/create-url',
        title: '5.4. API-30 – payments/vnpay/create-url',
        desc: 'Khởi tạo URL chuyển hướng thanh toán cổng VNPay kèm chữ ký số HMAC-SHA512.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/payments/vnpay/create-url',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'PaymentsController.createVNPayPaymentUrl',
        inputs: [
          { stt: 1, name: 'orderId', type: 'string', required: 'x', desc: 'UUID đơn hàng' },
          { stt: 2, name: 'bankCode', type: 'string', required: '', desc: 'Mã ngân hàng (VNPAYQR, VNBANK, INTCARD)' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: '{"paymentUrl": "https://sandbox.vnpayment.vn/..."}' },
        ],
      },
      {
        code: 'API-31',
        endpointName: 'payments/vnpay/ipn',
        title: '5.5. API-31 – payments/vnpay/ipn',
        desc: 'Webhook IPN xác minh chữ ký số HMAC-SHA512 từ VNPay, kích hoạt đơn hàng và phân quyền.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/payments/vnpay/ipn',
        method: 'GET',
        header: 'Không yêu cầu token người dùng',
        controller: 'PaymentsController.handleVNPayIpn',
        inputs: [
          { stt: 1, name: 'vnp_TxnRef', type: 'string', required: 'x', desc: 'Mã đơn hàng đối soát' },
          { stt: 2, name: 'vnp_Amount', type: 'string', required: 'x', desc: 'Số tiền thanh toán (nhân 100)' },
          { stt: 3, name: 'vnp_ResponseCode', type: 'string', required: 'x', desc: 'Mã kết quả (00: thành công)' },
          { stt: 4, name: 'vnp_SecureHash', type: 'string', required: 'x', desc: 'Chữ ký số HMAC-SHA512' },
        ],
        outputs: [
          { stt: 1, name: 'RspCode', type: 'string', required: 'x', desc: '00 (Thành công) | 97 (Sai chữ ký)' },
          { stt: 2, name: 'Message', type: 'string', required: 'x', desc: 'Confirm Success' },
        ],
      },
      {
        code: 'API-32',
        endpointName: 'payments/vnpay/return',
        title: '5.6. API-32 – payments/vnpay/return',
        desc: 'Tiếp nhận người dùng hoàn tất thanh toán từ VNPay và chuyển hướng về trang cảm ơn frontend.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/payments/vnpay/return',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'PaymentsController.handleVNPayReturn',
        inputs: [],
        outputs: [
          { stt: 1, name: 'Redirect', type: 'HTTP 302', required: 'x', desc: 'Chuyển hướng về http://localhost:3000/orders/success' },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_06_Forum_Community',
    moduleName: 'PHÂN HỆ DIỄN ĐÀN & TƯƠNG TÁC CỘNG ĐỒNG (FORUM & COMMUNITY)',
    description: 'Bao gồm chuyên mục, bài viết, thăm dò ý kiến PK Poll, bình luận thảo luận, thông báo và tin nhắn realtime.',
    apis: [
      {
        code: 'API-33',
        endpointName: 'forum/boards',
        title: '6.1. API-33 – forum/boards',
        desc: 'Lấy danh sách các chuyên mục diễn đàn kèm số lượng bài viết và điểm nhiệt kế.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts/boards',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'PostsController.listBoards',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách chuyên mục' },
        ],
      },
      {
        code: 'API-34',
        endpointName: 'forum/posts/list',
        title: '6.2. API-34 – forum/posts/list',
        desc: 'Lấy danh sách bài viết thảo luận theo chuyên mục hoặc tab bộ lọc.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'PostsController.listPosts',
        inputs: [
          { stt: 1, name: 'boardId', type: 'string', required: '', desc: 'Mã chuyên mục' },
          { stt: 2, name: 'category', type: 'string', required: '', desc: 'SUMMARY | QA | ESSENCE | VOTING' },
          { stt: 3, name: 'page', type: 'int', required: '', desc: 'Trang truy vấn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách bài viết' },
          { stt: 2, name: 'pagination', type: 'object', required: 'x', desc: 'Phân trang' },
        ],
      },
      {
        code: 'API-35',
        endpointName: 'forum/posts/detail',
        title: '6.3. API-35 – forum/posts/detail',
        desc: 'Lấy nội dung chi tiết bài viết diễn đàn, danh sách ảnh đính kèm và bình chọn.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts/:id',
        method: 'GET',
        header: 'Không bắt buộc',
        controller: 'PostsController.getPostDetail',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID bài viết' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Chi tiết bài viết' },
        ],
      },
      {
        code: 'API-36',
        endpointName: 'forum/posts/create',
        title: '6.4. API-36 – forum/posts/create',
        desc: 'Đăng bài viết mới trên diễn đàn, hỗ trợ đính kèm ảnh và tùy chọn thăm dò ý kiến Poll.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'PostsController.createPost',
        inputs: [
          { stt: 1, name: 'boardId', type: 'string', required: 'x', desc: 'Mã chuyên mục' },
          { stt: 2, name: 'title', type: 'string', required: 'x', desc: 'Tiêu đề bài viết' },
          { stt: 3, name: 'content', type: 'string', required: 'x', desc: 'Nội dung Markdown' },
          { stt: 4, name: 'images', type: 'string[]', required: '', desc: 'Mảng URL hình ảnh đính kèm' },
          { stt: 5, name: 'pollOptions', type: 'string[]', required: '', desc: 'Mảng phương án bình chọn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Bài viết vừa tạo' },
        ],
      },
      {
        code: 'API-37',
        endpointName: 'forum/posts/vote',
        title: '6.5. API-37 – forum/posts/vote',
        desc: 'Bỏ phiếu cho phương án trong bài thăm dò ý kiến (mỗi người 1 phiếu duy nhất).',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts/:id/vote',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'PostsController.votePoll',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID bài viết' },
          { stt: 2, name: 'optionId', type: 'string (Body)', required: 'x', desc: 'UUID phương án được chọn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Kết quả số phiếu mới nhất' },
        ],
      },
      {
        code: 'API-38',
        endpointName: 'forum/posts/comments',
        title: '6.6. API-38 – forum/posts/comments',
        desc: 'Gửi bình luận phản hồi dưới bài viết diễn đàn.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/posts/:id/comments',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'PostsController.createComment',
        inputs: [
          { stt: 1, name: 'id', type: 'string (URL Param)', required: 'x', desc: 'UUID bài viết' },
          { stt: 2, name: 'content', type: 'string (Body)', required: 'x', desc: 'Nội dung bình luận' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Bình luận vừa đăng' },
        ],
      },
      {
        code: 'API-39',
        endpointName: 'notifications/list',
        title: '6.7. API-39 – notifications/list',
        desc: 'Lấy toàn bộ thông báo hệ thống và tương tác của học viên.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/notifications',
        method: 'GET',
        header: 'Authorization: Bearer {{access_token}}',
        controller: 'NotificationsController.listNotifications',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách thông báo' },
        ],
      },
      {
        code: 'API-40',
        endpointName: 'chat/messages',
        title: '6.8. API-40 – chat/messages',
        desc: 'Lấy lịch sử tin nhắn trò chuyện cộng đồng và phát tin nhắn thời gian thực.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/chat/messages',
        method: 'GET' as any,
        header: 'Content-Type: application/json\nAuthorization: Bearer {{access_token}}',
        controller: 'ChatController.handleMessages',
        inputs: [
          { stt: 1, name: 'message', type: 'string', required: 'x', desc: 'Nội dung tin nhắn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Tin nhắn vừa phát tán' },
        ],
      },
    ],
  },
  {
    filePrefix: '02_Tai_Lieu_API_07_Admin',
    moduleName: 'PHÂN HỆ QUẢN TRỊ HỆ THỐNG (ADMIN & SYSTEM MANAGEMENT)',
    description: 'Bao gồm thống kê doanh thu Dashboard, quản trị người dùng, khóa học, tài nguyên, duyệt hoàn tiền và audit logs.',
    apis: [
      {
        code: 'API-41',
        endpointName: 'admin/dashboard/stats',
        title: '7.1. API-41 – admin/dashboard/stats',
        desc: 'Lấy số liệu thống kê tổng hợp doanh thu VND, doanh số Xu, số học viên, khóa học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/dashboard/stats',
        method: 'GET',
        header: 'Authorization: Bearer {{admin_token}}',
        controller: 'AdminController.getDashboardStats',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Báo cáo số liệu tổng hợp' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'totalRevenueVnd', type: 'int', required: 'x', desc: 'Tổng doanh thu tiền mặt VND' },
              { stt: 2, name: 'totalCreditsSpent', type: 'int', required: 'x', desc: 'Tổng lượng Xu đã tiêu' },
              { stt: 3, name: 'totalUsers', type: 'int', required: 'x', desc: 'Tổng số người dùng đăng ký' },
              { stt: 4, name: 'totalCourses', type: 'int', required: 'x', desc: 'Tổng số khóa học' },
              { stt: 5, name: 'activeEnrollments', type: 'int', required: 'x', desc: 'Số lượt sở hữu đang hoạt động' },
            ],
          },
        ],
      },
      {
        code: 'API-42',
        endpointName: 'admin/users/list',
        title: '7.2. API-42 – admin/users/list',
        desc: 'Tra cứu danh sách người dùng, thay đổi vai trò RBAC hoặc khóa tài khoản vi phạm.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/users',
        method: 'GET',
        header: 'Authorization: Bearer {{admin_token}}',
        controller: 'AdminController.listUsers',
        inputs: [
          { stt: 1, name: 'search', type: 'string', required: '', desc: 'Tìm theo email, tên' },
          { stt: 2, name: 'role', type: 'string', required: '', desc: 'USER | INSTRUCTOR | ADMIN' },
          { stt: 3, name: 'page', type: 'int', required: '', desc: 'Trang truy vấn' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách người dùng' },
        ],
      },
      {
        code: 'API-43',
        endpointName: 'admin/courses/manage',
        title: '7.3. API-43 – admin/courses/manage',
        desc: 'Tạo mới, chỉnh sửa thông tin giá và xuất bản khóa học.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/courses',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{admin_token}}',
        controller: 'AdminController.manageCourses',
        inputs: [
          { stt: 1, name: 'code', type: 'string', required: 'x', desc: 'Mã khóa học [485]' },
          { stt: 2, name: 'title', type: 'string', required: 'x', desc: 'Tên khóa học' },
          { stt: 3, name: 'priceVnd', type: 'int', required: 'x', desc: 'Giá VND' },
          { stt: 4, name: 'originalCredits', type: 'int', required: 'x', desc: 'Giá Xu' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Khóa học sau khi lưu' },
        ],
      },
      {
        code: 'API-44',
        endpointName: 'admin/resources/manage',
        title: '7.4. API-44 – admin/resources/manage',
        desc: 'Quản lý thêm, sửa tài nguyên đồ họa và liên kết ID file Google Drive.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/resources',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{admin_token}}',
        controller: 'AdminController.manageResources',
        inputs: [
          { stt: 1, name: 'title', type: 'string', required: 'x', desc: 'Tên tài nguyên' },
          { stt: 2, name: 'driveFileId', type: 'string', required: 'x', desc: 'ID file trên Google Drive' },
          { stt: 3, name: 'priceCredits', type: 'int', required: 'x', desc: 'Giá Xu' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Tài nguyên vừa tạo' },
        ],
      },
      {
        code: 'API-45',
        endpointName: 'admin/orders/refund',
        title: '7.5. API-45 – admin/orders/refund',
        desc: 'Hoàn tiền đơn hàng, thu hồi quyền Enrollment thành REVOKED và tự động xóa quyền Google Drive.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/orders/:orderId/refund',
        method: 'POST',
        header: 'Content-Type: application/json\nAuthorization: Bearer {{admin_token}}',
        controller: 'AdminController.refundOrder',
        inputs: [
          { stt: 1, name: 'orderId', type: 'string (URL Param)', required: 'x', desc: 'UUID đơn hàng' },
          { stt: 2, name: 'reason', type: 'string (Body)', required: 'x', desc: 'Lý do hoàn tiền' },
        ],
        outputs: [
          { stt: 1, name: 'data', type: 'object', required: 'x', desc: 'Kết quả hoàn tiền' },
        ],
        children: [
          {
            title: '- Mô tả object data:',
            fields: [
              { stt: 1, name: 'orderId', type: 'string', required: 'x', desc: 'UUID đơn hàng' },
              { stt: 2, name: 'status', type: 'string', required: 'x', desc: 'REFUNDED' },
              { stt: 3, name: 'enrollmentsRevoked', type: 'int', required: 'x', desc: 'Số enrollment bị thu hồi' },
              { stt: 4, name: 'driveGrantsRevoked', type: 'int', required: 'x', desc: 'Số quyền Drive bị xóa' },
            ],
          },
        ],
      },
      {
        code: 'API-46',
        endpointName: 'admin/audit-logs',
        title: '7.6. API-46 – admin/audit-logs',
        desc: 'Tra cứu nhật ký kiểm toán hành vi quản trị hệ thống nhạy cảm.',
        baseUrl: 'http://localhost:4000/api/v1',
        path: '/admin/audit-logs',
        method: 'GET',
        header: 'Authorization: Bearer {{admin_token}}',
        controller: 'AdminController.getAuditLogs',
        inputs: [],
        outputs: [
          { stt: 1, name: 'data', type: 'object[]', required: 'x', desc: 'Danh sách nhật ký kiểm toán' },
        ],
      },
    ],
  },
];

// Hàm tạo bảng Mô tả (Table 1 trong Ảnh 2)
function createDescTable(api: ApiSpec): Table {
  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Mô tả', bold: true, size: 22, font: 'Times New Roman' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: api.desc, size: 22, font: 'Times New Roman' })],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Base url: `, size: 22, font: 'Times New Roman' }),
                new TextRun({ text: api.baseUrl, color: '004B87', size: 22, font: 'Times New Roman' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Path: `, size: 22, font: 'Times New Roman' }),
                new TextRun({ text: api.path, bold: true, color: 'C00000', size: 22, font: 'Times New Roman' }),
              ],
            }),
          ],
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
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Method', bold: true, size: 22, font: 'Times New Roman' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: api.method,
                  bold: true,
                  size: 22,
                  font: 'Times New Roman',
                  color: api.method === 'GET' ? '2E75B6' : (api.method === 'POST' ? '385723' : 'C00000'),
                }),
              ],
            }),
          ],
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
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Header', bold: true, size: 22, font: 'Times New Roman' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: api.header.split('\n').map(
            (h) =>
              new Paragraph({
                children: [new TextRun({ text: h, size: 22, font: 'Times New Roman', color: '595959' })],
              })
          ),
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
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Hàm SDK', bold: true, size: 22, font: 'Times New Roman' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: api.controller, bold: true, color: '1F497D', size: 22, font: 'Times New Roman' })],
            }),
          ],
        }),
      ],
    }),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Hàm tạo bảng Param 5 cột chuẩn (STT, Tên trường, Kiểu dữ liệu, Bắt buộc, Mô tả)
function createParamTable(params: ParamDef[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, size: 21, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Tên trường', bold: true, size: 21, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        width: { size: 18, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Kiểu dữ liệu', bold: true, size: 21, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bắt buộc', bold: true, size: 21, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        width: { size: 38, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: cellMargins,
        shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Mô tả', bold: true, size: 21, font: 'Times New Roman' })] })],
      }),
    ],
  });

  const dataRows: TableRow[] = params.map((p) => {
    const descLines = p.desc.split('\n');
    const descParagraphs = descLines.map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 21, font: 'Times New Roman' })],
        })
    );

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(p.stt), size: 21, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 24, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: p.name, bold: true, color: '1F497D', size: 21, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: p.type, color: '385723', size: 21, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.required, bold: true, size: 21, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: cellMargins,
          children: descParagraphs,
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function buildApiDocument(title: string, subTitle: string, apis: ApiSpec[]): Document {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 30, // 15pt
          font: 'Times New Roman',
          color: '1F497D',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 350 },
      children: [
        new TextRun({
          text: subTitle,
          italics: true,
          size: 22,
          font: 'Times New Roman',
          color: '595959',
        }),
      ],
    })
  );

  for (const api of apis) {
    // Heading: 1.1. API-01 – auth/register (xanh đậm như ảnh 2)
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: api.title,
            bold: true,
            size: 26,
            font: 'Times New Roman',
            color: '004B87',
          }),
        ],
      })
    );

    // Section "Mô tả"
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: 'Mô tả',
            bold: true,
            size: 24,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      }),
      createDescTable(api)
    );

    // Section "Input"
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: 'Input',
            bold: true,
            size: 24,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      })
    );

    if (api.inputs.length > 0) {
      children.push(createParamTable(api.inputs));
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: '(Không có tham số Body hoặc Query)',
              italics: true,
              size: 21,
              font: 'Times New Roman',
              color: '595959',
            }),
          ],
        })
      );
    }

    // Section "Output"
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: 'Output',
            bold: true,
            size: 24,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
      }),
      createParamTable(api.outputs)
    );

    // Child breakdowns (e.g. - Mô tả object data:)
    if (api.children && api.children.length > 0) {
      for (const ch of api.children) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: ch.title,
                bold: true,
                italics: true,
                size: 22,
                font: 'Times New Roman',
                color: '333333',
              }),
            ],
          }),
          createParamTable(ch.fields)
        );
      }
    }
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
  const allApis: ApiSpec[] = [];

  // 1. Xuất từng file Word riêng theo từng phân hệ (module)
  for (const m of apiModules) {
    allApis.push(...m.apis);
    const doc = buildApiDocument(
      `TÀI LIỆU ĐẶC TẢ API - ${m.moduleName}`,
      `Dự án: Nền tảng chia sẻ Khóa học & Tài nguyên Đồ họa Nghệ thuật (Whale / GGC Studio)\nBase URL: http://localhost:4000/api/v1`,
      m.apis
    );

    const buffer = await Packer.toBuffer(doc);
    const filePath = path.resolve(`tailieu_word/${m.filePrefix}.docx`);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Đã xuất: ${filePath} (${m.apis.length} APIs, ${buffer.length} bytes)`);
  }

  // 2. Xuất thêm 1 file Tổng hợp toàn bộ (Merged Master Docx)
  const masterDoc = buildApiDocument(
    'TÀI LIỆU ĐẶC TẢ TOÀN BỘ REST API HỆ THỐNG WHALE (TỔNG HỢP)',
    'Dự án: Nền tảng chia sẻ Khóa học & Tài nguyên Đồ họa Nghệ thuật (Whale / GGC Studio)\nTổng hợp toàn bộ 46 APIs chuẩn hóa | Base URL: http://localhost:4000/api/v1',
    allApis
  );
  const masterBuffer = await Packer.toBuffer(masterDoc);
  const masterPath = path.resolve('tailieu_word/02_Tai_Lieu_API_Toan_Bo_Hop_Nhat.docx');
  fs.writeFileSync(masterPath, masterBuffer);
  console.log(`🎉 Đã xuất thành công Master File: ${masterPath} (${allApis.length} APIs, ${masterBuffer.length} bytes)`);
}

run().catch(console.error);
