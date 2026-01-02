"use client";
import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for typing animation with intersection observer
 * @param {string} command - The command text to type out
 * @param {Object} options - Configuration options
 * @param {number} options.typingSpeed - Delay between characters in ms (default: 40)
 * @param {number} options.doneDelay - Delay after typing completes in ms (default: 200)
 * @param {number} options.threshold - Intersection observer threshold (default: 0.3)
 * @returns {Object} - { ref, typedText, isDone, hasStarted }
 */
export default function useTypingAnimation(command, options = {}) {
  const {
    typingSpeed = 40,
    doneDelay = 200,
    threshold = 0.3,
  } = options;

  const [typedText, setTypedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  // Intersection Observer: Start only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  // Typing animation
  useEffect(() => {
    if (!hasStarted) return;

    let i = 0;
    const interval = setInterval(() => {
      setTypedText(command.slice(0, i));
      i++;
      if (i > command.length) {
        clearInterval(interval);
        setTimeout(() => setIsDone(true), doneDelay);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [hasStarted, command, typingSpeed, doneDelay]);

  return { ref, typedText, isDone, hasStarted };
}
