"use client";
import ProjectTerminal from "./ProjectTerminal";
import { projects } from "./projectsData";

export default function Projects() {
  return (
    <div className="flex flex-wrap justify-center p-4">
      {projects.map((proj, idx) => (
        <ProjectTerminal key={idx} project={proj} />
      ))}
    </div>
  );
}
