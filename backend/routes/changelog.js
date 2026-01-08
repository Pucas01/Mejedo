import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const changelogPath = path.join(__dirname, "../config/changelog.json");

router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(changelogPath)) {
      return res.json([]);
    }
    const data = fs.readFileSync(changelogPath, "utf8");
    const changelog = JSON.parse(data);
    res.json(changelog);
  } catch (error) {
    console.error("Error reading changelog:", error);
    res.status(500).json({ error: "Failed to load changelog" });
  }
});

router.post("/", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const newVersion = req.body;

    if (!newVersion.version || !newVersion.date) {
      return res.status(400).json({ error: "Version and date are required" });
    }

    let changelog = [];
    if (fs.existsSync(changelogPath)) {
      const data = fs.readFileSync(changelogPath, "utf8");
      changelog = JSON.parse(data);
    }

    const existingIndex = changelog.findIndex(v => v.version === newVersion.version);

    if (existingIndex >= 0) {
      changelog[existingIndex] = newVersion;
    } else {
      changelog.unshift(newVersion);
    }

    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
    res.json({ success: true, changelog });
  } catch (error) {
    console.error("Error saving changelog:", error);
    res.status(500).json({ error: "Failed to save changelog" });
  }
});

router.delete("/:version", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const { version } = req.params;

    if (!fs.existsSync(changelogPath)) {
      return res.status(404).json({ error: "Changelog not found" });
    }

    const data = fs.readFileSync(changelogPath, "utf8");
    let changelog = JSON.parse(data);

    changelog = changelog.filter(v => v.version !== version);

    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
    res.json({ success: true, changelog });
  } catch (error) {
    console.error("Error deleting changelog entry:", error);
    res.status(500).json({ error: "Failed to delete changelog entry" });
  }
});

export default router;
