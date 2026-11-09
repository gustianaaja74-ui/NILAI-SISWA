import React from 'react';
import { useApp } from '../context/AppContext.tsx';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  studentName?: string;
  className?: string;
  nis?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle,
  studentName,
  className,
  nis,
}) => {
  const { db } = useApp();
  const settings = db.settings;

  return (
    <div className="print-header mb-6 pb-4 border-b-2 border-emerald-800">
      <div className="flex items-center justify-between gap-4">
        <img
          src={settings.logoUrl || '/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg'}
          alt="Logo MI Nurul Falah"
          className="w-20 h-20 object-contain rounded-lg border-2 border-emerald-600 p-0.5"
        />
        <div className="text-center flex-1">
          <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
            KEMENTERIAN AGAMA REPUBLIK INDONESIA
          </p>
          <h1 className="text-xl font-black text-emerald-900 tracking-tight">
            {settings.schoolName}
          </h1>
          <p className="text-xs text-slate-600">{settings.address}</p>
          <p className="text-xs text-slate-500">
            Telp: {settings.phone} | Tahun Ajaran {settings.academicYear} ({settings.semester})
          </p>
        </div>
        <div className="w-20 hidden sm:block">
          {/* balance spacer */}
          <div className="w-16 h-16 rounded-full border border-emerald-600/30 flex items-center justify-center text-[10px] text-emerald-800 font-bold text-center">
            AKREDITASI<br />A
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-300 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900 underline">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
      </div>

      {(studentName || className || nis) && (
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
          {studentName && (
            <div>
              <span className="text-slate-500">Nama Siswa:</span>{' '}
              <strong className="text-slate-800">{studentName}</strong>
            </div>
          )}
          {className && (
            <div>
              <span className="text-slate-500">Kelas:</span>{' '}
              <strong className="text-slate-800">{className}</strong>
            </div>
          )}
          {nis && (
            <div>
              <span className="text-slate-500">NIS / NISN:</span>{' '}
              <strong className="text-slate-800">{nis}</strong>
            </div>
          )}
          <div>
            <span className="text-slate-500">Tahun Ajaran:</span>{' '}
            <strong className="text-slate-800">
              {settings.academicYear} ({settings.semester})
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
