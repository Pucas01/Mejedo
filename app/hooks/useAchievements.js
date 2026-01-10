"use client";
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

export const ACHIEVEMENTS = {
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
  widget_opener: {
    id: "widget_opener",
    name: "Widgets and stuff",
    description: "Open a widget for the first time",
    icon: "",
    hidden: false,
  },
  music_listener: {
    id: "music_listener",
    name: "Why would you listen to this",
    description: "Play a song in the music player",
    icon: "",
    hidden: false,
  },
  teto_watcher: {
    id: "teto_watcher",
    name: "Mischievous Function",
    description: "Im sorry this is like my most favorite video i have ever seen and everyone in the entire world has to listen to this remix ones",
    icon: "",
    hidden: false,
  },
  konami_master: {
    id: "konami_master",
    name: "Konami Code",
    description: "Enter the da code",
    icon: "",
    hidden: true,
  },
  futaba_funeral: {
    id: "futaba_funeral",
    name: "Futaba dies",
    description: "You fucking killed futaba",
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

const AchievementContext = createContext(null);

export function AchievementProvider({ children }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState({});
  const [stats, setStats] = useState({
    visitedPages: [],
    mascotClicks: 0,
    rhythmHighScore: 0,
    viewedConsole: false,
    viewedManga: false,
    openedWidget: false,
    playedSong: false,
    openedTetoWidget: false,
  });
  const [pendingAchievement, setPendingAchievement] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const unlockRef = useRef(null);
  const isLoadedRef = useRef(false);

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

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setUnlockedAchievements(JSON.parse(e.newValue));
      }
      if (e.key === STATS_KEY && e.newValue) {
        setStats(JSON.parse(e.newValue));
      }
    };

    const handleAchievementsUpdated = (e) => {
      setUnlockedAchievements(e.detail.achievements);
    };

    const handleStatsUpdated = (e) => {
      setStats(e.detail.stats);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('achievementsUpdated', handleAchievementsUpdated);
    window.addEventListener('statsUpdated', handleStatsUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('achievementsUpdated', handleAchievementsUpdated);
      window.removeEventListener('statsUpdated', handleStatsUpdated);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements));
      window.dispatchEvent(new CustomEvent('achievementsUpdated', {
        detail: { achievements: unlockedAchievements }
      }));
    }
  }, [unlockedAchievements, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      window.dispatchEvent(new CustomEvent('statsUpdated', {
        detail: { stats }
      }));
    }
  }, [stats, isLoaded]);

  useEffect(() => {
    if (isLoaded && !unlockedAchievements.first_visit) {
      unlock("first_visit");
    }
  }, [isLoaded]);

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

      const count = Object.keys(updated).length;
      if (count >= 5 && !updated.collector) {
        setTimeout(() => unlock("collector"), 1500);
      }

      const totalAchievements = Object.keys(ACHIEVEMENTS).length - 1;
      if (count >= totalAchievements && !updated.completionist) {
        setTimeout(() => unlock("completionist"), 1500);
      }

      return updated;
    });

    setPendingAchievement(achievement);
    return true;
  }, [unlockedAchievements]);

  unlockRef.current = unlock;

  const clearPendingAchievement = useCallback(() => {
    setPendingAchievement(null);
  }, []);

  const updateStats = useCallback((key, value) => {
    if (!isLoadedRef.current) return;

    setStats((prev) => {
      const updated = { ...prev };

      if (key === "visitedPages" && !prev.visitedPages.includes(value)) {
        updated.visitedPages = [...prev.visitedPages, value];

        const allPages = ["/about", "/projects", "/blog", "/collection", "/shitposts", "/guestbook", "/webring", "/buttons", "/admin"];
        if (allPages.every((p) => updated.visitedPages.includes(p))) {
          setTimeout(() => unlockRef.current?.("explorer"), 500);
        }
      }

      if (key === "mascotClicks") {
        updated.mascotClicks = prev.mascotClicks + 1;

        if (updated.mascotClicks >= 10) {
          setTimeout(() => unlockRef.current?.("click_happy"), 500);
        }
      }

      if (key === "rhythmHighScore" && value > prev.rhythmHighScore) {
        updated.rhythmHighScore = value;

        if (value >= 1000) {
          setTimeout(() => unlockRef.current?.("rhythm_master"), 500);
        }
      }

      if (key === "viewedConsole") {
        updated.viewedConsole = true;

        if (updated.viewedManga) {
          setTimeout(() => unlockRef.current?.("collection_viewer"), 500);
        }
      }

      if (key === "viewedManga") {
        updated.viewedManga = true;

        if (updated.viewedConsole) {
          setTimeout(() => unlockRef.current?.("collection_viewer"), 500);
        }
      }

      if (key === "openedWidget") {
        updated.openedWidget = true;

        setTimeout(() => unlockRef.current?.("widget_opener"), 500);
      }

      if (key === "playedSong") {
        updated.playedSong = true;

        setTimeout(() => unlockRef.current?.("music_listener"), 500);
      }

      if (key === "openedTetoWidget") {
        updated.openedTetoWidget = true;

        setTimeout(() => unlockRef.current?.("teto_watcher"), 500);
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
