import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { validateBody } from '../../common/middleware/validate.middleware.js';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.dto.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

export function createAuthRouter(): Router {
  const router = Router();
  const repo = new AuthRepository();
  const service = new AuthService(repo);
  const controller = new AuthController(service);

  router.post('/register', validateBody(registerSchema), controller.register);
  router.post('/login', validateBody(loginSchema), controller.login);
  router.post('/google', validateBody(googleAuthSchema), controller.googleAuth);
  router.post('/refresh-token', controller.refreshToken);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth, controller.me);

  return router;
}
