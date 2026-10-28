import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';

export class UsersController {
  constructor(private usersService: UsersService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.usersService.getFullProfile(req.user!.sub);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  updateGoogleEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { googleEmail } = req.body;
      const result = await this.usersService.updateGoogleEmail(req.user!.sub, googleEmail);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.usersService.updateProfile(req.user!.sub, req.body);
      const { passwordHash, ...safeUser } = user;
      res.json({ data: safeUser });
    } catch (error) {
      next(error);
    }
  };

  checkin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.usersService.dailyCheckin(req.user!.sub);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  toggleWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const result = await this.usersService.toggleWishlist(req.user!.sub, courseId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.usersService.getWishlist(req.user!.sub);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  getMyEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enrollments = await this.usersService.getMyEnrollments(req.user!.sub);
      res.json({ data: enrollments });
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await this.usersService.getMyOrders(req.user!.sub, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifs = await this.usersService.getMyNotifications(req.user!.sub);
      res.json({ data: notifs });
    } catch (error) {
      next(error);
    }
  };
}
