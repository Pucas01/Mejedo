# Navigation System

Dynamic page loading with hover preloading and smooth transitions.

## Core Files

- [app/page.jsx](../app/page.jsx) - Main page orchestrator (355 lines)
- Individual page components in [app/components/](../app/components/)

## Pages (10 total)

```javascript
"/about", "/projects", "/blog", "/collection",
"/shitposts", "/guestbook", "/webring", "/buttons",
"/ado", "/admin"
```

**Note:** Explorer achievement requires visiting 9 pages (excludes `/ado`).

## State Management

```javascript
const [active, setActive] = useState("/about"); // Current page
const [transitioning, setTransitioning] = useState(false); // Loading state
const [preloadedPages, setPreloadedPages] = useState(new Set(["/about"]));
```

## Navigation Flow

1. **Hover** → Preloads page component
2. **Click** → Shows loading spinner
3. **Page Change** → Updates active state, tracks visit
4. **Wait for Images** → Prevents layout shift (collection/shitposts only)
5. **Reveal** → Hides spinner, fades in page

## Preloading

```javascript
const preloadPage = useCallback(async (page) => {
  if (preloadedPages.has(page) || !pageImports[page]) return;
  await pageImports[page]();
  setPreloadedPages(prev => new Set([...prev, page]));
}, [preloadedPages]);

// Usage
<button
  onClick={() => NavClick("/page")}
  onMouseEnter={() => preloadPage("/page")}
>
  Page
</button>
```

## Image Loading

For pages with dynamic images (collection, shitposts):

```javascript
const waitForImages = useCallback((container, waitForNewImages = false) => {
  // Returns promise that resolves when images load
  // Timeout: 5000ms
  // Uses image count stability detection
}, []);

// Usage in NavClick
await waitForImages(mainRef.current, true);
```

## Adding a Page

### 1. Create component

```jsx
"use client";
import { useEffect } from "react";
import { useAchievements } from "../../hooks/useAchievements";

export default function YourPage() {
  const { updateStats } = useAchievements();

  useEffect(() => {
    updateStats("visitedPages", "/yourpage");
  }, [updateStats]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-4xl font-bold text-[#39ff14] border-b-2 border-[#39ff14] pb-2">
        Page Title
      </h1>
      <div className="space-y-4 text-white">
        {/* Content */}
      </div>
    </div>
  );
}
```

### 2. Register in page.jsx

Add to `pageComponents` and `pageImports`:

```javascript
const pageComponents = {
  // ... existing
  "/yourpage": dynamic(() => import("./components/yourpage/yourpage.jsx")),
};

const pageImports = {
  // ... existing
  "/yourpage": () => import("./components/yourpage/yourpage.jsx"),
};
```

### 3. Add nav button

```jsx
<button
  className="retro-button pixelated hover:scale-105 transition-transform"
  onClick={() => NavClick("/yourpage")}
  onMouseEnter={() => preloadPage("/yourpage")}
>
  Your Page
</button>
```

### 4. Update explorer achievement (optional)

Edit [app/hooks/useAchievements.js:340](../app/hooks/useAchievements.js#L340) to include your page in the `allPages` array.

## Achievement Tracking

Every page should call:

```javascript
updateStats("visitedPages", "/yourpage");
```

This tracks page visits for the **explorer** achievement.
