import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../authMiddleware.js";

const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "blogposts.json");

if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, "[]");

// Helpers
const readPosts = () => JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
const writePosts = (data) => fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));

router.get("/", (req, res) => {
  res.json(readPosts());
});

router.post("/", requireAuth, (req, res) => {
  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    title: req.body.title || "Untitled Post",
    body: req.body.body || "",
    images: req.body.images || [], // ✅ Multiple images supported
    publishDate: req.body.publishDate || new Date().toISOString(),
    readTime: req.body.readTime || "2 min",
  };
  posts.push(newPost);
  writePosts(posts);
  res.json(newPost);
});

router.put("/:id", requireAuth, (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Post not found" });

  posts[index] = { ...posts[index], ...req.body };
  writePosts(posts);
  res.json(posts[index]);
});

router.delete("/:id", requireAuth, (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (Array.isArray(post.images)) {
    post.images.forEach((img) => {
      if (img.startsWith("/uploads/")) {
        const imgPath = path.join(process.cwd(), "..", "public", img);
        if (fs.existsSync(imgPath)) {
          try {
            fs.unlinkSync(imgPath);
            console.log("Deleted image:", imgPath);
          } catch (err) {
            console.error("Failed to delete image:", imgPath, err);
          }
        }
      }
    });
  }

  const filtered = posts.filter((p) => p.id !== req.params.id);
  writePosts(filtered);
  res.json({ success: true });
});

export default router;
