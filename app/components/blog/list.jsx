"use client";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import Sticker from "../stickers/Sticker";

export default function BlogList({ onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useCurrentUser();

  const fetchPosts = async () => {
    const res = await fetch("/api/blogposts");
    const data = await res.json();
    setPosts(data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate)));
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getPreviewText = (markdown, wordCount = 20) => {
  if (!markdown) return "";


  const plainText = markdown
    .replace(/!\[.*?\]\(.*?\)(\{.*?\})?/g, "") 
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")   
    .replace(/(```[\s\S]*?```|`.*?`)/g, "")    
    .replace(/[#>*_~\-]/g, "")                
    .replace(/\n/g, " ");                     

  const words = plainText.split(" ");
  return words.slice(0, wordCount).join(" ") + (words.length > wordCount ? "..." : "");
};


  const estimateReadTime = (markdown) => {
    if (!markdown) return "1 min";
    const plainText = markdown
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/(```[\s\S]*?```|`.*?`)/g, "")
      .replace(/[#>*_~\-]/g, "")
      .replace(/\n/g, " ");
    const wordCount = plainText.trim().split(/\s+/).length;
    const wordsPerMinute = 150;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${minutes} min`;
  };

  const handleAdd = async () => {
    const newPost = {
      title: "New Blog Post",
      body: "",
      images: [],
      publishDate: new Date().toISOString(),
      readTime: estimateReadTime(""),
    };
    await fetch("/api/blogposts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
      credentials: "include",
    });
    fetchPosts();
  };

  const handleDelete = async (post) => {
    if (!confirm("Delete this post?")) return;
    if (post.images?.length) {
      for (const image of post.images) {
        if (image.startsWith("/uploads/")) {
          await fetch(image, { method: "DELETE" }).catch(() => {});
        }
      }
    }
    await fetch(`/api/blogposts/${post.id}`, { method: "DELETE", credentials: "include" });
    fetchPosts();
  };

  const handleSave = async (updated) => {
    const updatedWithReadTime = {
      ...updated,
      readTime: estimateReadTime(updated.body),
    };
    await fetch(`/api/blogposts/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedWithReadTime),
      credentials: "include",
    });
    setEditingPost(null);
    fetchPosts();
  };

  const handleImageUpload = async (files) => {
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  };


  return (
    <div className="min-h-screen p-4 text-white">
      <div className="bg-[#121217] border-2 border-[#39ff14] p-6 flex flex-col justify-between items-start mb-6 relative">
        <Sticker
          src="/stickers/futaba-keyboard.png"
          position="top-left"
          size={70}
          rotation={-12}
          offset={{ x: -18, y: -18 }}
        />
        <div className="w-full flex justify-between items-center">
          <h1 className="text-2xl font-bold">Blog</h1>
          {isAdmin && (
            <button
              onClick={handleAdd}
              className="bg-[#1f8f0c] hover:bg-[#22a50b] px-3 py-1 text-white"
            >
              Add Post
            </button>
          )}
        </div>
        <p className="text-gray-400 text-xl mt-2">
          So this is where i post some blog posts, they won't be to long tho, i'll write one when something cool happens.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {posts.map((post, index) => {
          const postStickers = [
            { src: "/stickers/futaba-happy.png", rotation: 8, position: "top-right" },
            { src: "/stickers/futaba-sitting.png", rotation: -10, position: "bottom-left" },
            { src: "/stickers/futaba-peace.png", rotation: 12, position: "top-left" },
          ];
          const stickerConfig = postStickers[index % postStickers.length];

          return (
          <div
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="bg-[#121217] border-2 border-[#39ff14] hover:border-[#22a50b] p-4 min-w-full transition cursor-pointer relative"
          >
            <Sticker
              src={stickerConfig.src}
              position={stickerConfig.position}
              size={60}
              rotation={stickerConfig.rotation}
              offset={{ x: 28, y: 28 }}
            />
            <h2 className="text-xl font-semibold pb-1">{post.title}</h2>
            <p className="text-gray-400 text-sm mb-2">
              {new Date(post.publishDate).toLocaleDateString()} • {post.readTime}
            </p>
            <div className="text-gray-300 text-sm line-clamp-3 pb-6">
              {getPreviewText(post.body, 20)}
            </div>
            <button
              onClick={() => onSelectPost(post)}
              className="px-2 py-1 bg-[#1f8f0c] hover:bg-[#22a50b] cursor-pointer text-white"
            >
              Read More
            </button>

            {isAdmin && (
              <div
                className="flex justify-end gap-2 mt-3 z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEditingPost(post)}
                  className="px-2 py-1 bg-[#1f8f0c] hover:bg-[#22a50b] text-white cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post)}
                  className="px-2 py-1 bg-[#1f8f0c] hover:bg-[#22a50b] text-white cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {editingPost && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 overflow-auto">
          <div className="bg-[#121217] border-2 border-[#39ff14] p-6 rounded w-[600px] flex flex-col gap-2">
            <h2 className="text-lg font-bold mb-2">Edit Post</h2>

            <input
              type="text"
              value={editingPost.title}
              onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1"
              placeholder="Title"
            />

            {/* Single Markdown textarea */}
            <textarea
              id="editingBody"
              value={editingPost.body}
              onChange={(e) => setEditingPost({ ...editingPost, body: e.target.value })}
              className="bg-[#121217] border border-[#39ff14] text-white px-2 py-1 resize-none h-40"
              placeholder="Markdown body"
            />

            {/* Image uploads with Insert button */}
            <label className="text-sm text-gray-400 mt-2">Upload Images to Insert:</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length) {
                  const urls = await handleImageUpload(files);
                  setEditingPost({ ...editingPost, images: [...(editingPost.images || []), ...urls] });
                }
              }}
              className="text-gray-300 text-sm"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {editingPost.images?.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    className="w-24 h-24 object-cover border border-[#39ff14] rounded"
                    title="Click Insert to add to Markdown"
                  />

                  {/* Insert button */}
                  <button
                    onClick={() => {
                      // Ask user for width/height or use defaults
                      const width = prompt("Width (px)?", "400");
                      const height = prompt("Height (px)?", "300");
                      const cursorPos = document.querySelector("#editingBody").selectionStart || 0;
                      const newBody =
                        editingPost.body.slice(0, cursorPos) +
                        `![Image](${url}){width=${width} height=${height}}` +
                        editingPost.body.slice(cursorPos);
                      setEditingPost({ ...editingPost, body: newBody });
                    }}
                    className="absolute bottom-0 left-0 bg-[#1f8f0c] text-white text-xs px-1"
                  >
                    Insert
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() =>
                      setEditingPost({
                        ...editingPost,
                        images: editingPost.images.filter((_, idx) => idx !== i),
                      })
                    }
                    className="absolute top-0 right-0 bg-red-600 text-white px-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditingPost(null)} className="bg-gray-600 text-white px-4 py-1">
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingPost)}
                className="bg-[#39ff14] text-black px-4 py-1 hover:bg-[#32cc12]"
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
