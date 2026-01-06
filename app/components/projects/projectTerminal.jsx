"use client";
import { useState, useEffect } from "react";
import Sticker from "../stickers/Sticker";

export default function ProjectTerminal({ project }) {
  const [typingCmd, setTypingCmd] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  const command = `cd /${project.name}`;

  // Pick a different sticker for each project based on project name
  const stickers = [
    { src: "/stickers/futaba-sitting.png", rotation: 8, position: "bottom-right" },
    { src: "/stickers/futaba-headphones.png", rotation: -10, position: "top-left" },
    { src: "/stickers/futaba-keyboard.png", rotation: 12, position: "top-right" },
    { src: "/stickers/futaba-happy.png", rotation: -8, position: "bottom-left" },
    { src: "/stickers/futaba-peace.png", rotation: 15, position: "bottom-right" },
    { src: "/stickers/futaba-jacket.png", rotation: -12, position: "top-right" },
    { src: "/stickers/futaba-kneeling.png", rotation: 10, position: "bottom-left" },
  ];
  const stickerIndex = Math.abs(project.name.charCodeAt(0) + project.name.length) % stickers.length;
  const selectedSticker = stickers[stickerIndex];

  useEffect(() => {
    const TOTAL_TIME = 1000;
    const start = performance.now();

    let frame;
    const animate = (time) => {
      const progress = Math.min((time - start) / TOTAL_TIME, 1);
      const chars = Math.floor(progress * command.length);
      setTypingCmd(command.slice(0, chars));

      if (progress < 1) frame = requestAnimationFrame(animate);
      else setDoneTyping(true);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [command]);

  return (
    <div className="flex-1 min-w-[550px] max-w-[550px] min-h-[410px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col m-2 relative">
      <Sticker
        src={selectedSticker.src}
        position={selectedSticker.position}
        size={65}
        rotation={selectedSticker.rotation}
        offset={{ x: 18, y: 18 }}
      />
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

      {doneTyping && (
        <div className="flex-1 flex flex-col items-center p-4 overflow-auto text-white font-jetbrains">
          {project.image && (
            <img
              src={project.image}
              alt={project.name}
              className="h-[180px] w-auto object-contain mb-4 rounded select-none"
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
              rel="noopener noreferrer"
            >
              Visit Project
            </a>
          )}
        </div>
      )}
    </div>
  );
}
