import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

export function createChatRouter(): Router {
  const router = Router();

  // Lấy 50 tin nhắn chat gần nhất
  router.get('/messages', async (_req, res, next) => {
    try {
      const messages = await prisma.chatMessage.findMany({
        take: 50,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              tier: true,
              role: true,
            },
          },
        },
      });

      const formatted = messages.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user?.name || 'Khách',
        userAvatar: m.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userTier: m.user?.tier?.toLowerCase() || 'free',
        message: m.message,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(m.createdAt).getTime(),
      }));

      res.json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // Gửi tin nhắn chat mới
  router.post('/messages', optionalAuth, async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: { message: 'Nội dung tin nhắn không được để trống' } });
        return;
      }

      // Xác định user gửi
      let userId = req.user?.sub;
      if (!userId) {
        // Gán vào user mẫu nếu là khách
        const defaultUser = await prisma.user.findFirst({ where: { role: 'USER' } });
        userId = defaultUser?.id || '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd';
      }

      const created = await prisma.chatMessage.create({
        data: {
          userId,
          message: message.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              tier: true,
            },
          },
        },
      });

      const formatted = {
        id: created.id,
        userId: created.userId,
        userName: created.user?.name || 'Thành viên',
        userAvatar: created.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userTier: created.user?.tier?.toLowerCase() || 'free',
        message: created.message,
        timestamp: new Date(created.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(created.createdAt).getTime(),
      };

      res.status(201).json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
