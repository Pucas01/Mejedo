import express from "express";
import fs from "fs";
import path from "path";
import requireAuth from "../authMiddleware.js"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "projects.json");

const DEFAULT_PROJECT = {
  name: "",
  description: "",
  commit: "",
  status: "",
  image: "",
  link: ""
};

if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify([DEFAULT_PROJECT], null, 2));

const readProjects = () => {
  const data = fs.readFileSync(CONFIG_FILE, "utf-8");
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const writeProjects = (projects) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(projects, null, 2));
};

// GET
router.get("/", (req, res) => {
  try {
    const projects = readProjects();
    // filter out blank template
    const filtered = projects.filter(p => p.name);
    res.json(filtered);
  } catch (err) {
    console.error("Error reading projects.json:", err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

// POST 
router.post("/", requireAuth, (req, res) => {
  try {
    const projects = readProjects();
    const newProject = req.body || DEFAULT_PROJECT;
    projects.push(newProject);
    writeProjects(projects);
    res.json({ success: true, project: newProject });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({ error: "Failed to save project" });
  }
});

// PUT
router.put("/:name", requireAuth, (req, res) => {
  try {
    const projects = readProjects();
    const { name } = req.params;
    const updatedProject = req.body;

    const index = projects.findIndex(p => p.name === name);
    if (index === -1) return res.status(404).json({ error: "Project not found" });

    projects[index] = { ...projects[index], ...updatedProject };
    writeProjects(projects);
    res.json({ success: true, project: projects[index] });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE 
router.delete("/:name", requireAuth, (req, res) => {
  const { name } = req.params;

  const projects = readProjects();
  const projectToDelete = projects.find(p => p.name === name);

  if (!projectToDelete) return res.status(404).json({ error: "Project not found" });

  // Delete uploaded image if it exists
  if (projectToDelete.image && projectToDelete.image.startsWith("/uploads/")) {
    const relativePath = projectToDelete.image.replace(/^\/+/, ""); // remove leading slash
    const filePath = path.join(__dirname, "../../public", relativePath);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted image:", filePath);
      } else {
        console.log("Image file not found:", filePath);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  }

  // Remove project from JSON
  const newProjects = projects.filter(p => p.name !== name);
  writeProjects(newProjects);

  res.json({ success: true });
});

export default router;

