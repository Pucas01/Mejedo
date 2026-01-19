import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const CONFIG_FILE = path.join(process.cwd(), "config", "discord-webhook.json");

// GET current Discord webhook configuration (admin only)
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({ webhookUrl: "", userId: "", enabled: false });
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update Discord webhook configuration (admin only)
router.put("/", (req, res) => {
  try {
    const { webhookUrl, userId, enabled } = req.body;

    const config = {
      webhookUrl: webhookUrl || "",
      userId: userId || "",
      enabled: enabled !== undefined ? enabled : false
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
