"use client";
import { useState, useEffect } from "react";
import { useAchievements, ACHIEVEMENTS } from "../../hooks/useAchievements";
import WindowDecoration from "../window/WindowDecoration.jsx";
import { useTheme } from '../../hooks/useTheme';

export default function AchievementsModal({ show, onClose }) {
  const { unlockedAchievements, unlockedCount, totalCount } = useAchievements();
  const { theme } = useTheme();

  if (!show) return null;

  const handleClose = () => {
    onClose();
  };

  const achievementList = Object.values(ACHIEVEMENTS);
  const unlockedList = achievementList.filter((a) => unlockedAchievements[a.id]);
  const lockedList = achievementList.filter((a) => !unlockedAchievements[a.id]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={`bg-[#121217] border-2 ${theme.colors.border} shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp`}>
        {/* Window Decoration */}
        <WindowDecoration title="Achievements - trophies.txt" onClose={handleClose} theme={theme.name}/>

        {/* Progress */}
        <div className="px-6 py-3 bg-[#090909]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className={theme.colors.text}>{unlockedCount}/{totalCount}</span>
          </div>
          <div className={`h-2 ${theme.colors.bg}/20 overflow-hidden`}>
            <div
              className={`h-full ${theme.colors.bg} transition-all duration-500`}
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievements list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* Unlocked */}
          {unlockedList.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-4 p-3 border ${theme.colors.border} ${theme.colors.bg}/10`}
            >
              <div className="text-2xl w-10 text-center">{achievement.icon}</div>
              <div className="flex-1">
                <div className={`${theme.colors.text} font-bold`}>{achievement.name}</div>
                <div className="text-gray-400 text-sm">{achievement.description}</div>
              </div>
              <div className={theme.colors.text}></div>
            </div>
          ))}

          {/* Locked */}
          {lockedList.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-4 p-3 border border-gray-700 bg-gray-900/30 opacity-60"
            >
              <div className="text-2xl w-10 text-center text-gray-600">
                {achievement.hidden ? "?" : achievement.icon}
              </div>
              <div className="flex-1">
                <div className="text-gray-500 font-bold">
                  {achievement.hidden ? "???" : achievement.name}
                </div>
                <div className="text-gray-600 text-sm">
                  {achievement.hidden ? "Hidden achievement" : achievement.description}
                </div>
              </div>
              <div className="text-gray-600"></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 bg-[#090909] border-t ${theme.colors.border}/30 text-center text-gray-500 text-sm`}>
          Dude lock the fuck in and get those achievements!
        </div>
      </div>
    </div>
  );
}
