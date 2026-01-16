"use client";

import { useState, useEffect } from "react";
import IdolSelector from "./IdolSelector.jsx";
import { getIdol } from "./idolConfig.js";
import AdoContent from "./AdoContent.jsx";
import MikuContent from "./MikuContent.jsx";
import { useTheme } from "../../hooks/useTheme";
import { useAchievements } from "../../hooks/useAchievements.js";

export default function Idols() {
  const [selectedIdol, setSelectedIdol] = useState("ado");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const idol = getIdol(selectedIdol);
  const { setThemeName } = useTheme();
  const { updateStats } = useAchievements();

  // Update theme when idol changes
  useEffect(() => {
    setThemeName(selectedIdol === "miku" ? "miku" : "ado");

    // Track Miku profile view for achievement
    if (selectedIdol === "miku") {
      updateStats("viewedMikuProfile", true);
    }
  }, [selectedIdol, setThemeName, updateStats]);

  const handleIdolChange = (newIdolId) => {
    if (newIdolId === selectedIdol) return;

    setIsTransitioning(true);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setSelectedIdol(newIdolId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-xl min-h-screen text-white justify-start">
      <IdolSelector currentIdol={selectedIdol} onSelect={handleIdolChange} />

      <div
        className={`transition-all duration-500 ease-in-out ${
          isTransitioning
            ? "opacity-0 translate-y-4 scale-[0.98]"
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        {selectedIdol === "ado" && <AdoContent idol={idol} />}
        {selectedIdol === "miku" && <MikuContent idol={idol} />}
      </div>
    </div>
  );
}
