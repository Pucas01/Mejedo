"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function MangaSection({
  isAdmin,
  manga,
  loading,
  selectedManga,
  setSelectedManga,
  refresh,
}) {
  // empty template for new manga
  const emptyMangaTemplate = {
    id: "",
    title: "",
    author: "",
    publisher: "",
    releaseYear: "",
    cover: "",
    volumes: [],
  };

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (!selectedManga) {
      setEditMode(false);
      setEditData(null);
    }
  }, [selectedManga]);

  // Upload helper
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

  // Save manga
  const saveManga = async () => {
    if (!editData) return;
    setSaving(true);

    try {
      const method = editData.id === "new" ? "POST" : "PUT";
      const url = editData.id === "new" ? "/api/manga" : `/api/manga/${editData.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData),
      });

      const result = await res.json();

      if (result.success) {
        setEditMode(false);
        setSelectedManga(result.manga || null);
        refresh();
      } else {
        alert("Failed to save manga.");
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Delete manga
  const deleteManga = async () => {
    if (!editData?.id || editData.id === "new") {
      alert("Cannot delete unsaved manga.");
      return;
    }

    const confirmed = confirm("Delete this manga?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/manga/${editData.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (result.success) {
        setEditMode(false);
        setSelectedManga(null);
        refresh();
      } else {
        alert("Failed to delete manga.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  if (selectedManga && !editMode) {
    const m = selectedManga;

    return (
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#121217]">

        <button
          className="mb-6 text-[#39ff14] hover:text-white"
          onClick={() => {
            setSelectedManga(null);
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
              setEditData({ ...m });
            }}
          >
            Edit Manga
          </button>
        )}

        <h1 className="text-3xl font-bold">{m.title}</h1>
        <p className="text-gray-400 mb-4">{m.author} • {m.publisher} • {m.releaseYear}</p>

        {m.cover && (
          <Image
            src={m.cover}
            alt={m.title}
            width={400}
            height={600}
            className="max-w-[300px] border border-[#39ff14] mb-6"
          />
        )}

        <h2 className="text-2xl font-semibold mb-2">Volumes</h2>

        <div className="flex flex-wrap gap-4">
          {m.volumes?.length ? (
            m.volumes.map((vol, i) => (
              <div key={i} className="bg-[#121217] w-60 border border-[#39ff14] p-3">
                {vol.cover && (
                  <Image
                    src={vol.cover}
                    alt={vol.title}
                    width={240}
                    height={240}
                    className="w-full object-cover border border-[#39ff14]"
                  />
                )}
                <p className="text-center mt-2">
                  {vol.number && <span className="text-[#39ff14]">Vol. {vol.number} - </span>}
                  {vol.title}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No volumes added.</p>
          )}
        </div>
      </div>
    );
  }

  if (editMode) {
    const m = editData || { ...emptyMangaTemplate, id: "new" };

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#121217] border-2 border-[#39ff14] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#121217] border-b border-[#39ff14] p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#39ff14]">
              {m.id === "new" ? "Add Manga" : "Edit Manga"}
            </h1>
            <button
              onClick={() => {
                setEditMode(false);
                setSelectedManga(null);
              }}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Two column layout for manga details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left: Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Title</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="Manga title"
                    value={m.title}
                    onChange={(e) => setEditData({ ...m, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Author</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="Author name"
                    value={m.author}
                    onChange={(e) => setEditData({ ...m, author: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Publisher</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="Publisher"
                    value={m.publisher}
                    onChange={(e) => setEditData({ ...m, publisher: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Release Year</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    placeholder="2020"
                    value={m.releaseYear}
                    onChange={(e) => setEditData({ ...m, releaseYear: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Cover URL</label>
                  <input
                    className="w-full p-2 bg-black border border-[#39ff14] text-white"
                    value={m.cover}
                    placeholder="/uploads/manga-cover.png"
                    onChange={(e) => setEditData({ ...m, cover: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Upload Cover</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-gray-300 text-sm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await upload(file);
                        setEditData({ ...m, cover: url });
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right: Cover preview */}
              <div className="flex items-center justify-center">
                {m.cover ? (
                  <Image
                    src={m.cover}
                    alt="Preview"
                    width={180}
                    height={270}
                    className="border border-[#39ff14] max-h-[270px] object-contain"
                  />
                ) : (
                  <div className="w-[180px] h-[270px] border border-dashed border-gray-600 flex items-center justify-center text-gray-500">
                    No cover
                  </div>
                )}
              </div>
            </div>

            {/* Volumes section */}
            <div className="border-t border-[#39ff14] pt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#39ff14]">Volumes ({m.volumes?.length || 0})</h2>
                <button
                  className="px-3 py-1 bg-[#39ff14] text-black hover:bg-white text-sm"
                  onClick={() => {
                    const nextNum = Array.isArray(m.volumes) ? m.volumes.length + 1 : 1;
                    const updated = Array.isArray(m.volumes)
                      ? [...m.volumes, { title: "", cover: "", number: nextNum }]
                      : [{ title: "", cover: "", number: 1 }];
                    setEditData({ ...m, volumes: updated });
                  }}
                >
                  + Add Volume
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                {Array.isArray(m.volumes) && m.volumes.map((vol, i) => (
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
                        const updated = [...m.volumes];
                        const [dragged] = updated.splice(draggedIndex, 1);
                        updated.splice(i, 0, dragged);
                        setEditData({ ...m, volumes: updated });
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
                          const updated = m.volumes.filter((_, idx) => idx !== i);
                          setEditData({ ...m, volumes: updated });
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

                    {vol.cover ? (
                      <Image
                        src={vol.cover}
                        alt={vol.title}
                        width={120}
                        height={160}
                        className="w-full h-32 object-cover border border-[#39ff14] mb-2 pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-32 border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs mb-2">
                        No cover
                      </div>
                    )}

                    <div className="flex gap-1 mb-1">
                      <input
                        type="number"
                        className="w-12 p-1 bg-black border border-[#39ff14] text-white text-sm text-center"
                        placeholder="#"
                        value={vol.number || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const updated = [...m.volumes];
                          updated[i] = { ...updated[i], number: e.target.value ? parseInt(e.target.value, 10) : "" };
                          setEditData({ ...m, volumes: updated });
                        }}
                      />
                      <input
                        className="flex-1 min-w-0 p-1 bg-black border border-[#39ff14] text-white text-sm"
                        placeholder="Title"
                        value={vol.title}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const updated = [...m.volumes];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setEditData({ ...m, volumes: updated });
                        }}
                      />
                    </div>

                    <input
                      className="w-full p-1 bg-black border border-[#39ff14] text-white text-xs mb-1"
                      placeholder="Cover URL"
                      value={vol.cover}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const updated = [...m.volumes];
                        updated[i] = { ...updated[i], cover: e.target.value };
                        setEditData({ ...m, volumes: updated });
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
                          const updated = [...m.volumes];
                          updated[i] = { ...updated[i], cover: url };
                          setEditData({ ...m, volumes: updated });
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
              {m.id !== "new" && (
                <button
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-800"
                  onClick={deleteManga}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Manga"}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-500"
                onClick={() => {
                  setEditMode(false);
                  setSelectedManga(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
                onClick={saveManga}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Manga"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#121217] border-2 border-[#39ff14] m-4 gap-4 p-4">
      <h1 className="text-3xl font-bold">Manga Collection</h1>

      {isAdmin && (
        <button
          className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white mb-4"
          onClick={() => {
            const newManga = { ...emptyMangaTemplate, id: "new" };
            setEditMode(true);
            setEditData(newManga);
            setSelectedManga(newManga);
          }}
        >
          + Add Manga
        </button>
      )}

      <div className="flex flex-wrap justify-center items-start gap-4 p-2">
        {loading ? (
          <p className="text-gray-400">Loading manga...</p>
        ) : (
          manga.map((m) => (
            <div
              key={m.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedManga(m);
                setEditMode(false);
                setEditData(null);
              }}
            >
              <div className="bg-[#121217] w-48 border border-[#39ff14] p-3">
                {m.cover && (
                  <Image
                    src={m.cover}
                    alt={m.title}
                    width={180}
                    height={240}
                    className="w-full h-auto object-cover border border-[#39ff14]"
                  />
                )}
                <p className="text-center mt-2">{m.title}</p>
                <p className="text-center text-sm text-gray-400">
                  {m.volumes?.length || 0} volume{m.volumes?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
