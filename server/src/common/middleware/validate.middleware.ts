import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/app-error.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const firstMsg = details[0]?.message || 'Dữ liệu gửi lên không đúng định dạng';
        next(new BadRequestError(firstMsg, 'VALIDATION_ERROR', details));
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const firstMsg = details[0]?.message || 'Tham số truy vấn URL không hợp lệ';
        next(new BadRequestError(firstMsg, 'VALIDATION_ERROR', details));
        return;
      }
      next(error);
    }
  };
}
