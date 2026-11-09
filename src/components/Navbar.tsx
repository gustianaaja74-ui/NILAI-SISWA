import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Wallet,
  HeartHandshake,
  CalendarCheck,
  FileText,
  Coins,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  FileCheck2,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'subjects'
  | 'daily_grades'
  | 'period_grades'
  | 'savings'
  | 'infaq'
  | 'attendance'
  | 'leave_requests'
  | 'fees'
  | 'announcements'
  | 'settings';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentStudent, logout, pendingLeaveRequestsCount, db } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Siswa & Kelas', icon: <Users className="w-4 h-4" /> },
    { id: 'subjects', label: 'Mata Pelajaran', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'daily_grades', label: 'Nilai Harian / Bab', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'period_grades', label: 'Nilai PTS & PAS', icon: <Award className="w-4 h-4" /> },
    { id: 'savings', label: 'Tabungan Siswa', icon: <Wallet className="w-4 h-4" /> },
    { id: 'infaq', label: 'Infak Bulanan', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'attendance', label: 'Daftar Hadir', icon: <CalendarCheck className="w-4 h-4" /> },
    {
      id: 'leave_requests',
      label: 'Surat Izin / Sakit',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: pendingLeaveRequestsCount,
    },
    { id: 'fees', label: 'Iuran Tambahan', icon: <Coins className="w-4 h-4" /> },
    { id: 'announcements', label: 'Pengumuman', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', label: 'Pengaturan & Backup', icon: <Settings className="w-4 h-4" /> },
  ];

  const waliNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Anak', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily_grades', label: 'Nilai Harian', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'period_grades', label: 'Nilai PTS & PAS', icon: <Award className="w-4 h-4" /> },
    { id: 'savings', label: 'Tabungan', icon: <Wallet className="w-4 h-4" /> },
    { id: 'infaq', label: 'Infak', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'attendance', label: 'Kehadiran', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'leave_requests', label: 'Kirim Surat Izin', icon: <FileText className="w-4 h-4" /> },
    { id: 'fees', label: 'Iuran Tambahan', icon: <Coins className="w-4 h-4" /> },
    { id: 'announcements', label: 'Pengumuman', icon: <Bell className="w-4 h-4" /> },
  ];

  const navItems = isAdmin ? adminNavItems : waliNavItems;

  return (
    <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow-md border-b-2 border-amber-400 no-print">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
              alt="Logo MI Nurul Falah"
              className="w-10 h-10 object-contain rounded-lg border border-amber-300 shadow-xs bg-white p-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                  NILAI SISWA
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-emerald-950 uppercase tracking-wider">
                  MI Nurul Falah
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 hidden sm:block">
                Tahun Ajaran {db.settings.academicYear} • Semester {db.settings.semester}
              </p>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">{currentUser.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-amber-300 text-emerald-900'
                        : 'bg-emerald-700 text-emerald-100 border border-emerald-600'
                    }`}
                  >
                    {isAdmin ? 'ADMIN / GURU' : `WALI (${currentStudent?.name || 'Siswa'})`}
                  </span>
                </div>
                {currentStudent && (
                  <span className="text-[11px] text-emerald-200">
                    {currentStudent.className} • NIS: {currentStudent.nis}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white bg-emerald-900/60 hover:bg-rose-700/80 rounded-lg transition-colors cursor-pointer border border-emerald-700/80"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-hidden"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Scrollable Bar */}
      <nav className="hidden md:block bg-emerald-900/90 border-t border-emerald-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-thin">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-600 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-emerald-900 border-t border-emerald-700 px-3 py-3 space-y-1">
          {currentUser && (
            <div className="px-3 py-2 mb-2 bg-emerald-800/80 rounded-lg text-xs border border-emerald-700">
              <p className="font-bold text-white">{currentUser.name}</p>
              <p className="text-emerald-200 text-[11px]">
                {isAdmin ? 'Akses Guru & Wali Kelas' : `Wali dari: ${currentStudent?.name || '-'}`}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-emerald-950 font-bold'
                      : 'text-emerald-100 hover:bg-emerald-800'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
