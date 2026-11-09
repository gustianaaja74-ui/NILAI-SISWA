import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserAccount, ClassRoom } from '../types/index.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Settings,
  Shield,
  KeyRound,
  Users,
  Database,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const AccountSettingsView: React.FC = () => {
  const { db, updateDb, currentUser, resetDemoData, restoreBackup } = useApp();

  // Admin credentials state
  const [adminUsername, setAdminUsername] = useState(currentUser?.username || 'admin');
  const [adminPassword, setAdminPassword] = useState(currentUser?.password || 'admin123');
  const [adminSuccess, setAdminSuccess] = useState(false);

  // School settings state
  const [kkmInput, setKkmInput] = useState<number>(db.settings.kkmDefault || 75);
  const [academicYearInput, setAcademicYearInput] = useState(db.settings.academicYear);
  const [semesterInput, setSemesterInput] = useState<'Ganjil' | 'Genap'>(db.settings.semester);
  const [headmasterInput, setHeadmasterInput] = useState(db.settings.headmaster);
  const [schoolSettingsSuccess, setSchoolSettingsSuccess] = useState(false);

  // New Wali account form
  const [newWaliUsername, setNewWaliUsername] = useState('');
  const [newWaliPassword, setNewWaliPassword] = useState('wali123');
  const [newWaliStudentId, setNewWaliStudentId] = useState(db.students[0]?.id || '');

  // Edit / Reset password modal for wali
  const [editingWaliUser, setEditingWaliUser] = useState<UserAccount | null>(null);
  const [editWaliPass, setEditWaliPass] = useState('');
  const [editWaliUsername, setEditWaliUsername] = useState('');

  // Class management form
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generic in-app confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const handleUpdateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      showToast('Username dan password tidak boleh kosong');
      return;
    }

    await updateDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser?.id ? { ...u, username: adminUsername, password: adminPassword } : u
      ),
    }));

    setAdminSuccess(true);
    showToast('Kredensial admin berhasil diperbarui.');
    setTimeout(() => setAdminSuccess(false), 3000);
  };

  const handleUpdateSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDb((prev) => {
      const updatedSubjects = prev.subjects.map((s) => ({
        ...s,
        kkm: kkmInput,
      }));

      const updatedDailyGrades = prev.dailyGrades.map((g) => ({
        ...g,
        kkm: kkmInput,
        status: g.score >= kkmInput ? ('TUNTAS' as const) : ('REMEDIAL' as const),
      }));

      const updatedPeriodGrades = prev.periodGrades.map((g) => ({
        ...g,
        kkm: kkmInput,
        status: g.score >= kkmInput ? ('TUNTAS' as const) : ('REMEDIAL' as const),
      }));

      return {
        ...prev,
        subjects: updatedSubjects,
        dailyGrades: updatedDailyGrades,
        periodGrades: updatedPeriodGrades,
        settings: {
          ...prev.settings,
          kkmDefault: kkmInput,
          academicYear: academicYearInput,
          semester: semesterInput,
          headmaster: headmasterInput,
        },
      };
    });

    setSchoolSettingsSuccess(true);
    showToast('Standar KKM dan kalender akademik berhasil diterapkan.');
    setTimeout(() => setSchoolSettingsSuccess(false), 3000);
  };

  const handleCreateWaliAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaliUsername.trim() || !newWaliPassword.trim()) {
      showToast('Isi username dan password akun wali');
      return;
    }

    const student = db.students.find((s) => s.id === newWaliStudentId);

    const newAcc: UserAccount = {
      id: 'usr_wali_' + Date.now(),
      username: newWaliUsername.trim().toLowerCase(),
      password: newWaliPassword,
      role: 'wali',
      name: student ? `Wali ${student.name}` : 'Wali Murid',
      studentId: newWaliStudentId,
      createdAt: new Date().toISOString(),
    };

    await updateDb((prev) => ({
      ...prev,
      users: [...prev.users, newAcc],
    }));

    setNewWaliUsername('');
    setNewWaliPassword('wali123');
    showToast(`Akun wali ${newAcc.username} berhasil dibuat.`);
  };

  const handleSaveWaliEdit = async () => {
    if (!editingWaliUser) return;
    await updateDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === editingWaliUser.id
          ? {
              ...u,
              username: editWaliUsername || u.username,
              password: editWaliPass || u.password,
            }
          : u
      ),
    }));
    setEditingWaliUser(null);
    showToast('Perubahan akun wali berhasil disimpan.');
  };

  // Delete Wali Account with custom in-app confirm
  const promptDeleteWaliAccount = (user: UserAccount) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Akun Wali Murid',
      message: `Apakah Anda yakin ingin menghapus akun login wali "${user.username}" (${user.name})? Wali murid ini tidak akan dapat login lagi sampai akun baru dibuat.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== user.id),
        }));
        showToast(`Akun wali "${user.username}" berhasil dihapus.`);
      },
    });
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newCls: ClassRoom = {
      id: 'cls_' + Date.now(),
      name: newClassName.trim(),
      homeroomTeacher: newClassTeacher.trim() || 'Guru Wali Kelas, S.Pd.',
      academicYear: db.settings.academicYear,
      semester: db.settings.semester,
    };

    await updateDb((prev) => ({
      ...prev,
      classes: [...prev.classes, newCls],
    }));

    setNewClassName('');
    setNewClassTeacher('');
    showToast(`Kelas ${newCls.name} berhasil ditambahkan.`);
  };

  // Delete Class with custom in-app confirm
  const promptDeleteClass = (cls: ClassRoom) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Rombongan Belajar (Kelas)',
      message: `Apakah Anda yakin ingin menghapus "${cls.name}" (Wali: ${cls.homeroomTeacher})? Data siswa di kelas ini tetap tersimpan.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          classes: prev.classes.filter((c) => c.id !== cls.id),
        }));
        showToast(`Kelas "${cls.name}" berhasil dihapus.`);
      },
    });
  };

  // Bulk data cleanup prompts
  const promptClearDailyGrades = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Seluruh Nilai Harian',
      message: `Tindakan ini akan mengosongkan ${db.dailyGrades.length} data nilai harian/bab siswa. Apakah Anda yakin?`,
      action: async () => {
        await updateDb((prev) => ({ ...prev, dailyGrades: [] }));
        showToast('Seluruh data nilai harian berhasil dikosongkan.');
      },
    });
  };

  const promptClearPeriodGrades = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Seluruh Nilai PTS & PAS',
      message: `Tindakan ini akan mengosongkan ${db.periodGrades.length} data nilai PTS & PAS siswa. Apakah Anda yakin?`,
      action: async () => {
        await updateDb((prev) => ({ ...prev, periodGrades: [] }));
        showToast('Seluruh data nilai PTS & PAS berhasil dikosongkan.');
      },
    });
  };

  const promptClearSavings = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Riwayat Tabungan',
      message: `Tindakan ini akan menghapus seluruh ${db.savings.length} transaksi tabungan siswa dan mengembalikan saldo ke Rp 0. Apakah Anda yakin?`,
      action: async () => {
        await updateDb((prev) => ({ ...prev, savings: [] }));
        showToast('Seluruh riwayat tabungan berhasil dikosongkan.');
      },
    });
  };

  const promptClearInfaq = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Riwayat Infak',
      message: `Tindakan ini akan menghapus ${db.infaq.length} data catatan pembayaran infak bulanan. Apakah Anda yakin?`,
      action: async () => {
        await updateDb((prev) => ({ ...prev, infaq: [] }));
        showToast('Seluruh riwayat infak berhasil dikosongkan.');
      },
    });
  };

  const promptClearAttendance = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Riwayat Presensi / Absensi',
      message: `Tindakan ini akan menghapus ${db.attendance.length} catatan presensi harian siswa. Apakah Anda yakin?`,
      action: async () => {
        await updateDb((prev) => ({ ...prev, attendance: [] }));
        showToast('Seluruh riwayat presensi berhasil dikosongkan.');
      },
    });
  };

  const promptResetDatabase = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kembalikan Database ke Data Awal',
      message:
        'Tindakan ini akan mengembalikan seluruh data siswa, nilai, tabungan, dan akun ke data contoh awal MI Nurul Falah. Seluruh perubahan kustom akan digantikan. Lanjutkan?',
      action: async () => {
        await resetDemoData();
        showToast('Database berhasil dikembalikan ke data awal.');
      },
    });
  };

  // Backup file restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.students && parsed.users) {
            const ok = await restoreBackup(parsed);
            if (ok) {
              showToast('Data cadangan berhasil dipulihkan!');
            } else {
              showToast('Gagal memulihkan database ke server.');
            }
          } else {
            showToast('Format berkas backup tidak valid.');
          }
        } catch {
          showToast('Gagal membaca file JSON backup.');
        }
      };
      reader.readAsText(file);
    }
  };

  const waliUsers = db.users.filter((u) => u.role === 'wali');

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 bg-emerald-900 text-white rounded-xl shadow-2xl border border-amber-400 flex items-center gap-3 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Credential Management */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Lock className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">Kredensial Akun Admin / Guru</h3>
          </div>

          {adminSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Username dan kata sandi admin berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleUpdateAdminAccount} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username Admin</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
              <input
                type="text"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Simpan Perubahan Akun Admin
            </button>
          </form>
        </div>

        {/* School Standard & KKM Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Pengaturan KKM & Kalender</h3>
          </div>

          {schoolSettingsSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Standar KKM dan kalender madrasah berhasil disinkronisasi!
            </div>
          )}

          <form onSubmit={handleUpdateSchoolSettings} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Batas Nilai Remedial / KKM Standar (Default: 75)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                required
                value={kkmInput}
                onChange={(e) => setKkmInput(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-sm focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mengubah KKM di sini otomatis memperbarui status TUNTAS/REMEDIAL semua nilai di sistem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  required
                  value={academicYearInput}
                  onChange={(e) => setAcademicYearInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={semesterInput}
                  onChange={(e) => setSemesterInput(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Madrasah</label>
              <input
                type="text"
                required
                value={headmasterInput}
                onChange={(e) => setHeadmasterInput(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Terapkan Pengaturan KKM & Kalender
            </button>
          </form>
        </div>
      </div>

      {/* Class & Rombel Management (Bisa Tambah dan Hapus dengan Konfirmasi Kustom) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Kelola Rombongan Belajar (Kelas)</h3>
            <p className="text-xs text-slate-500">
              Daftar rombel aktif. Anda dapat menambahkan kelas baru atau menghapus kelas yang tidak digunakan.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            {db.classes.length} Kelas Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {db.classes.map((cls) => (
            <div
              key={cls.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <strong className="text-xs font-bold text-emerald-900 block">{cls.name}</strong>
                <span className="text-[11px] text-slate-500">{cls.homeroomTeacher}</span>
              </div>
              <button
                type="button"
                onClick={() => promptDeleteClass(cls)}
                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                title={`Hapus kelas ${cls.name}`}
                aria-label={`Hapus kelas ${cls.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-2 text-xs">
          <input
            type="text"
            required
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Nama Kelas (Contoh: Kelas 3B)"
            className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="text"
            value={newClassTeacher}
            onChange={(e) => setNewClassTeacher(e.target.value)}
            placeholder="Wali Kelas (Contoh: Ahmad, S.Pd.)"
            className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="px-5 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shrink-0 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas Baru
          </button>
        </form>
      </div>

      {/* Wali Murid Accounts Management (Bisa Tambah, Edit, dan Hapus) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              Manajemen Akun Portal Wali Murid
            </h3>
            <p className="text-xs text-slate-500">
              Buat akun baru, ubah username, reset password, atau hapus akun yang tidak aktif
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
            {waliUsers.length} Akun Wali
          </span>
        </div>

        {/* Create new Wali Murid account inline */}
        <form
          onSubmit={handleCreateWaliAccount}
          className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs items-end"
        >
          <div>
            <label className="block text-[11px] font-semibold text-blue-950 mb-1">Hubungkan ke Siswa</label>
            <select
              value={newWaliStudentId}
              onChange={(e) => setNewWaliStudentId(e.target.value)}
              className="w-full p-2 border border-blue-300 rounded-lg bg-white"
            >
              {db.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.className})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-blue-950 mb-1">Username Baru</label>
            <input
              type="text"
              required
              value={newWaliUsername}
              onChange={(e) => setNewWaliUsername(e.target.value)}
              placeholder="Contoh: wali_fauzi"
              className="w-full p-2 border border-blue-300 rounded-lg bg-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-blue-950 mb-1">Password</label>
            <input
              type="text"
              required
              value={newWaliPassword}
              onChange={(e) => setNewWaliPassword(e.target.value)}
              className="w-full p-2 border border-blue-300 rounded-lg bg-white font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Buat Akun Wali
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Nama Akun</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Password Terdaftar</th>
                <th className="py-2.5 px-3">Siswa Terkait</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waliUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada akun wali murid yang terdaftar.
                  </td>
                </tr>
              ) : (
                waliUsers.map((u) => {
                  const student = db.students.find((s) => s.id === u.studentId);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{u.username}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.password}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {student ? `${student.name} (${student.className})` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWaliUser(u);
                              setEditWaliUsername(u.username);
                              setEditWaliPass(u.password);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer transition-colors"
                          >
                            Ubah / Reset Password
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteWaliAccount(u)}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title={`Hapus akun wali ${u.username}`}
                            aria-label={`Hapus akun wali ${u.username}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone: Pembersihan & Hapus Data Per Kategori */}
      <div className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-100 mb-4">
          <Flame className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Pembersihan & Hapus Data (Data Cleanup)</h3>
            <p className="text-xs text-slate-500">
              Gunakan opsi ini untuk menghapus atau mengosongkan data spesifik saat pergantian semester / tahun ajaran baru.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Data Nilai Harian</strong>
              <span className="text-[11px] text-slate-500">{db.dailyGrades.length} rekaman tersimpan</span>
            </div>
            <button
              type="button"
              onClick={promptClearDailyGrades}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Kosongkan
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Data Nilai PTS & PAS</strong>
              <span className="text-[11px] text-slate-500">{db.periodGrades.length} rekaman tersimpan</span>
            </div>
            <button
              type="button"
              onClick={promptClearPeriodGrades}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Kosongkan
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Riwayat Tabungan</strong>
              <span className="text-[11px] text-slate-500">{db.savings.length} transaksi</span>
            </div>
            <button
              type="button"
              onClick={promptClearSavings}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Kosongkan
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Riwayat Infak</strong>
              <span className="text-[11px] text-slate-500">{db.infaq.length} data pembayaran</span>
            </div>
            <button
              type="button"
              onClick={promptClearInfaq}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Kosongkan
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Data Presensi / Absensi</strong>
              <span className="text-[11px] text-slate-500">{db.attendance.length} catatan kehadiran</span>
            </div>
            <button
              type="button"
              onClick={promptClearAttendance}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Kosongkan
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between">
            <div>
              <strong className="text-xs text-slate-900 block font-bold">Reset ke Setelan Awal</strong>
              <span className="text-[11px] text-slate-500">Pulihkan data contoh MI</span>
            </div>
            <button
              type="button"
              onClick={promptResetDatabase}
              className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Reset Total
            </button>
          </div>
        </div>
      </div>

      {/* Backup and Restore Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <Database className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Cadangkan & Pulihkan Database (Backup)</h3>
            <p className="text-xs text-slate-500">
              Unduh cadangan data berkala dalam format JSON aman atau pulihkan database saat migrasi perangkat.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/backup/download"
            download="backup-mi-nurul-falah.json"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Berkas Cadangan (Backup JSON)
          </a>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            Pulihkan dari File Backup
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Edit Wali Password Modal */}
      {editingWaliUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-3">
              Reset Akun Wali: {editingWaliUser.name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editWaliUsername}
                  onChange={(e) => setEditWaliUsername(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  value={editWaliPass}
                  onChange={(e) => setEditWaliPass(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWaliUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveWaliEdit}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable In-App Confirmation Modal */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={async () => {
            const action = confirmDialog.action;
            setConfirmDialog(null);
            await action();
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
