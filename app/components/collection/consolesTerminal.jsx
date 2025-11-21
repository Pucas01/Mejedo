"use client";

import Image from "next/image";

export default function ConsolesTerminal({ consoleData }) {
  return (
    <div className="bg-[#121217] border-2 border-[#39ff14] p-4 w-48 flex flex-col items-center cursor-pointer">
      {consoleData.image && (
        <div className="w-full h-full mb-2 border border-[#39ff14] relative aspect-square">
          <Image
            src={consoleData.image}
            alt={consoleData.name}
            fill
            className="object-contain"
          />
        </div>
      )}
      <h2 className="font-bold text-lg text-center">{consoleData.name}</h2>
      <p className="text-gray-400 text-sm text-center">{consoleData.manufacturer}</p>
      <p className="text-gray-500 text-xs mt-1">{consoleData.releaseYear}</p>
    </div>
  );
}
