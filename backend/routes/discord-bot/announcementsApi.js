import express from "express";
import requireAuth from "../../authMiddleware.js";
import { getAllAnnouncementChannels } from "./wordStatsDb.js";
import { getDiscordBotInstance } from "../../server.js";

const router = express.Router();

router.post("/send", requireAuth, async (req, res) => {
  try {
    const { title, message, color } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const botInstance = getDiscordBotInstance();
    if (!botInstance || !botInstance.isRunning()) {
      return res.status(503).json({ error: "Discord bot is not running" });
    }

    const announcementChannels = await getAllAnnouncementChannels();

    if (announcementChannels.length === 0) {
      return res.status(400).json({
        error: "No announcement channels configured",
        message: "No servers have announcements enabled or announcement channels set"
      });
    }

    const colorInt = color ? parseInt(color.replace('#', ''), 16) : 0x39ff14;

    const results = await botInstance.broadcastAnnouncement(title, message, colorInt);

    res.json({
      success: true,
      message: `Announcement sent to ${results.successful.length} server(s)`,
      results
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    res.status(500).json({ error: "Failed to send announcement" });
  }
});

router.get("/channels", requireAuth, async (req, res) => {
  try {
    const announcementChannels = await getAllAnnouncementChannels();

    const botInstance = getDiscordBotInstance();
    if (botInstance && botInstance.isRunning()) {
      const client = botInstance.getClient();

      const enrichedChannels = await Promise.all(announcementChannels.map(async (item) => {
        try {
          const guild = await client.guilds.fetch(item.guild_id);
          const channel = await guild.channels.fetch(item.announcement_channel_id);

          return {
            ...item,
            guild_name: guild.name,
            channel_name: channel ? channel.name : null
          };
        } catch (err) {
          console.error(`Failed to fetch guild/channel ${item.guild_id}:`, err.message);
          return {
            ...item,
            guild_name: null,
            channel_name: null
          };
        }
      }));

      res.json(enrichedChannels);
    } else {
      res.json(announcementChannels.map(c => ({ ...c, guild_name: null, channel_name: null })));
    }
  } catch (error) {
    console.error("Error fetching announcement channels:", error);
    res.status(500).json({ error: "Failed to fetch announcement channels" });
  }
});

export default router;
