"use client";

export default function MobileNav({ isOpen, onToggle, active, onNavigate, pages }) {
  return (
    <>
      {/* Hamburger Button - Windows 95 style */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 right-4 z-50 w-12 h-12 bg-gradient-to-b from-[#5a5a5e] to-[#3a3a3e] border-2 border-[#39ff14] flex flex-col items-center justify-center gap-1.5 active:from-[#4a4a4e] active:to-[#2a2a2e] transition-all shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),inset_-1px_-1px_0_rgba(0,0,0,0.5)] touch-manipulation"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span
          className={`w-7 h-0.5 bg-[#39ff14] transition-all duration-300 ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`w-7 h-0.5 bg-[#39ff14] transition-all duration-300 ${
            isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
          }`}
        />
        <span
          className={`w-7 h-0.5 bg-[#39ff14] transition-all duration-300 ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Mobile Menu Overlay - Terminal style */}
      <div
        className={`md:hidden fixed inset-0 bg-black/90 z-40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      >
        {/* Menu Window */}
        <div
          className={`fixed top-16 left-4 right-4 bg-[#090909] border-2 border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.3)] max-h-[calc(100vh-5rem)] overflow-y-auto transition-all duration-300 ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Window Title Bar */}
          <div className="flex items-center justify-between h-10 bg-gradient-to-b from-[#404045] via-[#2a2a2e] to-[#1e1e22] border-b-2 border-[#39ff14] px-3 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="text-[#39ff14] text-sm font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Navigation
              </div>
            </div>
            <button
              onClick={onToggle}
              className="w-6 h-6 bg-gradient-to-b from-[#e85d5d] to-[#c62828] active:from-[#d32f2f] active:to-[#b71c1c] border border-[#ff8080] border-b-[#8b1a1a] flex items-center justify-center text-white text-sm font-bold transition-all shadow-sm touch-manipulation"
              title="Close"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-4 flex flex-col gap-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => {
                  onNavigate(page);
                  onToggle();
                }}
                className={`w-full text-left px-4 py-3 text-lg font-mono transition-all touch-manipulation active:scale-95 ${
                  active === page
                    ? "bg-[#39ff14] text-black font-bold shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]"
                    : "bg-gradient-to-b from-[#2a2a2e] to-[#1e1e22] text-[#39ff14] active:from-[#1a1a1e] active:to-[#0e0e12] border border-[#39ff14]/30 active:border-[#39ff14] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]"
                }`}
              >
                <span className="font-mono">{page}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
