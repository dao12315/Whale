import { Router } from 'express';
import { ResourcesController } from './resources.controller.js';
import { ResourcesService } from './resources.service.js';
import { ResourceRepository } from './resources.repository.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';
import { checkResourceEntitlement } from '../../common/middleware/entitlement.middleware.js';

export function createResourcesRouter(): Router {
  const router = Router();
  const repo = new ResourceRepository();
  const service = new ResourcesService(repo, defaultDriveService);
  const controller = new ResourcesController(service);

  router.get('/', controller.listResources);
  router.get('/:id', controller.getResourceDetail);
  router.get('/:id/download', optionalAuth, checkResourceEntitlement, controller.download);

  return router;
}
