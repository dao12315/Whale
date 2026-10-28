import { prisma } from '../../database/prisma.js';
import { ModerationService, ModerationResult } from './moderation.service.js';

export class PostsService {
  async listPosts(options?: {
    boardId?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'ALL';
    authorId?: string;
  }) {
    try {
      const where: any = {};
      if (options?.status && options.status !== 'ALL') {
        where.status = options.status;
      } else if (!options?.status) {
        where.status = 'PUBLISHED';
      }

      if (options?.boardId && options.boardId !== 'all') {
        where.boardId = options.boardId;
      }
      if (options?.authorId) {
        where.authorId = options.authorId;
      }
      if (options?.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { content: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.forumPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true, tier: true } },
            board: { select: { id: true, title: true, iconType: true } },
            comments: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true, tier: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            pollOptions: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.forumPost.count({ where }),
      ]);

      return {
        items: posts.map((p) => {
          const isPending = p.status === 'DRAFT';
          const isRejected = p.status === 'ARCHIVED';
          const moderationStatus = isPending ? 'PENDING' : isRejected ? 'REJECTED' : 'APPROVED';
          const moderationBadge = isPending
            ? '⏳ Chờ Admin duyệt'
            : isRejected
            ? '🚫 Đã từ chối'
            : '✨ Đã duyệt bởi AI';

          return {
            id: p.id,
            boardId: p.boardId,
            boardTitle: p.board?.title || 'Diễn đàn',
            authorId: p.authorId,
            authorName: p.author?.name || 'Vân Du Họa Sĩ',
            authorAvatar:
              p.author?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
            authorTier: p.author?.tier?.toLowerCase() || 'free',
            authorBadge:
              p.author?.role === 'ADMIN'
                ? '👑 Admin'
                : 'Học viên',
            title: p.title,
            content: p.content,
            images: (p.images as string[]) || (p.coverImageUrl ? [p.coverImageUrl] : []),
            tags: (p.tags as string[]) || ['3D Art', 'Tutorial'],
            category: (p.category ? p.category.toLowerCase() : 'summary') as any,
            readsCount: p.readsCount,
            likesCount: p.likesCount,
            commentsCount: p.commentsCount,
            updatedTimeAgo: new Date(p.createdAt).toLocaleDateString('vi-VN'),
            isVotingEnabled: p.isVotingEnabled,
            pollOptions: p.pollOptions,
            status: p.status,
            moderationStatus,
            moderationBadge,
            commentsList:
              p.comments?.map((c) => ({
                id: c.id,
                authorId: c.authorId,
                authorName: c.author?.name || 'Học viên',
                authorAvatar:
                  c.author?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                authorTier: c.author?.tier?.toLowerCase() || 'free',
                text: c.content,
                image: c.imageUrl || undefined,
                timeAgo: new Date(c.createdAt).toLocaleDateString('vi-VN'),
                likes: c.likesCount,
              })) || [],
            createdAt: p.createdAt,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      console.warn('[PostsService.listPosts] Query Postgres thất bại:', err?.message);
      return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }

  async getPostById(id: string) {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true, tier: true } },
        board: { select: { id: true, title: true, iconType: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, tier: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        pollOptions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (post) {
      // Tăng lượt đọc
      await prisma.forumPost
        .update({
          where: { id },
          data: { readsCount: { increment: 1 } },
        })
        .catch(() => {});

      const isPending = post.status === 'DRAFT';
      const isRejected = post.status === 'ARCHIVED';

      return {
        id: post.id,
        boardId: post.boardId,
        boardTitle: post.board?.title || 'Diễn đàn',
        authorId: post.authorId,
        authorName: post.author?.name || 'Vân Du Họa Sĩ',
        authorAvatar:
          post.author?.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        authorTier: post.author?.tier?.toLowerCase() || 'free',
        authorBadge:
          post.author?.role === 'ADMIN'
            ? '👑 Admin'
            : 'Học viên',
        title: post.title,
        content: post.content,
        images: (post.images as string[]) || (post.coverImageUrl ? [post.coverImageUrl] : []),
        tags: (post.tags as string[]) || ['3D Art', 'Tutorial'],
        category: (post.category ? post.category.toLowerCase() : 'summary') as any,
        readsCount: post.readsCount + 1,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        updatedTimeAgo: new Date(post.createdAt).toLocaleDateString('vi-VN'),
        isVotingEnabled: post.isVotingEnabled,
        pollOptions: post.pollOptions,
        status: post.status,
        moderationStatus: isPending ? 'PENDING' : isRejected ? 'REJECTED' : 'APPROVED',
        moderationBadge: isPending
          ? '⏳ Chờ Admin duyệt'
          : isRejected
          ? '🚫 Đã từ chối'
          : '✨ Đã duyệt bởi AI',
        commentsList:
          post.comments?.map((c) => ({
            id: c.id,
            authorId: c.authorId,
            authorName: c.author?.name || 'Học viên',
            authorAvatar:
              c.author?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
            authorTier: c.author?.tier?.toLowerCase() || 'free',
            text: c.content,
            image: c.imageUrl || undefined,
            timeAgo: new Date(c.createdAt).toLocaleDateString('vi-VN'),
            likes: c.likesCount,
          })) || [],
        createdAt: post.createdAt,
      };
    }

    return null;
  }

  async createPost(data: {
    authorId: string;
    boardId: string;
    title: string;
    content: string;
    coverImageUrl?: string;
    userRole?: string;
  }) {
    // 1. Chạy AI Content Moderation tự động
    const moderation = await ModerationService.reviewPost(data.title, data.content);

    // 2. Xác định trạng thái: Nếu là ADMIN thì luôn PUBLISHED, nếu là USER thì theo kết quả AI
    const isAdmin = data.userRole === 'ADMIN';
    let status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' = 'PUBLISHED';

    if (!isAdmin) {
      if (moderation.isApproved) {
        status = 'PUBLISHED'; // AI duyệt tự động thành công
      } else if (moderation.verdict === 'PENDING_ADMIN_REVIEW') {
        status = 'DRAFT'; // Chờ Admin kiểm duyệt
      } else {
        status = 'ARCHIVED'; // Vi phạm nghiêm trọng
      }
    }

    const post = await prisma.forumPost.create({
      data: {
        authorId: data.authorId,
        boardId: data.boardId,
        title: data.title,
        content: data.content,
        coverImageUrl: data.coverImageUrl || null,
        status: status,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    return {
      post,
      moderation,
      isAutoApproved: status === 'PUBLISHED',
      isPendingAdmin: status === 'DRAFT',
    };
  }

  async listPendingPosts() {
    return this.listPosts({ status: 'DRAFT', limit: 100 });
  }

  async approvePost(id: string) {
    return prisma.forumPost.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async rejectPost(id: string, reason?: string) {
    return prisma.forumPost.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async deletePost(id: string) {
    return prisma.forumPost.delete({
      where: { id },
    });
  }
}
