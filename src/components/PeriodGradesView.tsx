import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PeriodGrade } from '../types/index.ts';
import { determineGradeStatus, formatDateIndo } from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Award,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  X,
  History,
} from 'lucide-react';

export const PeriodGradesView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  // Toggle between PTS and PAS
  const [gradeType, setGradeType] = useState<'PTS' | 'PAS'>('PTS');
  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? db.classes[0]?.name || 'Kelas 4A' : currentStudent?.className || 'Kelas 4A'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<PeriodGrade | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

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
  const [formStudentId, setFormStudentId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState(db.subjects[0]?.id || '');
  const [formScore, setFormScore] = useState<number>(85);
  const [formNotes, setFormNotes] = useState('');
  const [formReleaseImmediately, setFormReleaseImmediately] = useState(true);
  const [editReason, setEditReason] = useState('');

  const openAddModal = () => {
    setEditingGrade(null);
    const studentsInClass = db.students.filter(
      (s) => s.className === selectedClass && s.status === 'aktif'
    );
    setFormStudentId(studentsInClass[0]?.id || '');
    setFormSubjectId(db.subjects[0]?.id || '');
    setFormScore(85);
    setFormNotes('');
    setFormReleaseImmediately(true);
    setEditReason('');
    setShowModal(true);
  };

  const openEditModal = (grade: PeriodGrade) => {
    setEditingGrade(grade);
    setFormStudentId(grade.studentId);
    setFormSubjectId(grade.subjectId);
    setFormScore(grade.score);
    setFormNotes(grade.notes);
    setFormReleaseImmediately(grade.isReleased);
    setEditReason('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = db.students.find((s) => s.id === formStudentId);
    const subject = db.subjects.find((s) => s.id === formSubjectId);

    if (!student || !subject) {
      alert('Pilih siswa dan mata pelajaran');
      return;
    }

    const kkm = subject.kkm || db.settings.kkmDefault || 75;
    const status = determineGradeStatus(formScore, kkm);

    if (editingGrade) {
      // Require change record if edited
      const noteAppend = editReason
        ? ` (Diperbarui: ${editReason} pada ${new Date().toLocaleDateString('id-ID')})`
        : '';

      await updateDb((prev) => ({
        ...prev,
        periodGrades: prev.periodGrades.map((g) =>
          g.id === editingGrade.id
            ? {
                ...g,
                studentId: student.id,
                studentName: student.name,
                className: student.className,
                subjectId: subject.id,
                subjectName: subject.name,
                score: formScore,
                kkm,
                status,
                notes: formNotes + noteAppend,
                isReleased: formReleaseImmediately,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      }));
    } else {
      const newGrade: PeriodGrade = {
        id: 'grd_p_' + Date.now(),
        type: gradeType,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        subjectId: subject.id,
        subjectName: subject.name,
        score: formScore,
        kkm,
        status,
        academicYear: db.settings.academicYear,
        semester: db.settings.semester,
        notes: formNotes,
        isReleased: formReleaseImmediately,
        updatedAt: new Date().toISOString(),
      };

      await updateDb((prev) => ({
        ...prev,
        periodGrades: [...prev.periodGrades, newGrade],
      }));
    }

    setShowModal(false);
  };

  const handleToggleRelease = async (grade: PeriodGrade) => {
    const nextState = !grade.isReleased;
    await updateDb((prev) => ({
      ...prev,
      periodGrades: prev.periodGrades.map((g) =>
        g.id === grade.id ? { ...g, isReleased: nextState, updatedAt: new Date().toISOString() } : g
      ),
    }));
  };

  const handleReleaseAllInView = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Rilis Nilai ${gradeType}`,
      message: `Rilis semua nilai ${gradeType} kelas ${selectedClass} ke akun wali murid? Nilai yang dirilis dapat dilihat langsung oleh wali murid.`,
      confirmLabel: `Rilis Semua ${gradeType}`,
      confirmVariant: 'success',
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          periodGrades: prev.periodGrades.map((g) => {
            if (g.type === gradeType && g.className === selectedClass) {
              return { ...g, isReleased: true, updatedAt: new Date().toISOString() };
            }
            return g;
          }),
        }));
      },
    });
  };

  const handleDelete = (grade: PeriodGrade) => {
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Nilai ${grade.type}`,
      message: `Apakah Anda yakin ingin menghapus nilai ${grade.type} ${grade.subjectName} untuk siswa ${grade.studentName}?`,
      confirmLabel: 'Hapus Nilai',
      confirmVariant: 'danger',
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          periodGrades: prev.periodGrades.filter((g) => g.id !== grade.id),
        }));
      },
    });
  };

  // Filter list
  const filteredGrades = db.periodGrades.filter((g) => {
    if (g.type !== gradeType) return false;

    if (!isAdmin) {
      if (g.studentId !== currentStudent?.id) return false;
      if (!g.isReleased) return false;
    } else {
      if (selectedClass !== 'Semua' && g.className !== selectedClass) return false;
    }

    if (selectedSubject !== 'Semua' && g.subjectId !== selectedSubject) return false;
    if (searchQuery) {
      const match = g.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  // Calculate summary stats
  const totalTuntas = filteredGrades.filter((g) => g.status === 'TUNTAS').length;
  const totalRemedial = filteredGrades.filter((g) => g.status === 'REMEDIAL').length;
  const avgScore =
    filteredGrades.length > 0
      ? Math.round(filteredGrades.reduce((a, b) => a + b.score, 0) / filteredGrades.length)
      : 0;

  const sheetHeaders = [
    'No',
    'Jenis Ujian',
    'Nama Siswa',
    'Kelas',
    'Mata Pelajaran',
    'Nilai',
    'Batas Minimal (KKM)',
    'Keterangan',
    'Catatan / Riwayat',
    'Status Rilis',
  ];
  const sheetRows = filteredGrades.map((g, i) => [
    i + 1,
    g.type,
    g.studentName,
    g.className,
    g.subjectName,
    g.score,
    g.kkm,
    g.status,
    g.notes,
    g.isReleased ? 'TERILIS' : 'DRAFT',
  ]);

  return (
    <div className="space-y-5">
      {/* Type Switcher Tabs: PTS vs PAS */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setGradeType('PTS')}
          className={`pb-3 font-extrabold text-sm sm:text-base border-b-3 transition-colors cursor-pointer flex items-center gap-2 ${
            gradeType === 'PTS'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-5 h-5" />
          Penilaian Tengah Semester (PTS)
        </button>
        <button
          type="button"
          onClick={() => setGradeType('PAS')}
          className={`pb-3 font-extrabold text-sm sm:text-base border-b-3 transition-colors cursor-pointer flex items-center gap-2 ${
            gradeType === 'PAS'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-5 h-5" />
          Penilaian Akhir Semester (PAS)
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Total Nilai Terdata</span>
          <p className="text-xl font-black text-slate-900 mt-1">{filteredGrades.length}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Rata-rata Kelas</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{avgScore}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-bold">TUNTAS (≥ 75)</span>
          <p className="text-xl font-black text-emerald-800 mt-1">{totalTuntas}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-rose-600 font-bold">REMEDIAL (&lt; 75)</span>
          <p className="text-xl font-black text-rose-700 mt-1">{totalRemedial}</p>
        </div>
      </div>

      {/* Filter and Action bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="font-semibold text-slate-500">Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-emerald-800 focus:outline-hidden cursor-pointer"
              >
                {db.classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-500">Mapel:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Mapel</option>
              {db.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportSheetsButton
            sheetTitle={`Nilai ${gradeType} ${selectedClass} MI Nurul Falah`}
            headers={sheetHeaders}
            rows={sheetRows}
          />

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleReleaseAllInView}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Rilis {gradeType} ke Wali
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Input Nilai {gradeType}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4 text-center">Nilai {gradeType}</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan / Catatan Remedial</th>
                {isAdmin && <th className="py-3 px-4 text-center">Status Rilis</th>}
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 7}
                    className="py-10 text-center text-slate-400"
                  >
                    {!isAdmin
                      ? `Belum ada nilai ${gradeType} yang dirilis oleh wali kelas.`
                      : `Belum ada nilai ${gradeType} yang tersimpan pada filter ini.`}
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade, idx) => {
                  const isTuntas = grade.status === 'TUNTAS';

                  return (
                    <tr key={grade.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{grade.studentName}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{grade.className}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-900">
                        {grade.subjectName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-base font-black text-slate-900">{grade.score}</span>
                        <span className="text-[10px] text-slate-400 block">KKM: {grade.kkm}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isTuntas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isTuntas ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          )}
                          {grade.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs">
                        {grade.notes || '-'}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRelease(grade)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              grade.isReleased
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {grade.isReleased ? (
                              <>
                                <Eye className="w-3 h-3" /> Terilis
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" /> Draft
                              </>
                            )}
                          </button>
                        </td>
                      )}

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(grade)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Edit Nilai"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(grade)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Hapus Nilai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingGrade ? `Edit Nilai ${gradeType}` : `Input Nilai ${gradeType}`}
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
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  required
                >
                  {db.students
                    .filter((s) => s.className === selectedClass && s.status === 'aktif')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran *</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  required
                >
                  {db.subjects.map((sbj) => (
                    <option key={sbj.id} value={sbj.id}>
                      {sbj.name} (KKM: {sbj.kkm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Angka (0 - 100) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={formScore}
                  onChange={(e) => setFormScore(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-base focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Status preview */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 font-medium">Keterangan Capaian:</span>
                  <p className="text-[11px] text-slate-400">
                    Batas minimal: {db.subjects.find((s) => s.id === formSubjectId)?.kkm || 75}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    determineGradeStatus(
                      formScore,
                      db.subjects.find((s) => s.id === formSubjectId)?.kkm || 75
                    ) === 'TUNTAS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {determineGradeStatus(
                    formScore,
                    db.subjects.find((s) => s.id === formSubjectId)?.kkm || 75
                  )}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Capaian / Umpan Balik</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan kelebihan atau jadwal remedial jika ada..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* If editing existing grade, require change logging confirmation */}
              {editingGrade && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-1">
                    <History className="w-3.5 h-3.5 text-blue-700" />
                    Catatan Perubahan Nilai (Audit Log):
                  </div>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Alasan edit (misal: koreksi nomor 5, susulan perbaikan)"
                    className="w-full p-2 border border-blue-300 rounded-md bg-white text-xs"
                  />
                </div>
              )}

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="releasePeriodCheck"
                  checked={formReleaseImmediately}
                  onChange={(e) => setFormReleaseImmediately(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="releasePeriodCheck" className="text-xs font-bold text-amber-950 cursor-pointer">
                  Rilis nilai {gradeType} ini langsung ke wali murid
                </label>
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
                  Simpan Nilai {gradeType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-8 print-page">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 no-print">
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Nilai {gradeType}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            <PrintHeader
              title={`LEGER NILAI ${gradeType === 'PTS' ? 'PENILAIAN TENGAH SEMESTER (PTS)' : 'PENILAIAN AKHIR SEMESTER (PAS)'}`}
              subtitle={`Kelas: ${selectedClass} • Tahun Ajaran: ${db.settings.academicYear} (${db.settings.semester})`}
            />

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Mata Pelajaran</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Nilai</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">KKM</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Keterangan</th>
                  <th className="py-2 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredGrades.map((g, i) => (
                  <tr key={g.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{g.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{g.subjectName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {g.score}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{g.kkm}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-semibold">
                      {g.status}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">{g.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PrintSignatures
              homeroomTeacher={
                db.classes.find((c) => c.name === selectedClass)?.homeroomTeacher ||
                'Gustiana Hermawan, M.Pd.I'
              }
            />
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
