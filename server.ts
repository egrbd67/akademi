import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'cloud_db.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial empty cloud database structure if file doesn't exist
const initialDb = {
  students: [],
  teachers: [],
  classrooms: [],
  schedules: [],
  homeworks: [],
  trialExams: [],
  focusSessions: [],
  announcements: [],
  notifications: [],
  lastUpdated: new Date().toISOString()
};

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
}

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading cloud_db.json:', err);
    return initialDb;
  }
}

function writeDb(data: any) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to cloud_db.json:', err);
    return false;
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));

// --- Cloud Sync API Endpoints ---

// 1. Get all cloud data
app.get('/api/cloud-data', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: db,
    timestamp: db.lastUpdated || new Date().toISOString()
  });
});

// 2. Save / Sync entire cloud state
app.post('/api/cloud-data', (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const current = readDb();
  const merged = {
    ...current,
    ...incoming,
    lastUpdated: new Date().toISOString()
  };

  const ok = writeDb(merged);
  if (ok) {
    res.json({ success: true, timestamp: merged.lastUpdated });
  } else {
    res.status(500).json({ success: false, message: 'Failed to write cloud database' });
  }
});

// 3. Student Login Endpoint: 5-digit Student Number + 4-digit Password
app.post('/api/cloud-data/student-login', (req, res) => {
  const { studentNumber, password, pin } = req.body;
  const db = readDb();
  const students = db.students || [];

  let student = null;

  // Standard login: 5-digit student number + 4-digit password
  if (studentNumber && password) {
    const cleanNum = String(studentNumber).trim();
    const cleanPass = String(password).trim();
    student = students.find((s: any) => {
      const matchNum = String(s.studentNumber || s.pin || '').trim() === cleanNum;
      const matchPass = String(s.password || s.pin || '').trim() === cleanPass;
      return matchNum && matchPass;
    });
  } else if (pin) {
    // Single credential fallback (e.g. testing)
    const cleanPin = String(pin).trim();
    student = students.find((s: any) =>
      String(s.pin || '').trim() === cleanPin ||
      String(s.password || '').trim() === cleanPin ||
      String(s.studentNumber || '').trim() === cleanPin
    );
  }

  if (student) {
    const enrolledClassrooms = (db.classrooms || []).filter((c: any) =>
      (c.studentIds || []).includes(student.id) || (student.classroomIds || []).includes(c.id)
    );

    res.json({
      success: true,
      student,
      classrooms: enrolledClassrooms,
      message: 'Öğrenci girişi başarılı'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Hatalı 5 haneli öğrenci numarası veya 4 haneli şifre. Lütfen koçunuzla iletişime geçin.'
    });
  }
});

// 4. Teacher Login Endpoint
app.post('/api/cloud-data/teacher-login', (req, res) => {
  res.json({
    success: true,
    role: 'teacher',
    message: 'Öğretmen / Koç girişi başarılı'
  });
});

// 4. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Akademi Takip Cloud Server', time: new Date().toISOString() });
});

// --- Vite Middleware in Dev or Static files in Production ---
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Akademi Takip Cloud Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
