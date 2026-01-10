import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const MUSIC_DIR = path.join(__dirname, "../../public/uploads/music");

if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MUSIC_DIR),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const audioMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/aac',
      'audio/flac',
      'audio/m4a'
    ];
    if (audioMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|webm|aac|flac|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

router.get("/", (req, res) => {
  try {
    const files = fs.readdirSync(MUSIC_DIR);
    const audioFiles = files.filter(file =>
      file.match(/\.(mp3|wav|ogg|webm|aac|flac|m4a)$/i)
    );
    res.json({ songs: audioFiles });
  } catch (err) {
    console.error("Error reading music directory:", err);
    res.status(500).json({ error: "Failed to read music directory" });
  }
});

router.post("/upload", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  upload.single("music")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      success: true,
      filename: req.file.filename
    });
  });
});

router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(MUSIC_DIR, filename);

  const resolvedPath = path.resolve(filePath);
  const resolvedMusicDir = path.resolve(MUSIC_DIR);
  if (!resolvedPath.startsWith(resolvedMusicDir)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

router.delete("/:filename", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const filename = req.params.filename;
  const filePath = path.join(MUSIC_DIR, filename);

  const resolvedPath = path.resolve(filePath);
  const resolvedMusicDir = path.resolve(MUSIC_DIR);
  if (!resolvedPath.startsWith(resolvedMusicDir)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
