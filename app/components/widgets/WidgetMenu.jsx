"use client";
import { useWidgets } from "../../hooks/useWidgets";
import { useEffect, useRef } from "react";

const availableWidgets = [
  { type: 'music', name: 'Music Player', icon: '', description: 'Play music from the server' },
];

export default function WidgetMenu() {
  const { menuOpen, setMenuOpen, createWidget, closeWidget, widgets, mascotVisible, onToggleMascot } = useWidgets();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e) => {
      // Don't close if clicking the menu itself or the widget button
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          !e.target.closest('[aria-label="Open widget menu"]')) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    // Use a small delay to prevent the same click that opened the menu from closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, setMenuOpen]);

  if (!menuOpen) return null;

  const handleToggleWidget = (type) => {
    // Check if widget of this type already exists
    const existing = Array.from(widgets.values()).find(w => w.type === type && !w.minimized);
    if (existing) {
      // Widget already open, close it
      closeWidget(existing.id);
      return;
    }

    // Widget not open, create it
    createWidget(type);
  };

  return (
    <div
      ref={menuRef}
      className="fixed top-[68px] right-4 z-50 bg-[#121217] border-2 border-[#39ff14] shadow-lg animate-dropdown min-w-[280px]"
    >
      <div className="p-3 font-jetbrains">
        <div className="space-y-1">
          {availableWidgets.map(widget => {
            const isOpen = Array.from(widgets.values()).some(w => w.type === widget.type);
            return (
              <button
                key={widget.type}
                onClick={() => handleToggleWidget(widget.type)}
                className={`w-full text-left px-3 py-2 border border-[#39ff14] flex items-center gap-3 transition-all text-sm
                  ${isOpen
                    ? 'bg-[#39ff14]/20 hover:bg-[#39ff14]/30 active:bg-[#39ff14]/40'
                    : 'hover:bg-[#39ff14]/10 active:bg-[#39ff14]/20'
                  }`}
              >
                <span className="text-xl flex-shrink-0">{widget.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">
                    {widget.name}
                    {isOpen && <span className="text-[#39ff14] ml-2 text-xs">(Active)</span>}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Mascot Toggle Button */}
          <button
            onClick={onToggleMascot}
            className={`w-full text-left px-3 py-2 border border-[#39ff14] flex items-center gap-3 transition-all text-sm
              ${mascotVisible
                ? 'bg-[#39ff14]/20 hover:bg-[#39ff14]/30 active:bg-[#39ff14]/40'
                : 'hover:bg-[#39ff14]/10 active:bg-[#39ff14]/20'
              }`}
          >
            <span className="text-xl flex-shrink-0"></span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold">
                Toggle Futaba
                <span className={`ml-2 text-xs ${mascotVisible ? 'text-[#39ff14]' : 'text-red-500'}`}>
                  ({mascotVisible ? 'Visible' : 'Hidden'})
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
