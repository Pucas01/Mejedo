process.env.FORCE_COLOR = '3';
process.env.COLORTERM = 'truecolor';
process.env.TERM = 'xterm-256color';

process.env.G_MESSAGES_DEBUG = '';
process.env.VIPS_WARNING = '0';

import express from "express";

import users from "./routes/auth/users.js"
import requireAuth from "./authMiddleware.js"

import guestbook from "./routes/content/guestbook.js"
import projectsRouter from "./routes/content/projects.js";
import shitpostsRouter from "./routes/content/shitposts.js";
import blogpostsRouter from "./routes/content/blogposts.js";
import collections from "./routes/content/collection.js";
import collectionsManga from "./routes/content/collectionManga.js"
import changelogRoute from "./routes/content/changelog.js"
import speedrunLeaderboardRoute from "./routes/content/speedrunLeaderboard.js"

import spotifyRoute from "./routes/integrations/spotify.js"
import nintendoRoute from "./routes/integrations/nintendo.js"
import discordRoute from "./routes/integrations/discord.js"
import hoyolabRoute from "./routes/integrations/hoyolab.js"
import discordWebhookConfigRoute from "./routes/integrations/discord-webhook-config.js"
import newgroundsRoute from "./routes/integrations/newgrounds.js"

import adoRoute from "./routes/ado/ado.js"
import adoToursRoute from "./routes/ado/ado-tours.js"
import adoToursScraperRoute from "./routes/ado/ado-tours-scraper.js"
import adoAwardsRoute from "./routes/ado/ado-awards.js"
import adoAwardsScraperRoute from "./routes/ado/ado-awards-scraper.js"
import adoDiscographyRoute from "./routes/ado/ado-discography.js"
import mikuDiscographyRoute from "./routes/ado/miku-discography.js"

import counter from "./routes/utils/moeCounter.js"
import uploadRouter from "./routes/utils/imageUpload.js";
import versionsRoute from "./routes/utils/versions.js"
import musicRoute from "./routes/utils/music.js"

import DiscordBot from "./routes/discord-bot/bot.js"
import discordBotConfigRoute from "./routes/discord-bot/config.js"
import wordStatsApiRoute from "./routes/discord-bot/wordStatsApi.js"
import spotifyStatsApiRoute from "./routes/discord-bot/spotifyStatsApi.js"
import gameStatsApiRoute from "./routes/discord-bot/gameStatsApi.js"
import announcementsApiRoute from "./routes/discord-bot/announcementsApi.js"

import session from "express-session"
import cors from "cors";
import * as crypto from 'crypto';
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(process.cwd(), "config");
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

const DISCORD_WEBHOOK_FILE = path.join(CONFIG_DIR, "discord-webhook.json");
if (!fs.existsSync(DISCORD_WEBHOOK_FILE)) {
  const defaultConfig = {
    webhookUrl: "",
    userId: "",
    enabled: false
  };
  fs.writeFileSync(DISCORD_WEBHOOK_FILE, JSON.stringify(defaultConfig, null, 2));
  console.log("Created default discord-webhook.json config file");
}

const DISCORD_BOT_FILE = path.join(CONFIG_DIR, "discord-bot.json");
if (!fs.existsSync(DISCORD_BOT_FILE)) {
  const defaultConfig = {
    token: "",
    clientId: "",
    guildId: "",
    enabled: false
  };
  fs.writeFileSync(DISCORD_BOT_FILE, JSON.stringify(defaultConfig, null, 2));
  console.log("Created default discord-bot.json config file");
}

const SESSION_SECRET = crypto.randomBytes(64).toString("hex");
const PORT = 4000
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  }
}));

app.use("/api/spotify-now-playing", spotifyRoute);
app.use("/api/nintendo-presence", nintendoRoute);
app.use("/api/guestbook", guestbook);
app.use("/api/counter", counter);
app.use("/api/users", users);
app.use("/api/projects", projectsRouter);
app.use("/api/shitposts", shitpostsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/blogposts", blogpostsRouter);
app.use("/api/consoles", collections);
app.use("/api/manga", collectionsManga);
app.use("/api/versions", versionsRoute);
app.use("/api/discord-presence", discordRoute);
app.use("/api/changelog", changelogRoute);
app.use("/api/music", musicRoute);
app.use("/api/speedrun-leaderboard", speedrunLeaderboardRoute);
app.use("/api/ado", adoRoute);
app.use("/api/ado-tours", adoToursRoute);
app.use("/api/ado-tours-scraper", adoToursScraperRoute);
app.use("/api/ado-awards", adoAwardsRoute);
app.use("/api/ado-awards-scraper", adoAwardsScraperRoute);
app.use("/api/ado-discography", adoDiscographyRoute);
app.use("/api/miku-discography", mikuDiscographyRoute);
app.use("/api/hoyolab", hoyolabRoute);
app.use("/api/newgrounds", newgroundsRoute);
app.use("/api/discord-webhook-config", requireAuth, discordWebhookConfigRoute);
app.use("/api/discord-bot-config", discordBotConfigRoute);
app.use("/api/word-stats", wordStatsApiRoute);
app.use("/api/spotify-stats", spotifyStatsApiRoute);
app.use("/api/game-stats", gameStatsApiRoute);
app.use("/api/announcements", announcementsApiRoute);

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

let discordBotInstance = null;

export async function startDiscordBot() {
  const botConfig = JSON.parse(fs.readFileSync(DISCORD_BOT_FILE, 'utf-8'));

  if (!botConfig.enabled) {
    console.log('Discord bot is disabled in config.');
    return { success: false, message: 'Bot is disabled in config' };
  }

  if (discordBotInstance && discordBotInstance.isRunning()) {
    console.log('Discord bot is already running.');
    return { success: false, message: 'Bot is already running' };
  }

  try {
    discordBotInstance = new DiscordBot();
    await discordBotInstance.initialize(botConfig);
    console.log('Discord bot started successfully');
    return { success: true, message: 'Bot started successfully' };
  } catch (err) {
    console.error('Failed to initialize Discord bot:', err);
    discordBotInstance = null;
    return { success: false, message: 'Failed to start bot: ' + err.message };
  }
}

export async function stopDiscordBot() {
  if (!discordBotInstance) {
    return { success: false, message: 'Bot is not running' };
  }

  try {
    await discordBotInstance.stop();
    discordBotInstance = null;
    return { success: true, message: 'Bot stopped successfully' };
  } catch (err) {
    console.error('Failed to stop Discord bot:', err);
    return { success: false, message: 'Failed to stop bot: ' + err.message };
  }
}

export function getBotStatus() {
  return {
    running: discordBotInstance ? discordBotInstance.isRunning() : false,
    instance: discordBotInstance
  };
}

export function getDiscordBotInstance() {
  return discordBotInstance;
}

const botConfig = JSON.parse(fs.readFileSync(DISCORD_BOT_FILE, 'utf-8'));
if (botConfig.enabled) {
  startDiscordBot();
} else {
  console.log('Discord bot is disabled in config.');
}

const FNF_SCORES_FILE = path.join(CONFIG_DIR, "fnf-scores.json");
let fnfScoresInterval = null;

async function refreshFNFScores() {
  try {
    if (!fs.existsSync(FNF_SCORES_FILE)) {
      console.log('[FNF] No scores file found, skipping auto-refresh');
      return;
    }

    const data = JSON.parse(fs.readFileSync(FNF_SCORES_FILE, 'utf-8'));
    if (!data.username) {
      console.log('[FNF] No username configured, skipping auto-refresh');
      return;
    }

    console.log(`[FNF] Auto-refreshing scores for ${data.username}...`);
    const response = await fetch('http://localhost:4000/api/newgrounds/fnf/refresh-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: data.username })
    });

    const result = await response.json();
    console.log(`[FNF] Auto-refresh complete: ${result.scores?.length || 0} scores found`);
  } catch (error) {
    console.error('[FNF] Auto-refresh failed:', error);
  }
}

function scheduleFNFRefresh() {
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);

  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  const msUntil3AM = next3AM - now;
  console.log(`[FNF] Next score refresh scheduled for ${next3AM.toLocaleString()}`);

  setTimeout(() => {
    refreshFNFScores();
    fnfScoresInterval = setInterval(refreshFNFScores, 24 * 60 * 60 * 1000);
  }, msUntil3AM);
}

scheduleFNFRefresh();

let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    console.log('Stopping server from accepting new connections...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    if (discordBotInstance && discordBotInstance.isRunning()) {
      console.log('Stopping Discord bot...');
      await stopDiscordBot();
      console.log('Discord bot stopped successfully');
    }

    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
