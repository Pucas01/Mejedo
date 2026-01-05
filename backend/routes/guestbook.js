import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "config", "guestbook.json");
const CONFIG_DIR = path.join(process.cwd(), "config");
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// read/write messages
const readMessages = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeMessages = (msgs) => fs.writeFileSync(DATA_FILE, JSON.stringify(msgs, null, 2));

// GET all approved messages (for public users)
router.get("/", (req, res) => {
  try {
    const messages = readMessages().filter((m) => m.approved);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all messages (for admin, including pending)
router.get("/admin", (req, res) => {
  try {
    const messages = readMessages();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new message (pending approval)
router.post("/", (req, res) => {
  try {
    const { name, message, website } = req.body;
    if (!name || !message) return res.status(400).json({ error: "Name and message required" });

    const messages = readMessages();
    const newMessage = {
      id: Date.now(),
      name,
      message,
      website: website || "",
      timestamp: new Date().toISOString(),
      approved: false,
      reply: "",
    };

    messages.push(newMessage);
    writeMessages(messages);

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH approve a message
router.patch("/approve/:id", (req, res) => {
  try {
    const messages = readMessages();
    const msg = messages.find((m) => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.approved = true;
    writeMessages(messages);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reply to a message
router.patch("/reply/:id", (req, res) => {
  try {
    const { reply } = req.body;
    const messages = readMessages();
    const msg = messages.find((m) => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.reply = reply || "";
    writeMessages(messages);
    writeMessages(messages);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a message
router.delete("/:id", (req, res) => {
  try {
    const messages = readMessages();
    const msgIndex = messages.findIndex((m) => m.id == req.params.id);
    if (msgIndex === -1) return res.status(404).json({ error: "Message not found" });

    messages.splice(msgIndex, 1);
    writeMessages(messages);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
