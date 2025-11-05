import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "shitposts.json");
const DEFAULT_SHITPOSTS = {
  tiktoks: [
    {
      id: "1",
      title: "tiktok",
      url: "/",
      thumbnail: "/projects/kysasa.webp",
      meta: { likes: 0, views: 0 },
    },
  ],
  tweets: [
    {
      id: "1",
      title: "tweets",
      url: "/",
      thumbnail: "/projects/kysasa.webp",
      meta: { likes: 0, retweets: 0 },
    },
  ],
  tenor: [
    {
      id: "1",
      title: "tenor",
      url: "/",
      thumbnail: "/projects/kysasa.webp",
      meta: { shares: 0 },
    },
  ],
  youtube: [
    {
      id: "1",
      title: "Youtube",
      url: "/",
      thumbnail: "/projects/kysasa.webp",
      meta: { views: 0, likes: 0 },
    },
  ],
};

const DEFAULT_META = {
  tiktoks: { likes: 0, views: 0 },
  tweets: { likes: 0, retweets: 0 },
  tenor: { shares: 0 },
  youtube: { views: 0, likes: 0 }
};

// ensure config folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR);
}

// ensure file exists
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_SHITPOSTS, null, 2));
}

const loadData = () => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    // merge to ensure missing categories get filled in
    return { ...DEFAULT_SHITPOSTS, ...parsed };
  } catch (err) {
    console.error("Error reading shitposts.json:", err);
    return DEFAULT_SHITPOSTS;
  }
};

const saveData = (data) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
};

// ✅ GET all shitposts
router.get("/", (req, res) => {
  const data = loadData();
  res.json(data);
});

// ✅ POST: add new shitpost to a specific category
router.post("/:category", (req, res) => {
  const { category } = req.params;
  const data = loadData();

  if (!data[category]) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const newPost = {
    id: req.body.id || Date.now().toString(),
    title: req.body.title || "",
    url: req.body.url || "",
    thumbnail: req.body.thumbnail || "",
    meta: { ...DEFAULT_META[category], ...(req.body.meta || {}) }
  };

  data[category].push(newPost);
  saveData(data);

  res.json({ success: true, post: newPost });
});

// ✅ DELETE: remove post by ID from category
router.delete("/:category/:id", (req, res) => {
  const { category, id } = req.params;
  const data = loadData();

  if (!data[category]) {
    return res.status(400).json({ error: "Invalid category" });
  }

  // Find post to delete
  const postToDelete = data[category].find((p) => p.id === id);
  if (!postToDelete) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Delete associated image if exists and is inside uploads folder
  if (postToDelete.thumbnail && postToDelete.thumbnail.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "../../public", postToDelete.thumbnail);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    }
  }

  // Remove post from data
  data[category] = data[category].filter((p) => p.id !== id);
  saveData(data);

  res.json({ success: true });
});

export default router;
