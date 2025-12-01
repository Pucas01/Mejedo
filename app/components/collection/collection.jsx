"use client";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import ConsolesSection from "./consolesSection.jsx";
import MangaSection from "./mangaSection.jsx";

export default function CollectionPage() {
  const { isAdmin } = useCurrentUser();

  // Data
  const [consoles, setConsoles] = useState([]);
  const [manga, setManga] = useState([]);

  // Loaders
  const [loadingConsoles, setLoadingConsoles] = useState(true);
  const [loadingManga, setLoadingManga] = useState(true);

  // Selected items (detail view triggers)
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [selectedManga, setSelectedManga] = useState(null);

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
      <div className="flex flex-col p-6 bg-[#121217] border-2 border-[#39ff14] m-4">
        <h1 className="text-2xl font-bold">Collection</h1>
        <p className="text-xl text-gray-400 mt-2">
          This is where I can show off some of the stuff I own :)
        </p>
      </div>

      <ConsolesSection
        isAdmin={isAdmin}
        consoles={consoles}
        loading={loadingConsoles}
        selectedConsole={selectedConsole}
        setSelectedConsole={setSelectedConsole}
        refresh={fetchConsoles}
      />

      <MangaSection
        isAdmin={isAdmin}
        manga={manga}
        loading={loadingManga}
        selectedManga={selectedManga}
        setSelectedManga={setSelectedManga}
        refresh={fetchManga}
      />
    </div>
  );
}
