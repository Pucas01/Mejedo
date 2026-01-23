"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration";
import Button from "../ui/Button";

export default function SpotifyStatsModal({ show, onClose, discordGuildId }) {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [allGuilds, setAllGuilds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [optedOutCount, setOptedOutCount] = useState(0);
  const [activeTab, setActiveTab] = useState("stats"); // "stats", "guilds", "users"
  const [selectedGuildId, setSelectedGuildId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  useEffect(() => {
    // When guilds are loaded, auto-select a guild for the Stats tab
    if (allGuilds.length > 0 && !selectedGuildId) {
      // Prefer the configured guild ID, otherwise use the first guild
      const guildToSelect = discordGuildId || allGuilds[0].guild_id;
      setSelectedGuildId(guildToSelect);
      fetchGuildStats(guildToSelect);
    }
  }, [allGuilds, discordGuildId]);

  async function fetchData() {
    setLoading(true);
    try {
      // Get opted out count (for info purposes)
      const exportRes = await fetch("/api/spotify-stats/export", { credentials: "include" });
      if (exportRes.ok) {
        const data = await exportRes.json();
        setOptedOutCount(data.optedOut?.length || 0);
      }

      // Fetch all guilds
      const guildsRes = await fetch("/api/spotify-stats/all-guilds", { credentials: "include" });
      if (guildsRes.ok) {
        const guilds = await guildsRes.json();
        setAllGuilds(guilds);

        // If no guilds exist, default to showing guilds tab
        if (guilds.length === 0) {
          setActiveTab("guilds");
        }
      }

      // Fetch all users
      const usersRes = await fetch("/api/spotify-stats/all-users", { credentials: "include" });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setAllUsers(users);
      }
    } catch (error) {
      console.error("Failed to fetch Spotify stats:", error);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGuildStats(guildId) {
    if (!guildId) return;

    try {
      // Fetch top tracks
      const tracksRes = await fetch(`/api/spotify-stats/guild/${guildId}/top-tracks?limit=10`, {
        credentials: "include"
      });
      if (tracksRes.ok) {
        const tracks = await tracksRes.json();
        setTopTracks(tracks);
      }

      // Fetch top artists
      const artistsRes = await fetch(`/api/spotify-stats/guild/${guildId}/top-artists?limit=10`, {
        credentials: "include"
      });
      if (artistsRes.ok) {
        const artists = await artistsRes.json();
        setTopArtists(artists);
      }
    } catch (error) {
      console.error("Failed to fetch guild stats:", error);
      setMessage("Failed to load guild stats");
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
    if (!selectedGuildId) {
      setMessage("✗ No guild selected");
      return;
    }

    if (!confirm("Are you sure you want to clear all Spotify stats for this guild? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/spotify-stats/guild/${selectedGuildId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setMessage("✔ Spotify stats cleared");
        fetchData();
        fetchGuildStats(selectedGuildId);
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
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-[#39ff14]/30 pb-2">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === "stats"
                  ? "text-[#39ff14] border-b-2 border-[#39ff14]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab("guilds")}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === "guilds"
                  ? "text-[#39ff14] border-b-2 border-[#39ff14]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Guilds ({allGuilds.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === "users"
                  ? "text-[#39ff14] border-b-2 border-[#39ff14]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Users ({allUsers.length})
            </button>
          </div>

          {/* Export/Clear buttons */}
          <div className="flex gap-3 mb-4">
            <Button variant="primary" size="sm" onClick={handleExport}>
              Export Database
            </Button>
            {activeTab === "stats" && selectedGuildId && (
              <Button variant="danger" size="sm" onClick={handleClearStats}>
                Clear Guild Stats
              </Button>
            )}
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
          ) : activeTab === "guilds" ? (
            <div className="space-y-4">
              <h3 className="text-[#39ff14] font-bold text-lg">All Guilds</h3>
              {allGuilds.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8 border border-gray-700 bg-[#1a1a1f]">
                  No guilds with listening data yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {allGuilds.map((guild) => (
                    <div
                      key={guild.guild_id}
                      className="p-3 bg-[#1a1a1f] border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white text-sm font-bold">{guild.guild_name || 'Unknown Guild'}</div>
                          <div className="font-mono text-gray-400 text-xs">{guild.guild_id}</div>
                        </div>
                        {guild.guild_id === selectedGuildId && (
                          <span className="text-xs bg-[#39ff14] text-black px-2 py-1 font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Users:</span>{" "}
                          <span className="text-white font-bold">{guild.user_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Listens:</span>{" "}
                          <span className="text-white font-bold">{guild.total_listens}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Tracks:</span>{" "}
                          <span className="text-white font-bold">{guild.unique_tracks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "users" ? (
            <div className="space-y-4">
              <h3 className="text-[#39ff14] font-bold text-lg">All Users</h3>
              {allUsers.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8 border border-gray-700 bg-[#1a1a1f]">
                  No users with listening data yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {allUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="p-3 bg-[#1a1a1f] border border-gray-700"
                    >
                      <div className="mb-2">
                        <div className="text-white text-sm font-bold">{user.display_name || user.username || 'Unknown User'}</div>
                        <div className="font-mono text-gray-400 text-xs">{user.user_id}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Guilds:</span>{" "}
                          <span className="text-white font-bold">{user.guild_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Listens:</span>{" "}
                          <span className="text-white font-bold">{user.total_listens}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Tracks:</span>{" "}
                          <span className="text-white font-bold">{user.unique_tracks}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last:</span>{" "}
                          <span className="text-white text-[10px]">
                            {user.last_listen ? new Date(user.last_listen).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Guild Selector */}
              {allGuilds.length > 1 && (
                <div className="mb-4">
                  <label className="text-gray-400 text-sm mb-2 block">Select Guild:</label>
                  <select
                    value={selectedGuildId || ""}
                    onChange={(e) => {
                      const newGuildId = e.target.value;
                      setSelectedGuildId(newGuildId);
                      fetchGuildStats(newGuildId);
                    }}
                    className="w-full bg-[#1a1a1f] border border-gray-700 text-white px-3 py-2 text-sm"
                  >
                    {allGuilds.map((guild) => (
                      <option key={guild.guild_id} value={guild.guild_id}>
                        {guild.guild_name || 'Unknown Guild'} ({guild.user_count} users, {guild.total_listens} listens)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* System Info Section */}
              <div className="p-4 bg-[#1a1a1f] border-2 border-[#39ff14]/30">
                <h3 className="text-[#39ff14] font-bold mb-3 text-lg">
                  Tracking System
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white">
                    <span>Tracking Mode:</span>
                    <span className="text-[#1db954] font-bold">Opt-Out (Everyone tracked by default)</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Users Opted Out:</span>
                    <span className="font-mono">{optedOutCount}</span>
                  </div>
                  {selectedGuildId && (
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span>Selected Guild:</span>
                      <span className="font-mono">{selectedGuildId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Tracks Section */}
              {topTracks.length > 0 && (
                <div className="border-t border-[#39ff14]/30 pt-4">
                  <h3 className="text-[#39ff14] font-bold mb-3">
                    Top Tracks (All-Time)
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
                    Top Artists (All-Time)
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
              {topTracks.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-8 border border-gray-700 bg-[#1a1a1f]">
                  No listening data yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
