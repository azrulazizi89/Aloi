import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tracker.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year TEXT,
    name TEXT,
    teacher_name TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    name TEXT,
    photo_url TEXT,
    notes TEXT,
    FOREIGN KEY(class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    name TEXT,
    FOREIGN KEY(class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS dskp_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    sk TEXT,
    sp TEXT,
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    dskp_item_id INTEGER,
    tp_level INTEGER,
    skills TEXT,
    evidence_url TEXT,
    note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(dskp_item_id) REFERENCES dskp_items(id)
  );
`);

const app = express();
app.use(express.json());

// Configure multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Serve uploads
app.use("/uploads", express.static("uploads"));

// API Routes
app.get("/api/classes", (req, res) => {
  const classes = db.prepare("SELECT * FROM classes").all();
  res.json(classes);
});

app.post("/api/classes", (req, res) => {
  const { year, name, teacher_name } = req.body;
  const info = db.prepare("INSERT INTO classes (year, name, teacher_name) VALUES (?, ?, ?)").run(year, name, teacher_name);
  res.json({ id: info.lastInsertRowid });
});

app.get("/api/classes/:id/students", (req, res) => {
  const students = db.prepare("SELECT * FROM students WHERE class_id = ?").all(req.params.id);
  res.json(students);
});

app.post("/api/classes/:id/students", (req, res) => {
  const { name, notes } = req.body;
  const info = db.prepare("INSERT INTO students (class_id, name, notes) VALUES (?, ?, ?)").run(req.params.id, name, notes);
  res.json({ id: info.lastInsertRowid });
});

app.post("/api/students/:id/photo", upload.single("photo"), (req, res) => {
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  if (photo_url) {
    db.prepare("UPDATE students SET photo_url = ? WHERE id = ?").run(photo_url, req.params.id);
  }
  res.json({ photo_url });
});

app.get("/api/classes/:id/subjects", (req, res) => {
  const subjects = db.prepare("SELECT * FROM subjects WHERE class_id = ?").all(req.params.id);
  res.json(subjects);
});

app.post("/api/classes/:id/subjects", (req, res) => {
  const { name } = req.body;
  const info = db.prepare("INSERT INTO subjects (class_id, name) VALUES (?, ?)").run(req.params.id, name);
  res.json({ id: info.lastInsertRowid });
});

app.get("/api/subjects/:id/dskp", (req, res) => {
  const dskp = db.prepare("SELECT * FROM dskp_items WHERE subject_id = ?").all(req.params.id);
  res.json(dskp);
});

app.post("/api/subjects/:id/dskp", (req, res) => {
  const { sk, sp } = req.body;
  const info = db.prepare("INSERT INTO dskp_items (subject_id, sk, sp) VALUES (?, ?, ?)").run(req.params.id, sk, sp);
  res.json({ id: info.lastInsertRowid });
});

app.get("/api/assessments", (req, res) => {
  const { class_id, student_id, subject_id, skill, search } = req.query;
  let query = `
    SELECT a.*, s.name as student_name, sub.name as subject_name, d.sk, d.sp
    FROM assessments a
    JOIN students s ON a.student_id = s.id
    JOIN subjects sub ON a.subject_id = sub.id
    JOIN dskp_items d ON a.dskp_item_id = d.id
    WHERE 1=1
  `;
  const params = [];
  if (class_id) {
    query += " AND s.class_id = ?";
    params.push(class_id);
  }
  if (student_id) {
    query += " AND a.student_id = ?";
    params.push(student_id);
  }
  if (subject_id) {
    query += " AND a.subject_id = ?";
    params.push(subject_id);
  }
  if (skill) {
    query += " AND a.skills LIKE ?";
    params.push(`%${skill}%`);
  }
  if (search) {
    query += " AND (s.name LIKE ? OR d.sk LIKE ? OR d.sp LIKE ? OR a.note LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }
  query += " ORDER BY a.timestamp DESC";
  const assessments = db.prepare(query).all(...params);
  res.json(assessments);
});

app.post("/api/assessments", upload.single("evidence"), (req, res) => {
  const { student_id, subject_id, dskp_item_id, tp_level, skills, note, timestamp } = req.body;
  const evidence_url = req.file ? `/uploads/${req.file.filename}` : null;
  const finalTimestamp = timestamp || new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO assessments (student_id, subject_id, dskp_item_id, tp_level, skills, evidence_url, note, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(student_id, subject_id, dskp_item_id, tp_level, skills, evidence_url, note, finalTimestamp);
  res.json({ id: info.lastInsertRowid });
});

app.post("/api/assessments/bulk", upload.any(), (req, res) => {
  const { subject_id, dskp_item_id, assessments: assessmentsStr, timestamp } = req.body;
  const assessments = JSON.parse(assessmentsStr || "[]");
  const finalTimestamp = timestamp || new Date().toISOString();
  
  const insert = db.prepare(`
    INSERT INTO assessments (student_id, subject_id, dskp_item_id, tp_level, skills, note, evidence_url, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((data) => {
    for (const a of data) {
      const file = (req.files as Express.Multer.File[])?.find(f => f.fieldname === `evidence_${a.student_id}`);
      const evidence_url = file ? `/uploads/${file.filename}` : null;
      
      insert.run(
        a.student_id, 
        subject_id, 
        dskp_item_id, 
        a.tp_level, 
        a.skills || "", 
        a.note || "", 
        evidence_url,
        finalTimestamp
      );
    }
  });

  transaction(assessments);
  res.json({ success: true, count: assessments.length });
});

// Stats for dashboard
app.get("/api/stats", (req, res) => {
  const totalClasses = db.prepare("SELECT COUNT(*) as count FROM classes").get().count;
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
  const tpDistribution = db.prepare("SELECT tp_level, COUNT(*) as count FROM assessments GROUP BY tp_level").all();
  res.json({ totalClasses, totalStudents, tpDistribution });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
