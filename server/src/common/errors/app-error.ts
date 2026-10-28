export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa xác thực hoặc token không hợp lệ', code = 'UNAUTHORIZED', details?: unknown) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Không có quyền truy cập tài nguyên này', code = 'FORBIDDEN', details?: unknown) {
    super(message, 403, code, details);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Bạn chưa mở khóa nội dung này. Vui lòng mua khóa học hoặc tài nguyên.', details?: unknown) {
    super(message, 403, 'PAYMENT_REQUIRED', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên', code = 'NOT_FOUND', details?: unknown) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại hoặc bị xung đột', code = 'CONFLICT', details?: unknown) {
    super(message, 409, code, details);
  }
}
