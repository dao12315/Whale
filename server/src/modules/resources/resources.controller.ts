import { Request, Response, NextFunction } from 'express';
import { ResourcesService } from './resources.service.js';

export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  listResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string;
      const data = await this.resourcesService.listResources(category);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  getResourceDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.resourcesService.getResourceDetail(req.params.id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user ? req.user.sub : 'anonymous_public';
      const data = await this.resourcesService.getDownloadLink(req.params.id, userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };
}
