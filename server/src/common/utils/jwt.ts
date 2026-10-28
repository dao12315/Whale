import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  tier: 'FREE' | 'GOLD' | 'SUPREME';
}

export interface StreamTokenPayload {
  sub: string;
  lessonId: string;
  courseId: string;
  driveFileId: string;
}

export class JwtUtil {
  static signAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: ENV.JWT_ACCESS_EXPIRATION as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, options);
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Access token không hợp lệ hoặc đã hết hạn');
    }
  }

  static signStreamToken(payload: StreamTokenPayload): string {
    const options: SignOptions = {
      expiresIn: '15m',
    };
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, options);
  }

  static verifyStreamToken(token: string): StreamTokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as StreamTokenPayload;
    } catch {
      throw new UnauthorizedError('Stream token đã hết hạn hoặc không hợp lệ');
    }
  }
}
