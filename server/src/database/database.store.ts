import { CryptoUtil } from '../common/utils/crypto.js';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  tier: 'FREE' | 'GOLD' | 'SUPREME';
  googleEmail: string | null;
  creditsBalance: number;
  avatarUrl: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export interface LessonEntity {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  isFreePreview: boolean;
  sortOrder: number;
  driveFileId: string;
}

export interface CourseEntity {
  id: string;
  code: string;
  title: string;
  titleZh?: string;
  subtitle?: string;
  category: string;
  instructor: string;
  instructorRole?: string;
  thumbnail: string;
  originalPrice: number;
  goldPrice: number;
  supremePrice: number;
  commentsCount: number;
  viewsCount: number;
  likesCount: number;
  description: string;
  tags: string[];
  driveFolderId: string;
  isPublished: boolean;
  eventDate?: string;
  isFree?: boolean;
  originalUrl?: string;
  priceVnd?: number;
  authorAvatar?: string;
  publishedTimeAgo?: string;
  chapters?: {
    id: string;
    title: string;
    duration: string;
    isFreePreview?: boolean;
  }[];
  createdAt: Date;
}

export interface ResourceEntity {
  id: string;
  title: string;
  category: string;
  format: string;
  fileSizeMb: number;
  downloadCount: number;
  priceCredits: number;
  isFree: boolean;
  driveFileId: string;
  thumbnail: string;
  description: string;
  createdAt: Date;
}

export interface OrderEntity {
  id: string;
  orderCode: string;
  userId: string;
  itemType: 'COURSE' | 'RESOURCE';
  courseId?: string | null;
  resourceId?: string | null;
  totalAmount: number; // Tiền VND hoặc Credits
  currency: 'VND' | 'CREDITS';
  paymentMethod: 'VNPAY' | 'MOMO' | 'CREDITS';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  transactionId?: string | null;
  idempotencyKey?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEntity {
  id: string;
  orderId: string;
  gateway: 'VNPAY' | 'MOMO' | 'CREDITS';
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  rawResponse?: unknown;
  createdAt: Date;
}

export interface EnrollmentEntity {
  id: string;
  userId: string;
  courseId?: string | null;
  resourceId?: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriveAccessGrantEntity {
  id: string;
  enrollmentId: string;
  userId: string;
  driveFileOrFolderId: string;
  googleEmail: string;
  permissionId: string;
  status: 'ACTIVE' | 'REVOKED';
  grantedAt: Date;
  revokedAt: Date | null;
}

export interface AuditLogEntity {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  createdAt: Date;
}

export interface ForumPostEntity {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Singleton In-Memory Database Store
 * Senior note: Đây là kiến trúc In-Memory Database Store chuẩn hóa hỗ trợ
 * kiểm thử tự động, dev offline, và sẵn sàng cắm Adapter Prisma cho PostgreSQL.
 */
export class DatabaseStore {
  private static instance: DatabaseStore;

  public users: Map<string, UserEntity> = new Map();
  public refreshTokens: Map<string, RefreshTokenEntity> = new Map();
  public courses: Map<string, CourseEntity> = new Map();
  public lessons: Map<string, LessonEntity> = new Map();
  public resources: Map<string, ResourceEntity> = new Map();
  public orders: Map<string, OrderEntity> = new Map();
  public payments: Map<string, PaymentEntity> = new Map();
  public enrollments: Map<string, EnrollmentEntity> = new Map();
  public driveAccessGrants: Map<string, DriveAccessGrantEntity> = new Map();
  public auditLogs: AuditLogEntity[] = [];
  public forumPosts: Map<string, ForumPostEntity> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  public clear(): void {
    this.users.clear();
    this.refreshTokens.clear();
    this.courses.clear();
    this.lessons.clear();
    this.resources.clear();
    this.orders.clear();
    this.payments.clear();
    this.enrollments.clear();
    this.driveAccessGrants.clear();
    this.auditLogs = [];
    this.forumPosts.clear();
  }
}

export const db = DatabaseStore.getInstance();
