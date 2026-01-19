import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "moeCounter.json");

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

// Initialize the file if it doesn't exist
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ counterName: "default" }, null, 2));
}

// GET footer config
router.get("/", (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE);
    const config = JSON.parse(raw);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
