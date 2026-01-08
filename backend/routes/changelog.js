import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const changelogPath = path.join(CONFIG_DIR, "changelog.json");

// GET changelog entries
router.get("/", (req, res) => {
  try {
    console.log("Changelog path:", changelogPath);
    console.log("File exists:", fs.existsSync(changelogPath));

    if (!fs.existsSync(changelogPath)) {
      console.log("Changelog file not found, returning empty array");
      return res.json([]);
    }

    const data = fs.readFileSync(changelogPath, "utf8");
    console.log("Raw data:", data);
    const changelog = JSON.parse(data);
    console.log("Parsed changelog:", changelog);
    res.json(changelog);
  } catch (error) {
    console.error("Error reading changelog:", error);
    res.status(500).json({ error: "Failed to load changelog", details: error.message });
  }
});

// POST - Add or update a changelog entry (admin only)
router.post("/", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const newVersion = req.body;

    // Validate required fields
    if (!newVersion.version || !newVersion.date) {
      return res.status(400).json({ error: "Version and date are required" });
    }

    // Ensure the config directory exists
    const configDir = path.dirname(changelogPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Read existing changelog
    let changelog = [];
    if (fs.existsSync(changelogPath)) {
      const data = fs.readFileSync(changelogPath, "utf8");
      changelog = JSON.parse(data);
    }

    // Find if version already exists
    const existingIndex = changelog.findIndex(v => v.version === newVersion.version);

    if (existingIndex >= 0) {
      // Update existing version
      changelog[existingIndex] = newVersion;
    } else {
      // Add new version at the beginning
      changelog.unshift(newVersion);
    }

    // Write back to file
    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
    res.json({ success: true, changelog });
  } catch (error) {
    console.error("Error saving changelog:", error);
    res.status(500).json({ error: "Failed to save changelog" });
  }
});

// DELETE - Remove a changelog entry (admin only)
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

    // Filter out the version to delete
    changelog = changelog.filter(v => v.version !== version);

    // Write back to file
    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
    res.json({ success: true, changelog });
  } catch (error) {
    console.error("Error deleting changelog entry:", error);
    res.status(500).json({ error: "Failed to delete changelog entry" });
  }
});

export default router;
