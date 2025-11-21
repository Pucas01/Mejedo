"use client";
import { useState, useEffect } from "react";
import TopCard from "./TopCard.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";

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
    return (
      <div className="text-gray-400 text-center  p-8">
        No shitposts found.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 text-white">
      <div className="mx-auto flex flex-col gap-6">
        <div className="bg-[#121217] border-2 border-[#39ff14] p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shitposts</h1>
            <p className="text-xl text-gray-400 mt-1">
              A collection of some of my stupid posts i guess (why why why)
            </p>
          </div>
        </div>
        {["tiktoks", "tweets", "tenor", "youtube"].map((section) => (
          <section
            key={section}
            className="bg-[#121217] p-6 border-[#39ff14] border-2 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-[#39ff14] capitalize">Top {section}</h2>
              {isAdmin && (
                <button
                  onClick={() => handleAddPost(section)}
                  className="bg-[#1f8f0c] hover:bg-[#22a50b] px-3 py-1 text-white"
                >
                  Add
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {posts[section]?.length > 0 ? (
                posts[section].map((p) => (
                  <div key={p.id} className="relative">
                    <TopCard
                      post={{ ...p, source: section === "tweets" ? "x" : section }}
                    />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPost(p);
                            setSelectedCategory(section);
                          }}
                          className="bg-[#1f8f0c] hover:bg-[#22a50b] text-white px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(section, p.id)}
                          className="bg-[#1f8f0c] hover:bg-[#22a50b] text-white px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No posts yet.</p>
              )}
            </div>
          </section>
        ))}
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
              <button
                className="bg-[#39ff14] text-black px-4 py-1 hover:bg-[#32cc12] "
                onClick={() => setEditingPost(null)}
              >
                Cancel
              </button>
              <button
                className="bg-[#39ff14] text-black px-4 py-1 hover:bg-[#32cc12]"
                onClick={() => handleSavePost(selectedCategory, editingPost)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
