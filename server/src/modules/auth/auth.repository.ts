import { db, UserEntity, RefreshTokenEntity } from '../../database/database.store.js';
import { prisma } from '../../database/prisma.js';
import { CryptoUtil } from '../../common/utils/crypto.js';

export interface IAuthRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  createUser(user: UserEntity): Promise<UserEntity>;
  createRefreshToken(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revokeRefreshToken(id: string, replacedBy?: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const pgUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (pgUser) {
        return {
          id: pgUser.id,
          email: pgUser.email,
          passwordHash: pgUser.passwordHash || '',
          nickname: pgUser.name,
          role: pgUser.role as 'USER' | 'INSTRUCTOR' | 'ADMIN',
          tier: (pgUser.tier === 'ADMIN' ? 'SUPREME' : pgUser.tier) as 'FREE' | 'GOLD' | 'SUPREME',
          googleEmail: pgUser.googleEmail,
          creditsBalance: pgUser.credits,
          avatarUrl: pgUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          isActive: !pgUser.isBanned,
          createdAt: pgUser.createdAt,
          updatedAt: pgUser.updatedAt,
        };
      }
    } catch (err: any) {
      console.warn('[AuthRepository.findByEmail] Query Postgres thất bại, fallback in-memory:', err?.message);
    }

    // Fallback In-Memory
    for (const user of db.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      const pgUser = await prisma.user.findUnique({
        where: { id },
      });

      if (pgUser) {
        return {
          id: pgUser.id,
          email: pgUser.email,
          passwordHash: pgUser.passwordHash || '',
          nickname: pgUser.name,
          role: pgUser.role as 'USER' | 'INSTRUCTOR' | 'ADMIN',
          tier: (pgUser.tier === 'ADMIN' ? 'SUPREME' : pgUser.tier) as 'FREE' | 'GOLD' | 'SUPREME',
          googleEmail: pgUser.googleEmail,
          creditsBalance: pgUser.credits,
          avatarUrl: pgUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          isActive: !pgUser.isBanned,
          createdAt: pgUser.createdAt,
          updatedAt: pgUser.updatedAt,
        };
      }
    } catch (err: any) {
      console.warn('[AuthRepository.findById] Query Postgres thất bại, fallback in-memory:', err?.message);
    }

    return db.users.get(id) || null;
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    try {
      const created = await prisma.user.create({
        data: {
          email: user.email.toLowerCase(),
          passwordHash: user.passwordHash,
          name: user.nickname,
          role: user.role,
          tier: user.tier === 'FREE' ? 'FREE' : user.tier === 'GOLD' ? 'GOLD' : 'SUPREME',
          googleEmail: user.googleEmail,
          credits: user.creditsBalance,
          avatarUrl: user.avatarUrl,
        },
      });

      user.id = created.id;
      // Đồng bộ vào in-memory để giữ session
      db.users.set(user.id, user);
      return user;
    } catch (err: any) {
      console.warn('[AuthRepository.createUser] Insert Postgres thất bại, fallback in-memory:', err?.message);
      db.users.set(user.id, user);
      return user;
    }
  }

  async createRefreshToken(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    try {
      const created = await prisma.refreshToken.create({
        data: {
          userId: token.userId,
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt,
        },
      });
      token.id = created.id;
    } catch (err: any) {
      console.warn('[AuthRepository.createRefreshToken] Fallback in-memory:', err?.message);
    }

    db.refreshTokens.set(token.id, token);
    return token;
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    try {
      const pgToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (pgToken) {
        return {
          id: pgToken.id,
          tokenHash: pgToken.tokenHash,
          userId: pgToken.userId,
          expiresAt: pgToken.expiresAt,
          revokedAt: pgToken.revokedAt,
          replacedBy: pgToken.replacedByToken,
          createdAt: pgToken.createdAt,
        };
      }
    } catch (err: any) {
      console.warn('[AuthRepository.findRefreshToken] Fallback in-memory:', err?.message);
    }

    for (const token of db.refreshTokens.values()) {
      if (token.tokenHash === tokenHash) {
        return token;
      }
    }
    return null;
  }

  async revokeRefreshToken(id: string, replacedBy?: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { id },
        data: { revokedAt: new Date(), replacedByToken: replacedBy || null },
      }).catch(() => {});
    } catch {
      // Ignore
    }

    const token = db.refreshTokens.get(id);
    if (token) {
      token.revokedAt = new Date();
      token.replacedBy = replacedBy || null;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    } catch {
      // Ignore
    }

    for (const token of db.refreshTokens.values()) {
      if (token.userId === userId) {
        token.revokedAt = new Date();
      }
    }
  }
}
