import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { AttendanceRecord, AttendanceStatus } from '../types/index.ts';
import {
  calculateAttendanceStats,
  checkDuplicateAttendance,
  formatDateIndo,
} from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  XCircle,
  Save,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? db.classes[0]?.name || 'Kelas 4A' : currentStudent?.className || 'Kelas 4A'
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterMonth, setFilterMonth] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Quick Daily Class Attendance Matrix (for today or selected date)
  const studentsInClass = db.students.filter(
    (s) => s.className === selectedClass && s.status === 'aktif'
  );

  // In-memory changes for class attendance on selectedDate
  const [dailyStatusMap, setDailyStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [dailyNotesMap, setDailyNotesMap] = useState<Record<string, string>>({});

  // Sync state when selectedDate or selectedClass changes
  React.useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach((s) => {
      const existing = db.attendance.find((a) => a.studentId === s.id && a.date === selectedDate);
      if (existing) {
        map[s.id] = existing.status;
        notes[s.id] = existing.notes || '';
      } else {
        map[s.id] = 'Hadir'; // default
        notes[s.id] = '';
      }
    });

    setDailyStatusMap(map);
    setDailyNotesMap(notes);
  }, [selectedDate, selectedClass, db.attendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyStatusMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNotesChange = (studentId: string, text: string) => {
    setDailyNotesMap((prev) => ({ ...prev, [studentId]: text }));
  };

  const handleSetAllPresent = () => {
    const map: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach((s) => {
      map[s.id] = 'Hadir';
    });
    setDailyStatusMap(map);
  };

  const handleSaveDailyAttendance = async () => {
    await updateDb((prev) => {
      // Remove records for this class & date to prevent duplicates
      const cleaned = prev.attendance.filter(
        (a) => !(a.className === selectedClass && a.date === selectedDate)
      );

      const newRecords: AttendanceRecord[] = studentsInClass.map((s) => ({
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        studentId: s.id,
        studentName: s.name,
        className: s.className,
        date: selectedDate,
        status: dailyStatusMap[s.id] || 'Hadir',
        notes: dailyNotesMap[s.id] || '',
        source: 'manual',
        createdAt: new Date().toISOString(),
      }));

      return {
        ...prev,
        attendance: [...cleaned, ...newRecords],
      };
    });

    alert(`Presensi ${selectedClass} tanggal ${formatDateIndo(selectedDate)} berhasil disimpan.`);
  };

  // Filter for history list
  const filteredRecords = db.attendance.filter((rec) => {
    if (!isAdmin) {
      if (rec.studentId !== currentStudent?.id) return false;
    } else {
      if (selectedClass !== 'Semua' && rec.className !== selectedClass) return false;
    }

    if (filterMonth !== 'Semua') {
      const monthNum = parseInt(filterMonth, 10);
      const recMonth = new Date(rec.date).getMonth() + 1;
      if (recMonth !== monthNum) return false;
    }

    if (searchQuery) {
      const match =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }

    return true;
  });

  const stats = calculateAttendanceStats(filteredRecords);

  const sheetHeaders = ['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Status Kehadiran', 'Keterangan', 'Sumber'];
  const sheetRows = filteredRecords.map((r, i) => [
    i + 1,
    r.date,
    r.studentName,
    r.className,
    r.status,
    r.notes || '-',
    r.source === 'leave_request' ? 'Surat Izin Disetujui' : 'Input Guru',
  ]);

  return (
    <div className="space-y-6">
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Tingkat Hadir</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{stats.percentageHadir}%</p>
          <span className="text-[10px] text-slate-400">{stats.total} total presensi</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-bold">Hadir (H)</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.hadir}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-blue-700 font-bold">Sakit (S)</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.sakit}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-amber-700 font-bold">Izin (I)</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.izin}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-rose-700 font-bold">Alpa (A)</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.alpa}</p>
        </div>
      </div>

      {/* Admin Quick Class Matrix Form */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-600 shadow-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-700" />
                Input Presensi Harian Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Pilih status kehadiran siswa dan simpan (mencegah pencatatan ganda pada tanggal yang sama).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={handleSetAllPresent}
                className="px-3 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                Set Semua Hadir
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3 text-center">Status Kehadiran</th>
                  <th className="py-2.5 px-3">Keterangan Tambahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsInClass.map((student, idx) => {
                  const status = dailyStatusMap[student.id] || 'Hadir';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{student.name}</td>
                      <td className="py-2 px-3 text-slate-500">{student.nis}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(student.id, st)}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                status === st
                                  ? st === 'Hadir'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : st === 'Sakit'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : st === 'Izin'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={dailyNotesMap[student.id] || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Catatan (opsional)..."
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveDailyAttendance}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Presensi Hari Ini ({formatDateIndo(selectedDate)})
            </button>
          </div>
        </div>
      )}

      {/* History and Recap Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="font-semibold text-slate-500">Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="Semua">Semua Kelas</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-500">Bulan:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau keterangan..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportSheetsButton
            sheetTitle="Rekap Presensi Siswa MI Nurul Falah"
            headers={sheetHeaders}
            rows={sheetRows}
          />

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Presensi
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Sumber Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada riwayat daftar hadir pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {formatDateIndo(r.date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.className}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Sakit'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'Izin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.notes || '-'}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {r.source === 'leave_request' ? 'Surat Izin Disetujui' : 'Input Presensi Guru'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-8 print-page">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 no-print">
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Daftar Hadir</h3>
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
              title="REKAPITULASI PRESENSI / DAFTAR HADIR SISWA"
              subtitle={`Kelas: ${selectedClass} • Tahun Ajaran: ${db.settings.academicYear} (${db.settings.semester})`}
            />

            <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-300 flex justify-between text-xs">
              <div>
                Hadir: <strong>{stats.hadir}</strong>
              </div>
              <div>
                Sakit: <strong>{stats.sakit}</strong>
              </div>
              <div>
                Izin: <strong>{stats.izin}</strong>
              </div>
              <div>
                Alpa: <strong>{stats.alpa}</strong>
              </div>
              <div>
                Persentase Kehadiran: <strong className="text-emerald-900">{stats.percentageHadir}%</strong>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelas</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Status</th>
                  <th className="py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{r.date}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{r.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{r.className}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {r.status}
                    </td>
                    <td className="py-1.5 px-3">{r.notes || '-'}</td>
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
    </div>
  );
};
