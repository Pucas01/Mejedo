"use client";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";
import ConsolesSection from "./consolesSection.jsx";
import MangaSection from "./mangaSection.jsx";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";

export default function CollectionPage() {
  const { isAdmin } = useCurrentUser();
  const { updateStats } = useAchievements();

  // Data
  const [consoles, setConsoles] = useState([]);
  const [manga, setManga] = useState([]);

  // Loaders
  const [loadingConsoles, setLoadingConsoles] = useState(true);
  const [loadingManga, setLoadingManga] = useState(true);

  // Selected items (detail view triggers)
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [selectedManga, setSelectedManga] = useState(null);

  // Wrap setters to track views for achievements
  const handleSelectConsole = (c) => {
    setSelectedConsole(c);
    if (c && c.id !== "new") {
      updateStats("viewedConsole", true);
    }
  };

  const handleSelectManga = (m) => {
    setSelectedManga(m);
    if (m && m.id !== "new") {
      updateStats("viewedManga", true);
    }
  };

  // Fetch consoles
  const fetchConsoles = async () => {
    const res = await fetch("/api/consoles");
    const data = await res.json();
    setConsoles(data);
    setLoadingConsoles(false);
  };

  // Fetch manga
  const fetchManga = async () => {
    const res = await fetch("/api/manga");
    const data = await res.json();
    setManga(data);
    setLoadingManga(false);
  };

  useEffect(() => {
    fetchConsoles();
    fetchManga();
  }, []);

  return (
    <div>
      <div className="flex flex-col bg-[#121217] border-2 border-[#39ff14] m-4 mr-0 ml-0 relative">
        <WindowDecoration title="Kitty - Collection.txt" showControls={true} />
        <div className="p-6">
        <Sticker
          src="/stickers/futaba-jumping.png"
          position="bottom-right"
          size={70}
          rotation={-8}
          offset={{ x: 30, y: 30 }}
        />
        <h1 className="text-2xl font-bold">Collection</h1>
        <p className="text-xl text-gray-400 mt-2">
          This is where I can show off some of the stuff I own :)
        </p>
      </div>
    </div>

      <ConsolesSection
        isAdmin={isAdmin}
        consoles={consoles}
        loading={loadingConsoles}
        selectedConsole={selectedConsole}
        setSelectedConsole={handleSelectConsole}
        refresh={fetchConsoles}
      />
    <div className="pt-4">
      <MangaSection
        isAdmin={isAdmin}
        manga={manga}
        loading={loadingManga}
        selectedManga={selectedManga}
        setSelectedManga={handleSelectManga}
        refresh={fetchManga}
      />
      </div>
    </div>
  );
}
