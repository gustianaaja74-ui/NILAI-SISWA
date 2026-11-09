import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ActiveTab } from './Navbar.tsx';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Wallet,
  HeartHandshake,
  Coins,
  Bell,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import {
  calculateSavingsBalance,
  calculateInfaqTotal,
  formatCurrency,
  formatDateIndo,
} from '../utils/academicRules.ts';

interface DashboardAdminProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({ setActiveTab }) => {
  const { db, pendingLeaveRequestsCount } = useApp();

  const totalStudents = db.students.filter((s) => s.status === 'aktif').length;
  const totalParents = db.users.filter((u) => u.role === 'wali').length;
  const totalClasses = db.classes.length;
  const totalSubjects = db.subjects.length;

  const savingsSummary = calculateSavingsBalance(db.savings);
  const totalInfaq = calculateInfaqTotal(db.infaq);

  // Today's attendance summary
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = db.attendance.filter((a) => a.date === today);
  const hadirCount = todayRecords.filter((a) => a.status === 'Hadir').length;
  const sakitCount = todayRecords.filter((a) => a.status === 'Sakit').length;
  const izinCount = todayRecords.filter((a) => a.status === 'Izin').length;
  const alpaCount = todayRecords.filter((a) => a.status === 'Alpa').length;

  const activeFees = db.extraFees.filter((f) => f.status === 'Aktif');

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Madrasah Identity */}
      <div className="relative overflow-hidden bg-linear-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-2xl shadow-lg border-b-4 border-amber-400 p-6 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
              alt="Logo Madrasah"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-amber-300 shadow-md bg-white p-0.5 shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-1 border border-amber-400/30">
                <Clock className="w-3.5 h-3.5" />
                Semester {db.settings.semester} Tahun Pelajaran {db.settings.academicYear}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Panel Administrasi & Wali Kelas
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                {db.settings.schoolName} — Madrasah Unggul, Berakhlakul Karimah
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('daily_grades')}
              className="px-3.5 py-2 text-xs font-bold bg-amber-400 text-emerald-950 rounded-xl hover:bg-amber-300 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              Input Nilai Siswa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-950 text-white rounded-xl transition-colors border border-emerald-600/60 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Isi Presensi Hari Ini
            </button>
          </div>
        </div>

        {/* Ambient background ornament */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
            alt=""
            className="w-64 h-64 rounded-full"
          />
        </div>
      </div>

      {/* Urgent Alert if pending leave requests */}
      {pendingLeaveRequestsCount > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950">
                Ada {pendingLeaveRequestsCount} Pengajuan Surat Izin / Sakit Menunggu Persetujuan
              </h4>
              <p className="text-xs text-amber-800">
                Wali murid telah mengirim surat izin atau surat sakit dari dokter yang perlu ditinjau.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('leave_requests')}
            className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shrink-0 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            Tinjau Sekarang
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid (Requirements: Siswa, Wali, Kelas, Mapel) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa Card */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Siswa Aktif</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalStudents}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span>Kelola data siswa & foto</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Wali Murid Card */}
        <div
          onClick={() => setActiveTab('settings')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Akun Wali Murid</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalParents}</p>
          <p className="text-[11px] text-blue-700 font-medium mt-1 flex items-center gap-1">
            <span>Kelola kredensial wali</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Kelas Card */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rombongan Belajar</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalClasses}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>{db.classes.map((c) => c.name).join(', ')}</span>
          </p>
        </div>

        {/* Mata Pelajaran Card */}
        <div
          onClick={() => setActiveTab('subjects')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mata Pelajaran</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSubjects}</p>
          <p className="text-[11px] text-purple-700 font-medium mt-1 flex items-center gap-1">
            <span>Standar KKM: {db.settings.kkmDefault}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Financial & Attendance Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kehadiran Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-800">Kehadiran Hari Ini</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{formatDateIndo(today)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-800 font-semibold">Hadir</p>
              <p className="text-lg font-black text-emerald-700">{hadirCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800 font-semibold">Sakit</p>
              <p className="text-lg font-black text-blue-700">{sakitCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold">Izin</p>
              <p className="text-lg font-black text-amber-700">{izinCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs text-rose-800 font-semibold">Alpa</p>
              <p className="text-lg font-black text-rose-700">{alpaCount}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className="w-full mt-4 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            Buka Form Absensi Harian
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ringkasan Tabungan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-800">Kas Tabungan Siswa</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Otomatis
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500">Total Saldo Simpanan:</span>
            <p className="text-2xl font-black text-emerald-800 tracking-tight">
              {formatCurrency(savingsSummary.balance)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500">Uang Masuk:</span>
              <p className="font-bold text-emerald-700">{formatCurrency(savingsSummary.totalIn)}</p>
            </div>
            <div>
              <span className="text-slate-500">Uang Keluar:</span>
              <p className="font-bold text-rose-600">{formatCurrency(savingsSummary.totalOut)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className="w-full mt-4 py-2 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            Catat Tabungan & Unduh Rekap
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ringkasan Infak & Iuran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">Infak & Iuran Aktif</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {activeFees.length} Iuran Berjalan
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500">Total Infak Terkumpul:</span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalInfaq)}
            </p>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <p className="font-medium">
              Iuran aktif: {activeFees[0]?.title || 'Tidak ada iuran saat ini'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('infaq')}
              className="py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center cursor-pointer"
            >
              Kelola Infak
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fees')}
              className="py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-center cursor-pointer"
            >
              Kelola Iuran
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-base text-slate-900">Pengumuman Terbaru Madrasah</h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            Buat / Kelola Pengumuman
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.announcements.slice(0, 2).map((anc) => (
            <div
              key={anc.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-bold text-emerald-800">{anc.targetClass}</span>
                <span>{formatDateIndo(anc.date)}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">{anc.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{anc.content}</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Oleh: {anc.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
