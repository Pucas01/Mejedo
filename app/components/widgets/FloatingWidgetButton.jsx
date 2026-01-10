"use client";
import { useWidgets } from "../../hooks/useWidgets";

export default function FloatingWidgetButton() {
  const { menuOpen, setMenuOpen } = useWidgets();

  return (
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className="fixed top-4 right-4 z-[45] px-4 py-1.5 font-jetbrains font-medium text-base
                 bg-gradient-to-b from-[#5a9c4a] to-[#4a7c3a]
                 text-white
                 border-2
                 border-t-[#7abc6a]
                 border-l-[#7abc6a]
                 border-r-[#2a5c1a]
                 border-b-[#2a5c1a]
                 hover:from-[#6aac5a] hover:to-[#5a9c4a]
                 shadow-[inset_1px_1px_0_0_#8acc7a,inset_-1px_-1px_0_0_#1a4c0a]
                 active:border-t-[#2a5c1a]
                 active:border-l-[#2a5c1a]
                 active:border-r-[#7abc6a]
                 active:border-b-[#7abc6a]
                 active:shadow-[inset_-1px_-1px_0_0_#8acc7a,inset_1px_1px_0_0_#1a4c0a]
                 active:translate-y-px
                 transition-all flex items-center gap-2"
      aria-label="Open widget menu"
    >
      <span>Widgets</span>
      <span className="text-sm">▼</span>
    </button>
  );
}
