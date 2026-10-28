import React, { useState, useEffect } from 'react';
import { Tag, FolderTree, Plus, Edit, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { taxonomyApi } from '../../services/taxonomyApi';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  coursesCount: number;
  description: string;
}

export const AdminCategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load real data from PostgreSQL
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      taxonomyApi.getCategories().catch(() => ({ data: [] })),
      taxonomyApi.getTags().catch(() => ({ data: [] })),
    ])
      .then(([catsRes, tagsRes]) => {
        if (catsRes?.data && catsRes.data.length > 0) {
          setCategories(
            catsRes.data.map((c) => ({
              id: c.id,
              name: c.name,
              code: c.slug,
              coursesCount: c.coursesCount || 0,
              description: c.description || '',
            }))
          );
        }
        if (tagsRes?.data && tagsRes.data.length > 0) {
          setTags(tagsRes.data.map((t) => t.name));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-amber-500" />
          Quản Lý Danh Mục & Thẻ Phân Loại (Tags)
        </h2>
        <p className="text-xs text-stone-500 dark:text-slate-400">
          Tổ chức cây thư mục danh mục khóa học và các nhãn từ khóa tìm kiếm
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>Danh mục Khóa học & Tài nguyên ({categories.length})</span>
          </h3>

          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#142631] border border-stone-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-stone-900 dark:text-slate-100">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      slug: {cat.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-bold text-stone-600 dark:text-slate-300 bg-stone-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {cat.coursesCount} khóa học
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Manager (1 col) */}
        <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <span>Thẻ Từ Khóa (Tags)</span>
          </h3>

          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Nhập tên tag mới..."
              className="flex-1 bg-stone-50 dark:bg-[#142631] text-xs text-stone-900 dark:text-slate-100 rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shrink-0"
            >
              Thêm
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="group inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#162933] text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700/60"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone-400 group-hover:text-red-500 transition-colors font-bold text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
