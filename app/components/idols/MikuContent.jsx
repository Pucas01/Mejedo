"use client";

import { useState, useEffect, useRef } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Discography from "./Discography.jsx";
import { useTheme } from "../../hooks/useTheme";

export default function MikuContent({ idol }) {
  const { theme } = useTheme();
  const [infoCmd, setInfoCmd] = useState("");
  const [doneInfo, setDoneInfo] = useState(false);

  const infoRef = useRef(null);
  const [infoInView, setInfoInView] = useState(false);

  const infoCommand = "cat ~/miku/info.txt";

  // Intersection observer for info section
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px"
    };

    const infoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !infoInView) {
          setInfoInView(true);
        }
      });
    }, observerOptions);

    if (infoRef.current) {
      infoObserver.observe(infoRef.current);
    }

    return () => {
      if (infoRef.current) {
        infoObserver.unobserve(infoRef.current);
      }
    };
  }, [infoInView]);

  // Info terminal typing animation
  useEffect(() => {
    if (!infoInView) return;

    let i = 0;
    const interval = setInterval(() => {
      setInfoCmd(infoCommand.slice(0, i));
      i++;
      if (i > infoCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneInfo(true), 150);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [infoInView]);

  return (
    <div className="flex flex-col gap-4 text-xl min-h-screen text-white justify-start">
      {/* Info terminal */}
      <div ref={infoRef} className="bg-[#121217] min-h-[540px] border-2 border-[#39c5bb] shadow-lg relative flex flex-col overflow-hidden">
        <WindowDecoration title="Miku - info.txt" showControls={true} theme={theme.name} />
        <div className="p-8 flex-1 relative">
          {doneInfo && idol.backgroundImage && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${idol.backgroundImage})`,
                backgroundPosition: 'right center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'auto 150%',
                opacity: 0.3,
                maskImage: 'linear-gradient(to left, black 5%, black 5%, transparent 50%)',
              }}
            />
          )}
          {!doneInfo && (
            <div className="text-xl flex flex-wrap">
              <span className="text-[#39c5bb]">pucas01</span>
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
            <div className="space-y-4 mt-2 max-w-[60%] relative z-10">
              <header className="text-3xl text-[#39c5bb] font-bold">{idol.fullName}</header>
              <div className="text-gray-300 space-y-3 text-lg leading-relaxed">
                <p>
                  <span className="text-[#39c5bb]">Created:</span> {idol.birthDate}
                </p>
                <p>
                  <span className="text-[#39c5bb]">Origin:</span> {idol.origin}
                </p>
                <p>
                  <span className="text-[#39c5bb]">Genres:</span> {idol.genres}
                </p>
                {idol.bio.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="pt-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discography component */}
      <Discography idolId="miku" />

      {/* External Links */}
      <div className="bg-[#121217] border-2 border-[#39c5bb] shadow-lg relative flex flex-col overflow-hidden">
        <WindowDecoration title="Miku - ~/links" showControls={true} theme={theme.name} />
        <div className="p-8">
          <h3 className="text-xl text-[#39c5bb] font-bold mb-3">External Links</h3>
          <div className="text-gray-300 space-y-2 text-base">
            {idol.externalLinks.map((link, idx) => (
              <p key={idx}>
                <span className="text-[#39c5bb]">{link.name}:</span>{" "}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#39c5bb] underline decoration-wavy underline-offset-4"
                >
                  {link.url.replace('https://', '').replace('http://', '')}
                </a>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
