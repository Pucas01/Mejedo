# Widget System Documentation

The widget system provides draggable, resizable floating windows with localStorage persistence.

## Features

- **Draggable**: Click and drag the window header to move widgets around
- **Resizable**: Grab any edge or corner to resize
- **Persistent**: Widget positions and sizes are saved to localStorage
- **Dynamic Loading**: Widget content is lazy-loaded on demand
- **Z-index Management**: Clicking a widget brings it to front

## Architecture

### Core Files

- `/app/hooks/useWidgets.js` - Context provider managing widget state
- `/app/components/widgets/WidgetManager.jsx` - Renders all widgets
- `/app/components/widgets/WidgetWindow.jsx` - Individual widget window
- `/app/components/widgets/WidgetMenu.jsx` - Widget selection menu
- `/app/components/widgets/FloatingWidgetButton.jsx` - Menu trigger button
- `/app/components/widgets/ResizeHandles.jsx` - Resize functionality
- `/app/components/widgets/widgets/` - Individual widget implementations

### State Management

Widgets are stored in a Map with the following structure:

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

## Adding a New Widget

### Step 1: Create the Widget Component

Create a new file at `/app/components/widgets/widgets/YourWidget.jsx`:

```jsx
"use client";
import { useState, useEffect } from "react";

export default function YourWidget() {
  return (
    <div className="flex flex-col h-full gap-3 text-white">
      {/* Your widget content here */}
      <div className="border border-[#39ff14] p-2">
        <p className="text-[#39ff14]">Widget Title</p>
        <p>Your widget content goes here</p>
      </div>
    </div>
  );
}
```

**Important Notes:**
- Use `"use client"` directive at the top
- The root div should use `flex flex-col h-full` to fill the widget window
- Use `border-[#39ff14]` for borders to match the retro theme
- Use `text-[#39ff14]` for highlighted text (neon green)
- Use `text-white` for regular text

### Step 2: Register in Widget Menu

Edit `/app/components/widgets/WidgetMenu.jsx` and add to the `availableWidgets` array:

```jsx
const availableWidgets = [
  { type: 'music', name: 'Music Player', icon: '🎵', description: 'Play music from the server' },
  { type: 'yourwidget', name: 'Your Widget', icon: '🎮', description: 'Description of your widget' },
];
```

**Parameters:**
- `type`: Unique identifier (lowercase, no spaces)
- `name`: Display name shown in menu
- `icon`: Emoji or character icon
- `description`: Brief description (optional, but recommended)

### Step 3: Add Dynamic Import

Edit `/app/components/widgets/WidgetWindow.jsx`:

**Add to the dynamic import useEffect:**

```jsx
// Dynamically import widget content
useEffect(() => {
  async function loadWidget() {
    if (widget.type === 'music') {
      const module = await import('./widgets/MusicPlayerWidget');
      setWidgetContent(() => module.default);
    } else if (widget.type === 'yourwidget') {
      const module = await import('./widgets/YourWidget');
      setWidgetContent(() => module.default);
    }
  }
  loadWidget();
}, [widget.type]);
```

**Add to the getTitle function:**

```jsx
const getTitle = () => {
  switch (widget.type) {
    case 'music':
      return 'Music Player';
    case 'yourwidget':
      return 'Your Widget';
    default:
      return 'Widget';
  }
};
```

### Step 4: (Optional) Set Custom Default Size

Edit `/app/hooks/useWidgets.js` in the `createWidget` function:

```jsx
// Widget-specific default sizes
let defaultWidth = 450;
let defaultHeight = 320;

if (type === 'music') {
  defaultWidth = 550;
  defaultHeight = 450;
} else if (type === 'yourwidget') {
  defaultWidth = 600;  // Your custom width
  defaultHeight = 400; // Your custom height
}
```

**Default Sizes:**
- Generic widgets: 450×320
- Music player: 550×450
- Minimum allowed: 300×200
- Maximum allowed: 90vw × 90vh

## Widget Styling Guidelines

### Colors

The site uses a retro terminal aesthetic with neon green accents:

- **Primary accent**: `#39ff14` (neon green)
- **Background**: `#121217` (dark)
- **Text**: `white` (primary), `#39ff14` (accents)
- **Borders**: `border-[#39ff14]`

### Retro Components Available

**Buttons:**
```jsx
import Button from "../../ui/Button";

<Button variant="primary" size="sm" onClick={handleClick}>
  Click Me
</Button>
```

**Sliders:**
```jsx
<input
  type="range"
  min="0"
  max="100"
  value={value}
  onChange={handleChange}
  className="retro-slider"
/>
```

**Borders:**
- Use `border border-[#39ff14]` for consistent styling
- Add `p-2` or `p-3` for padding inside bordered sections

### Layout Best Practices

1. **Use flex layouts**: `flex flex-col h-full gap-3`
2. **Scrollable sections**: Add `overflow-auto` to sections that might overflow
3. **Spacing**: Use `gap-2`, `gap-3`, or `space-y-2` for consistent spacing
4. **Text sizes**: Use `text-xs`, `text-sm`, or `text-base` (default)

## Widget Communication

Widgets can access shared hooks and utilities:

```jsx
import { useCurrentUser } from "../../../hooks/CurrentUser";

const { isAdmin } = useCurrentUser();
```

## Examples

### Simple Widget

```jsx
"use client";
export default function SimpleWidget() {
  return (
    <div className="flex flex-col h-full p-4 text-white">
      <h2 className="text-[#39ff14] mb-2">Hello World</h2>
      <p>This is a simple widget.</p>
    </div>
  );
}
```

### Widget with State

```jsx
"use client";
import { useState } from "react";
import Button from "../../ui/Button";

export default function CounterWidget() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col h-full gap-3 p-4 text-white">
      <div className="border border-[#39ff14] p-3">
        <p className="text-[#39ff14]">Counter</p>
        <p className="text-2xl">{count}</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </Button>
    </div>
  );
}
```

### Widget with API Calls

```jsx
"use client";
import { useState, useEffect } from "react";

export default function DataWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/your-endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3 text-white">
      <div className="border border-[#39ff14] p-2">
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
```

## Advanced Features

### Custom Cursors

The site uses custom Futaba cursors located in `/public/cursors/`:
- `Normal.cur` - Default cursor
- `Link.cur` - Pointer cursor
- `Move.cur` - Drag cursor
- `Diagonal1.cur`, `Diagonal2.cur` - Resize cursors
- `Horizontal.cur`, `Vertical.cur` - Resize cursors

Dragging and resizing automatically use these cursors.

### Constraints

- **Minimum size**: 300×200 pixels
- **Maximum size**: 90% of viewport width/height
- **Drag constraints**: At least 50px of the header must remain visible
- **Z-index**: Starts at 100, increments with each new widget or click

### LocalStorage

Widget state is automatically saved to `localStorage` with the key `"mejedo_widgets"`.

To clear all widgets:
```javascript
localStorage.removeItem("mejedo_widgets");
```

## Troubleshooting

### Widget doesn't appear in menu
- Check that you added it to `availableWidgets` array in `WidgetMenu.jsx`
- Verify the `type` is unique and matches exactly

### Widget shows "Loading widget..."
- Ensure the dynamic import path is correct in `WidgetWindow.jsx`
- Check that the widget component has a default export
- Verify the file name matches the import statement

### Widget is too small/large
- Set custom default size in `useWidgets.js`
- Check minimum constraints (300×200)
- Users can resize manually

### Styling doesn't match theme
- Use `border-[#39ff14]` for borders
- Use `text-[#39ff14]` for accent text
- Use `text-white` for primary text
- Check that you're using the retro components (Button, retro-slider)

## Future Enhancements

Potential improvements to the widget system:
- Widget snapshots/presets
- Widget docking zones
- Multiple workspace support
- Widget-to-widget communication
- Fullscreen mode for widgets
- Widget minimization to taskbar
