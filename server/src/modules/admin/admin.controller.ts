import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';

export class AdminController {
  constructor(private adminService: AdminService) {}

  getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  };

  listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const orders = await this.adminService.listOrders(page, limit);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  };

  refundOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const orderId = req.params.id;
      const { reason } = req.body || {};
      const result = await this.adminService.refundOrder(orderId, adminId, reason);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  // Courses CRUD
  createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const course = await this.adminService.createCourse(req.body, adminId);
      res.status(201).json({ data: course });
    } catch (error) {
      next(error);
    }
  };

  updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const course = await this.adminService.updateCourse(req.params.id, req.body, adminId);
      res.json({ data: course });
    } catch (error) {
      next(error);
    }
  };

  deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const result = await this.adminService.deleteCourse(req.params.id, adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  addSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, sortOrder } = req.body;
      const section = await this.adminService.addSection(req.params.id, title, sortOrder);
      res.status(201).json({ data: section });
    } catch (error) {
      next(error);
    }
  };

  addLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await this.adminService.addLesson(req.params.sectionId, req.body);
      res.status(201).json({ data: lesson });
    } catch (error) {
      next(error);
    }
  };

  // Resources CRUD
  listResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const resources = await this.adminService.listResources(page, limit);
      res.json(resources);
    } catch (error) {
      next(error);
    }
  };

  createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const resource = await this.adminService.createResource(req.body, adminId);
      res.status(201).json({ data: resource });
    } catch (error) {
      next(error);
    }
  };

  deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const result = await this.adminService.deleteResource(req.params.id, adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // Users Management
  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.q as string | undefined;
      const role = req.query.role as string | undefined;
      const users = await this.adminService.listUsers(page, limit, search, role);
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  updateUserTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { tier } = req.body;
      const updated = await this.adminService.updateUserTier(req.params.id, tier, adminId);
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { role } = req.body;
      const updated = await this.adminService.updateUserRole(req.params.id, role, adminId);
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

  banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { isBanned } = req.body;
      const result = await this.adminService.banUser(req.params.id, isBanned ?? true, adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  grantCredits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { amount } = req.body;
      const result = await this.adminService.grantCredits(req.params.id, parseInt(amount, 10) || 0, adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // Drive Manual Management
  grantDrive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { targetId, googleEmail, role } = req.body;
      const result = await this.adminService.grantDriveAccessManual(targetId, googleEmail, role || 'reader', adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  revokeDrive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const { targetId, permissionId } = req.body;
      const result = await this.adminService.revokeDriveAccessManual(targetId, permissionId, adminId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // Audit Logs
  listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const logs = await this.adminService.listAuditLogs(page, limit);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  };
}
