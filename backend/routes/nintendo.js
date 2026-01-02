import express from "express";
import asciify from "asciify-image";

const router = express.Router();
const NINTENDO_API_URL = "https://nxapi-presence.fancy.org.uk/api/presence/9167f8e6c934c73b";

let lastPresence = null;

router.get("/", async (req, res) => {
  try {
    const response = await fetch(NINTENDO_API_URL);
    const data = await response.json();

    const friend = data.friend;
    const presence = friend?.presence;
    const game = presence?.game;

    const isOnline = presence?.state === "ONLINE" || presence?.state === "PLAYING";
    const isPlaying = Object.keys(game || {}).length > 0;

    // Convert profile picture to ASCII
    let pfpAsciiArt = null;
    if (friend?.imageUri) {
      try {
        pfpAsciiArt = await asciify(friend.imageUri, {
          fit: "box",
          width: 9,
          height: 6,
          color: true,
        });
      } catch (e) {
        console.error("Failed to asciify profile picture:", e);
      }
    }

    // Convert game image to ASCII if playing
    let gameAsciiArt = null;
    if (isPlaying && game?.imageUri) {
      try {
        gameAsciiArt = await asciify(game.imageUri, {
          fit: "box",
          width: 9,
          height: 6,
          color: true,
        });
      } catch (e) {
        console.error("Failed to asciify game image:", e);
      }
    }

    const presenceInfo = {
      username: friend?.name || "Unknown",
      imageUri: friend?.imageUri || null,
      pfpAsciiArt,
      state: presence?.state || "OFFLINE",
      isOnline,
      isPlaying,
      game: isPlaying ? {
        name: game?.name || null,
        imageUri: game?.imageUri || null,
        asciiArt: gameAsciiArt,
        shopUri: game?.shopUri || null,
        totalPlayTime: game?.totalPlayTime || 0,
        firstPlayedAt: game?.firstPlayedAt || null,
      } : null,
      updatedAt: presence?.updatedAt ? new Date(presence.updatedAt * 1000).toISOString() : null,
      logoutAt: presence?.logoutAt ? new Date(presence.logoutAt * 1000).toISOString() : null,
    };

    lastPresence = presenceInfo;

    res.json({ presence: presenceInfo, is_online: isOnline });
  } catch (err) {
    console.error("Nintendo API error:", err);

    // Return last known presence if available
    if (lastPresence) {
      res.json({ presence: { ...lastPresence, is_online: false }, is_online: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
