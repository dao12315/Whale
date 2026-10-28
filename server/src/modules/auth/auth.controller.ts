import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, GoogleAuthDto } from './auth.dto.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: RegisterDto = req.body;
      const result = await this.authService.register(dto);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDto = req.body;
      const result = await this.authService.login(dto);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: GoogleAuthDto = req.body;
      const result = await this.authService.googleAuth(dto);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        data: {
          accessToken: result.accessToken,
          user: result.user,
          isNewUser: result.isNewUser,
          generatedPassword: result.generatedPassword,
          emailSent: result.emailSent,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Đọc Refresh Token từ HttpOnly Cookie hoặc request body
      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await this.authService.rotateRefreshToken(rawRefreshToken);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await this.authService.logout(rawRefreshToken);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.json({
        data: {
          message: 'Đăng xuất thành công',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    res.json({
      data: {
        user: req.user,
      },
    });
  };

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày bảo vệ phiên
    });
  }
}
