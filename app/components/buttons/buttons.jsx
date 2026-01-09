"use client";
import { useState } from "react";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";
import { useAchievements } from "../../hooks/useAchievements";

export default function ButtonsPage() {
  const [copied, setCopied] = useState(false);
  const { unlock } = useAchievements();

  // Your site's button HTML code
  const myButtonCode = `<a href="https://pucas01.com"><img src="https://pucas01.com/button/button.png" alt="pucas01.com" /></a>`;

  // Collection of other people's buttons
  const friendButtons = [
    { url: "https://electric-tenshi.nekoweb.org/", img: "https://file.garden/Z3nf4eZzZUtRPfhK/stuff/wvdtkw.gif", alt: "the miku-site of nekoweb... not the first but certainly one of them" },
    { url: "https://layercake.moe", img: "https://layercake.moe/assets/images/buttons/mine/layercake3.gif", alt: "its a cake but like layered" },
    { url: "https://poz.pet", img: "https://poz.pet/88x31/powered-by-poz.png", alt: "Poz, gay person on the internet" },
    { img: "https://poz.pet/88x31/this-site-is-miku-approved.gif", alt: "AISHITE AISHITE AISHITE MOTO MOTO" },
    // Add more buttons here
  ];

  // Futaba stickers
  const futabaStickers = [
    { img: "/stickers/futaba-happy.png", alt: "Futaba Happy" },
    { img: "/stickers/futaba-headphones.png", alt: "Futaba Headphones" },
    { img: "/stickers/futaba-jacket.png", alt: "Futaba Jacket" },
    { img: "/stickers/futaba-jumping.png", alt: "Futaba Jumping" },
    { img: "/stickers/futaba-keyboard.png", alt: "Futaba Keyboard" },
    { img: "/stickers/futaba-kneeling.png", alt: "Futaba Kneeling" },
    { img: "/stickers/futaba-peace.png", alt: "Futaba Peace" },
    { img: "/stickers/futaba-pointing.png", alt: "Futaba Pointing" },
    { img: "/stickers/futaba-shy.png", alt: "Futaba Shy" },
    { img: "/stickers/futaba-sitting.png", alt: "Futaba Sitting" },
    { img: "/stickers/futaba-standing.png", alt: "Futaba Standing" },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(myButtonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    unlock("button_copier");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* My Button Section */}
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg relative flex flex-col">
        <WindowDecoration title="Kitty - mybutton.txt" showControls={true} />

        <div className="p-6">
          <h2 className="text-[#39ff14] text-xl mb-4 font-bold">My stupid little button</h2>
          <p className="text-gray-400 mb-4">
            Want to be cool and stuff? Copy the code below and paste it on your website!
          </p>

          {/* Button Preview */}
          <div className="bg-[#090909] border border-[#39ff14] p-4 mb-4 flex items-center justify-center">
            <img
              src="/button/button.png"
              alt="Mejedo Button"
              className="pixelated transition-transform duration-200 ease-out hover:scale-125 cursor-pointer active:scale-95"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Code Box */}
          <div className="relative">
            <pre className="bg-[#090909] border border-[#39ff14] p-3 text-[#39ff14] text-sm overflow-x-auto font-mono">
              {myButtonCode}
            </pre>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="mt-2"
            >
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </div>
      </div>

      {/* Friends' Buttons Section */}
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg relative flex flex-col">
        <WindowDecoration title="Kitty - buttons.txt" showControls={true} />

        <div className="p-6">
          <h2 className="text-[#39ff14] text-xl mb-4 font-bold">Cool buttons :)</h2>
          <p className="text-gray-400 mb-4">
            button of some cool people on the internet, leave a message in the guestbook so i can add yours!
          </p>

          <div className="flex flex-wrap gap-2">
            {friendButtons.length > 0 ? (
              friendButtons.map((button, index) => (
                <a
                  key={index}
                  href={button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title={button.alt}
                >
                  <img
                    src={button.img}
                    alt={button.alt}
                    className="pixelated transition-transform duration-200 ease-out hover:scale-125 cursor-pointer active:scale-95"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </a>
              ))
            ) : (
              <p className="text-gray-500 italic">No buttons yet. Add some friends!</p>
            )}
          </div>
        </div>
      </div>

      {/* Futaba Stickers Section */}
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg relative flex flex-col">
        <WindowDecoration title="Kitty - stickers.txt" showControls={true} />

        <div className="p-6">
          <h2 className="text-[#39ff14] text-xl mb-4 font-bold">Futaba Stickers!</h2>
          <p className="text-gray-400 mb-4">
            These are all the stickers used around the site
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {futabaStickers.map((sticker, index) => (
              <div
                key={index}
                className="transition-transform duration-200 ease-out hover:scale-110 cursor-pointer active:scale-95"
                title={sticker.alt}
              >
                <img
                  src={sticker.img}
                  alt={sticker.alt}
                  className="max-h-32 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
