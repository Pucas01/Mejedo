"use client";

import { getIdolList } from "./idolConfig";
import { useTheme } from "../../hooks/useTheme";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";

export default function IdolSelector({ currentIdol, onSelect }) {
  const idols = getIdolList();
  const { theme } = useTheme();

  return (
    <div className="bg-[#121217] border-2 shadow-lg relative flex flex-col overflow-hidden" style={{ borderColor: theme.colors.primary }}>
      <WindowDecoration title="~/idols - Select Profile" showControls={true} theme={theme.name} />
      <div className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-mono" style={{ color: theme.colors.primary }}>
            $ cd ~/idols && ls -la
          </span>
          <div className="flex gap-2 flex-wrap flex-1 justify-end">
            {idols.map((idol) => {
              const isSelected = currentIdol === idol.id;
              return (
                <Button
                  key={idol.id}
                  onClick={() => onSelect(idol.id)}
                  variant={isSelected ? "primary" : "default"}
                  size="md"
                  className="uppercase tracking-wider relative"
                >
                  {isSelected && <span className="mr-1">▶</span>}
                  {idol.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Status bar showing current selection */}
        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center gap-2 text-xs font-mono text-gray-500">
          <span>Active Profile:</span>
          <span style={{ color: idols.find(i => i.id === currentIdol)?.color }}>
            {idols.find(i => i.id === currentIdol)?.fullName}
          </span>
          <span className="ml-auto">
            [{idols.length} profiles available]
          </span>
        </div>
      </div>
    </div>
  );
}
