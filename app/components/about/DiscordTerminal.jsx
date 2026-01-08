"use client";
import { useState, useEffect } from "react";
import AnsiToHtml from "ansi-to-html";
import useTypingAnimation from "../../hooks/useTypingAnimation";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";

export default function DiscordTerminal() {
  const [presence, setPresence] = useState(null);

  const ansiConverter = new AnsiToHtml();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl ${siteUrl}/api/discord-presence`;

  const { ref, typedText, isDone, hasStarted } = useTypingAnimation(command);

  useEffect(() => {
    if (!hasStarted) return;

    async function fetchPresence() {
      try {
        const res = await fetch("/api/discord-presence");
        const data = await res.json();

        if (data.presence) {
          setPresence(data.presence);
        } else {
          setPresence({
            username: "Unknown",
            displayName: "Unknown",
            status: "offline",
            avatarAsciiArt: null,
            activity: null,
            customStatus: null,
          });
        }
      } catch (err) {
        console.error("Discord fetch error:", err);
      }
    }

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "text-[#43b581]";
      case "idle":
        return "text-[#faa61a]";
      case "dnd":
        return "text-[#f04747]";
      default:
        return "text-[#747f8d]";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "online":
        return "Online";
      case "idle":
        return "Idle";
      case "dnd":
        return "Do Not Disturb";
      default:
        return "Offline";
    }
  };

  const getActivityType = (type) => {
    switch (type) {
      case 0:
        return "Playing";
      case 1:
        return "Streaming";
      case 2:
        return "Listening to";
      case 3:
        return "Watching";
      case 5:
        return "Competing in";
      default:
        return "Playing";
    }
  };

  const getAsciiArt = () => {
    if (presence?.activity?.asciiArt) {
      return presence.activity.asciiArt;
    }
    if (presence?.avatarAsciiArt) {
      return presence.avatarAsciiArt;
    }
    return null;
  };

  const defaultAscii = `
  ███████████
  ██ Discord██
  ██   󰙯    ██
  ██        ██
  ███████████`;

  return (
    <div
      ref={ref}
      className="flex-1 min-w-[400px] min-h-[220px] bg-[#121217] border-2 border-[#39ff14] shadow-lg  relative">
        <WindowDecoration title="Kitty - Discord" showControls={true} />
      <Sticker
        src="/stickers/futaba-keyboard.png"
        position="bottom-left"
        size={75}
        rotation={12}
        offset={{ x: -20, y: 20 }}
      />
      {!isDone && (
        <div className="p-8 font-jetbrains text-xl flex flex-wrap">
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
              <span className="text-[#39ff14]">User:</span> {presence.displayName}
            </p>
            <p>
              <span className="text-[#39ff14]">Status:</span>{" "}
              <span className={getStatusColor(presence.status)}>
                {getStatusText(presence.status)}
              </span>
            </p>
            {presence.customStatus && (
              <p>
                <span className="text-[#39ff14]">Custom:</span>{" "}
                {presence.customEmoji && <span>{presence.customEmoji} </span>}
                {presence.customStatus}
              </p>
            )}
            {presence.activity ? (
              <p>
                <span className="text-[#39ff14]">{getActivityType(presence.activity.type)}:</span>{" "}
                {presence.activity.name}
              </p>
            ) : (
              <p>
                <span className="text-[#39ff14]">Activity:</span>{" "}
                <span className="text-gray-500">None</span>
              </p>
            )}
            <p>
              <span className="text-[#39ff14]">Source:</span>{" "}
              <span className="text-white">Discord</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
