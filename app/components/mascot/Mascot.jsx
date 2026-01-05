"use client";
import { useState, useEffect, useRef } from "react";

// Tips and easter eggs the mascot can say
const tips = [
  "Try clicking the header title!",
  "Did you know? This site runs on hopes and prayers.",
  "Check out the manga collection! Spoiler, theres chainsawman.",
  "Futaba is the goat. Fight me.",
  "This website doesn't work on mobile. Skill issue!",
  "who... are you?",
  "FIST OF JUSTICE! oh wait wrong character.",
  "Bona-fide Monafied",
  "What the flip flop. I'm outta here!!!!",
];

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function Mascot() {
  const [frame, setFrame] = useState(0);
  const [bubbleState, setBubbleState] = useState("hidden"); // "hidden" | "entering" | "visible" | "exiting"
  const [currentTip, setCurrentTip] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [isExcited, setIsExcited] = useState(false);
  const [pendingExcited, setPendingExcited] = useState(null);
  const [size, setSize] = useState("md"); // "sm" | "md" | "lg"
  const hideTimeoutRef = useRef(null);
  const tipQueueRef = useRef([]);
  const animationSpeedRef = useRef(500);

  // Responsive sizing based on screen width
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSize("xs");
      } else if (width < 1024) {
        setSize("sm");
      } else if (width < 1280) {
        setSize("md");
      } else if (width < 1536) {
        setSize("lg");
      } else if (width < 1920) {
        setSize("xl");
      } else {
        setSize("2xl");
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Size configurations
  const sizeConfig = {
    xs: { mascot: 56, container: "h-14", bubble: "max-w-[160px] text-xs px-2 py-1.5", padding: "p-1" },
    sm: { mascot: 72, container: "h-18", bubble: "max-w-[190px] text-sm px-3 py-2", padding: "p-1.5" },
    md: { mascot: 88, container: "h-22", bubble: "max-w-[220px] text-sm px-3 py-2.5", padding: "p-1.5" },
    lg: { mascot: 100, container: "h-24", bubble: "max-w-[240px] text-base px-4 py-3", padding: "p-2" },
    xl: { mascot: 116, container: "h-28", bubble: "max-w-[270px] text-base px-4 py-3", padding: "p-2" },
    "2xl": { mascot: 132, container: "h-32", bubble: "max-w-[300px] text-lg px-5 py-4", padding: "p-2.5" },
  };

  const config = sizeConfig[size];

  // Animation loop - swap between frame 0 and 1 (faster when excited)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, animationSpeedRef.current);

    return () => clearInterval(interval);
  }, [isExcited]);

  // Apply pending excitement state at frame 0 (start of animation cycle)
  useEffect(() => {
    if (frame === 0 && pendingExcited !== null) {
      setIsExcited(pendingExcited);
      animationSpeedRef.current = pendingExcited ? 250 : 500;
      setPendingExcited(null);
    }
  }, [frame, pendingExcited]);

  // Get next tip from shuffled queue (reshuffles when empty)
  const getNextTip = () => {
    if (tipQueueRef.current.length === 0) {
      tipQueueRef.current = shuffleArray(tips);
    }
    return tipQueueRef.current.pop();
  };

  // Show a random tip periodically or on click
  const showRandomTip = () => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    const nextTip = getNextTip();
    setCurrentTip(nextTip);
    setBubbleState("entering");

    // Only queue excitement if not already excited (prevents animation jank on rapid clicks)
    if (!isExcited && pendingExcited !== true) {
      setPendingExcited(true);
    }

    // Transition to visible after enter animation
    setTimeout(() => {
      setBubbleState("visible");
    }, 300);

    // Calm down after 2 seconds (queue it to wait for cycle)
    setTimeout(() => {
      setPendingExcited(false);
    }, 2000);

    // Start exit after 5 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setBubbleState("exiting");
      // Remove from DOM after exit animation
      setTimeout(() => {
        setBubbleState("hidden");
      }, 250);
    }, 5000);
  };

  // Occasionally show a tip automatically
  useEffect(() => {
    // Show first tip after 10 seconds
    const initialTimeout = setTimeout(() => {
      showRandomTip();
    }, 10000);

    // Then show tips every 30-60 seconds randomly
    const interval = setInterval(() => {
      if (bubbleState === "hidden" && Math.random() > 0.5) {
        showRandomTip();
      }
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [bubbleState]);

  // Trigger bounce animation on frame change (only on frame 0 = up position)
  useEffect(() => {
    if (frame === 0) {
      setBounceKey((prev) => prev + 1);
    }
  }, [frame]);

  const getBubbleClass = () => {
    switch (bubbleState) {
      case "entering":
        return "animate-bubble-enter";
      case "exiting":
        return "animate-bubble-exit";
      default:
        return "";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Speech bubble - positioned above mascot */}
      {bubbleState !== "hidden" && (
        <div className={`relative mb-4 transition-transform duration-200 ${isHovered ? "-translate-y-2" : ""} ${getBubbleClass()}`}>
          <div className={`bg-[#121217] border-2 border-[#39ff14] ${config.bubble} text-white`}>
            {currentTip}
          </div>
          {/* Speech bubble tail - pointing down towards mascot on right side */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#39ff14]" />
          <div className="absolute -bottom-1 right-[26px] w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-[#121217]" />
        </div>
      )}

      {/* Mascot box */}
      <div
        className={`transition-transform duration-200 cursor-pointer ${isHovered ? "scale-110" : ""}`}
        onClick={showRandomTip}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`bg-[#121217] border-2 border-[#39ff14] ${config.padding} pb-0`}>
          {/* Character container - anchored to bottom with bounce */}
          <div className={`${config.container} flex items-end justify-center`}>
            <img
              key={bounceKey}
              src={frame === 0 ? "/mascot/frame1.png" : "/mascot/frame2.png"}
              alt="Mascot"
              width={config.mascot}
              className={frame === 0 ? (isExcited ? "animate-mascot-bounce-fast" : "animate-mascot-bounce") : ""}
              style={{
                imageRendering: "pixelated",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
