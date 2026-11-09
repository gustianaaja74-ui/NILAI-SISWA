import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ActiveTab } from './Navbar.tsx';
import {
  GraduationCap,
  Wallet,
  HeartHandshake,
  CalendarCheck,
  FileText,
  Bell,
  Coins,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  calculateSavingsBalance,
  calculateInfaqTotal,
  calculateAttendanceStats,
  formatCurrency,
  formatDateIndo,
} from '../utils/academicRules.ts';

interface DashboardWaliProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReport: () => void;
}

export const DashboardWali: React.FC<DashboardWaliProps> = ({ setActiveTab, onOpenReport }) => {
  const { currentStudent, db } = useApp();

  if (!currentStudent) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Data Siswa Belum Terhubung</h3>
        <p className="text-xs text-slate-500 mt-1">
          Akun wali murid Anda belum dihubungkan dengan profil siswa. Silakan hubungi wali kelas.
        </p>
      </div>
    );
  }

  // Student specific data - strictly filtered!
  const studentSavings = db.savings.filter((s) => s.studentId === currentStudent.id);
  const savingsSummary = calculateSavingsBalance(studentSavings);

  const studentInfaq = db.infaq.filter((i) => i.studentId === currentStudent.id);
  const totalInfaq = calculateInfaqTotal(studentInfaq);

  const studentAttendance = db.attendance.filter((a) => a.studentId === currentStudent.id);
  const attendanceStats = calculateAttendanceStats(studentAttendance);

  // Strictly ONLY released grades
  const releasedDaily = db.dailyGrades.filter(
    (g) => g.studentId === currentStudent.id && g.isReleased
  );
  const releasedPts = db.periodGrades.filter(
    (g) => g.studentId === currentStudent.id && g.type === 'PTS' && g.isReleased
  );
  const releasedPas = db.periodGrades.filter(
    (g) => g.studentId === currentStudent.id && g.type === 'PAS' && g.isReleased
  );

  const averageDaily =
    releasedDaily.length > 0
      ? Math.round(
          releasedDaily.reduce((acc, curr) => acc + curr.score, 0) / releasedDaily.length
        )
      : null;

  // Student applicable extra fees
  const applicableFees = db.extraFees.filter(
    (f) =>
      f.status === 'Aktif' &&
      (f.targetClass === 'Semua Kelas' || f.targetClass === currentStudent.className)
  );

  // Student announcements
  const announcements = db.announcements.filter(
    (a) => a.targetClass === 'Semua Kelas' || a.targetClass === currentStudent.className
  );

  return (
    <div className="space-y-6">
      {/* Student Identity Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-linear-to-r from-emerald-800 to-emerald-700 p-6 text-white border-b-4 border-amber-400">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Student Photo */}
            <div className="relative">
              {currentStudent.photoUrl ? (
                <img
                  src={currentStudent.photoUrl}
                  alt={currentStudent.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-3 border-amber-300 shadow-md bg-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-900/60 border-3 border-amber-300 flex items-center justify-center text-amber-200">
                  <User className="w-12 h-12" />
                </div>
              )}
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950 uppercase shadow-xs">
                {currentStudent.gender === 'L' ? 'Putra' : 'Putri'}
              </span>
            </div>

            {/* Student Meta Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-200 text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                Portal Resmi Wali Murid MI Nurul Falah
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {currentStudent.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                NIS: <strong>{currentStudent.nis}</strong> | NISN: <strong>{currentStudent.nisn}</strong>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/20 backdrop-blur-xs text-white">
                  {currentStudent.className}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 text-emerald-100">
                  Tahun Pelajaran {currentStudent.academicYear}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 text-emerald-100">
                  Semester {currentStudent.semester}
                </span>
              </div>
            </div>

            {/* Print & Action Quick Buttons */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenReport}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Rapor Nilai
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leave_requests')}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-emerald-900/80 hover:bg-emerald-950 rounded-xl border border-emerald-600/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Kirim Surat Izin
              </button>
            </div>
          </div>
        </div>

        {/* Parent Details strip */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400">Nama Wali:</span>{' '}
            <strong className="text-slate-800">{currentStudent.parentName}</strong>
          </div>
          <div>
            <span className="text-slate-400">Kontak:</span>{' '}
            <span className="text-slate-700">{currentStudent.parentPhone}</span>
          </div>
          <div>
            <span className="text-slate-400">Wali Kelas:</span>{' '}
            <strong className="text-emerald-800">
              {db.classes.find((c) => c.name === currentStudent.className)?.homeroomTeacher ||
                'Gustiana Hermawan, M.Pd.I'}
            </strong>
          </div>
        </div>
      </div>

      {/* Highlights Grid (Akademik, Tabungan, Infak, Kehadiran) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ringkasan Nilai Card */}
        <div
          onClick={() => setActiveTab('daily_grades')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nilai Akademik</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900">
              {averageDaily !== null ? averageDaily : '-'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rata-rata Nilai Harian ({releasedDaily.length} nilai terilis)
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold">
              PTS: {releasedPts.length > 0 ? `${releasedPts[0].score}` : 'Belum dirilis'}
            </span>
            <span className="text-slate-400 flex items-center gap-0.5 group-hover:text-emerald-700">
              Lihat detail <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Saldo Tabungan Card */}
        <div
          onClick={() => setActiveTab('savings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Tabungan</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-800 tracking-tight">
              {formatCurrency(savingsSummary.balance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total masuk: {formatCurrency(savingsSummary.totalIn)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{studentSavings.length} transaksi</span>
            <span className="text-slate-400 flex items-center gap-0.5 group-hover:text-amber-700">
              Buku mutasi <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Infak Card */}
        <div
          onClick={() => setActiveTab('infaq')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Infak Bulanan</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalInfaq)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tercatat {studentInfaq.length} bulan pembayaran
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 font-medium">Jazakumullah Khairan</span>
            <span className="text-slate-400 flex items-center gap-0.5 group-hover:text-blue-700">
              Riwayat <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Kehadiran Card */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tingkat Kehadiran</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-emerald-700">
              {attendanceStats.percentageHadir}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {attendanceStats.hadir} Hadir • {attendanceStats.sakit} Sakit • {attendanceStats.izin}{' '}
              Izin • {attendanceStats.alpa} Alpa
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{attendanceStats.total} hari aktif</span>
            <span className="text-slate-400 flex items-center gap-0.5 group-hover:text-purple-700">
              Detail absen <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Iuran & Pengumuman Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Iuran Tambahan Anak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Iuran Kegiatan Anak</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('fees')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {applicableFees.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Tidak ada tanggungan iuran aktif saat ini.
              </p>
            ) : (
              applicableFees.map((fee) => {
                const payment = db.feePayments.find(
                  (p) => p.feeId === fee.id && p.studentId === currentStudent.id
                );
                const isLunas = payment?.status === 'LUNAS';

                return (
                  <div
                    key={fee.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{fee.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Batas: {formatDateIndo(fee.dueDate)} • {formatCurrency(fee.amount)}
                      </p>
                    </div>
                    <div>
                      {isLunas ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                          <AlertCircle className="w-3.5 h-3.5" />
                          BELUM LUNAS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pengumuman Madrasah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Pengumuman Sekolah</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              Semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Belum ada pengumuman.</p>
            ) : (
              announcements.slice(0, 2).map((anc) => (
                <div
                  key={anc.id}
                  className="p-3 rounded-xl border border-slate-200 bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-bold text-emerald-800">{anc.author}</span>
                    <span>{formatDateIndo(anc.date)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{anc.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{anc.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
