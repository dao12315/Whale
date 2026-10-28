import { Router } from 'express';
import { prisma } from '../../database/prisma.js';

export function createCategoriesRouter(): Router {
  const router = Router();

  // GET /api/v1/categories
  router.get('/', async (_req, res, next) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { courses: true, resources: true },
          },
        },
      });

      const formatted = categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        coursesCount: cat._count.courses,
        resourcesCount: cat._count.resources,
      }));

      res.json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createTagsRouter(): Router {
  const router = Router();

  // GET /api/v1/tags
  router.get('/', async (_req, res, next) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { courses: true },
          },
        },
      });

      const formatted = tags.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        coursesCount: t._count.courses,
      }));

      res.json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
