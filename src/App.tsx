import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { DashboardAdmin } from './components/DashboardAdmin.tsx';
import { DashboardWali } from './components/DashboardWali.tsx';
import { StudentManagement } from './components/StudentManagement.tsx';
import { SubjectManagement } from './components/SubjectManagement.tsx';
import { DailyGradesView } from './components/DailyGradesView.tsx';
import { PeriodGradesView } from './components/PeriodGradesView.tsx';
import { SavingsView } from './components/SavingsView.tsx';
import { InfaqView } from './components/InfaqView.tsx';
import { AttendanceView } from './components/AttendanceView.tsx';
import { LeaveRequestsView } from './components/LeaveRequestsView.tsx';
import { ExtraFeesView } from './components/ExtraFeesView.tsx';
import { AnnouncementsView } from './components/AnnouncementsView.tsx';
import { AccountSettingsView } from './components/AccountSettingsView.tsx';
import { StudentReportModal } from './components/StudentReportModal.tsx';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, currentStudent, isLoading, db } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-emerald-800 rounded-2xl shadow-xl flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
          <span className="font-bold text-sm tracking-wide">
            Memuat Sistem MI Nurul Falah...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80 text-slate-800">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' &&
          (isAdmin ? (
            <DashboardAdmin setActiveTab={setActiveTab} />
          ) : (
            <DashboardWali
              setActiveTab={setActiveTab}
              onOpenReport={() => setShowReportModal(true)}
            />
          ))}

        {activeTab === 'students' && (isAdmin ? <StudentManagement /> : null)}
        {activeTab === 'subjects' && (isAdmin ? <SubjectManagement /> : null)}
        {activeTab === 'daily_grades' && <DailyGradesView />}
        {activeTab === 'period_grades' && <PeriodGradesView />}
        {activeTab === 'savings' && <SavingsView />}
        {activeTab === 'infaq' && <InfaqView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'leave_requests' && <LeaveRequestsView />}
        {activeTab === 'fees' && <ExtraFeesView />}
        {activeTab === 'announcements' && <AnnouncementsView />}
        {activeTab === 'settings' && (isAdmin ? <AccountSettingsView /> : null)}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-09_at_08.49.13_96750bdd.jpeg"
              alt="Logo"
              className="w-5 h-5 rounded object-cover"
            />
            <span className="font-bold text-xs text-emerald-950 uppercase">
              {db.settings.schoolName}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Aplikasi Resmi Sistem Informasi Nilai Siswa, Keuangan & Presensi Terpadu
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Kementerian Agama Republik Indonesia • Hak Cipta Dilindungi
          </p>
        </div>
      </footer>

      {/* Rapor Nilai Modal */}
      {showReportModal && currentStudent && (
        <StudentReportModal
          student={currentStudent}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
