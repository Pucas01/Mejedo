"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Sticker from "../stickers/Sticker";
import Button from "../ui/Button";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";
import ToursTimeline from "./ToursTimeline.jsx";
import Awards from "./Awards.jsx";

export default function Ado() {
  const [infoCmd, setInfoCmd] = useState("");
  const [doneInfo, setDoneInfo] = useState(false);
  const [performancesCmd, setPerformancesCmd] = useState("");
  const [donePerformances, setDonePerformances] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const { isAdmin } = useCurrentUser();
  const { updateStats } = useAchievements();

  // Refs for intersection observer
  const infoRef = useRef(null);
  const performancesRef = useRef(null);
  const [infoInView, setInfoInView] = useState(false);
  const [performancesInView, setPerformancesInView] = useState(false);

  const infoCommand = "cat ~/ado/info.txt";
  const performancesCommand = "ls -la ~/ado/performances/";

  // Fetch performances from API
  const fetchPerformances = async () => {
    try {
      const res = await fetch("/api/ado");
      const data = await res.json();
      setPerformances(data);
    } catch (err) {
      console.error("Failed to load performances:", err);
    }
  };

  useEffect(() => {
    fetchPerformances();
  }, []);

  // Intersection observer for info section
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px"
    };

    const infoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !infoInView) {
          setInfoInView(true);
        }
      });
    }, observerOptions);

    if (infoRef.current) {
      infoObserver.observe(infoRef.current);
    }

    return () => {
      if (infoRef.current) {
        infoObserver.unobserve(infoRef.current);
      }
    };
  }, [infoInView]);

  // Intersection observer for performances section
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px"
    };

    const performancesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !performancesInView) {
          setPerformancesInView(true);
        }
      });
    }, observerOptions);

    if (performancesRef.current) {
      performancesObserver.observe(performancesRef.current);
    }

    return () => {
      if (performancesRef.current) {
        performancesObserver.unobserve(performancesRef.current);
      }
    };
  }, [performancesInView]);

  const handleAddPerformance = async () => {
    const newPerformance = {
      id: Date.now().toString(),
      title: "New Performance",
      videoId: "",
      description: "",
      year: "",
    };

    try {
      await fetch("/api/ado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerformance),
        credentials: "include",
      });
      fetchPerformances();
    } catch (err) {
      console.error("Failed to add performance:", err);
    }
  };

  const handleDeletePerformance = async (id) => {
    if (!confirm("Are you sure you want to delete this performance?")) return;
    try {
      await fetch(`/api/ado/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchPerformances();
    } catch (err) {
      console.error("Failed to delete performance:", err);
    }
  };

  const handleSavePerformance = async (updatedPerformance) => {
    try {
      await fetch(`/api/ado/${updatedPerformance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPerformance),
        credentials: "include",
      });

      setEditingPerformance(null);
      fetchPerformances();
    } catch (err) {
      console.error("Failed to save performance:", err);
    }
  };


  // Info terminal typing animation
  useEffect(() => {
    if (!infoInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setInfoCmd(infoCommand.slice(0, i));
      i++;
      if (i > infoCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneInfo(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [infoInView]);

  // Performances terminal typing animation
  useEffect(() => {
    if (!doneInfo || !performancesInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setPerformancesCmd(performancesCommand.slice(0, i));
      i++;
      if (i > performancesCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDonePerformances(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [doneInfo, performancesInView]);


  return (
    <div className="flex flex-col gap-4 p-4 text-xl min-h-screen text-white justify-start">
      {/* Info terminal */}
      <div ref={infoRef} className="bg-[#121217] min-h-[540px] border-2 border-[#39ff14] shadow-lg relative flex flex-col overflow-hidden">
        <WindowDecoration title="Ado - info.txt" showControls={true} />
        <div className="p-8 flex-1 relative">
          <Sticker
            src="/stickers/futaba-pointing.png"
            position="top-right"
            size={70}
            rotation={10}
            offset={{ x: 20, y: -20 }}
          />
          {!doneInfo && (
            <div className="text-xl flex flex-wrap">
              <span className="text-[#39ff14]">pucas01</span>
              <span className="text-white">@</span>
              <span className="text-[#D73DA3]">PucasArch</span>
              <span className="text-white">:</span>
              <span className="text-[#FF5555]">~</span>
              <span className="text-white">$</span>
              <span className="text-white">&nbsp;{infoCmd}</span>
              <span className="cursor animate-blink">|</span>
            </div>
          )}
          {doneInfo && (
            <div className="space-y-4 mt-2">
              <header className="text-3xl text-[#39ff14] font-bold">Ado (アド)</header>
              <div className="text-gray-300 space-y-3 text-lg leading-relaxed">
                <p>
                  <span className="text-[#39ff14]">Born:</span> October 24, 2002
                </p>
                <p>
                  <span className="text-[#39ff14]">Origin:</span> Tokyo, Japan
                </p>
                <p>
                  <span className="text-[#39ff14]">Genres:</span> J-Pop, Rock, Electronic
                </p>
                <p className="pt-2">
                  Ado is a Japanese singer. In 2020, at the age of 17, she made her debut with the
                  digital single "Usseewa", which peaked at number 1 on Billboard Japan Hot 100, Oricon
                  Digital Singles Chart, and the Oricon Streaming Chart. The song reached 100 million
                  plays on Billboard Japan after 17 weeks from charting-in, which was the sixth fastest
                  in history and the youngest for a solo singer.
                </p>
                <p>
                  In 2022, her song "New Genesis" was used as the theme song for the anime film One
                  Piece Film: Red, and topped Apple Music's Global Top 100 charts. She became the
                  first Japanese female artist to achieve this. In the same year, her song "Show"
                  was featured in the opening theme of the anime series Oshi no Ko.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Source:{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Ado_(singer)"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#39ff14] underline decoration-wavy underline-offset-2"
                  >
                    Wikipedia - Ado (singer)
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tours timeline component */}
      <ToursTimeline />

      {/* Awards component */}
      <Awards />

      {/* Performances section */}
      <div ref={performancesRef} className="bg-[#121217] border-2 border-[#39ff14] shadow-lg relative flex flex-col overflow-hidden">
          <WindowDecoration title="Ado - ~/performances" showControls={true} />
          <div className="p-8 flex-1 relative">
            <Sticker
              src="/stickers/futaba-jacket.png"
              position="bottom-left"
              size={75}
              rotation={-8}
              offset={{ x: -20, y: 20 }}
            />
            {!donePerformances && (
              <div className="text-xl flex flex-wrap">
                <span className="text-[#39ff14]">pucas01</span>
                <span className="text-white">@</span>
                <span className="text-[#D73DA3]">PucasArch</span>
                <span className="text-white">:</span>
                <span className="text-[#FF5555]">~</span>
                <span className="text-white">$</span>
                <span className="text-white">&nbsp;{performancesCmd}</span>
                <span className="cursor animate-blink">|</span>
              </div>
            )}
            {donePerformances && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <header className="text-2xl text-[#39ff14] font-bold">
                    Live Performances
                  </header>
                  {isAdmin && (
                    <Button variant="primary" size="sm" onClick={handleAddPerformance}>
                      Add Performance
                    </Button>
                  )}
                </div>

                {performances.length === 0 ? (
                  <div className="text-gray-400 text-center py-12">
                    <p className="text-lg">No performances added yet.</p>
                    <p className="text-sm mt-2">Check back later for curated live performances!</p>
                  </div>
                ) : (
                  <>
                    {/* Video grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                      {performances.map((perf) => (
                        <div
                          key={perf.id}
                          className="border-2 border-[#39ff14] bg-[#1a1a1f] p-4 relative"
                        >
                          {editingPerformance?.id === perf.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingPerformance.title}
                                onChange={(e) =>
                                  setEditingPerformance({ ...editingPerformance, title: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Title"
                              />
                              <input
                                type="text"
                                value={editingPerformance.videoId}
                                onChange={(e) =>
                                  setEditingPerformance({ ...editingPerformance, videoId: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="YouTube Video ID"
                              />
                              <input
                                type="text"
                                value={editingPerformance.description}
                                onChange={(e) =>
                                  setEditingPerformance({ ...editingPerformance, description: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Description"
                              />
                              <input
                                type="text"
                                value={editingPerformance.year}
                                onChange={(e) =>
                                  setEditingPerformance({ ...editingPerformance, year: e.target.value })
                                }
                                className="w-full bg-[#0a0a0f] border border-[#39ff14] text-white p-2 text-sm"
                                placeholder="Year"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSavePerformance(editingPerformance)}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setEditingPerformance(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="aspect-video bg-black mb-3 relative overflow-hidden cursor-pointer hover:bg-black/80 transition-colors"
                                onClick={() => {
                                  setSelectedVideo(perf);
                                  updateStats("watchedAdoPerformance", true);
                                }}
                              >
                                {perf.videoId ? (
                                  <>
                                    <img
                                      src={`https://img.youtube.com/vi/${perf.videoId}/maxresdefault.jpg`}
                                      alt={perf.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors">
                                      <svg className="w-16 h-16 text-[#39ff14]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-500">
                                    No video ID set
                                  </div>
                                )}
                              </div>
                              <h3 className="text-[#39ff14] font-bold text-lg mb-1">{perf.title}</h3>
                              <p className="text-gray-400 text-sm mb-1">{perf.description}</p>
                              <p className="text-gray-500 text-xs">{perf.year}</p>
                              {isAdmin && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setEditingPerformance(perf)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeletePerformance(perf.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Video player modal */}
                    {selectedVideo && (
                      <div
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
                        onClick={() => setSelectedVideo(null)}
                      >
                        <div
                          className="bg-[#121217] border-2 border-[#39ff14] max-w-5xl w-full animate-slideUp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WindowDecoration
                            title={selectedVideo.title}
                            showControls={true}
                            onClose={() => setSelectedVideo(null)}
                          />
                          <div className="p-4">
                            <div className="aspect-video bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>
                            <div className="mt-4 text-gray-300">
                              <p className="text-lg">{selectedVideo.description}</p>
                              <p className="text-sm text-gray-500 mt-2">Released: {selectedVideo.year}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* External Links */}
                <div className="border-t-2 border-[#39ff14] pt-6 mt-8">
                  <h3 className="text-xl text-[#39ff14] font-bold mb-3">External Links</h3>
                  <div className="text-gray-300 space-y-2 text-base">
                    <p>
                      <span className="text-[#39ff14]">YouTube:</span>{" "}
                      <a
                        href="https://www.youtube.com/@Ado1024"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#39ff14] underline decoration-wavy underline-offset-4"
                      >
                        @Ado1024
                      </a>
                    </p>
                    <p>
                      <span className="text-[#39ff14]">Spotify:</span>{" "}
                      <a
                        href="https://open.spotify.com/artist/6mEQK9m2krja6X1cfsAjfl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#39ff14] underline decoration-wavy underline-offset-4"
                      >
                        Ado
                      </a>
                    </p>
                    <p>
                      <span className="text-[#39ff14]">Twitter:</span>{" "}
                      <a
                        href="https://twitter.com/ado1024imokenp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#39ff14] underline decoration-wavy underline-offset-4"
                      >
                        @ado1024imokenp
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
