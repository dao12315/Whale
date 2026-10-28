import { prisma } from '../../database/prisma.js';
import { db, ResourceEntity } from '../../database/database.store.js';

export class ResourceRepository {
  async findAll(category?: string): Promise<ResourceEntity[]> {
    try {
      const where: any = {};
      if (category && category !== 'all') {
        where.category = { slug: category.toLowerCase() };
      }

      const pgResources = await prisma.resource.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });

      if (pgResources && pgResources.length > 0) {
        return pgResources.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category?.slug || 'resources',
          format: r.fileType,
          fileSizeMb: Math.round(Number(r.fileSizeBytes) / (1024 * 1024)) || 150,
          downloadCount: r.downloadsCount,
          priceCredits: r.priceCredits,
          isFree: r.isFree,
          driveFileId: r.driveFileId,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          description: r.description || '',
          createdAt: r.createdAt,
        }));
      }
    } catch (err: any) {
      console.warn('[ResourceRepository.findAll] Fallback in-memory:', err?.message);
    }

    let list = Array.from(db.resources.values());
    if (category && category !== 'all') {
      list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  }

  async findById(id: string): Promise<ResourceEntity | null> {
    try {
      const r = await prisma.resource.findFirst({
        where: { id },
        include: { category: true },
      });
      if (r) {
        return {
          id: r.id,
          title: r.title,
          category: r.category?.slug || 'resources',
          format: r.fileType,
          fileSizeMb: Math.round(Number(r.fileSizeBytes) / (1024 * 1024)) || 150,
          downloadCount: r.downloadsCount,
          priceCredits: r.priceCredits,
          isFree: r.isFree,
          driveFileId: r.driveFileId,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          description: r.description || '',
          createdAt: r.createdAt,
        };
      }
    } catch (err: any) {
      console.warn('[ResourceRepository.findById] Fallback in-memory:', err?.message);
    }

    return db.resources.get(id) || null;
  }

  async incrementDownloadCount(id: string): Promise<void> {
    try {
      await prisma.resource.update({
        where: { id },
        data: { downloadsCount: { increment: 1 } },
      });
    } catch (err: any) {
      console.warn('[ResourceRepository.incrementDownloadCount] Fallback in-memory:', err?.message);
    }

    const res = db.resources.get(id);
    if (res) {
      res.downloadCount += 1;
    }
  }
}
