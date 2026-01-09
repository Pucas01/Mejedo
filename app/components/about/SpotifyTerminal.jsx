"use client";
import { useState, useEffect } from "react";
import AnsiToHtml from "ansi-to-html";
import useTypingAnimation from "../../hooks/useTypingAnimation";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";

export default function SpotifyTerminal() {
  const [track, setTrack] = useState(null);

  const ansiConverter = new AnsiToHtml();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl ${siteUrl}/api/spotify-now-playing`;

  const { ref, typedText, isDone, hasStarted } = useTypingAnimation(command);

  useEffect(() => {
    if (!hasStarted) return;

    async function fetchTrack() {
      try {
        const res = await fetch("/api/spotify-now-playing");
        const data = await res.json();

        if (data.track) {
          setTrack({
            ...data.track,
            playing: data.track.is_playing,
          });
        } else {
          setTrack({
            name: "Nothing Played Yet",
            artist: "-",
            album: "-",
            albumArt: null,
            url: "#",
            asciiArt: null,
            playing: false,
          });
        }
      } catch (err) {
        console.error("Spotify fetch error:", err);
      }
    }

    fetchTrack();
    const interval = setInterval(fetchTrack, 2000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  return (
    <div
      ref={ref}
      className="flex-1 w-full md:min-w-[400px] min-h-[220px] bg-[#121217] border-2 border-[#39ff14] shadow-lg relative">
        <WindowDecoration title="Kitty - Spotify" showControls={true} />
      <Sticker
        src="/stickers/futaba-headphones.png"
        position="top-right"
        size={70}
        rotation={-8}
        offset={{ x: 15, y: -15 }}
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

      {isDone && track && (
        <div className="flex flex-col md:flex-row p-4 md:p-6 font-jetbrains overflow-auto gap-4">
          <div
            className="hidden md:block mr-0 md:mr-6 select-none text-sm leading-tight"
            style={{ whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{
              __html: track.asciiArt
                ? ansiConverter.toHtml(track.asciiArt)
                : `
  ███████████
  ██ No    ██
  ██ Album ██
  ██ Art   ██
  ███████████`,
            }}
          />

          <div className="text-base md:text-xl space-y-0.5 md:space-y-1 text-white">
            <p className="break-words">
              <span className="text-[#39ff14]">Now Playing:</span>{" "}
              {track.name}{" "}
              {!track.playing && track.name !== "Nothing Played Yet" && (
                <span className="text-[#FF5555]">[PAUSED]</span>
              )}
            </p>
            <p className="break-words">
              <span className="text-[#39ff14]">Artist:</span> {track.artist}
            </p>
            <p className="break-words">
              <span className="text-[#39ff14]">Album:</span> {track.album}
            </p>
            <p>
              <span className="text-[#39ff14]">Source:</span>{" "}
              <a
                className="text-white decoration-[#39ff14] underline-offset-5 hover:underline decoration-wavy"
                href={track.url}
              >
                Spotify
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
