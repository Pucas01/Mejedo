import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../../authMiddleware.js";

const router = express.Router();
const CONFIG_FILE = path.join(process.cwd(), "config", "discord-bot.json");

// GET /api/discord-bot-config - Get current bot configuration (admin only)
router.get("/", requireAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

    // Don't send the full token to the frontend, just indicate if it's set
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

// PUT /api/discord-bot-config - Update bot configuration (admin only)
router.put("/", requireAuth, (req, res) => {
  try {
    const { token, clientId, guildId, enabled } = req.body;

    // Read existing config
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }

    // Update config with new values
    // Only update token if a new one is provided (not the placeholder)
    if (token && token !== "***SET***") {
      config.token = token;
    }

    if (clientId !== undefined) config.clientId = clientId;
    if (guildId !== undefined) config.guildId = guildId;
    if (enabled !== undefined) config.enabled = enabled;

    // Write updated config
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Return safe config (without full token)
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

// GET /api/discord-bot-config/status - Get bot status (admin only)
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
