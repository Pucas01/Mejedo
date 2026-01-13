import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import requireAuth from "../authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "ado-performances.json");
const DEFAULT_PERFORMANCES = [];

// ensure config folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR);
}

// ensure file exists
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_PERFORMANCES, null, 2));
}

const loadData = () => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading ado-performances.json:", err);
    return DEFAULT_PERFORMANCES;
  }
};

const saveData = (data) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
};

// GET all performances
router.get("/", (req, res) => {
  const data = loadData();
  res.json(data);
});

// POST add new performance
router.post("/", requireAuth, (req, res) => {
  const data = loadData();

  const newPerformance = {
    id: req.body.id || Date.now().toString(),
    title: req.body.title || "",
    videoId: req.body.videoId || "",
    description: req.body.description || "",
    year: req.body.year || "",
  };

  data.push(newPerformance);
  saveData(data);

  res.json({ success: true, performance: newPerformance });
});

// DELETE remove performance by ID
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();

  const performanceExists = data.find((p) => p.id === id);
  if (!performanceExists) {
    return res.status(404).json({ error: "Performance not found" });
  }

  const newData = data.filter((p) => p.id !== id);
  saveData(newData);

  res.json({ success: true });
});

// PUT update performance
router.put("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();

  const index = data.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Performance not found" });
  }

  const updatedPerformance = {
    id,
    title: req.body.title || data[index].title,
    videoId: req.body.videoId || data[index].videoId,
    description: req.body.description || data[index].description,
    year: req.body.year || data[index].year,
  };

  data[index] = updatedPerformance;
  saveData(data);

  res.json({ success: true, performance: updatedPerformance });
});

export default router;
