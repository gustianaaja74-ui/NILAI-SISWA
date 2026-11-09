import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ExtraFee, FeePayment } from '../types/index.ts';
import { formatCurrency, formatDateIndo } from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Coins,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';

export const ExtraFeesView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedFeeId, setSelectedFeeId] = useState<string>('Semua');
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<ExtraFee | null>(null);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<ExtraFee | null>(null);

  // In-app confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form states for new fee
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(100000);
  const [formDueDate, setFormDueDate] = useState('2026-05-30');
  const [formTargetClass, setFormTargetClass] = useState('Semua Kelas');

  const openAddModal = () => {
    setEditingFee(null);
    setFormTitle('');
    setFormDescription('');
    setFormAmount(100000);
    setFormDueDate('2026-05-30');
    setFormTargetClass('Semua Kelas');
    setShowAddFeeModal(true);
  };

  const openEditModal = (fee: ExtraFee) => {
    setEditingFee(fee);
    setFormTitle(fee.title);
    setFormDescription(fee.description);
    setFormAmount(fee.amount);
    setFormDueDate(fee.dueDate);
    setFormTargetClass(fee.targetClass);
    setShowAddFeeModal(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Judul iuran wajib diisi.');
      return;
    }

    if (editingFee) {
      await updateDb((prev) => ({
        ...prev,
        extraFees: prev.extraFees.map((f) =>
          f.id === editingFee.id
            ? {
                ...f,
                title: formTitle,
                description: formDescription,
                amount: formAmount,
                dueDate: formDueDate,
                targetClass: formTargetClass,
              }
            : f
        ),
      }));
    } else {
      const newFeeId = 'fee_' + Date.now();
      const newFee: ExtraFee = {
        id: newFeeId,
        title: formTitle,
        description: formDescription,
        amount: formAmount,
        dueDate: formDueDate,
        targetClass: formTargetClass,
        status: 'Aktif',
        createdAt: new Date().toISOString(),
      };

      // Seed initial payment records as 'BELUM LUNAS' for targeted students
      const eligibleStudents = db.students.filter(
        (s) => formTargetClass === 'Semua Kelas' || s.className === formTargetClass
      );
      const initialPayments: FeePayment[] = eligibleStudents.map((s) => ({
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        feeId: newFeeId,
        studentId: s.id,
        studentName: s.name,
        paidAmount: 0,
        status: 'BELUM LUNAS',
      }));

      await updateDb((prev) => ({
        ...prev,
        extraFees: [newFee, ...prev.extraFees],
        feePayments: [...prev.feePayments, ...initialPayments],
      }));
    }

    setShowAddFeeModal(false);
  };

  const handleToggleFeeStatus = async (fee: ExtraFee) => {
    const nextStatus = fee.status === 'Aktif' ? 'Selesai' : 'Aktif';
    await updateDb((prev) => ({
      ...prev,
      extraFees: prev.extraFees.map((f) =>
        f.id === fee.id ? { ...f, status: nextStatus } : f
      ),
    }));
  };

  const handleDeleteFee = (fee: ExtraFee) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Iuran Tambahan',
      message: `Apakah Anda yakin ingin menghapus iuran "${fee.title}"? Catatan riwayat pembayaran yang sudah masuk akan tetap tersimpan dalam arsip sistem.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          extraFees: prev.extraFees.filter((f) => f.id !== fee.id),
        }));
        if (selectedFeeId === fee.id) {
          setSelectedFeeId('Semua');
        }
      },
    });
  };

  // Toggle student payment status
  const handleTogglePaymentStatus = async (
    feeId: string,
    studentId: string,
    studentName: string,
    targetStatus: 'LUNAS' | 'BELUM LUNAS'
  ) => {
    const fee = db.extraFees.find((f) => f.id === feeId);
    if (!fee) return;

    await updateDb((prev) => {
      const existing = prev.feePayments.find(
        (p) => p.feeId === feeId && p.studentId === studentId
      );

      if (existing) {
        return {
          ...prev,
          feePayments: prev.feePayments.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  status: targetStatus,
                  paidAmount: targetStatus === 'LUNAS' ? fee.amount : 0,
                  paidDate: targetStatus === 'LUNAS' ? new Date().toISOString().split('T')[0] : undefined,
                  notes: targetStatus === 'LUNAS' ? 'Lunas tercatat oleh tata usaha' : '',
                }
              : p
          ),
        };
      } else {
        const newPay: FeePayment = {
          id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          feeId,
          studentId,
          studentName,
          paidAmount: targetStatus === 'LUNAS' ? fee.amount : 0,
          status: targetStatus,
          paidDate: targetStatus === 'LUNAS' ? new Date().toISOString().split('T')[0] : undefined,
          notes: targetStatus === 'LUNAS' ? 'Lunas tercatat oleh tata usaha' : '',
        };
        return { ...prev, feePayments: [...prev.feePayments, newPay] };
      }
    });
  };

  // Filter fees for user view
  const visibleFees = db.extraFees.filter((f) => {
    if (!isAdmin) {
      if (!currentStudent) return false;
      return (
        f.status === 'Aktif' &&
        (f.targetClass === 'Semua Kelas' || f.targetClass === currentStudent.className)
      );
    }
    return true;
  });

  const activeFeeSelected =
    selectedFeeId === 'Semua'
      ? visibleFees[0]
      : visibleFees.find((f) => f.id === selectedFeeId) || visibleFees[0];

  // Students for payment matrix
  const relevantStudents = activeFeeSelected
    ? db.students.filter(
        (s) =>
          activeFeeSelected.targetClass === 'Semua Kelas' ||
          s.className === activeFeeSelected.targetClass
      )
    : [];

  const sheetHeaders = ['No', 'Iuran', 'Nama Siswa', 'Kelas', 'Nominal', 'Status Pembayaran', 'Tanggal Bayar'];
  const sheetRows = relevantStudents.map((s, idx) => {
    const pay = db.feePayments.find(
      (p) => p.feeId === activeFeeSelected?.id && p.studentId === s.id
    );
    return [
      idx + 1,
      activeFeeSelected?.title || '',
      s.name,
      s.className,
      activeFeeSelected?.amount || 0,
      pay?.status || 'BELUM LUNAS',
      pay?.paidDate || '-',
    ];
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            Manajemen Iuran & Dana Kegiatan Tambahan
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? 'Kelola iuran berkala atau mendadak, tentukan sasaran kelas, dan catat status pelunasan.'
              : 'Daftar kewajiban iuran kegiatan yang berlaku untuk putra/putri Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeFeeSelected && (
            <ExportSheetsButton
              sheetTitle={`Laporan Iuran ${activeFeeSelected.title}`}
              headers={sheetHeaders}
              rows={sheetRows}
            />
          )}

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Iuran Baru
            </button>
          )}
        </div>
      </div>

      {/* Fees List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleFees.length === 0 ? (
          <div className="col-span-3 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Tidak ada data iuran aktif.
          </div>
        ) : (
          visibleFees.map((fee) => {
            const isSelected = activeFeeSelected?.id === fee.id;
            const payments = db.feePayments.filter((p) => p.feeId === fee.id);
            const lunasCount = payments.filter((p) => p.status === 'LUNAS').length;

            // If Wali Murid, show student specific payment status
            const waliStudentPayment = !isAdmin && currentStudent
              ? db.feePayments.find(
                  (p) => p.feeId === fee.id && p.studentId === currentStudent.id
                )
              : null;

            return (
              <div
                key={fee.id}
                onClick={() => setSelectedFeeId(fee.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {fee.targetClass}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fee.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {fee.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-1">{fee.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {fee.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Besaran Iuran:</span>
                      <strong className="text-base font-black text-emerald-800">
                        {formatCurrency(fee.amount)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Jatuh Tempo:</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatDateIndo(fee.dueDate)}
                      </span>
                    </div>
                  </div>

                  {!isAdmin && waliStudentPayment && (
                    <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Status Anak:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          waliStudentPayment.status === 'LUNAS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {waliStudentPayment.status === 'LUNAS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {waliStudentPayment.status}
                      </span>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-3 text-[11px] text-slate-500 font-medium">
                      Pelunasan: <strong>{lunasCount} siswa lunas</strong>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeeStatus(fee);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-medium"
                    >
                      {fee.status === 'Aktif' ? 'Tandai Selesai' : 'Aktifkan Kembali'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(fee);
                        }}
                        className="p-1 text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                        title="Edit Iuran"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFee(fee);
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="Hapus Iuran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Admin Payment Checklist Matrix for Selected Fee */}
      {isAdmin && activeFeeSelected && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Daftar Status Pembayaran Siswa: {activeFeeSelected.title}
              </h3>
              <p className="text-xs text-slate-500">
                Klik status untuk memperbarui catatan pelunasan iuran siswa.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
              Tarif: {formatCurrency(activeFeeSelected.amount)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Status Pembayaran</th>
                  <th className="py-2.5 px-3">Tanggal Bayar</th>
                  <th className="py-2.5 px-3">Catatan / Bukti</th>
                  <th className="py-2.5 px-3 text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantStudents.map((student, idx) => {
                  const pay = db.feePayments.find(
                    (p) => p.feeId === activeFeeSelected.id && p.studentId === student.id
                  );
                  const isLunas = pay?.status === 'LUNAS';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{student.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{student.className}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLunas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {pay?.paidDate ? formatDateIndo(pay.paidDate) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{pay?.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isLunas ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePaymentStatus(
                                activeFeeSelected.id,
                                student.id,
                                student.name,
                                'BELUM LUNAS'
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                          >
                            Batalkan Lunas
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePaymentStatus(
                                activeFeeSelected.id,
                                student.id,
                                student.name,
                                'LUNAS'
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            Tandai LUNAS
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Fee Modal */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingFee ? 'Edit Iuran Tambahan' : 'Buat Iuran Kegiatan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFeeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama / Judul Iuran *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Iuran Kemah Santri, Iuran Seragam"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Keperluan</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Rincian peruntukan iuran..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-base focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Pembayaran</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sasaran Kelas</label>
                <select
                  value={formTargetClass}
                  onChange={(e) => setFormTargetClass(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Iuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintModal && activeFeeSelected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-8 print-page">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 no-print">
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Laporan Iuran</h3>
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
              title={`REKAP STATUS PEMBAYARAN IURAN TAMBAHAN`}
              subtitle={`Kegiatan: ${activeFeeSelected.title} (Tarif: ${formatCurrency(activeFeeSelected.amount)})`}
            />

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelas</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Nominal</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Status</th>
                  <th className="py-2 px-3">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {relevantStudents.map((s, i) => {
                  const pay = db.feePayments.find(
                    (p) => p.feeId === activeFeeSelected.id && p.studentId === s.id
                  );
                  const isLunas = pay?.status === 'LUNAS';

                  return (
                    <tr key={s.id}>
                      <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{s.name}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300">{s.className}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 text-right">
                        {formatCurrency(activeFeeSelected.amount)}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                        {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                      </td>
                      <td className="py-1.5 px-3">{pay?.paidDate || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <PrintSignatures />
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel="Hapus Iuran"
          confirmVariant="danger"
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
};
