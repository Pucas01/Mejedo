"use client";
import { useState, useEffect, useRef } from "react";
import AnsiToHtml from "ansi-to-html";

export default function SpotifyTerminal() {
  const [spotifyCmd, setSpotifyCmd] = useState("");
  const [doneSpotify, setDoneSpotify] = useState(false);
  const [track, setTrack] = useState(null);
  const [lastTrack, setLastTrack] = useState(null); // persist last track
  const [startSpotify, setStartSpotify] = useState(false);
  const secondRef = useRef(null);

  const ansiConverter = new AnsiToHtml();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl ${siteUrl}/api/spotify-now-playing`;


  // Intersection Observer to trigger startSpotify
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStartSpotify(true);
      },
      { threshold: 0.3 }
    );
    if (secondRef.current) observer.observe(secondRef.current);
    return () => {
      if (secondRef.current) observer.unobserve(secondRef.current);
    };
  }, []);

  // Typing animation
  useEffect(() => {
    if (!startSpotify) return;

    let i = 0;
    const interval = setInterval(() => {
      setSpotifyCmd(command.slice(0, i));
      i++;
      if (i > command.length) {
        clearInterval(interval);
        setTimeout(() => setDoneSpotify(true), 200);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startSpotify]);

  // Fetch currently playing track
  useEffect(() => {
    if (!startSpotify) return;

    async function fetchTrack() {
      try {
        const res = await fetch("/api/spotify-now-playing");
        const data = await res.json();

        if (data && data.is_playing) {
          const current = { ...data, playing: true };
          setTrack(current);
          setLastTrack(current);
        } else if (lastTrack) {
          // Spotify paused or closed → show last track but paused
          setTrack({ ...lastTrack, playing: false });
        } else {
          setTrack({
            name: "Nothing Played Yet",
            artist: "-",
            album: "-",
            albumArt: null,
            url: "#",
            asciiArt: null,
            playing: false
          });
        }
      } catch (err) {
        console.error("Spotify fetch error:", err);
      }
    }

    fetchTrack();
    const interval = setInterval(fetchTrack, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [startSpotify, lastTrack]);

  return (
    <div
      ref={secondRef}
      className="flex-1 min-w-[400px] min-h-[200px] max-h-[200px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex"
    >
      {/* Typing intro */}
      {!doneSpotify && (
        <div className="p-8 font-jetbrains text-xl flex flex-wrap">
          <span className="text-[#39ff14]">pucas01</span>
          <span className="text-white">@</span>
          <span className="text-[#D73DA3]">PucasDocker</span>
          <span className="text-white">:</span>
          <span className="text-[#FF5555]">~</span>
          <span className="text-white">$</span>
          <span className="text-white">&nbsp;{spotifyCmd}</span>
          <span className="cursor animate-blink">|</span>
        </div>
      )}

      {/* Output */}
      {doneSpotify && track && (
        <div className="flex flex-row p-6 font-jetbrains overflow-auto">
          <div
            className="mr-6 select-none"
            style={{ whiteSpace: "pre" }}
            dangerouslySetInnerHTML={{
              __html: track.asciiArt ? ansiConverter.toHtml(track.asciiArt) : `
  ███████████
  ██ No    ██
  ██ Album ██
  ██ Art   ██
  ███████████`
            }}
          />
          <div className="text-xl space-y-1 text-white">
            <p><span className="text-[#39ff14]">Now Playing:</span> {track.name} {track.playing ? "(Playing)" : "(Paused)"}</p>
            <p><span className="text-[#39ff14]">Artist:</span> {track.artist}</p>
            <p><span className="text-[#39ff14]">Album:</span> {track.album}</p>
            <p>
              <span className="text-[#39ff14]">Source:</span>{" "}
              <a className="text-white decoration-[#39ff14] underline-offset-5 hover:underline decoration-wavy" href={track.url}>Spotify</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
