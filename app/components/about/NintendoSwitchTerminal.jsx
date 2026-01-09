"use client";
import { useState, useEffect } from "react";
import AnsiToHtml from "ansi-to-html";
import useTypingAnimation from "../../hooks/useTypingAnimation";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";

export default function NintendoSwitchTerminal() {
  const [presence, setPresence] = useState(null);

  const ansiConverter = new AnsiToHtml();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl ${siteUrl}/api/nintendo-presence`;

  const { ref, typedText, isDone, hasStarted } = useTypingAnimation(command);

  useEffect(() => {
    if (!hasStarted) return;

    async function fetchPresence() {
      try {
        const res = await fetch("/api/nintendo-presence");
        const data = await res.json();

        if (data.presence) {
          setPresence(data.presence);
        } else {
          setPresence({
            username: "Unknown",
            state: "OFFLINE",
            isOnline: false,
            isPlaying: false,
            game: null,
            pfpAsciiArt: null,
          });
        }
      } catch (err) {
        console.error("Nintendo fetch error:", err);
      }
    }

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const formatPlayTime = (minutes) => {
    if (!minutes) return "0h";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const getStateColor = (state) => {
    switch (state) {
      case "ONLINE":
      case "PLAYING":
        return "text-[#39ff14]";
      case "OFFLINE":
        return "text-[#FF5555]";
      default:
        return "text-[#FFAA00]";
    }
  };

  const getAsciiArt = () => {
    if (presence?.isPlaying && presence?.game?.asciiArt) {
      return presence.game.asciiArt;
    }
    if (presence?.pfpAsciiArt) {
      return presence.pfpAsciiArt;
    }
    return null;
  };

  const defaultAscii = `
  ███████████
  ██ Nintendo██
  ██ Switch  ██
  ██  󰺷     ██
  ███████████`;

  return (
    <div
      ref={ref}
      className="flex-1 w-full md:min-w-[400px] min-h-[220px] bg-[#121217] border-2 border-[#39ff14] shadow-lg relative">
        <WindowDecoration title="Kitty - Switch" showControls={true} />
      <Sticker
        src="/stickers/futaba-happy.png"
        position="top-left"
        size={70}
        rotation={-12}
        offset={{ x: -18, y: -18 }}
      />
      {!isDone && (
        <div className="p-4 md:p-8 font-jetbrains text-sm md:text-xl flex flex-wrap">
          <span className="text-[#39ff14]">pucas01</span>
          <span className="text-white">@</span>
          <span className="text-[#D73DA3]">PucasArch</span>
          <span className="text-white">:</span>
          <span className="text-[#FF5555]">~</span>
          <span className="text-white">$</span>
          <span className="text-white">&nbsp;{typedText}</span>
          <span className="cursor animate-blink">|</span>
        </div>
      )}

      {isDone && presence && (
        <div className="flex flex-col md:flex-row p-4 md:p-6 font-jetbrains overflow-auto gap-4">
          <div
            className="hidden md:block mr-0 md:mr-6 select-none text-sm leading-tight"
            style={{ whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{
              __html: getAsciiArt()
                ? ansiConverter.toHtml(getAsciiArt())
                : defaultAscii,
            }}
          />

          <div className="text-base md:text-xl space-y-0.5 md:space-y-1 text-white">
            <p>
              <span className="text-[#39ff14]">User:</span> {presence.username}
            </p>
            <p>
              <span className="text-[#39ff14]">Status:</span>{" "}
              <span className={getStateColor(presence.state)}>
                {presence.state}
              </span>
            </p>
            {presence.isPlaying && presence.game ? (
              <>
                <p>
                  <span className="text-[#39ff14]">Playing:</span>{" "}
                  {presence.game.name}
                </p>
                <p>
                  <span className="text-[#39ff14]">Play Time:</span>{" "}
                  {formatPlayTime(presence.game.totalPlayTime)}
                </p>
              </>
            ) : (
              <p>
                <span className="text-[#39ff14]">Playing:</span>{" "}
                <span className="text-gray-500">Not playing anything</span>
              </p>
            )}
            <p>
              <span className="text-[#39ff14]">Source:</span>{" "}
              <span className="text-white">Nintendo Switch</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
