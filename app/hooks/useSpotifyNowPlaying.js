"use client";
import { useState, useEffect } from "react";

export function useSpotifyNowPlaying() {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        setTrack({
          name: "Error loading track",
          artist: "-",
          album: "-",
          albumArt: null,
          url: "#",
          asciiArt: null,
          playing: false,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTrack();
    const interval = setInterval(fetchTrack, 2000);
    return () => clearInterval(interval);
  }, []);

  return { track, loading };
}
