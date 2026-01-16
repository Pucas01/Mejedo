import express from "express";
import { getAccessToken } from "./spotifyAuth.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Hatsune Miku's Spotify Artist ID
const MIKU_ARTIST_ID = "6pNgnvzBa6Bthsv8SrZJYl";

// Cache file
const CACHE_FILE = path.join(process.cwd(), "config", "miku-discography.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper to read cache
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      const now = Date.now();
      if (data.cachedAt && now - data.cachedAt < CACHE_DURATION) {
        return data.albums;
      }
    }
  } catch (err) {
    console.error("Failed to read cache:", err);
  }
  return null;
}

// Helper to write cache
function writeCache(albums) {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ albums, cachedAt: Date.now() }, null, 2)
    );
  } catch (err) {
    console.error("Failed to write cache:", err);
  }
}

// GET /api/miku-discography - Get Miku's albums from Spotify
router.get("/", async (req, res) => {
  try {
    // Check cache first
    const cached = readCache();
    if (cached) {
      return res.json(cached);
    }

    const token = await getAccessToken();

    // Fetch albums from Spotify
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${MIKU_ARTIST_ID}/albums?include_groups=album,single&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      console.error(`Spotify API error for Miku (${MIKU_ARTIST_ID}): ${response.status}`);
      return res.json([]);
    }

    const data = await response.json();

    // Transform and sort albums
    const albums = data.items
      .map((album) => ({
        id: album.id,
        name: album.name,
        releaseDate: album.release_date,
        year: album.release_date.split("-")[0],
        type: album.album_type, // "album" or "single"
        totalTracks: album.total_tracks,
        coverUrl: album.images[0]?.url || null,
        spotifyUrl: album.external_urls.spotify,
        artists: album.artists.map((a) => a.name).join(", "),
      }))
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)); // Newest first

    // Cache the results
    writeCache(albums);

    res.json(albums);
  } catch (err) {
    console.error("Failed to fetch Miku discography:", err);
    res.status(500).json([]);
  }
});

// POST /api/miku-discography/refresh - Force refresh cache (admin only)
router.post("/refresh", async (req, res) => {
  try {
    // Delete cache file to force refresh
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }

    const token = await getAccessToken();

    // Fetch fresh data
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${MIKU_ARTIST_ID}/albums?include_groups=album,single&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      console.error(`Spotify API error for Miku (${MIKU_ARTIST_ID}): ${response.status}`);
      return res.json([]);
    }

    const data = await response.json();

    const albums = data.items
      .map((album) => ({
        id: album.id,
        name: album.name,
        releaseDate: album.release_date,
        year: album.release_date.split("-")[0],
        type: album.album_type,
        totalTracks: album.total_tracks,
        coverUrl: album.images[0]?.url || null,
        spotifyUrl: album.external_urls.spotify,
        artists: album.artists.map((a) => a.name).join(", "),
      }))
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    writeCache(albums);

    res.json({ success: true, count: albums.length, albums });
  } catch (err) {
    console.error("Failed to refresh discography:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
