"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrentUser } from "./hooks/CurrentUser.js";

// Dynamic imports with preload capability
const pageComponents = {
  "/about": dynamic(() => import("./components/about/about.jsx")),
  "/projects": dynamic(() => import("./components/projects/projects.jsx")),
  "/guestbook": dynamic(() => import("./components/guestbook/guestbook.jsx")),
  "/blog": dynamic(() => import("./components/blog/blog.jsx")),
  "/shitposts": dynamic(() => import("./components/posts/posts.jsx")),
  "/admin": dynamic(() => import("./components/admin/admin.jsx")),
  "/collection": dynamic(() => import("./components/collection/collection.jsx")),
};

// Import functions for preloading
const pageImports = {
  "/about": () => import("./components/about/about.jsx"),
  "/projects": () => import("./components/projects/projects.jsx"),
  "/guestbook": () => import("./components/guestbook/guestbook.jsx"),
  "/blog": () => import("./components/blog/blog.jsx"),
  "/shitposts": () => import("./components/posts/posts.jsx"),
  "/admin": () => import("./components/admin/admin.jsx"),
  "/collection": () => import("./components/collection/collection.jsx"),
};

const FutabaOverlay = dynamic(() => import("./components/easteregg/futaba.jsx"));

export default function Page() {
  const [active, setActive] = useState("/about");
  const [transitioning, setTransitioning] = useState(false);
  const [popping, setPopping] = useState(null);
  const [open, setEgg] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [preloadedPages, setPreloadedPages] = useState(new Set(["/about"]));
  const { currentUser, isAdmin } = useCurrentUser();

  useEffect(() => {
    const ua = navigator.userAgent || window.opera;
    if (/android|iphone|ipad|ipod|windows phone/i.test(ua)) {
      setIsMobile(true);
    }
  }, []);

  // Preload a page component
  const preloadPage = useCallback(async (page) => {
    if (preloadedPages.has(page) || !pageImports[page]) return;

    try {
      await pageImports[page]();
      setPreloadedPages((prev) => new Set([...prev, page]));
    } catch (err) {
      console.error(`Failed to preload ${page}:`, err);
    }
  }, [preloadedPages]);

  // Preload on hover for instant navigation feel
  const handleMouseEnter = (page) => {
    if (page !== active) {
      preloadPage(page);
    }
  };

  const NavClick = async (page) => {
    if (page === active) return;

    setPopping(page);
    setTransitioning(true);

    // Start preloading immediately
    const preloadPromise = preloadPage(page);

    // Minimum animation time for visual feedback
    const minDelay = new Promise((res) => setTimeout(res, 400));

    // Wait for both preload AND minimum animation time
    await Promise.all([preloadPromise, minDelay]);

    setActive(page);
    setTransitioning(false);
    setPopping(null);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-[url(/LaptopSHQ.png)] bg-cover text-white gap-4">
        <div className="p-6 text-center bg-[#090909] text-[#39ff14] items-center justify-center flex-col flex border-[#39ff14] border-2">
        <p className="w-full text-xl text-center p-2 text-[#39ff14]">
          The website doesn't support mobile yet
        </p>
        <p className="w-full text-xl text-center p-2 text-[#39ff14]">
          Its like way too much work
        </p>
        <Image
          src="/randomimages/Yoshizawa.gif"
          alt="Mobile image"
          width={200}
          height={200}
          className="pt-2"
        />
        </div>
      </div>
    );
  }

  const ActiveComponent = pageComponents[active];

  return (
    <div className="flex flex-col min-h-screen bg-[url(/LaptopSHQ.png)] bg-cover bg-center bg-fixed bg-no-repeat text-white relative overflow-hidden">
      <header className="p-4 text-center bg-[#090909] text-[#39ff14]">
        <h1
          className="text-4xl font-bold flex cursor-pointer items-center justify-center gap-2"
          onClick={() => setEgg(true)}
        >
          /home/pucas01
        </h1>
        {isAdmin && <span>Admin Mode</span>}
      </header>

      <nav className="flex justify-center gap-6 bg-[#090909] border-b-2 border-[#39ff14] py-3">
        <div className="inline-flex gap-6 custom-dash pb-2">
          {["/about", "/projects", "/blog", "/collection", "/shitposts", "/guestbook", "/admin"].map(
            (page) => (
              <button
                key={page}
                onClick={() => NavClick(page)}
                onMouseEnter={() => handleMouseEnter(page)}
                className={`tracking-wide text-2xl px-2 cursor-pointer ${
                  active === page
                    ? "text-[#39ff14] border-b-1 border-[#39ff14]"
                    : "text-gray-400 hover:text-[#39ff14]"
                } ${popping === page ? "animate-pulse" : ""}`}
              >
                {page}
              </button>
            )
          )}
        </div>
      </nav>

      {transitioning && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Image
            src="/projects/medjed.png"
            alt="Loading..."
            width={180}
            height={12}
            className="opacity-100 animate-tilt"
            priority
          />
        </div>
      )}

      <main className="flex-1 pr-16 pl-16">
        {ActiveComponent && <ActiveComponent />}

        <FutabaOverlay
          show={open}
          imgSrc="/futaba/FutabaEasterEgg.webp"
          audioSrc="/futaba/FutabaEasterEgg.mp3"
          onClose={() => setEgg(false)}
        />
      </main>
    </div>
  );
}
