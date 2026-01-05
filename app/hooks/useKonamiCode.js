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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      inputRef.current.push(e.key);

      if (inputRef.current.length > KONAMI_CODE.length) {
        inputRef.current.shift();
      }

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
