"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";

export default function ToursTimeline() {
  const [tours, setTours] = useState([]);
  const [editingTour, setEditingTour] = useState(null);
  const [toursCmd, setToursCmd] = useState("");
  const [doneTours, setDoneTours] = useState(false);
  const [syncingTours, setSyncingTours] = useState(false);
  const { isAdmin } = useCurrentUser();
  const { updateStats } = useAchievements();

  // Timeline drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const timelineRef = useRef(null);

  // Intersection observer state
  const toursRef = useRef(null);
  const [toursInView, setToursInView] = useState(false);

  const toursCommand = "cat ~/ado/tours.log";

  // Mouse drag handlers for timeline
  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeft(timelineRef.current.scrollLeft);
    timelineRef.current.style.cursor = "url('/cursors/Move.cur'), move";
    timelineRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (timelineRef.current) {
      timelineRef.current.style.cursor = "url('/cursors/Normal.cur'), auto";
      timelineRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (timelineRef.current) {
      timelineRef.current.style.cursor = "url('/cursors/Normal.cur'), auto";
      timelineRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    timelineRef.current.scrollLeft = scrollLeft - walk;

    // Trigger achievement when user scrolls the timeline
    updateStats("scrolledAdoTimeline", true);
  };

  // Fetch tours from API
  const fetchTours = async () => {
    try {
      const res = await fetch("/api/ado-tours");
      const data = await res.json();
      // Sort by date ascending (oldest first for timeline)
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTours(sorted);
    } catch (err) {
      console.error("Failed to load tours:", err);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // Intersection observer for typing animation
  useEffect(() => {
    const observerOptions = {
      threshold: 1.0, // Only trigger when entire terminal is in view
      rootMargin: "0px"
    };

    const toursObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !toursInView) {
          setToursInView(true);
        }
      });
    }, observerOptions);

    if (toursRef.current) {
      toursObserver.observe(toursRef.current);
    }

    return () => {
      if (toursRef.current) {
        toursObserver.unobserve(toursRef.current);
      }
    };
  }, [toursInView]);

  // Animate scroll from left to right after tours are loaded and animation is done
  useEffect(() => {
    if (doneTours && timelineRef.current && tours.length > 0) {
      // First, ensure we're at the start (left)
      timelineRef.current.scrollLeft = 0;

      // Then animate to the right after a short delay
      setTimeout(() => {
        if (timelineRef.current) {
          const start = 0;
          const end = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
          const duration = 2000; // 2 seconds for smooth scroll
          const startTime = performance.now();

          const animateScroll = (currentTime) => {
            if (!timelineRef.current) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease in-out cubic - smooth acceleration and deceleration
            const easeInOutCubic = progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            timelineRef.current.scrollLeft = start + (end - start) * easeInOutCubic;

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };

          requestAnimationFrame(animateScroll);
        }
      }, 400);
    }
  }, [doneTours, tours]);

  // Track manual scrolling (mouse wheel, trackpad)
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const handleScroll = () => {
      updateStats("scrolledAdoTimeline", true);
    };

    timeline.addEventListener('scroll', handleScroll);
    return () => {
      timeline.removeEventListener('scroll', handleScroll);
    };
  }, [updateStats]);

  const handleAddTour = async () => {
    const newTour = {
      id: Date.now().toString(),
      tourName: "New Tour/Event",
      date: "",
      venue: "",
      location: "",
      notes: "",
    };

    try {
      await fetch("/api/ado-tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTour),
        credentials: "include",
      });
      fetchTours();
    } catch (err) {
      console.error("Failed to add tour:", err);
    }
  };

  const handleDeleteTour = async (id) => {
    if (!confirm("Are you sure you want to delete this tour date?")) return;
    try {
      await fetch(`/api/ado-tours/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchTours();
    } catch (err) {
      console.error("Failed to delete tour:", err);
    }
  };

  const handleSaveTour = async (updatedTour) => {
    try {
      await fetch(`/api/ado-tours/${updatedTour.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTour),
        credentials: "include",
      });

      setEditingTour(null);
      fetchTours();
    } catch (err) {
      console.error("Failed to save tour:", err);
    }
  };

  const handleSyncFromWikipedia = async () => {
    if (!confirm("This will fetch tour data from Wikipedia and merge it with existing tours. Continue?")) {
      return;
    }

    setSyncingTours(true);
    try {
      const res = await fetch("/api/ado-tours-scraper/sync", {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        alert(`Success! Added ${result.newTours} new tours from Wikipedia. Total: ${result.totalTours}`);
        fetchTours();
      } else {
        alert(`Error: ${result.error || "Failed to sync tours"}\n${result.message || ""}`);
        if (result.debug) {
          console.log("Debug info:", result.debug);
        }
      }
    } catch (err) {
      console.error("Failed to sync tours from Wikipedia:", err);
      alert("Failed to sync tours from Wikipedia. Check console for details.");
    } finally {
      setSyncingTours(false);
    }
  };

  const handleDebugWikipedia = async () => {
    try {
      const res = await fetch("/api/ado-tours-scraper/debug", {
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

  // Tours terminal typing animation
  useEffect(() => {
    if (!toursInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setToursCmd(toursCommand.slice(0, i));
      i++;
      if (i > toursCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneTours(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [toursInView]);

  return (
    <div ref={toursRef} className="bg-[#121217] min-h-[370px] border-2 border-[#4169e1] shadow-lg relative flex flex-col overflow-hidden">
      <WindowDecoration title="Ado - ~/tours" showControls={true} theme="ado" />
      <div className="p-8 flex-1 relative">
        {!doneTours && (
          <div className="text-xl flex flex-wrap">
            <span className="text-[#4169e1]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{toursCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneTours && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <header className="text-2xl text-[#4169e1] font-bold">
                Tours & Concerts
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
                    disabled={syncingTours}
                  >
                    {syncingTours ? "Syncing..." : "Sync from Wikipedia"}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddTour}>
                    Add Tour Date
                  </Button>
                </div>
              )}
            </div>

            {tours.length === 0 ? (
              <div className="text-gray-400 text-center py-12">
                <p className="text-lg">No tour dates added yet.</p>
                <p className="text-sm mt-2">Check back later for upcoming shows!</p>
              </div>
            ) : (
              <div
                ref={timelineRef}
                className="relative overflow-x-auto pb-8 scrollbar-hide border-2 border-[#4169e1]/20 hover:border-[#4169e1]/40 transition-colors p-4"
                style={{ cursor: "url('/cursors/Normal.cur'), auto" }}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                {/* Horizontal timeline line */}
                <div className="absolute left-0 right-0 top-10 h-0.5 bg-[#4169e1]/30" style={{ width: `${tours.length * 350}px` }}></div>

                <div className="flex gap-8 min-w-max">
                  {tours.map((tour, index) => (
                    <div key={tour.id} className="relative flex flex-col items-center" style={{ width: '320px' }}>
                      {/* Timeline dot */}
                      <div className="w-4 h-4 bg-[#4169e1] rounded-full border-4 border-[#121217] relative z-10 mb-6"></div>

                      {editingTour?.id === tour.id ? (
                        <div className="bg-[#1a1a1f] border-2 border-[#4169e1] p-4 space-y-3 w-full">
                          <input
                            type="text"
                            value={editingTour.tourName}
                            onChange={(e) =>
                              setEditingTour({ ...editingTour, tourName: e.target.value })
                            }
                            className="w-full bg-[#0a0a0f] border border-[#4169e1] text-white p-2 text-sm"
                            placeholder="Tour/Event Name"
                          />
                          <input
                            type="date"
                            value={editingTour.date}
                            onChange={(e) =>
                              setEditingTour({ ...editingTour, date: e.target.value })
                            }
                            className="w-full bg-[#0a0a0f] border border-[#4169e1] text-white p-2 text-sm"
                            placeholder="Date"
                          />
                          <input
                            type="text"
                            value={editingTour.venue}
                            onChange={(e) =>
                              setEditingTour({ ...editingTour, venue: e.target.value })
                            }
                            className="w-full bg-[#0a0a0f] border border-[#4169e1] text-white p-2 text-sm"
                            placeholder="Venue"
                          />
                          <input
                            type="text"
                            value={editingTour.location}
                            onChange={(e) =>
                              setEditingTour({ ...editingTour, location: e.target.value })
                            }
                            className="w-full bg-[#0a0a0f] border border-[#4169e1] text-white p-2 text-sm"
                            placeholder="Location (City, Country)"
                          />
                          <input
                            type="text"
                            value={editingTour.notes}
                            onChange={(e) =>
                              setEditingTour({ ...editingTour, notes: e.target.value })
                            }
                            className="w-full bg-[#0a0a0f] border border-[#4169e1] text-white p-2 text-sm"
                            placeholder="Notes (optional)"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSaveTour(editingTour)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setEditingTour(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#1a1a1f]/50 border border-[#4169e1]/30 p-4 hover:border-[#4169e1] transition-colors w-full flex flex-col">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            {/* Date Badge */}
                            <div className="inline-block bg-[#4169e1]/10 border border-[#4169e1] px-3 py-1">
                              <span className="text-[#4169e1] text-xs font-mono">
                                {tour.date && (() => {
                                  // Check if notes contain multi-year info like "Tour ran from 2022 to 2023"
                                  const multiYearMatch = tour.notes?.match(/Tour ran from (\d{4}) to (\d{4})/);
                                  if (multiYearMatch) {
                                    return `${multiYearMatch[1]}–${multiYearMatch[2]}`;
                                  }
                                  // Otherwise just show the year
                                  return new Date(tour.date).getFullYear();
                                })()}
                              </span>
                            </div>

                            {/* Admin Controls */}
                            {isAdmin && (
                              <div className="flex gap-1">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setEditingTour(tour)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteTour(tour.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Tour Name */}
                          <h4 className="text-[#4169e1] font-bold text-base mb-2">
                            {tour.tourName}
                          </h4>

                          {/* Venue & Location */}
                          {tour.venue && (
                            <p className="text-gray-300 text-xs flex items-start gap-1">
                              <span className="text-[#4169e1]">📍</span>
                              <span>{tour.venue}</span>
                            </p>
                          )}
                          {tour.location && (
                            <p className="text-gray-400 text-xs ml-4">{tour.location}</p>
                          )}

                          {/* Notes */}
                          {tour.notes && (
                            <p className="text-gray-400 text-xs mt-2 italic border-l-2 border-[#4169e1]/30 pl-2">
                              {tour.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
