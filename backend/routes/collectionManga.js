import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../authMiddleware.js";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid"; // make sure you have 'uuid' installed

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
  volumes: [] // [{ number: "", title: "", cover: "" }]
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

// ------------------------------------------------------------
// GET → /api/manga
// ------------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const manga = readManga();
    const filtered = manga.filter((m) => m.title);
    res.json(filtered);
  } catch (err) {
    console.error("Error reading manga.json:", err);
    res.status(500).json({ error: "Failed to load manga" });
  }
});

// ------------------------------------------------------------
// POST → /api/manga
// ------------------------------------------------------------
router.post("/", requireAuth, (req, res) => {
  try {
    const mangaList = readManga();
    const body = req.body;

    if (!body || !body.title) {
      return res.status(400).json({ error: "Invalid manga data" });
    }

    const newManga = {
      id: uuidv4(), // generate unique ID
      title: body.title || "",
      author: body.author || "",
      releaseYear: body.releaseYear || "",
      cover: body.cover || "",
      volumes: Array.isArray(body.volumes)
        ? body.volumes.map(v => ({
            number: v.number || "",
            title: v.title || "",
            cover: v.cover || ""
          }))
        : []
    };

    mangaList.push(newManga);
    writeManga(mangaList);

    res.json({ success: true, manga: newManga });
  } catch (err) {
    console.error("Error saving manga:", err);
    res.status(500).json({ error: "Failed to save manga" });
  }
});

// ------------------------------------------------------------
// PUT → /api/manga/:id
// ------------------------------------------------------------
router.put("/:id", requireAuth, (req, res) => {
  try {
    const mangaList = readManga();
    const { id } = req.params;
    const updatedData = req.body;

    const index = mangaList.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ error: "Manga entry not found" });

    mangaList[index] = {
      ...mangaList[index],
      ...updatedData,
      volumes: Array.isArray(updatedData.volumes)
        ? updatedData.volumes.map(v => ({
            number: v.number || "",
            title: v.title || "",
            cover: v.cover || ""
          }))
        : mangaList[index].volumes
    };

    writeManga(mangaList);
    res.json({ success: true, manga: mangaList[index] });
  } catch (err) {
    console.error("Error updating manga:", err);
    res.status(500).json({ error: "Failed to update manga" });
  }
});

// ------------------------------------------------------------
// DELETE → /api/manga/:id/volume/:index
// ------------------------------------------------------------
router.delete("/:id/volume/:index", requireAuth, (req, res) => {
  try {
    const { id, index } = req.params;
    const mangaList = readManga();

    const manga = mangaList.find(m => m.id === id);
    if (!manga) return res.status(404).json({ error: "Manga not found" });

    const volIndex = parseInt(index);
    if (isNaN(volIndex) || volIndex < 0 || volIndex >= manga.volumes.length) {
      return res.status(400).json({ error: "Invalid volume index" });
    }

    const volume = manga.volumes[volIndex];

    // Delete volume cover if stored locally
    if (volume.cover && volume.cover.startsWith("/uploads/")) {
      const relative = volume.cover.replace(/^\/+/, "");
      const filePath = path.join(__dirname, "../../public", relative);

      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete volume cover:", err);
      }
    }

    // Remove the volume from list
    manga.volumes.splice(volIndex, 1);

    writeManga(mangaList);

    res.json({ success: true, manga });
  } catch (err) {
    console.error("Error deleting volume:", err);
    res.status(500).json({ error: "Failed to delete volume" });
  }
});

// ------------------------------------------------------------
// PUT → /api/manga/:id/volume/move
// Move a volume from one index to another
// ------------------------------------------------------------
router.put("/:id/volume/move", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.body;

    const mangaList = readManga();
    const manga = mangaList.find(m => m.id === id);

    if (!manga) return res.status(404).json({ error: "Manga not found" });

    const fromIndex = parseInt(from);
    const toIndex = parseInt(to);

    if (
      isNaN(fromIndex) || isNaN(toIndex) ||
      fromIndex < 0 || toIndex < 0 ||
      fromIndex >= manga.volumes.length ||
      toIndex >= manga.volumes.length
    ) {
      return res.status(400).json({ error: "Invalid from/to index" });
    }

    // Move volume in array
    const [moved] = manga.volumes.splice(fromIndex, 1);
    manga.volumes.splice(toIndex, 0, moved);

    writeManga(mangaList);

    res.json({ success: true, manga });
  } catch (err) {
    console.error("Error moving volume:", err);
    res.status(500).json({ error: "Failed to reorder volumes" });
  }
});


// ------------------------------------------------------------
// DELETE → /api/manga/:id
// ------------------------------------------------------------
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  const mangaList = readManga();
  const toDelete = mangaList.find((m) => m.id === id);

  if (!toDelete) return res.status(404).json({ error: "Manga entry not found" });

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

  const updated = mangaList.filter((m) => m.id !== id);
  writeManga(updated);

  res.json({ success: true });
});

export default router;
