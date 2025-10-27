import React from "react";
import TopCard from "./TopCard.jsx";
import topPosts from "./topPosts.js";

export const metadata = {
  title: "Top posts",
};

export default function Page() {
  return (
    <div className="min-h-screen p-6  text-white font-jetbrains">
      <div className=" mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="bg-[#121217] border-2 border-[#39ff14]  p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shitposts</h1>
            <p className="text-xl text-gray-400 mt-1">A collection of some shitpost i made sometime i guess (i fucking hate my YT)</p>
          </div>
        </div>

        {/* Sections */}
        <section className="bg-[#121217] p-6 border-[#39ff14] border-2 space-y-3">
          <h2 className="text-xl text-[#39ff14]">Top TikToks</h2>
          <div className="flex flex-wrap gap-4">
            {topPosts.tiktoks.map((p) => (
              <TopCard post={{ ...p, source: "tiktok" }} key={p.id} />
            ))}
          </div>
        </section>

        <section className="bg-[#121217] p-6 border-[#39ff14] border-2 space-y-3">
          <h2 className="text-xl text-[#39ff14]">Top Tweets</h2>
          <div className="flex flex-wrap gap-4">
            {topPosts.tweets.map((p) => (
              <TopCard post={{ ...p, source: "x" }} key={p.id} />
            ))}
          </div>
        </section>

        <section className="bg-[#121217] p-6 border-[#39ff14] border-2 space-y-3">
          <h2 className="text-xl text-[#39ff14]">Top Tenor GIFs</h2>
          <div className="flex flex-wrap gap-4">
            {topPosts.tenor.map((p) => (
              <TopCard post={{ ...p, source: "tenor" }} key={p.id} />
            ))}
          </div>
        </section>

        <section className="bg-[#121217] p-6 border-[#39ff14] border-2 space-y-3">
          <h2 className="text-xl text-[#39ff14]">Top YouTube Videos</h2>
          <div className="flex flex-wrap gap-4">
            {topPosts.youtube.map((p) => (
              <TopCard post={{ ...p, source: "youtube" }} key={p.id} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
