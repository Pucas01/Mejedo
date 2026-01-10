"use client";
import { useState, useEffect, useRef } from "react";
import { useWidgets } from "../../hooks/useWidgets";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

const directions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const cursors = {
  nw: "url('/cursors/Diagonal1.cur'), nw-resize",
  n: "url('/cursors/Vertical.cur'), n-resize",
  ne: "url('/cursors/Diagonal2.cur'), ne-resize",
  w: "url('/cursors/Horizontal.cur'), w-resize",
  e: "url('/cursors/Horizontal.cur'), e-resize",
  sw: "url('/cursors/Diagonal2.cur'), sw-resize",
  s: "url('/cursors/Vertical.cur'), s-resize",
  se: "url('/cursors/Diagonal1.cur'), se-resize"
};

const positions = {
  nw: 'top-0 left-0 w-3 h-3',
  n: 'top-0 left-0 right-0 h-2',
  ne: 'top-0 right-0 w-3 h-3',
  w: 'top-0 bottom-0 left-0 w-2',
  e: 'top-0 bottom-0 right-0 w-2',
  sw: 'bottom-0 left-0 w-3 h-3',
  s: 'bottom-0 left-0 right-0 h-2',
  se: 'bottom-0 right-0 w-3 h-3'
};

export default function ResizeHandles({ widgetId, widget }) {
  const { updateSize, updatePosition } = useWidgets();
  const [resizing, setResizing] = useState(null);
  const startState = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    setResizing(direction);
    startState.current = {
      x: e.clientX,
      y: e.clientY,
      width: widget.size.width,
      height: widget.size.height,
      posX: widget.position.x,
      posY: widget.position.y
    };
  };

  useEffect(() => {
    if (!resizing) return;

    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startState.current.x;
      const deltaY = e.clientY - startState.current.y;

      let newWidth = startState.current.width;
      let newHeight = startState.current.height;
      let newX = startState.current.posX;
      let newY = startState.current.posY;

      if (resizing.includes('e')) {
        newWidth = startState.current.width + deltaX;
      }
      if (resizing.includes('w')) {
        newWidth = startState.current.width - deltaX;
        newX = startState.current.posX + deltaX;
      }
      if (resizing.includes('s')) {
        newHeight = startState.current.height + deltaY;
      }
      if (resizing.includes('n')) {
        newHeight = startState.current.height - deltaY;
        newY = startState.current.posY + deltaY;
      }

      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;

      if (widget.type === 'youtube') {
        const HEADER_HEIGHT = 32;
        const BORDER_SIZE = 4;
        const aspectRatio = 3 / 2;

        if (resizing.includes('e') || resizing.includes('w')) {
          const contentWidth = newWidth - BORDER_SIZE;
          const newContentHeight = contentWidth / aspectRatio;
          newHeight = newContentHeight + HEADER_HEIGHT + BORDER_SIZE;
        } else if (resizing.includes('n') || resizing.includes('s')) {
          const contentHeight = newHeight - HEADER_HEIGHT - BORDER_SIZE;
          const newContentWidth = contentHeight * aspectRatio;
          newWidth = newContentWidth + BORDER_SIZE;
        } else {
          const contentWidth = newWidth - BORDER_SIZE;
          const newContentHeight = contentWidth / aspectRatio;
          newHeight = newContentHeight + HEADER_HEIGHT + BORDER_SIZE;
        }

        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          const contentWidth = newWidth - BORDER_SIZE;
          const newContentHeight = contentWidth / aspectRatio;
          newHeight = newContentHeight + HEADER_HEIGHT + BORDER_SIZE;
        }
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          const contentHeight = newHeight - HEADER_HEIGHT - BORDER_SIZE;
          const newContentWidth = contentHeight * aspectRatio;
          newWidth = newContentWidth + BORDER_SIZE;
        }
        if (newWidth < MIN_WIDTH) {
          newWidth = MIN_WIDTH;
          const contentWidth = newWidth - BORDER_SIZE;
          const newContentHeight = contentWidth / aspectRatio;
          newHeight = newContentHeight + HEADER_HEIGHT + BORDER_SIZE;
        }
        if (newHeight < MIN_HEIGHT) {
          newHeight = MIN_HEIGHT;
          const contentHeight = newHeight - HEADER_HEIGHT - BORDER_SIZE;
          const newContentWidth = contentHeight * aspectRatio;
          newWidth = newContentWidth + BORDER_SIZE;
        }
      } else {
        newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, newWidth));
        newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, newHeight));
      }

      if (newWidth === MIN_WIDTH && resizing.includes('w')) {
        newX = startState.current.posX + startState.current.width - MIN_WIDTH;
      }
      if (newHeight === MIN_HEIGHT && resizing.includes('n')) {
        newY = startState.current.posY + startState.current.height - MIN_HEIGHT;
      }

      updateSize(widgetId, { width: newWidth, height: newHeight });
      if (resizing.includes('w') || resizing.includes('n')) {
        updatePosition(widgetId, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [resizing, widgetId, updateSize, updatePosition]);

  return (
    <>
      {directions.map(direction => (
        <div
          key={direction}
          className={`absolute ${positions[direction]} hover:bg-[#39ff14]/20 transition-colors`}
          style={{ cursor: cursors[direction] }}
          onMouseDown={(e) => handleMouseDown(e, direction)}
        />
      ))}
    </>
  );
}
