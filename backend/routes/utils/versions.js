import express from "express";

const router = express.Router();

// Cache versions for 1 hour to avoid rate limiting
let cachedVersions = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchLatestRelease(owner, repo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Mejedo-Portfolio",
        },
      }
    );

    if (!response.ok) {
      // Try tags if no releases
      const tagsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/tags`,
        {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Mejedo-Portfolio",
          },
        }
      );

      if (tagsResponse.ok) {
        const tags = await tagsResponse.json();
        if (tags.length > 0) {
          return tags[0].name.replace(/^v/, "");
        }
      }
      return null;
    }

    const data = await response.json();
    return data.tag_name?.replace(/^v/, "") || null;
  } catch (err) {
    console.error(`Failed to fetch ${owner}/${repo}:`, err.message);
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    // Return cached versions if still valid
    if (cachedVersions && Date.now() - cacheTime < CACHE_DURATION) {
      return res.json(cachedVersions);
    }

    // Fetch all versions in parallel
    const [kitty, fish, hyprland] = await Promise.all([
      fetchLatestRelease("kovidgoyal", "kitty"),
      fetchLatestRelease("fish-shell", "fish-shell"),
      fetchLatestRelease("hyprwm", "Hyprland"),
    ]);

    cachedVersions = {
      kitty: kitty || "0.44",
      fish: fish || "4.2.1",
      hyprland: hyprland || "0.53",
      fetchedAt: new Date().toISOString(),
    };
    cacheTime = Date.now();

    res.json(cachedVersions);
  } catch (err) {
    console.error("Versions fetch error:", err);

    // Return fallback versions on error
    res.json({
      kitty: "0.44",
      fish: "4.2.1",
      hyprland: "0.53",
      fetchedAt: null,
      error: "Failed to fetch latest versions",
    });
  }
});

export default router;
