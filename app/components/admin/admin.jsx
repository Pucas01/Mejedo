"use client";

import { useState, useEffect, useRef } from "react";
import User from "./user.jsx";
import { useCurrentUser } from "../../hooks/CurrentUser.js";

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
  const { currentUser, isAdmin } = useCurrentUser();

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

      {/* Terminal Header */}
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

      {/* To-Do List */}
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
              <li>- Make the codebase not ass</li>
              <li>- Collection page with consoles and manga</li>
              <li>- Host this shi on a Wii U</li>
              <li>- Some other cool stuff I guess</li>
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
            <img
              src="/randomimages/AsaScaredBingBong.png"
              alt="BingBong"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/FutabaPull.jpg"
              alt="pullTheTrigger"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/ifyoulauch.jpg"
              alt="Lauch"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/junpei.gif"
              alt="Iyuri"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/Yoshizawa.gif"
              alt="KMS"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/TetoArch.png"
              alt="ArchBTW"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/InstallArch.png"
              alt="Arch BTW"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/DrStone.png"
              alt="Gay"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/FUnny.png"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/GersonGold.png"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/Wokoto.png"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/SoCool.webp"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="/randomimages/ado.png"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
