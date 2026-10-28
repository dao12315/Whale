# 🐋 WHALE / SHANHAI STUDIO (一帧山海)
### NỀN TẢNG CHIA SẺ KHÓA HỌC & TÀI NGUYÊN ĐỒ HỌA NGHỆ THUẬT KỸ THUẬT SỐ

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-green?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Backend%20Tests-100%25%20PASS-brightgreen)](file:///d:/thuc_tap/img/Whale/server/tests/run-all-tests.ts)

---

## 🌟 GIỚI THIỆU DỰ ÁN
**Whale (一帧山海 / Shanhai Studio)** là nền tảng thương mại điện tử và học tập trực tuyến cao cấp dành riêng cho cộng đồng nghệ sĩ đồ họa, concept art, kỹ xảo 3D (Blender, Unreal Engine), chỉnh màu điện ảnh (DaVinci Resolve) và kỹ xảo điện ảnh.

Hệ thống được thiết kế theo tiêu chuẩn kiến trúc phần mềm chuyên nghiệp của Senior Full-stack Engineer, giải quyết trọn vẹn bài toán:
- **Phân phối nội dung trả phí:** Bảo vệ video bài giảng và tự động cấp/thu hồi quyền truy cập thư mục Google Drive (file PSD phân lớp, cọ vẽ Photoshop/Procreate, 3D Assets).
- **Thanh toán đa phương thức:** Hỗ trợ thanh toán bằng Tiền ảo nội bộ (Xu / Credits) và Cổng thanh toán trực tuyến VNPay qua Webhook bảo mật chữ ký số HMAC-SHA512.
- **Trang quản trị toàn diện (Admin Portal):** Quản lý doanh thu, khóa học, tài nguyên, người dùng, hoàn tiền và nhật ký kiểm toán (Audit Logs).

---

## 📐 KIẾN TRÚC HỆ THỐNG FULL-STACK

```mermaid
graph LR
    subgraph Frontend [Client Tier (Port 3000)]
        UI[React 19 + Tailwind v4]
        Admin[Admin Portal 7 Phân Hệ]
        ClientApi[apiClient: Silent Refresh Mutex]
        UI --> ClientApi
        Admin --> ClientApi
    end

    subgraph Backend [Backend API Tier (Port 4000)]
        Express[Express 4.21 REST API]
        AuthGuard[JWT + RBAC + Entitlement Guard]
        Services[Auth, Courses, Orders, Drive, Webhook]
        Express --> AuthGuard --> Services
    end

    subgraph Storage [Data & Cloud Services]
        DB[(PostgreSQL / In-Memory Store)]
        DriveApi[Google Drive Service Account]
        VNPay[VNPay Sandbox IPN]
    end

    ClientApi -- REST API + JSON --> Express
    Services --> DB
    Services -- Permission API --> DriveApi
    Services -- HMAC-SHA512 Webhook --> VNPay
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH (QUICKSTART)

### 1. Cài đặt thư viện phụ thuộc (Dependencies)
```powershell
npm install
```

### 2. Thiết lập cấu hình môi trường
Sao chép file `.env.example` thành `.env`:
```powershell
cp .env.example .env
```
*(File mẫu đã có sẵn đầy đủ cấu hình JWT bí mật, Sandbox VNPay và cổng dịch vụ để chạy ngay lập tức mà không cần chỉnh sửa)*.

### 3. Khởi động Máy chủ Backend (Port 4000)
```powershell
npm run server
# Hoặc chế độ xem trực tiếp code:
npm run server:dev
```

### 4. Khởi động Giao diện Frontend (Port 3000)
Mở cửa sổ terminal thứ 2 và chạy:
```powershell
npm run dev
```
Truy cập trình duyệt tại: **`http://localhost:3000`**

### 5. Chạy bộ kiểm thử tự động Backend (100% PASS)
```powershell
npm run test:backend
```

---

## 👥 TÀI KHOẢN THỬ NGHIỆM MẪU

| Vai trò | Email đăng nhập | Mật khẩu | Số dư Xu | Quyền hạn |
| :--- | :--- | :---: | :---: | :--- |
| **Quản trị viên (ADMIN)** | `admin@shanhai.studio` | `Admin@123456` | 9,999 Xu | Toàn quyền Quản trị, duyệt khóa học, hoàn tiền, cấp quyền Drive, xem Logs. |
| **Giảng viên (INSTRUCTOR)** | `instructor@shanhai.studio` | `Instructor@123` | 500 Xu | Tạo khóa học, tải tài nguyên. |
| **Học viên (STUDENT)** | `user@shanhai.studio` | `User@123456` | 1,000 Xu | Mua khóa học, xem video stream, truy cập Google Drive. |

---

## 📚 HỆ THỐNG TÀI LIỆU KỸ THUẬT ĐẦY ĐỦ (DOCUMENTATION)

Toàn bộ quá trình phát triển được tài liệu hóa chi tiết trong thư mục [`docs/`](file:///d:/thuc_tap/img/Whale/docs):

1. **[Cẩm Nang Toàn Diện (Master Guide)](file:///d:/thuc_tap/img/Whale/docs/MASTER_GUIDE.md):** Kiến trúc, sơ đồ luồng, hướng dẫn setup chi tiết, xử lý sự cố.
2. **[Phân Tích Hiện Trạng (Phase 0)](file:///d:/thuc_tap/img/Whale/docs/00-frontend-analysis.md):** Khảo sát UI/UX, phân loại dữ liệu, phát hiện lỗ hổng logic.
3. **[Thiết Kế CSDL & Prisma (Phase 1)](file:///d:/thuc_tap/img/Whale/docs/01-database.md):** 21 Models, 12 Enums, quan hệ dữ liệu và Indexes.
4. **[Đặc Tả API & OpenAPI (Phase 2)](file:///d:/thuc_tap/img/Whale/docs/02-api.md):** 42 API endpoints, chuẩn hóa `ERROR_CODE`, file [`docs/openapi.yaml`](file:///d:/thuc_tap/img/Whale/docs/openapi.yaml).
5. **[Bảo Mật & Phân Quyền (Phase 3)](file:///d:/thuc_tap/img/Whale/docs/03-security.md):** RBAC, Google Drive Service Account, VNPay HMAC-SHA512.
6. **[Cài Đặt Backend & Test (Phase 4)](file:///d:/thuc_tap/img/Whale/docs/04-backend.md):** Kiến trúc phân tầng Express, Seed data, 3 bộ test tự động.
7. **[Trang Quản Trị Admin (Phase 5)](file:///d:/thuc_tap/img/Whale/docs/05-admin.md):** 7 phân hệ quản trị trực quan tích hợp Design System website chính.
8. **[Tích Hợp Frontend - Backend (Phase 6)](file:///d:/thuc_tap/img/Whale/docs/06-frontend-integration.md):** `apiClient` tập trung, Silent Refresh Token, UX Shimmer Skeleton, Video Stream Watermark.

---

## 🛡️ BẢN QUYỀN & GIẤY PHÉP
Dự án được xây dựng và bảo trì bởi đội ngũ kỹ thuật Whale / Shanhai Studio. Mọi quyền được bảo lưu © 2026.
