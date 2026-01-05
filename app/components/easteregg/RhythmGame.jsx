"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const LANES = ["d", "f", "j", "k"];
const LANE_COLORS = ["#ff5555", "#39ff14", "#ffd700", "#D73DA3"];
const NOTE_SPEED = 5;
const HIT_ZONE_Y = 50;
const GAME_HEIGHT = 400;
const GAME_WIDTH = 300;
const LANE_WIDTH = 68;
const NOTE_HEIGHT = 14;
const NOTE_WIDTH = 54;
const PERFECT_WINDOW = 30;
const GOOD_WINDOW = 60;
const GAME_DURATION = 30000;

// Note component - simple terminal style
const PixelNote = ({ color, hit }) => (
  <div
    className={`transition-opacity duration-75 ${hit ? "opacity-0" : "opacity-100"}`}
    style={{
      width: NOTE_WIDTH,
      height: NOTE_HEIGHT,
      background: color,
      border: "2px solid #39ff14",
    }}
  />
);

// Receptor - terminal key style
const PixelReceptor = ({ keyLabel, color, pressed }) => (
  <div
    className="flex items-center justify-center font-mono"
    style={{
      width: NOTE_WIDTH,
      height: 26,
      background: pressed ? color : "#121217",
      border: `2px solid ${pressed ? "#fff" : "#39ff14"}`,
    }}
  >
    <span
      className="font-bold text-sm"
      style={{ color: pressed ? "#000" : color }}
    >
      {keyLabel}
    </span>
  </div>
);

export default function RhythmGame({ show, onClose }) {
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [pressedLanes, setPressedLanes] = useState({});
  const [gameState, setGameState] = useState("playing");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hitEffects, setHitEffects] = useState([]);

  const gameLoopRef = useRef(null);
  const noteIdRef = useRef(0);
  const startTimeRef = useRef(null);
  const lastNoteTimeRef = useRef({});
  const effectIdRef = useRef(0);

  const generateNote = useCallback(() => {
    const now = Date.now();
    const lane = Math.floor(Math.random() * 4);

    if (lastNoteTimeRef.current[lane] && now - lastNoteTimeRef.current[lane] < 350) {
      return null;
    }

    lastNoteTimeRef.current[lane] = now;

    return {
      id: noteIdRef.current++,
      lane,
      y: GAME_HEIGHT + NOTE_HEIGHT,
      hit: false,
    };
  }, []);

  const addHitEffect = useCallback((lane, type) => {
    const id = effectIdRef.current++;
    setHitEffects((prev) => [...prev, { id, lane, type }]);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== id));
    }, 200);
  }, []);

  // Game loop
  useEffect(() => {
    if (!show || gameState !== "playing") return;

    startTimeRef.current = Date.now();
    noteIdRef.current = 0;
    lastNoteTimeRef.current = {};

    const loop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = GAME_DURATION - elapsed;

      setTimeLeft(Math.max(0, remaining));

      if (remaining <= 0) {
        setGameState("ended");
        return;
      }

      setNotes((prev) => {
        const updated = prev
          .map((note) => ({
            ...note,
            y: note.y - NOTE_SPEED,
          }))
          .filter((note) => {
            if (!note.hit && note.y < HIT_ZONE_Y - GOOD_WINDOW) {
              setCombo(0);
              setFeedback({ type: "miss", lane: note.lane });
              setTimeout(() => setFeedback(null), 300);
              return false;
            }
            if (note.hit && note.y < -NOTE_HEIGHT) {
              return false;
            }
            return note.y > -NOTE_HEIGHT;
          });

        return updated;
      });

      if (Math.random() < 0.04) {
        const newNote = generateNote();
        if (newNote) {
          setNotes((prev) => [...prev, newNote]);
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [show, gameState, generateNote]);

  // Key handling
  useEffect(() => {
    if (!show || gameState !== "playing") return;

    const handleKeyDown = (e) => {
      const lane = LANES.indexOf(e.key.toLowerCase());
      if (lane === -1) {
        if (e.key === "Escape") {
          onClose();
        }
        return;
      }

      e.preventDefault();
      setPressedLanes((prev) => ({ ...prev, [lane]: true }));

      setNotes((prev) => {
        let hitNote = null;
        let hitType = null;

        let closestDistance = Infinity;
        for (const note of prev) {
          if (note.lane === lane && !note.hit) {
            const distance = Math.abs(note.y - HIT_ZONE_Y);
            if (distance < closestDistance && distance <= GOOD_WINDOW) {
              closestDistance = distance;
              hitNote = note;
              hitType = distance <= PERFECT_WINDOW ? "perfect" : "good";
            }
          }
        }

        if (hitNote) {
          const points = hitType === "perfect" ? 100 : 50;
          const multiplier = 1 + Math.floor(combo / 10) * 0.1;
          setScore((s) => s + Math.floor(points * multiplier));
          setCombo((c) => {
            const newCombo = c + 1;
            setMaxCombo((m) => Math.max(m, newCombo));
            return newCombo;
          });
          setFeedback({ type: hitType, lane });
          addHitEffect(lane, hitType);
          setTimeout(() => setFeedback(null), 200);

          return prev.map((n) =>
            n.id === hitNote.id ? { ...n, hit: true } : n
          );
        }

        return prev;
      });
    };

    const handleKeyUp = (e) => {
      const lane = LANES.indexOf(e.key.toLowerCase());
      if (lane !== -1) {
        setPressedLanes((prev) => ({ ...prev, [lane]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [show, gameState, combo, onClose, addHitEffect]);

  // Reset on open
  useEffect(() => {
    if (show) {
      setNotes([]);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setFeedback(null);
      setPressedLanes({});
      setGameState("playing");
      setTimeLeft(GAME_DURATION);
      setHitEffects([]);
    }
  }, [show]);

  if (!show) return null;

  const formatTime = (ms) => Math.ceil(ms / 1000);
  const laneStartX = (GAME_WIDTH - LANE_WIDTH * 4) / 2;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Terminal window */}
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg">
        {/* Terminal header */}
        <div className="flex justify-between items-center px-4 py-2 bg-[#090909] border-b-2 border-[#39ff14]">
          <div className="font-mono text-sm flex items-center gap-2">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">RhythmGame</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-gray-400 ml-1">./futabalishous</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-[#39ff14] font-mono transition-colors"
          >
            [X]
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex justify-between items-center px-4 py-2 font-mono text-sm bg-[#090909]">
          <div className="text-[#39ff14]">
            SCORE: <span className="text-white">{Math.floor(score).toString().padStart(6, "0")}</span>
          </div>
          <div className="text-[#ffd700]">
            COMBO: <span className="text-white">{combo}</span>
            {combo >= 10 && (
              <span className="ml-1 text-[#D73DA3]">
                x{(1 + Math.floor(combo / 10) * 0.1).toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-gray-400">
            TIME: <span className="text-white">{formatTime(timeLeft)}s</span>
          </div>
        </div>

        {/* Game Area */}
        <div
          className="relative overflow-hidden bg-[#0a0a0a] m-2 border border-[#39ff14]/30"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Lane backgrounds on press */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 transition-opacity duration-50"
              style={{
                left: laneStartX + i * LANE_WIDTH + 7,
                width: NOTE_WIDTH,
                background: pressedLanes[i] ? `${LANE_COLORS[i]}15` : "transparent",
              }}
            />
          ))}

          {/* Lane dividers */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: laneStartX + i * LANE_WIDTH,
                width: 1,
                background: "#39ff1420",
              }}
            />
          ))}

          {/* Hit zone line */}
          <div
            className="absolute left-0 right-0 h-[2px] bg-[#39ff14]"
            style={{ top: HIT_ZONE_Y }}
          />

          {/* Receptors */}
          <div
            className="absolute flex gap-[14px]"
            style={{ top: HIT_ZONE_Y - 13, left: laneStartX + 7 }}
          >
            {LANES.map((key, i) => (
              <PixelReceptor
                key={key}
                keyLabel={key.toUpperCase()}
                color={LANE_COLORS[i]}
                pressed={pressedLanes[i]}
              />
            ))}
          </div>

          {/* Hit effects */}
          {hitEffects.map((effect) => (
            <div
              key={effect.id}
              className="absolute animate-pulse"
              style={{
                left: laneStartX + effect.lane * LANE_WIDTH + 7,
                top: HIT_ZONE_Y - 13,
                width: NOTE_WIDTH,
                height: 26,
                background: effect.type === "perfect" ? "#39ff14" : "#ffd700",
                opacity: 0.4,
                border: "2px solid #fff",
              }}
            />
          ))}

          {/* Notes */}
          {notes.map((note) => (
            <div
              key={note.id}
              className="absolute"
              style={{
                left: laneStartX + note.lane * LANE_WIDTH + 7,
                top: note.y,
              }}
            >
              <PixelNote color={LANE_COLORS[note.lane]} hit={note.hit} />
            </div>
          ))}

          {/* Feedback text */}
          {feedback && (
            <div
              className="absolute left-1/2 -translate-x-1/2 font-mono font-bold animate-rhythm-feedback"
              style={{
                top: HIT_ZONE_Y + 50,
                fontSize: feedback.type === "perfect" ? 16 : 14,
                color:
                  feedback.type === "perfect"
                    ? "#39ff14"
                    : feedback.type === "good"
                    ? "#ffd700"
                    : "#ff5555",
              }}
            >
              {feedback.type === "perfect" ? "PERFECT!" : feedback.type === "good" ? "GOOD" : "MISS"}
            </div>
          )}

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            }}
          />

          {/* Game Over */}
          {gameState === "ended" && (
            <div className="absolute inset-0 bg-[#121217]/95 flex flex-col items-center justify-center">
              <div className="text-[#39ff14] text-xl font-mono font-bold mb-4 border-b border-[#39ff14] pb-2 px-4">
                GAME_OVER
              </div>
              <div className="text-white font-mono mb-1">
                FINAL SCORE: <span className="text-[#39ff14]">{Math.floor(score)}</span>
              </div>
              <div className="text-gray-400 font-mono text-sm mb-4">
                MAX COMBO: <span className="text-[#ffd700]">{maxCombo}</span>
              </div>
              <button
                onClick={() => {
                  setGameState("playing");
                  setNotes([]);
                  setScore(0);
                  setCombo(0);
                  setMaxCombo(0);
                  setTimeLeft(GAME_DURATION);
                  setHitEffects([]);
                  startTimeRef.current = Date.now();
                }}
                className="px-6 py-2 font-mono font-bold bg-[#39ff14] text-black border-2 border-[#39ff14] hover:bg-[#121217] hover:text-[#39ff14] transition-colors"
              >
                [RETRY]
              </button>
            </div>
          )}
        </div>

        {/* Controls footer */}
        <div className="text-center text-gray-500 text-xs px-4 py-2 font-mono bg-[#090909] border-t border-[#39ff14]/30">
          <span className="text-[#ff5555]">D</span>
          <span className="text-[#39ff14]"> F</span>
          <span className="text-[#ffd700]"> J</span>
          <span className="text-[#D73DA3]"> K</span>
          <span className="text-gray-500"> = HIT</span>
          <span className="mx-2">|</span>
          <span>ESC = EXIT</span>
        </div>
      </div>
    </div>
  );
}
