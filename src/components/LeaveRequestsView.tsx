import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LeaveRequest } from '../types/index.ts';
import { formatDateIndo } from '../utils/academicRules.ts';
import { PrintHeader } from './PrintHeader.tsx';
import { PrintSignatures } from './PrintSignatures.tsx';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  User,
  X,
  FileCheck2,
} from 'lucide-react';

export const LeaveRequestsView: React.FC = () => {
  const { db, updateDb, currentUser, currentStudent, reviewLeaveRequest } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<LeaveRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form states for Wali Murid
  const [formType, setFormType] = useState<'Sakit' | 'Izin'>('Sakit');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAttachment, setFormAttachment] = useState<string>('');

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      alert('Data siswa tidak ditemukan.');
      return;
    }
    if (!formReason.trim()) {
      alert('Alasan permohonan izin wajib diisi.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: 'lr_' + Date.now(),
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      className: currentStudent.className,
      parentName: currentStudent.parentName || currentUser?.name || 'Wali Murid',
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate,
      reason: formReason,
      notes: formNotes,
      attachmentUrl: formAttachment,
      status: 'Menunggu',
      createdAt: new Date().toISOString(),
    };

    await updateDb((prev) => ({
      ...prev,
      leaveRequests: [newRequest, ...prev.leaveRequests],
    }));

    alert('Surat izin telah terkirim kepada Wali Kelas. Status saat ini: MENUNGGU PERSETUJUAN.');
    setShowFormModal(false);
    setFormReason('');
    setFormNotes('');
    setFormAttachment('');
  };

  const handleReviewAction = async (status: 'Disetujui' | 'Ditolak') => {
    if (!selectedRequestForReview) return;
    if (status === 'Ditolak' && !rejectionReasonInput.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }

    const success = await reviewLeaveRequest(
      selectedRequestForReview.id,
      status,
      rejectionReasonInput
    );
    if (success) {
      setSelectedRequestForReview(null);
      setRejectionReasonInput('');
    } else {
      alert('Gagal memproses permohonan surat izin.');
    }
  };

  // Filter requests
  const filteredRequests = db.leaveRequests.filter((lr) => {
    if (!isAdmin) {
      return lr.studentId === currentStudent?.id;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Layanan Surat Izin & Surat Sakit Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Tinjau permohonan izin dari orang tua. Surat yang disetujui otomatis masuk ke daftar hadir.'
              : 'Ajukan permohonan izin atau surat sakit dari dokter resmi kepada wali kelas.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Izin
          </button>

          {!isAdmin && (
            <button
              type="button"
              onClick={() => setShowFormModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Kirim Surat Izin / Sakit
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Belum ada pengajuan surat izin atau surat sakit.</p>
          </div>
        ) : (
          filteredRequests.map((lr) => {
            const isApproved = lr.status === 'Disetujui';
            const isRejected = lr.status === 'Ditolak';
            const isPending = lr.status === 'Menunggu';

            return (
              <div
                key={lr.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        lr.type === 'Sakit'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      Surat {lr.type}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900 animate-pulse'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {lr.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{lr.studentName}</h3>
                  <p className="text-xs text-slate-500">
                    {lr.className} • Pengaju: {lr.parentName}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>Rentang Waktu:</span>
                      <strong className="text-slate-800">
                        {formatDateIndo(lr.startDate)}{' '}
                        {lr.startDate !== lr.endDate && `s/d ${formatDateIndo(lr.endDate)}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Alasan:</span>{' '}
                      <span className="text-slate-900 font-medium">{lr.reason}</span>
                    </div>
                    {lr.notes && (
                      <div>
                        <span className="text-slate-500">Keterangan:</span>{' '}
                        <span className="text-slate-700">{lr.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Attachment Preview Button */}
                  {lr.attachmentUrl && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachmentUrl(lr.attachmentUrl || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                        Lihat Foto Surat Dokter / Bukti Lampiran
                      </button>
                    </div>
                  )}

                  {/* Rejection notice if any */}
                  {isRejected && lr.rejectionReason && (
                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                      <strong>Alasan Penolakan:</strong> {lr.rejectionReason}
                    </div>
                  )}

                  {isApproved && (
                    <p className="text-[11px] text-emerald-700 mt-2 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status telah otomatis masuk ke daftar hadir sebagai {lr.type}.
                    </p>
                  )}
                </div>

                {/* Admin Action Buttons */}
                {isAdmin && isPending && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestForReview(lr)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      Tinjau & Tanggapi
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Submit Leave Request (Wali Murid) */}
      {showFormModal && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Formulir Surat Izin & Sakit Siswa
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
              {/* Auto filled student details */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-semibold">Nama Siswa:</span>
                  <p className="font-bold text-slate-900 text-sm">{currentStudent.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-800 font-semibold">Kelas:</span>
                  <p className="font-bold text-slate-900">{currentStudent.className}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Surat Permohonan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('Sakit')}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      formType === 'Sakit'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Surat Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('Izin')}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      formType === 'Izin'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Surat Izin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Permohonan Izin *</label>
                <input
                  type="text"
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Contoh: Demam tinggi, acara pernikahan keluarga"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Keterangan lebih lanjut untuk wali kelas..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Photo attachment from gallery */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lampiran Foto Surat Dokter / Bukti Pendukung (Opsional)
                </label>
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-emerald-500 transition-colors">
                  {formAttachment ? (
                    <div className="flex items-center justify-between">
                      <img
                        src={formAttachment}
                        alt="Lampiran"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                      />
                      <span className="text-xs text-emerald-800 font-semibold">Foto terlampir</span>
                      <button
                        type="button"
                        onClick={() => setFormAttachment('')}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-emerald-800 hover:underline">
                        Pilih foto dari galeri HP atau komputer
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (Maks 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                Pemberitahuan: Setelah dikirim, data pengajuan tidak dapat diedit atau dihapus dan
                langsung diverifikasi oleh Wali Kelas.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Kirim Surat Izin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Verifikasi Surat {selectedRequestForReview.type}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRequestForReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  {selectedRequestForReview.studentName} ({selectedRequestForReview.className})
                </p>
                <p className="text-slate-600">
                  Wali Murid: <strong>{selectedRequestForReview.parentName}</strong>
                </p>
                <p className="text-slate-600">
                  Tanggal:{' '}
                  <strong>
                    {formatDateIndo(selectedRequestForReview.startDate)}{' '}
                    {selectedRequestForReview.startDate !== selectedRequestForReview.endDate &&
                      `s/d ${formatDateIndo(selectedRequestForReview.endDate)}`}
                  </strong>
                </p>
                <p className="text-slate-800 font-medium">Alasan: {selectedRequestForReview.reason}</p>
                {selectedRequestForReview.notes && (
                  <p className="text-slate-500 italic">"{selectedRequestForReview.notes}"</p>
                )}
              </div>

              {selectedRequestForReview.attachmentUrl && (
                <div className="p-2 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-slate-700 mb-1">Bukti Foto Surat Dokter:</p>
                  <img
                    src={selectedRequestForReview.attachmentUrl}
                    alt="Bukti Surat Dokter"
                    className="max-h-48 rounded-lg mx-auto object-contain border"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Alasan (Wajib diisi jika menolak)
                </label>
                <input
                  type="text"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Contoh: Lampiran tidak terbaca, mohon konfirmasi langsung ke sekolah"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleReviewAction('Ditolak')}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('Disetujui')}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
              >
                Setujui & Otomatis Masuk Absen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Image Full Preview Modal */}
      {previewAttachmentUrl && (
        <div
          onClick={() => setPreviewAttachmentUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-2xl w-full p-2 bg-white rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewAttachmentUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewAttachmentUrl}
              alt="Pratinjau Surat Dokter"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-8 print-page">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 no-print">
              <h3 className="font-bold text-sm text-slate-800">Pratinjau Cetak Surat Izin</h3>
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
              title="REKAP PENGAJUAN SURAT IZIN & SURAT SAKIT SISWA"
              subtitle={`Tahun Ajaran ${db.settings.academicYear} • MI Nurul Falah`}
            />

            <table className="w-full text-left border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Siswa</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelas</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Jenis</th>
                  <th className="py-2 px-3 border-r border-slate-300">Rentang Tanggal</th>
                  <th className="py-2 px-3 border-r border-slate-300">Alasan</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Status</th>
                  <th className="py-2 px-3">Catatan / Verifikator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredRequests.map((lr, i) => (
                  <tr key={lr.id}>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{lr.studentName}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{lr.className}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center">{lr.type}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      {lr.startDate} s/d {lr.endDate}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">{lr.reason}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                      {lr.status}
                    </td>
                    <td className="py-1.5 px-3">
                      {lr.rejectionReason || lr.reviewedBy || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PrintSignatures />
          </div>
        </div>
      )}
    </div>
  );
};
