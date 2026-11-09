import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DailyGrade } from '../types/index.ts';
import { determineGradeStatus, formatDateIndo } from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  GraduationCap,
  Plus,
  Filter,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  X,
  AlertTriangle,
} from 'lucide-react';

export const DailyGradesView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? db.classes[0]?.name || 'Kelas 4A' : currentStudent?.className || 'Kelas 4A'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<DailyGrade | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // In-app confirm modal
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
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formScore, setFormScore] = useState<number>(80);
  const [formNotes, setFormNotes] = useState('');
  const [formReleaseImmediately, setFormReleaseImmediately] = useState(true);

  const openAddModal = () => {
    setEditingGrade(null);
    const studentsInClass = db.students.filter(
      (s) => s.className === selectedClass && s.status === 'aktif'
    );
    setFormStudentId(studentsInClass[0]?.id || '');
    setFormSubjectId(db.subjects[0]?.id || '');
    setFormTopic('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormScore(80);
    setFormNotes('');
    setFormReleaseImmediately(true);
    setShowModal(true);
  };

  const openEditModal = (grade: DailyGrade) => {
    setEditingGrade(grade);
    setFormStudentId(grade.studentId);
    setFormSubjectId(grade.subjectId);
    setFormTopic(grade.topicName);
    setFormDate(grade.assessmentDate);
    setFormScore(grade.score);
    setFormNotes(grade.notes);
    setFormReleaseImmediately(grade.isReleased);
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
    if (!formTopic.trim()) {
      alert('Nama bab/materi wajib diisi');
      return;
    }

    const kkm = subject.kkm || db.settings.kkmDefault || 75;
    const status = determineGradeStatus(formScore, kkm);

    if (editingGrade) {
      await updateDb((prev) => ({
        ...prev,
        dailyGrades: prev.dailyGrades.map((g) =>
          g.id === editingGrade.id
            ? {
                ...g,
                studentId: student.id,
                studentName: student.name,
                className: student.className,
                subjectId: subject.id,
                subjectName: subject.name,
                topicName: formTopic,
                assessmentDate: formDate,
                score: formScore,
                kkm,
                status,
                notes: formNotes,
                isReleased: formReleaseImmediately,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      }));
    } else {
      const newGrade: DailyGrade = {
        id: 'grd_d_' + Date.now(),
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        subjectId: subject.id,
        subjectName: subject.name,
        topicName: formTopic,
        assessmentDate: formDate,
        score: formScore,
        kkm,
        status,
        notes: formNotes,
        isReleased: formReleaseImmediately,
        updatedAt: new Date().toISOString(),
      };
      await updateDb((prev) => ({
        ...prev,
        dailyGrades: [...prev.dailyGrades, newGrade],
      }));
    }

    setShowModal(false);
  };

  const handleToggleRelease = async (grade: DailyGrade) => {
    const nextState = !grade.isReleased;
    await updateDb((prev) => ({
      ...prev,
      dailyGrades: prev.dailyGrades.map((g) =>
        g.id === grade.id ? { ...g, isReleased: nextState, updatedAt: new Date().toISOString() } : g
      ),
    }));
  };

  const handleReleaseAllInView = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Rilis Nilai Harian',
      message: `Rilis semua nilai harian yang tampil saat ini (${selectedClass}) ke akun wali murid? Wali murid akan dapat melihat nilai ini di dashboard mereka.`,
      confirmLabel: 'Rilis Semua',
      confirmVariant: 'success',
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          dailyGrades: prev.dailyGrades.map((g) => {
            if (g.className === selectedClass) {
              return { ...g, isReleased: true, updatedAt: new Date().toISOString() };
            }
            return g;
          }),
        }));
      },
    });
  };

  const handleDelete = (grade: DailyGrade) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Nilai Harian',
      message: `Apakah Anda yakin ingin menghapus nilai ${grade.subjectName} - ${grade.topicName} untuk siswa ${grade.studentName}?`,
      confirmLabel: 'Hapus Nilai',
      confirmVariant: 'danger',
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          dailyGrades: prev.dailyGrades.filter((g) => g.id !== grade.id),
        }));
      },
    });
  };

  // Filter list
  const filteredGrades = db.dailyGrades.filter((g) => {
    // If Wali Murid, strictly only their child & only released grades!
    if (!isAdmin) {
      if (g.studentId !== currentStudent?.id) return false;
      if (!g.isReleased) return false;
    } else {
      // Admin filter
      if (selectedClass !== 'Semua' && g.className !== selectedClass) return false;
    }

    if (selectedSubject !== 'Semua' && g.subjectId !== selectedSubject) return false;
    if (searchQuery) {
      const match =
        g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.topicName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const sheetHeaders = [
    'No',
    'Tanggal',
    'Nama Siswa',
    'Kelas',
    'Mata Pelajaran',
    'Bab / Materi',
    'Nilai',
    'KKM',
    'Keterangan',
    'Catatan Guru',
    'Status Rilis',
  ];
  const sheetRows = filteredGrades.map((g, i) => [
    i + 1,
    g.assessmentDate,
    g.studentName,
    g.className,
    g.subjectName,
    g.topicName,
    g.score,
    g.kkm,
    g.status,
    g.notes,
    g.isReleased ? 'TERILIS' : 'DRAFT',
  ]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
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
              placeholder="Cari siswa atau materi bab..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportSheetsButton
            sheetTitle={`Nilai Harian ${selectedClass} MI Nurul Falah`}
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
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 transition-colors shadow-xs cursor-pointer font-bold"
                title="Rilis semua nilai kelas ini ke wali murid"
              >
                <Send className="w-3.5 h-3.5" />
                Rilis Semua ke Wali
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Input Nilai Harian
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
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Nama Bab / Materi</th>
                <th className="py-3 px-4 text-center">Nilai</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Catatan Guru</th>
                {isAdmin && <th className="py-3 px-4 text-center">Rilis Wali</th>}
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 10 : 8}
                    className="py-10 text-center text-slate-400"
                  >
                    {!isAdmin
                      ? 'Belum ada nilai harian yang dirilis oleh wali kelas.'
                      : 'Belum ada data nilai harian pada filter ini.'}
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
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {formatDateIndo(grade.assessmentDate)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {grade.studentName}
                        <span className="block text-[11px] font-normal text-slate-500">
                          {grade.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-emerald-900">
                        {grade.subjectName}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{grade.topicName}</td>
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
                            title={
                              grade.isReleased
                                ? 'Nilai sudah tampil di wali murid'
                                : 'Nilai masih draft guru'
                            }
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

      {/* Modal Input / Edit Nilai Harian */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingGrade ? 'Edit Nilai Harian' : 'Input Nilai Harian Siswa'}
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Bab / Materi *</label>
                <input
                  type="text"
                  required
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Contoh: Bab 1: Menghafal QS. Al-Adiyat"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Penilaian</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai (0 - 100) *</label>
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
              </div>

              {/* Status preview */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Status Otomatis:</span>
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
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Umpan Balik Guru</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan perkembangan atau rekomendasi belajar..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="releaseCheck"
                  checked={formReleaseImmediately}
                  onChange={(e) => setFormReleaseImmediately(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="releaseCheck" className="text-xs font-bold text-amber-950 cursor-pointer">
                  Rilis nilai ini langsung ke wali murid
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
                  Simpan Nilai
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
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Nilai Harian</h3>
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
              title={`LEGER NILAI HARIAN DAN PENILAIAN BAB`}
              subtitle={`Kelas: ${selectedClass} • Tahun Ajaran: ${db.settings.academicYear}`}
            />

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Mata Pelajaran</th>
                  <th className="py-2 px-3 border-r border-slate-300">Materi / Bab</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Nilai</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Status</th>
                  <th className="py-2 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredGrades.map((g, i) => (
                  <tr key={g.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{g.assessmentDate}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{g.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{g.subjectName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{g.topicName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {g.score}
                    </td>
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
