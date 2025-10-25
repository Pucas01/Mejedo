"use client";
import { useEffect, useRef, useState } from "react";

export default function FutabaOverlay({ show, onClose, imgSrc, audioSrc }) {
  const audioRef = useRef(null);
  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";

      const img = new Image();
      img.src = `${imgSrc}${imgSrc.includes("?") ? "&" : "?"}v=${Date.now()}`;
      img.onload = () => setLoadedSrc(img.src);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      document.body.style.overflow = "auto";
      setLoadedSrc(null);
      if (audioRef.current) audioRef.current.pause();
    }

    return () => {
      document.body.style.overflow = "auto";
      if (audioRef.current) audioRef.current.pause();
    };
  }, [show, imgSrc]);

  useEffect(() => {
    if (loadedSrc && audioRef.current) {
      audioRef.current.play();
      audioRef.current.onended = onClose;
    }
  }, [loadedSrc, onClose]);

  if (!show || !loadedSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
      style={{ pointerEvents: "auto", background: "transparent" }}
    >
      <img
        src={loadedSrc}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ background: "transparent" }}
      />
      <audio ref={audioRef} src={audioSrc} />
    </div>
  );
}
