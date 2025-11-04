"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import About from "./components/about/about.jsx";
import Projects from "./components/projects/projects.jsx";
import GuestBook from "./components/guestbook/guestbook.jsx";
import FutabaOverlay from "./components/easteregg/futaba.jsx";
import BlogPosts from "./components/blog/blog.jsx";
import ShitPosts from "./components/posts/posts.jsx";
import Admin from "./components/admin/admin.jsx";
import { useCurrentUser } from "./hooks/CurrentUser.js";

export default function Page() {
  const [active, setActive] = useState("/about");
  const [transitioning, setTransitioning] = useState(false);
  const [popping, setPopping] = useState(null);
  const [open, setEgg] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentUser, isAdmin } = useCurrentUser();

  useEffect(() => {
    const ua = navigator.userAgent || window.opera;
    if (/android|iphone|ipad|ipod|windows phone/i.test(ua)) {
      setIsMobile(true);
    }
  }, []);

  const NavClick = (page) => {
    if (page === active) return;
    setPopping(page);
    setTransitioning(true);

    setTimeout(() => {
      setActive(page);
      setTransitioning(false);
      setPopping(null);
    }, 1000);
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
          {["/about", "/projects", "/blog", "/shitposts", "/guestbook", "/admin"].map(
            (page) => (
              <button
                key={page}
                onClick={() => NavClick(page)}
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
        {active === "/about" && <About />}
        {active === "/projects" && <Projects />}
        {active === "/shitposts" && <ShitPosts />}
        {active === "/guestbook" && <GuestBook />}
        {active === "/admin" && <Admin />}
        {active === "/blog" && <BlogPosts />}

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
