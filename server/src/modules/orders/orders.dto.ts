import { z } from 'zod';

export const checkoutSchema = z.object({
  itemType: z.enum(['COURSE', 'RESOURCE', 'VIP_UPGRADE', 'CREDIT_TOPUP']),
  itemId: z.string().min(1, 'Vui lòng cung cấp ID khóa học hoặc tài nguyên'),
  paymentMethod: z.enum(['VNPAY', 'MOMO', 'CREDITS', 'FREE']),
  googleEmail: z.string().email().optional(),
  idempotencyKey: z.string().optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
