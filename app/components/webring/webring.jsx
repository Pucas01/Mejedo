"use client";
import { useState, useEffect, useRef } from "react";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";

// External webring scripts to load (simple single-script webrings)
const WEBRING_SCRIPTS = [
  {
    name: "Persona Ring",
    src: "https://flonkie.github.io/personaring/persona5.setup.js",
  },
  {
    name: "Project Sekai Ring",
    src: "https://dazaisfunpalace.nekoweb.org/pjsk.js",
    dataWidget: "n25",
  },
];

// Webrings that need more complex setup (CSS + multiple scripts + container)
const COMPLEX_WEBRINGS = [
  {
    name: "Vocaring",
    containerId: "vocaring",
    css: "https://electric-tenshi.nekoweb.org/vocaring/vocaring.css",
    scripts: [
      "https://electric-tenshi.nekoweb.org/vocaring/vocaring-variables.js",
      "https://electric-tenshi.nekoweb.org/vocaring/vocaring-widget.js",
    ],
  },
];

// Component to load a webring script properly
function WebringWidget({ src, name, dataWidget }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create and append the script inside the container
    const script = document.createElement("script");
    script.src = src;
    if (dataWidget) {
      script.setAttribute("data-widget", dataWidget);
    }
    containerRef.current.appendChild(script);

    // Force left alignment on all child elements after script loads
    setTimeout(() => {
      if (containerRef.current) {
        const allElements = containerRef.current.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.textAlign = 'left';
          el.style.marginLeft = '0';
          el.style.marginRight = 'auto';
        });
      }
    }, 100);

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [src, dataWidget]);

  return (
    <div className="border border-[#39ff14] p-4">
      <h3 className="text-[#39ff14] font-bold mb-3">{name}</h3>
      <div ref={containerRef} style={{ textAlign: 'left' }} />
    </div>
  );
}

// Component for complex webrings with CSS and multiple scripts
function ComplexWebringWidget({ name, containerId, css, scripts }) {
  const containerRef = useRef(null);
  const scriptsRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if already has content (prevents double-load in Strict Mode)
    if (containerRef.current.querySelector(`#${containerId}`)) return;

    // Check if CSS already exists
    let link = document.querySelector(`link[href="${css}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = css;
      document.head.appendChild(link);
    }

    // Add override styles to align left
    const styleId = `${containerId}-override`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `#${containerId} { margin-left: 0 !important; margin-right: auto !important; }`;
      document.head.appendChild(style);
    }

    // Create the container div with the required ID
    const widgetContainer = document.createElement("div");
    widgetContainer.id = containerId;
    containerRef.current.appendChild(widgetContainer);

    // Remove any existing scripts for this widget so they reload fresh
    scripts.forEach((src) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    });

    // Load scripts sequentially
    const loadedScripts = [];
    const loadScripts = async () => {
      for (const src of scripts) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          script.onerror = resolve;
          document.body.appendChild(script);
          loadedScripts.push(script);
        });
      }
    };

    loadScripts();
    scriptsRef.current = loadedScripts;

    // Cleanup on unmount - remove scripts so they reload fresh next time
    return () => {
      scriptsRef.current.forEach((script) => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
      scriptsRef.current = [];
    };
  }, [containerId, css, scripts]);

  return (
    <div className="border border-[#39ff14] p-4">
      <h3 className="text-[#39ff14] font-bold mb-3">{name}</h3>
      <div ref={containerRef} className="[&>*]:ml-0 [&>*]:mr-auto" />
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
      <div className="bg-[#121217] min-h-[200px] border-2 border-[#39ff14] shadow-lg relative flex flex-col overflow-hidden">
        <WindowDecoration title="Webring - webrings.txt" showControls={true} />
        <div className="p-8 flex-1 relative">
          <Sticker
            src="/stickers/futaba-jacket.png"
            position="top-left"
            size={70}
            rotation={-10}
            offset={{ x: -18, y: -18 }}
          />
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
              <header className="text-2xl text-[#FFFFFF]">Webrings</header>
              <p className="text-gray-400">
                This is where i place all my webrings, cool right? yeah i know.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Webrings list */}
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg relative flex flex-col overflow-hidden">
        <WindowDecoration title="Webrings - ~/Webrings" showControls={true} />
        <div className="p-8 flex-1 relative">
          <Sticker
            src="/stickers/futaba-pointing.png"
            position="bottom-right"
            size={75}
            rotation={8}
            offset={{ x: 20, y: 20 }}
          />
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
              <p className="text-2xl mb-4">Webrings I'm part of:</p>
              <div className="space-y-6">
                {WEBRING_SCRIPTS.map((ring, index) => (
                  <WebringWidget
                    key={`simple-${index}`}
                    src={ring.src}
                    name={ring.name}
                    dataWidget={ring.dataWidget}
                  />
                ))}
                {COMPLEX_WEBRINGS.map((ring, index) => (
                  <ComplexWebringWidget
                    key={`complex-${index}`}
                    name={ring.name}
                    containerId={ring.containerId}
                    css={ring.css}
                    scripts={ring.scripts}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
