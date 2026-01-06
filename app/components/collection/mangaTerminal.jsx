"use client";

import Image from "next/image";
import Sticker from "../stickers/Sticker";

export default function MangaTerminal({ mangaData }) {
  // Randomly pick a sticker for variety based on manga title
  const stickers = [
    { src: "/stickers/futaba-happy.png", rotation: -10 },
    { src: "/stickers/futaba-peace.png", rotation: 12 },
    { src: "/stickers/futaba-shy.png", rotation: -8 },
  ];
  const stickerIndex = Math.abs(mangaData.title.charCodeAt(0)) % stickers.length;
  const selectedSticker = stickers[stickerIndex];

  return (
    <div className="bg-[#121217] border-2 border-[#39ff14] p-4 w-48 flex flex-col items-center cursor-pointer relative">
      <Sticker
        src={selectedSticker.src}
        position="bottom-left"
        size={55}
        rotation={selectedSticker.rotation}
        offset={{ x: -12, y: 12 }}
      />
      {mangaData.cover && (
        <div className="w-full mb-2 relative">
          <Image
            src={mangaData.cover}
            alt={mangaData.title}
            width={180} 
            height={240}
            className="border-2 border-[#39ff14] object-contain"
          />
        </div>
      )}
      <h2 className="font-bold text-lg text-center">{mangaData.title}</h2>
      <p className="text-gray-400 text-sm text-center">{mangaData.author}</p>
      <p className="text-gray-500 text-xs mt-1">{mangaData.startYear}</p>
    </div>
  );
}
