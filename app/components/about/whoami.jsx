"use client";
import { useState, useEffect, useRef } from "react";

export default function Whoami({
  aboutText = `### Intro
Hi! im Lucas, im... some? years old ( just look at the fetch  ) and a cis guy from the Netherlands
not really a developer but website are fun i guess, im more of a SysAdmin guy (Selfhosting, Networking, Linux)
|
### Fav things
Im a big fan of these things:
- Ado (she's my queen)
- Chainsaw Man
- The Legend of Zelda: Twilight Princess (I own 5 different copies)
- Miku / Teto / Rin / Len / Gumi
And much much more
|
### Skills
Some things im good at 
- Proxmox / Docker
- Arch Linux (Hyprland BTW)
- Networking stuff (Cisco CLI needs google sometimes)
- HTML / CSS (Mejedo, Suichi)
- Video editing (I make tiktoks)
- Shitposting on twitter dot com`
}) {
  const [cmd, setCmd] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const containerRef = useRef(null);

  const command = "cd /me && cat whoami.txt";

  // Intersection Observer: start typing when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStartTyping(true);
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => containerRef.current && observer.unobserve(containerRef.current);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!startTyping) return;

    let i = 0;
    const interval = setInterval(() => {
      setCmd(command.slice(0, i));
      i++;
      if (i > command.length) {
        clearInterval(interval);
        setTimeout(() => setDoneTyping(true), 200);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [startTyping]);

  // Format text for terminal style using ###, bullets, etc.
  const formatTerminalText = (text) => {
    return text.split("\n").map((line, idx) => (
      <p key={idx} className="mb-1 font-jetbrains">
        <span className={line.startsWith("###") ? "text-[#39ff14]" : "text-white"}>
          {line}
        </span>
      </p>
    ));
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 min-w-[400px] min-h-[610px] max-h-[610px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col"
    >
      {/* Typing command */}
      {!doneTyping && (
        <div className="p-6 font-jetbrains text-xl flex flex-wrap">
          <span className="text-[#39ff14]">pucas01</span>
          <span className="text-white">@</span>
          <span className="text-[#D73DA3]">PucasArch</span>
          <span className="text-white">:</span>
          <span className="text-[#FF5555]">~</span>
          <span className="text-white">$</span>
          <span className="text-white">&nbsp;{cmd}</span>
          <span className="cursor animate-blink">|</span>
        </div>
      )}

      {/* Terminal output */}
      {doneTyping && (
        <div className="p-6 text-md">
          <pre className="whitespace-pre-wrap">
            {formatTerminalText(aboutText)}
          </pre>
        </div>
      )}
    </div>
  );
}
