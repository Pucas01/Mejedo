"use client";
import { useState, useEffect } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { useAchievements } from "../../../hooks/useAchievements";

export default function HoYoLabWidget() {
  const { theme } = useTheme();
  const { updateStats } = useAchievements();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ltokenInput, setLtokenInput] = useState("");
  const [ltuidInput, setLtuidInput] = useState("");
  const [showCookieForm, setShowCookieForm] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch("/api/auth/status", {
          credentials: "include"
        });
        const data = await res.json();
        setIsAdmin(data.isAuthenticated);
      } catch (err) {
        console.error("Failed to check admin status:", err);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, []);

  // Check if cookie is configured on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/hoyolab/status");
      const status = await res.json();
      setConfigured(status.configured);

      if (status.configured) {
        fetchZZZData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to check HoYoLab status:", err);
      setLoading(false);
    }
  };

  const fetchZZZData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic data
      const basicRes = await fetch("/api/hoyolab/zzz");
      const basicData = await basicRes.json();

      if (!basicRes.ok) {
        throw new Error(basicData.error || "Failed to fetch ZZZ data");
      }

      setData(basicData.data);

      // Track achievement for viewing ZZZ stats
      updateStats("viewedZZZStats", true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCookie = async (e) => {
    e.preventDefault();

    if (!ltokenInput.trim() || !ltuidInput.trim()) {
      setError("Please enter both cookie values");
      return;
    }

    try {
      const res = await fetch("/api/hoyolab/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          ltoken_v2: ltokenInput.trim(),
          ltuid_v2: ltuidInput.trim()
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Admin authentication required. Please log in.");
        }
        throw new Error(result.error || "Failed to set cookies");
      }

      setConfigured(true);
      setShowCookieForm(false);
      setLtokenInput("");
      setLtuidInput("");
      fetchZZZData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Loading ZZZ data...</p>
      </div>
    );
  }

  // Show cookie setup form if not configured
  if (!configured || showCookieForm) {
    return (
      <div className="flex flex-col h-full p-4 text-white overflow-auto">
        <h3 className={`${theme.colors.text} mb-4 text-lg font-bold`}>HoYoLab Setup</h3>

        <div className="mb-4 text-sm space-y-2">
          <p>To use this widget, you need your HoYoLab cookies:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Log into <a href="https://www.hoyolab.com/home" target="_blank" rel="noopener noreferrer" className={`${theme.colors.text} underline`}>HoYoLab</a></li>
            <li>
              <strong>Firefox:</strong> Press F12 → Storage tab → Cookies → hoyolab.com
              <br />
              <strong>Chrome:</strong> Press F12 → Application tab → Cookies → hoyolab.com
            </li>
            <li>Find and copy the <strong>Value</strong> for each cookie:</li>
          </ol>
        </div>

        <form onSubmit={handleSetCookie} className="space-y-3">
          <div>
            <label className={`block text-xs ${theme.colors.text} mb-1`}>ltoken_v2</label>
            <input
              type="text"
              value={ltokenInput}
              onChange={(e) => setLtokenInput(e.target.value)}
              placeholder="Paste ltoken_v2 value here..."
              className={`w-full p-2 bg-black border ${theme.colors.border} text-white text-xs font-mono focus:outline-none focus:${theme.colors.border}`}
            />
          </div>

          <div>
            <label className={`block text-xs ${theme.colors.text} mb-1`}>ltuid_v2</label>
            <input
              type="text"
              value={ltuidInput}
              onChange={(e) => setLtuidInput(e.target.value)}
              placeholder="Paste ltuid_v2 value here..."
              className={`w-full p-2 bg-black border ${theme.colors.border} text-white text-xs font-mono focus:outline-none focus:${theme.colors.border}`}
            />
          </div>

          {error && (
            <div className="text-[#FF5555] text-xs">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className={`px-4 py-2 ${theme.button.gradient} ${theme.button.hover} border-2 ${theme.button.borderTop} ${theme.button.borderBottom} ${theme.button.shadow} ${theme.button.activeTop} ${theme.button.activeBottom} ${theme.button.activeShadow} text-white text-sm transition-all`}
            >
              Save Cookie
            </button>

            {configured && (
              <button
                type="button"
                onClick={() => setShowCookieForm(false)}
                className="px-4 py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm border-2 border-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-4">
        <p className="text-[#FF5555] mb-4">{error}</p>
        <button
          onClick={() => setShowCookieForm(true)}
          className={`px-4 py-2 ${theme.button.gradient} ${theme.button.hover} border-2 ${theme.button.borderTop} ${theme.button.borderBottom} ${theme.button.shadow} ${theme.button.activeTop} ${theme.button.activeBottom} ${theme.button.activeShadow} text-white text-sm transition-all`}
        >
          Update Cookie
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>No ZZZ data available</p>
      </div>
    );
  }

  // Display ZZZ game record data
  const gameData = data;

  // Handle different possible data structures
  const stats = gameData.stats || gameData.data || [];
  const list = gameData.list || [];

  return (
    <div className="flex flex-col h-full p-4 text-white overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className={`${theme.colors.text} text-lg font-bold`}>Zenless Zone Zero</h3>
        {isAdmin && (
          <button
            onClick={() => setShowCookieForm(true)}
            className={`text-xs text-gray-400 ${theme.colors.hover} transition-colors`}
          >
            ⚙️ Settings
          </button>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {/* Player Info */}
        <div className={`${theme.colors.text} font-bold text-base pb-2 border-b ${theme.colors.border.replace('border-', 'border-b-')}`}>
          Player Info
        </div>

        {gameData.nickname && (
          <div>
            <span className={theme.colors.text}>Player:</span>{" "}
            <span>{gameData.nickname}</span>
          </div>
        )}

        {gameData.level !== undefined && (
          <div>
            <span className={theme.colors.text}>Level:</span>{" "}
            <span>{gameData.level}</span>
          </div>
        )}

        {(gameData.region_name || gameData.region) && (
          <div>
            <span className={theme.colors.text}>Region:</span>{" "}
            <span>{gameData.region_name || gameData.region}</span>
          </div>
        )}

        {/* Game Stats */}
        {stats.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className={`${theme.colors.text} font-bold text-base pb-2 border-b ${theme.colors.border.replace('border-', 'border-b-')}`}>
              Game Stats
            </div>
            {stats.map((stat, index) => (
              <div key={index}>
                <span className={theme.colors.text}>{stat.name}:</span>{" "}
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`mt-4 pt-4 border-t ${theme.colors.border.replace('border-', 'border-t-')}`}>
          <button
            onClick={fetchZZZData}
            className={`w-full px-4 py-2 ${theme.button.gradient} ${theme.button.hover} border-2 ${theme.button.borderTop} ${theme.button.borderBottom} ${theme.button.shadow} ${theme.button.activeTop} ${theme.button.activeBottom} ${theme.button.activeShadow} text-white text-sm transition-all`}
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
