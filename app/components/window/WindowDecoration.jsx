"use client";

export default function WindowDecoration({ title = "Terminal", onClose, showControls = true }) {
  return (
    <div
  className="
    relative flex items-center justify-between h-8 min-h-8 bg-gradient-to-b from-[#404045] via-[#2a2a2e] to-[#1e1e22] border-b-2 border-[#39ff14] px-3 overflow-hidden">
      {/* Glossy shine effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" style={{ height: '60%' }} />

      <div className="flex items-center gap-2 relative z-10">
        <div className="text-[#39ff14] text-sm font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{title}</div>
      </div>

      {showControls && (
        <div className="flex items-center gap-1.5 relative z-10">
          {/* Minimize button */}
          <button
            className="w-5 h-5 bg-gradient-to-b from-[#5a5a5e] to-[#3a3a3e] hover:from-[#6a6a6e] hover:to-[#4a4a4e] border border-[#777] border-b-[#333] flex items-center justify-center text-white text-xs transition-all shadow-sm"
            title="Minimize"
          >
            _
          </button>

          {/* Maximize button */}
          <button
            className="w-5 h-5 bg-gradient-to-b from-[#5a5a5e] to-[#3a3a3e] hover:from-[#6a6a6e] hover:to-[#4a4a4e] border border-[#777] border-b-[#333] flex items-center justify-center text-white text-xs transition-all shadow-sm"
            title="Maximize"
          >
            □
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-5 h-5 bg-gradient-to-b from-[#e85d5d] to-[#c62828] hover:from-[#ff6b6b] hover:to-[#d32f2f] border border-[#ff8080] border-b-[#8b1a1a] flex items-center justify-center text-white text-xs font-bold transition-all shadow-sm"
            title="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
