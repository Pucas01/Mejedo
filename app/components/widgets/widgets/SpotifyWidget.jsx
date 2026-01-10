"use client";
import { useSpotifyNowPlaying } from "../../../hooks/useSpotifyNowPlaying";
import AnsiToHtml from "ansi-to-html";

export default function SpotifyWidget() {
  const { track, loading } = useSpotifyNowPlaying();
  const ansiConverter = new AnsiToHtml();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Loading Spotify data...</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>No track data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-row items-start gap-4">
        {/* Album Art */}
        <div
          className="flex-shrink-0 select-none text-xs leading-tight"
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

        {/* Track Info */}
        <div className="flex-1 space-y-2 text-white min-w-0">
          <div>
            <span className="text-[#39ff14]">Now Playing:</span>{" "}
            <span className="break-words">{track.name}</span>{" "}
            {!track.playing && track.name !== "Nothing Played Yet" && (
              <span className="text-[#FF5555]">[PAUSED]</span>
            )}
          </div>
          <div>
            <span className="text-[#39ff14]">Artist:</span>{" "}
            <span className="break-words">{track.artist}</span>
          </div>
          <div>
            <span className="text-[#39ff14]">Album:</span>{" "}
            <span className="break-words">{track.album}</span>
          </div>
          <div>
            <span className="text-[#39ff14]">Source:</span>{" "}
            <a
              className="text-white decoration-[#39ff14] underline-offset-5 hover:underline decoration-wavy"
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Spotify
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
