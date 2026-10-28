import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
    return;
  }

  // Lỗi không xác định (Internal Server Error)
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
}
