"use client";
import { useState, useEffect, useCallback } from "react";

const ARROW_KEYS = {
  ArrowUp: 0,
  ArrowDown: 180,
  ArrowLeft: 270,
  ArrowRight: 90,
};

const ARROW_COLORS = {
  ArrowUp: "#12fa05",    // Green
  ArrowDown: "#00ffff",  // Cyan
  ArrowLeft: "#c24b99",  // Purple
  ArrowRight: "#f9393f", // Red
};

export default function ArrowHint() {
  const [arrows, setArrows] = useState([]);
  const [idCounter, setIdCounter] = useState(0);

  const addArrow = useCallback((key) => {
    const rotation = ARROW_KEYS[key];
    const color = ARROW_COLORS[key];
    if (rotation === undefined) return;

    const newArrow = {
      id: idCounter,
      rotation,
      color,
      timestamp: Date.now(),
    };

    setArrows((prev) => [...prev, newArrow]);
    setIdCounter((prev) => prev + 1);

    // Remove arrow after animation
    setTimeout(() => {
      setArrows((prev) => prev.filter((a) => a.id !== newArrow.id));
    }, 700);
  }, [idCounter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (ARROW_KEYS[e.key] !== undefined) {
        addArrow(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addArrow]);

  if (arrows.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {arrows.map((arrow) => (
        <div
          key={arrow.id}
          className="absolute"
          style={{
            transform: `rotate(${arrow.rotation}deg)`,
          }}
        >
          <div className="animate-arrow-hint">
            <svg
              width="120"
              height="120"
              viewBox="0 0 32 32"
            >
              <polygon
                points="16,2 30,16 22,16 22,30 10,30 10,16 2,16"
                fill={arrow.color}
                stroke="#fff"
                strokeWidth="1"
                opacity="0.9"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
