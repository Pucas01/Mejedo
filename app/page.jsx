"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrentUser } from "./hooks/CurrentUser.js";
import { useKonamiCode } from "./hooks/useKonamiCode.js";

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
const RhythmGame = dynamic(() => import("./components/easteregg/RhythmGame.jsx"));
const Mascot = dynamic(() => import("./components/mascot/Mascot.jsx"));

export default function Page() {
  const [active, setActive] = useState("/about");
  const [transitioning, setTransitioning] = useState(false); // About page doesn't need loading
  const [popping, setPopping] = useState(null);
  const [open, setEgg] = useState(false);
  const [rhythmGameOpen, setRhythmGameOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [preloadedPages, setPreloadedPages] = useState(new Set(["/about"]));
  const { currentUser, isAdmin } = useCurrentUser();
  const mainRef = useRef(null);

  // Konami code easter egg
  useKonamiCode(() => setRhythmGameOpen(true));

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

  // Wait for all images in a container to load (including dynamically added ones)
  const waitForImages = useCallback((container, waitForNewImages = false) => {
    if (!container) return Promise.resolve();

    const waitForExistingImages = () => {
      const images = container.querySelectorAll("img");
      if (images.length === 0) return Promise.resolve();

      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Don't block on failed images
        });
      });

      return Promise.all(imagePromises);
    };

    // If we need to wait for dynamically loaded images (API data)
    if (waitForNewImages) {
      return new Promise((resolve) => {
        let imageCount = container.querySelectorAll("img").length;
        let stableCount = 0;
        const checkInterval = 100;
        const stableThreshold = 3; // Need 3 consecutive checks with same count

        const checkForImages = async () => {
          const currentCount = container.querySelectorAll("img").length;

          if (currentCount === imageCount && currentCount > 0) {
            stableCount++;
            if (stableCount >= stableThreshold) {
              // Image count is stable, wait for them to load
              await waitForExistingImages();
              resolve();
              return;
            }
          } else {
            imageCount = currentCount;
            stableCount = 0;
          }

          setTimeout(checkForImages, checkInterval);
        };

        // Start checking after a small delay
        setTimeout(checkForImages, checkInterval);
      });
    }

    // Just wait for existing images
    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
    return Promise.race([waitForExistingImages(), timeout]);
  }, []);

  
  // Pages that fetch dynamic data and need image loading wait
  const pagesWithDynamicImages = ["/shitposts", "/collection"];

  const NavClick = async (page) => {
    if (page === active) return;

    const needsImageWait = pagesWithDynamicImages.includes(page);

    setPopping(page);
    setTransitioning(needsImageWait);

    // Start preloading immediately
    const preloadPromise = preloadPage(page);

    // Minimum animation time for visual feedback (only if showing loader)
    const minDelay = needsImageWait
      ? new Promise((res) => setTimeout(res, 400))
      : Promise.resolve();

    // Wait for JS preload and minimum animation
    await Promise.all([preloadPromise, minDelay]);

    // Render the new page
    setActive(page);

    // Only wait for images on pages with dynamic content
    if (needsImageWait) {
      const imageWait = waitForImages(mainRef.current, true);
      const maxTimeout = new Promise((resolve) => setTimeout(resolve, 5000));
      await Promise.race([imageWait, maxTimeout]);
    }

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
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none bg-black/80">
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

      <main ref={mainRef} className={`flex-1 pr-16 pl-16 ${transitioning ? "invisible" : "visible"}`}>
        {ActiveComponent && <ActiveComponent />}

        <FutabaOverlay
          show={open}
          imgSrc="/futaba/FutabaEasterEgg.webp"
          audioSrc="/futaba/FutabaEasterEgg.mp3"
          onClose={() => setEgg(false)}
        />

        <RhythmGame
          show={rhythmGameOpen}
          onClose={() => setRhythmGameOpen(false)}
        />
      </main>

      <Mascot />
    </div>
  );
}
