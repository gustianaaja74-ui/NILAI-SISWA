import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Eye, EyeOff, Lock, User, KeyRound, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim()) {
      setErrorMsg('Harap masukkan username Anda');
      return;
    }
    if (!password) {
      setErrorMsg('Harap masukkan kata sandi');
      return;
    }

    const res = login(username, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryUsername) return;
    setRecoverySent(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-800 via-emerald-900 to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Madrasah Logo Card */}
        <div className="flex flex-col items-center">
          <div className="relative p-1.5 bg-linear-to-br from-amber-300 via-amber-400 to-emerald-600 rounded-3xl shadow-2xl">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
              alt="Logo Nilai Siswa MI Nurul Falah"
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-inner bg-white"
            />
          </div>
          <h1 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            NILAI SISWA
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-0.5 w-6 bg-amber-400 rounded-full"></span>
            <p className="text-sm font-semibold tracking-wide uppercase text-amber-300">
              MI NURUL FALAH
            </p>
            <span className="h-0.5 w-6 bg-amber-400 rounded-full"></span>
          </div>
          <p className="mt-1 text-center text-xs text-emerald-200">
            Sistem Informasi Nilai Akademik, Keuangan & Absensi Terpadu
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border-t-4 border-amber-400">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih peran Anda atau masukkan kredensial yang telah diberikan
            </p>
          </div>

          {/* Quick Demo Selector Chips */}
          <div className="mb-5 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              Akses Cepat Pengujian (1-Klik):
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'admin123')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
              >
                Gustiana (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('wali_ahmad', 'wali123')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 text-slate-900 rounded-md hover:bg-amber-600 transition-colors cursor-pointer shadow-xs"
              >
                Wali Ahmad Fauzi
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('wali_aisyah', 'wali123')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-300 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
              >
                Wali Siti Aisyah
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Username / ID Pengguna
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau username wali"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer transition-all"
              >
                Masuk ke Aplikasi
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Sistem Keamanan Berbasis Hak Akses & Data Terenkripsi
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-emerald-800 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <HelpCircle className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Pemulihan Akun & Kata Sandi</h3>
                <p className="text-xs text-slate-500">MI Nurul Falah Security Protocol</p>
              </div>
            </div>

            {recoverySent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Permintaan Telah Diteruskan</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Permintaan reset password untuk akun <strong>{recoveryUsername}</strong> telah
                  tercatat di log sistem. Silakan hubungi Tata Usaha atau Wali Kelas Anda untuk
                  mendapatkan kode reset verifikasi.
                </p>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-left text-slate-700 border border-slate-200">
                  <p className="font-semibold text-emerald-800">Layanan Bantuan Madrasah:</p>
                  <p className="mt-1">📞 WhatsApp Admin: 0812-9988-7766</p>
                  <p>📍 Ruang TU MI Nurul Falah (Senin - Sabtu: 07.30 - 14.00)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setRecoverySent(false);
                  }}
                  className="mt-5 w-full py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Demi keamanan data akademik siswa, reset kata sandi diverifikasi melalui nomor
                  induk siswa atau username wali murid yang terdaftar.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masukkan Username atau Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryUsername}
                    onChange={(e) => setRecoveryUsername(e.target.value)}
                    placeholder="Contoh: wali_ahmad atau Ahmad Fauzi"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    Ajukan Pemulihan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
