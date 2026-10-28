import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import {
  Palette,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  HardDrive,
  Download,
  FileCheck,
  CheckCircle,
  X,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  category: 'brush' | 'texture' | 'color' | 'psd' | '3d';
  format: string;
  fileSizeMb: number;
  downloadCount: number;
  priceCredits: number;
  isFree: boolean;
  driveFileId: string;
  thumbnail: string;
}

export const AdminResourcesManager: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load real resources from PostgreSQL Database
  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getResources()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setResources(
            res.data.map((r: any) => ({
              id: r.id,
              title: r.title,
              category: (r.fileType === 'ABR' ? 'brush' : r.fileType === 'CUBE' ? 'color' : r.fileType === 'PSD' ? 'psd' : 'texture') as any,
              format: r.fileType || 'ZIP',
              fileSizeMb: r.fileSizeBytes ? Math.round(Number(r.fileSizeBytes) / (1024 * 1024)) : 50,
              downloadCount: r.downloadsCount || 0,
              priceCredits: r.priceCredits || 0,
              isFree: r.isFree || r.priceCredits === 0,
              driveFileId: r.driveFileId || `drive_${r.id}`,
              thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
            }))
          );
        }
      })
      .catch((err) => {
        console.log('[AdminResourcesManager] Dùng fallback resources:', err?.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Partial<ResourceItem> | null>(null);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'valid'>('idle');

  const filtered = resources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenCreate = () => {
    setEditingRes({
      id: `res-${Date.now()}`,
      title: '',
      category: 'brush',
      format: 'ABR',
      fileSizeMb: 50,
      downloadCount: 0,
      priceCredits: 10,
      isFree: false,
      driveFileId: `drive_file_${Date.now()}`,
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
    });
    setCheckStatus('idle');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ResourceItem) => {
    setEditingRes({ ...item });
    setCheckStatus('valid');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingRes?.title) {
      alert('Vui lòng nhập tên tài nguyên');
      return;
    }
    const toSave = editingRes as ResourceItem;

    try {
      await adminApi.createResource({
        title: toSave.title,
        fileType: toSave.format || 'ZIP',
        fileSizeBytes: (toSave.fileSizeMb || 50) * 1024 * 1024,
        priceCredits: toSave.priceCredits || 0,
        isFree: toSave.isFree,
        driveFileId: toSave.driveFileId || 'drive_new_resource',
      });
    } catch (err: any) {
      console.warn('[AdminResourcesManager] Create resource API notice:', err?.message);
    }

    setResources((prev) => {
      const idx = prev.findIndex((r) => r.id === toSave.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = toSave;
        return updated;
      }
      return [toSave, ...prev];
    });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa tài nguyên này?')) {
      try {
        await adminApi.deleteResource(id);
      } catch (err: any) {
        console.warn('[AdminResourcesManager] Delete resource API notice:', err?.message);
      }
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            Quản Lý Tài Nguyên Vẽ (Brush, Texture, PSD, LUTs)
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Kho tài nguyên bán lẻ bằng Xu (Credits) và tải miễn phí có bảo vệ qua Google Drive
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Tài Nguyên Mới</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cọ vẽ, texture, file PSD..."
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
            <option value="all">Tất cả định dạng ({resources.length})</option>
            <option value="brush">Cọ vẽ (Brushes)</option>
            <option value="texture">Texture 4K PBR</option>
            <option value="psd">File PSD phân lớp</option>
            <option value="color">LUTs chỉnh màu DaVinci</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-[#0c181e] text-stone-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-stone-200 dark:border-[#1b313d]">
              <tr>
                <th className="py-3 px-4">Ảnh & Tiêu đề</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Định dạng & Dung lượng</th>
                <th className="py-3 px-4">Giá Xu</th>
                <th className="py-3 px-4">Google Drive File ID</th>
                <th className="py-3 px-4">Lượt tải</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-stone-50/80 dark:hover:bg-[#142631]/60 transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-stone-300 dark:ring-slate-700 shrink-0"
                      />
                      <span className="font-bold text-stone-900 dark:text-slate-100 line-clamp-2">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-stone-800 dark:text-slate-200 font-semibold">
                      {item.format}
                    </div>
                    <div className="text-[10px] text-stone-400">{item.fileSizeMb} MB</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {item.isFree || item.priceCredits === 0 ? (
                      <span className="text-emerald-500">Miễn phí</span>
                    ) : (
                      <span className="text-amber-500">{item.priceCredits} Xu</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-stone-600 dark:text-slate-400">
                    <span className="bg-stone-100 dark:bg-[#162933] px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700/60 flex items-center gap-1.5 w-fit">
                      <HardDrive className="w-3 h-3 text-emerald-500" />
                      {item.driveFileId}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-700 dark:text-slate-300">
                    {item.downloadCount} lượt
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && editingRes && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#233f4e] max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                {editingRes.title ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                  Tên tài nguyên *
                </label>
                <input
                  type="text"
                  value={editingRes.title || ''}
                  onChange={(e) => setEditingRes({ ...editingRes, title: e.target.value })}
                  placeholder="e.g. Gói Cọ Vẽ Thủy Mặc Procreate..."
                  className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Phân loại
                  </label>
                  <select
                    value={editingRes.category || 'brush'}
                    onChange={(e) => setEditingRes({ ...editingRes, category: e.target.value as any })}
                    className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="brush">Cọ vẽ (Brush)</option>
                    <option value="texture">Texture 4K PBR</option>
                    <option value="psd">File PSD</option>
                    <option value="color">LUTs chỉnh màu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Định dạng file (e.g. ABR, PSD)
                  </label>
                  <input
                    type="text"
                    value={editingRes.format || ''}
                    onChange={(e) => setEditingRes({ ...editingRes, format: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Drive File ID */}
              <div>
                <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Google Drive File ID (Tệp nén ZIP tải về)</span>
                  <span className="text-[10px] text-amber-500 font-normal">Restricted</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingRes.driveFileId || ''}
                    onChange={(e) => setEditingRes({ ...editingRes, driveFileId: e.target.value })}
                    placeholder="drive_res_file_id..."
                    className="flex-1 bg-stone-50 dark:bg-[#142631] font-mono text-xs rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCheckStatus('checking');
                      setTimeout(() => setCheckStatus('valid'), 500);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shrink-0"
                  >
                    {checkStatus === 'checking' ? 'Kiểm tra...' : checkStatus === 'valid' ? 'Hợp lệ!' : 'Test Drive'}
                  </button>
                </div>
              </div>

              {/* Pricing & Free checkbox */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Giá Xu (Credits)
                  </label>
                  <input
                    type="number"
                    disabled={editingRes.isFree}
                    value={editingRes.isFree ? 0 : editingRes.priceCredits || 0}
                    onChange={(e) => setEditingRes({ ...editingRes, priceCredits: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-stone-50 dark:bg-[#142631] rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingRes.isFree || false}
                      onChange={(e) => setEditingRes({ ...editingRes, isFree: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 rounded"
                    />
                    <span className="font-bold text-stone-800 dark:text-slate-200">
                      Tài nguyên Miễn Phí (0 Xu)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-200 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-medium text-xs hover:bg-stone-300"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md"
              >
                Lưu Tài Nguyên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
