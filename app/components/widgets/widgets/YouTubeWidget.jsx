"use client";
import { useRef, useEffect } from 'react';
import { useAchievements } from '../../../hooks/useAchievements';

export default function YouTubeWidget() {
  const videoRef = useRef(null);
  const { updateStats } = useAchievements();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
    }
    updateStats("openedTetoWidget", true);
  }, [updateStats]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        loop
        autoPlay
        muted
        playsInline
        src="/videos/teto-mix.webm"
        style={{
          objectFit: 'cover',
          objectPosition: 'center bottom'
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
