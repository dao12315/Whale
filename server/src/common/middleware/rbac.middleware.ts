import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

export function requireRole(...allowedRoles: Array<'USER' | 'INSTRUCTOR' | 'ADMIN'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Bạn cần đăng nhập để truy cập tài nguyên này'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Bạn không có quyền truy cập chức năng này. Quyền yêu cầu: [${allowedRoles.join(', ')}], quyền hiện tại: [${req.user.role}]`
        )
      );
      return;
    }

    next();
  };
}
