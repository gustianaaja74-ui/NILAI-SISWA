import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initialDatabase } from './src/server/seedData.ts';
import { AppDatabase, LeaveRequest, AttendanceRecord } from './src/types/index.ts';
import { generateDateRange, checkDuplicateAttendance } from './src/utils/academicRules.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize DB
function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content) as AppDatabase;
    }
  } catch (err) {
    console.error('Failed to read database file, restoring defaults:', err);
  }
  // Initialize with seed data
  saveDatabase(initialDatabase);
  return initialDatabase;
}

function saveDatabase(db: AppDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

let database: AppDatabase = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full DB or filtered by role
  app.get('/api/db', (req, res) => {
    res.json(database);
  });

  // Save/Replace entire DB
  app.post('/api/db', (req, res) => {
    const updated = req.body as AppDatabase;
    if (!updated || !updated.students || !updated.users) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }
    database = updated;
    saveDatabase(database);
    res.json({ success: true, message: 'Database berhasil diperbarui' });
  });

  // Backup download
  app.get('/api/backup/download', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-mi-nurul-falah-${Date.now()}.json`);
    res.send(JSON.stringify(database, null, 2));
  });

  // Restore backup
  app.post('/api/backup/restore', (req, res) => {
    const backup = req.body as AppDatabase;
    if (!backup || !backup.students || !backup.users) {
      return res.status(400).json({ error: 'File cadangan tidak valid' });
    }
    database = backup;
    saveDatabase(database);
    res.json({ success: true, message: 'Data cadangan berhasil dipulihkan' });
  });

  // Reset to initial seed data
  app.post('/api/backup/reset-demo', (req, res) => {
    database = JSON.parse(JSON.stringify(initialDatabase));
    saveDatabase(database);
    res.json({ success: true, message: 'Data contoh berhasil di-reset' });
  });

  // Review Leave Request (Approve / Reject) with automated attendance insertion
  app.post('/api/leave-requests/:id/review', (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason, reviewerName } = req.body as {
      status: 'Disetujui' | 'Ditolak';
      rejectionReason?: string;
      reviewerName?: string;
    };

    const lrIndex = database.leaveRequests.findIndex((lr) => lr.id === id);
    if (lrIndex === -1) {
      return res.status(404).json({ error: 'Surat izin tidak ditemukan' });
    }

    const lr = database.leaveRequests[lrIndex];
    lr.status = status;
    lr.rejectionReason = rejectionReason || '';
    lr.reviewedAt = new Date().toISOString();
    lr.reviewedBy = reviewerName || 'Admin / Wali Kelas';

    // If approved, automatically insert into attendance table
    if (status === 'Disetujui') {
      const dates = generateDateRange(lr.startDate, lr.endDate);
      const student = database.students.find((s) => s.id === lr.studentId);
      const studentName = student ? student.name : lr.studentName;
      const className = student ? student.className : lr.className;
      const attStatus = lr.type === 'Sakit' ? 'Sakit' : 'Izin';

      for (const d of dates) {
        const isDupe = checkDuplicateAttendance(database.attendance, lr.studentId, d);
        if (!isDupe) {
          const newAtt: AttendanceRecord = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            studentId: lr.studentId,
            studentName,
            className,
            date: d,
            status: attStatus,
            notes: `Surat ${lr.type} disetujui: ${lr.reason}`,
            source: 'leave_request',
            createdAt: new Date().toISOString(),
          };
          database.attendance.push(newAtt);
        } else {
          // Update existing to avoid duplicate
          const existing = database.attendance.find(
            (a) => a.studentId === lr.studentId && a.date === d
          );
          if (existing) {
            existing.status = attStatus;
            existing.notes = `Surat ${lr.type} disetujui: ${lr.reason}`;
            existing.source = 'leave_request';
          }
        }
      }
    }

    saveDatabase(database);
    res.json({ success: true, leaveRequest: lr });
  });

  // Handle Vite middleware or static files
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MI Nurul Falah server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
