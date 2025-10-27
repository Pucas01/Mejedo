"use client";
import { useState, useEffect } from "react";

export default function ProjectTerminal({ project }) {
  const [typingCmd, setTypingCmd] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  const command = `cd /${project.name}`;

  // Typing animation
useEffect(() => {
  const TOTAL_TIME = 1000; // 2 seconds total
  const start = performance.now();

  let frame;
  const animate = (time) => {
    const progress = Math.min((time - start) / TOTAL_TIME, 1);
    const chars = Math.floor(progress * command.length);

    setTypingCmd(command.slice(0, chars));

    if (progress < 1) {
      frame = requestAnimationFrame(animate);
    } else {
      setDoneTyping(true);
    }
  };

  frame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frame);
}, [command]);

  return (
    <div className="flex-1 min-w-[550px] max-w-[550px] min-h-[410px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col m-2">
      
      {/* Typing intro */}
      {!doneTyping && (
        <div className="p-4 font-jetbrains text-lg flex flex-wrap">
          <span className="text-[#39ff14]">pucas01</span>
          <span className="text-white">@</span>
          <span className="text-[#D73DA3]">PucasDocker</span>
          <span className="text-white">:</span>
          <span className="text-[#FF5555]">~</span>
          <span className="text-white">$</span>
          <span className="text-white">&nbsp;{typingCmd}</span>
          <span className="cursor animate-blink">|</span>
        </div>
      )}

      {/* Project content */}
      {doneTyping && (
        <div className="flex-1 flex flex-col items-center p-4 overflow-auto text-white font-jetbrains">
          {project.image && (
            <img
              src={project.image}
              alt={project.name}
              className="h-[180px] object-cover mb-4 rounded"
            />
          )}
          <h3 className="text-[#39ff14] text-lg font-bold mb-2">{project.name}</h3>
          <p className="text-sm text-gray-300 mb-2">Status: {project.status}</p>
          <p className="text-sm text-center text-gray-300 mb-2">{project.description}</p>
          <p className="text-sm text-gray-300 mb-2">{project.commit}</p>
          {project.link && (
            <a
              href={project.link}
              className="text-white underline-offset-5 hover:underline decoration-[#39ff14] hover:decoration-wavy"
              target="_blank"
            >
              Visit Project
            </a>
          )}
        </div>
      )}
    </div>
  );
}
