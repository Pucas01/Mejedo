"use client";
import { useEffect, useState } from "react";

export default function Footer() {
    const date = new Date();
    const year = date.getFullYear();

    const [counterName, setCounterName] = useState("test");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/counter");
        const data = await res.json();
        setCounterName(data.counterName || "test");
      } catch (err) {
        console.error("Failed to load footer config:", err);
      }
    }

    fetchConfig();
  }, []);

  const counterUrl = `https://count.getloli.com/@${encodeURIComponent(counterName)}?name=${encodeURIComponent(
    counterName
  )}&theme=moebooru&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=0`;


  return (
    <footer className="w-full bg-[rgba(9,9,9,0.9)] border-t-2 border-[#39ff14] text-[#39ff14] text-sm flex flex-col items-center py-3 select-none">
      <div className="flex items-center gap-2">
        <img
          src={counterUrl}
          alt="Site Counter"
        />
      </div>
      <p className="text-gray-400 mt-1">© {year} pucas01 — all rights reserved</p>
    </footer>
  );
}
