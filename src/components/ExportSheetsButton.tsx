import React, { useState } from 'react';
import { exportToGoogleSheets, ExportResult } from '../services/googleSheets.ts';
import { FileSpreadsheet, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportSheetsButtonProps {
  sheetTitle: string;
  headers: string[];
  rows: (string | number)[][];
  className?: string;
  buttonText?: string;
}

export const ExportSheetsButton: React.FC<ExportSheetsButtonProps> = ({
  sheetTitle,
  headers,
  rows,
  className = '',
  buttonText = 'Ekspor ke Google Sheets',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartExport = () => {
    setShowConfirm(true);
    setErrorMsg(null);
  };

  const handleConfirmExport = async () => {
    setShowConfirm(false);
    setIsExporting(true);
    setErrorMsg(null);

    try {
      const result = await exportToGoogleSheets(sheetTitle, headers, rows);
      setExportResult(result);
    } catch (err: any) {
      console.error('Google Sheets export failed:', err);
      setErrorMsg(err.message || 'Gagal mengekspor ke Google Sheets');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleStartExport}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm disabled:opacity-50 ${className}`}
        title="Ekspor laporan ke Google Spreadsheet"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
        )}
        <span>{isExporting ? 'Mengekspor...' : buttonText}</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-emerald-800 mb-3">
              <div className="p-2 rounded-xl bg-emerald-100">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Konfirmasi Ekspor Google Sheets</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Anda akan membuat spreadsheet baru berjudul{' '}
              <strong className="text-slate-900 font-semibold">{sheetTitle}</strong> pada Google
              Drive Anda dengan jumlah data <strong>{rows.length} baris</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExport}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer shadow transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Lanjutkan Ekspor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {exportResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Berhasil Diekspor!</h3>
            <p className="text-xs text-slate-600 mb-5">
              Data spreadsheet <strong>{sheetTitle}</strong> telah berhasil dibuat dan disimpan di
              Google Drive Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href={exportResult.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buka di Google Sheets
              </a>
              <button
                type="button"
                onClick={() => setExportResult(null)}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Ekspor Google Sheets Terkendala</h3>
            <p className="text-xs text-slate-600 mb-4">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
