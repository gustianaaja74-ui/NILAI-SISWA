import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppDatabase, UserAccount, Student } from '../types/index.ts';
import { initialDatabase } from '../server/seedData.ts';

interface AppContextType {
  currentUser: UserAccount | null;
  currentStudent: Student | null; // For wali murid: their child
  db: AppDatabase;
  isLoading: boolean;
  login: (username: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  updateDb: (updater: (prev: AppDatabase) => AppDatabase) => Promise<boolean>;
  reviewLeaveRequest: (
    id: string,
    status: 'Disetujui' | 'Ditolak',
    rejectionReason?: string
  ) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
  restoreBackup: (newDb: AppDatabase) => Promise<boolean>;
  pendingLeaveRequestsCount: number;
  currentKkm: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(initialDatabase);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('mi_nurul_falah_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial database from server
  const fetchDb = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        setDb(data);
      }
    } catch (err) {
      console.warn('Could not fetch from server, using fallback memory state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  // Save currentUser to localStorage for session persistence across page reload
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mi_nurul_falah_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mi_nurul_falah_user');
    }
  }, [currentUser]);

  // Determine current student for wali
  const currentStudent = React.useMemo(() => {
    if (!currentUser || currentUser.role !== 'wali' || !currentUser.studentId) return null;
    return db.students.find((s) => s.id === currentUser.studentId) || null;
  }, [currentUser, db.students]);

  const login = (username: string, pass: string): { success: boolean; message: string } => {
    const cleanUser = username.trim().toLowerCase();
    const found = db.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!found) {
      return { success: false, message: 'Username tidak ditemukan' };
    }
    if (found.password !== pass) {
      return { success: false, message: 'Password salah' };
    }
    setCurrentUser(found);
    return { success: true, message: 'Login berhasil' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Sync DB changes to server
  const updateDb = async (updater: (prev: AppDatabase) => AppDatabase): Promise<boolean> => {
    const nextDb = updater(db);
    setDb(nextDb);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextDb),
      });
      return res.ok;
    } catch (err) {
      console.error('Error syncing database to server:', err);
      return false;
    }
  };

  // Automated review with server-side calendar/attendance insertion
  const reviewLeaveRequest = async (
    id: string,
    status: 'Disetujui' | 'Ditolak',
    rejectionReason?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/leave-requests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectionReason,
          reviewerName: currentUser?.name || 'Gustiana Hermawan',
        }),
      });
      if (res.ok) {
        await fetchDb();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to review leave request:', err);
      return false;
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/backup/reset-demo', { method: 'POST' });
      if (res.ok) {
        await fetchDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const restoreBackup = async (newDb: AppDatabase): Promise<boolean> => {
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDb),
      });
      if (res.ok) {
        setDb(newDb);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const pendingLeaveRequestsCount = React.useMemo(() => {
    return db.leaveRequests.filter((lr) => lr.status === 'Menunggu').length;
  }, [db.leaveRequests]);

  const currentKkm = db.settings?.kkmDefault || 75;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentStudent,
        db,
        isLoading,
        login,
        logout,
        updateDb,
        reviewLeaveRequest,
        resetDemoData,
        restoreBackup,
        pendingLeaveRequestsCount,
        currentKkm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
