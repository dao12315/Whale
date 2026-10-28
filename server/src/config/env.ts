import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/whale_db?schema=public',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'super-secret-whale-access-token-key-2026',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-whale-refresh-token-key-2026',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '30d',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'whale-drive@project.iam.gserviceaccount.com',

  VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE || 'WHALE_VNPAY_TMN',
  VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET || 'WHALE_VNPAY_HASH_SECRET_KEY_512',
  VNPAY_URL: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment-result',

  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER',
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY',
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY',
  MOMO_ENDPOINT: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  SMTP_USER: process.env.SMTP_USER || 'nguyendao512004@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'Dao512004@',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'GGC Studio & Whale',
};
