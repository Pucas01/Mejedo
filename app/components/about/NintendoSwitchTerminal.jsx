"use client";
import { useState, useEffect, useRef } from "react";
import AnsiToHtml from "ansi-to-html";

export default function NintendoSwitchTerminal() {
  const [nintendoCmd, setNintendoCmd] = useState("");
  const [doneNintendo, setDoneNintendo] = useState(false);
  const [presence, setPresence] = useState(null);
  const [startNintendo, setStartNintendo] = useState(false);
  const terminalRef = useRef(null);

  const ansiConverter = new AnsiToHtml();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl ${siteUrl}/api/nintendo-presence`;

  // Intersection Observer: Start only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setStartNintendo(true),
      { threshold: 0.3 }
    );
    if (terminalRef.current) observer.observe(terminalRef.current);
    return () => terminalRef.current && observer.unobserve(terminalRef.current);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!startNintendo) return;
    let i = 0;
    const interval = setInterval(() => {
      setNintendoCmd(command.slice(0, i));
      i++;
      if (i > command.length) {
        clearInterval(interval);
        setTimeout(() => setDoneNintendo(true), 200);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [startNintendo]);

  useEffect(() => {
    if (!startNintendo) return;

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
    const interval = setInterval(fetchPresence, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [startNintendo]);

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

  // Determine which ASCII art to show: game if playing, otherwise pfp
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
      ref={terminalRef}
      className="flex-1 min-w-[400px] min-h-[200px] max-h-[200px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex"
    >
      {!doneNintendo && (
        <div className="p-8 font-jetbrains text-xl flex flex-wrap">
          <span className="text-[#39ff14]">pucas01</span>
          <span className="text-white">@</span>
          <span className="text-[#D73DA3]">PucasArch</span>
          <span className="text-white">:</span>
          <span className="text-[#FF5555]">~</span>
          <span className="text-white">$</span>
          <span className="text-white">&nbsp;{nintendoCmd}</span>
          <span className="cursor animate-blink">|</span>
        </div>
      )}

      {doneNintendo && presence && (
        <div className="flex flex-row p-6 font-jetbrains overflow-auto">
          <div
            className="mr-6 select-none"
            style={{ whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{
              __html: getAsciiArt()
                ? ansiConverter.toHtml(getAsciiArt())
                : defaultAscii,
            }}
          />

          <div className="text-xl space-y-1 text-white">
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
