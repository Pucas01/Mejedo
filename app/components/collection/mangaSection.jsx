"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";

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
        <div className="min-h-screen ml-0 mr-0 mt-0 m-4 border-2 border-[#39ff14] text-white bg-[#121217]">
        <WindowDecoration title="Kitty - Manga.txt" showControls={true} />
        <div className="p-6">
        <Button
          className="mb-6 text-[#39ff14] hover:text-white"
          variant="default"
          onClick={() => {
            setSelectedManga(null);
            setEditMode(false);
          }}
        >
          ← Back to collection
        </Button>

        {isAdmin && (
          <Button
            className="mb-4"
            variant="primary"
            onClick={() => {
              setEditMode(true);
              setEditData({ ...m });
            }}
          >
            Edit Manga
          </Button>
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
    </div>
    );
  }

  if (editMode) {
    const m = editData || { ...emptyMangaTemplate, id: "new" };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn">
        <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[700px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
          {/* Window Decoration */}
          <WindowDecoration
            title={m.id === "new" ? "Add Manga" : "Edit Manga"}
            onClose={() => {
              setEditMode(false);
              setSelectedManga(null);
            }}
          />

          <div className="flex-1 overflow-y-auto p-6">
            {/* Two column layout for manga details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left: Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Title</label>
                  <input
                    className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
                    placeholder="Manga title"
                    value={m.title}
                    onChange={(e) => setEditData({ ...m, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Author</label>
                  <input
                    className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
                    placeholder="Author name"
                    value={m.author}
                    onChange={(e) => setEditData({ ...m, author: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Publisher</label>
                  <input
                    className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
                    placeholder="Publisher"
                    value={m.publisher}
                    onChange={(e) => setEditData({ ...m, publisher: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Release Year</label>
                  <input
                    className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
                    placeholder="2020"
                    value={m.releaseYear}
                    onChange={(e) => setEditData({ ...m, releaseYear: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Cover URL</label>
                  <input
                    className="w-full bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
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
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const nextNum = Array.isArray(m.volumes) ? m.volumes.length + 1 : 1;
                    const updated = Array.isArray(m.volumes)
                      ? [...m.volumes, { title: "", cover: "", number: nextNum }]
                      : [{ title: "", cover: "", number: 1 }];
                    setEditData({ ...m, volumes: updated });
                  }}
                >
                  + Add Volume
                </Button>
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
                      <Button
                        onClick={() => {
                          const updated = m.volumes.filter((_, idx) => idx !== i);
                          setEditData({ ...m, volumes: updated });
                        }}
                        variant="danger"
                        size="sm"
                        className="w-6 h-6 text-xs"
                      >
                        ✕
                      </Button>
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
                        className="w-12 bg-[#121217] border border-[#39ff14] text-white text-sm text-center px-1 py-1"
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
                        className="flex-1 min-w-0 bg-[#121217] border border-[#39ff14] text-white text-sm px-1 py-1"
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
                      className="w-full bg-[#121217] border border-[#39ff14] text-white text-xs px-1 py-1 mb-1"
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
          <div className="px-6 py-3 bg-[#090909] border-t border-[#39ff14]/30 flex justify-between">
            <div>
              {m.id !== "new" && (
                <Button
                  variant="danger"
                  onClick={deleteManga}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Manga"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => {
                  setEditMode(false);
                  setSelectedManga(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveManga}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Manga"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
   <div className="bg-[#121217] border-2 border-[#39ff14] ">
      <WindowDecoration title="Kitty - Manga.txt" showControls={true} />
      <div className="flex flex-col items-center m-4 gap-4">
      <h1 className="text-3xl font-bold">Manga Collection</h1>

      {isAdmin && (
        <Button
          variant="primary"
          className="mb-4"
          onClick={() => {
            const newManga = { ...emptyMangaTemplate, id: "new" };
            setEditMode(true);
            setEditData(newManga);
            setSelectedManga(newManga);
          }}
        >
          + Add Manga
        </Button>
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
    </div>
  );
}
