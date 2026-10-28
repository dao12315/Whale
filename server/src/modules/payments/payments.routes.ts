import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { OrderRepository } from '../orders/orders.repository.js';
import { UserRepository } from '../users/users.repository.js';
import { CourseRepository } from '../courses/courses.repository.js';
import { ResourceRepository } from '../resources/resources.repository.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';

export function createPaymentsRouter(): Router {
  const router = Router();
  const orderRepo = new OrderRepository();
  const userRepo = new UserRepository();
  const courseRepo = new CourseRepository();
  const resourceRepo = new ResourceRepository();

  const service = new PaymentsService(
    orderRepo,
    userRepo,
    courseRepo,
    resourceRepo,
    defaultDriveService
  );
  const controller = new PaymentsController(service);

  // VNPay IPN endpoint hỗ trợ cả GET lẫn POST
  router.get('/vnpay-ipn', controller.vnpayIpn);
  router.post('/vnpay-ipn', controller.vnpayIpn);

  return router;
}
