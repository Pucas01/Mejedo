"use client";
import { useEffect, useState, useRef } from "react";
import { useAchievements } from "../../hooks/useAchievements";
import { useTheme } from "../../hooks/useTheme";

export default function AchievementToast() {
  const { pendingAchievement, clearPendingAchievement } = useAchievements();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (pendingAchievement) {
      setCurrentAchievement(pendingAchievement);
      setVisible(true);

      // Play Steam achievement sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      }

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          clearPendingAchievement();
          setCurrentAchievement(null);
        }, 300);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [pendingAchievement, clearPendingAchievement]);

  return (
    <>
      <audio ref={audioRef} src="/sounds/steam-achievement.mp3" preload="auto" />
      {currentAchievement && (
        <div
          className={`fixed top-4 right-4 z-[9998] transition-all duration-300 ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
          }`}
        >
          <div className={`bg-[#121217] border-2 ${theme.colors.border} shadow-lg p-4 min-w-[280px]`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentAchievement.icon}</div>
              <div className="flex-1">
                <div className={`${theme.colors.text} text-xs uppercase tracking-wider mb-1`}>
                  Achievement Unlocked!
                </div>
                <div className="text-white font-bold">{currentAchievement.name}</div>
                <div className="text-gray-400 text-sm">{currentAchievement.description}</div>
              </div>
            </div>
            <div className="mt-2 h-1 overflow-hidden" style={{ backgroundColor: `${theme.colors.primary}33` }}>
              <div
                className={`h-full ${theme.colors.bg} animate-shrink-bar`}
                style={{ animationDuration: "4s" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
