import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from '../config/env.js';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = ENV.DATABASE_URL || process.env.DATABASE_URL;
    if (connectionString) {
      const adapter = new PrismaPg({ connectionString });
      prismaInstance = new PrismaClient({ adapter });
    } else {
      prismaInstance = new PrismaClient();
    }
  }
  return prismaInstance;
}

export const prisma = getPrisma();
