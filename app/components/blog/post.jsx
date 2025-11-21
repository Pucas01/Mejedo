"use client";
import { useMemo } from "react";
import { marked } from "marked";

export default function BlogPost({ post, onBack }) {
  if (!post) return null;

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const parsedHTML = useMemo(() => {
    if (!post.body) return "";

    // Convert custom markdown image syntax to HTML
    // Example: ![alt](url){width=400 height=200}
    const processedMarkdown = post.body.replace(
      /!\[(.*?)\]\((.*?)\)\{width=(\d+)(?:\s*height=(\d+))?\}/g,
      (_, alt, src, width, height) => {
        const hAttr = height ? `height="${height}"` : "";
        return `<img src="${src}" alt="${alt}" width="${width}" ${hAttr} class="object-cover my-2" />`;
      }
    );

    return marked.parse(processedMarkdown);
  }, [post.body]);

  return (
    <div className="p-4">
    <div className="min-h-screen p-6 border-2 border-[#39ff14] text-white bg-[#121217]">
      <button
        onClick={onBack}
        className="mb-6 text-[#39ff14] hover:text-white cursor-pointer transition"
      >
        ← Back to blog
      </button>

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-400 mb-6">
        <span>Published on: </span>
        {new Date(post.publishDate).toLocaleDateString()} • {post.readTime} read
      </p>

      <article
        className="prose prose-invert max-w-none text-gray-200"
        dangerouslySetInnerHTML={{ __html: parsedHTML }}
      />
    </div>
    </div>
  );
}
