import { ICourseRepository, CourseQueryOptions } from './courses.repository.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { ICloudStorageService } from '../drive/drive.interface.js';
import { JwtUtil } from '../../common/utils/jwt.js';

export class CoursesService {
  constructor(
    private courseRepo: ICourseRepository,
    private storageService: ICloudStorageService
  ) {}

  async listCourses(options: CourseQueryOptions) {
    const { courses, total } = await this.courseRepo.findAll(options);
    return {
      items: courses,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total,
        totalPages: Math.ceil(total / (options.limit || 20)),
      },
    };
  }

  async getCourseDetail(courseId: string) {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError('Khóa học không tồn tại');

    const lessons = await this.courseRepo.findLessonsByCourseId(courseId);
    return {
      ...course,
      chapters: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        duration: l.duration,
        isFreePreview: l.isFreePreview,
      })),
    };
  }

  async getLessonStream(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.courseRepo.findLessonById(lessonId);
    if (!lesson) throw new NotFoundError('Bài học không tồn tại');

    // Sinh Signed Stream Token (TTL 15 phút)
    const streamToken = JwtUtil.signStreamToken({
      sub: userId,
      lessonId: lesson.id,
      courseId,
      driveFileId: lesson.driveFileId,
    });

    const streamUrl = await this.storageService.getSignedStreamUrl(lesson.driveFileId, userId);

    return {
      lessonId: lesson.id,
      title: lesson.title,
      streamToken,
      streamUrl,
      expiresIn: '15m',
    };
  }
}
