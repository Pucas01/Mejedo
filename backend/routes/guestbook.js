import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "config", "guestbook.json");
const CONFIG_DIR = path.join(process.cwd(), "config");
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

// Ensure the JSON file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// GET all messages
router.get("/", (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    const messages = JSON.parse(raw);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new message
router.post("/", (req, res) => {
  try {
    const { name, message, website } = req.body;
    if (!name || !message) return res.status(400).json({ error: "Name and message required" });

    const raw = fs.readFileSync(DATA_FILE);
    const messages = JSON.parse(raw);

    const newMessage = {
      id: Date.now(),
      name,
      message,       // can include HTML
      website: website || "",
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
