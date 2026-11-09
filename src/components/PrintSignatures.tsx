import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatDateIndo } from '../utils/academicRules.ts';

interface PrintSignaturesProps {
  homeroomTeacher?: string;
  cityName?: string;
}

export const PrintSignatures: React.FC<PrintSignaturesProps> = ({
  homeroomTeacher = 'Gustiana Hermawan, M.Pd.I',
  cityName = 'Depok',
}) => {
  const { db } = useApp();
  const settings = db.settings;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mt-8 pt-4 text-xs">
      <div className="flex justify-between items-start px-8">
        <div className="text-center w-56">
          <p className="text-slate-500 mb-1">Mengetahui,</p>
          <p className="font-semibold text-slate-800">Orang Tua / Wali Murid</p>
          <div className="h-16"></div>
          <p className="border-b border-slate-700 font-bold text-slate-900 pb-0.5 inline-block min-w-[160px]">
            ( .................................... )
          </p>
        </div>

        <div className="text-center w-56">
          <p className="text-slate-500 mb-1">{cityName}, {formatDateIndo(today)}</p>
          <p className="font-semibold text-slate-800">Wali Kelas</p>
          <div className="h-16"></div>
          <p className="border-b border-slate-700 font-bold text-slate-900 pb-0.5 inline-block min-w-[160px]">
            {homeroomTeacher}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">NIP: -</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="font-semibold text-slate-800">Mengetahui,</p>
        <p className="font-bold text-emerald-950">Kepala Madrasah Ibtidaiyah Nurul Falah</p>
        <div className="h-14"></div>
        <p className="border-b border-slate-700 font-bold text-slate-900 pb-0.5 inline-block min-w-[200px]">
          {settings.headmaster}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">NIP: {settings.headmasterNip}</p>
      </div>
    </div>
  );
};
