"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function ConsolesSection({
  isAdmin,
  consoles,
  loading,
  selectedConsole,
  setSelectedConsole,
  refresh,
}) {
  const emptyConsoleTemplate = {
    id: "",
    name: "",
    manufacturer: "",
    releaseYear: "",
    image: "",
    games: [],
  };

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selectedConsole) {
      setEditMode(false);
      setEditData(null);
    }
  }, [selectedConsole]);

  // Upload 
  const upload = async (file) => {
    if (!file) return "";
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      return data.url || "";
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Upload failed");
      return "";
    }
  };

  // Save console
  const saveConsole = async () => {
    if (!editData) return;
    setSaving(true);

    try {
      const method = editData.id === "new" ? "POST" : "PUT";
      const url = editData.id === "new" ? "/api/consoles" : `/api/consoles/${editData.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData),
      });

      const result = await res.json();

      if (result.success) {
        setEditMode(false);
        setSelectedConsole(result.console || null);
        refresh();
      } else {
        alert("Failed to save console.");
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Delete console
  const deleteConsole = async () => {
    if (!editData?.id || editData.id === "new") {
      alert("Cannot delete unsaved console.");
      return;
    }

    const confirmed = confirm("Delete this console?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/consoles/${editData.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (result.success) {
        setEditMode(false);
        setSelectedConsole(null);
        refresh();
      } else {
        alert("Failed to delete console.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const moveGame = async (index, direction) => {
    if (!editData?.id) return;

    try {
      const res = await fetch(`/api/consoles/${editData.id}/games/${index}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ direction }),
      });
      const result = await res.json();
      if (result.success) {
        setEditData(result.console);
      } else {
        alert("Failed to move game.");
      }
    } catch (err) {
      console.error("Move game failed:", err);
      alert("Failed to move game.");
    }
  };

  if (selectedConsole && !editMode) {
    const c = selectedConsole;

    return (
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#121217]">

        <button
          className="mb-6 text-[#39ff14] hover:text-white"
          onClick={() => {
            setSelectedConsole(null);
            setEditMode(false);
          }}
        >
          ← Back to collection
        </button>

        {isAdmin && (
          <button
            className="px-4 py-2 mb-4 bg-[#39ff14] text-black hover:bg-white"
            onClick={() => {
              setEditMode(true);
              setEditData({ ...c });
            }}
          >
            Edit Console
          </button>
        )}

        <h1 className="text-3xl font-bold">{c.name}</h1>
        <p className="text-gray-400 mb-4">{c.manufacturer} • {c.releaseYear}</p>

        {c.image && (
          <Image
            src={c.image}
            alt={c.name}
            width={400}
            height={300}
            className="max-w-[300px] border border-[#39ff14] mb-6"
          />
        )}

        <h2 className="text-2xl font-semibold mb-2">Games</h2>

        <div className="flex flex-wrap gap-4">
          {c.games?.length ? (
            c.games.map((game, i) => (
              <div key={i} className="bg-[#121217] w-60 border border-[#39ff14] p-3">
                {game.cover && (
                  <Image
                    src={game.cover}
                    alt={game.title}
                    width={240}
                    height={240}
                    className="w-full object-cover border border-[#39ff14]"
                  />
                )}
                <p className="text-center mt-2">{game.title}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No games added.</p>
          )}
        </div>
      </div>
    );
  }

  if (editMode) {
    const c = editData || { ...emptyConsoleTemplate, id: "new" };

    return (
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#0a0a0d]">
        
        <button
          className="mb-6 text-[#39ff14] hover:text-white"
          onClick={() => {
            setEditMode(false);
            setSelectedConsole(null);
          }}
        >
          ← Back to collection
        </button>

        <div className="bg-[#121217] p-6 border border-[#39ff14]">
          <h1 className="text-2xl font-bold mb-4">{c.id === "new" ? "Add Console" : "Edit Console"}</h1>

          {/* Inputs */}
          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Name"
            value={c.name}
            onChange={(e) => setEditData({ ...c, name: e.target.value })}
          />

          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Manufacturer"
            value={c.manufacturer}
            onChange={(e) => setEditData({ ...c, manufacturer: e.target.value })}
          />

          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Release Year"
            value={c.releaseYear}
            onChange={(e) => setEditData({ ...c, releaseYear: e.target.value })}
          />

          <label className="text-sm text-gray-400">Console Image URL</label>
          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            value={c.image}
            placeholder="/uploads/console.png"
            onChange={(e) => setEditData({ ...c, image: e.target.value })}
          />

          <label className="text-sm text-gray-400">Upload Console Image</label>
          <input
            type="file"
            accept="image/*"
            className="text-gray-300 mb-3"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await upload(file);
                setEditData({ ...c, image: url });
              }
            }}
          />

          {c.image && (
            <Image
              src={c.image}
              alt="Preview"
              width={200}
              height={200}
              className="border border-[#39ff14] mb-3"
            />
          )}

          {/* GAMES */}
          <h2 className="text-xl font-semibold mt-4 mb-2">Games</h2>

          {Array.isArray(c.games) && c.games.map((game, i) => (
            <div key={i} className="relative border border-[#39ff14] p-3 mb-3">

              <button
                onClick={() => {
                  const updated = c.games.filter((_, idx) => idx !== i);
                  setEditData({ ...c, games: updated });
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-300 text-xl"
                title="Delete Game"
              >
                ✖
              </button>

              {/* Move up */}
              <button
                onClick={() => moveGame(i, "up")}
                disabled={i === 0}
                className="absolute top-2 left-2 text-green-400 hover:text-green-200 text-lg"
                title="Move Up"
              >
                ↑
              </button>

              {/* Move down */}
              <button
                onClick={() => moveGame(i, "down")}
                disabled={i === c.games.length - 1}
                className="absolute top-8 left-2 text-green-400 hover:text-green-200 text-lg"
                title="Move Down"
              >
                ↓
              </button>

              <input
                className="w-full p-2 mb-2 bg-black border border-[#39ff14]"
                placeholder="Game Title"
                value={game.title}
                onChange={(e) => {
                  const updated = [...c.games];
                  updated[i] = { ...updated[i], title: e.target.value };
                  setEditData({ ...c, games: updated });
                }}
              />

              <input
                className="w-full p-2 bg-black border border-[#39ff14]"
                placeholder="/uploads/game-cover.png"
                value={game.cover}
                onChange={(e) => {
                  const updated = [...c.games];
                  updated[i] = { ...updated[i], cover: e.target.value };
                  setEditData({ ...c, games: updated });
                }}
              />

              <label className="text-xs text-gray-400 mt-2 block">Upload Game Cover</label>
              <input
                type="file"
                accept="image/*"
                className="text-gray-300"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await upload(file);
                    const updated = [...c.games];
                    updated[i] = { ...updated[i], cover: url };
                    setEditData({ ...c, games: updated });
                  }
                }}
              />

              {game.cover && (
                <Image
                  src={game.cover}
                  alt={game.title}
                  width={150}
                  height={150}
                  className="border border-[#39ff14] mt-2"
                />
              )}
            </div>
          ))}

          <button
            className="mt-2 mb-4 px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
            onClick={() => {
              const updated = Array.isArray(c.games)
                ? [...c.games, { title: "", cover: "" }]
                : [{ title: "", cover: "" }];
              setEditData({ ...c, games: updated });
            }}
          >
            + Add Game
          </button>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
              onClick={saveConsole}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="px-4 py-2 bg-gray-500 text-white"
              onClick={() => {
                setEditMode(false);
                setSelectedConsole(null);
              }}
            >
              Cancel
            </button>

            {c.id !== "new" && (
              <button
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-800"
                onClick={deleteConsole}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // MAIN LIST + Add Button
  // =============================================================
  return (
    <div className="flex flex-col items-center bg-[#121217] border-2 border-[#39ff14] m-4 gap-4 p-4">
      <h1 className="text-3xl font-bold">Gaming Consoles</h1>

      {isAdmin && (
        <button
          className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white mb-4"
          onClick={() => {
            const newConsole = { ...emptyConsoleTemplate, id: "new" };
            setEditMode(true);
            setEditData(newConsole);
            setSelectedConsole(newConsole);
          }}
        >
          + Add Console
        </button>
      )}

      <div className="flex flex-wrap justify-center items-start gap-4 p-2">
        {loading ? (
          <p className="text-gray-400">Loading consoles...</p>
        ) : (
          consoles.map((c) => (
            <div
              key={c.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedConsole(c);
                setEditMode(false);
                setEditData(null);
              }}
            >
              <div className="bg-[#121217] w-48 border border-[#39ff14] p-3">
                {c.image && (
                  <Image
                    src={c.image}
                    alt={c.name}
                    width={180}
                    height={180}
                    className="w-full h-auto object-cover border border-[#39ff14]"
                  />
                )}
                <p className="text-center mt-2">{c.name}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
