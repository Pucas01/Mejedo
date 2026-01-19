import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../../authMiddleware.js";
import { startDiscordBot, stopDiscordBot, getBotStatus } from "../../server.js";

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
      recapChannelId: config.recapChannelId || "",
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
    const { token, clientId, guildId, recapChannelId, enabled } = req.body;

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
    if (recapChannelId !== undefined) config.recapChannelId = recapChannelId;
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
    const botStatus = getBotStatus();

    res.json({
      configured: !!(config.token && config.clientId),
      enabled: config.enabled || false,
      running: botStatus.running,
      hasGuildId: !!config.guildId
    });
  } catch (error) {
    console.error("Failed to get bot status:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
});

// POST /api/discord-bot-config/start - Start the bot (admin only)
router.post("/start", requireAuth, async (req, res) => {
  try {
    const result = await startDiscordBot();
    res.json(result);
  } catch (error) {
    console.error("Failed to start bot:", error);
    res.status(500).json({ success: false, error: "Failed to start bot" });
  }
});

// POST /api/discord-bot-config/stop - Stop the bot (admin only)
router.post("/stop", requireAuth, async (req, res) => {
  try {
    const result = await stopDiscordBot();
    res.json(result);
  } catch (error) {
    console.error("Failed to stop bot:", error);
    res.status(500).json({ success: false, error: "Failed to stop bot" });
  }
});

// POST /api/discord-bot-config/restart - Restart the bot (admin only)
router.post("/restart", requireAuth, async (req, res) => {
  try {
    await stopDiscordBot();
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await startDiscordBot();
    res.json(result);
  } catch (error) {
    console.error("Failed to restart bot:", error);
    res.status(500).json({ success: false, error: "Failed to restart bot" });
  }
});

export default router;
