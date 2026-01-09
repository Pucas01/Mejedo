import express from "express";
import { getAccessToken } from "./spotifyAuth.js";
import asciify from "asciify-image";

const router = express.Router();
let lastPlayedTrack = null;

router.get("/", async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let isPlaying = true;
    let trackInfo = null;

    if (response.status === 204) {
      isPlaying = false;
    } else {
      const data = await response.json();
      isPlaying = data.is_playing;

      // Convert album art to ASCII
      let asciiArt = null;
      if (data.item?.album?.images?.[0]?.url) {
        process.env.FORCE_COLOR = '1';
        asciiArt = await asciify(data.item.album.images[0].url, {
          fit: "box",
          width: 9,
          height: 6,
          color: true,
          c_ratio: 2,
        });
      }

      trackInfo = {
        name: data.item.name,
        artist: data.item.artists.map((a) => a.name).join(", "),
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url || null,
        url: data.item.external_urls.spotify,
        asciiArt,
        is_playing: isPlaying,
        played_at: new Date().toISOString(),
      };

      lastPlayedTrack = trackInfo;
    }

    // If nothing is playing, return last played track with is_playing: false
    if (!isPlaying && lastPlayedTrack) {
      trackInfo = { ...lastPlayedTrack, is_playing: false };
    }

    res.json({ track: trackInfo, is_playing: isPlaying });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
