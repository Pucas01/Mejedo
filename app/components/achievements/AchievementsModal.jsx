"use client";
import { useState, useEffect } from "react";
import { useAchievements, ACHIEVEMENTS } from "../../hooks/useAchievements";

export default function AchievementsModal({ show, onClose }) {
  const { unlockedAchievements, unlockedCount, totalCount } = useAchievements();

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
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#090909] border-b-2 border-[#39ff14]">
          <div className="font-mono">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-gray-400 ml-2">cat trophies.txt</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="text-gray-500 cursor-pointer hover:text-[#39ff14] font-mono transition-colors"
          >
            [X]
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-[#090909]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-[#39ff14]">{unlockedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-[#39ff14]/20 overflow-hidden">
            <div
              className="h-full bg-[#39ff14] transition-all duration-500"
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
              className="flex items-center gap-4 p-3 border border-[#39ff14] bg-[#39ff14]/5"
            >
              <div className="text-2xl w-10 text-center">{achievement.icon}</div>
              <div className="flex-1">
                <div className="text-[#39ff14] font-bold">{achievement.name}</div>
                <div className="text-gray-400 text-sm">{achievement.description}</div>
              </div>
              <div className="text-[#39ff14]"></div>
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
        <div className="px-6 py-3 bg-[#090909] border-t border-[#39ff14]/30 text-center text-gray-500 text-sm">
          Dude lock the fuck in and get those achievements!
        </div>
      </div>
    </div>
  );
}
