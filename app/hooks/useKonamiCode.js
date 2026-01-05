"use client";
import { useEffect, useRef, useCallback } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];

export function useKonamiCode(callback) {
  const inputRef = useRef([]);
  const timeoutRef = useRef(null);

  const resetSequence = useCallback(() => {
    inputRef.current = [];
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Clear timeout on each keypress
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add key to buffer
      inputRef.current.push(e.key);

      // Keep only last 8 keys
      if (inputRef.current.length > KONAMI_CODE.length) {
        inputRef.current.shift();
      }

      // Check if sequence matches
      if (inputRef.current.length === KONAMI_CODE.length) {
        const matches = inputRef.current.every(
          (key, index) => key === KONAMI_CODE[index]
        );

        if (matches) {
          callback();
          resetSequence();
          return;
        }
      }

      // Reset after 2 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        resetSequence();
      }, 2000);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, resetSequence]);
}
