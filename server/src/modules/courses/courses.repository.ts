import { db, CourseEntity, LessonEntity } from '../../database/database.store.js';
import { prisma } from '../../database/prisma.js';

export interface CourseQueryOptions {
  category?: string;
  search?: string;
  isFree?: boolean;
  page?: number;
  limit?: number;
}

export interface ICourseRepository {
  findAll(options: CourseQueryOptions): Promise<{ courses: CourseEntity[]; total: number }>;
  findById(id: string): Promise<CourseEntity | null>;
  findLessonsByCourseId(courseId: string): Promise<LessonEntity[]>;
  findLessonById(lessonId: string): Promise<LessonEntity | null>;
}

export class CourseRepository implements ICourseRepository {
  async findAll(options: CourseQueryOptions): Promise<{ courses: CourseEntity[]; total: number }> {
    try {
      // 1. ƯU TIÊN QUERY TRỰC TIẾP TỪ POSTGRESQL DATABASE THẬT
      const where: any = { status: 'PUBLISHED' };

      if (options.category && options.category !== 'all') {
        where.category = { slug: options.category.toLowerCase() };
      }

      if (options.isFree !== undefined) {
        where.isFree = options.isFree;
      }

      if (options.search) {
        const q = options.search;
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { subtitle: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [pgCourses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          include: { category: true, lessons: { orderBy: { sortOrder: 'asc' } } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
      ]);

      if (pgCourses && pgCourses.length > 0) {
        const mappedCourses: CourseEntity[] = pgCourses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          titleZh: c.titleZh || undefined,
          subtitle: c.subtitle || undefined,
          category: c.category?.slug || 'coloso',
          instructor: c.instructorName,
          instructorRole: c.instructorRole || undefined,
          thumbnail: c.thumbnailUrl,
          authorAvatar: c.authorAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          publishedTimeAgo: 'Vừa xong',
          originalPrice: c.isFree ? 0 : (Number(c.priceVnd) > 0 ? Number(c.priceVnd) : c.originalCredits),
          goldPrice: c.goldCredits,
          supremePrice: c.supremeCredits,
          commentsCount: c.commentsCount,
          viewsCount: c.viewsCount,
          likesCount: c.likesCount,
          description: c.description || '',
          tags: [c.category?.name || 'CG Art'],
          driveFolderId: `drive_folder_${c.code.replace(/[^a-zA-Z0-9]/g, '')}`,
          isPublished: c.status === 'PUBLISHED',
          eventDate: c.eventDate || undefined,
          createdAt: c.createdAt,
          isFree: c.isFree,
          originalUrl: c.originalUrl || undefined,
          priceVnd: Number(c.priceVnd),
          chapters: c.lessons?.map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            isFreePreview: l.isFreePreview,
          })),
        }));

        return { courses: mappedCourses, total };
      }
    } catch (err: any) {
      console.warn('[CourseRepository] Không thể query PostgreSQL, fallback về In-Memory Store:', err?.message);
    }

    // 2. FALLBACK IN-MEMORY STORE KHI CHƯA CÓ POSTGRES
    let list = Array.from(db.courses.values()).filter((c) => c.isPublished);

    if (options.category && options.category !== 'all') {
      list = list.filter((c) => c.category.toLowerCase() === options.category!.toLowerCase());
    }

    if (options.isFree !== undefined) {
      if (options.isFree) {
        list = list.filter((c) => c.originalPrice === 0);
      } else {
        list = list.filter((c) => c.originalPrice > 0);
      }
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const courses = list.slice(start, start + limit);

    return { courses, total };
  }

  async findById(id: string): Promise<CourseEntity | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const c = await prisma.course.findFirst({
        where: isUuid ? { OR: [{ id }, { code: id }] } : { code: id },
        include: { category: true, lessons: { orderBy: { sortOrder: 'asc' } } },
      });

      if (c) {
        return {
          id: c.id,
          code: c.code,
          title: c.title,
          titleZh: c.titleZh || undefined,
          subtitle: c.subtitle || undefined,
          category: c.category?.slug || 'coloso',
          instructor: c.instructorName,
          instructorRole: c.instructorRole || undefined,
          thumbnail: c.thumbnailUrl,
          authorAvatar: c.authorAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          publishedTimeAgo: 'Vừa xong',
          originalPrice: c.isFree ? 0 : (Number(c.priceVnd) > 0 ? Number(c.priceVnd) : c.originalCredits),
          goldPrice: c.goldCredits,
          supremePrice: c.supremeCredits,
          commentsCount: c.commentsCount,
          viewsCount: c.viewsCount,
          likesCount: c.likesCount,
          description: c.description || '',
          tags: [c.category?.name || 'CG Art'],
          driveFolderId: `drive_folder_${c.code.replace(/[^a-zA-Z0-9]/g, '')}`,
          isPublished: c.status === 'PUBLISHED',
          eventDate: c.eventDate || undefined,
          createdAt: c.createdAt,
          isFree: c.isFree,
          originalUrl: c.originalUrl || undefined,
          priceVnd: Number(c.priceVnd),
          chapters: c.lessons?.map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            isFreePreview: l.isFreePreview,
          })),
        };
      }
    } catch (err: any) {
      console.warn('[CourseRepository.findById] Query PostgreSQL thất bại, fallback in-memory:', err?.message);
    }

    return db.courses.get(id) || null;
  }

  async findLessonsByCourseId(courseId: string): Promise<LessonEntity[]> {
    try {
      const pgLessons = await prisma.lesson.findMany({
        where: { courseId },
        orderBy: { sortOrder: 'asc' },
      });

      if (pgLessons && pgLessons.length > 0) {
        return pgLessons.map((l) => ({
          id: l.id,
          courseId: l.courseId,
          title: l.title,
          duration: l.duration,
          isFreePreview: l.isFreePreview,
          sortOrder: l.sortOrder,
          driveFileId: l.driveFileId || `drive_file_${l.id}`,
        }));
      }
    } catch (err: any) {
      console.warn('[CourseRepository.findLessonsByCourseId] Fallback in-memory:', err?.message);
    }

    return Array.from(db.lessons.values())
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findLessonById(lessonId: string): Promise<LessonEntity | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
      if (!isUuid) return db.lessons.get(lessonId) || null;
      const l = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (l) {
        return {
          id: l.id,
          courseId: l.courseId,
          title: l.title,
          duration: l.duration,
          isFreePreview: l.isFreePreview,
          sortOrder: l.sortOrder,
          driveFileId: l.driveFileId || `drive_file_${l.id}`,
        };
      }
    } catch (err: any) {
      console.warn('[CourseRepository.findLessonById] Fallback in-memory:', err?.message);
    }

    return db.lessons.get(lessonId) || null;
  }
}
