import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import requireAuth from "../authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "ado-tours.json");
const DEFAULT_TOURS = [];

// ensure config folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR);
}

// ensure file exists
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_TOURS, null, 2));
}

const loadData = () => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading ado-tours.json:", err);
    return DEFAULT_TOURS;
  }
};

const saveData = (data) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
};

// GET all tours
router.get("/", (req, res) => {
  const data = loadData();
  res.json(data);
});

// POST add new tour
router.post("/", requireAuth, (req, res) => {
  const data = loadData();

  const newTour = {
    id: req.body.id || Date.now().toString(),
    tourName: req.body.tourName || "",
    date: req.body.date || "",
    venue: req.body.venue || "",
    location: req.body.location || "",
    notes: req.body.notes || "",
  };

  data.push(newTour);
  saveData(data);

  res.json({ success: true, tour: newTour });
});

// DELETE remove tour by ID
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();

  const tourExists = data.find((t) => t.id === id);
  if (!tourExists) {
    return res.status(404).json({ error: "Tour not found" });
  }

  const newData = data.filter((t) => t.id !== id);
  saveData(newData);

  res.json({ success: true });
});

// PUT update tour
router.put("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const data = loadData();

  const index = data.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Tour not found" });
  }

  const updatedTour = {
    id,
    tourName: req.body.tourName || data[index].tourName,
    date: req.body.date || data[index].date,
    venue: req.body.venue || data[index].venue,
    location: req.body.location || data[index].location,
    notes: req.body.notes || data[index].notes,
  };

  data[index] = updatedTour;
  saveData(data);

  res.json({ success: true, tour: updatedTour });
});

export default router;
