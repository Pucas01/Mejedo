import express from "express";
import { getAccessToken } from "./spotifyAuth.js";
import fs from "fs";
import path from "path";

const router = express.Router();

const ADO_ARTIST_ID = "6mEQK9m2krja6X1cfsAjfl";

const CACHE_FILE = path.join(process.cwd(), "config", "ado-discography.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000;

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

router.get("/", async (req, res) => {
  try {
    const cached = readCache();
    if (cached) {
      return res.json(cached);
    }

    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${ADO_ARTIST_ID}/albums?include_groups=album,single&market=JP&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
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

    res.json(albums);
  } catch (err) {
    console.error("Failed to fetch Ado discography:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }

    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${ADO_ARTIST_ID}/albums?include_groups=album,single&market=JP&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
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
