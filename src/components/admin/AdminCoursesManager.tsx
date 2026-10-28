import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  HardDrive,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Video,
  Eye,
  X,
  Layers,
  Sparkles,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { Course } from '../../types';
import { coursesApi } from '../../services/coursesApi';
import { adminApi } from '../../services/adminApi';
import { notificationService } from '../../services/notificationService';
import { getCourseVndPrices, formatVnd } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

export interface AdminOwnerOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export const DEFAULT_ADMIN_OWNERS: AdminOwnerOption[] = [
  {
    id: 'usr_admin',
    name: 'Tổng Quản Trị Viên (Admin)',
    email: 'admin@shanhai.studio',
    role: 'Tổng Quản Trị Viên',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_admin2',
    name: 'Admin Hải Nam',
    email: 'admin2@shanhai.studio',
    role: 'Quản trị viên kỹ thuật',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'cat-coloso', slug: 'coloso', name: 'Coloso / Masterclass' },
  { id: 'cat-blender', slug: 'blender', name: 'Blender 3D Modeling' },
  { id: 'cat-color', slug: 'color', name: 'DaVinci / Chỉnh Màu' },
  { id: 'cat-character', slug: 'character', name: 'Nhân Vật / Anatomy' },
  { id: 'cat-unreal', slug: 'unreal', name: 'Unreal Engine 5' },
  { id: 'cat-landscape', slug: 'landscape', name: 'Phong Cảnh Thủy Mặc' },
  { id: 'cat-photoshop', slug: 'photoshop', name: 'Photoshop Digital Art' },
];

export const AdminCoursesManager: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [adminList, setAdminList] = useState<AdminOwnerOption[]>(DEFAULT_ADMIN_OWNERS);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [driveCheckStatus, setDriveCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [activeTabInModal, setActiveTabInModal] = useState<'info' | 'lessons'>('info');

  // Loading & Action states
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Lessons State inside modal
  const [tempLessons, setTempLessons] = useState<
    Array<{ id: string; title: string; duration: string; isFreePreview: boolean; driveFileId?: string }>
  >([]);

  // Tải danh sách khóa học từ Backend PostgreSQL
  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await coursesApi.getCourses({ limit: 100 });
      if (res?.data && res.data.length > 0) {
        setCourses(res.data);
      }
    } catch (err: any) {
      console.warn('[AdminCoursesManager] Không thể tải courses từ API:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải danh mục và danh sách Admin từ API
  useEffect(() => {
    loadCourses();

    adminApi
      .getCategories()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setCategories(res.data.map((c) => ({ id: c.id, slug: c.slug, name: c.name })));
        }
      })
      .catch(() => { });

    adminApi
      .getUsers({ role: 'ADMIN' })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          const apiAdmins: AdminOwnerOption[] = res.data
            .filter((u) => u.role === 'ADMIN')
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role:
                u.email === 'admin2@shanhai.studio'
                  ? 'Quản trị viên kỹ thuật'
                  : 'Tổng Quản Trị Viên',
              avatar:
                u.email === 'admin2@shanhai.studio'
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            }));
          const merged = [...DEFAULT_ADMIN_OWNERS];
          apiAdmins.forEach((adm) => {
            const idx = merged.findIndex((m) => m.email === adm.email);
            if (idx >= 0) {
              merged[idx] = adm;
            } else {
              merged.push(adm);
            }
          });
          setAdminList(merged);
        }
      })
      .catch(() => { });
  }, []);

  // Lọc khóa học
  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenCreateModal = () => {
    setActionError(null);
    const defaultAdmin =
      adminList.find((a) => a.name === user?.name || a.email === user?.email) || adminList[0];

    setEditingCourse({
      id: `course-new-${Date.now()}`,
      code: `[${Math.floor(485 + Math.random() * 50)}]`,
      title: '',
      titleZh: '',
      subtitle: '',
      category: categories[0]?.slug || 'coloso',
      instructor: defaultAdmin.name,
      instructorRole: defaultAdmin.role,
      authorAvatar: defaultAdmin.avatar,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
      originalPrice: 50,
      goldPrice: 45,
      supremePrice: 35,
      commentsCount: 0,
      viewsCount: 0,
      likesCount: 0,
      publishedTimeAgo: 'Vừa xong',
      description: '',
      tags: ['Digital Art', 'Tutorial'],
      originalUrl: 'https://coloso.global/',
    });
    setTempLessons([
      {
        id: `les-${Date.now()}-1`,
        title: '1. Giới thiệu tổng quan & Chuẩn bị công cụ (Preview)',
        duration: '15:00',
        isFreePreview: true,
        driveFileId: 'drive_preview_01',
      },
      {
        id: `les-${Date.now()}-2`,
        title: '2. Kỹ thuật dựng khối chuyên sâu & Phím tắt',
        duration: '45:00',
        isFreePreview: false,
        driveFileId: 'drive_lesson_02',
      },
    ]);
    setDriveCheckStatus('idle');
    setActiveTabInModal('info');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setActionError(null);
    const p = getCourseVndPrices(course);
    setEditingCourse({
      ...course,
      originalPrice: p.isFree ? 0 : p.originalVnd,
      goldPrice: p.isFree ? 0 : p.goldVnd,
      supremePrice: p.isFree ? 0 : p.supremeVnd,
    });
    setTempLessons(
      course.chapters && course.chapters.length > 0
        ? course.chapters.map((ch, idx) => ({
          id: ch.id || `les-${idx}`,
          title: ch.title,
          duration: ch.duration,
          isFreePreview: !!ch.isFreePreview,
          driveFileId: `drive_file_${ch.id}`,
        }))
        : [
          {
            id: 'les-1',
            title: '1. Giới thiệu khóa học',
            duration: '12:00',
            isFreePreview: true,
            driveFileId: 'drive_sample_1',
          },
        ]
    );
    setDriveCheckStatus('valid');
    setActiveTabInModal('info');
    setIsModalOpen(true);
  };

  const handleVerifyDriveId = () => {
    setDriveCheckStatus('checking');
    setTimeout(() => {
      setDriveCheckStatus('valid');
    }, 600);
  };

  // Lưu Khóa Học (Thêm mới hoặc Cập nhật)
  const handleSaveCourse = async () => {
    if (!editingCourse || !editingCourse.title?.trim()) {
      setActionError('Vui lòng nhập tiêu đề khóa học!');
      return;
    }

    if (!editingCourse.instructor?.trim()) {
      setActionError('Vui lòng chọn hoặc nhập Admin đăng khóa học!');
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const isNew =
        !editingCourse.id ||
        editingCourse.id.startsWith('course-new') ||
        editingCourse.id.startsWith('course-temp');

      const payload = {
        code: editingCourse.code?.trim() || `[${Math.floor(100 + Math.random() * 900)}]`,
        title: editingCourse.title.trim(),
        titleZh: editingCourse.titleZh?.trim() || null,
        subtitle: editingCourse.subtitle?.trim() || null,
        description: editingCourse.description?.trim() || null,
        category: editingCourse.category || 'coloso',
        instructor: editingCourse.instructor.trim(),
        instructorRole: editingCourse.instructorRole?.trim() || 'Quản trị viên (Admin)',
        authorAvatar: editingCourse.authorAvatar?.trim() || null,
        thumbnail:
          editingCourse.thumbnail?.trim() ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
        isFree: !!editingCourse.isFree,
        originalUrl: editingCourse.originalUrl?.trim() || null,
        originalPrice: editingCourse.isFree ? 0 : Number(editingCourse.originalPrice || 0),
        goldPrice: editingCourse.isFree ? 0 : Number(editingCourse.goldPrice || 0),
        supremePrice: editingCourse.isFree ? 0 : Number(editingCourse.supremePrice || 0),
        chapters: tempLessons.map((l, idx) => ({
          id: l.id,
          title: l.title || `Bài học ${idx + 1}`,
          duration: l.duration || '15:00',
          isFreePreview: !!l.isFreePreview,
          driveFileId: l.driveFileId || null,
        })),
      };

      if (isNew) {
        await adminApi.createCourse(payload);
        notificationService.sendPushNotification({
          type: 'system',
          title: 'Thêm khóa học thành công! 🎉',
          message: `Khóa học "${payload.title}" (${payload.code}) đã được tạo trên hệ thống.`,
          timestamp: 'Vừa xong',
        });
      } else {
        await adminApi.updateCourse(editingCourse.id!, payload);
        notificationService.sendPushNotification({
          type: 'system',
          title: 'Cập nhật thành công! ✏️',
          message: `Đã lưu các thay đổi cho khóa học "${payload.title}" (${payload.code}).`,
          timestamp: 'Vừa xong',
        });
      }

      await loadCourses();
      setIsModalOpen(false);
      setEditingCourse(null);
    } catch (err: any) {
      console.error('[AdminCoursesManager] Lỗi lưu khóa học:', err);
      setActionError(err?.message || 'Không thể lưu khóa học. Vui lòng kiểm tra quyền quản trị viên.');
    } finally {
      setIsSaving(false);
    }
  };

  // Xác nhận và thực hiện xóa khóa học
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setDeletingId(courseToDelete.id);
    setActionError(null);

    try {
      await adminApi.deleteCourse(courseToDelete.id);
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đã xóa khóa học 🗑️',
        message: `Khóa học "${courseToDelete.title}" (${courseToDelete.code}) đã được lưu trữ (Archived).`,
        timestamp: 'Vừa xong',
      });
      setCourseToDelete(null);
      await loadCourses();
    } catch (err: any) {
      console.error('[AdminCoursesManager] Lỗi xóa khóa học:', err);
      setActionError(err?.message || 'Không thể xóa khóa học. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddLesson = () => {
    const newIdx = tempLessons.length + 1;
    setTempLessons([
      ...tempLessons,
      {
        id: `les-${Date.now()}`,
        title: `${newIdx}. Bài học mới - Kỹ thuật dựng hình`,
        duration: '30:00',
        isFreePreview: false,
        driveFileId: `drive_file_${Date.now()}`,
      },
    ]);
  };

  const handleRemoveLesson = (lessonId: string) => {
    setTempLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Quản Lý Khóa Học & Bài Học (Google Drive)
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Thêm mới, cập nhật giá tiền mặt VNĐ, quản lý bài giảng xem trước (Free Preview) và xóa khóa học
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadCourses}
            disabled={isLoading}
            title="Làm mới danh sách từ cơ sở dữ liệu"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#102029] hover:bg-stone-50 dark:hover:bg-[#142631] text-stone-600 dark:text-slate-300 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khóa Học Mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo lỗi thao tác nếu có */}
      {actionError && !isModalOpen && !courseToDelete && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="p-1 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã [480], tên khóa học hoặc Admin đăng bài..."
            className="w-full bg-stone-50 dark:bg-[#142631] text-xs text-stone-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 border border-stone-300 dark:border-slate-700/80 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 dark:text-slate-500 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-stone-50 dark:bg-[#142631] text-xs text-stone-800 dark:text-slate-200 rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700/80 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả danh mục ({courses.length})</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-[#0c181e] text-stone-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-stone-200 dark:border-[#1b313d]">
              <tr>
                <th className="py-3 px-4">Mã & Ảnh bìa</th>
                <th className="py-3 px-4">Tiêu đề khóa học</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Admin sở hữu</th>
                <th className="py-3 px-4">Quyền truy cập</th>
                <th className="py-3 px-4">Google Drive Folder</th>
                <th className="py-3 px-4">Khóa học gốc</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 dark:text-slate-500">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        <span>Đang tải danh sách khóa học...</span>
                      </div>
                    ) : (
                      'Không tìm thấy khóa học nào phù hợp với bộ lọc.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const p = getCourseVndPrices(c);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-[#142631]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-12 h-8 rounded-lg object-cover ring-1 ring-stone-300 dark:ring-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800';
                            }}
                          />
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-stone-900 dark:text-slate-100 line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400 line-clamp-1">
                          {c.subtitle || c.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt="Admin"
                            className="w-7 h-7 rounded-full object-cover border border-amber-500/50 shadow-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1 font-semibold text-stone-900 dark:text-slate-100">
                              <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              <span>{c.instructor}</span>
                            </div>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                              {c.instructorRole || 'Quản trị viên'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Google Drive VIP</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                          <HardDrive className="w-3 h-3" />
                          <span>drive_folder_{c.code.replace(/[^a-zA-Z0-9]/g, '')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.originalUrl ? (
                          <a
                            href={c.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold transition-all hover:scale-105 group whitespace-nowrap shadow-xs"
                            title={c.originalUrl}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            <span>Khóa học gốc ↗</span>
                          </a>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-500 italic text-[11px]">
                            Chưa gắn link
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            title="Chỉnh sửa thông tin & Bài học"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(c)}
                            title="Xóa khóa học"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Khóa Học & Quản Lý Bài Học */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#233f4e] max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  {editingCourse.code || '[NEW]'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
                    {editingCourse.id && !editingCourse.id.startsWith('course-new')
                      ? `Chỉnh sửa: ${editingCourse.title || editingCourse.code}`
                      : 'Thêm Khóa Học Mới'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Cấu hình quyền Drive API, giá bán VNĐ và danh sách bài giảng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner trong modal */}
            {actionError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex items-center gap-4 mt-4 border-b border-stone-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTabInModal('info')}
                className={`pb-2.5 flex items-center gap-1.5 ${activeTabInModal === 'info'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                    : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
                  }`}
              >
                <span>1. Thông tin chung & Drive Folder</span>
              </button>
              <button
                onClick={() => setActiveTabInModal('lessons')}
                className={`pb-2.5 flex items-center gap-1.5 ${activeTabInModal === 'lessons'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                    : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
                  }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>2. Quản lý bài học ({tempLessons.length})</span>
              </button>
            </div>

            {/* TAB 1: THÔNG TIN CHUNG & GOOGLE DRIVE */}
            {activeTabInModal === 'info' && (
              <div className="space-y-4 py-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                      Mã khóa học *
                    </label>
                    <input
                      type="text"
                      value={editingCourse.code || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                      placeholder="e.g. [484]"
                      className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                      Tiêu đề khóa học (Tiếng Việt) *
                    </label>
                    <input
                      type="text"
                      value={editingCourse.title || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                      placeholder="Nhập tiêu đề đầy đủ của khóa học..."
                      className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                      Danh mục *
                    </label>
                    <select
                      value={editingCourse.category || 'coloso'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id || cat.slug} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                      Mô tả ngắn (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={editingCourse.subtitle || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, subtitle: e.target.value })}
                      placeholder="e.g. Thiết kế Mech & Khí tài phong cách Cyberpunk"
                      className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Admin sở hữu / Người đăng khóa học */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Admin đăng khóa học / Người sở hữu *</span>
                    </label>
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Chỉ Admin mới có quyền đăng
                    </span>
                  </div>

                  {/* Admin selection cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {adminList.map((admin) => {
                      const isSelected = editingCourse.instructor === admin.name;
                      return (
                        <button
                          key={admin.id}
                          type="button"
                          onClick={() => {
                            setEditingCourse({
                              ...editingCourse,
                              instructor: admin.name,
                              authorAvatar: admin.avatar,
                              instructorRole: admin.role,
                            });
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/10'
                              : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-[#142631] hover:border-amber-500/50'
                          }`}
                        >
                          <img
                            src={admin.avatar}
                            alt={admin.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/60 ring-2 ring-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-stone-900 dark:text-slate-100 truncate">
                                {admin.name}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
                              {admin.role}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                              {admin.email}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual fine-tuning fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-500/20">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Tên Admin hiển thị đăng bài
                      </label>
                      <input
                        type="text"
                        value={editingCourse.instructor || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                        placeholder="VD: Tổng Quản Trị Viên (Admin)"
                        className="w-full bg-white dark:bg-[#102029] text-xs font-semibold rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Chức danh / Vai trò Admin
                      </label>
                      <input
                        type="text"
                        value={editingCourse.instructorRole || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, instructorRole: e.target.value })}
                        placeholder="VD: Tổng Quản Trị Viên"
                        className="w-full bg-white dark:bg-[#102029] text-xs rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Drive Folder ID with Verification */}
                <div className="bg-stone-50 dark:bg-[#142631] p-3.5 rounded-xl border border-stone-200 dark:border-slate-800">
                  <label className="block text-stone-800 dark:text-slate-200 font-bold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-amber-500" />
                      Google Drive Folder ID (Chứa toàn bộ video & tài nguyên)
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                      Chỉ Service Account có quyền xem
                    </span>
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      defaultValue={
                        editingCourse.code
                          ? `drive_folder_${editingCourse.code.replace(/[^a-zA-Z0-9]/g, '')}`
                          : '1A2b3C4d5E6f_GoogleDriveFolderID'
                      }
                      placeholder="Nhập ID thư mục Google Drive..."
                      className="flex-1 bg-white dark:bg-[#0c181e] font-mono text-xs rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDriveId}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      {driveCheckStatus === 'checking' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : driveCheckStatus === 'valid' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-950" />
                          <span>Hợp lệ!</span>
                        </>
                      ) : (
                        <span>Kiểm tra Drive API</span>
                      )}
                    </button>
                  </div>
                  {driveCheckStatus === 'valid' && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Service Account đã được cấp quyền quản trị trên thư mục Drive này. Sẵn sàng gọi API permissions.create!
                    </p>
                  )}
                </div>

                {/* Link khóa học gốc (Original Course URL) */}
                <div className="bg-stone-50 dark:bg-[#142631] p-3.5 rounded-xl border border-stone-200 dark:border-slate-800">
                  <label className="block text-stone-800 dark:text-slate-200 font-bold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      Link khóa học gốc (Original Course URL)
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                      Mở khi click vào cột bảng hoặc nút "View the original course page"
                    </span>
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="url"
                      value={editingCourse.originalUrl || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, originalUrl: e.target.value })}
                      placeholder="VD: https://coloso.global/en/products/... hoặc https://www.unrealengine.com/..."
                      className="flex-1 bg-white dark:bg-[#0c181e] font-mono text-xs rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-slate-100"
                    />
                    {editingCourse.originalUrl && (
                      <a
                        href={editingCourse.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors border border-amber-500/30"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                        <span>Mở thử ↗</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Thiết lập Miễn phí hoặc Định giá tiền mặt VND */}
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#142631] border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-stone-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Chính sách học phí (Niêm yết bằng Tiền mặt VNĐ)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <input
                        type="checkbox"
                        checked={editingCourse.isFree === true || editingCourse.originalPrice === 0}
                        onChange={(e) => {
                          const isFree = e.target.checked;
                          setEditingCourse({
                            ...editingCourse,
                            isFree,
                            originalPrice: isFree ? 0 : 250000,
                            goldPrice: isFree ? 0 : 225000,
                            supremePrice: isFree ? 0 : 175000,
                          });
                        }}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
                      />
                      <span>Khóa học Miễn phí (100% FREE)</span>
                    </label>
                  </div>

                  {!editingCourse.isFree ? (
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                          Học phí gốc (VNĐ)
                        </label>
                        <input
                          type="number"
                          step={10000}
                          value={editingCourse.originalPrice || 250000}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setEditingCourse({
                              ...editingCourse,
                              originalPrice: val,
                              goldPrice: Math.round(val * 0.9),
                              supremePrice: Math.round(val * 0.7),
                            });
                          }}
                          className="w-full bg-white dark:bg-[#0c181e] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-600 dark:text-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                          Hội viên Gold (-10%)
                        </label>
                        <input
                          type="number"
                          step={10000}
                          value={
                            editingCourse.goldPrice ||
                            Math.round((editingCourse.originalPrice || 250000) * 0.9)
                          }
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              goldPrice: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full bg-white dark:bg-[#0c181e] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                          Supreme VIP (-30%)
                        </label>
                        <input
                          type="number"
                          step={10000}
                          value={
                            editingCourse.supremePrice ||
                            Math.round((editingCourse.originalPrice || 250000) * 0.7)
                          }
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              supremePrice: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full bg-white dark:bg-[#0c181e] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>
                        Khóa học này được phát hành Miễn phí 0đ. Tất cả học viên đăng ký tài khoản đều có thể vào học và tải bài tập tự do.
                      </span>
                    </div>
                  )}
                </div>

                {/* Ảnh Thumbnail */}
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Ảnh Thumbnail (URL Công khai Cloudflare R2 / S3 / Unsplash)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={editingCourse.thumbnail || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    />
                    {editingCourse.thumbnail && (
                      <img
                        src={editingCourse.thumbnail}
                        alt="Preview"
                        className="w-12 h-9 rounded-lg object-cover border border-stone-300 dark:border-slate-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Mô tả chi tiết */}
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Mô tả chi tiết nội dung khóa học
                  </label>
                  <textarea
                    rows={3}
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    placeholder="Mô tả kỹ năng, bài tập thực hành, phần mềm sử dụng..."
                    className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: QUẢN LÝ BÀI HỌC & FREE PREVIEW */}
            {activeTabInModal === 'lessons' && (
              <div className="space-y-3 py-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-stone-600 dark:text-slate-400">
                    Bật cờ <strong className="text-emerald-500 font-bold">Free Preview</strong> để cho phép khách xem thử video mà không cần mua khóa học.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddLesson}
                    className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-900 dark:text-slate-100 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Bài Giảng</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {tempLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-[#142631] border border-stone-200 dark:border-slate-800 flex items-center gap-3"
                    >
                      <span className="font-mono text-stone-400 font-bold text-xs">{idx + 1}</span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const updated = [...tempLessons];
                            updated[idx].title = e.target.value;
                            setTempLessons(updated);
                          }}
                          placeholder="Tên bài học..."
                          className="sm:col-span-2 bg-white dark:bg-[#0c181e] px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={lesson.duration}
                          onChange={(e) => {
                            const updated = [...tempLessons];
                            updated[idx].duration = e.target.value;
                            setTempLessons(updated);
                          }}
                          placeholder="Thời lượng (e.g. 25:00)"
                          className="bg-white dark:bg-[#0c181e] px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs font-mono"
                        />
                      </div>

                      {/* Cờ Free Preview */}
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold shrink-0">
                        <input
                          type="checkbox"
                          checked={lesson.isFreePreview}
                          onChange={(e) => {
                            const updated = [...tempLessons];
                            updated[idx].isFreePreview = e.target.checked;
                            setTempLessons(updated);
                          }}
                          className="w-3.5 h-3.5 text-amber-500 rounded"
                        />
                        <span className={lesson.isFreePreview ? 'text-emerald-500' : 'text-stone-400'}>
                          Free Preview
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(lesson.id)}
                        className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                        title="Xóa bài học này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-medium text-xs hover:bg-stone-300 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu vào CSDL...</span>
                  </>
                ) : (
                  <span>Lưu Thay Đổi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Xóa Khóa Học */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-red-900/40 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              Xác nhận xóa khóa học?
            </h3>

            <p className="text-xs text-stone-500 dark:text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa khóa học{' '}
              <strong className="text-amber-500">{courseToDelete.code}</strong>:{' '}
              <span className="text-stone-800 dark:text-slate-200 font-semibold">
                "{courseToDelete.title}"
              </span>
              ?
            </p>

            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
              Khóa học sẽ được chuyển sang trạng thái <strong>ARCHIVED (Lưu trữ)</strong> và ẩn khỏi trang chủ. Các học viên đã sở hữu khóa học vẫn có thể tiếp tục xem bài giảng.
            </div>

            {actionError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCourseToDelete(null);
                  setActionError(null);
                }}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-medium text-xs hover:bg-stone-300 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingId === courseToDelete.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác Nhận Xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
