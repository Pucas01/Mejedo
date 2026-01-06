"use client";
import { useState, useEffect, useRef } from "react";
import Sticker from "../stickers/Sticker";

const WEBRING_SCRIPTS = [
  {
    name: "Persona Ring",
    src: "https://flonkie.github.io/personaring/persona5.setup.js",
  },
];

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

function WebringWidget({ src, name }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = src;
    containerRef.current.appendChild(script);

    return () => {
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

function ComplexWebringWidget({ name, containerId, css, scripts }) {
  const containerRef = useRef(null);
  const scriptsRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (containerRef.current.querySelector(`#${containerId}`)) return;

    let link = document.querySelector(`link[href="${css}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = css;
      document.head.appendChild(link);
    }

    const styleId = `${containerId}-override`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `#${containerId} { margin-left: 0 !important; margin-right: auto !important; }`;
      document.head.appendChild(style);
    }

    const widgetContainer = document.createElement("div");
    widgetContainer.id = containerId;
    containerRef.current.appendChild(widgetContainer);

    scripts.forEach((src) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    });

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
      <div className="bg-[#121217] min-h-[200px] p-8 border-2 border-[#39ff14] shadow-lg relative">
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

      <div className="bg-[#121217] border-2 p-8 border-[#39ff14] shadow-lg relative">
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
                <WebringWidget key={`simple-${index}`} src={ring.src} name={ring.name} />
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
  );
}
