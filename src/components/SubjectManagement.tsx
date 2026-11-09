import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Subject } from '../types/index.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { BookOpen, Plus, Edit, Trash2, X, Check, Award } from 'lucide-react';

export const SubjectManagement: React.FC = () => {
  const { db, updateDb } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formKkm, setFormKkm] = useState<number>(db.settings.kkmDefault || 75);
  const [formClasses, setFormClasses] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingSubject(null);
    setFormCode('');
    setFormName('');
    setFormKkm(db.settings.kkmDefault || 75);
    setFormClasses(db.classes.map((c) => c.name));
    setShowModal(true);
  };

  const openEditModal = (sbj: Subject) => {
    setEditingSubject(sbj);
    setFormCode(sbj.code);
    setFormName(sbj.name);
    setFormKkm(sbj.kkm);
    setFormClasses(sbj.applicableClasses || []);
    setShowModal(true);
  };

  const handleToggleClass = (className: string) => {
    if (formClasses.includes(className)) {
      setFormClasses(formClasses.filter((c) => c !== className));
    } else {
      setFormClasses([...formClasses, className]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Nama dan kode mata pelajaran wajib diisi');
      return;
    }

    if (editingSubject) {
      await updateDb((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) =>
          s.id === editingSubject.id
            ? {
                ...s,
                code: formCode.toUpperCase(),
                name: formName,
                kkm: formKkm,
                applicableClasses: formClasses,
              }
            : s
        ),
      }));
    } else {
      const newSubject: Subject = {
        id: 'sbj_' + Date.now(),
        code: formCode.toUpperCase(),
        name: formName,
        kkm: formKkm,
        applicableClasses: formClasses.length > 0 ? formClasses : db.classes.map((c) => c.name),
      };
      await updateDb((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));
    }

    setShowModal(false);
  };

  const handleDelete = (sbj: Subject) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Mata Pelajaran',
      message: `Apakah Anda yakin ingin menghapus mata pelajaran "${sbj.name}" (${sbj.code})? Data nilai terkait mata pelajaran ini mungkin terpengaruh.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          subjects: prev.subjects.filter((s) => s.id !== sbj.id),
        }));
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Kurikulum & Mata Pelajaran</h2>
          <p className="text-xs text-slate-500">
            Daftar muatan pelajaran kurikulum Kemenag MI Nurul Falah beserta standar KKM
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Mata Pelajaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.subjects.map((sbj) => (
          <div
            key={sbj.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-100 text-emerald-900">
                  {sbj.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  KKM: {sbj.kkm}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{sbj.name}</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {sbj.applicableClasses?.map((cls) => (
                  <span
                    key={cls}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => openEditModal(sbj)}
                className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Edit Mapel"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sbj)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Hapus Mapel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
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
                <label className="block font-semibold text-slate-700 mb-1">Kode Mapel *</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Contoh: FIQIH, MTK, BIND"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Fiqih Ibadah"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batas Minimal Nilai / KKM (Default: 75)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  required
                  value={formKkm}
                  onChange={(e) => setFormKkm(Number(e.target.value) || 75)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nilai di bawah batas ini otomatis berstatus REMEDIAL.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terapkan pada Kelas:</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {db.classes.map((cls) => {
                    const checked = formClasses.includes(cls.name);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleClass(cls.name)}
                          className="rounded text-emerald-600"
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
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
                  Simpan
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
          confirmLabel="Hapus Mapel"
          confirmVariant="danger"
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
};
