import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { InfaqTransaction } from '../types/index.ts';
import { calculateInfaqTotal, formatCurrency, formatDateIndo } from '../utils/academicRules.ts';
import { ExportSheetsButton } from './ExportSheetsButton.tsx';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const InfaqView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
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
  const [formMonth, setFormMonth] = useState('Maret');
  const [formYear, setFormYear] = useState(2026);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState<number>(25000);
  const [formNotes, setFormNotes] = useState('Infak bulanan madrasah');

  const openAddModal = () => {
    setFormStudentId(db.students[0]?.id || '');
    setFormMonth('Maret');
    setFormYear(2026);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount(25000);
    setFormNotes('Infak bulanan madrasah');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = db.students.find((s) => s.id === formStudentId);
    if (!student) {
      alert('Pilih siswa');
      return;
    }

    const newInfaq: InfaqTransaction = {
      id: 'inf_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      month: formMonth,
      year: formYear,
      paymentDate: formDate,
      amount: formAmount,
      notes: formNotes,
      recordedBy: currentUser?.name || 'Gustiana Hermawan',
      createdAt: new Date().toISOString(),
    };

    await updateDb((prev) => ({
      ...prev,
      infaq: [newInfaq, ...prev.infaq],
    }));

    setShowModal(false);
  };

  const handleDelete = (inf: InfaqTransaction) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Infak',
      message: `Apakah Anda yakin ingin menghapus catatan infak bulan ${inf.month} sebesar ${formatCurrency(inf.amount)} untuk ${inf.studentName}?`,
      action: async () => {
        await updateDb((prev) => ({
          ...prev,
          infaq: prev.infaq.filter((i) => i.id !== inf.id),
        }));
      },
    });
  };

  // Filter list
  const filteredInfaq = db.infaq.filter((item) => {
    if (!isAdmin) {
      return item.studentId === currentStudent?.id;
    }
    if (selectedMonth !== 'Semua' && item.month !== selectedMonth) return false;
    if (selectedClass !== 'Semua' && item.className !== selectedClass) return false;
    if (searchQuery) {
      const match =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const totalFilteredAmount = calculateInfaqTotal(filteredInfaq);

  const sheetHeaders = [
    'No',
    'Tanggal Bayar',
    'Nama Siswa',
    'Kelas',
    'Bulan',
    'Tahun',
    'Nominal Infak (Rp)',
    'Keterangan',
    'Penerima',
  ];
  const sheetRows = filteredInfaq.map((i, idx) => [
    idx + 1,
    i.paymentDate,
    i.studentName,
    i.className,
    i.month,
    i.year,
    i.amount,
    i.notes,
    i.recordedBy,
  ]);

  return (
    <div className="space-y-5">
      {/* Top Stat Card */}
      <div className="p-5 bg-linear-to-r from-emerald-800 to-emerald-700 rounded-2xl text-white shadow-md border-b-4 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs text-amber-300">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
              {!isAdmin ? 'Total Infak Siswa Ini' : 'Total Infak Terkumpul (Filter)'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {formatCurrency(totalFilteredAmount)}
            </p>
            <p className="text-[11px] text-emerald-100">
              Tercatat dari {filteredInfaq.length} data pembayaran infak bulanan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportSheetsButton
            sheetTitle="Laporan Infak Bulanan MI Nurul Falah"
            headers={sheetHeaders}
            rows={sheetRows}
          />

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Pembayaran Infak
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
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
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Bulan</option>
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Bulan / Tahun</th>
                <th className="py-3 px-4 text-right">Nominal Infak</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Petugas</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInfaq.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="py-10 text-center text-slate-400"
                  >
                    Belum ada catatan infak bulanan pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredInfaq.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {formatDateIndo(item.paymentDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.className}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900">
                        {item.month} {item.year}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-emerald-800 whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.notes || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{item.recordedBy}</td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Hapus Catatan Infak"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Infaq */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Catat Infak Bulanan</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Siswa *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bulan Infak</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Infak (Rp) *</label>
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
                  {formatCurrency(formAmount)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Infak pembangunan, infak jum'at berkah"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Catatan Infak
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
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Laporan Infak</h3>
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
              title="REKAPITULASI PEMBAYARAN INFAK BULANAN"
              subtitle={`Periode Bulan: ${selectedMonth} • Kelas: ${selectedClass}`}
            />

            <div className="mb-4 p-3 bg-emerald-50 rounded border border-emerald-200 flex justify-between text-xs">
              <div>
                Total Pembayaran: <strong>{filteredInfaq.length} data</strong>
              </div>
              <div>
                Total Infak Terkumpul:{' '}
                <strong className="text-emerald-900 text-sm">
                  {formatCurrency(totalFilteredAmount)}
                </strong>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Tanggal Bayar</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelas</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Bulan / Tahun</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Nominal</th>
                  <th className="py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredInfaq.map((inf, i) => (
                  <tr key={inf.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{inf.paymentDate}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{inf.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{inf.className}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                      {inf.month} {inf.year}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-right font-bold text-emerald-900">
                      {formatCurrency(inf.amount)}
                    </td>
                    <td className="py-1.5 px-3">{inf.notes || '-'}</td>
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
          confirmLabel="Hapus Infak"
          confirmVariant="danger"
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
};
