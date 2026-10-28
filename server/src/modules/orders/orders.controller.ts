import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service.js';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.ordersService.checkout(req.user!.sub, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  payWithCredits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode } = req.params;
      const result = await this.ordersService.payCreditsForOrder(req.user!.sub, orderCode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createVNPayUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode } = req.params;
      const result = await this.ordersService.createVNPayUrlForOrder(req.user!.sub, orderCode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getOrderDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode } = req.params;
      const data = await this.ordersService.getOrderByCode(req.user!.sub, orderCode);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };
}
