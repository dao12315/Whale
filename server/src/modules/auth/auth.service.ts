import jwt from 'jsonwebtoken';
import { IAuthRepository } from './auth.repository.js';
import { RegisterDto, LoginDto, GoogleAuthDto } from './auth.dto.js';
import { CryptoUtil } from '../../common/utils/crypto.js';
import { JwtUtil } from '../../common/utils/jwt.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../common/errors/app-error.js';
import { UserEntity, RefreshTokenEntity } from '../../database/database.store.js';
import { EmailService } from '../../common/services/email.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    role: 'USER' | 'ADMIN';
    tier: 'FREE' | 'GOLD' | 'SUPREME';
    googleEmail: string | null;
    creditsBalance: number;
    avatarUrl: string;
  };
  isNewUser?: boolean;
  generatedPassword?: string;
  emailSent?: boolean;
}

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email này đã được đăng ký tài khoản');
    }

    const newUser: UserEntity = {
      id: `usr_${CryptoUtil.randomString(8)}`,
      email: dto.email.toLowerCase(),
      passwordHash: CryptoUtil.hashPassword(dto.password),
      nickname: dto.nickname,
      role: 'USER',
      tier: 'FREE',
      googleEmail: dto.googleEmail || null,
      creditsBalance: 50, // Thưởng 50 xu chào mừng thành viên mới
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.authRepo.createUser(newUser);
    return this.generateAuthTokens(newUser);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = CryptoUtil.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');
    }

    return this.generateAuthTokens(user);
  }

  async googleAuth(dto: GoogleAuthDto): Promise<AuthTokens> {
    let googleEmail = (dto.googleEmail || '').trim().toLowerCase();
    let nickname = dto.nickname?.trim() || '';
    let avatarUrl = dto.avatarUrl?.trim() || '';

    // Nếu gửi kèm idToken từ thư viện Google Sign-in, giải mã thông tin user
    if (dto.idToken) {
      try {
        const decoded: any = jwt.decode(dto.idToken);
        if (decoded) {
          if (decoded.email) googleEmail = decoded.email.toLowerCase();
          if (!nickname && (decoded.name || decoded.given_name)) {
            nickname = decoded.name || decoded.given_name;
          }
          if (!avatarUrl && decoded.picture) {
            avatarUrl = decoded.picture;
          }
        }
      } catch (err: any) {
        console.warn('[AuthService.googleAuth] Giải mã Google idToken:', err?.message);
      }
    }

    if (!googleEmail) {
      googleEmail = `google_${CryptoUtil.randomString(6)}@gmail.com`;
    }
    if (!nickname) {
      nickname = googleEmail.split('@')[0];
    }
    if (!avatarUrl) {
      avatarUrl = `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80`;
    }

    let user = await this.authRepo.findByEmail(googleEmail);
    let isNewUser = false;
    let generatedPassword = '';

    if (!user) {
      isNewUser = true;
      // Sinh mật khẩu ngẫu nhiên an toàn (chữ hoa, số, ký tự đặc biệt)
      const randomPart = CryptoUtil.randomString(6);
      generatedPassword = `Ggc@${randomPart}!`;

      user = {
        id: `usr_g_${CryptoUtil.randomString(8)}`,
        email: googleEmail,
        passwordHash: CryptoUtil.hashPassword(generatedPassword),
        nickname: nickname,
        role: 'USER', // Luôn là USER cho tài khoản tự đăng ký
        tier: 'FREE',
        googleEmail: googleEmail,
        creditsBalance: 100, // Tặng 100 Credits cho tài khoản Google mới
        avatarUrl: avatarUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.authRepo.createUser(user);

      // Gửi email thực tế chứa mật khẩu khởi tạo về hòm thư Gmail của user (từ sender nguyendao512004@gmail.com)
      try {
        await EmailService.sendGoogleAccountCreatedEmail(googleEmail, nickname, generatedPassword);
      } catch (err: any) {
        console.warn('[googleAuth] Gửi email thất bại:', err?.message);
      }
    } else {
      if (!user.googleEmail) {
        user.googleEmail = googleEmail;
      }
      if (avatarUrl && user.avatarUrl && user.avatarUrl.includes('unsplash')) {
        user.avatarUrl = avatarUrl;
      }
    }

    const tokens = await this.generateAuthTokens(user);
    return {
      ...tokens,
      isNewUser,
      generatedPassword: isNewUser ? generatedPassword : undefined,
      emailSent: isNewUser,
    };
  }

  /**
   * Cơ chế Token Rotation & Replay Attack Prevention
   */
  async rotateRefreshToken(rawRefreshToken: string): Promise<AuthTokens> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Vui lòng cung cấp refresh token');
    }

    const tokenHash = CryptoUtil.sha256(rawRefreshToken);
    const existingToken = await this.authRepo.findRefreshToken(tokenHash);

    if (!existingToken) {
      throw new UnauthorizedError('Refresh token không tồn tại');
    }

    // PHÁT HIỆN REPLAY ATTACK: Token đã bị thu hồi trước đó mà vẫn đem dùng lại!
    if (existingToken.revokedAt) {
      console.warn(`[SECURITY ALERT] Phát hiện Replay Attack trên User: ${existingToken.userId}. Thu hồi toàn bộ session!`);
      await this.authRepo.revokeAllUserTokens(existingToken.userId);
      throw new UnauthorizedError('Phát hiện dấu hiệu xâm phạm bảo mật phiên đăng nhập. Vui lòng đăng nhập lại.');
    }

    if (new Date(existingToken.expiresAt) < new Date()) {
      throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const user = await this.authRepo.findById(existingToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // Thu hồi token cũ và cấp token mới (Token Rotation)
    const newTokens = await this.generateAuthTokens(user);
    const newTokenHash = CryptoUtil.sha256(newTokens.refreshToken);
    await this.authRepo.revokeRefreshToken(existingToken.id, newTokenHash);

    return newTokens;
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = CryptoUtil.sha256(rawRefreshToken);
      const existingToken = await this.authRepo.findRefreshToken(tokenHash);
      if (existingToken) {
        await this.authRepo.revokeRefreshToken(existingToken.id);
      }
    }
  }

  private async generateAuthTokens(user: UserEntity): Promise<AuthTokens> {
    const role: 'ADMIN' | 'USER' = user.role === 'ADMIN' ? 'ADMIN' : 'USER';

    const accessToken = JwtUtil.signAccessToken({
      sub: user.id,
      email: user.email,
      role: role,
      tier: user.tier,
    });

    const rawRefreshToken = CryptoUtil.randomString(40);
    const refreshTokenRecord: RefreshTokenEntity = {
      id: `rt_${CryptoUtil.randomString(8)}`,
      tokenHash: CryptoUtil.sha256(rawRefreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày bảo vệ phiên đăng nhập
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    };

    await this.authRepo.createRefreshToken(refreshTokenRecord);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: role,
        tier: user.tier,
        googleEmail: user.googleEmail,
        creditsBalance: user.creditsBalance,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
