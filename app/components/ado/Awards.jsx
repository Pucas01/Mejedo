"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Sticker from "../stickers/Sticker";
import Button from "../ui/Button";
import { useCurrentUser } from "../../hooks/CurrentUser.js";

export default function Awards() {
  const [awards, setAwards] = useState([]);
  const [editingAward, setEditingAward] = useState(null);
  const [awardsCmd, setAwardsCmd] = useState("");
  const [doneAwards, setDoneAwards] = useState(false);
  const [syncingAwards, setSyncingAwards] = useState(false);
  const { isAdmin } = useCurrentUser();

  // Intersection observer state
  const awardsRef = useRef(null);
  const [awardsInView, setAwardsInView] = useState(false);

  const awardsCommand = "cat ~/ado/awards.log";

  // Fetch awards from API
  const fetchAwards = async () => {
    try {
      const res = await fetch("/api/ado-awards");
      const data = await res.json();
      setAwards(data);
    } catch (err) {
      console.error("Failed to load awards:", err);
    }
  };

  useEffect(() => {
    fetchAwards();
  }, []);

  // Intersection observer for typing animation
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px"
    };

    const awardsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !awardsInView) {
          setAwardsInView(true);
        }
      });
    }, observerOptions);

    if (awardsRef.current) {
      awardsObserver.observe(awardsRef.current);
    }

    return () => {
      if (awardsRef.current) {
        awardsObserver.unobserve(awardsRef.current);
      }
    };
  }, [awardsInView]);

  const handleAddAward = async () => {
    const newAward = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      ceremony: "New Ceremony",
      category: "New Category",
      work: "",
      result: "",
      won: false,
    };

    try {
      await fetch("/api/ado-awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAward),
        credentials: "include",
      });
      fetchAwards();
    } catch (err) {
      console.error("Failed to add award:", err);
    }
  };

  const handleDeleteAward = async (id) => {
    if (!confirm("Are you sure you want to delete this award?")) return;
    try {
      await fetch(`/api/ado-awards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchAwards();
    } catch (err) {
      console.error("Failed to delete award:", err);
    }
  };

  const handleSaveAward = async (updatedAward) => {
    try {
      await fetch(`/api/ado-awards/${updatedAward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAward),
        credentials: "include",
      });

      setEditingAward(null);
      fetchAwards();
    } catch (err) {
      console.error("Failed to save award:", err);
    }
  };

  const handleSyncFromWikipedia = async () => {
    if (!confirm("This will fetch award data from Wikipedia and merge it with existing awards. Continue?")) {
      return;
    }

    setSyncingAwards(true);
    try {
      const res = await fetch("/api/ado-awards-scraper/sync", {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        alert(`Success! Added ${result.newAwards} new awards from Wikipedia. Total: ${result.totalAwards}`);
        fetchAwards();
      } else {
        alert(`Error: ${result.error || "Failed to sync awards"}\n${result.message || ""}`);
        if (result.debug) {
          console.log("Debug info:", result.debug);
        }
      }
    } catch (err) {
      console.error("Failed to sync awards from Wikipedia:", err);
      alert("Failed to sync awards from Wikipedia. Check console for details.");
    } finally {
      setSyncingAwards(false);
    }
  };

  const handleDebugWikipedia = async () => {
    try {
      const res = await fetch("/api/ado-awards-scraper/debug", {
        credentials: "include",
      });

      const result = await res.json();
      console.log("Wikipedia Debug Info:", result);
      alert(`Found ${result.sections.length} sections. Check console for details.`);
    } catch (err) {
      console.error("Debug failed:", err);
      alert("Debug failed. Check console for details.");
    }
  };

  // Awards terminal typing animation
  useEffect(() => {
    if (!awardsInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setAwardsCmd(awardsCommand.slice(0, i));
      i++;
      if (i > awardsCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneAwards(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [awardsInView]);

  // Group awards by year
  const awardsByYear = awards.reduce((acc, award) => {
    if (!acc[award.year]) {
      acc[award.year] = [];
    }
    acc[award.year].push(award);
    return acc;
  }, {});

  const years = Object.keys(awardsByYear).sort((a, b) => b - a);

  return (
    <div ref={awardsRef} className="bg-[#121217] min-h-[400px] border-2 border-[#39ff14] shadow-lg relative flex flex-col overflow-hidden">
      <WindowDecoration title="Ado - ~/awards" showControls={true} />
      <div className="p-8 flex-1 relative">
        <Sticker
          src="/stickers/futaba-pointing.png"
          position="top-right"
          size={70}
          rotation={-10}
          offset={{ x: 15, y: -10 }}
        />
        {!doneAwards && (
          <div className="text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{awardsCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneAwards && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <header className="text-2xl text-[#39ff14] font-bold">
                Awards & Nominations
              </header>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDebugWikipedia}
                  >
                    Debug Wiki
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSyncFromWikipedia}
                    disabled={syncingAwards}
                  >
                    {syncingAwards ? "Syncing..." : "Sync from Wikipedia"}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddAward}>
                    Add Award
                  </Button>
                </div>
              )}
            </div>

            {awards.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p className="text-base">No awards added yet.</p>
                <p className="text-xs mt-1">Check back later for award updates!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {years.map((year) => (
                  <div key={year} className="border border-[#39ff14]/30 p-3">
                    <h3 className="text-lg text-[#39ff14] font-bold mb-2">{year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {awardsByYear[year].map((award) => (
                        <div key={award.id}>
                          {editingAward?.id === award.id ? (
                            <div className="bg-[#1a1a1f] border-2 border-[#39ff14] p-3 space-y-2 col-span-full">
                              <input
                                type="number"
                                value={editingAward.year}
                                onChange={(e) =>
                                  setEditingAward({ ...editingAward, year: parseInt(e.target.value) })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Year"
                              />
                              <input
                                type="text"
                                value={editingAward.ceremony}
                                onChange={(e) =>
                                  setEditingAward({ ...editingAward, ceremony: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Ceremony"
                              />
                              <input
                                type="text"
                                value={editingAward.category}
                                onChange={(e) =>
                                  setEditingAward({ ...editingAward, category: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Category"
                              />
                              <input
                                type="text"
                                value={editingAward.work}
                                onChange={(e) =>
                                  setEditingAward({ ...editingAward, work: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Work/Song"
                              />
                              <input
                                type="text"
                                value={editingAward.result}
                                onChange={(e) =>
                                  setEditingAward({ ...editingAward, result: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Result (Won/Nominated)"
                              />
                              <label className="flex items-center gap-2 text-white">
                                <input
                                  type="checkbox"
                                  checked={editingAward.won}
                                  onChange={(e) =>
                                    setEditingAward({ ...editingAward, won: e.target.checked })
                                  }
                                  className="w-4 h-4"
                                />
                                <span>Won</span>
                              </label>
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSaveAward(editingAward)}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setEditingAward(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className={`bg-[#1a1a1f]/50 border p-2 flex justify-between items-start gap-2 ${award.won ? 'border-[#39ff14]' : 'border-[#39ff14]/30'}`}>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[#39ff14] font-bold text-sm truncate">
                                  {award.ceremony}
                                </h4>
                                <p className="text-gray-300 text-xs">{award.category}</p>
                                {award.work && (
                                  <p className="text-gray-400 text-xs mt-0.5">
                                    <span className="text-[#39ff14]">Work:</span> {award.work}
                                  </p>
                                )}
                                <p className={`text-xs mt-0.5 ${award.won ? 'text-[#39ff14] font-semibold' : 'text-gray-500'}`}>
                                  {award.result || (award.won ? "Won" : "Nominated")}
                                </p>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setEditingAward(award)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteAward(award.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
