"use client";

import { useState, useEffect } from "react";
import WindowDecoration from "../window/WindowDecoration";
import Button from "../ui/Button";

export default function GameStatsModal({ show, onClose, discordGuildId }) {
  const [topGames, setTopGames] = useState([]);
  const [topGamers, setTopGamers] = useState([]);
  const [allGuilds, setAllGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [optedOutCount, setOptedOutCount] = useState(0);
  const [activeTab, setActiveTab] = useState("stats");
  const [selectedGuildId, setSelectedGuildId] = useState(null);
  const [guildStats, setGuildStats] = useState(null);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  useEffect(() => {
    if (allGuilds.length > 0 && !selectedGuildId) {
      const guildToSelect = discordGuildId || allGuilds[0]?.guild_id;
      if (guildToSelect) {
        setSelectedGuildId(guildToSelect);
        fetchGuildStats(guildToSelect);
      }
    }
  }, [allGuilds, discordGuildId]);

  async function fetchData() {
    setLoading(true);
    try {

      const exportRes = await fetch("/api/game-stats/export", { credentials: "include" });
      if (exportRes.ok) {
        const data = await exportRes.json();
        setOptedOutCount(data.global_optout_gaming?.length || 0);
      }

      const guildsRes = await fetch("/api/game-stats/all-guilds", { credentials: "include" });
      if (guildsRes.ok) {
        const guilds = await guildsRes.json();
        setAllGuilds(guilds);

        if (guilds.length === 0) {
          setActiveTab("guilds");
        }
      }
    } catch (error) {
      console.error("Failed to fetch game stats:", error);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGuildStats(guildId) {
    if (!guildId) return;

    try {

      const gamesRes = await fetch(`/api/game-stats/guild/${guildId}/top-games?limit=10`, {
        credentials: "include"
      });
      if (gamesRes.ok) {
        const games = await gamesRes.json();
        setTopGames(games);
      }

      const gamersRes = await fetch(`/api/game-stats/guild/${guildId}/top-gamers?limit=10`, {
        credentials: "include"
      });
      if (gamersRes.ok) {
        const gamers = await gamersRes.json();
        setTopGamers(gamers);
      }

      const statsRes = await fetch(`/api/game-stats/guild/${guildId}/stats`, {
        credentials: "include"
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setGuildStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch guild stats:", error);
      setMessage("Failed to load guild stats");
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/game-stats/export", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `game-stats-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Export downloaded");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Failed to export");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleClearStats() {
    if (!selectedGuildId) {
      setMessage("No guild selected");
      return;
    }

    if (!confirm("Are you sure you want to clear all game stats for this guild? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/game-stats/guild/${selectedGuildId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setMessage("Game stats cleared");
        fetchData();
        fetchGuildStats(selectedGuildId);
      } else {
        setMessage("Failed to clear stats");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to clear stats");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function formatHours(seconds) {
    if (!seconds) return "0h";
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
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
        <WindowDecoration title="Game Stats Manager" onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-4">
          
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
          </div>

          
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
              message.includes("Failed") || message.includes("No guild")
                ? "border-red-400 text-red-400"
                : "border-green-400 text-green-400"
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
                  No guilds with gaming data yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {allGuilds.map((guild) => (
                    <div
                      key={guild.guild_id}
                      className="p-3 bg-[#1a1a1f] border border-gray-700 cursor-pointer hover:border-[#39ff14] transition-colors"
                      onClick={() => {
                        setSelectedGuildId(guild.guild_id);
                        setActiveTab("stats");
                        fetchGuildStats(guild.guild_id);
                      }}
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
                          <span className="text-gray-400">Gamers:</span>{" "}
                          <span className="text-white font-bold">{guild.gamer_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Sessions:</span>{" "}
                          <span className="text-white font-bold">{guild.session_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Hours:</span>{" "}
                          <span className="text-white font-bold">{formatHours(guild.total_seconds)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              
              {allGuilds.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[#39ff14] text-sm font-bold mb-2">Select Guild</label>
                  <select
                    value={selectedGuildId || ""}
                    onChange={(e) => {
                      setSelectedGuildId(e.target.value);
                      fetchGuildStats(e.target.value);
                    }}
                    className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 text-sm"
                  >
                    {allGuilds.map((guild) => (
                      <option key={guild.guild_id} value={guild.guild_id}>
                        {guild.guild_name || guild.guild_id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              
              {guildStats && (
                <div className="bg-[#1a1a1f] border border-[#39ff14] p-4 mb-4">
                  <h3 className="text-[#39ff14] font-bold mb-3">Guild Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Total Gaming Hours</div>
                      <div className="text-white font-bold text-xl">{formatHours(guildStats.total_seconds)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Total Sessions</div>
                      <div className="text-white font-bold text-xl">{guildStats.total_sessions}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Active Gamers</div>
                      <div className="text-white font-bold text-xl">{guildStats.unique_players}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Unique Games</div>
                      <div className="text-white font-bold text-xl">{guildStats.unique_games}</div>
                    </div>
                  </div>
                </div>
              )}

              
              <div className="bg-[#1a1a1f] border border-[#39ff14] p-4">
                <h3 className="text-[#39ff14] font-bold mb-3">Top Games (All-Time)</h3>
                {topGames.length === 0 ? (
                  <div className="text-gray-400 text-sm">No games tracked yet</div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {topGames.map((game, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-[#121217] border border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-bold">
                            {index + 1}. {game.game_name}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {game.session_count} sessions - {game.unique_players} players
                          </div>
                        </div>
                        <div className="text-[#39ff14] font-bold text-sm">
                          {formatHours(game.total_seconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="bg-[#1a1a1f] border border-[#39ff14] p-4">
                <h3 className="text-[#39ff14] font-bold mb-3">Top Gamers (All-Time)</h3>
                {topGamers.length === 0 ? (
                  <div className="text-gray-400 text-sm">No gamers tracked yet</div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {topGamers.map((gamer, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-[#121217] border border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-bold">
                            {index + 1}. User {gamer.user_id.slice(-4)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {gamer.session_count} sessions - {gamer.unique_games} games
                          </div>
                        </div>
                        <div className="text-[#39ff14] font-bold text-sm">
                          {formatHours(gamer.total_seconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="bg-[#1a1a1f] border border-gray-700 p-3 text-xs text-gray-400">
                <p className="mb-1">Database: config/game-stats.db</p>
                <p className="mb-1">Opted Out Users: {optedOutCount}</p>
                <p>All-time stats - Weekly stats reset on recap</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
