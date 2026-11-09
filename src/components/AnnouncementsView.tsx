import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Announcement } from '../types/index.ts';
import { formatDateIndo } from '../utils/academicRules.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Bell,
  Plus,
  Upload,
  Calendar,
  Trash2,
  Edit,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingAnc, setEditingAnc] = useState<Announcement | null>(null);

  // In-app confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'success';
    action: () => Promise<void>;
  } | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTargetClass, setFormTargetClass] = useState('Semua Kelas');
  const [formImage, setFormImage] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingAnc(null);
    setFormTitle('');
    setFormContent('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTargetClass('Semua Kelas');
    setFormImage('');
    setShowModal(true);
  };

  const openEditModal = (anc: Announcement) => {
    setEditingAnc(anc);
    setFormTitle(anc.title);
    setFormContent(anc.content);
    setFormDate(anc.date);
    setFormTargetClass(anc.targetClass);
    setFormImage(anc.imageUrl || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Judul dan isi pengumuman wajib diisi');
      return;
    }

    if (editingAnc) {
      await updateDb((prev) => ({
        ...prev,
        announcements: prev.announcements.map((a) =>
          a.id === editingAnc.id
            ? {
                ...a,
                title: formTitle,
                content: formContent,
                date: formDate,
                targetClass: formTargetClass,
                imageUrl: formImage,
              }
            : a
        ),
      }));
    } else {
      const newAnc: Announcement = {
        id: 'anc_' + Date.now(),
        title: formTitle,
        content: formContent,
        date: formDate,
        targetClass: formTargetClass,
        imageUrl: formImage,
        author: currentUser?.name || 'Tata Usaha MI Nurul Falah',
        createdAt: new Date().toISOString(),
      };
      await updateDb((prev) => ({
        ...prev,
        announcements: [newAnc, ...prev.announcements],
      }));
    }

    setShowModal(false);
  };

  const handleDelete = (anc: Announcement) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pengumuman',
      message: `Apakah Anda yakin ingin menghapus pengumuman "${anc.title}"? Pengumuman ini tidak akan lagi tampil di dashboard wali murid.`,
      confirmLabel: 'Hapus Pengumuman',
      confirmVariant: 'danger',
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          announcements: prev.announcements.filter((a) => a.id !== anc.id),
        }));
      },
    });
  };

  // Filter for Wali
  const visibleAnnouncements = db.announcements.filter((a) => {
    if (!isAdmin) {
      if (!currentStudent) return true;
      return a.targetClass === 'Semua Kelas' || a.targetClass === currentStudent.className;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-700" />
            Warta & Pengumuman Resmi Madrasah
          </h2>
          <p className="text-xs text-slate-500">
            Informasi penting terkait kalender akademik, kegiatan, dan surat edaran madrasah
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Pengumuman Baru
          </button>
        )}
      </div>

      <div className="space-y-4">
        {visibleAnnouncements.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Belum ada pengumuman untuk kelas ini.
          </div>
        ) : (
          visibleAnnouncements.map((anc) => (
            <div
              key={anc.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {anc.targetClass}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDateIndo(anc.date)}
                  </span>
                </div>
                <span className="text-xs text-emerald-800 font-semibold">
                  Penulis: {anc.author}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">{anc.title}</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {anc.content}
                </p>

                {anc.imageUrl && (
                  <div className="mt-4 max-w-md">
                    <img
                      src={anc.imageUrl}
                      alt={anc.title}
                      className="rounded-xl border border-slate-200 max-h-64 object-cover"
                    />
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(anc)}
                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                    title="Edit Pengumuman"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(anc)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Announcement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingAnc ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Libur Awal Ramadhan 1447 H"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Rilis</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sasaran Kelas</label>
                  <select
                    value={formTargetClass}
                    onChange={(e) => setFormTargetClass(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Isi Pesan Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman secara rinci dan santun..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lampirkan Gambar / Brosur (Opsional)
                </label>
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center">
                  {formImage ? (
                    <div className="flex items-center justify-between">
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                      />
                      <span className="text-xs text-emerald-800 font-semibold">Foto terlampir</span>
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-emerald-800 hover:underline">
                        Pilih foto brosur dari perangkat
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          confirmVariant={confirmDialog.confirmVariant}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
};
