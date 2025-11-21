"use client";

import Image from "next/image";

export default function ConsolesTerminal({ consoleData }) {
  return (
    <div className="bg-[#121217] border-2 border-[#39ff14] p-4 w-60 flex flex-col items-center cursor-pointer">
      {consoleData.image && (
        <div className="w-full mb-2 relative">
          <Image
            src={consoleData.image}
            alt={consoleData.name}
            width={240} // fixed width
            height={160} // adjust height to match console aspect
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
