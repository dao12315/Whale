import { Request, Response, NextFunction } from 'express';
import { LearningService } from './learning.service.js';

export class LearningController {
  constructor(private readonly service: LearningService) {}

  getCourseEntitlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = req.user!.sub;
      const data = await this.service.getCourseEntitlement(userId, courseId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  getSignedStreamToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId } = req.params;
      const userId = req.user!.sub;
      const ip = req.ip || req.socket.remoteAddress;
      const data = await this.service.generateSignedStreamToken(userId, lessonId, ip);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  proxyStreamVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Thiếu Signed Stream Token để truy cập video',
          },
        });
        return;
      }

      this.service.verifyStreamToken(token);

      // Tạo một dummy binary video buffer hỗ trợ HTTP Range 206 Partial Content
      // để các video player HTML5 có thể load mượt mà không crash
      const totalBytes = 1024 * 1024 * 2; // 2MB mock stream chunk
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 512, totalBytes - 1);
        const chunksize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalBytes}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });

        // Tạo dummy binary chunk
        const chunk = Buffer.alloc(chunksize, 0);
        res.end(chunk);
      } else {
        res.writeHead(200, {
          'Content-Length': totalBytes,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
        });
        const chunk = Buffer.alloc(Math.min(1024 * 256, totalBytes), 0);
        res.end(chunk);
      }
    } catch (error) {
      next(error);
    }
  };

  requestDriveAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = req.user!.sub;
      const result = await this.service.requestDriveAccess(userId, courseId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
