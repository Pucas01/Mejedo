"use client";
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { useAchievements } from "./useAchievements";

const STORAGE_KEY = "mejedo_widgets";

const WidgetContext = createContext(null);

export function WidgetProvider({ children, mascotVisible, onToggleMascot }) {
  const { updateStats } = useAchievements();
  const [widgets, setWidgets] = useState(new Map());
  const [nextZIndex, setNextZIndex] = useState(100);
  const [draggingWidget, setDraggingWidget] = useState(null);
  const [resizingWidget, setResizingWidget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);

        // Validate data structure
        if (data.widgets && typeof data.widgets === 'object') {
          const widgetMap = new Map(Object.entries(data.widgets));
          setWidgets(widgetMap);
          setNextZIndex(data.nextZIndex || 100);
        }
      }
    } catch (error) {
      console.error("Failed to load widgets from localStorage:", error);
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage when widgets change
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const data = {
        widgets: Object.fromEntries(widgets),
        nextZIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save widgets to localStorage:", error);
    }
  }, [widgets, nextZIndex, isLoaded]);

  // Create a new widget
  const createWidget = useCallback((type, initialProps = {}) => {
    const id = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Default position: center of viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Widget-specific default sizes
    let defaultWidth = 450;
    let defaultHeight = 320;

    if (type === 'music') {
      defaultWidth = 550;
      defaultHeight = 450;
    }

    const newWidget = {
      id,
      type,
      position: {
        x: initialProps.position?.x ?? (viewportWidth / 2 - defaultWidth / 2),
        y: initialProps.position?.y ?? (viewportHeight / 2 - defaultHeight / 2),
      },
      size: {
        width: initialProps.size?.width ?? defaultWidth,
        height: initialProps.size?.height ?? defaultHeight,
      },
      minimized: false,
      zIndex: nextZIndex,
      ...initialProps,
    };

    setWidgets(prev => new Map(prev).set(id, newWidget));
    setNextZIndex(prev => prev + 1);
    setMenuOpen(false);

    // Trigger widget opener achievement
    updateStats("openedWidget", true);

    return id;
  }, [nextZIndex, updateStats]);

  // Close a widget
  const closeWidget = useCallback((id) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Minimize a widget
  const minimizeWidget = useCallback((id) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(id);
      if (widget) {
        newMap.set(id, { ...widget, minimized: true });
      }
      return newMap;
    });
  }, []);

  // Restore a minimized widget
  const restoreWidget = useCallback((id) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(id);
      if (widget) {
        newMap.set(id, {
          ...widget,
          minimized: false,
          zIndex: nextZIndex
        });
      }
      return newMap;
    });
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  // Bring widget to front
  const bringToFront = useCallback((id) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(id);
      if (widget && widget.zIndex !== nextZIndex - 1) {
        newMap.set(id, { ...widget, zIndex: nextZIndex });
        setNextZIndex(prev => prev + 1);
      }
      return newMap;
    });
  }, [nextZIndex]);

  // Update widget position
  const updatePosition = useCallback((id, position) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(id);
      if (widget) {
        newMap.set(id, { ...widget, position });
      }
      return newMap;
    });
  }, []);

  // Update widget size
  const updateSize = useCallback((id, size) => {
    setWidgets(prev => {
      const newMap = new Map(prev);
      const widget = newMap.get(id);
      if (widget) {
        newMap.set(id, { ...widget, size });
      }
      return newMap;
    });
  }, []);

  const value = {
    widgets,
    draggingWidget,
    resizingWidget,
    menuOpen,
    isLoaded,
    mascotVisible,
    createWidget,
    closeWidget,
    minimizeWidget,
    restoreWidget,
    bringToFront,
    updatePosition,
    updateSize,
    setDraggingWidget,
    setResizingWidget,
    setMenuOpen,
    onToggleMascot,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgets must be used within a WidgetProvider");
  }
  return context;
}
