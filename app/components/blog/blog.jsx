"use client";
import { useState } from "react";
import BlogList from "./list.jsx";
import BlogPost from "./post.jsx";

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <>
      {selectedPost ? (
        <BlogPost post={selectedPost} onBack={() => setSelectedPost(null)} />
      ) : (
        <BlogList onSelectPost={(post) => setSelectedPost(post)} />
      )}
    </>
  );
}
