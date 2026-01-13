"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import Button from "../ui/Button";

const SourceBadge = ({ source }) => {
  switch (source) {
    case "tiktoks":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2v8.5a3.5 3.5 0 1 0 3.5 3.5V6h-3.5z" />
          </svg>
          TikTok
        </span>
      );
    case "x":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Twitter
        </span>
      );
    case "youtube":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium bg-black/40 border border-[#39ff14]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M10 8l6 4-6 4V8z" />
            <rect x="3" y="5" width="18" height="14" rx="3" />
          </svg>
          YouTube
        </span>
      );
    case "tenor":
      return (
        <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium bg-black/40 border border-[#39ff14]">
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

function TopCard({ post }) {
  const { title, thumbnail, url, source, meta } = post;
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="flex flex-col bg-[#121217] border border-[#39ff14] transition-shadow shadow-sm hover:shadow-lg overflow-hidden max-w-[320px] h-full">
      <div className="relative w-full flex-none">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-[#1a1a1f] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={imgError ? "/projects/kysasa.webp" : thumbnail}
          alt={title || `${source} thumbnail`}
          className={`object-contain w-full transition-opacity ${imgLoaded || imgError ? "opacity-100" : "opacity-0"}`}
          width={500}
          height={500}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
        <div className="absolute top-3 left-3">
          <SourceBadge source={source} />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-2 min-h-[100px]">
        <div>
          <h3 className="text-white text-sm font-medium leading-snug">{title || "Untitled"}</h3>
          {meta && (
            <p className="text-xs text-gray-300 mt-1">
              {meta.views != null && `${meta.views.toLocaleString()} views`}
              {meta.likes != null && ` • ${meta.likes.toLocaleString()} likes`}
              {meta.retweets != null && ` • ${meta.retweets} RT`}
              {meta.shares != null && ` • ${meta.shares} shares`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <Button
            as="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="sm"
          >
            Visit post
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(TopCard);
