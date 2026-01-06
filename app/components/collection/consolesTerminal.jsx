"use client";

import Image from "next/image";
import Sticker from "../stickers/Sticker";

export default function ConsolesTerminal({ consoleData }) {
  // Randomly pick a sticker for variety
  const stickers = [
    { src: "/stickers/futaba-sitting.png", rotation: 8 },
    { src: "/stickers/futaba-kneeling.png", rotation: -12 },
    { src: "/stickers/futaba-jacket.png", rotation: 10 },
  ];
  const stickerIndex = Math.abs(consoleData.name.charCodeAt(0)) % stickers.length;
  const selectedSticker = stickers[stickerIndex];

  return (
    <div className="bg-[#121217] border-2 border-[#39ff14] p-4 w-60 flex flex-col items-center cursor-pointer relative">
      <Sticker
        src={selectedSticker.src}
        position="top-right"
        size={60}
        rotation={selectedSticker.rotation}
        offset={{ x: 15, y: -15 }}
      />
      {consoleData.image && (
        <div className="w-full mb-2 relative">
          <Image
            src={consoleData.image}
            alt={consoleData.name}
            width={240} 
            height={160} 
            className="border-2 border-[#39ff14] object-contain"
          />
        </div>
      )}
      <h2 className="font-bold text-lg text-center">{consoleData.name}</h2>
      <p className="text-gray-400 text-sm text-center">{consoleData.manufacturer}</p>
      <p className="text-gray-500 text-xs mt-1">{consoleData.releaseYear}</p>
    </div>
  );
}
