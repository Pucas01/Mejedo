"use client";

import { useState, useEffect, useRef } from "react";
import Image from 'next/image'
import User from "./user.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";

export default function AnimePage() {
  const [login, setLogin] = useState("");
  const [doneLogin, setDoneLogin] = useState(false);
  const [listCmd, setList] = useState("");
  const [doneList, setDoneList] = useState(false);
  const [doneImg, setDoneImg] = useState(false);
  const [imgCmd, setimg] = useState("");

  const loginCommand = "cat login.txt";
  const listCommand = "cat todo.txt";
  const imgCommand = "cd /funnyimgs";

  const terminalRef = useRef(null);
  const mikuAudioRef = useRef(null);
  const { currentUser, isAdmin } = useCurrentUser();
  const { unlock } = useAchievements();

  const handleJunpeiClick = () => {
    if (mikuAudioRef.current) {
      mikuAudioRef.current.currentTime = 0;
      mikuAudioRef.current.play();
    }
    unlock("junpei_clicker");
  };

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLogin(loginCommand.slice(0, i));
      i++;
      if (i > loginCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneLogin(true), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setList(listCommand.slice(0, i));
      i++;
      if (i > listCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneList(true), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setimg(imgCommand.slice(0, i));
      i++;
      if (i > imgCommand.length) {
        clearInterval(interval);
        setTimeout(() => setDoneImg(true), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 text-xl min-h-screen text-white justify-start">

      <div className="bg-[#121217] min-h-[200px] p-8 border-2 border-[#39ff14] shadow-lg ">
        {!doneLogin && (
          <div className=" text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{login}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneLogin && (
          <div className="space-y-2 mt-2">
            <header className="text-2xl text-[#39ff14]">Admin Area</header>
            <p>So you might be thinking to yourself, "why the actual fuck can i go to this page" 
                well its because i cant really hide it anyway so why not make it visible! 
                you won't see much but theres some funny stuff here to look at i guess, 
                also dont even try loging in (my password is very secure)</p>
            <p>
              <span className="text-[#39ff14]">• Admin login page: </span>
              <a href="/components/login" className="ml-1 text-white underline hover:text-[#D73DA3]">Do NOT Click here</a>
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#121217] border-2 p-8 border-[#39ff14] shadow-lg">
        {!doneList && (
          <div className=" text-xl flex flex-wrap">
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
            <p className="text-[#39ff14] mb-2">To-Do List:</p>
            <ul className="list-disc list-inside text-white space-y-1">
              <li>- Make the codebase not ass (its even worse now)</li>
              <li>- Webring stuff </li>
              <li>- Make it usable on phone (never happening)</li>
              <li>- uhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh</li>
            </ul>
          </>
        )}
      </div>
      {isAdmin && (
      <User/>
      )}
      <div className="bg-[#121217] border-2 p-8 border-[#39ff14] shadow-lg">
        {!doneImg && (
          <div className=" text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white">&nbsp;{imgCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}
        {doneImg && (
          <>
          <header className="flex flex-col gap-4 mx-auto text-2xl pb-6">Random Images i like (Almost all of these are made by me)</header>
          <div className="flex flex-wrap justify-center gap-4">
            <Image
              src="/randomimages/AsaScaredBingBong.png"
              alt="BingBong"
              height={200}
              width={240}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/FutabaPull.jpg"
              alt="pullTheTrigger"
              height={200}
              width={300}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/ifyoulauch.jpg"
              alt="Lauch"
              height={200}
              width={250}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/junpei.gif"
              alt="Iyuri"
              height={200}
              width={230}
              className="object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={handleJunpeiClick}
              />
              <audio ref={mikuAudioRef} src="/sounds/miku-british.mp3" preload="auto" />
              <Image
              src="/randomimages/Yoshizawa.gif"
              alt="KMS"
              height={200}
              width={200}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/TetoArch.png"
              alt="ArchBTW"
              height={200}
              width={200}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/InstallArch.png"
              alt="Arch BTW"
              height={200}
              width={200}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/DrStone.png"
              alt="Gay"
              height={200}
              width={210}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/FUnny.png"
              alt="woops"
              height={200}
              width={220}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/GersonGold.png"
              alt="woops"
              height={200}
              width={200}
              className="object-cover">
              </Image>
              <Image
              src="/Wokoto.png"
              alt="woops"
              height={200}
              width={380}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/SoCool.webp"
              alt="woops"
              height={200}
              width={210}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/ado.png"
              alt="woops"
              height={200}
              width={210}
              className="object-cover">
              </Image>
              <Image
              src="/randomimages/Aketchi.webp"
              alt="woops"
              height={200}
              width={350}
              className="object-cover">
              </Image>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
