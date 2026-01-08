"use client";
import { useEffect, useState } from "react";

export default function Footer() {
  const date = new Date();
  const year = date.getFullYear();

  const [counterName, setCounterName] = useState("test");
  const [pageSize, setPageSize] = useState(null);
  const [appVersion, setAppVersion] = useState("...");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const [counterRes, changelogRes] = await Promise.all([
          fetch("/api/counter"),
          fetch("/api/changelog")
        ]);

        const counterData = await counterRes.json();
        setCounterName(counterData.counterName || "test");

        const changelogData = await changelogRes.json();
        if (changelogData && changelogData.length > 0) {
          setAppVersion(changelogData[0].version);
        }
      } catch (err) {
        console.error("Failed to load footer config:", err);
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    const calculateSize = () => {
      let total = 0;

      if (document && document.documentElement) {
        total += new TextEncoder().encode(document.documentElement.outerHTML).length;
      }

      const resources = performance.getEntriesByType("resource");
      resources.forEach((res) => {
        if (res.transferSize) total += res.transferSize;
      });

      setPageSize(total);
    };

    window.addEventListener("load", calculateSize);
    return () => window.removeEventListener("load", calculateSize);
  }, []);

  const counterUrl = `https://count.getloli.com/@${encodeURIComponent(counterName)}?name=${encodeURIComponent(
    counterName
  )}&theme=moebooru&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=0`;

  const formatSize = (bytes) => {
    if (bytes === null) return "Calculating...";
    const kb = (bytes / 1024).toFixed(1);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${kb} KB (${mb} MB)`;
  };

  return (
    <footer className="w-full bg-[rgba(9,9,9,0.9)] border-t-2 border-[#39ff14] text-[#39ff14] text-sm flex flex-col items-center py-3 select-none">
      <div className="flex items-center gap-2">
        <img src={counterUrl} alt="Site Counter" />
      </div>

      <p className="text-gray-400 mt-1">© {year} pucas01 — all rights reserved</p>
      <p className="text-gray-400 mt-1 text-xs">Page size: {formatSize(pageSize)}</p>
      <small>Version: {appVersion}</small>
    </footer>
  );
}
