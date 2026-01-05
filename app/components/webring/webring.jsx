"use client";
import { useState, useEffect, useRef } from "react";

// External webring scripts to load
const WEBRING_SCRIPTS = [
  {
    name: "Persona Ring",
    src: "https://flonkie.github.io/personaring/persona5.setup.js",
  },
];

// Component to load a webring script properly
function WebringWidget({ src, name }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create and append the script inside the container
    const script = document.createElement("script");
    script.src = src;
    containerRef.current.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [src]);

  return (
    <div className="border border-[#39ff14] p-4">
      <h3 className="text-[#39ff14] font-bold mb-3">{name}</h3>
      <div ref={containerRef} />
    </div>
  );
}

export default function Webring() {
  const [infoCmd, setInfoCmd] = useState("");
  const [doneInfo, setDoneInfo] = useState(false);
  const [listCmd, setListCmd] = useState("");
  const [doneList, setDoneList] = useState(false);

  const infoCommand = "cat ~/webrings.txt";
  const listCommand = "ls -la ~/webrings/";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setInfoCmd(infoCommand.slice(0, i));
      i++;
      if (i > infoCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneInfo(true), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setListCmd(listCommand.slice(0, i));
      i++;
      if (i > listCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneList(true), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 text-xl min-h-screen text-white justify-start">
      {/* Info terminal */}
      <div className="bg-[#121217] min-h-[200px] p-8 border-2 border-[#39ff14] shadow-lg">
        {!doneInfo && (
          <div className="text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{infoCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneInfo && (
          <div className="space-y-2 mt-2">
            <header className="text-2xl text-[#39ff14]">Webrings</header>
            <p>
              This is where i place all my webrings, cool right? yeah i know.
            </p>
          </div>
        )}
      </div>

      {/* Webrings list */}
      <div className="bg-[#121217] border-2 p-8 border-[#39ff14] shadow-lg">
        {!doneList && (
          <div className="text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{listCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneList && (
          <>
            <p className="text-[#39ff14] mb-4">Webrings I'm part of:</p>
            <div className="space-y-6">
              {WEBRING_SCRIPTS.length === 0 ? (
                <div className="text-gray-400">
                  <p>No webrings yet... coming soon!</p>
                </div>
              ) : (
                WEBRING_SCRIPTS.map((ring, index) => (
                  <WebringWidget key={index} src={ring.src} name={ring.name} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
