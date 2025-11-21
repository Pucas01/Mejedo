"use client";

import Image from "next/image";

export default function MangaTerminal({ mangaData }) {
  return (
    <div className="bg-[#121217] border-2 border-[#39ff14] p-4 w-48 flex flex-col items-center cursor-pointer">
      {mangaData.cover && (
        <div className="w-full h-full mb-2 border border-[#39ff14] relative aspect-[3/4]">
          <Image src={mangaData.cover} alt={mangaData.title} fill className="object-contain" />
        </div>
      )}
      <h2 className="font-bold text-lg text-center">{mangaData.title}</h2>
      <p className="text-gray-400 text-sm text-center">{mangaData.author}</p>
      <p className="text-gray-500 text-xs mt-1">{mangaData.startYear}</p>
    </div>
  );
}
