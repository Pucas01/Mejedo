"use client";

import { useState, useEffect, useRef } from "react";

export default function About() {
  const [fastfetch, setFastfetch] = useState("");
  const [linksCmd, setLinksCmd] = useState("");
  const [doneFastfetch, setDoneFastfetch] = useState(false);
  const [doneLinks, setDoneLinks] = useState(false);
  const [startLinks, setStartLinks] = useState(false);

  const command1 = "fastfetch";
  const command2 = "find . -maxdepth 1 -type l -ls";

  const secondRef = useRef(null);

  // First typing (fastfetch)
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setFastfetch(command1.slice(0, i));
      i++;
      if (i > command1.length) {
        clearInterval(interval);
        setTimeout(() => setDoneFastfetch(true), 300);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Observe second terminal for scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStartLinks(true);
      },
      { threshold: 0.3 }
    );
    if (secondRef.current) observer.observe(secondRef.current);
    return () => {
      if (secondRef.current) observer.unobserve(secondRef.current);
    };
  }, []);

  // Second typing (links)
  useEffect(() => {
    if (!startLinks) return;
    let i = 0;
    const interval = setInterval(() => {
      setLinksCmd(command2.slice(0, i));
      i++;
      if (i > command2.length) {
        clearInterval(interval);
        setTimeout(() => setDoneLinks(true), 200);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [startLinks]);

    const asciiLogo = [
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢑⡢⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
"⠀⠀⠀⠀⠀⠀⠀⢀⠀⣾⣿⣿⣦⡀⠀⠀⠀⢀⣴⣧⣶⠯⠗⠒⠒⢪⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⡈⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
"⠀⠀⠀⠀⠀⠀⠀⢈⣼⣟⣁⣿⣿⣻⣶⣶⣿⣿⣿⡋⠀⠀⠀⠀⣠⣾⡇⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⠢⡈⠣⡀⠀⠀⠀⠀⠀⠀⠀⠀",
"⠀⠀⠀⠀⠀⣀⡴⣿⣷⣶⣿⣟⠘⢿⣿⣿⣿⠛⠀⠀⠀⠀⢠⣾⣿⣿⠀⠀⢀⡞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠈⢣⠈⢄⠱⡄⠀⠀⠀⠀⠀⠀⠀",
"⠀⢐⠶⣶⠭⠵⠶⢿⣿⣭⣿⣤⡀⢰⣿⣿⣿⣭⣭⠽⣶⣴⣿⣿⣿⠃⠀⢀⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡀⠀⠀⢣⠈⢆⠹⡀⠀⠀⠀⠀⠀⠀",
"⠁⢁⣤⣌⢹⣶⣾⠟⠁⣠⡾⣿⣿⢼⣿⡟⠏⢯⣟⢿⣿⣿⡿⢣⠃⠀⠀⡜⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣇⠀⠀⠀⡆⠈⡆⢱⠀⠀⠀⠀⠀⠀",
"⠀⠙⠻⣿⣦⣏⣻⡤⣾⡿⣳⠟⠓⠋⣿⠀⠀⣨⣿⣷⣮⣉⡴⠃⠀⠀⢰⠇⠀⠀⠀⠀⢀⡗⠀⢰⢧⠀⠀⠀⠀⠀⠀⠀⢀⠀⣿⡇⠀⢰⢱⠀⢸⡀⡇⠀⠀⠀⠀⠀",
"⠀⠀⠀⠈⢻⡦⠽⣿⡟⣴⣏⣀⡀⣠⣿⣠⣾⣿⣿⣿⣾⡅⠀⠀⠀⠀⡼⠀⠀⠀⠀⠀⣸⡇⠀⢨⣼⠀⠀⠀⠀⡄⠀⠀⢠⠀⣯⣿⠀⢸⢸⠀⠀⡇⢸⠀⠀⠀⠀⠀",
"⠀⠀⠀⣤⣴⡓⢚⣿⣼⡉⣳⠦⢤⣀⠈⢦⡈⣿⣿⣿⣽⠇⠀⠀⠀⢀⡇⠀⠀⠀⡖⢸⣿⠇⠀⣼⣇⠀⠀⠀⠀⡇⠀⠀⡆⢰⡏⢹⡆⢸⣸⠀⠀⢡⠀⡇⠀⠀⠀⠀",
"⠀⢰⠾⠛⠉⠉⣿⠾⣟⣉⣀⢶⣄⠙⣦⠈⢳⡜⣏⠳⣿⠀⠀⠀⠀⢸⠁⠀⠀⡼⣠⢛⡟⠀⣰⢇⣿⠀⠀⡀⢸⠁⠀⣰⣷⡞⠀⠀⡇⣼⣿⠀⠀⢸⠀⡇⠀⠀⠀⠀",
"⠰⠀⣀⣀⣀⡜⢈⠀⢨⣅⡀⠉⠛⢢⡈⠳⡄⠙⡎⣦⡟⠀⠀⣇⠀⡍⠀⢠⡾⡵⣣⣯⠇⣰⡿⢻⡟⠀⢠⢣⡟⠀⣰⣿⣿⡴⠞⠋⣏⣿⣻⠀⠀⠘⠀⡇⠀⠀⠀⠀",
"⢰⠞⠋⠍⠉⢣⠸⡻⣷⢾⡇⠀⠀⠀⠁⠰⠃⡞⣹⠻⡇⠀⠀⣼⠀⡇⢘⣟⣾⣿⣻⡿⣼⠿⠥⣼⣇⣠⣧⡟⢁⡴⢫⡟⠋⢀⣀⣼⣿⣿⢿⡇⠀⡇⣸⡇⠀⠀⠀⠀",
"⠂⠀⠀⠀⠀⠈⢆⡵⢻⡿⠁⠀⠀⠀⠀⠀⡜⣰⠛⣿⡇⠀⠀⢸⡀⣷⣿⠟⠉⢁⣾⠞⠁⠀⢀⠎⣰⠿⣿⡷⠋⠀⠁⠀⣰⣿⣿⣿⡏⠻⣿⣿⢻⠋⠀⡇⠀⠀⠀⠀",
"⠀⠀⠀⢀⡠⠔⣫⣿⣿⠁⠀⠀⠀⠀⠀⡸⢠⠃⣀⠈⡇⡇⡆⢸⣇⢹⣀⣀⣴⣿⣿⠶⣶⣦⣯⡙⠀⠘⠉⠀⠀⠀⠀⠀⢸⣿⣿⠗⡇⢰⢻⡇⣼⠀⠀⡇⠀⠀⠀⠀",
"⠀⠀⠀⢠⡶⠛⡽⣣⣿⠀⠀⢀⣀⠀⣠⢡⢏⣮⠦⣍⡇⡇⡇⠘⣼⣼⣴⣿⠟⣿⡶⣾⣟⣛⡏⠛⠧⠀⠀⠀⠀⠀⠀⠀⠈⣟⠚⡼⣡⠇⣸⢡⡟⠀⢀⠇⠀⠀⠀⠀",
"⠀⠠⠔⢩⠞⡽⠋⠀⣻⡖⢾⣋⣷⣬⣏⡽⢿⠸⡄⡞⢣⡇⢏⠉⢯⣷⣟⠻⣆⠹⡜⢮⠍⣼⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠋⠁⠀⣿⡏⡇⠀⢸⠀⠀⠀⠀⠀",
"⠀⠀⢠⠃⢰⠃⢠⢶⣿⣾⠟⠛⠉⠉⠙⢿⡟⠳⡹⣅⢸⣻⢸⠀⣜⣿⣿⡄⠀⠙⠚⠓⠺⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⠀⡇⠀⡏⠀⠀⠀⠀⠀",
"⠙⢤⡘⠀⢸⠰⣯⢿⠟⡅⠀⢀⣠⣤⣤⣼⣷⡀⠈⠓⢽⣿⡈⡆⠸⣿⠈⠻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡴⢻⣏⠀⡇⢀⡇⠀⠀⠀⠀⠀",
"⢦⡀⠑⢄⡸⡄⠀⠀⢣⣸⣶⣿⠟⠻⡏⠉⢷⣙⣢⡀⠀⢹⢧⢳⠀⣯⡄⠀⠉⠣⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢐⠎⢸⠀⡇⢸⡄⢰⠀⠀⠀⠀",
"⠀⠙⢆⠀⠑⢧⠀⡇⠈⡿⢻⡇⠀⠀⢹⠀⠀⢳⣌⠙⠳⣼⡜⣎⡆⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠋⠀⠈⣧⢣⢸⡷⡀⡆⠀⠀⠀",
"⠀⠀⠈⢣⣲⡀⣷⣽⡀⡇⢼⠃⠀⠀⠘⡀⠀⠈⠙⠓⠀⠈⢧⠘⢿⡀⣿⡏⠙⠢⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠶⠂⠀⠀⢀⠜⠁⠀⠀⠀⢻⣼⡸⣇⢱⡘⡄⠀⠀",
"⢢⡀⠀⠀⢻⡗⢹⠘⣿⡇⠈⠀⠀⠀⠀⠃⠀⠀⠀⠀⠀⠀⠈⡆⠈⢿⣿⡇⠀⠀⠈⠑⠦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡔⢁⣀⠀⠀⠀⠀⠈⣇⡇⢸⠘⢷⠸⡀⠀",
"⠈⠙⢷⡀⣸⢃⣾⣄⢈⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡄⠈⢿⡇⠀⠀⠀⠀⠀⠀⠉⠑⠒⣤⣤⣀⣀⣀⡰⠋⠒⣠⣬⢭⣤⣾⣿⠀⢹⠈⠘⠃⠘⠄⢱⠀",
"⠀⠀⠀⣰⡿⣏⠘⢮⣹⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⠀⢸⣿⣦⡀⠀⠀⠀⠀⠀⢀⣼⣣⠎⠀⠀⢀⣀⣠⣼⡿⠿⠟⠿⢿⣿⣦⡼⣦⡀⢀⠀⠀⠈⡇",
"⠲⣶⡋⠉⠀⠘⢷⠢⣻⡄⠀⠘⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣆⡘⢻⡹⡌⠲⣄⠀⠀⠀⢪⠟⠁⢀⣠⣤⣾⣟⡯⠕⠊⢁⣈⣈⠙⢻⣿⣷⡿⠁⣼⠀⢠⡄⠁",
"⢤⣘⢿⣦⡀⠀⠀⢻⠺⣳⡀⠀⠈⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣥⠀⢳⢿⡄⢀⣹⣦⣰⣧⣄⠈⡹⢫⣿⠟⠁⠀⠀⠀⠀⠀⠀⠉⠓⢿⣿⣿⣾⡿⠀⢸⡇⡄",
"⢦⡈⠙⣿⣾⣦⡀⠀⢣⠙⣿⣄⠀⠀⠑⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣧⠀⢫⣿⣿⣿⣿⣿⣿⣿⣿⡶⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⠇⢀⡟⠁⡇",
"⠳⢿⣷⣌⠣⡉⠺⢦⣸⡀⢸⢻⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠻⣷⡀⢻⣿⣿⡿⢹⣿⠿⠧⠒⠒⠂⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⢿⣟⠀⣼⠁⢰⠁",
"⠀⠀⠉⢻⡳⣽⣆⠀⠹⣿⣾⠀⢻⢳⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡆⠹⣿⡄⢿⣿⡯⠿⠒⠒⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⡎⡍⡼⡇⢀⡎⠀",
"⠀⠀⠀⠀⡇⢹⢿⣆⠀⡽⣯⢤⢼⣼⢈⢦⠀⠀⠀⠠⠀⠀⠀⠀⠀⠀⠀⠻⠀⢻⣟⢾⡋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⡿⣼⢰⡿⡽⠀⡜⠀⠀",
"⠀⠀⠀⢀⡇⢸⠞⢻⣆⡇⡇⠘⣾⠿⡀⠉⠳⣄⠀⠀⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡎⢿⣗⠦⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡴⠋⡯⢷⡏⠈⡵⠁⡼⠁⠀⠀",
"⠀⠐⠯⠽⠷⠋⠀⢸⢹⠁⡇⠀⢻⢰⡇⢦⠀⠈⢦⠀⡘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⢸⡉⢱⠈⠁⠀⠀⠀⠀⠀⠀⠀⢀⣠⡾⣿⠁⠀⠀⣹⡇⣼⠁⣰⡇⠀⠀⠀",
"⠀⠀⠀⠀⠀⠀⠀⠸⢸⡼⠁⠀⠘⡆⢹⡌⠀⠀⠀⠱⣵⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⡇⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⠁⠀⡏⠀⠀⢇⡿⣷⠇⣰⢫⣇⠀⠀⠀",
  ];

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen text-white justify-start">

      {/* FIRST TERMINAL */}
      <div className="flex-1 min-w-[400px] min-h-[725px] max-h-[725px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col">

        {/* Typing intro 1 */}
        {!doneFastfetch && (
          <div className="p-8 font-jetbrains text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-[#FFFFFF]">@</span>
            <span className="text-[#DF990D]">PucasDocker</span>
            <span className="text-[#FFFFFF]">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-[#FFFFFF]">$</span>
            <span className="text-[#FFFFFF]">‎ {fastfetch}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}

        {/* Fastfetch output */}
        {doneFastfetch && (
          <div className="flex-1 p-8 overflow-auto text-gray-400 text-sm flex">
            <pre className="ascii-font text-green-400 mr-4 select-none">
              {asciiLogo.join("\n")}
            </pre>
            <div className="flex-1 flex text-xl justify-center">
              <div className="flex flex-col text-left text-[#FFFFFF] space-y-1">
                <p><span className="text-[#39ff14]">pucas01</span>
                   <span className="text-[#FFFFFF]">@</span>
                   <span className="text-[#39ff14]">PucasDocker</span></p>
                <p>-----------------</p>
                <p><span className="text-[#39ff14]">Host:</span> Pucas01</p>
                <p><span className="text-[#39ff14]">Uptime:</span> 19 years</p>
                <p><span className="text-[#39ff14]">Locale:</span> Netherlands</p>
                <p><span className="text-[#39ff14]">Languages:</span> Dutch, English</p>
                <p><span className="text-[#39ff14]">Experience:</span> SysAdmin, Linux, Networking</p>
                <p><span className="text-[#39ff14]">Likes:</span> Linux, Music, Anime / Manga, Games, Retro Consoles</p>
                <p>
                  <span className="text-[#39ff14]">Music: </span>
                  <a href="https://stats.fm/pucas01" className="decoration-[#39ff14] underline-offset-5 hover:underline decoration-wavy">
                    https://stats.fm/pucas01
                  </a>
                </p>
                <p><span className="text-[#39ff14]">OS:</span> Arch Linux x86_64</p>
                <p><span className="text-[#39ff14]">Terminal:</span> kitty 0.43.1</p>
                <p><span className="text-[#39ff14]">Shell:</span> fish 4.1.2</p>
                <p><span className="text-[#39ff14]">WM:</span> Hyprland 0.51.1 (Wayland)</p>
                <p>
                  <span className="text-[#39ff14]">Dots: </span>
                  <a href="https://github.com/end-4/dots-hyprland?tab=readme-ov-file#illogical-impulsequickshell" className="decoration-[#39ff14] underline-offset-5 hover:underline decoration-wavy">
                    illogical-impulse (Quickshell)
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECOND TERMINAL */}
      <div
        ref={secondRef}
        className="flex-1 min-w-[400px] min-h-[200px] max-h-[200px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col"
      >

        {/* Typing intro 2 */}
        {!doneLinks && (
          <div className="p-8 font-jetbrains text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-[#FFFFFF]">@</span>
            <span className="text-[#DF990D]">PucasDocker</span>
            <span className="text-[#FFFFFF]">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-[#FFFFFF]">$</span>
            <span className="text-[#FFFFFF]">‎ {linksCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}

        {/* Links output */}
        {doneLinks && (
          <div className="p-8 text-xl space-y-2 text-[#39ff14] font-jetbrains">
            <p> Twitter  <a className="decoration-[#39ff14] text-[#FFFFFF] underline-offset-5 hover:underline decoration-wavy" href="https://x.com/Pucas02">x.com/Pucas02</a></p>
            <p> GitHub  <a className="decoration-[#39ff14] text-[#FFFFFF] underline-offset-5 hover:underline decoration-wavy" href="https://github.com/pucas01">github.com/pucas01</a></p>
            <p> Discord  <a className="text-[#FFFFFF]">pucas01</a></p>
            <p> Tiktok  <a className="decoration-[#39ff14] text-[#FFFFFF] underline-offset-5 hover:underline decoration-wavy" href="https://https://www.tiktok.com/@pucas02.com/pucas01">tiktok.com/@pucas02</a></p>
          </div>
        )}
      </div>

    </div>
  );
}
