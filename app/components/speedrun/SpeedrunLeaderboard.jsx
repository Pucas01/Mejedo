"use client";
import { useState, useEffect } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import Button from "../ui/Button";
import { useTheme } from '../../hooks/useTheme';

export default function SpeedrunLeaderboard({ show, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    time: "",
    date: "",
    version: "",
    notes: ""
  });
  const { isAdmin } = useCurrentUser();
  const { theme } = useTheme();

  useEffect(() => {
    if (show) {
      fetchLeaderboard();
    }
  }, [show]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/speedrun-leaderboard");
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch speedrun leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const [minutes, rest] = formData.time.split(':');
    const [seconds, ms] = rest.split('.');
    const totalMs =
      parseInt(minutes) * 60 * 1000 +
      parseInt(seconds) * 1000 +
      parseInt(ms);

    try {
      const response = await fetch("/api/speedrun-leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          time: totalMs,
          date: formData.date,
          version: formData.version,
          notes: formData.notes
        })
      });

      if (response.ok) {
        setFormData({ name: "", time: "", date: "", version: "", notes: "" });
        setShowAddForm(false);
        fetchLeaderboard();
      } else {
        alert("Failed to add speedrun entry");
      }
    } catch (error) {
      console.error("Error adding speedrun:", error);
      alert("Error adding speedrun entry");
    }
  };

  const handleDelete = async (index) => {
    if (!confirm("Are you sure you want to delete this speedrun entry?")) return;

    try {
      const response = await fetch("/api/speedrun-leaderboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ index })
      });

      if (response.ok) {
        fetchLeaderboard();
      } else {
        alert("Failed to delete speedrun entry");
      }
    } catch (error) {
      console.error("Error deleting speedrun:", error);
      alert("Error deleting speedrun entry");
    }
  };

  if (!show) return null;

  const handleClose = () => {
    onClose();
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms
      .toString()
      .padStart(3, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-[#121217] border-2 ${theme.colors.border} shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp`}
      >
        <WindowDecoration
          title="Speedrun Leaderboard - records.txt"
          onClose={handleClose}
          theme={theme.name}
        />

        <div className={`px-6 py-4 bg-[#090909] border-b ${theme.colors.border}/30`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h2 className={`${theme.colors.text} text-xl font-bold mb-1`}>
                Website Speedrun
              </h2>
              <p className="text-gray-400 text-sm">All achievements</p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "Cancel" : "+ Add"}
              </Button>
            )}
          </div>
        </div>

        {isAdmin && showAddForm && (
          <div className={`px-6 py-4 bg-[#090909] border-b ${theme.colors.accent}/30`}>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: "Runner Name", key: "name", type: "text" },
                {
                  label: "Time (MM:SS.mmm)",
                  key: "time",
                  type: "text",
                  placeholder: "20:34.567",
                  pattern: "\\d+:\\d{2}\\.\\d{3}",
                  mono: true
                },
                { label: "Date", key: "date", type: "date" },
                {
                  label: "Version",
                  key: "version",
                  type: "text",
                  placeholder: "v3.1.2"
                },
                { label: "Notes (Optional)", key: "notes", type: "text", optional: true }
              ].map(({ label, key, type, placeholder, pattern, mono }) => (
                <div key={key}>
                  <label className="text-gray-400 text-sm">{label}</label>
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    pattern={pattern}
                    required={!placeholder?.includes("Optional")}
                    className={`w-full bg-[#121217] border ${theme.colors.accent}/30 ${theme.colors.text} px-3 py-2 ${
                      mono ? "font-mono" : ""
                    } focus:outline-none focus:border ${theme.colors.accent}`}
                  />
                </div>
              ))}
              <Button type="submit" variant="primary" className="w-full">
                Add Speedrun
              </Button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No speedruns recorded yet!
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                leaderboard.reduce((acc, entry) => {
                  const version = entry.version || "Unknown";
                  if (!acc[version]) acc[version] = [];
                  acc[version].push(entry);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([version, entries]) => (
                  <div key={version} className="space-y-3">
                    <div className={`border-b ${theme.colors.border}/30 pb-2`}>
                      <h3 className={`${theme.colors.text} font-bold text-lg`}>
                        {version}
                      </h3>
                      <p className="text-gray-500 text-xs">
                        {entries.length} run{entries.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {entries.map((entry, index) => (
                      <div
                        key={index}
                        className={`
                          flex items-center gap-4 p-4 border transition-all
                          ${
                            index === 0
                              ? "border-[#FFD700] bg-[#FFD700]/10 shadow-lg shadow-[#FFD700]/20"
                              : index === 1
                              ? "border-[#C0C0C0] bg-[#C0C0C0]/10"
                              : index === 2
                              ? "border-[#CD7F32] bg-[#CD7F32]/10"
                              : `${theme.colors.border} ${theme.colors.accent}/5`
                          }
                        `}
                      >
                        <div
                          className={`
                            text-2xl w-12 text-center font-bold font-mono
                            ${
                              index === 0
                                ? "text-[#FFD700]"
                                : index === 1
                                ? "text-[#C0C0C0]"
                                : index === 2
                                ? "text-[#CD7F32]"
                                : theme.colors.text
                            }
                          `}
                        >
                          #{index + 1}
                        </div>

                        <div className="flex-1">
                          <div className={`${theme.colors.text} font-bold text-lg`}>
                            {entry.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {entry.date && (
                              <div className="text-gray-400">
                                {new Date(entry.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </div>
                            )}
                            {entry.version && (
                              <div className="text-gray-500">• {entry.version}</div>
                            )}
                          </div>
                          {entry.notes && (
                            <div className="text-gray-500 text-xs mt-1 italic">
                              {entry.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div
                            className={`
                              font-mono text-xl font-bold
                              ${
                                index === 0
                                  ? "text-[#FFD700]"
                                  : index === 1
                                  ? "text-[#C0C0C0]"
                                  : index === 2
                                  ? "text-[#CD7F32]"
                                  : theme.colors.text
                              }
                            `}
                          >
                            {formatTime(entry.time)}
                          </div>
                          {index === 0 &&
                            version === leaderboard[0].version && (
                              <div className="text-[#FFD700] text-xs mt-1">
                                WORLD RECORD
                              </div>
                            )}
                        </div>

                        {isAdmin && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleDelete(leaderboard.indexOf(entry))
                            }
                            title="Delete entry"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div
          className={`px-6 py-3 bg-[#090909] border-t ${theme.colors.border}/30 text-gray-500 text-sm`}
        >
          <div className="text-center text-xs">
            To submit your speedrun: Record your attempt and DM your time + proof
            to my discord "pucas01"
          </div>
        </div>
      </div>
    </div>
  );
}
