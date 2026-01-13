# Widget System

Draggable, resizable floating windows with localStorage persistence.

## Core Files

- [app/hooks/useWidgets.js](../app/hooks/useWidgets.js) - Context provider
- [app/components/widgets/WidgetWindow.jsx](../app/components/widgets/WidgetWindow.jsx) - Individual widget
- [app/components/widgets/WidgetMenu.jsx](../app/components/widgets/WidgetMenu.jsx) - Widget selector
- [app/components/widgets/ResizeHandles.jsx](../app/components/widgets/ResizeHandles.jsx) - Resize functionality
- [app/components/widgets/widgets/](../app/components/widgets/widgets/) - Widget implementations

## Available Widgets

- **music** - Music Player (550×450)
- **youtube** - Teto Mix (484×356)
- **pong** - Pong game (632×500)
- **rhythm** - Rhythm Game (350×580)

## Usage

```javascript
import { useWidgets } from "../hooks/useWidgets";

const { widgets, createWidget, removeWidget, updateWidget } = useWidgets();

// Create a widget
createWidget("music");

// Remove a widget
removeWidget(widgetId);

// Update widget properties
updateWidget(widgetId, { position: { x: 100, y: 100 } });
```

## Widget State

```javascript
{
  id: "widget-timestamp-randomId",
  type: "music",
  position: { x: 100, y: 100 },
  size: { width: 550, height: 450 },
  minimized: false,
  zIndex: 100
}
```

## Constraints

- **Min size**: 300×200px
- **Max size**: 90% viewport
- **Z-index**: Starts at 100, increments on create/click
- **Storage**: Auto-saved to `localStorage` key `mejedo_widgets`

## Adding a Widget

### 1. Create widget component

File: [app/components/widgets/widgets/YourWidget.jsx](../app/components/widgets/widgets/YourWidget.jsx)

```jsx
"use client";
export default function YourWidget() {
  return (
    <div className="flex flex-col h-full gap-3 text-white">
      <div className="border border-[#39ff14] p-2">
        <p className="text-[#39ff14]">Widget Title</p>
        <p>Content</p>
      </div>
    </div>
  );
}
```

### 2. Register in WidgetMenu.jsx

```javascript
const availableWidgets = [
  // ... existing
  { type: 'yourwidget', name: 'Your Widget', icon: '🎮', description: 'Description' },
];
```

### 3. Add dynamic import in WidgetWindow.jsx

```javascript
// In loadWidget function
if (widget.type === 'yourwidget') {
  const module = await import('./widgets/YourWidget');
  setWidgetContent(() => module.default);
}

// In getTitle function
case 'yourwidget':
  return 'Your Widget';
```

### 4. Set default size (optional)

Edit [app/hooks/useWidgets.js](../app/hooks/useWidgets.js) in `createWidget`:

```javascript
if (type === 'yourwidget') {
  defaultWidth = 600;
  defaultHeight = 400;
}
```

## Styling

Use retro theme colors:
- Border: `border-[#39ff14]`
- Text: `text-white` and `text-[#39ff14]`
- Background: `bg-[#121217]`

```jsx
import Button from "../../ui/Button";

<Button variant="primary" size="sm">Click</Button>
<input type="range" className="retro-slider" />
```

## Features

- **Draggable**: Click header to drag
- **Resizable**: Drag edges/corners
- **Persistent**: Positions saved to localStorage
- **Z-index management**: Click to bring to front
- **Custom cursors**: Uses `/public/cursors/` cursor files
