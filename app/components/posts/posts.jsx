"use client";
import { useState, useEffect } from "react";
import TopCard from "./TopCard.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";

export default function ShitPosts() {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { isAdmin } = useCurrentUser();

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/shitposts");
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load shitposts:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAddPost = async (category) => {
    const newPost = {
      id: Date.now().toString(),
      title: "New Post",
      url: "",
      thumbnail: "",
      meta: {},
    };

    try {
      await fetch(`/api/shitposts/${category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
        credentials: "include",
      });
      fetchPosts();
    } catch (err) {
      console.error("Failed to add post:", err);
    }
  };

  const handleDeletePost = async (category, id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`/api/shitposts/${category}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchPosts();
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleSavePost = async (category, updatedPost) => {
    try {
      await fetch(`/api/shitposts/${category}/${updatedPost.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await fetch(`/api/shitposts/${category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPost),
        credentials: "include",
      });

      setEditingPost(null);
      setSelectedCategory(null);
      fetchPosts();
    } catch (err) {
      console.error("Failed to save post:", err);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed");
      return "";
    }
  };

  if (!posts) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 text-white">
      <div className="mx-auto flex flex-col gap-6">
        <div className="bg-[#121217] border-2 border-[#39ff14] items-center justify-between relative">
          <WindowDecoration title="Kitty - Shitposts.txt" showControls={true} />
          <div className="p-6">
          <Sticker
            src="/stickers/futaba-happy.png"
            position="top-right"
            size={75}
            rotation={-15}
            offset={{ x: 22, y: -22 }}
          />
          <div>
            <h1 className="text-2xl font-bold">Shitposts</h1>
            <p className="text-xl text-gray-400 mt-1">
              A collection of some of my stupid posts i guess (why why why)
            </p>
          </div>
        </div>
        </div>
        {["tiktoks", "tweets", "tenor", "youtube"].map((section, index) => {
          const sectionStickers = [
            { src: "/stickers/futaba-jumping.png", rotation: -8, position: "bottom-left" },
            { src: "/stickers/futaba-peace.png", rotation: 12, position: "bottom-right" },
            { src: "/stickers/futaba-sitting.png", rotation: -10, position: "top-right" },
            { src: "/stickers/futaba-kneeling.png", rotation: 8, position: "bottom-left" },
          ];
          const stickerConfig = sectionStickers[index];

          return (
          <section
            key={section}
            className="bg-[#121217] p-6 pt-0 pl-0 pr-0 border-[#39ff14] border-2 space-y-3 relative">
              <WindowDecoration title={`Kitty - ${section}`} showControls={true} />
              <div className="pl-4">
            <Sticker
              src={stickerConfig.src}
              position={stickerConfig.position}
              size={65}
              rotation={stickerConfig.rotation}
              offset={{ x: 30, y: 30 }}
            />
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-[#39ff14] capitalize">Top {section}</h2>
              {isAdmin && (
                <Button
                  onClick={() => handleAddPost(section)}
                  variant="primary"
                  size="sm"
                >
                  Add
                </Button>
              )}
            </div>
            </div>

            <div className="flex flex-wrap pl-6 pr-6 gap-4">
              {posts[section]?.length > 0 ? (
                posts[section].map((p) => (
                  <div key={p.id} className="relative">
                    <TopCard
                      post={{ ...p, source: section === "tweets" ? "x" : section }}
                    />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingPost(p);
                            setSelectedCategory(section);
                          }}
                          variant="primary"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeletePost(section, p.id)}
                          variant="primary"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No posts yet.</p>
              )}
            </div>
          </section>
        );
        })}
      </div>

      {editingPost && (
        <div className="fixed inset-0 max-h-full bg-black/60 flex justify-center items-center z-50">
          <div className="bg-[#121217] border-2 border-[#39ff14] max-h-full p-6 shadow-lg w-[400px] flex flex-col gap-2">
            <h2 className="text-white text-lg font-bold mb-2">Edit Post</h2>

            <input
              type="text"
              placeholder="Title"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({ ...editingPost, title: e.target.value })
              }
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <input
              type="text"
              placeholder="URL"
              value={editingPost.url}
              onChange={(e) =>
                setEditingPost({ ...editingPost, url: e.target.value })
              }
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
            />

            <label className="text-sm text-gray-400 mt-2">Custom Thumbnail URL:</label>
            <input
              type="text"
              placeholder="/path/to/image.png"
              value={editingPost.thumbnail || ""}
              onChange={(e) =>
                setEditingPost({ ...editingPost, thumbnail: e.target.value })
              }
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1 w-full"
            />

            <label className="text-sm text-gray-400 mt-2">Upload Thumbnail:</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  setEditingPost({ ...editingPost, thumbnail: url });
                }
              }}
              className="text-gray-300 text-sm"
            />

            {editingPost.thumbnail && (
              <img
                src={editingPost.thumbnail}
                alt="thumbnail"
                className="w-full max-h-100 rounded border border-[#39ff14] mt-2"
              />
            )}


            <div className="flex flex-col gap-1 mt-2">
              <label className="text-sm text-gray-400">Meta:</label>
              {Object.entries(editingPost.meta || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center gap-2">
                  <span className="capitalize">{key}:</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        meta: {
                          ...editingPost.meta,
                          [key]: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="bg-[#121217] border border-[#39ff14] text-white w-24 px-2 py-1"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="primary"
                onClick={() => setEditingPost(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSavePost(selectedCategory, editingPost)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
