"use client";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import ConsolesTerminal from "./consolesTerminal.jsx";
import MangaTerminal from "./mangaTerminal.jsx";
import Image from "next/image";

export default function ConsolesPage() {
  // -----------------------------
  // TEMPLATES
  // -----------------------------
  const emptyConsoleTemplate = {
    id: "",
    name: "",
    manufacturer: "",
    releaseYear: "",
    image: "",
    games: [],
  };

  const emptyMangaTemplate = {
    id: "",
    title: "",
    author: "",
    releaseYear: "",
    cover: "",
    volumes: [],
  };

  // -----------------------------
  // CONSOLES STATE
  // -----------------------------
  const [consoles, setConsoles] = useState([]);
  const [loadingConsoles, setLoadingConsoles] = useState(true);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [consoleEditMode, setConsoleEditMode] = useState(false);
  const [consoleEditData, setConsoleEditData] = useState(null);

  // -----------------------------
  // MANGA STATE
  // -----------------------------
  const [manga, setManga] = useState([]);
  const [loadingManga, setLoadingManga] = useState(true);
  const [selectedManga, setSelectedManga] = useState(null);
  const [mangaEditMode, setMangaEditMode] = useState(false);
  const [mangaEditData, setMangaEditData] = useState(null);

  const { isAdmin } = useCurrentUser();

  // -----------------------------
  // FETCH CONSOLES
  // -----------------------------
  const fetchConsoles = async () => {
    try {
      const res = await fetch("/api/consoles");
      const data = await res.json();
      setConsoles(data);
      setLoadingConsoles(false);
    } catch (err) {
      console.error("Failed to fetch consoles:", err);
      setLoadingConsoles(false);
    }
  };

  // -----------------------------
  // FETCH MANGA
  // -----------------------------
  const fetchManga = async () => {
    try {
      const res = await fetch("/api/manga");
      const data = await res.json();
      setManga(data);
      setLoadingManga(false);
    } catch (err) {
      console.error("Failed to fetch manga:", err);
      setLoadingManga(false);
    }
  };

  useEffect(() => {
    fetchConsoles();
    fetchManga();
  }, []);

  // -----------------------------
  // FILE UPLOAD (shared)
  // -----------------------------
  const handleFileUpload = async (file) => {
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = await res.json();
      return data.url; // expected "/uploads/xxx.png"
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
      return "";
    }
  };

  // -----------------------------
  // SAVE CONSOLE EDITS
  // -----------------------------
  const saveConsoleEdits = async () => {
    try {
      const method = consoleEditData.id === "new" ? "POST" : "PUT";
      const url = consoleEditData.id === "new"
        ? "/api/consoles"
        : `/api/consoles/${consoleEditData.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(consoleEditData),
      });

      const result = await res.json();

      if (result.success) {
        setConsoleEditMode(false);
        setSelectedConsole(result.console);
        fetchConsoles();
      }
    } catch (err) {
      console.error("Failed to save console:", err);
    }
  };

  // -----------------------------
  // SAVE MANGA EDITS
  // -----------------------------
  const saveMangaEdits = async () => {
    try {
      const method = mangaEditData.id === "new" ? "POST" : "PUT";
      const url = mangaEditData.id === "new"
        ? "/api/manga"
        : `/api/manga/${mangaEditData.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mangaEditData),
      });

      const result = await res.json();

      if (result.success) {
        setMangaEditMode(false);
        setSelectedManga(result.manga);
        fetchManga();
      }
    } catch (err) {
      console.error("Failed to save manga:", err);
    }
  };

  // =============================================================
  // DETAIL VIEW: CONSOLE
  // =============================================================
  if (selectedConsole) {
    return (
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#0a0a0d]">
        <button
          className="mb-6 text-[#39ff14] pr-3 hover:text-white"
          onClick={() => {
            setSelectedConsole(null);
            setConsoleEditMode(false);
          }}
        >
          ← Back to collection
        </button>

        {!consoleEditMode && (
          <>
            {isAdmin && (
              <button
                className="px-4 py-2 mb-4 bg-[#39ff14] text-black hover:bg-white"
                onClick={() => {
                  setConsoleEditMode(true);
                  setConsoleEditData({ ...selectedConsole });
                }}
              >
                Edit Console
              </button>
            )}

            <h1 className="text-3xl font-bold mb-2">{selectedConsole.name}</h1>
            <p className="text-gray-400 mb-4">
              {selectedConsole.manufacturer} • {selectedConsole.releaseYear}
            </p>

            {selectedConsole.image && (
              <Image
                src={selectedConsole.image}
                alt={selectedConsole.name}
                width={600}
                height={400}
                className="max-w-[300px] object-contain border-2 border-[#39ff14] mb-6"
              />
            )}

            <h2 className="text-2xl font-semibold mb-4">Owned Games</h2>

            <div className="flex gap-4">
              {selectedConsole.games.map((game, idx) => (
                <div key={idx} className="bg-[#121217] w-60 border border-[#39ff14] p-3">
                  {game.cover && (
                    <Image
                      src={game.cover}
                      alt={game.title}
                      width={240}
                      height={240}
                      className="w-60 h-auto object-cover border border-[#39ff14]"
                    />
                  )}
                  <p className="text-center mt-2">{game.title}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {consoleEditMode && (
          <div className="bg-[#121217] p-6 border border-[#39ff14]">
            <h1 className="text-2xl font-bold mb-4">Edit Console</h1>

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Name"
              value={consoleEditData.name}
              onChange={(e) => setConsoleEditData({ ...consoleEditData, name: e.target.value })}
            />

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Manufacturer"
              value={consoleEditData.manufacturer}
              onChange={(e) => setConsoleEditData({ ...consoleEditData, manufacturer: e.target.value })}
            />

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Release Year"
              value={consoleEditData.releaseYear}
              onChange={(e) => setConsoleEditData({ ...consoleEditData, releaseYear: e.target.value })}
            />

            <label className="text-sm text-gray-400">Console Image URL</label>
            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              value={consoleEditData.image}
              placeholder="/uploads/console.png"
              onChange={(e) => setConsoleEditData({ ...consoleEditData, image: e.target.value })}
            />

            <label className="text-sm text-gray-400">Upload Console Image</label>
            <input
              type="file"
              accept="image/*"
              className="text-gray-300 mb-3"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file);
                  setConsoleEditData({ ...consoleEditData, image: url });
                }
              }}
            />

            {consoleEditData.image && (
              <Image
                src={consoleEditData.image}
                alt="Preview"
                width={200}
                height={200}
                className="max-h-[200px] border border-[#39ff14] mb-3"
              />
            )}

            <h2 className="text-xl font-semibold mt-4 mb-2">Games</h2>

            {consoleEditData.games.map((game, idx) => (
              <div key={idx} className="relative border border-[#39ff14] p-3 mb-3">
                <button
                  onClick={() => {
                    const updated = consoleEditData.games.filter((_, i) => i !== idx);
                    setConsoleEditData({ ...consoleEditData, games: updated });
                  }}
                  className="absolute top-2 right-2 text-red-500"
                >
                  ✖
                </button>

                <input
                  className="w-full p-2 mb-2 bg-black border border-[#39ff14]"
                  placeholder="Game Title"
                  value={game.title}
                  onChange={(e) => {
                    const updated = [...consoleEditData.games];
                    updated[idx].title = e.target.value;
                    setConsoleEditData({ ...consoleEditData, games: updated });
                  }}
                />

                <input
                  className="w-full p-2 bg-black border border-[#39ff14]"
                  placeholder="/uploads/cover.png"
                  value={game.cover}
                  onChange={(e) => {
                    const updated = [...consoleEditData.games];
                    updated[idx].cover = e.target.value;
                    setConsoleEditData({ ...consoleEditData, games: updated });
                  }}
                />

                <label className="text-xs text-gray-400 mt-2 block">Upload Game Cover</label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-gray-300"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await handleFileUpload(file);
                      const updated = [...consoleEditData.games];
                      updated[idx].cover = url;
                      setConsoleEditData({ ...consoleEditData, games: updated });
                    }
                  }}
                />

                {game.cover && (
                  <Image
                    src={game.cover}
                    alt={game.title}
                    width={150}
                    height={150}
                    className="max-h-[150px] mt-2 border border-[#39ff14]"
                  />
                )}
              </div>
            ))}

            <button
              className="mt-2 mb-4 px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
              onClick={() => {
                setConsoleEditData({
                  ...consoleEditData,
                  games: [...consoleEditData.games, { title: "", cover: "" }],
                });
              }}
            >
              + Add Game
            </button>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white" onClick={saveConsoleEdits}>
                Save
              </button>

              <button className="px-4 py-2 bg-gray-500 text-white" onClick={() => setConsoleEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================================================
  // DETAIL VIEW: MANGA
  // =============================================================
  if (selectedManga) {
    return (
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#0a0a0d]">
        <button
          className="mb-6 text-[#39ff14] pr-3 hover:text-white"
          onClick={() => {
            setSelectedManga(null);
            setMangaEditMode(false);
          }}
        >
          ← Back to collection
        </button>

        {!mangaEditMode && (
          <>
            {isAdmin && (
              <button
                className="px-4 py-2 mb-4 bg-[#39ff14] text-black hover:bg-white"
                onClick={() => {
                  setMangaEditMode(true);
                  setMangaEditData({ ...selectedManga });
                }}
              >
                Edit Manga
              </button>
            )}

            <h1 className="text-3xl font-bold mb-2">{selectedManga.title}</h1>
            <p className="text-gray-400 mb-4">
              {selectedManga.author} • {selectedManga.releaseYear}
            </p>

            {selectedManga.cover && (
              <Image
                src={selectedManga.cover}
                alt={selectedManga.title}
                width={600}
                height={400}
                className="max-w-[300px] object-contain border-2 border-[#39ff14] mb-6"
              />
            )}

            <h2 className="text-2xl font-semibold mb-4">Owned Volumes</h2>

            <div className="flex gap-4">
              {selectedManga.volumes.map((vol, idx) => (
                <div key={idx} className="bg-[#121217] w-48 border border-[#39ff14] p-3">
                  {vol.cover && (
                    <Image
                      src={vol.cover}
                      alt={`Vol ${vol.number} cover`}
                      width={180}
                      height={240}
                      className="w-full h-auto object-cover border border-[#39ff14]"
                    />
                  )}
                  <p className="text-center mt-2">Vol {vol.number} {vol.title ? `— ${vol.title}` : ""}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {mangaEditMode && (
          <div className="bg-[#121217] p-6 border border-[#39ff14]">
            <h1 className="text-2xl font-bold mb-4">Edit Manga</h1>

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Series Title"
              value={mangaEditData.title}
              onChange={(e) => setMangaEditData({ ...mangaEditData, title: e.target.value })}
            />

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Author"
              value={mangaEditData.author}
              onChange={(e) => setMangaEditData({ ...mangaEditData, author: e.target.value })}
            />

            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              placeholder="Release Year"
              value={mangaEditData.releaseYear}
              onChange={(e) => setMangaEditData({ ...mangaEditData, releaseYear: e.target.value })}
            />

            <label className="text-sm text-gray-400">Series Cover URL</label>
            <input
              className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
              value={mangaEditData.cover}
              placeholder="/uploads/manga-cover.png"
              onChange={(e) => setMangaEditData({ ...mangaEditData, cover: e.target.value })}
            />

            <label className="text-sm text-gray-400">Upload Series Cover</label>
            <input
              type="file"
              accept="image/*"
              className="text-gray-300 mb-3"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file);
                  setMangaEditData({ ...mangaEditData, cover: url });
                }
              }}
            />

            {mangaEditData.cover && (
              <Image
                src={mangaEditData.cover}
                alt="Preview"
                width={200}
                height={200}
                className="max-h-[200px] border border-[#39ff14] mb-3"
              />
            )}

            <h2 className="text-xl font-semibold mt-4 mb-2">Volumes</h2>

            {mangaEditData.volumes.map((vol, idx) => (
              <div key={idx} className="relative border border-[#39ff14] p-3 mb-3">
                <button
                  onClick={() => {
                    const updated = mangaEditData.volumes.filter((_, i) => i !== idx);
                    setMangaEditData({ ...mangaEditData, volumes: updated });
                  }}
                  className="absolute top-2 right-2 text-red-500"
                >
                  ✖
                </button>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <input
                    className="col-span-1 p-2 bg-black border border-[#39ff14]"
                    placeholder="Vol #"
                    value={vol.number}
                    onChange={(e) => {
                      const updated = [...mangaEditData.volumes];
                      updated[idx].number = e.target.value;
                      setMangaEditData({ ...mangaEditData, volumes: updated });
                    }}
                  />

                  <input
                    className="col-span-2 p-2 bg-black border border-[#39ff14]"
                    placeholder="Volume Title (optional)"
                    value={vol.title}
                    onChange={(e) => {
                      const updated = [...mangaEditData.volumes];
                      updated[idx].title = e.target.value;
                      setMangaEditData({ ...mangaEditData, volumes: updated });
                    }}
                  />
                </div>

                <input
                  className="w-full p-2 mt-2 bg-black border border-[#39ff14]"
                  placeholder="/uploads/volume-cover.png"
                  value={vol.cover}
                  onChange={(e) => {
                    const updated = [...mangaEditData.volumes];
                    updated[idx].cover = e.target.value;
                    setMangaEditData({ ...mangaEditData, volumes: updated });
                  }}
                />

                <label className="text-xs text-gray-400 mt-2 block">Upload Volume Cover</label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-gray-300"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await handleFileUpload(file);
                      const updated = [...mangaEditData.volumes];
                      updated[idx].cover = url;
                      setMangaEditData({ ...mangaEditData, volumes: updated });
                    }
                  }}
                />

                {vol.cover && (
                  <Image
                    src={vol.cover}
                    alt={`Vol ${vol.number}`}
                    width={150}
                    height={200}
                    className="max-h-[150px] mt-2 border border-[#39ff14]"
                  />
                )}
              </div>
            ))}

            <button
              className="mt-2 mb-4 px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
              onClick={() => {
                setMangaEditData({
                  ...mangaEditData,
                  volumes: [...mangaEditData.volumes, { number: "", title: "", cover: "" }],
                });
              }}
            >
              + Add Volume
            </button>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white" onClick={saveMangaEdits}>
                Save
              </button>

              <button className="px-4 py-2 bg-gray-500 text-white" onClick={() => setMangaEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================================================
  // MAIN GRID (both collections)
  // =============================================================
  return (
    <div className="">
      <div className="flex flex-col p-6 bg-[#121217] border-2 border-[#39ff14] m-4">
        <h1 className="text-2xl font-bold">Collection</h1>
        <p className="text-xl text-gray-400 mt-2">This is where I can show off some of the stuff I own :)</p>
      </div>

      {/* CONSOLES SECTION */}
      <div className="flex flex-col items-center bg-[#121217] border-2 border-[#39ff14] m-4 gap-4 p-4">
        <h1 className="text-3xl font-bold">Gaming Consoles</h1>
        {isAdmin && (
          <button
            className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white mb-4"
            onClick={() => {
              setConsoleEditData(emptyConsoleTemplate);
              setConsoleEditMode(true);
              setSelectedConsole({ ...emptyConsoleTemplate, id: "new" });
            }}
          >
            + Add Console
          </button>
        )}
        <div className="flex flex-wrap justify-center items-start gap-4 p-2">
          {loadingConsoles ? (
            <p className="text-gray-400">Loading consoles...</p>
          ) : (
            consoles.map((console) => (
              <div key={console.id} className="relative cursor-pointer" onClick={() => setSelectedConsole(console)}>
                <ConsolesTerminal consoleData={console} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* MANGA SECTION */}
      <div className="flex flex-col items-center bg-[#121217] border-2 border-[#39ff14] m-4 gap-4 p-4">
        <h1 className="text-3xl font-bold">Manga Collection</h1>
        {isAdmin && (
          <button
            className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white mb-4"
            onClick={() => {
              setMangaEditData(emptyMangaTemplate);
              setMangaEditMode(true);
              setSelectedManga({ ...emptyMangaTemplate, id: "new" });
            }}
          >
            + Add Manga Series
          </button>
        )}
        <div className="flex flex-wrap justify-center items-start gap-4 p-2">
          {loadingManga ? (
            <p className="text-gray-400">Loading manga...</p>
          ) : (
            manga.map((series) => (
              <div key={series.id} className="relative cursor-pointer" onClick={() => setSelectedManga(series)}>
                <MangaTerminal mangaData={series} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
