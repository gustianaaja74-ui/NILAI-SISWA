import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineGradeStatus,
  calculateSavingsBalance,
  calculateInfaqTotal,
  generateDateRange,
  calculateAttendanceStats,
  checkDuplicateAttendance,
  formatCurrency,
} from './academicRules.ts';

test('determineGradeStatus returns TUNTAS for scores >= 75 and REMEDIAL for scores < 75', () => {
  assert.equal(determineGradeStatus(75, 75), 'TUNTAS');
  assert.equal(determineGradeStatus(85, 75), 'TUNTAS');
  assert.equal(determineGradeStatus(100, 75), 'TUNTAS');
  assert.equal(determineGradeStatus(74.9, 75), 'REMEDIAL');
  assert.equal(determineGradeStatus(50, 75), 'REMEDIAL');
  assert.equal(determineGradeStatus(0, 75), 'REMEDIAL');
});

test('determineGradeStatus honors dynamic KKM settings', () => {
  assert.equal(determineGradeStatus(70, 70), 'TUNTAS');
  assert.equal(determineGradeStatus(68, 70), 'REMEDIAL');
  assert.equal(determineGradeStatus(80, 80), 'TUNTAS');
  assert.equal(determineGradeStatus(78, 80), 'REMEDIAL');
});

test('calculateSavingsBalance accurately computes total in, out, and balance', () => {
  const transactions = [
    { type: 'IN' as const, amount: 20000 },
    { type: 'IN' as const, amount: 30000 },
    { type: 'OUT' as const, amount: 15000 },
    { type: 'IN' as const, amount: 10000 },
  ];
  const result = calculateSavingsBalance(transactions);
  assert.equal(result.totalIn, 60000);
  assert.equal(result.totalOut, 15000);
  assert.equal(result.balance, 45000);
});

test('calculateInfaqTotal sums all infaq transactions', () => {
  const items = [{ amount: 15000 }, { amount: 25000 }, { amount: 10000 }];
  assert.equal(calculateInfaqTotal(items), 50000);
});

test('generateDateRange produces all consecutive ISO dates', () => {
  const dates = generateDateRange('2026-11-09', '2026-11-12');
  assert.deepEqual(dates, ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']);

  const singleDay = generateDateRange('2026-11-09', '2026-11-09');
  assert.deepEqual(singleDay, ['2026-11-09']);
});

test('calculateAttendanceStats counts categories and percentage properly', () => {
  const records = [
    { status: 'Hadir' },
    { status: 'Hadir' },
    { status: 'Hadir' },
    { status: 'Sakit' },
    { status: 'Izin' },
  ];
  const stats = calculateAttendanceStats(records);
  assert.equal(stats.hadir, 3);
  assert.equal(stats.sakit, 1);
  assert.equal(stats.izin, 1);
  assert.equal(stats.alpa, 0);
  assert.equal(stats.total, 5);
  assert.equal(stats.percentageHadir, 60);
});

test('checkDuplicateAttendance detects existing student date records', () => {
  const records = [
    { studentId: 's1', date: '2026-11-09' },
    { studentId: 's2', date: '2026-11-09' },
  ];
  assert.equal(checkDuplicateAttendance(records, 's1', '2026-11-09'), true);
  assert.equal(checkDuplicateAttendance(records, 's1', '2026-11-10'), false);
  assert.equal(checkDuplicateAttendance(records, 's3', '2026-11-09'), false);
});

test('formatCurrency formats number to IDR properly', () => {
  const formatted = formatCurrency(50000);
  assert.match(formatted, /50\.000/);
});
