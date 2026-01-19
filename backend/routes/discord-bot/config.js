import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../../authMiddleware.js";

const router = express.Router();
const CONFIG_FILE = path.join(process.cwd(), "config", "discord-bot.json");

router.get("/", requireAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

    const safeConfig = {
      ...config,
      token: config.token ? "***SET***" : "",
      clientId: config.clientId || "",
      guildId: config.guildId || "",
      enabled: config.enabled || false
    };

    res.json(safeConfig);
  } catch (error) {
    console.error("Failed to read bot config:", error);
    res.status(500).json({ error: "Failed to read configuration" });
  }
});

router.put("/", requireAuth, (req, res) => {
  try {
    const { token, clientId, guildId, enabled } = req.body;

    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }

    if (token && token !== "***SET***") {
      config.token = token;
    }

    if (clientId !== undefined) config.clientId = clientId;
    if (guildId !== undefined) config.guildId = guildId;
    if (enabled !== undefined) config.enabled = enabled;

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    const safeConfig = {
      ...config,
      token: config.token ? "***SET***" : ""
    };

    res.json({
      success: true,
      config: safeConfig,
      message: "Configuration updated. Restart the server to apply changes."
    });
  } catch (error) {
    console.error("Failed to update bot config:", error);
    res.status(500).json({ error: "Failed to update configuration" });
  }
});

router.get("/status", requireAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.json({
        configured: false,
        enabled: false,
        running: false
      });
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

    res.json({
      configured: !!(config.token && config.clientId),
      enabled: config.enabled || false,
      running: config.enabled && config.token && config.clientId,
      hasGuildId: !!config.guildId
    });
  } catch (error) {
    console.error("Failed to get bot status:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
});

export default router;
