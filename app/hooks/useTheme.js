"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Theme configurations
export const themes = {
  futaba: {
    name: "futaba",
    colors: {
      primary: "#39ff14",      // Neon green
      border: "border-[#39ff14]",
      text: "text-[#39ff14]",
      hover: "hover:text-[#39ff14]",
      bg: "bg-[#39ff14]",
    },
    button: {
      gradient: "bg-gradient-to-b from-[#5a9c4a] to-[#4a7c3a]",
      hover: "hover:from-[#6aac5a] hover:to-[#5a9c4a]",
      borderTop: "border-t-[#7abc6a] border-l-[#7abc6a]",
      borderBottom: "border-r-[#2a5c1a] border-b-[#2a5c1a]",
      shadow: "shadow-[inset_1px_1px_0_0_#8acc7a,inset_-1px_-1px_0_0_#1a4c0a]",
      activeTop: "active:border-t-[#2a5c1a] active:border-l-[#2a5c1a]",
      activeBottom: "active:border-r-[#7abc6a] active:border-b-[#7abc6a]",
      activeShadow: "active:shadow-[inset_-1px_-1px_0_0_#8acc7a,inset_1px_1px_0_0_#1a4c0a]",
    },
  },
  ado: {
    name: "ado",
    colors: {
      primary: "#4169e1",      // Royal blue
      border: "border-[#4169e1]",
      text: "text-[#4169e1]",
      hover: "hover:text-[#4169e1]",
      bg: "bg-[#4169e1]",
    },
    button: {
      gradient: "bg-gradient-to-b from-[#5a7fc4] to-[#3a5fa4]",
      hover: "hover:from-[#6a8fd4] hover:to-[#4a6fb4]",
      borderTop: "border-t-[#7a9fea] border-l-[#7a9fea]",
      borderBottom: "border-r-[#2a4f84] border-b-[#2a4f84]",
      shadow: "shadow-[inset_1px_1px_0_0_#8aaffa,inset_-1px_-1px_0_0_#1a3f74]",
      activeTop: "active:border-t-[#2a4f84] active:border-l-[#2a4f84]",
      activeBottom: "active:border-r-[#7a9fea] active:border-b-[#7a9fea]",
      activeShadow: "active:shadow-[inset_-1px_-1px_0_0_#8aaffa,inset_1px_1px_0_0_#1a3f74]",
    },
  },
  miku: {
    name: "miku",
    colors: {
      primary: "#39c5bb",      // Teal/cyan
      border: "border-[#39c5bb]",
      text: "text-[#39c5bb]",
      hover: "hover:text-[#39c5bb]",
      bg: "bg-[#39c5bb]",
    },
    button: {
      gradient: "bg-gradient-to-b from-[#4ac5bb] to-[#2aa59b]",
      hover: "hover:from-[#5ad5cb] hover:to-[#3ab5ab]",
      borderTop: "border-t-[#6ae5db] border-l-[#6ae5db]",
      borderBottom: "border-r-[#1a958b] border-b-[#1a958b]",
      shadow: "shadow-[inset_1px_1px_0_0_#7af5eb,inset_-1px_-1px_0_0_#0a857b]",
      activeTop: "active:border-t-[#1a958b] active:border-l-[#1a958b]",
      activeBottom: "active:border-r-[#6ae5db] active:border-b-[#6ae5db]",
      activeShadow: "active:shadow-[inset_-1px_-1px_0_0_#7af5eb,inset_1px_1px_0_0_#0a857b]",
    },
  },
};

const ThemeContext = createContext({
  theme: themes.futaba,
  themeName: "futaba",
  setThemeName: () => {},
});

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const [themeName, setThemeName] = useState("futaba");

  // Automatically set theme based on current page
  useEffect(() => {
    // Check if we're on the Idols page (previously Ado)
    if (pathname === "/ado" || pathname === "/idols") {
      setThemeName("ado");
    } else {
      setThemeName("futaba");
    }
  }, [pathname]);

  // Update CSS variables when theme changes
  useEffect(() => {
    const sliderColors = {
      futaba: {
        thumbGradientStart: '#6aac5a',
        thumbGradientMid: '#5a9c4a',
        thumbGradientEnd: '#4a7c3a',
        thumbBorderLight: '#7abc6a',
        thumbBorderDark: '#2a5c1a',
        thumbShadowLight: '#8acc7a',
        thumbShadowDark: '#1a4c0a',
        thumbHoverStart: '#7abc6a',
        thumbHoverMid: '#6aac5a',
        thumbHoverEnd: '#5a9c4a',
        progressFill: '#4a7c3a'
      },
      ado: {
        thumbGradientStart: '#6a8fd4',
        thumbGradientMid: '#5a7fc4',
        thumbGradientEnd: '#4a6fb4',
        thumbBorderLight: '#7a9fea',
        thumbBorderDark: '#2a4f84',
        thumbShadowLight: '#8aaffa',
        thumbShadowDark: '#1a3f74',
        thumbHoverStart: '#7a9fea',
        thumbHoverMid: '#6a8fd4',
        thumbHoverEnd: '#5a7fc4',
        progressFill: '#4a6fb4'
      },
      miku: {
        thumbGradientStart: '#5ad5cb',
        thumbGradientMid: '#4ac5bb',
        thumbGradientEnd: '#3ab5ab',
        thumbBorderLight: '#6ae5db',
        thumbBorderDark: '#1a958b',
        thumbShadowLight: '#7af5eb',
        thumbShadowDark: '#0a857b',
        thumbHoverStart: '#6ae5db',
        thumbHoverMid: '#5ad5cb',
        thumbHoverEnd: '#4ac5bb',
        progressFill: '#3ab5ab'
      }
    };

    const colors = sliderColors[themeName] || sliderColors.futaba;

    // Set CSS variables on document root
    document.documentElement.style.setProperty('--slider-thumb-gradient-start', colors.thumbGradientStart);
    document.documentElement.style.setProperty('--slider-thumb-gradient-mid', colors.thumbGradientMid);
    document.documentElement.style.setProperty('--slider-thumb-gradient-end', colors.thumbGradientEnd);
    document.documentElement.style.setProperty('--slider-thumb-border-light', colors.thumbBorderLight);
    document.documentElement.style.setProperty('--slider-thumb-border-dark', colors.thumbBorderDark);
    document.documentElement.style.setProperty('--slider-thumb-shadow-light', colors.thumbShadowLight);
    document.documentElement.style.setProperty('--slider-thumb-shadow-dark', colors.thumbShadowDark);
    document.documentElement.style.setProperty('--slider-thumb-hover-start', colors.thumbHoverStart);
    document.documentElement.style.setProperty('--slider-thumb-hover-mid', colors.thumbHoverMid);
    document.documentElement.style.setProperty('--slider-thumb-hover-end', colors.thumbHoverEnd);
    document.documentElement.style.setProperty('--slider-progress-fill', colors.progressFill);
  }, [themeName]);

  const theme = themes[themeName] || themes.futaba;

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
