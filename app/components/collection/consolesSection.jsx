"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import WindowDecoration from "../window/WindowDecoration.jsx";

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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  if (selectedConsole && !editMode) {
    const c = selectedConsole;

    return (
      <div className="min-h-screen ml-0 mr-0  m-4 border-2 border-[#39ff14] text-white bg-[#121217]">
        <WindowDecoration title="Kitty - Consoles.txt" showControls={true} />
        <div className="p-6">

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
    </div>
    );
  }

  if (editMode) {
    const c = editData || { ...emptyConsoleTemplate, id: "new" };

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#121217] border-2 border-[#39ff14] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#121217] border-b border-[#39ff14] p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#39ff14]">
              {c.id === "new" ? "Add Console" : "Edit Console"}
            </h1>
            <button
              onClick={() => {
                setEditMode(false);
                setSelectedConsole(null);
              }}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Two column layout for console details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left: Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Name</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="Console name"
                    value={c.name}
                    onChange={(e) => setEditData({ ...c, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Manufacturer</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="Nintendo, Sony, etc."
                    value={c.manufacturer}
                    onChange={(e) => setEditData({ ...c, manufacturer: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Release Year</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="2020"
                    value={c.releaseYear}
                    onChange={(e) => setEditData({ ...c, releaseYear: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Image URL</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    value={c.image}
                    placeholder="/uploads/console.png"
                    onChange={(e) => setEditData({ ...c, image: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-gray-300 text-sm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await upload(file);
                        setEditData({ ...c, image: url });
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right: Image preview */}
              <div className="flex items-center justify-center">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="border border-[#39ff14] max-h-[200px] object-contain"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] border border-dashed border-gray-600 flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Games section */}
            <div className="border-t border-[#39ff14] pt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#39ff14]">Games ({c.games?.length || 0})</h2>
                <button
                  className="px-3 py-1 bg-[#39ff14] text-black hover:bg-white text-sm"
                  onClick={() => {
                    const updated = Array.isArray(c.games)
                      ? [...c.games, { title: "", cover: "" }]
                      : [{ title: "", cover: "" }];
                    setEditData({ ...c, games: updated });
                  }}
                >
                  + Add Game
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                {Array.isArray(c.games) && c.games.map((game, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(i);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== i) {
                        const updated = [...c.games];
                        const [dragged] = updated.splice(draggedIndex, 1);
                        updated.splice(i, 0, dragged);
                        setEditData({ ...c, games: updated });
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`border p-2 bg-black/50 relative group cursor-grab active:cursor-grabbing transition-all ${
                      dragOverIndex === i ? "border-white border-2 scale-105" : "border-[#39ff14]"
                    } ${draggedIndex === i ? "opacity-50" : ""}`}
                  >
                    {/* Controls overlay */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => {
                          const updated = c.games.filter((_, idx) => idx !== i);
                          setEditData({ ...c, games: updated });
                        }}
                        className="w-6 h-6 bg-red-600 text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Drag handle indicator */}
                    <div className="absolute top-1 left-1 text-gray-500 text-xs opacity-0 group-hover:opacity-100">
                      ⋮⋮
                    </div>

                    {game.cover ? (
                      <Image
                        src={game.cover}
                        alt={game.title}
                        width={120}
                        height={120}
                        className="w-full h-24 object-cover border border-[#39ff14] mb-2 pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-24 border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs mb-2">
                        No cover
                      </div>
                    )}

                    <input
                      className="w-full p-1 bg-black border border-[#39ff14] text-white text-sm mb-1"
                      placeholder="Title"
                      value={game.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const updated = [...c.games];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setEditData({ ...c, games: updated });
                      }}
                    />

                    <input
                      className="w-full p-1 bg-black border border-[#39ff14] text-white text-xs mb-1"
                      placeholder="Cover URL"
                      value={game.cover}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const updated = [...c.games];
                        updated[i] = { ...updated[i], cover: e.target.value };
                        setEditData({ ...c, games: updated });
                      }}
                    />

                    <input
                      type="file"
                      accept="image/*"
                      className="text-gray-300 text-xs w-full"
                      onClick={(e) => e.stopPropagation()}
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with actions */}
          <div className="sticky bottom-0 bg-[#121217] border-t border-[#39ff14] p-4 flex justify-between">
            <div>
              {c.id !== "new" && (
                <button
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-800"
                  onClick={deleteConsole}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Console"}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-500"
                onClick={() => {
                  setEditMode(false);
                  setSelectedConsole(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
                onClick={saveConsole}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Console"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // MAIN LIST + Add Button
  // =============================================================
  return (
    <div className="   bg-[#121217] border-2 border-[#39ff14] ">
      <WindowDecoration title="Kitty - Consoles.txt" showControls={true} />
      <div className="flex flex-col items-center m-4 gap-4">
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
                <p className="text-center text-sm text-gray-400">
                  {c.games?.length || 0} game{c.games?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}
