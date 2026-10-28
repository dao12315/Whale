import { Request, Response, NextFunction } from 'express';
import { CoursesService } from './courses.service.js';

export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  listCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, search, isFree, page, limit } = req.query;
      const result = await this.coursesService.listCourses({
        category: category as string,
        search: search as string,
        isFree: isFree !== undefined ? isFree === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.json({ data: result.items, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  };

  getCourseDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const course = await this.coursesService.getCourseDetail(req.params.id);
      res.json({ data: course });
    } catch (error) {
      next(error);
    }
  };

  getLessonStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user ? req.user.sub : 'anonymous_preview';
      const result = await this.coursesService.getLessonStream(
        req.params.courseId,
        req.params.lessonId,
        userId
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
