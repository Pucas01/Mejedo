"use client";
import { useState, useEffect } from "react";
import ProjectTerminal from "./projectTerminal.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null); // currently editing project
  const { isAdmin } = useCurrentUser();

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();

      const uniqueProjects = data
        .filter((p) => p.name)
        .filter((p, i, self) => i === self.findIndex((proj) => proj.name === p.name));

      setProjects(uniqueProjects);
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
    const newProject = {
      name: "New Project",
      description: "",
      commit: "",
      status: "In progress",
      image: "",
      link: ""
    };

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject)
      });
      fetchProjects();
    } catch (err) {
      console.error("Failed to add project:", err);
    }
  };

  const handleDeleteProject = async (name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await fetch(`/api/projects/${encodeURIComponent(name)}`, {
        method: "DELETE"
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
        body: JSON.stringify(updatedProject)
      });
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  if (loading) {
    return <div className="text-[#39ff14] text-center font-jetbrains p-8">Loading projects...</div>;
  }

  if (!projects.length) {
    return <div className="text-gray-400 text-center font-jetbrains p-8">No projects found.</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {isAdmin && (
        <button
          className="px-2 py-2  bg-[#1f8f0c] hover:bg-[#22a50b] cursor-pointer text-white"
          onClick={handleAddProject}
        >
          Add Project
        </button>
      )}

      <div className="flex flex-wrap justify-center items-start gap-4 p-4">
        {projects.map((project) => (
          <div key={project.name} className="relative">
            <ProjectTerminal project={project} />

            {isAdmin && (
              <div className="absolute p-2 top-2 right-2 flex gap-2">
                <button
                  className="px-2 py-1  bg-[#1f8f0c] hover:bg-[#22a50b] cursor-pointer text-white"
                  onClick={() => setEditingProject(project)}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-2  bg-[#1f8f0c] hover:bg-[#22a50b] cursor-pointer text-white"
                  onClick={() => handleDeleteProject(project.name)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-[#121217] border-2 border-[#39ff14] p-6 rounded shadow-lg w-[400px] flex flex-col gap-2">
            <h2 className="text-white text-lg font-bold mb-2">Edit Project</h2>

            <input
              type="text"
              placeholder="Name"
              value={editingProject.name}
              onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <textarea
              placeholder="Description"
              value={editingProject.description}
              onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1 resize-none"
            />

            <input
              type="text"
              placeholder="Status"
              value={editingProject.status}
              onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <input
              type="text"
              placeholder="commit"
              value={editingProject.commit}
              onChange={(e) => setEditingProject({ ...editingProject, commit: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <input
              type="text"
              placeholder="Link"
              value={editingProject.link}
              onChange={(e) => setEditingProject({ ...editingProject, link: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <input
              type="text"
              placeholder="Image URL"
              value={editingProject.image}
              onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                className="bg-gray-500 text-black px-4 py-1 rounded hover:bg-gray-400 font-jetbrains"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </button>
              <button
                className="bg-[#39ff14] text-black px-4 py-1 rounded hover:bg-[#32cc12] font-jetbrains"
                onClick={() => handleSaveProject(editingProject, editingProject.name)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
