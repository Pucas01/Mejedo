import express from "express";
import asciify from "asciify-image";

const router = express.Router();

const DISCORD_USER_ID = "333274561430683649";
const LANYARD_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

let lastPresence = null;

router.get("/", async (req, res) => {
  try {
    const response = await fetch(LANYARD_API_URL);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Failed to fetch Discord presence");
    }

    const presence = data.data;
    const discordUser = presence.discord_user;
    const activities = presence.activities || [];

    // Find the main activity (not custom status)
    const mainActivity = activities.find(a => a.type !== 4) || null;
    const customStatus = activities.find(a => a.type === 4) || null;

    // Get avatar URL
    const avatarHash = discordUser.avatar;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${avatarHash}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator) % 5}.png`;

    // Convert avatar to ASCII
    let avatarAsciiArt = null;
    try {
      avatarAsciiArt = await asciify(avatarUrl, {
        fit: "box",
        width: 9,
        height: 6,
        color: true,
      });
    } catch (e) {
      console.error("Failed to asciify Discord avatar:", e);
    }

    // Get activity image if available
    let activityAsciiArt = null;
    if (mainActivity?.assets?.large_image) {
      let imageUrl = mainActivity.assets.large_image;

      // Handle different image URL formats
      if (imageUrl.startsWith("mp:external/")) {
        imageUrl = `https://media.discordapp.net/external/${imageUrl.slice(12)}`;
      } else if (imageUrl.startsWith("spotify:")) {
        imageUrl = `https://i.scdn.co/image/${imageUrl.slice(8)}`;
      } else if (!imageUrl.startsWith("http")) {
        imageUrl = `https://cdn.discordapp.com/app-assets/${mainActivity.application_id}/${imageUrl}.png`;
      }

      try {
        activityAsciiArt = await asciify(imageUrl, {
          fit: "box",
          width: 9,
          height: 6,
          color: true,
        });
      } catch (e) {
        console.error("Failed to asciify activity image:", e);
      }
    }

    const getStatusColor = (status) => {
      switch (status) {
        case "online": return "#43b581";
        case "idle": return "#faa61a";
        case "dnd": return "#f04747";
        default: return "#747f8d";
      }
    };

    const presenceInfo = {
      username: discordUser.username,
      displayName: discordUser.global_name || discordUser.username,
      discriminator: discordUser.discriminator,
      avatarUrl,
      avatarAsciiArt,
      status: presence.discord_status,
      statusColor: getStatusColor(presence.discord_status),
      customStatus: customStatus?.state || null,
      customEmoji: customStatus?.emoji?.name || null,
      activity: mainActivity ? {
        name: mainActivity.name,
        type: mainActivity.type,
        details: mainActivity.details || null,
        state: mainActivity.state || null,
        asciiArt: activityAsciiArt,
      } : null,
      spotify: presence.listening_to_spotify ? {
        song: presence.spotify?.song,
        artist: presence.spotify?.artist,
        album: presence.spotify?.album,
      } : null,
    };

    lastPresence = presenceInfo;
    res.json({ presence: presenceInfo, is_online: presence.discord_status !== "offline" });
  } catch (err) {
    console.error("Discord API error:", err);

    if (lastPresence) {
      res.json({ presence: { ...lastPresence, status: "offline" }, is_online: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
