import { Request, Response, NextFunction } from 'express';
import { JwtUtil, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/app-error.js';

// Mở rộng kiểu Express Request để lưu thông tin user đã xác thực
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Vui lòng cung cấp Access Token hợp lệ (Bearer token)'));
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = JwtUtil.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = JwtUtil.verifyAccessToken(token);
    } catch {
      // Bỏ qua lỗi với optional auth
    }
  }
  next();
}
