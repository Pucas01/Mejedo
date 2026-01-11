"use client";
import { useState, useEffect } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import Button from "../ui/Button";

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

    // Convert time from MM:SS.mmm format to milliseconds
    const [minutes, rest] = formData.time.split(':');
    const [seconds, ms] = rest.split('.');
    const totalMs = (parseInt(minutes) * 60 * 1000) + (parseInt(seconds) * 1000) + parseInt(ms);

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
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Window Decoration */}
        <WindowDecoration title="Speedrun Leaderboard - records.txt" onClose={handleClose} />

        {/* Header */}
        <div className="px-6 py-4 bg-[#090909] border-b border-[#39ff14]/30">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h2 className="text-[#39ff14] text-xl font-bold mb-1">Website Speedrun</h2>
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

        {/* Add Form (Admin Only) */}
        {isAdmin && showAddForm && (
          <div className="px-6 py-4 bg-[#090909] border-b border-[#39ff14]/30">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm">Runner Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#121217] border border-[#39ff14]/30 text-[#39ff14] px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Time (MM:SS.mmm)</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="20:34.567"
                  pattern="\d+:\d{2}\.\d{3}"
                  className="w-full bg-[#121217] border border-[#39ff14]/30 text-[#39ff14] px-3 py-2 font-mono focus:outline-none focus:border-[#39ff14]"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#121217] border border-[#39ff14]/30 text-[#39ff14] px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="v3.1.2"
                  className="w-full bg-[#121217] border border-[#39ff14]/30 text-[#39ff14] px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#121217] border border-[#39ff14]/30 text-[#39ff14] px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Add Speedrun
              </Button>
            </form>
          </div>
        )}

        {/* Leaderboard */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No speedruns recorded yet!</div>
          ) : (
            <div className="space-y-6">
              {/* Group by version */}
              {Object.entries(
                leaderboard.reduce((acc, entry) => {
                  const version = entry.version || 'Unknown';
                  if (!acc[version]) acc[version] = [];
                  acc[version].push(entry);
                  return acc;
                }, {})
              )
              // Sort versions in descending order (newest first)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([version, entries]) => (
                <div key={version} className="space-y-3">
                  {/* Version Header */}
                  <div className="border-b border-[#39ff14]/30 pb-2">
                    <h3 className="text-[#39ff14] font-bold text-lg">{version}</h3>
                    <p className="text-gray-500 text-xs">{entries.length} run{entries.length !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Runs for this version */}
                  {entries.map((entry, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-4 p-4 border transition-all
                    ${index === 0
                      ? 'border-[#FFD700] bg-[#FFD700]/10 shadow-lg shadow-[#FFD700]/20'
                      : index === 1
                      ? 'border-[#C0C0C0] bg-[#C0C0C0]/10'
                      : index === 2
                      ? 'border-[#CD7F32] bg-[#CD7F32]/10'
                      : 'border-[#39ff14] bg-[#39ff14]/5'
                    }
                  `}
                >
                  {/* Rank */}
                  <div className={`
                    text-2xl w-12 text-center font-bold font-mono
                    ${index === 0
                      ? 'text-[#FFD700]'
                      : index === 1
                      ? 'text-[#C0C0C0]'
                      : index === 2
                      ? 'text-[#CD7F32]'
                      : 'text-[#39ff14]'
                    }
                  `}>
                    #{index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="text-[#39ff14] font-bold text-lg">{entry.name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {entry.date && (
                        <div className="text-gray-400">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {entry.version && (
                        <div className="text-gray-500">
                          • {entry.version}
                        </div>
                      )}
                    </div>
                    {entry.notes && (
                      <div className="text-gray-500 text-xs mt-1 italic">{entry.notes}</div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <div className={`
                      font-mono text-xl font-bold
                      ${index === 0
                        ? 'text-[#FFD700]'
                        : index === 1
                        ? 'text-[#C0C0C0]'
                        : index === 2
                        ? 'text-[#CD7F32]'
                        : 'text-[#39ff14]'
                      }
                    `}>
                      {formatTime(entry.time)}
                    </div>
                    {index === 0 && version === leaderboard[0].version && (
                      <div className="text-[#FFD700] text-xs mt-1">WORLD RECORD</div>
                    )}
                  </div>

                  {/* Delete Button (Admin Only) */}
                  {isAdmin && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(leaderboard.indexOf(entry))}
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

        {/* Footer */}
        <div className="px-6 py-3 bg-[#090909] border-t border-[#39ff14]/30 text-gray-500 text-sm">
          <div className="text-center text-xs">
            To submit your speedrun: Record your attempt and DM your time + proof to my discord "pucas01"
          </div>
        </div>
      </div>
    </div>
  );
}
