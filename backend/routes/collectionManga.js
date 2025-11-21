import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../authMiddleware.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "manga.json");

// Default structure for a manga entry
const DEFAULT_MANGA = {
  id: "",
  title: "",
  author: "",
  releaseYear: "",
  cover: "",
  volumes: [] // [{ title: "", cover: "" }]
};

if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
if (!fs.existsSync(CONFIG_FILE))
  fs.writeFileSync(CONFIG_FILE, JSON.stringify([DEFAULT_MANGA], null, 2));

const readManga = () => {
  const data = fs.readFileSync(CONFIG_FILE, "utf-8");
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const writeManga = (manga) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(manga, null, 2));
};

//
// ------------------------------------------------------------
// GET → /api/manga
// ------------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const manga = readManga();

    // Filter blank template
    const filtered = manga.filter((m) => m.title);

    res.json(filtered);
  } catch (err) {
    console.error("Error reading manga.json:", err);
    res.status(500).json({ error: "Failed to load manga" });
  }
});

//
// ------------------------------------------------------------
// POST → /api/manga
// ------------------------------------------------------------
router.post("/", requireAuth, (req, res) => {
  try {
    const manga = readManga();
    const newManga = req.body || DEFAULT_MANGA;

    manga.push(newManga);
    writeManga(manga);

    res.json({ success: true, manga: newManga });
  } catch (err) {
    console.error("Error saving manga:", err);
    res.status(500).json({ error: "Failed to save manga" });
  }
});

//
// ------------------------------------------------------------
// PUT → /api/manga/:id
// ------------------------------------------------------------
router.put("/:id", requireAuth, (req, res) => {
  try {
    const manga = readManga();
    const { id } = req.params;
    const updatedData = req.body;

    const index = manga.findIndex((m) => m.id === id);
    if (index === -1)
      return res.status(404).json({ error: "Manga entry not found" });

    manga[index] = { ...manga[index], ...updatedData };
    writeManga(manga);

    res.json({ success: true, manga: manga[index] });
  } catch (err) {
    console.error("Error updating manga:", err);
    res.status(500).json({ error: "Failed to update manga" });
  }
});

//
// ------------------------------------------------------------
// DELETE → /api/manga/:id
// ------------------------------------------------------------
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  const manga = readManga();
  const toDelete = manga.find((m) => m.id === id);

  if (!toDelete)
    return res.status(404).json({ error: "Manga entry not found" });

  // Delete main cover
  if (toDelete.cover && toDelete.cover.startsWith("/uploads/")) {
    const relative = toDelete.cover.replace(/^\/+/, "");
    const filePath = path.join(__dirname, "../../public", relative);

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete series cover:", err);
    }
  }

  // Delete volume covers
  if (Array.isArray(toDelete.volumes)) {
    toDelete.volumes.forEach((volume) => {
      if (volume.cover && volume.cover.startsWith("/uploads/")) {
        const relative = volume.cover.replace(/^\/+/, "");
        const filePath = path.join(__dirname, "../../public", relative);

        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete volume cover:", err);
        }
      }
    });
  }

  // Save updated manga.json
  const updated = manga.filter((m) => m.id !== id);
  writeManga(updated);

  res.json({ success: true });
});

export default router;
