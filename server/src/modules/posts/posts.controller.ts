import { Request, Response, NextFunction } from 'express';
import { PostsService } from './posts.service.js';

export class PostsController {
  constructor(private postsService: PostsService) {}

  listPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { boardId, search, page, limit, status, authorId } = req.query;
      const result = await this.postsService.listPosts({
        boardId: boardId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        status: status as any,
        authorId: authorId as string,
      });
      res.json({ data: result.items, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  };

  listPendingPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.postsService.listPendingPosts();
      res.json({ data: result.items });
    } catch (error) {
      next(error);
    }
  };

  getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await this.postsService.getPostById(req.params.id);
      if (!post) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bài viết không tồn tại' } });
        return;
      }
      res.json({ data: post });
    } catch (error) {
      next(error);
    }
  };

  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let authorId = req.user?.sub;
      if (!authorId) {
        // Fallback user if token optional
        authorId = 'usr_student';
      }
      const userRole = req.user?.role || 'USER';
      const { boardId, title, content, coverImageUrl } = req.body;

      const result = await this.postsService.createPost({
        authorId,
        boardId: boardId || 'board-inspiration',
        title,
        content,
        coverImageUrl,
        userRole,
      });

      res.status(201).json({
        data: result.post,
        moderation: result.moderation,
        isAutoApproved: result.isAutoApproved,
        isPendingAdmin: result.isPendingAdmin,
      });
    } catch (error) {
      next(error);
    }
  };

  approvePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.postsService.approvePost(req.params.id);
      res.json({ data: updated, message: 'Duyệt bài viết thành công' });
    } catch (error) {
      next(error);
    }
  };

  rejectPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body;
      const updated = await this.postsService.rejectPost(req.params.id, reason);
      res.json({ data: updated, message: 'Đã từ chối bài viết' });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.postsService.deletePost(req.params.id);
      res.json({ data: { message: 'Đã xóa bài viết thành công' } });
    } catch (error) {
      next(error);
    }
  };
}
