import express from "express";
import { Hoyolab, ZenlessZoneZero } from "node-hoyolab";
import fs from "fs";
import path from "path";
import requireAuth from "../../authMiddleware.js";

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "config", "hoyolab.json");
const CONFIG_DIR = path.join(process.cwd(), "config");

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ ltoken_v2: "", ltuid_v2: "" }, null, 2));
}

// Read/write helpers
const readCookies = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const writeCookies = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Get cookie string from stored data
const getCookieString = () => {
  const cookies = readCookies();
  if (!cookies.ltoken_v2 || !cookies.ltuid_v2) return null;
  return `ltoken_v2=${cookies.ltoken_v2}; ltuid_v2=${cookies.ltuid_v2}`;
};

// GET /api/hoyolab/zzz - Fetch ZZZ data
router.get("/zzz", async (req, res) => {
  try {
    const cookieString = getCookieString();
    if (!cookieString) {
      return res.status(401).json({
        error: "HoYoLab cookie not configured",
        message: "Please set your HoYoLab cookie first using POST /api/hoyolab/cookie"
      });
    }

    const client = new Hoyolab({
      cookie: cookieString,
    });

    console.log("Fetching ZZZ game records...");

    // Get all game records
    const gameRecords = await client.gameRecordCard();
    console.log("Game records response:", JSON.stringify(gameRecords, null, 2));

    // Filter for ZZZ (game_id: 8)
    const zzzData = Array.isArray(gameRecords)
      ? gameRecords.find(game => game.game_id === 8)
      : gameRecords;

    if (!zzzData) {
      return res.status(404).json({
        error: "No Zenless Zone Zero data found",
        message: "Make sure you have a ZZZ account linked to your HoYoLab account"
      });
    }

    res.json({
      success: true,
      data: zzzData,
    });
  } catch (err) {
    console.error("HoYoLab API Error:", err);
    res.status(500).json({
      error: err.message,
      hint: "Cookie may be expired. Please update your cookie."
    });
  }
});


// POST /api/hoyolab/cookie - Set HoYoLab cookie (Admin only)
router.post("/cookie", requireAuth, express.json(), (req, res) => {
  try {
    const { ltoken_v2, ltuid_v2 } = req.body;

    if (!ltoken_v2 || !ltuid_v2) {
      return res.status(400).json({
        error: "Both ltoken_v2 and ltuid_v2 are required"
      });
    }

    // Save to JSON file
    writeCookies({ ltoken_v2, ltuid_v2 });

    res.json({
      success: true,
      message: "Cookies saved successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hoyolab/status - Check if cookie is configured
router.get("/status", (req, res) => {
  const cookieString = getCookieString();
  res.json({
    configured: !!cookieString,
    message: cookieString ? "Cookies are set" : "Cookies not configured"
  });
});

// GET /api/hoyolab/debug - Debug endpoint to test connection
router.get("/debug", async (req, res) => {
  try {
    const cookieString = getCookieString();
    if (!cookieString) {
      return res.status(401).json({
        error: "HoYoLab cookie not configured"
      });
    }

    const client = new Hoyolab({
      cookie: cookieString,
    });

    // Try to get user's game list
    const gamesList = await client.gameRecordCard();
    console.log("Games list:", JSON.stringify(gamesList, null, 2));

    res.json({
      success: true,
      message: "Connection test successful",
      games: gamesList
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

export default router;
