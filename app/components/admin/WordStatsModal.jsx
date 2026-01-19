"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration";
import Button from "../ui/Button";

export default function WordStatsModal({ show, onClose }) {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildStats, setGuildStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filtered, setFiltered] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      fetchGuilds();
    }
  }, [show]);

  async function fetchGuilds() {
    setLoading(true);
    try {
      const res = await fetch("/api/word-stats/guilds", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGuilds(data);
      }
    } catch (error) {
      console.error("Failed to fetch guilds:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGuildStats(guildId) {
    try {
      const res = await fetch(`/api/word-stats/guild/${guildId}?filtered=${filtered}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setGuildStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch guild stats:", error);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/word-stats/export", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `word-stats-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Export downloaded");
      }
    } catch (error) {
      setMessage("Failed to export");
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/word-stats/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setMessage("Import successful");
        fetchGuilds();
      } else {
        setMessage("Import failed");
      }
    } catch (error) {
      setMessage("Invalid JSON file");
    }

    e.target.value = "";
  }

  async function handleClearGuild(guildId) {
    if (!confirm("Are you sure you want to clear all stats for this server?")) return;

    try {
      const res = await fetch(`/api/word-stats/guild/${guildId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setMessage("Guild stats cleared");
        setSelectedGuild(null);
        setGuildStats(null);
        fetchGuilds();
      }
    } catch (error) {
      setMessage("Failed to clear stats");
    }
  }

  function selectGuild(guild) {
    setSelectedGuild(guild);
    fetchGuildStats(guild.guild_id);
  }

  useEffect(() => {
    if (selectedGuild) {
      fetchGuildStats(selectedGuild.guild_id);
    }
  }, [filtered]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[700px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        <WindowDecoration title="Word Stats Manager" onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-4">
          {/* Export/Import buttons */}
          <div className="flex gap-3 mb-4">
            <Button variant="primary" size="sm" onClick={handleExport}>
              Export Database
            </Button>
            <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Import Database
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>

          {message && (
            <div className="mb-4 p-2 border border-[#39ff14] text-[#39ff14] text-sm">
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-white">Loading...</div>
          ) : guilds.length === 0 ? (
            <div className="text-gray-400">No word stats recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Guild list */}
              <div>
                <h3 className="text-[#39ff14] font-bold mb-2">Servers with Stats</h3>
                <div className="space-y-2">
                  {guilds.map((guild) => (
                    <div
                      key={guild.guild_id}
                      className={`p-3 border cursor-pointer transition-colors ${
                        selectedGuild?.guild_id === guild.guild_id
                          ? "border-[#39ff14] bg-[#39ff14]/10"
                          : "border-gray-600 hover:border-[#39ff14]/50"
                      }`}
                      onClick={() => selectGuild(guild)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-mono text-sm">{guild.guild_id}</div>
                          <div className="text-gray-400 text-xs">
                            {guild.user_count} users | {guild.unique_words} unique words | {guild.total_words} total
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearGuild(guild.guild_id);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected guild stats */}
              {selectedGuild && guildStats && (
                <div className="border-t border-[#39ff14]/30 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[#39ff14] font-bold">Top Words</h3>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtered}
                        onChange={(e) => setFiltered(e.target.checked)}
                        className="accent-[#39ff14]"
                      />
                      Filter common words
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                    {guildStats.topWords.map((word, i) => (
                      <div
                        key={word.word}
                        className="flex justify-between p-2 bg-[#1a1a1f] border border-gray-700 text-sm"
                      >
                        <span className="text-gray-400">{i + 1}.</span>
                        <span className="text-white flex-1 ml-2">{word.word}</span>
                        <span className="text-[#39ff14]">{word.total_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-[#090909] border-t border-[#39ff14]/30 text-gray-500 text-xs">
          Export to backup, import to restore. Clear removes all data for that server.
        </div>
      </div>
    </div>
  );
}
