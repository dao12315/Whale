import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service.js';

export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  vnpayIpn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // VNPay IPN có thể gửi qua GET query params hoặc POST body
      const params = Object.keys(req.query).length > 0 ? (req.query as Record<string, string>) : (req.body as Record<string, string>);
      const result = await this.paymentsService.processVNPayIpn(params);

      // Cổng thanh toán yêu cầu trả về format JSON { RspCode, Message }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
