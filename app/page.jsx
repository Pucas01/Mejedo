"use client";

import { useState } from "react";
import Image from "next/image";
import About from "./components/about.jsx"

export default function Page() {
  const [active, setActive] = useState("/about");
  const [transitioning, setTransitioning] = useState(false);
  const [popping, setPopping] = useState(null);

  const NavClick = (page) => {
    if (page === active) return;
    setPopping(page);
    setTransitioning(true);

    setTimeout(() => {
      setActive(page);
      setTransitioning(false);
      setPopping(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[url(/LaptopHQ.png)] bg-cover text-white relative overflow-hidden">
      <header className="p-4 text-center bg-[rgba(9,9,9,0.9)] text-[#39ff14]">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          /home/pucas01
        </h1>
      </header>

      <nav className="flex justify-center gap-6 bg-[rgba(9,9,9,0.9)] border-[#1f1f29] py-3">
        <div className="inline-flex gap-6 custom-dash pb-2">
        {["/about", "/projects", "/collection", "/other"].map((page) => (
          <button
            key={page}
            onClick={() => NavClick(page)}
            className={` tracking-wide text-2xl px-2 cursor-pointer ${
              active === page
                ? "text-[#39ff14] border-b-1 border-[#39ff14]"
                : "text-gray-400 hover:text-[#39ff14]"
            } ${popping === page ? "animate-pulse" : ""}`}
          >
            {page}
          </button>
        ))}
        </div>
      </nav>

      {transitioning && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300 animate-fade-in">
          <Image
            src="/medjed.png" // replace with your own image in /public/images/
            alt="Loading..."
            width={180}
            height={12}
            className="opacity-100 animate-tilt"
            priority
          />
        </div>
      )}
      
      <main
        className={`flex-1 pr-16 pl-16 transition-opacity duration-300 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {active === "/about" && (
          <About />
        )}

        {active === "/projects" && (
          <section className="text-center">
          </section>
        )}

        {active === "/collection" && (
          <section className="text-center">
          </section>
        )}

        {active === "/other" && (
          <section className="text-center">
          </section>
        )}
      </main>


    </div>
  );
}
