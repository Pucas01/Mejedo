"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration";
import Button from "../ui/Button";

export default function SpotifyStatsModal({ show, onClose }) {
  const [trackedUsers, setTrackedUsers] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [guildId, setGuildId] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch tracked users
      const usersRes = await fetch("/api/spotify-stats/tracked-users", { credentials: "include" });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setTrackedUsers(users);

        // Get guild ID from first tracked user (if any)
        if (users.length > 0) {
          const firstGuildId = users[0].guild_id;
          setGuildId(firstGuildId);

          // Fetch top tracks
          const tracksRes = await fetch(`/api/spotify-stats/guild/${firstGuildId}/top-tracks?limit=10`, {
            credentials: "include"
          });
          if (tracksRes.ok) {
            const tracks = await tracksRes.json();
            setTopTracks(tracks);
          }

          // Fetch top artists
          const artistsRes = await fetch(`/api/spotify-stats/guild/${firstGuildId}/top-artists?limit=10`, {
            credentials: "include"
          });
          if (artistsRes.ok) {
            const artists = await artistsRes.json();
            setTopArtists(artists);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch Spotify stats:", error);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/spotify-stats/export", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spotify-stats-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("✔ Export downloaded");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("✗ Failed to export");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleClearStats() {
    if (!guildId) {
      setMessage("✗ No guild ID found");
      return;
    }

    if (!confirm("Are you sure you want to clear all Spotify stats? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/spotify-stats/guild/${guildId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setMessage("✔ Spotify stats cleared");
        fetchData();
      } else {
        setMessage("✗ Failed to clear stats");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Failed to clear stats");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[800px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        <WindowDecoration title="Spotify Stats Manager" onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-4">
          {/* Export/Clear buttons */}
          <div className="flex gap-3 mb-4">
            <Button variant="primary" size="sm" onClick={handleExport}>
              Export Database
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearStats}>
              Clear All Stats
            </Button>
          </div>

          {message && (
            <div className={`mb-4 p-2 border text-sm ${
              message.startsWith("✔")
                ? "border-green-400 text-green-400"
                : "border-red-400 text-red-400"
            }`}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-white">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Tracked Users Section */}
              <div>
                <h3 className="text-[#39ff14] font-bold mb-3 text-lg">
                  Tracked Users ({trackedUsers.length})
                </h3>
                {trackedUsers.length === 0 ? (
                  <div className="text-gray-400 text-sm">
                    No users being tracked yet. Use <code className="bg-[#1a1a1f] px-2 py-1">/trackmusic add @user</code> in Discord to start tracking.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {trackedUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="p-3 bg-[#1a1a1f] border border-gray-700"
                      >
                        <div className="text-white font-bold text-sm">
                          {user.username}
                        </div>
                        <div className="text-gray-500 text-xs font-mono mt-1">
                          ID: {user.user_id}
                        </div>
                        {user.last_seen && (
                          <div className="text-gray-400 text-xs mt-1">
                            Last seen: {new Date(user.last_seen).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Tracks Section */}
              {topTracks.length > 0 && (
                <div className="border-t border-[#39ff14]/30 pt-4">
                  <h3 className="text-[#39ff14] font-bold mb-3">
                    🎵 Top Tracks (All-Time)
                  </h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {topTracks.map((track, i) => (
                      <div
                        key={`${track.track_name}-${track.artist}`}
                        className="flex items-center gap-3 p-2 bg-[#1a1a1f] border border-gray-700"
                      >
                        <span className="text-gray-400 text-sm w-6">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-bold truncate">
                            {track.track_name}
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            {track.artist}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#1db954] text-sm font-bold">
                            {track.play_count} plays
                          </div>
                          {track.unique_listeners > 1 && (
                            <div className="text-gray-400 text-xs">
                              {track.unique_listeners} listeners
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Artists Section */}
              {topArtists.length > 0 && (
                <div className="border-t border-[#39ff14]/30 pt-4">
                  <h3 className="text-[#39ff14] font-bold mb-3">
                    🎤 Top Artists (All-Time)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                    {topArtists.map((artist, i) => (
                      <div
                        key={artist.artist}
                        className="flex justify-between items-center p-2 bg-[#1a1a1f] border border-gray-700"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-gray-400 text-sm">{i + 1}.</span>
                          <span className="text-white text-sm font-bold truncate">
                            {artist.artist}
                          </span>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-[#1db954] text-sm font-bold">
                            {artist.play_count}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {artist.unique_tracks} tracks
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {trackedUsers.length > 0 && topTracks.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-8">
                  No listening data yet. Make sure tracked users have Spotify connected to Discord and are playing music!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-[#090909] border-t border-[#39ff14]/30 text-gray-500 text-xs">
          Use <code className="text-[#39ff14]">/trackmusic</code> in Discord to manage tracked users.
          Weekly recaps are posted automatically on Sundays at 12:00 PM.
        </div>
      </div>
    </div>
  );
}
