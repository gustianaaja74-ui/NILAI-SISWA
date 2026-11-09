import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Student } from '../types/index.ts';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import {
  calculateAttendanceStats,
  calculateSavingsBalance,
  calculateInfaqTotal,
  formatCurrency,
  formatDateIndo,
} from '../utils/academicRules.ts';
import { Printer, X, Award } from 'lucide-react';

interface StudentReportModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({ student, onClose }) => {
  const { db, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  // Daily grades (only released for wali, all or released for admin)
  const daily = db.dailyGrades.filter(
    (g) => g.studentId === student.id && (isAdmin ? true : g.isReleased)
  );

  // PTS grades
  const pts = db.periodGrades.filter(
    (g) => g.studentId === student.id && g.type === 'PTS' && (isAdmin ? true : g.isReleased)
  );

  // PAS grades
  const pas = db.periodGrades.filter(
    (g) => g.studentId === student.id && g.type === 'PAS' && (isAdmin ? true : g.isReleased)
  );

  // Attendance
  const att = db.attendance.filter((a) => a.studentId === student.id);
  const attStats = calculateAttendanceStats(att);

  // Financials
  const savings = db.savings.filter((s) => s.studentId === student.id);
  const savBalance = calculateSavingsBalance(savings);

  const infaq = db.infaq.filter((i) => i.studentId === student.id);
  const totalInfaq = calculateInfaqTotal(infaq);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl my-4 print-page relative">
        {/* Controls Bar - hidden in print */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-3 mb-4 border-b border-slate-200 z-20 flex justify-between items-center no-print">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              Laporan Rapor Hasil Belajar Siswa
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">Pratinjau resmi sebelum dicetak atau disimpan sebagai PDF</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak / Unduh PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <PrintHeader
          title="RAPOR CAPAIAN HASIL BELAJAR SISWA"
          subtitle={`Tahun Pelajaran ${db.settings.academicYear} - Semester ${db.settings.semester}`}
          studentName={student.name}
          className={student.className}
          nis={`${student.nis} / ${student.nisn}`}
        />

        {/* A. Capaian Nilai Akademik */}
        <div className="mb-6">
          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 mb-2 border-b border-emerald-900 pb-1">
            A. Nilai Mata Pelajaran (PTS & PAS)
          </h4>
          <table className="w-full text-left border-collapse text-xs border border-slate-400">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-400">
                <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                <th className="py-2 px-3 border-r border-slate-300">Mata Pelajaran</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">KKM</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Nilai PTS</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Nilai PAS</th>
                <th className="py-2 px-3 border-r border-slate-300 text-center">Keterangan</th>
                <th className="py-2 px-3">Catatan Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {db.subjects.map((sbj, idx) => {
                const p = pts.find((g) => g.subjectId === sbj.id);
                const a = pas.find((g) => g.subjectId === sbj.id);
                const scoreUsed = a ? a.score : p ? p.score : null;
                const isTuntas = scoreUsed !== null ? scoreUsed >= sbj.kkm : null;

                return (
                  <tr key={sbj.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-medium">
                      {sbj.name}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{sbj.kkm}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {p ? p.score : '-'}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {a ? a.score : '-'}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-semibold">
                      {isTuntas === true ? 'TUNTAS' : isTuntas === false ? 'REMEDIAL' : '-'}
                    </td>
                    <td className="py-1.5 px-3 text-[11px] text-slate-600">
                      {a?.notes || p?.notes || 'Kompetensi tercapai sesuai standar.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* B. Presensi & Keuangan Santri */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Kehadiran */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 mb-2 border-b border-emerald-900 pb-1">
              B. Rekapitulasi Presensi
            </h4>
            <table className="w-full text-xs border border-slate-400">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Hadir
                  </td>
                  <td className="py-1.5 px-3 font-bold text-emerald-800">{attStats.hadir} Hari</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Sakit (S)
                  </td>
                  <td className="py-1.5 px-3 font-bold text-blue-800">{attStats.sakit} Hari</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Izin (I)
                  </td>
                  <td className="py-1.5 px-3 font-bold text-amber-800">{attStats.izin} Hari</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Tanpa Keterangan (A)
                  </td>
                  <td className="py-1.5 px-3 font-bold text-rose-800">{attStats.alpa} Hari</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-100 font-bold border-r border-slate-300">
                    Persentase Kehadiran
                  </td>
                  <td className="py-1.5 px-3 font-black text-emerald-900">
                    {attStats.percentageHadir}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Keuangan Santri */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 mb-2 border-b border-emerald-900 pb-1">
              C. Administrasi Keuangan Santri
            </h4>
            <table className="w-full text-xs border border-slate-400">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Saldo Kas Tabungan
                  </td>
                  <td className="py-1.5 px-3 font-bold text-emerald-800">
                    {formatCurrency(savBalance.balance)}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-3 bg-slate-50 font-medium border-r border-slate-300">
                    Total Infak Disalurkan
                  </td>
                  <td className="py-1.5 px-3 font-bold text-slate-800">
                    {formatCurrency(totalInfaq)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-100 font-bold border-r border-slate-300">
                    Status Beban Iuran
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-emerald-900">
                    Tertib Terdaftar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <PrintSignatures
          homeroomTeacher={
            db.classes.find((c) => c.name === student.className)?.homeroomTeacher ||
            'Gustiana Hermawan, M.Pd.I'
          }
        />
      </div>
    </div>
  );
};
