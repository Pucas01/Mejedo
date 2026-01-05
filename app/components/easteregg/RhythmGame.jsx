"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const LANES = ["d", "f", "j", "k"];
const LANE_COLORS = ["#c24b99", "#00ffff", "#12fa05", "#f9393f"];
const HIT_ZONE_Y = 50;
const GAME_HEIGHT = 400;
const GAME_WIDTH = 300;
const LANE_WIDTH = 68;
const NOTE_HEIGHT = 14;
const NOTE_WIDTH = 54;
const PERFECT_WINDOW = 30;
const GOOD_WINDOW = 60;
const NOTE_TRAVEL_TIME_MS = 800;

const ARROW_ROTATIONS = [270, 180, 0, 90];

const SONGS = {
  "2hot": {
    name: "2hot",
    artist: "Kawai Sprite",
    duration: 120000,
    audioSrc: "/songs/2hot.ogg",
    voiceSrc: "/songs/2hot-voices.ogg",
    chartSrc: "/songs/2hot-chart.json",
  },
};

const PixelNote = ({ color, hit, lane }) => (
  <div
    className={`transition-opacity duration-75 ${hit ? "opacity-0" : "opacity-100"}`}
    style={{
      width: NOTE_WIDTH,
      height: NOTE_WIDTH,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg
      width={NOTE_WIDTH - 4}
      height={NOTE_WIDTH - 4}
      viewBox="0 0 32 32"
      style={{
        transform: `rotate(${ARROW_ROTATIONS[lane]}deg)`,
      }}
    >
      <polygon
        points="16,2 30,16 22,16 22,30 10,30 10,16 2,16"
        fill={color}
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

const PixelReceptor = ({ keyLabel, color, pressed, lane }) => (
  <div
    className="flex items-center justify-center"
    style={{
      width: NOTE_WIDTH,
      height: NOTE_WIDTH,
    }}
  >
    <svg
      width={NOTE_WIDTH - 4}
      height={NOTE_WIDTH - 4}
      viewBox="0 0 32 32"
      style={{
        transform: `rotate(${ARROW_ROTATIONS[lane]}deg)`,
        opacity: pressed ? 1 : 0.5,
      }}
    >
      <polygon
        points="16,2 30,16 22,16 22,30 10,30 10,16 2,16"
        fill={pressed ? color : "transparent"}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  </div>
);

export default function RhythmGame({ show, onClose, onGameEnd }) {
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [pressedLanes, setPressedLanes] = useState({});
  const [gameState, setGameState] = useState("menu");
  const [timeLeft, setTimeLeft] = useState(30000);
  const [hitEffects, setHitEffects] = useState([]);
  const [selectedSong, setSelectedSong] = useState("2hot");
  const [chartData, setChartData] = useState(null);

  const gameLoopRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const effectIdRef = useRef(0);
  const scoreRef = useRef(0);
  const audioRef = useRef(null);
  const voiceRef = useRef(null);
  const chartNotesRef = useRef([]);
  const nextNoteIndexRef = useRef(0);
  const audioStartedRef = useRef(false);

  const NOTE_TRAVEL_DISTANCE = GAME_HEIGHT - HIT_ZONE_Y + NOTE_HEIGHT;
  const NOTE_SPEED_PER_MS = NOTE_TRAVEL_DISTANCE / NOTE_TRAVEL_TIME_MS;

  const addHitEffect = useCallback((lane, type) => {
    const id = effectIdRef.current++;
    setHitEffects((prev) => [...prev, { id, lane, type }]);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== id));
    }, 200);
  }, []);

  const loadChart = async (songKey) => {
    const song = SONGS[songKey];
    if (!song.chartSrc) return null;

    try {
      const res = await fetch(song.chartSrc);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Failed to load chart:", err);
      return null;
    }
  };

  const startSong = async (songKey) => {
    setGameState("loading");
    const song = SONGS[songKey];

    const chart = await loadChart(songKey);
    if (chart) {
      setChartData(chart);
      chartNotesRef.current = chart.notes.map((n, i) => ({ ...n, id: i }));
      setTimeLeft(chart.duration);
    } else {
      setChartData(null);
      chartNotesRef.current = [];
      setTimeLeft(song.duration);
    }

    setNotes([]);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setFeedback(null);
    setPressedLanes({});
    setHitEffects([]);
    nextNoteIndexRef.current = 0;

    setGameState("playing");
  };

  useEffect(() => {
    if (!show || gameState !== "playing") return;

    audioStartedRef.current = false;
    lastFrameTimeRef.current = null;

    const song = SONGS[selectedSong];
    const hasAudio = song.audioSrc && audioRef.current;

    const startGame = () => {
      startTimeRef.current = Date.now();
      lastFrameTimeRef.current = Date.now();
      audioStartedRef.current = true;
      runLoop();
    };

    if (hasAudio) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;

      if (song.voiceSrc && voiceRef.current) {
        voiceRef.current.currentTime = 0;
        voiceRef.current.volume = 0.4;
      }

      const onCanPlay = () => {
        audioRef.current.removeEventListener("canplaythrough", onCanPlay);
        audioRef.current.play().then(() => {
          if (song.voiceSrc && voiceRef.current) {
            voiceRef.current.play().catch(() => {});
          }
          startGame();
        }).catch(() => {
          startGame();
        });
      };

      if (audioRef.current.readyState >= 4) {
        audioRef.current.play().then(() => {
          if (song.voiceSrc && voiceRef.current) {
            voiceRef.current.play().catch(() => {});
          }
          startGame();
        }).catch(() => startGame());
      } else {
        audioRef.current.addEventListener("canplaythrough", onCanPlay);
      }
    } else {
      startGame();
    }

    const runLoop = () => {
      const loop = () => {
        if (!audioStartedRef.current) return;

        const now = Date.now();
        const deltaMs = lastFrameTimeRef.current ? now - lastFrameTimeRef.current : 16;
        lastFrameTimeRef.current = now;

        const elapsed = now - startTimeRef.current;
        const song = SONGS[selectedSong];
        const duration = chartData?.duration || song.duration;
        const remaining = duration - elapsed;

        setTimeLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          setGameState("ended");
          if (audioRef.current) {
            audioRef.current.pause();
          }
          if (voiceRef.current) {
            voiceRef.current.pause();
          }
          if (onGameEnd) {
            onGameEnd(scoreRef.current);
          }
          return;
        }

        if (chartNotesRef.current.length > 0) {
          while (
            nextNoteIndexRef.current < chartNotesRef.current.length &&
            chartNotesRef.current[nextNoteIndexRef.current].t <= elapsed + NOTE_TRAVEL_TIME_MS
          ) {
            const chartNote = chartNotesRef.current[nextNoteIndexRef.current];
            const timeUntilHit = chartNote.t - elapsed;
            const startY = HIT_ZONE_Y + (timeUntilHit * NOTE_SPEED_PER_MS);

            setNotes((prev) => [
              ...prev,
              {
                id: chartNote.id,
                lane: chartNote.lane,
                y: startY,
                hit: false,
                targetTime: chartNote.t,
              },
            ]);
            nextNoteIndexRef.current++;
          }
        }

        const pixelsToMove = deltaMs * NOTE_SPEED_PER_MS;

        setNotes((prev) => {
          const updated = prev
            .map((note) => ({
              ...note,
              y: note.y - pixelsToMove,
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

        gameLoopRef.current = requestAnimationFrame(loop);
      };

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    return () => {
      audioStartedRef.current = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (voiceRef.current) {
        voiceRef.current.pause();
      }
    };
  }, [show, gameState, selectedSong, chartData, onGameEnd, NOTE_SPEED_PER_MS]);

  useEffect(() => {
    if (!show || gameState !== "playing") return;

    const handleKeyDown = (e) => {
      const lane = LANES.indexOf(e.key.toLowerCase());
      if (lane === -1) {
        if (e.key === "Escape") {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          if (voiceRef.current) {
            voiceRef.current.pause();
          }
          setGameState("menu");
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
          const newPoints = Math.floor(points * multiplier);
          setScore((s) => {
            scoreRef.current = s + newPoints;
            return s + newPoints;
          });
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
  }, [show, gameState, combo, addHitEffect]);

  useEffect(() => {
    if (show) {
      setGameState("menu");
      setNotes([]);
      setScore(0);
      scoreRef.current = 0;
      setCombo(0);
      setMaxCombo(0);
      setFeedback(null);
      setPressedLanes({});
      setHitEffects([]);
      setChartData(null);
    }
  }, [show]);

  useEffect(() => {
    if (!show || gameState !== "menu") return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, gameState, onClose]);

  if (!show) return null;

  const formatTime = (ms) => Math.ceil(ms / 1000);
  const laneStartX = (GAME_WIDTH - LANE_WIDTH * 4) / 2;
  const currentSong = SONGS[selectedSong];

  if (gameState === "menu") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg p-6 min-w-[320px]">
          <div className="flex justify-between items-center mb-4 border-b border-[#39ff14] pb-2">
            <h2 className="text-[#39ff14] text-xl font-mono font-bold">SELECT SONG</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-[#39ff14] font-mono transition-colors"
            >
              [X]
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {Object.entries(SONGS).map(([key, song]) => (
              <button
                key={key}
                onClick={() => setSelectedSong(key)}
                className={`w-full p-3 text-left font-mono border-2 transition-colors ${
                  selectedSong === key
                    ? "border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14]"
                    : "border-gray-600 hover:border-[#39ff14] text-gray-300 hover:text-[#39ff14]"
                }`}
              >
                <div className="font-bold">{song.name}</div>
                <div className="text-sm text-gray-500">{song.artist}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => startSong(selectedSong)}
            className="w-full py-3 font-mono font-bold bg-[#39ff14] text-black border-2 border-[#39ff14] hover:bg-[#121217] hover:text-[#39ff14] transition-colors"
          >
            [START]
          </button>

          <div className="mt-4 text-center text-gray-500 text-xs font-mono">
            ESC = EXIT
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
        <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg p-8">
          <div className="text-[#39ff14] font-mono animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (audioRef.current) audioRef.current.pause();
          if (voiceRef.current) voiceRef.current.pause();
          setGameState("menu");
        }
      }}
    >
      {currentSong.audioSrc && (
        <audio ref={audioRef} src={currentSong.audioSrc} />
      )}
      {currentSong.voiceSrc && (
        <audio ref={voiceRef} src={currentSong.voiceSrc} />
      )}

      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg">
        <div className="flex justify-between items-center px-4 py-2 bg-[#090909] border-b-2 border-[#39ff14]">
          <div className="font-mono text-sm flex items-center gap-2">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-gray-400 ml-1">./{currentSong.name.toLowerCase().replace(/\s/g, "_")}</span>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              if (voiceRef.current) voiceRef.current.pause();
              setGameState("menu");
            }}
            className="text-gray-500 hover:text-[#39ff14] font-mono transition-colors"
          >
            [X]
          </button>
        </div>

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

        <div
          className="relative overflow-hidden bg-[#0a0a0a] m-2 border border-[#39ff14]/30"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
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

          <div
            className="absolute flex gap-[14px]"
            style={{ top: HIT_ZONE_Y - NOTE_WIDTH / 2, left: laneStartX + 7 }}
          >
            {LANES.map((key, i) => (
              <PixelReceptor
                key={key}
                keyLabel={key.toUpperCase()}
                color={LANE_COLORS[i]}
                pressed={pressedLanes[i]}
                lane={i}
              />
            ))}
          </div>

          {hitEffects.map((effect) => (
            <div
              key={effect.id}
              className="absolute animate-pulse"
              style={{
                left: laneStartX + effect.lane * LANE_WIDTH + 7,
                top: HIT_ZONE_Y - NOTE_WIDTH / 2,
                width: NOTE_WIDTH,
                height: NOTE_WIDTH,
                background: effect.type === "perfect" ? "#39ff14" : "#ffd700",
                opacity: 0.3,
                borderRadius: "50%",
              }}
            />
          ))}

          {notes.map((note) => (
            <div
              key={note.id}
              className="absolute"
              style={{
                left: laneStartX + note.lane * LANE_WIDTH + 7,
                top: note.y,
              }}
            >
              <PixelNote color={LANE_COLORS[note.lane]} hit={note.hit} lane={note.lane} />
            </div>
          ))}

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

          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            }}
          />

          {gameState === "ended" && (
            <div className="absolute inset-0 bg-[#121217]/95 flex flex-col items-center justify-center">
              <div className="text-[#39ff14] text-xl font-mono font-bold mb-4 border-b border-[#39ff14] pb-2 px-4">
                SONG_COMPLETE
              </div>
              <div className="text-gray-400 font-mono text-sm mb-2">
                {currentSong.name}
              </div>
              <div className="text-white font-mono mb-1">
                FINAL SCORE: <span className="text-[#39ff14]">{Math.floor(score)}</span>
              </div>
              <div className="text-gray-400 font-mono text-sm mb-4">
                MAX COMBO: <span className="text-[#ffd700]">{maxCombo}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startSong(selectedSong)}
                  className="px-4 py-2 font-mono font-bold bg-[#39ff14] text-black border-2 border-[#39ff14] hover:bg-[#121217] hover:text-[#39ff14] transition-colors"
                >
                  [RETRY]
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-4 py-2 font-mono font-bold bg-[#121217] text-[#39ff14] border-2 border-[#39ff14] hover:bg-[#39ff14] hover:text-black transition-colors"
                >
                  [MENU]
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-xs px-4 py-2 font-mono bg-[#090909] border-t border-[#39ff14]/30">
          <span className="text-[#ff5555]">D</span>
          <span className="text-[#39ff14]"> F</span>
          <span className="text-[#ffd700]"> J</span>
          <span className="text-[#D73DA3]"> K</span>
          <span className="text-gray-500"> = HIT</span>
          <span className="mx-2">|</span>
          <span>ESC = MENU</span>
        </div>
      </div>
    </div>
  );
}
