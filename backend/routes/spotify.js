import express from "express";
import { getAccessToken } from "./spotifyAuth.js";
import asciify from "asciify-image";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) {
      // Spotify closed or no song playing
      return res.json({ is_playing: false });
    }

    const data = await response.json();

    // Convert album art to ASCII
    let asciiArt = null;
    if (data.item?.album?.images?.[0]?.url) {
      asciiArt = await asciify(data.item.album.images[0].url, {
        fit: "box",
        width: 9,
        height: 6,
        color: true, // set true if you want colored ASCII
      });
    }

    // Build response to match frontend expectations
    const trackInfo = {
      name: data.item.name,
      artist: data.item.artists.map(a => a.name).join(", "),
      album: data.item.album.name,
      albumArt: data.item.album.images[0]?.url || null,
      url: data.item.external_urls.spotify,
      asciiArt,
      is_playing: data.is_playing
    };

    res.json(trackInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
