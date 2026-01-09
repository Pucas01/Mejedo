"use client";
import { useState, useEffect } from "react";
import ProjectTerminal from "./projectTerminal.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import Button from "../ui/Button";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const { isAdmin } = useCurrentUser();

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.filter(p => p.name));
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async () => {
    const newProject = { name: "New Project", description: "", commit: "", status: "In progress", image: "", link: "" };
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
        credentials: "include"
      });
      fetchProjects();
    } catch (err) {
      console.error("Failed to add project:", err);
    }
  };

const handleDeleteProject = async (project) => {
  if (!confirm(`Are you sure you want to delete ${project.name}?`)) return;

  try {
    await fetch(`/api/projects/${encodeURIComponent(project.name)}`, {
      method: "DELETE",
      credentials: "include"
    });
    fetchProjects();
  } catch (err) {
    console.error("Failed to delete project:", err);
  }
};
  const handleSaveProject = async (updatedProject, originalName) => {
    try {
      await fetch(`/api/projects/${encodeURIComponent(originalName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
        credentials: "include"
      });
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      return data.url; // expects { url: "/uploads/filename.png" }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed");
      return "";
    }
  };

  if (loading) return <div className="text-[#39ff14] text-center p-8">Loading projects...</div>;

  return (
    <div className="flex flex-col items-center gap-4">
      {isAdmin && (
        <Button
          variant="primary"
          onClick={handleAddProject}
        >
          Add Project
        </Button>
      )}

      <div className="flex flex-wrap justify-center items-start gap-4 p-2">
        {projects.map((project) => (
          <div key={project.name} className="relative">
            <ProjectTerminal project={project} />

            {isAdmin && (
              <div className="absolute pt-12 pr-4 top-2 right-2 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEditingProject({ ...project, originalName: project.name })}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteProject(project)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 overflow-auto p-4">
          <div className="bg-[#121217] border-2 border-[#39ff14] p-6 rounded shadow-lg w-[400px] flex flex-col gap-2">
            <h2 className="text-white text-lg font-bold mb-2">Edit Project</h2>

            <input type="text" placeholder="Name" value={editingProject.name} onChange={e => setEditingProject({ ...editingProject, name: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1" />
            <textarea placeholder="Description" value={editingProject.description} onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1 resize-none" />
            <input type="text" placeholder="Status" value={editingProject.status} onChange={e => setEditingProject({ ...editingProject, status: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1" />
            <input type="text" placeholder="Commit" value={editingProject.commit} onChange={e => setEditingProject({ ...editingProject, commit: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1" />
            <input type="text" placeholder="Link" value={editingProject.link} onChange={e => setEditingProject({ ...editingProject, link: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1" />

            {/* Custom Image URL */}
            <label className="text-sm text-gray-400 mt-2">Custom Image URL:</label>
            <input type="text" placeholder="/path/to/image.png" value={editingProject.image || ""} onChange={e => setEditingProject({ ...editingProject, image: e.target.value })} className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1 w-full" />

            {/* Upload Image */}
            <label className="text-sm text-gray-400 mt-2">Upload Image:</label>
            <input type="file" accept="image/*" onChange={async e => {
              const file = e.target.files[0];
              if (file) {
                const url = await handleImageUpload(file);
                setEditingProject({ ...editingProject, image: url });
              }
            }} className="text-gray-300 text-sm" />

            {editingProject.image && (
              <img src={editingProject.image} alt="Project" className="w-full max-h-60 object-contain rounded border border-[#39ff14] mt-2" />
            )}

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="default" onClick={() => setEditingProject(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => handleSaveProject(editingProject, editingProject.originalName)}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
