/**
 * Academic & financial business logic rules for MI Nurul Falah
 */

export function determineGradeStatus(score: number, kkm: number = 75): 'TUNTAS' | 'REMEDIAL' {
  if (isNaN(score)) return 'REMEDIAL';
  return score >= kkm ? 'TUNTAS' : 'REMEDIAL';
}

export interface SavingsSummary {
  totalIn: number;
  totalOut: number;
  balance: number;
}

export function calculateSavingsBalance(
  transactions: { type: 'IN' | 'OUT'; amount: number }[]
): SavingsSummary {
  let totalIn = 0;
  let totalOut = 0;

  for (const t of transactions) {
    const val = Number(t.amount) || 0;
    if (t.type === 'IN') {
      totalIn += val;
    } else if (t.type === 'OUT') {
      totalOut += val;
    }
  }

  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
  };
}

export function calculateInfaqTotal(transactions: { amount: number }[]): number {
  return transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
}

/**
 * Generate all ISO date strings (YYYY-MM-DD) inclusive between startDate and endDate
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr) return [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  // normalize time to midnight UTC to prevent daylight issues
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export interface AttendanceStats {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  percentageHadir: number;
}

export function calculateAttendanceStats(records: { status: string }[]): AttendanceStats {
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  for (const r of records) {
    if (r.status === 'Hadir') hadir++;
    else if (r.status === 'Sakit') sakit++;
    else if (r.status === 'Izin') izin++;
    else if (r.status === 'Alpa') alpa++;
  }

  const total = records.length;
  const percentageHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return {
    hadir,
    sakit,
    izin,
    alpa,
    total,
    percentageHadir,
  };
}

export function formatCurrency(amount: number): string {
  const safe = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function checkDuplicateAttendance(
  existingRecords: { studentId: string; date: string }[],
  studentId: string,
  date: string
): boolean {
  return existingRecords.some((r) => r.studentId === studentId && r.date === date);
}
