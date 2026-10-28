import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validateBody } from '../../common/middleware/validate.middleware.js';
import { checkoutSchema } from './orders.dto.js';

export function createOrdersRouter(): Router {
  const router = Router();
  const service = new OrdersService(defaultDriveService);
  const controller = new OrdersController(service);

  router.use(requireAuth);

  // 1. Tạo đơn hàng (Checkout)
  router.post('/checkout', validateBody(checkoutSchema), controller.checkout);

  // 2. Thanh toán đơn hàng PENDING bằng ví Xu
  router.post('/:orderCode/pay-credits', controller.payWithCredits);

  // 3. Khởi tạo liên kết thanh toán VNPay Sandbox
  router.post('/:orderCode/create-vnpay-url', controller.createVNPayUrl);

  // 4. Lấy chi tiết đơn hàng
  router.get('/:orderCode', controller.getOrderDetail);

  return router;
}
