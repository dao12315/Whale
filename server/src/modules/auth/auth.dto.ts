import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Email không đúng định dạng (Ví dụ: yourname@domain.com)'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .max(64, 'Mật khẩu không được vượt quá 64 ký tự'),
  nickname: z
    .string()
    .trim()
    .min(2, 'Họ tên hoặc biệt danh phải từ 2 ký tự trở lên')
    .max(50, 'Họ tên không được vượt quá 50 ký tự'),
  googleEmail: z.string().trim().email('Email Google không hợp lệ').optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Email không đúng định dạng (Ví dụ: yourname@domain.com)'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().optional(),
    googleEmail: z.string().email('Email Google không hợp lệ').optional(),
    nickname: z.string().optional(),
    avatarUrl: z.string().optional(),
  })
  .refine((data) => !!data.idToken || !!data.googleEmail, {
    message: 'Vui lòng cung cấp Google ID Token hoặc Email Google',
  });

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
