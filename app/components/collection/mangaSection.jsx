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

    // Delete a specific volume (backend route)
    const deleteVolumeFromServer = async (mangaId, index) => {
    await fetch(`/api/manga/${mangaId}/volume/${index}`, {
        method: "DELETE",
        credentials: "include",
    });
    };

    // Move a volume up/down
    const moveVolume = async (mangaId, from, to) => {
    await fetch(`/api/manga/${mangaId}/volume/move`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
    });
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
                <p className="text-center mt-2">{vol.title}</p>
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
      <div className="min-h-screen p-6 m-4 border-2 border-[#39ff14] text-white bg-[#0a0a0d]">
        
        <button
          className="mb-6 text-[#39ff14] hover:text-white"
          onClick={() => {
            setEditMode(false);
            setSelectedManga(null);
          }}
        >
          ← Back to collection
        </button>

        <div className="bg-[#121217] p-6 border border-[#39ff14]">
          <h1 className="text-2xl font-bold mb-4">{m.id === "new" ? "Add Manga" : "Edit Manga"}</h1>

          {/* Inputs */}
          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Title"
            value={m.title}
            onChange={(e) => setEditData({ ...m, title: e.target.value })}
          />

          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Author"
            value={m.author}
            onChange={(e) => setEditData({ ...m, author: e.target.value })}
          />

          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Publisher"
            value={m.publisher}
            onChange={(e) => setEditData({ ...m, publisher: e.target.value })}
          />

          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            placeholder="Release Year"
            value={m.releaseYear}
            onChange={(e) => setEditData({ ...m, releaseYear: e.target.value })}
          />

          <label className="text-sm text-gray-400">Cover Image URL</label>
          <input
            className="w-full p-2 mb-3 bg-black border border-[#39ff14]"
            value={m.cover}
            placeholder="/uploads/manga-cover.png"
            onChange={(e) => setEditData({ ...m, cover: e.target.value })}
          />

          <label className="text-sm text-gray-400">Upload Manga Cover</label>
          <input
            type="file"
            accept="image/*"
            className="text-gray-300 mb-3"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await upload(file);
                setEditData({ ...m, cover: url });
              }
            }}
          />

          {m.cover && (
            <Image
              src={m.cover}
              alt="Preview"
              width={200}
              height={300}
              className="border border-[#39ff14] mb-3"
            />
          )}

<h2 className="text-xl font-semibold mt-4 mb-2">Volumes</h2>

{Array.isArray(m.volumes) && m.volumes.map((vol, i) => (
  <div key={i} className="relative border border-[#39ff14] p-3 mb-3">

    <button
      onClick={async () => {
        if (m.id !== "new") {
          await deleteVolumeFromServer(m.id, i);
          await refresh();
        }
        const updated = m.volumes.filter((_, idx) => idx !== i);
        setEditData({ ...m, volumes: updated });
      }}
      className="absolute top-2 right-2 text-red-500"
    >
      ✖
    </button>

    <div className="absolute top-2 left-2 flex flex-col gap-1">
      {i > 0 && (
        <button
          className="text-[#39ff14]"
          onClick={async () => {
            if (m.id !== "new") {
              await moveVolume(m.id, i, i - 1);
              await refresh();
            }
            const updated = [...m.volumes];
            const t = updated[i];
            updated[i] = updated[i - 1];
            updated[i - 1] = t;
            setEditData({ ...m, volumes: updated });
          }}
        >
          ▲
        </button>
      )}

      {i < m.volumes.length - 1 && (
        <button
          className="text-[#39ff14]"
          onClick={async () => {
            if (m.id !== "new") {
              await moveVolume(m.id, i, i + 1);
              await refresh();
            }
            const updated = [...m.volumes];
            const t = updated[i];
            updated[i] = updated[i + 1];
            updated[i + 1] = t;
            setEditData({ ...m, volumes: updated });
          }}
        >
          ▼
        </button>
      )}
    </div>

    <input
      className="w-full p-2 mb-2 bg-black border border-[#39ff14]"
      placeholder="Volume Title"
      value={vol.title}
      onChange={(e) => {
        const updated = [...m.volumes];
        updated[i] = { ...updated[i], title: e.target.value };
        setEditData({ ...m, volumes: updated });
      }}
    />

    <input
      className="w-full p-2 bg-black border border-[#39ff14]"
      placeholder="/uploads/volume-cover.png"
      value={vol.cover}
      onChange={(e) => {
        const updated = [...m.volumes];
        updated[i] = { ...updated[i], cover: e.target.value };
        setEditData({ ...m, volumes: updated });
      }}
    />

    <label className="text-xs text-gray-400 mt-2 block">Upload Volume Cover</label>
    <input
      type="file"
      accept="image/*"
      className="text-gray-300"
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

    {vol.cover && (
      <Image
        src={vol.cover}
        alt={vol.title}
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
              const updated = Array.isArray(m.volumes)
                ? [...m.volumes, { title: "", cover: "" }]
                : [{ title: "", cover: "" }];
              setEditData({ ...m, volumes: updated });
            }}
          >
            + Add Volume
          </button>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-[#39ff14] text-black hover:bg-white"
              onClick={saveManga}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="px-4 py-2 bg-gray-500 text-white"
              onClick={() => {
                setEditMode(false);
                setSelectedManga(null);
              }}
            >
              Cancel
            </button>

            {m.id !== "new" && (
              <button
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-800"
                onClick={deleteManga}
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
