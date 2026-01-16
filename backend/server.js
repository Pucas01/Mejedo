// Force color support for ASCII art in production
// Set multiple environment variables that different libraries check
process.env.FORCE_COLOR = '3';
process.env.COLORTERM = 'truecolor';
process.env.TERM = 'xterm-256color';

// Suppress GLib warnings from image processing libraries
process.env.G_MESSAGES_DEBUG = '';
process.env.VIPS_WARNING = '0';

import express from "express";
import spotifyRoute from "./routes/spotify.js"
import nintendoRoute from "./routes/nintendo.js"
import guestbook from "./routes/guestbook.js"
import counter from "./routes/moeCounter.js"
import users from "./routes/users.js"
import projectsRouter from "./routes/projects.js";
import shitpostsRouter from "./routes/shitposts.js";
import uploadRouter from "./routes/imageUpload.js";
import blogpostsRouter from "./routes/blogposts.js";
import collections from "./routes/collection.js";
import collectionsManga from "./routes/collectionManga.js"
import versionsRoute from "./routes/versions.js"
import discordRoute from "./routes/discord.js"
import changelogRoute from "./routes/changelog.js"
import musicRoute from "./routes/music.js"
import speedrunLeaderboardRoute from "./routes/speedrunLeaderboard.js"
import adoRoute from "./routes/ado.js"
import adoToursRoute from "./routes/ado-tours.js"
import adoToursScraperRoute from "./routes/ado-tours-scraper.js"
import adoAwardsRoute from "./routes/ado-awards.js"
import adoAwardsScraperRoute from "./routes/ado-awards-scraper.js"
import adoDiscographyRoute from "./routes/ado-discography.js"
import mikuDiscographyRoute from "./routes/miku-discography.js"
import requireAuth from "./authMiddleware.js"
import session from "express-session"
import cors from "cors";
import * as crypto from 'crypto';
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
