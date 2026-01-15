"use client";
import { useWidgets } from "../../hooks/useWidgets";
import { useTheme } from "../../hooks/useTheme";
import { useEffect, useRef } from "react";

const availableWidgets = [
  { type: 'music', name: 'Music Player', icon: '', description: 'Play music from the server' },
  { type: 'youtube', name: 'Teto Mix', icon: '', description: 'Watch YouTube videos' },
  { type: 'pong', name: 'Pong', icon: '', description: 'Classic Pong game' },
  { type: 'rhythm', name: 'Rhythm Game', icon: '🎵', description: 'FNF-style rhythm game' },
];

export default function WidgetMenu() {
  const { menuOpen, setMenuOpen, createWidget, closeWidget, widgets, mascotVisible, onToggleMascot } = useWidgets();
  const { theme } = useTheme();
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
      className={`fixed top-[68px] right-4 z-50 bg-[#1a1a1f] border ${theme.colors.border} shadow-[2px_2px_8px_rgba(0,0,0,0.5)] animate-dropdown min-w-[240px]`}
    >
      <div className="py-1 font-jetbrains">
        {availableWidgets.map(widget => {
          const isOpen = Array.from(widgets.values()).some(w => w.type === widget.type);
          return (
            <button
              key={widget.type}
              onClick={() => handleToggleWidget(widget.type)}
              className={`w-full text-left px-4 py-1.5 flex items-center gap-2 transition-colors text-sm border-l-2 border-r-2
                ${isOpen
                  ? `${theme.colors.bg}/15 ${theme.colors.border} ${theme.colors.border}`
                  : `bg-transparent border-l-transparent border-r-transparent hover:${theme.colors.bg}/10`
                }`}
              style={isOpen ? {} : {
                '--tw-border-opacity': '0.5',
              }}
              onMouseEnter={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.borderLeftColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.borderRightColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}1a`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.borderRightColor = 'transparent';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className={`text-xs flex-shrink-0 ${isOpen ? theme.colors.text : 'text-gray-500'}`}>▶</span>
              <div className="flex-1 min-w-0">
                <div className="text-white">
                  {widget.name}
                </div>
              </div>
            </button>
          );
        })}

        {/* Separator */}
        <div className="h-px mx-1 my-1" style={{ backgroundColor: `${theme.colors.primary}33` }}></div>

        {/* Mascot Toggle Button */}
        <button
          onClick={onToggleMascot}
          className={`w-full text-left px-4 py-1.5 flex items-center gap-2 transition-colors text-sm border-l-2 border-r-2
            ${mascotVisible
              ? `${theme.colors.bg}/15 ${theme.colors.border} ${theme.colors.border}`
              : 'bg-transparent border-l-transparent border-r-transparent'
            }`}
          onMouseEnter={(e) => {
            if (!mascotVisible) {
              e.currentTarget.style.borderLeftColor = `${theme.colors.primary}80`;
              e.currentTarget.style.borderRightColor = `${theme.colors.primary}80`;
              e.currentTarget.style.backgroundColor = `${theme.colors.primary}1a`;
            }
          }}
          onMouseLeave={(e) => {
            if (!mascotVisible) {
              e.currentTarget.style.borderLeftColor = 'transparent';
              e.currentTarget.style.borderRightColor = 'transparent';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span className={`text-xs flex-shrink-0 ${mascotVisible ? theme.colors.text : 'text-red-500'}`}>
            {mascotVisible ? '●' : '○'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-white">
              Toggle Futaba
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
