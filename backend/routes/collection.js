import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../authMiddleware.js";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid"; // for generating unique IDs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "consoles.json");

const DEFAULT_CONSOLE = {
  id: "",
  name: "",
  manufacturer: "",
  releaseYear: "",
  image: "",
  games: [] // [{ title: "", cover: "" }]
};

if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
if (!fs.existsSync(CONFIG_FILE))
  fs.writeFileSync(CONFIG_FILE, JSON.stringify([], null, 2));

const readConsoles = () => {
  const data = fs.readFileSync(CONFIG_FILE, "utf-8");
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const writeConsoles = (consoles) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(consoles, null, 2));
};

// ------------------------------------------------------------
// GET → /api/consoles
// ------------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const consoles = readConsoles();
    const filtered = consoles.filter((c) => c.name); // ignore empty template
    res.json(filtered);
  } catch (err) {
    console.error("Error reading consoles.json:", err);
    res.status(500).json({ error: "Failed to load consoles" });
  }
});

// ------------------------------------------------------------
// POST → /api/consoles
// ------------------------------------------------------------
router.post("/", requireAuth, (req, res) => {
  try {
    const consoles = readConsoles();
    const body = req.body;

    if (!body || !body.name) {
      return res.status(400).json({ error: "Invalid console data" });
    }

    const newConsole = {
      id: uuidv4(), // generate unique ID
      name: body.name || "",
      manufacturer: body.manufacturer || "",
      releaseYear: body.releaseYear || "",
      image: body.image || "",
      games: Array.isArray(body.games) ? body.games : []
    };

    consoles.push(newConsole);
    writeConsoles(consoles);

    res.json({ success: true, console: newConsole });
  } catch (err) {
    console.error("Error saving console:", err);
    res.status(500).json({ error: "Failed to save console" });
  }
});

// ------------------------------------------------------------
// PUT → /api/consoles/:id
// ------------------------------------------------------------
router.put("/:id", requireAuth, (req, res) => {
  try {
    const consoles = readConsoles();
    const { id } = req.params;
    const body = req.body;

    const index = consoles.findIndex((c) => c.id === id);
    if (index === -1)
      return res.status(404).json({ error: "Console not found" });

    // Merge update and ensure games is always array
    consoles[index] = {
      ...consoles[index],
      ...body,
      games: Array.isArray(body.games) ? body.games : consoles[index].games
    };

    writeConsoles(consoles);
    res.json({ success: true, console: consoles[index] });
  } catch (err) {
    console.error("Error updating console:", err);
    res.status(500).json({ error: "Failed to update console" });
  }
});

// ------------------------------------------------------------
// DELETE → /api/consoles/:id
// ------------------------------------------------------------
router.delete("/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const consoles = readConsoles();
    const consoleToDelete = consoles.find((c) => c.id === id);

    if (!consoleToDelete)
      return res.status(404).json({ error: "Console not found" });

    // Delete main image
    if (consoleToDelete.image && consoleToDelete.image.startsWith("/uploads/")) {
      const relativePath = consoleToDelete.image.replace(/^\/+/, "");
      const filePath = path.join(__dirname, "../../public", relativePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete game cover images
    if (Array.isArray(consoleToDelete.games)) {
      consoleToDelete.games.forEach((game) => {
        if (game.cover && game.cover.startsWith("/uploads/")) {
          const relative = game.cover.replace(/^\/+/, "");
          const gamePath = path.join(__dirname, "../../public", relative);
          if (fs.existsSync(gamePath)) fs.unlinkSync(gamePath);
        }
      });
    }

    const updated = consoles.filter((c) => c.id !== id);
    writeConsoles(updated);

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting console:", err);
    res.status(500).json({ error: "Failed to delete console" });
  }
});

export default router;
