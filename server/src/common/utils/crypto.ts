import crypto from 'crypto';

/**
 * Utility băm mật khẩu và chữ ký số.
 * Senior note: Dùng crypto.scryptSync có salt ngẫu nhiên 16 bytes và chi phí bộ nhớ cao (N=16384, r=8, p=1)
 * để chống tấn công brute-force phần cứng tương tự Argon2, chạy trực tiếp trên Node core mà không cần C++ addon.
 */
export class CryptoUtil {
  /**
   * Băm mật khẩu kèm salt ngẫu nhiên
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Xác thực mật khẩu
   */
  static verifyPassword(password: string, combinedHash: string): boolean {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  /**
   * Băm chuỗi bằng SHA-256 (dùng cho Refresh Token trong DB)
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Tạo chữ ký HMAC-SHA512 (dùng cho Webhook thanh toán VNPay)
   */
  static hmacSha512(secretKey: string, data: string): string {
    return crypto.createHmac('sha512', secretKey).update(Buffer.from(data, 'utf-8')).digest('hex');
  }

  /**
   * Xác thực chữ ký HMAC-SHA512 chống timing attack
   */
  static verifyHmacSha512(secretKey: string, data: string, expectedChecksum: string): boolean {
    const actual = this.hmacSha512(secretKey, data);
    if (actual.length !== expectedChecksum.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actual.toLowerCase()), Buffer.from(expectedChecksum.toLowerCase()));
  }

  /**
   * Tạo chuỗi ngẫu nhiên an toàn (Token, Idempotency key)
   */
  static randomString(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Tạo UUID v4 chuẩn RFC 4122
   */
  static randomUUID(): string {
    return crypto.randomUUID();
  }
}
