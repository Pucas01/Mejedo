import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import requireAuth from "../authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "ado-awards.json");

// Ensure config directory and file exist
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify([], null, 2));
}

// GET all awards
router.get("/", (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const awards = JSON.parse(raw);
    res.json(awards);
  } catch (err) {
    console.error("Error reading awards:", err);
    res.status(500).json({ error: "Failed to load awards" });
  }
});

// POST create new award
router.post("/", requireAuth, (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const awards = JSON.parse(raw);

    const newAward = req.body;
    awards.push(newAward);

    // Sort by year descending
    awards.sort((a, b) => b.year - a.year);

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(awards, null, 2));
    res.json(newAward);
  } catch (err) {
    console.error("Error adding award:", err);
    res.status(500).json({ error: "Failed to add award" });
  }
});

// PUT update award
router.put("/:id", requireAuth, (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const awards = JSON.parse(raw);

    const index = awards.findIndex((a) => a.id === req.params.id);
    if (index !== -1) {
      awards[index] = req.body;

      // Sort by year descending
      awards.sort((a, b) => b.year - a.year);

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(awards, null, 2));
      res.json(req.body);
    } else {
      res.status(404).json({ error: "Award not found" });
    }
  } catch (err) {
    console.error("Error updating award:", err);
    res.status(500).json({ error: "Failed to update award" });
  }
});

// DELETE award
router.delete("/:id", requireAuth, (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    let awards = JSON.parse(raw);

    awards = awards.filter((a) => a.id !== req.params.id);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(awards, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting award:", err);
    res.status(500).json({ error: "Failed to delete award" });
  }
});

export default router;
