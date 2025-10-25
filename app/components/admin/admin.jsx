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
          <header className="flex flex-col gap-4 max-w-sm mx-auto text-2xl pb-6">my shitpost collection</header>
          <div className="flex flex-wrap justify-center gap-4">
            <img
              src="https://pbs.twimg.com/media/GwfNg5rXcAEDTZE?format=jpg&name=large"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://pbs.twimg.com/media/Gv6jZsmXsAAueC4?format=jpg&name=large"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://pbs.twimg.com/media/G1iSc9CXoAAOR8y?format=png&name=small"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://cdn.discordapp.com/attachments/1119236154244476988/1431647320021139639/AsaScaredBingBong.png?ex=68fe2cf7&is=68fcdb77&hm=fe41c01adda55de2a534b3a2a0f8dbd9e9be0a681f8f1865befdab2cdd11e632&"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://pbs.twimg.com/media/GyG2uMuWQAA9hSB?format=jpg&name=large"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://cdn.discordapp.com/attachments/1119236154244476988/1431646174091411537/RezePeace.gif?ex=68fe2be6&is=68fcda66&hm=029db9ed9e4ce1bf9d2eab0111f91f34deb249d45748e07c6936f745d65b283a&"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://media.discordapp.net/attachments/1119236154244476988/1431647672527360082/junpei.gif?ex=68fe2d4b&is=68fcdbcb&hm=a0c04f895b4792bad68e226da871b27fa37172baabf5179da3f53a6f8e03d39e&="
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://media.tenor.com/j1ZZH_VaffUAAAAM/ado-true.gif"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://media.tenor.com/xHDZijXhng8AAAAM/shoko-heineken.gif"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://pbs.twimg.com/media/Gx1Rac7XUAAvL92?format=png&name=small"
              alt="woops"
              className="h-[180px] object-cover">
              </img>
              <img
              src="https://pbs.twimg.com/media/G2GnunmXcAA_aGX?format=png&name=360x360"
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
