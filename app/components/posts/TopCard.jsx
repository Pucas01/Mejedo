"use client";

import React from "react";
import Image from 'next/image'

const SourceBadge = ({ source }) => {
  switch (source) {
    case "tiktok":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium  bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2v8.5a3.5 3.5 0 1 0 3.5 3.5V6h-3.5z" />
          </svg>
          TikTok
        </span>
      );
    case "x":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium  bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Twitter
        </span>
      );
    case "youtube":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium  bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M10 8l6 4-6 4V8z" />
            <rect x="3" y="5" width="18" height="14" rx="3" />
          </svg>
          YouTube
        </span>
      );
    case "tenor":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium  bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" />
          </svg>
          Tenor
        </span>
      );
    default:
      return null;
  }
};

export default function TopCard({ post }) {
  const { title, thumbnail, url, source, meta } = post;

  return (
    <div className="flex flex-col bg-[#121217] border border-[#39ff14] transition-shadow shadow-sm hover:shadow-lg overflow-hidden  max-w-[320px]">
      <div className="relative">
        <Image
          src={thumbnail}
          alt={title || `${source} thumbnail`}
          className="object-cover w-auto select-none"
          height={500}
          width={500}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/projects/kysasa.webp";
          }}
        />
        <div className="absolute top-3 left-3">
          <SourceBadge source={source} />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col max-h-[125]    justify-between gap-2">
        <div>
          <h3 className="text-white text-sm  font-medium leading-snug">{title || "Untitled"}</h3>
          {meta && (
            <p className="text-xs text-gray-300 mt-1">
              {source === "youtube" && meta.views && `${meta.views.toLocaleString()} views • `}
              {source === "tiktok" && meta.views && `${meta.views.toLocaleString()} views • `}
              {meta.likes && `${meta.likes.toLocaleString()} likes`}
              {meta.retweets && ` • ${meta.retweets} RT`}
              {meta.shares && ` • ${meta.shares} shares`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#39FF14] border border-[#39ff14] px-3 py-1 hover:bg-[#32cc12] text-black"
          >
            Visit post
          </a>
        </div>
      </div>
    </div>
  );
}
