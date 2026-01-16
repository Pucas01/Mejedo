"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";
import { useCurrentUser } from "../../hooks/CurrentUser.js";

export default function Discography() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discographyCmd, setDiscographyCmd] = useState("");
  const [doneDiscography, setDoneDiscography] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "album", "single"
  const [expanded, setExpanded] = useState(false); // View more toggle
  const { isAdmin } = useCurrentUser();

  // Intersection observer state
  const discographyRef = useRef(null);
  const [discographyInView, setDiscographyInView] = useState(false);

  const discographyCommand = "ls -la ~/ado/discography/";

  // Fetch discography from API
  const fetchDiscography = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ado-discography");
      const data = await res.json();
      setAlbums(data);
    } catch (err) {
      console.error("Failed to load discography:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscography();
  }, []);

  // Intersection observer for typing animation
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px"
    };

    const discographyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !discographyInView) {
          setDiscographyInView(true);
        }
      });
    }, observerOptions);

    if (discographyRef.current) {
      discographyObserver.observe(discographyRef.current);
    }

    return () => {
      if (discographyRef.current) {
        discographyObserver.unobserve(discographyRef.current);
      }
    };
  }, [discographyInView]);

  // Discography terminal typing animation
  useEffect(() => {
    if (!discographyInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setDiscographyCmd(discographyCommand.slice(0, i));
      i++;
      if (i > discographyCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneDiscography(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [discographyInView]);

  const handleRefreshDiscography = async () => {
    if (!confirm("This will refresh the discography from Spotify. Continue?")) {
      return;
    }

    setRefreshing(true);
    try {
      const res = await fetch("/api/ado-discography/refresh", {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        alert(`Success! Loaded ${result.count} releases from Spotify.`);
        fetchDiscography();
      } else {
        alert(`Error: ${result.error || "Failed to refresh discography"}`);
      }
    } catch (err) {
      console.error("Failed to refresh discography:", err);
      alert("Failed to refresh discography. Check console for details.");
    } finally {
      setRefreshing(false);
    }
  };

  // Filter albums based on selected filter
  const filteredAlbums = albums.filter(album => {
    if (filter === "all") return true;
    return album.type === filter;
  });

  // Limit to 12 items when collapsed
  const displayLimit = 12;
  const shouldShowViewMore = filteredAlbums.length > displayLimit;
  const displayedAlbums = expanded ? filteredAlbums : filteredAlbums.slice(0, displayLimit);

  return (
    <div ref={discographyRef} className="bg-[#121217] border-2 border-[#4169e1] shadow-lg relative flex flex-col overflow-hidden">
      <WindowDecoration title="Ado - ~/discography" showControls={true} theme="ado" />
      <div className="p-8 flex-1 relative">
        {!doneDiscography && (
          <div className="text-xl flex flex-wrap">
            <span className="text-[#4169e1]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{discographyCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneDiscography && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <header className="text-2xl text-[#4169e1] font-bold">
                Discography
              </header>
              <div className="flex gap-2 items-center flex-wrap">
                {/* Filter buttons */}
                <div className="flex gap-1 border border-[#4169e1]/30 p-1">
                  <Button
                    variant={filter === "all" ? "primary" : "default"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    All ({albums.length})
                  </Button>
                  <Button
                    variant={filter === "album" ? "primary" : "default"}
                    size="sm"
                    onClick={() => setFilter("album")}
                  >
                    Albums ({albums.filter(a => a.type === "album").length})
                  </Button>
                  <Button
                    variant={filter === "single" ? "primary" : "default"}
                    size="sm"
                    onClick={() => setFilter("single")}
                  >
                    Singles ({albums.filter(a => a.type === "single").length})
                  </Button>
                </div>

                {isAdmin && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRefreshDiscography}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "Refresh from Spotify"}
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#4169e1]"></div>
                  <p className="text-sm">Loading discography...</p>
                </div>
              </div>
            ) : filteredAlbums.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p className="text-base">No releases found.</p>
                <p className="text-xs mt-1">Try adjusting the filter or refresh from Spotify.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {displayedAlbums.map((album) => (
                    <a
                      key={album.id}
                      href={album.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-[#1a1a1f] border border-[#4169e1]/20 hover:border-[#4169e1] transition-all flex flex-col"
                    >
                      {/* Album Cover */}
                      <div className="aspect-square bg-black relative overflow-hidden">
                        {album.coverUrl ? (
                          <img
                            src={album.coverUrl}
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            No Cover
                          </div>
                        )}
                        {/* Type badge */}
                        <div className="absolute top-1 right-1 bg-[#4169e1]/90 px-1.5 py-0.5 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold uppercase text-center">
                            {album.type === "album" ? "Album" : "Single"}
                          </span>
                        </div>
                      </div>

                      {/* Album Info */}
                      <div className="p-2 flex-1 flex flex-col items-center text-center">
                        <h4 className="text-[#4169e1] text-xs font-bold line-clamp-2 group-hover:text-white transition-colors mb-1">
                          {album.name}
                        </h4>
                        <p className="text-gray-500 text-[10px]">
                          {album.year}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* View More Button */}
                {shouldShowViewMore && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? `View Less` : `View All (${filteredAlbums.length} releases)`}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Spotify Attribution */}
            <div className="border-t border-[#4169e1]/30 pt-4 mt-6">
              <p className="text-gray-500 text-xs">
                Discography powered by{" "}
                <a
                  href="https://open.spotify.com/artist/6mEQK9m2krja6X1cfsAjfl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4169e1] hover:underline"
                >
                  Spotify
                </a>
                . Click any release to listen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
