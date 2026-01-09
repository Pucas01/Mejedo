"use client";

import Image from "next/image";

export default function Sticker({
  src,
  alt = "Futaba sticker",
  position = "top-left",
  size = 80,
  rotation = 0,
  offset = { x: -20, y: -20 }
}) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  const style = {
    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      className={`hidden md:block absolute ${positionClasses[position]} pointer-events-none z-10`}
      style={style}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="drop-shadow-lg"
        style={{
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'
        }}
        draggable={false}
      />
    </div>
  );
}
