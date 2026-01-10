"use client";
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// Achievement definitions
export const ACHIEVEMENTS = {
  // Activity achievements
  first_visit: {
    id: "first_visit",
    name: "Welcome!",
    description: "Visit the website for the first time",
    icon: "",
    hidden: false,
  },
  explorer: {
    id: "explorer",
    name: "Navigator",
    description: "Visit all pages on this futabalistios site",
    icon: "",
    hidden: false,
  },
  rhythm_master: {
    id: "rhythm_master",
    name: "Rhythm games and stuff",
    description: "Score over 1000 points in the rhythm game",
    icon: "",
    hidden: false,
  },
  guestbook_signer: {
    id: "guestbook_signer",
    name: "Signature Signed",
    description: "Leave a message in the guestbook",
    icon: "",
    hidden: false,
  },
  blog_reader: {
    id: "blog_reader",
    name: "Why would you read this",
    description: "Read a blog post",
    icon: "",
    hidden: false,
  },
  collection_viewer: {
    id: "collection_viewer",
    name: "You know peak",
    description: "View a console and a manga from the collection",
    icon: "",
    hidden: false,
  },
  changelog_reader: {
    id: "changelog_reader",
    name: "Stupid Nerd",
    description: "Read the changelog like a fucking nerd",
    icon: "",
    hidden: false,
  },
  junpei_clicker: {
    id: "junpei_clicker",
    name: "Junpei I-Yuri",
    description: "Miku what the fuck are you doing here",
    icon: "",
    hidden: false,
  },
  stalker: {
    id: "stalker",
    name: "Stalker",
    description: "Click on one of my social links",
    icon: "",
    hidden: false,
  },
  button_copier: {
    id: "button_copier",
    name: "Cool person!!!",
    description: "Copy my button code because your cool",
    icon: "",
    hidden: false,
  },
  guestbook_visitor: {
    id: "guestbook_visitor",
    name: "Branching out",
    description: "Visit someone's website from the guestbook",
    icon: "",
    hidden: false,
  },
  // Hidden achievements
  konami_master: {
    id: "konami_master",
    name: "Konami Code",
    description: "Enter the da code",
    icon: "",
    hidden: true,
  },
  futaba_fan: {
    id: "futaba_fan",
    name: "ALL OUT ATACK",
    description: "Find the all out atack easter egg",
    icon: "",
    hidden: true,
  },
  click_happy: {
    id: "click_happy",
    name: "Carpal Tunnel ",
    description: "Click on Futaba 10 times",
    icon: "",
    hidden: true,
  },
  not_him: {
    id: "not_him",
    name: "Your not him",
    description: "Try to log in to the admin page",
    icon: "",
    hidden: true,
  },
  window_rebel: {
    id: "window_rebel",
    name: "Yeah those dont close",
    description: "Try to close a window that can't be closed (idiot)",
    icon: "",
    hidden: true,
  },
  collector: {
    id: "collector",
    name: "Collector",
    description: "Unlock 5 achievements",
    icon: "",
    hidden: true,
  },
  completionist: {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all achievements",
    icon: "🏆",
    hidden: true,
  },
};

const STORAGE_KEY = "mejedo_achievements";
const STATS_KEY = "mejedo_stats";

// Context for global achievement state
const AchievementContext = createContext(null);

export function AchievementProvider({ children }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState({});
  const [stats, setStats] = useState({
    visitedPages: [],
    mascotClicks: 0,
    rhythmHighScore: 0,
    viewedConsole: false,
    viewedManga: false,
  });
  const [pendingAchievement, setPendingAchievement] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const unlockRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAchievements = localStorage.getItem(STORAGE_KEY);
    const savedStats = localStorage.getItem(STATS_KEY);

    if (savedAchievements) {
      setUnlockedAchievements(JSON.parse(savedAchievements));
    }

    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    setIsLoaded(true);
    isLoadedRef.current = true;
  }, []);

  // Save to localStorage when achievements change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements));
    }
  }, [unlockedAchievements, isLoaded]);

  // Save stats to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  // Check for first visit achievement
  useEffect(() => {
    if (isLoaded && !unlockedAchievements.first_visit) {
      unlock("first_visit");
    }
  }, [isLoaded]);

  // Unlock an achievement
  const unlock = useCallback((achievementId) => {
    if (unlockedAchievements[achievementId]) return false;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;

    setUnlockedAchievements((prev) => {
      const updated = {
        ...prev,
        [achievementId]: {
          unlockedAt: new Date().toISOString(),
        },
      };

      // Check for collector achievement (5 achievements)
      const count = Object.keys(updated).length;
      if (count >= 5 && !updated.collector) {
        setTimeout(() => unlock("collector"), 1500);
      }

      // Check for completionist (all achievements except completionist itself)
      const totalAchievements = Object.keys(ACHIEVEMENTS).length - 1;
      if (count >= totalAchievements && !updated.completionist) {
        setTimeout(() => unlock("completionist"), 1500);
      }

      return updated;
    });

    setPendingAchievement(achievement);
    return true;
  }, [unlockedAchievements]);

  // Keep ref updated
  unlockRef.current = unlock;

  // Clear pending achievement (after showing notification)
  const clearPendingAchievement = useCallback(() => {
    setPendingAchievement(null);
  }, []);

  // Update stats
  const updateStats = useCallback((key, value) => {
    // Don't update stats before localStorage is loaded
    if (!isLoadedRef.current) return;

    setStats((prev) => {
      const updated = { ...prev };

      if (key === "visitedPages" && !prev.visitedPages.includes(value)) {
        updated.visitedPages = [...prev.visitedPages, value];

        // Check for explorer achievement
        const allPages = ["/about", "/projects", "/blog", "/collection", "/shitposts", "/guestbook", "/webring", "/buttons", "/admin"];
        if (allPages.every((p) => updated.visitedPages.includes(p))) {
          setTimeout(() => unlockRef.current?.("explorer"), 500);
        }
      }

      if (key === "mascotClicks") {
        updated.mascotClicks = prev.mascotClicks + 1;

        // Check for click happy achievement
        if (updated.mascotClicks >= 10) {
          setTimeout(() => unlockRef.current?.("click_happy"), 500);
        }
      }

      if (key === "rhythmHighScore" && value > prev.rhythmHighScore) {
        updated.rhythmHighScore = value;

        // Check for rhythm master achievement
        if (value >= 1000) {
          setTimeout(() => unlockRef.current?.("rhythm_master"), 500);
        }
      }

      if (key === "viewedConsole") {
        updated.viewedConsole = true;

        // Check for collection viewer achievement
        if (updated.viewedManga) {
          setTimeout(() => unlockRef.current?.("collection_viewer"), 500);
        }
      }

      if (key === "viewedManga") {
        updated.viewedManga = true;

        // Check for collection viewer achievement
        if (updated.viewedConsole) {
          setTimeout(() => unlockRef.current?.("collection_viewer"), 500);
        }
      }

      return updated;
    });
  }, []);

  const value = {
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    stats,
    pendingAchievement,
    unlock,
    clearPendingAchievement,
    updateStats,
    isLoaded,
    unlockedCount: Object.keys(unlockedAchievements).length,
    totalCount: Object.keys(ACHIEVEMENTS).length,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievements must be used within an AchievementProvider");
  }
  return context;
}
