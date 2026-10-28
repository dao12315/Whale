import { Router } from 'express';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { optionalAuth, requireAuth } from '../../common/middleware/auth.middleware.js';
import { prisma } from '../../database/prisma.js';

export function createPostsRouter(): Router {
  const router = Router();
  const postsService = new PostsService();
  const postsController = new PostsController(postsService);

  // 1. Lấy danh sách diễn đàn (Boards) từ PostgreSQL
  router.get('/boards', async (_req, res, next) => {
    try {
      const boards = await prisma.forumBoard.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      res.json({ data: boards });
    } catch (error) {
      next(error);
    }
  });

  // 2. Lấy danh sách bài viết từ PostgreSQL (hỗ trợ cả GET / và GET /posts)
  router.get('/', postsController.listPosts);
  router.get('/posts', postsController.listPosts);

  // 2.1 Lấy danh sách bài viết chờ duyệt (Moderation Queue)
  router.get('/moderation/pending', postsController.listPendingPosts);

  // 3. Chi tiết bài viết (hỗ trợ cả GET /:id và GET /posts/:id)
  router.get('/:id', postsController.getPostById);
  router.get('/posts/:id', postsController.getPostById);

  // 4. Đăng bài viết mới
  router.post('/', optionalAuth, postsController.createPost);
  router.post('/posts', optionalAuth, postsController.createPost);

  // 4.1 Thao tác duyệt bài viết của Admin / AI
  router.post('/:id/approve', postsController.approvePost);
  router.post('/:id/reject', postsController.rejectPost);
  router.delete('/:id', postsController.deletePost);

  // 5. Lấy danh sách bình luận của bài viết từ PostgreSQL
  router.get('/:id/comments', async (req, res, next) => {
    try {
      const { id } = req.params;
      const comments = await prisma.forumComment.findMany({
        where: { postId: id },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, tier: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const formatted = comments.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.author?.name || 'Học viên',
        authorAvatar: c.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        authorTier: c.author?.tier?.toLowerCase() || 'free',
        text: c.content,
        image: c.imageUrl || undefined,
        timeAgo: new Date(c.createdAt).toLocaleDateString('vi-VN'),
        likes: c.likesCount,
      }));

      res.json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // 6. Gửi bình luận bài viết vào PostgreSQL
  router.post('/:id/comments', optionalAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { text, image } = req.body;
      if (!text && !image) {
        res.status(400).json({ error: { message: 'Bình luận phải có nội dung hoặc hình ảnh' } });
        return;
      }

      let authorId = req.user?.sub;
      if (!authorId) {
        const u = await prisma.user.findFirst({ where: { role: 'USER' } });
        authorId = u?.id || '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd';
      }

      const comment = await prisma.forumComment.create({
        data: {
          postId: id,
          authorId,
          content: text || '',
          imageUrl: image || null,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, tier: true } },
        },
      });

      // Tăng commentsCount của bài viết
      await prisma.forumPost.update({
        where: { id },
        data: { commentsCount: { increment: 1 } },
      }).catch(() => {});

      const formatted = {
        id: comment.id,
        authorId: comment.authorId,
        authorName: comment.author?.name || 'Học viên',
        authorAvatar: comment.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        authorTier: comment.author?.tier?.toLowerCase() || 'free',
        text: comment.content,
        image: comment.imageUrl || undefined,
        timeAgo: 'Vừa xong',
        likes: 0,
      };

      res.status(201).json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // 7. Like bài viết trên PostgreSQL
  router.post('/:id/like', async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await prisma.forumPost.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
        select: { id: true, likesCount: true },
      });
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  // 8. Bỏ phiếu PK Poll (Voting)
  router.post('/:id/vote', optionalAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { pollOptionId } = req.body;

      if (!pollOptionId) {
        res.status(400).json({ error: { message: 'Vui lòng chọn phương án bình chọn' } });
        return;
      }

      let userId = req.user?.sub;
      if (!userId) {
        const u = await prisma.user.findFirst({ where: { role: 'USER' } });
        userId = u?.id || '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd';
      }

      const existingVote = await prisma.pollVote.findUnique({
        where: {
          userId_postId: { userId, postId: id },
        },
      });

      if (existingVote) {
        res.status(400).json({
          error: {
            code: 'ALREADY_VOTED',
            message: 'Bạn đã tham gia bỏ phiếu cho bài viết này rồi!',
          },
        });
        return;
      }

      await prisma.$transaction([
        prisma.pollVote.create({
          data: {
            userId,
            postId: id,
            pollOptionId,
          },
        }),
        prisma.pollOption.update({
          where: { id: pollOptionId },
          data: { votesCount: { increment: 1 } },
        }),
      ]);

      const pollOptions = await prisma.pollOption.findMany({
        where: { postId: id },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({
        success: true,
        message: 'Bỏ phiếu thành công!',
        pollOptions,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
