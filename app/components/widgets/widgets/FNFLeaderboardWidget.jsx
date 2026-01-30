"use client";
import { useState, useEffect } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { useCurrentUser } from "../../../hooks/CurrentUser";
import Button from "../../ui/Button";

export default function FNFLeaderboardWidget({ isMinimized }) {
  const { theme } = useTheme();
  const { isAdmin } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myScores, setMyScores] = useState([]);
  const [username, setUsername] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");

  // Load stored scores
  const loadScores = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/newgrounds/fnf/my-scores");
      const data = await res.json();

      if (!data.username) {
        setNeedsSetup(true);
      } else {
        setMyScores(data.scores || []);
        setUsername(data.username);
        setLastUpdated(data.lastUpdated);
        setNeedsSetup(false);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load scores:", err);
      setError("Failed to load scores");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isMinimized) {
      loadScores();
    }
  }, [isMinimized]);

  // Refresh scores from Newgrounds (admin only)
  const handleRefresh = async () => {
    if (!isAdmin) {
      setError("Only admins can refresh scores");
      return;
    }

    const usernameToRefresh = username || setupUsername;

    if (!usernameToRefresh) {
      setError("Please enter your Newgrounds username");
      return;
    }

    try {
      setRefreshing(true);
      setError(null);

      const res = await fetch("/api/newgrounds/fnf/refresh-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameToRefresh }),
      });

      const data = await res.json();
      setMyScores(data.scores || []);
      setUsername(data.username);
      setLastUpdated(data.lastUpdated);
      setNeedsSetup(false);
    } catch (err) {
      console.error("Failed to refresh scores:", err);
      setError("Failed to refresh scores");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatRank = (rank) => {
    return `#${rank}`;
  };

  if (isMinimized) return null;

  return (
    <div className="flex flex-col h-full gap-3 text-white p-2 overflow-hidden">
      {/* Header */}
      <div className={`border ${theme.colors.border} p-2`}>
        <h2 className={`text-lg font-bold ${theme.colors.text} mb-2`}>
          My FNF Scores
        </h2>

        {needsSetup ? (
          /* Setup View */
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Enter your Newgrounds username to start tracking scores:
            </p>
            {isAdmin ? (
              <>
                <input
                  type="text"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
                  placeholder="Newgrounds username..."
                  className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1 text-sm"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? "Fetching..." : "Fetch Scores"}
                </Button>
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Contact admin to set up score tracking
              </p>
            )}
          </div>
        ) : (
          /* Stats View */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Player:</span>
              <span className={theme.colors.text}>{username}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-xs text-gray-500">
                {formatDate(lastUpdated)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Scores:</span>
              <span className={theme.colors.text}>{myScores.length}</span>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full"
              >
                {refreshing ? "Refreshing..." : "Refresh Scores"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`border ${theme.colors.border} p-2 text-center`}>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#39ff14]"></div>
        </div>
      ) : myScores.length > 0 ? (
        /* Scores List (sorted by best rank) */
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {myScores.map((score, idx) => (
              <div
                key={idx}
                className={`p-2 border ${theme.colors.border} ${
                  idx < 3 ? "bg-[#39ff14]/10" : "bg-[#121217]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-bold">
                    {score.scoreboard}
                  </span>
                  <span className={`font-bold ${theme.colors.text}`}>
                    {score.score.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={
                      score.rank <= 100
                        ? "text-yellow-400"
                        : score.rank <= 500
                        ? "text-green-400"
                        : "text-gray-400"
                    }
                  >
                    Global Rank: {formatRank(score.rank)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !needsSetup && (
          <div className={`border ${theme.colors.border} p-4 text-center`}>
            <p className="text-gray-400 mb-2">No scores found</p>
            <p className="text-xs text-gray-500">
              Make sure you've played FNF on Newgrounds
            </p>
          </div>
        )
      )}

      {/* Info Footer */}
      {myScores.length > 0 && (
        <div className={`border ${theme.colors.border} p-2`}>
          <p className="text-xs text-gray-500 text-center">
            Scores auto-refresh daily at 3 AM
          </p>
        </div>
      )}
    </div>
  );
}
