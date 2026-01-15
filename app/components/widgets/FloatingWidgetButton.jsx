"use client";
import { useWidgets } from "../../hooks/useWidgets";
import { useTheme } from "../../hooks/useTheme";

export default function FloatingWidgetButton() {
  const { menuOpen, setMenuOpen } = useWidgets();
  const { theme } = useTheme();

  return (
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className={`fixed top-4 right-4 z-[45] px-4 py-1.5 font-jetbrains font-medium text-base
                 ${theme.button.gradient}
                 text-white
                 border-2
                 ${theme.button.borderTop}
                 ${theme.button.borderBottom}
                 ${theme.button.hover}
                 ${theme.button.shadow}
                 ${theme.button.activeTop}
                 ${theme.button.activeBottom}
                 ${theme.button.activeShadow}
                 active:translate-y-px
                 transition-all flex items-center gap-2`}
      aria-label="Open widget menu"
    >
      <span>Widgets</span>
      <span className="text-sm">▼</span>
    </button>
  );
}
