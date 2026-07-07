"use client";
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";

const STORAGE_KEY = "mejedo_crt_filter";

const CrtFilterContext = createContext(null);

export function CrtFilterProvider({ children }) {
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [poweringOn, setPoweringOn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const onSoundRef = useRef(null);
  const staticSoundRef = useRef(null);
  const staticTimeoutRef = useRef(null);
  const powerOnTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCrtEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load CRT filter setting from localStorage:", error);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(crtEnabled));
    } catch (error) {
      console.error("Failed to save CRT filter setting to localStorage:", error);
    }
  }, [crtEnabled, isLoaded]);

  useEffect(() => {
    return () => {
      if (staticTimeoutRef.current) clearTimeout(staticTimeoutRef.current);
      if (powerOnTimeoutRef.current) clearTimeout(powerOnTimeoutRef.current);
      onSoundRef.current?.pause();
      staticSoundRef.current?.pause();
    };
  }, []);

  const toggleCrtFilter = useCallback(() => {
    setCrtEnabled(prev => {
      const next = !prev;

      if (staticTimeoutRef.current) clearTimeout(staticTimeoutRef.current);
      if (powerOnTimeoutRef.current) clearTimeout(powerOnTimeoutRef.current);
      staticSoundRef.current?.pause();
      onSoundRef.current?.pause();

      if (next) {
        setPoweringOn(true);

        if (onSoundRef.current) {
          onSoundRef.current.currentTime = 0;
          onSoundRef.current.volume = 0.5;
          onSoundRef.current.play().catch(() => {});
        }

        powerOnTimeoutRef.current = setTimeout(() => {
          setPoweringOn(false);
        }, 700);

        staticTimeoutRef.current = setTimeout(() => {
          onSoundRef.current?.pause();

          if (staticSoundRef.current) {
            staticSoundRef.current.currentTime = 0;
            staticSoundRef.current.volume = 0.3;
            staticSoundRef.current.loop = true;
            staticSoundRef.current.play().catch(() => {});
          }
        }, 2000);
      } else {
        setPoweringOn(false);
      }

      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ crtEnabled, poweringOn, toggleCrtFilter }),
    [crtEnabled, poweringOn, toggleCrtFilter]
  );

  return (
    <CrtFilterContext.Provider value={value}>
      {children}
      <audio ref={onSoundRef} src="/CRT-ON.mp3" preload="auto" />
      <audio ref={staticSoundRef} src="/CRT-STATIC.mp3" preload="auto" />
    </CrtFilterContext.Provider>
  );
}

export function useCrtFilter() {
  const context = useContext(CrtFilterContext);
  if (!context) {
    throw new Error("useCrtFilter must be used within a CrtFilterProvider");
  }
  return context;
}
