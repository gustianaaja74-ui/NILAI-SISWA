export type UserRole = 'admin' | 'wali';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Plain/hashed comparison in demo/app
  role: UserRole;
  name: string;
  studentId?: string; // Links wali murid to child
  createdAt: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  className: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  photoUrl: string;
  parentName: string;
  parentPhone: string;
  address: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  homeroomTeacher: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  kkm: number;
  applicableClasses: string[];
}

export interface DailyGrade {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  assessmentDate: string;
  score: number;
  kkm: number;
  status: 'TUNTAS' | 'REMEDIAL';
  notes: string;
  isReleased: boolean;
  updatedAt: string;
}

export interface PeriodGrade {
  id: string;
  type: 'PTS' | 'PAS';
  studentId: string;
  studentName: string;
  className: string;
  subjectId: string;
  subjectName: string;
  score: number;
  kkm: number;
  status: 'TUNTAS' | 'REMEDIAL';
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  notes: string;
  isReleased: boolean;
  updatedAt: string;
}

export interface SavingsTransaction {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'IN' | 'OUT';
  amount: number;
  date: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface InfaqTransaction {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  month: string;
  year: number;
  paymentDate: string;
  amount: number;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  source: 'manual' | 'leave_request';
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  type: 'Sakit' | 'Izin';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  notes: string;
  attachmentUrl?: string; // image of doctor note or letter
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ExtraFee {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  targetClass: string; // 'Semua Kelas' or class name
  status: 'Aktif' | 'Selesai';
  createdAt: string;
}

export interface FeePayment {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  paidAmount: number;
  status: 'LUNAS' | 'BELUM LUNAS';
  paidDate?: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  targetClass: string;
  author: string;
  createdAt: string;
}

export interface SchoolSettings {
  schoolName: string;
  address: string;
  phone: string;
  headmaster: string;
  headmasterNip: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  kkmDefault: number;
  logoUrl: string;
}

export interface AppDatabase {
  users: UserAccount[];
  students: Student[];
  classes: ClassRoom[];
  subjects: Subject[];
  dailyGrades: DailyGrade[];
  periodGrades: PeriodGrade[];
  savings: SavingsTransaction[];
  infaq: InfaqTransaction[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  extraFees: ExtraFee[];
  feePayments: FeePayment[];
  announcements: Announcement[];
  settings: SchoolSettings;
}
