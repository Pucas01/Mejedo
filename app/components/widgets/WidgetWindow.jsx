"use client";
import { useState, useRef, useEffect } from "react";
import WindowDecoration from "../window/WindowDecoration";
import ResizeHandles from "./ResizeHandles";
import { useWidgets } from "../../hooks/useWidgets";

// Widget registry
const widgetRegistry = {
  music: null, // Will be dynamically imported
};

export default function WidgetWindow({ widget }) {
  const { updatePosition, updateSize, bringToFront, closeWidget, minimizeWidget } = useWidgets();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [WidgetContent, setWidgetContent] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dynamically import widget content
  useEffect(() => {
    async function loadWidget() {
      if (widget.type === 'music') {
        const module = await import('./widgets/MusicPlayerWidget');
        setWidgetContent(() => module.default);
      } else if (widget.type === 'youtube') {
        const module = await import('./widgets/YouTubeWidget');
        setWidgetContent(() => module.default);
      } else if (widget.type === 'pong') {
        const module = await import('./widgets/PongWidget');
        setWidgetContent(() => module.default);
      }
    }
    loadWidget();
  }, [widget.type]);

  const handleMouseDown = (e) => {
    // Don't drag from buttons or if click is in content area
    if (e.target.closest('button') || e.target.closest('.widget-content')) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - widget.position.x,
      y: e.clientY - widget.position.y
    };
    bringToFront(widget.id);
  };

  useEffect(() => {
    if (!isDragging) return;

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Constrain to viewport - keep at least 50px of header visible
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 50;

      updatePosition(widget.id, {
        x: Math.max(-widget.size.width + 100, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Re-enable text selection
      document.body.style.userSelect = '';
    };
  }, [isDragging, widget.id, widget.position.x, widget.position.y, widget.size.width, updatePosition]);

  const handleClose = () => {
    closeWidget(widget.id);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Get widget title based on type
  const getTitle = () => {
    switch (widget.type) {
      case 'music':
        return 'Music Player';
      case 'youtube':
        return 'Teto Mix';
      case 'pong':
        return 'Pong';
      default:
        return 'Widget';
    }
  };

  return (
    <div
      className={`fixed bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col animate-slideUp ${isDragging ? 'select-none' : ''}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: isMinimized && widget.type === 'music' ? 300 : isMinimized && widget.type === 'pong' ? 320 : widget.size.width,
        height: isMinimized && widget.type === 'music' ? 160 : isMinimized && widget.type === 'pong' ? 240 : widget.size.height,
        zIndex: widget.zIndex,
        cursor: isDragging ? "url('/cursors/Move.cur'), move" : "url('/cursors/Normal.cur'), auto"
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "url('/cursors/Move.cur'), move" : "url('/cursors/Move.cur'), grab" }}
      >
        <WindowDecoration
          title={getTitle()}
          onClose={handleClose}
          onMinimize={widget.type === 'music' || widget.type === 'pong' ? handleMinimize : undefined}
          showControls={true}
        />
      </div>

      <div className={`widget-content flex-1 font-jetbrains ${widget.type === 'youtube' ? 'p-0 overflow-hidden' : widget.type === 'pong' ? 'p-2 overflow-hidden' : 'p-4 overflow-auto'}`}>
        {WidgetContent ? (
          <WidgetContent widgetId={widget.id} isMinimized={isMinimized} />
        ) : (
          <div className="text-white">Loading widget...</div>
        )}
      </div>

      {!isMinimized && <ResizeHandles widgetId={widget.id} widget={widget} />}
    </div>
  );
}
