"use client";
import { useState } from "react";
import BlogList from "./list.jsx";
import BlogPost from "./post.jsx";
import { useAchievements } from "../../hooks/useAchievements.js";

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const { unlock } = useAchievements();

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    unlock("blog_reader");
  };

  return (
    <>
      {selectedPost ? (
        <BlogPost post={selectedPost} onBack={() => setSelectedPost(null)} />
      ) : (
        <BlogList onSelectPost={handleSelectPost} />
      )}
    </>
  );
}
