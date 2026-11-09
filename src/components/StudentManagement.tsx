import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Student, ClassRoom, UserAccount } from '../types/index.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Upload,
  UserCheck,
  Printer,
  X,
  Check,
  User,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { db, updateDb } = useApp();

  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formClass, setFormClass] = useState(db.classes[0]?.name || 'Kelas 4A');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhoto, setFormPhoto] = useState<string>('');
  const [createParentAccount, setCreateParentAccount] = useState(true);
  const [parentUsername, setParentUsername] = useState('');
  const [parentPassword, setParentPassword] = useState('wali123');

  // Handle local photo upload from gallery / PC
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormNis(`2024040${db.students.length + 1}`);
    setFormNisn(`012847291${db.students.length + 1}`);
    setFormGender('L');
    setFormClass(db.classes[0]?.name || 'Kelas 4A');
    setFormParentName('');
    setFormParentPhone('');
    setFormAddress('');
    setFormPhoto('');
    setCreateParentAccount(true);
    setParentUsername('');
    setParentPassword('wali123');
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormNis(student.nis);
    setFormNisn(student.nisn);
    setFormGender(student.gender);
    setFormClass(student.className);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormAddress(student.address);
    setFormPhoto(student.photoUrl);
    setCreateParentAccount(false);
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNis.trim()) {
      alert('Nama siswa dan NIS wajib diisi');
      return;
    }

    if (editingStudent) {
      // Edit existing
      await updateDb((prev) => {
        const updatedStudents = prev.students.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: formName,
                nis: formNis,
                nisn: formNisn,
                gender: formGender,
                className: formClass,
                parentName: formParentName,
                parentPhone: formParentPhone,
                address: formAddress,
                photoUrl: formPhoto,
              }
            : s
        );
        return { ...prev, students: updatedStudents };
      });
    } else {
      // Create new
      const newStudentId = 'std_' + Date.now();
      const newStudent: Student = {
        id: newStudentId,
        name: formName,
        nis: formNis,
        nisn: formNisn,
        gender: formGender,
        className: formClass,
        academicYear: db.settings.academicYear,
        semester: db.settings.semester,
        parentName: formParentName,
        parentPhone: formParentPhone,
        address: formAddress,
        photoUrl: formPhoto,
        status: 'aktif',
        createdAt: new Date().toISOString(),
      };

      await updateDb((prev) => {
        const nextUsers = [...prev.users];
        if (createParentAccount) {
          const autoUsername =
            parentUsername.trim() || `wali_${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          const newAccount: UserAccount = {
            id: 'usr_wali_' + Date.now(),
            username: autoUsername,
            password: parentPassword || 'wali123',
            role: 'wali',
            name: formParentName ? `Bpk/Ibu ${formParentName}` : `Wali ${formName}`,
            studentId: newStudentId,
            createdAt: new Date().toISOString(),
          };
          nextUsers.push(newAccount);
        }
        return {
          ...prev,
          students: [...prev.students, newStudent],
          users: nextUsers,
        };
      });
    }

    setShowAddModal(false);
  };

  const handleToggleStudentStatus = (student: Student) => {
    const nextStatus = student.status === 'aktif' ? 'nonaktif' : 'aktif';
    setConfirmDialog({
      isOpen: true,
      title: 'Ubah Status Siswa',
      message: `Ubah status siswa "${student.name}" menjadi ${nextStatus.toUpperCase()}?`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === student.id ? { ...s, status: nextStatus } : s
          ),
        }));
      },
    });
  };

  const handleDeleteStudent = (student: Student) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Siswa',
      message: `Hapus permanen data siswa "${student.name}"? Data riwayat nilai dan keuangan terkait akan tetap tersimpan di arsip.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          students: prev.students.filter((s) => s.id !== student.id),
        }));
      },
    });
  };

  // Filtered students
  const filteredStudents = db.students.filter((s) => {
    const matchClass = selectedClass === 'Semua' || s.className === selectedClass;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.nisn.includes(searchQuery);
    return matchClass && matchSearch;
  });

  // Google Sheets Export Data
  const sheetHeaders = [
    'No',
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Jenis Kelamin',
    'Kelas',
    'Nama Wali Murid',
    'No. HP Wali',
    'Alamat',
    'Status',
  ];
  const sheetRows = filteredStudents.map((s, idx) => [
    idx + 1,
    s.nis,
    s.nisn,
    s.name,
    s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    s.className,
    s.parentName,
    s.parentPhone,
    s.address,
    s.status.toUpperCase(),
  ]);

  return (
    <div className="space-y-5">
      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, NIS, atau NISN..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportSheetsButton
            sheetTitle={`Data Siswa MI Nurul Falah ${selectedClass}`}
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

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-16 text-center">Foto</th>
                <th className="py-3 px-4">Nama Siswa & NIS</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Wali Murid & Kontak</th>
                <th className="py-3 px-4">Akun Portal Wali</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const parentAcc = db.users.find(
                    (u) => u.role === 'wali' && u.studentId === student.id
                  );

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover border border-emerald-600 mx-auto shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mx-auto">
                            {student.name.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block text-sm">
                          {student.name}
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          NIS: {student.nis} | NISN: {student.nisn} ({student.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{student.parentName || '-'}</p>
                        <p className="text-slate-500 text-[11px]">{student.parentPhone || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        {parentAcc ? (
                          <div className="text-[11px]">
                            <span className="font-mono text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                              {parentAcc.username}
                            </span>
                            <p className="text-slate-400 text-[10px]">Pass: {parentAcc.password}</p>
                          </div>
                        ) : (
                          <span className="text-rose-500 text-[11px] font-semibold">
                            Belum dibuat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStudentStatus(student)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            student.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {student.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
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

      {/* Modal Add / Edit Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru MI Nurul Falah'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Photo Upload Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  {formPhoto ? (
                    <img
                      src={formPhoto}
                      alt="Preview Foto"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-600 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Unggah Pasfoto Siswa (Dari Galeri HP / PC)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Format file JPG, PNG, atau WEBP (Maksimal 5MB). Foto disimpan langsung di aplikasi.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Foto dari Perangkat
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {formPhoto && (
                    <button
                      type="button"
                      onClick={() => setFormPhoto('')}
                      className="ml-2 text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi Rahman"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Siswa (NIS) *</label>
                  <input
                    type="text"
                    required
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="Contoh: 20240401"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN Nasional</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="Contoh: 0128472911"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Rombel</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.homeroomTeacher})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Nama bapak/ibu wali"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Alamat domisili siswa..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Automatic Account Generation for Parent */}
              {!editingStudent && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="createAccountCheck"
                      checked={createParentAccount}
                      onChange={(e) => setCreateParentAccount(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="createAccountCheck" className="text-xs font-bold text-amber-950">
                      Buat Akun Portal Wali Murid Secara Otomatis
                    </label>
                  </div>
                  {createParentAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <label className="block text-[11px] text-amber-900 font-medium">Username Wali</label>
                        <input
                          type="text"
                          value={parentUsername}
                          onChange={(e) => setParentUsername(e.target.value)}
                          placeholder="Kosongkan untuk auto: wali_nama"
                          className="w-full p-2 border border-amber-300 rounded-md bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-amber-900 font-medium">Password Default</label>
                        <input
                          type="text"
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          className="w-full p-2 border border-amber-300 rounded-md bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
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
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Data Siswa</h3>
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

            {/* Official Kop & Body for Print */}
            <PrintHeader
              title={`DAFTAR DATA INDUK SISWA ${selectedClass.toUpperCase()}`}
              subtitle="Madrasah Ibtidaiyah Nurul Falah"
            />

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">NIS / NISN</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">L/P</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelas</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Wali</th>
                  <th className="py-2 px-3">Kontak Wali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      {s.nis} / {s.nisn}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{s.name}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{s.gender}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{s.className}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{s.parentName}</td>
                    <td className="py-1.5 px-3">{s.parentPhone}</td>
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
