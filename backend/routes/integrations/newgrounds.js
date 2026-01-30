import express from "express";
import * as cheerio from "cheerio";
import https from "https";
import fs from "fs";
import path from "path";
import requireAuth from "../../authMiddleware.js";

const router = express.Router();
const SCORES_FILE = path.join(process.cwd(), "config", "fnf-scores.json");

const FNF_GAME_ID = "51023";
const SCOREBOARD_BASE_URL = "https://www.newgrounds.com/ngio/api_items";

let scoreboardCache = null;
let cacheExpiry = 0;

function fetchWithSSLBypass(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getScoreboards() {
  const now = Date.now();
  if (scoreboardCache && now < cacheExpiry) {
    return scoreboardCache;
  }

  try {
    const url = `${SCOREBOARD_BASE_URL}/${FNF_GAME_ID}/show/scores`;
    const html = await fetchWithSSLBypass(url);
    const $ = cheerio.load(html);

    const scoreboards = [];
    $("#scoreboard_select option").each((i, elem) => {
      const value = $(elem).attr("value");
      const name = $(elem).text().trim();
      if (value && name) {
        const match = value.match(/\/scores\/(\d+)\//);
        const id = match ? match[1] : value;
        scoreboards.push({ id, name });
      }
    });

    scoreboardCache = scoreboards;
    cacheExpiry = now + 3600000;
    return scoreboards;
  } catch (error) {
    console.error("Error fetching FNF scoreboards:", error);
    return [];
  }
}

async function getUserScoreForScoreboard(scoreboardId, username) {
  try {
    const url = `https://www.newgrounds.com/ngio/scores/${scoreboardId}/lookup/user?username=${username.toLowerCase()}`;
    const html = await fetchWithSSLBypass(url);
    const $ = cheerio.load(html);

    let userScore = null;
    let userRank = null;
    let totalScores = null;

    $("li.padded.flexbox").each((i, elem) => {
      const $li = $(elem);
      const text = $li.text();

      if (text.includes("All-Time:")) {
        const rankText = $li.find("strong").text().trim();
        const rankMatch = rankText.match(/#([\d,]+)/);
        if (rankMatch) {
          userRank = parseInt(rankMatch[1].replace(/,/g, ""));
        }

        const scoreDivs = $li.find("div");
        if (scoreDivs.length >= 3) {
          const scoreText = $(scoreDivs[2]).text().trim();
          userScore = parseInt(scoreText.replace(/,/g, ""));
        }
      }
    });

    return {
      userScore,
      userRank,
      totalScores,
    };
  } catch (error) {
    console.error(`Error fetching user score for scoreboard ${scoreboardId}:`, error);
    return { userScore: null, userRank: null, totalScores: null };
  }
}

async function getScoreboardData(scoreboardId, username = null, filter = 'all-time') {
  try {
    if (username) {
      return await getUserScoreForScoreboard(scoreboardId, username);
    }

    const url = `https://www.newgrounds.com/ngio/scores/${scoreboardId}/filter/${filter}/users/all`;
    const html = await fetchWithSSLBypass(url);
    const $ = cheerio.load(html);

    const scores = [];

    $("table tr").each((i, row) => {
      const $row = $(row);

      if ($row.find("th").length > 0) return;

      const rankText = $row.find("td:nth-child(1)").text().trim();
      const user = $row.find("td:nth-child(2) a[data-field='user']").text().trim();
      const scoreText = $row.find("td[data-field='score']").text().trim();

      const rank = parseInt(rankText.replace(/\./g, ""));
      const score = parseInt(scoreText.replace(/,/g, ""));

      if (!isNaN(rank) && user && !isNaN(score)) {
        const scoreData = { rank, username: user, score };
        scores.push(scoreData);
      }
    });

    return {
      scores,
      totalScores: scores.length,
    };
  } catch (error) {
    console.error(`Error fetching scoreboard ${scoreboardId}:`, error);
    return { scores: [], userScore: null, userRank: null, totalScores: 0 };
  }
}

router.get("/fnf/scoreboards", async (req, res) => {
  try {
    const scoreboards = await getScoreboards();
    res.json({ scoreboards });
  } catch (error) {
    console.error("Error in /fnf/scoreboards:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/fnf/scores/:scoreboardId", async (req, res) => {
  try {
    const { scoreboardId } = req.params;
    const { username } = req.query;

    const data = await getScoreboardData(scoreboardId, username);
    res.json(data);
  } catch (error) {
    console.error(`Error in /fnf/scores/${req.params.scoreboardId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

function loadStoredScores() {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const data = fs.readFileSync(SCORES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading stored scores:", error);
  }
  return { username: null, scores: [], lastUpdated: null };
}

function saveScores(username, scores) {
  const data = {
    username,
    scores,
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
  return data;
}

async function scrapeAllUserScores(username) {
  const scoreboards = await getScoreboards();

  const filteredScoreboards = scoreboards.filter(sb => {
    const name = sb.name.toLowerCase();
    return !name.includes('week');
  });

  console.log(`[Newgrounds] Checking ${filteredScoreboards.length} scoreboards (filtered out week scoreboards)...`);

  const userScores = [];

  for (const sb of filteredScoreboards) {
    try {
      const data = await getScoreboardData(sb.id, username, 'all-time');
      if (data.userScore && data.userRank) {
        userScores.push({
          scoreboard: sb.name,
          scoreboardId: sb.id,
          score: data.userScore,
          rank: data.userRank,
          totalScores: data.totalScores,
        });
        console.log(`[Newgrounds] ${sb.name}: Rank #${data.userRank}, Score: ${data.userScore}`);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`[Newgrounds] Error fetching ${sb.name}:`, error.message);
    }
  }

  userScores.sort((a, b) => a.rank - b.rank);

  return userScores;
}

router.get("/fnf/my-scores", async (req, res) => {
  try {
    const data = loadStoredScores();
    res.json(data);
  } catch (error) {
    console.error("Error in /fnf/my-scores:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/fnf/refresh-scores", requireAuth, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    console.log(`[Newgrounds] Scraping scores for ${username}...`);
    const scores = await scrapeAllUserScores(username);
    const data = saveScores(username, scores);
    console.log(`[Newgrounds] Found ${scores.length} scores for ${username}`);

    res.json(data);
  } catch (error) {
    console.error("Error in /fnf/refresh-scores:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/fnf/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const scoreboards = await getScoreboards();

    const promises = scoreboards.map(async (sb) => {
      const data = await getScoreboardData(sb.id, username, 'all-time');
      if (data.userScore) {
        return {
          scoreboard: sb.name,
          scoreboardId: sb.id,
          score: data.userScore,
          rank: data.userRank,
          totalScores: data.totalScores,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    const userScores = results.filter((r) => r !== null);

    res.json({
      username,
      scores: userScores,
      totalScoreboards: userScores.length,
    });
  } catch (error) {
    console.error(`Error in /fnf/user/${req.params.username}:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
