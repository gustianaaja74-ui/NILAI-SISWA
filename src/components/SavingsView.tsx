import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { SavingsTransaction } from '../types/index.ts';
import { calculateSavingsBalance, formatCurrency, formatDateIndo } from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';

export const SavingsView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isAdmin ? 'Semua' : currentStudent?.id || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // In-app confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState(db.students[0]?.id || '');
  const [formType, setFormType] = useState<'IN' | 'OUT'>('IN');
  const [formAmount, setFormAmount] = useState<number>(20000);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  const openAddModal = (type: 'IN' | 'OUT' = 'IN') => {
    setFormType(type);
    setFormAmount(type === 'IN' ? 25000 : 10000);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes(type === 'IN' ? 'Setoran tabungan mingguan' : 'Penarikan kebutuhan belajar');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = db.students.find((s) => s.id === formStudentId);
    if (!student) {
      alert('Pilih siswa');
      return;
    }
    if (formAmount <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    // Check if OUT doesn't exceed balance
    if (formType === 'OUT') {
      const studentTxns = db.savings.filter((s) => s.studentId === student.id);
      const curBal = calculateSavingsBalance(studentTxns).balance;
      if (formAmount > curBal) {
        alert(`Saldo tidak mencukupi. Saldo saat ini: ${formatCurrency(curBal)}`);
        return;
      }
    }

    const newTx: SavingsTransaction = {
      id: 'svg_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      type: formType,
      amount: formAmount,
      date: formDate,
      notes: formNotes,
      recordedBy: currentUser?.name || 'Gustiana Hermawan',
      createdAt: new Date().toISOString(),
    };

    await updateDb((prev) => ({
      ...prev,
      savings: [newTx, ...prev.savings],
    }));

    setShowModal(false);
  };

  const handleDelete = (tx: SavingsTransaction) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi Tabungan',
      message: `Apakah Anda yakin ingin menghapus transaksi tabungan senilai ${formatCurrency(tx.amount)} (${tx.type === 'IN' ? 'Uang Masuk' : 'Uang Keluar'}) untuk ${tx.studentName}? Saldo siswa akan otomatis diperbarui.`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          savings: prev.savings.filter((s) => s.id !== tx.id),
        }));
      },
    });
  };

  // Filter transactions
  const filteredSavings = db.savings.filter((tx) => {
    if (!isAdmin) {
      // Wali murid only sees their child's savings!
      return tx.studentId === currentStudent?.id;
    }

    if (selectedStudentId !== 'Semua' && tx.studentId !== selectedStudentId) return false;
    if (selectedClass !== 'Semua' && tx.className !== selectedClass) return false;
    if (searchQuery) {
      const match =
        tx.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.notes.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const overallBalance = calculateSavingsBalance(filteredSavings);

  const sheetHeaders = [
    'No',
    'Tanggal',
    'Nama Siswa',
    'Kelas',
    'Jenis',
    'Nominal (Rp)',
    'Keterangan',
    'Petugas Kasir',
  ];
  const sheetRows = filteredSavings.map((tx, idx) => [
    idx + 1,
    tx.date,
    tx.studentName,
    tx.className,
    tx.type === 'IN' ? 'SETORAN (MASUK)' : 'PENARIKAN (KELUAR)',
    tx.amount,
    tx.notes,
    tx.recordedBy,
  ]);

  return (
    <div className="space-y-5">
      {/* Balance Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-linear-to-br from-emerald-800 to-emerald-900 rounded-2xl text-white shadow-md border-b-4 border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200">
              {!isAdmin ? 'Saldo Tabungan Anak' : 'Total Saldo Kas Terpilih'}
            </span>
            <Wallet className="w-5 h-5 text-amber-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {formatCurrency(overallBalance.balance)}
          </p>
          <p className="text-[11px] text-emerald-200 mt-1">
            Saldo Akhir = Total Uang Masuk - Total Uang Keluar
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Uang Masuk (Setoran)</span>
            <p className="text-xl font-black text-emerald-800 mt-0.5">
              {formatCurrency(overallBalance.totalIn)}
            </p>
            <span className="text-[10px] text-slate-400">
              {filteredSavings.filter((t) => t.type === 'IN').length} kali setoran
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Uang Keluar (Penarikan)</span>
            <p className="text-xl font-black text-rose-700 mt-0.5">
              {formatCurrency(overallBalance.totalOut)}
            </p>
            <span className="text-[10px] text-slate-400">
              {filteredSavings.filter((t) => t.type === 'OUT').length} kali penarikan
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Action bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {isAdmin && (
            <>
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

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="font-semibold text-slate-500">Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer max-w-[160px] truncate"
                >
                  <option value="Semua">Semua Siswa</option>
                  {db.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi atau keterangan..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportSheetsButton
            sheetTitle={`Laporan Tabungan Siswa MI Nurul Falah`}
            headers={sheetHeaders}
            rows={sheetRows}
          />

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => openAddModal('IN')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Catat Uang Masuk
              </button>

              <button
                type="button"
                onClick={() => openAddModal('OUT')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                Catat Uang Keluar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Jenis</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Petugas</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSavings.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="py-10 text-center text-slate-400"
                  >
                    Belum ada riwayat transaksi tabungan yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredSavings.map((tx, idx) => {
                  const isIncoming = tx.type === 'IN';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatDateIndo(tx.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{tx.className}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncoming
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncoming ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Uang Masuk
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-rose-600" /> Uang Keluar
                            </>
                          )}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black text-sm whitespace-nowrap ${
                          isIncoming ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isIncoming ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{tx.notes || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.recordedBy}</td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Add Savings Transaction */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {formType === 'IN' ? 'Catat Uang Masuk Tabungan' : 'Catat Uang Keluar Tabungan'}
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
                  {db.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('IN')}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      formType === 'IN'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Uang Masuk (Setor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('OUT')}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      formType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Uang Keluar (Tarik)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Rupiah (Rp) *</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-base focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                  Terbilang: {formatCurrency(formAmount)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Setoran uang saku, beli buku tulis"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
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
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm cursor-pointer ${
                    formType === 'IN'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Simpan Transaksi
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
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Laporan Tabungan</h3>
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
              title={`BUKU REKAPITULASI TABUNGAN SANTRI`}
              subtitle={
                selectedStudentId !== 'Semua'
                  ? `Nama Siswa: ${db.students.find((s) => s.id === selectedStudentId)?.name || ''}`
                  : `Kelas: ${selectedClass} • MI Nurul Falah`
              }
              studentName={
                selectedStudentId !== 'Semua'
                  ? db.students.find((s) => s.id === selectedStudentId)?.name
                  : undefined
              }
              className={
                selectedStudentId !== 'Semua'
                  ? db.students.find((s) => s.id === selectedStudentId)?.className
                  : undefined
              }
              nis={
                selectedStudentId !== 'Semua'
                  ? db.students.find((s) => s.id === selectedStudentId)?.nis
                  : undefined
              }
            />

            <div className="mb-4 p-3 bg-slate-100 rounded border border-slate-300 flex justify-between text-xs">
              <div>
                Total Masuk: <strong>{formatCurrency(overallBalance.totalIn)}</strong>
              </div>
              <div>
                Total Keluar: <strong>{formatCurrency(overallBalance.totalOut)}</strong>
              </div>
              <div>
                Saldo Akhir: <strong className="text-emerald-900">{formatCurrency(overallBalance.balance)}</strong>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Jenis</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Nominal</th>
                  <th className="py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredSavings.map((tx, i) => (
                  <tr key={tx.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{tx.date}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{tx.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                      {tx.type === 'IN' ? 'Uang Masuk' : 'Uang Keluar'}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-right font-bold">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-1.5 px-3">{tx.notes}</td>
                  </tr>
                ))}
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
          confirmLabel="Hapus Transaksi"
          confirmVariant="danger"
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
};
