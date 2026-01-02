"use client";

import { useState, useEffect, useRef } from "react";
import SpotifyTerminal from "./SpotifyTerminal";
import NintendoSwitchTerminal from "./NintendoSwitchTerminal";
import Whoami from "./whoami";

export default function About() {
  const [fastfetch, setFastfetch] = useState("");
  const [linksCmd, setLinksCmd] = useState("");
  const [doneFastfetch, setDoneFastfetch] = useState(false);
  const [doneLinks, setDoneLinks] = useState(false);
  const [startLinks, setStartLinks] = useState(false);
  const [uptime, setUptime] = useState("");
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  const birthday = new Date("2006-10-11");

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

  // fetch
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

  // (links)
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
    }, 50);
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

 useEffect(() => {
    function calcLife() {
      const now = new Date();

      let years = now.getFullYear() - birthday.getFullYear();
      let months = now.getMonth() - birthday.getMonth();
      let days = now.getDate() - birthday.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonth;
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      setUptime(`${years}y ${months}m ${days}d`);
    }

    calcLife();
    const interval = setInterval(calcLife, 86400000);
    return () => clearInterval(interval);
  }, []);

  // Hide scroll indicator when user scrolls
  useEffect(() => {
    // Only show indicator after fastfetch animation completes
    if (!doneFastfetch) {
      setShowScrollIndicator(false);
      setIndicatorVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Hide after scrolling more than 100px
      if (scrollTop >= 100) {
        setIndicatorVisible(false);
        // Remove from DOM after fade animation completes
        setTimeout(() => setShowScrollIndicator(false), 300);
      }
    };

    // Show indicator once animation is done
    setShowScrollIndicator(true);
    // Small delay to trigger CSS transition
    setTimeout(() => setIndicatorVisible(true), 50);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [doneFastfetch]);

  return (
    <div className="relative flex flex-col gap-4 p-4 min-h-screen text-white justify-start">
      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 animate-bounce transition-opacity duration-300 ${
            indicatorVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-[#39ff14] text-sm font-jetbrains">Scroll for more</span>
          <svg
            className="w-6 h-6 text-[#39ff14]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-[400px] min-h-[725px] max-h-[725px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col">

        {!doneFastfetch && (
          <div className="p-8 font-jetbrains text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-[#FFFFFF]">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-[#FFFFFF]">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-[#FFFFFF]">$</span>
            <span className="text-[#FFFFFF]">&nbsp;{fastfetch}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}

        {doneFastfetch && (
          <div className="flex-1 p-8 overflow-auto text-gray-400 text-sm flex">
            <pre className="ascii-font text-green-400 mr-4 select-none">
              {asciiLogo.join("\n")}
            </pre>
            <div className="flex-1 flex text-xl justify-center">
              <div className="flex flex-col text-left text-[#FFFFFF] space-y-1">
                <p><span className="text-[#39ff14]">pucas01</span>
                   <span className="text-[#FFFFFF]">@</span>
                   <span className="text-[#39ff14]">PucasArch</span></p>
                <p>-----------------</p>
                <p><span className="text-[#39ff14]">Host:</span> Pucas01</p>
                <p><span className="text-[#39ff14]">Uptime:</span> {uptime}</p>
                <p><span className="text-[#39ff14]">Locale:</span> Netherlands</p>
                <p><span className="text-[#39ff14]">Languages:</span> Dutch, English</p>
                <p><span className="text-[#39ff14]">Experience:</span> SysAdmin, Linux, Networking</p>
                <p><span className="text-[#39ff14]">Likes:</span> Linux, Music, Anime / Manga, Games, Retro Consoles</p>
                <p>-----------------</p>
                <p><span className="text-[#39ff14]">OS:</span> Arch Linux x86_64</p>
                <p><span className="text-[#39ff14]">Terminal:</span> kitty 0.44</p>
                <p><span className="text-[#39ff14]">Shell:</span> fish 4.2.1</p>
                <p><span className="text-[#39ff14]">WM:</span> Hyprland 0.53 (Wayland)</p>
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
        <div>
          <Whoami />
        </div>
      <div ref={secondRef} className="flex-1 min-w-[400px] min-h-[310px] max-h-[310px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex">
        <div className="flex-1">
          {!doneLinks && (
            <div className="p-8 font-jetbrains text-xl flex flex-wrap">
              <span className="text-[#39ff14]">pucas01</span>
              <span className="text-white">@</span>
              <span className="text-[#D73DA3]">PucasArch</span>
              <span className="text-white">:</span>
              <span className="text-[#FF5555]">~</span>
              <span className="text-white">$</span>
              <span className="text-white">&nbsp;{linksCmd}</span>
              <span className="cursor animate-blink">|</span>
            </div>
          )}

          {doneLinks && (
            <div className="p-8 text-xl space-y-2 text-[#39ff14] font-jetbrains">
              <p> Twitter  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://x.com/Pucas02">x.com/Pucas02</a></p>
              <p> GitHub  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://github.com/pucas01">github.com/pucas01</a></p>
              <p> Discord  <a className="text-white">pucas01</a></p>
              <p> Tiktok  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://www.tiktok.com/@pucas02">tiktok.com/@pucas02</a></p>
              <p> Spotify  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://open.spotify.com/user/lucas_v2006">spotify.com/user/pucas01</a></p>
              <p>󰲿 stats.fm  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://stats.fm/pucas01">stats.fm/pucas01</a></p>
              <p> AniList  <a className="decoration-[#39ff14] text-white underline-offset-5 hover:underline decoration-wavy" href="https://anilist.co/user/pucas01/">anilist.co/user/pucas01/</a></p>
            </div>
          )}
      </div>
        <div className="flex-1">
        </div>
      </div>
      <div>
        <SpotifyTerminal />
      </div>
      <div>
        <NintendoSwitchTerminal />
      </div>
    </div>
  );
}
