# Navigation & Page Management Documentation

The navigation system provides instant page transitions with dynamic loading, image preloading, and achievement tracking.

## Features

- **Dynamic Loading**: Pages are lazy-loaded using Next.js dynamic imports
- **Hover Preloading**: Pages preload on hover for instant navigation
- **Image Stability**: Waits for images to load before showing content
- **Smooth Transitions**: Fade animations with loading spinner
- **Achievement Integration**: Tracks page visits for explorer achievement
- **Mobile Detection**: Adapts UI for mobile devices

## Architecture

### Core Files

- `/app/page.jsx` - Main page orchestrator (384 lines)
- `/app/components/about/about.jsx` - About page
- `/app/components/projects/projects.jsx` - Projects page
- `/app/components/blog/blog.jsx` - Blog page
- `/app/components/collection/collection.jsx` - Collection page
- `/app/components/posts/posts.jsx` - Shitposts page
- `/app/components/guestbook/guestbook.jsx` - Guestbook page
- `/app/components/webring/webring.jsx` - Webring page
- `/app/components/buttons/buttons.jsx` - Buttons page
- `/app/components/admin/admin.jsx` - Admin panel

### State Management

Main navigation state in `/app/page.jsx`:

```javascript
const [active, setActive] = useState("/about"); // Current page
const [transitioning, setTransitioning] = useState(false); // Loading state
const [preloadedPages, setPreloadedPages] = useState(new Set(["/about"])); // Preloaded pages
```

### Page Registry

Pages are registered with dynamic imports for code splitting:

```javascript
const pageComponents = {
  "/about": dynamic(() => import("./components/about/about.jsx")),
  "/projects": dynamic(() => import("./components/projects/projects.jsx")),
  "/guestbook": dynamic(() => import("./components/guestbook/guestbook.jsx")),
  "/blog": dynamic(() => import("./components/blog/blog.jsx")),
  "/shitposts": dynamic(() => import("./components/posts/posts.jsx")),
  "/admin": dynamic(() => import("./components/admin/admin.jsx")),
  "/collection": dynamic(() => import("./components/collection/collection.jsx")),
  "/webring": dynamic(() => import("./components/webring/webring.jsx")),
  "/buttons": dynamic(() => import("./components/buttons/buttons.jsx")),
};
```

**Import functions** for preloading:

```javascript
const pageImports = {
  "/about": () => import("./components/about/about.jsx"),
  "/projects": () => import("./components/projects/projects.jsx"),
  // ... same for all pages
};
```

## Navigation Flow

### Complete Navigation Sequence

1. **Hover Trigger** → `onMouseEnter` on navigation link
2. **Preload** → `preloadPage(page)` imports component in background
3. **Click Trigger** → `NavClick(page)` called
4. **Transition Start** → Show loading spinner, fade out current page
5. **Page Change** → Update `active` state
6. **Wait for Images** → `waitForImages()` for stability
7. **Transition End** → Hide spinner, fade in new page
8. **Achievement** → Track page visit

### Preload Function

```javascript
const preloadPage = useCallback(async (page) => {
  if (preloadedPages.has(page) || !pageImports[page]) return;

  try {
    await pageImports[page](); // Import component
    setPreloadedPages(prev => new Set([...prev, page]));
  } catch (error) {
    console.error(`Failed to preload ${page}:`, error);
  }
}, [preloadedPages]);
```

**Benefits:**
- Instant navigation feel (component already loaded)
- Users hover before clicking, giving time to load
- Prevents navigation lag

### Navigation Click Handler

```javascript
const NavClick = async (page) => {
  if (active === page || transitioning) return; // Prevent double-click

  setTransitioning(true); // Show spinner
  await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for transition

  setActive(page); // Change page
  updateStats("visitedPages", page); // Track for achievements

  // Wait for images if needed
  if (page === "/shitposts" || page === "/collection") {
    await waitForImages(1000, 500); // 1s timeout, 500ms stability
  }

  setTransitioning(false); // Hide spinner
};
```

### Image Loading System

Some pages need to wait for images to finish loading before displaying:

```javascript
const waitForImages = (timeout = 1000, stabilityDelay = 300) => {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkImages = () => {
      // Get container element
      const container = mainRef.current;
      if (!container) {
        resolve();
        return;
      }

      // Find all images in the container
      const images = container.querySelectorAll('img');

      // Check timeout
      if (Date.now() - startTime > timeout) {
        resolve();
        return;
      }

      // Check if all images loaded
      const allLoaded = Array.from(images).every(img => img.complete);

      if (allLoaded && images.length > 0) {
        // Wait for stability (layout settling)
        setTimeout(resolve, stabilityDelay);
      } else {
        // Check again soon
        setTimeout(checkImages, 50);
      }
    };

    checkImages();
  });
};
```

**Why This Matters:**
- `/shitposts` and `/collection` fetch dynamic content with images
- Images loading causes layout shifts
- Prevents jarring content jumps
- Better UX with stable layout before reveal

**Parameters:**
- `timeout` (1000ms): Max wait time before giving up
- `stabilityDelay` (500ms): Wait after load for layout settling

## Adding a New Page

### Step 1: Create Page Component

Create a new file at `/app/components/yourpage/yourpage.jsx`:

```jsx
"use client";
import { useEffect } from "react";
import { useAchievements } from "../../hooks/useAchievements";

export default function YourPage() {
  const { updateStats } = useAchievements();

  // Track page visit for achievements
  useEffect(() => {
    updateStats("visitedPages", "/yourpage");
  }, [updateStats]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-4xl font-bold text-[#39ff14] border-b-2 border-[#39ff14] pb-2">
        Your Page Title
      </h1>

      <div className="space-y-4 text-white">
        {/* Your page content */}
      </div>
    </div>
  );
}
```

**Important:**
- Use `"use client"` directive
- Add `animate-fadeIn` for transition animation
- Track page visit with `updateStats`
- Use consistent styling (neon green headers, white text)

### Step 2: Register in Page.jsx

Edit `/app/page.jsx` and add to the registries:

**Add to pageComponents:**
```javascript
const pageComponents = {
  "/about": dynamic(() => import("./components/about/about.jsx")),
  // ... existing pages
  "/yourpage": dynamic(() => import("./components/yourpage/yourpage.jsx")),
};
```

**Add to pageImports:**
```javascript
const pageImports = {
  "/about": () => import("./components/about/about.jsx"),
  // ... existing pages
  "/yourpage": () => import("./components/yourpage/yourpage.jsx"),
};
```

### Step 3: Add Navigation Link

Add a navigation button to the header in `/app/page.jsx`:

```jsx
<button
  className="retro-button pixelated hover:scale-105 transition-transform"
  onClick={() => NavClick("/yourpage")}
  onMouseEnter={() => preloadPage("/yourpage")}
>
  Your Page
</button>
```

**Button Styles:**
- Use `retro-button` class for Windows 95/98 style
- Add `pixelated` for retro font rendering
- Include `hover:scale-105 transition-transform` for hover effect
- Wire up `onClick` and `onMouseEnter` for navigation and preload

### Step 4: Update Explorer Achievement (Optional)

If you want the page to count toward the explorer achievement, edit `/app/hooks/useAchievements.js`:

```javascript
// In the updateStats function, visitedPages section
if (key === "visitedPages" && !prev.visitedPages.includes(value)) {
  updated.visitedPages = [...prev.visitedPages, value];

  // Check for explorer achievement
  const allPages = [
    "/about", "/projects", "/blog", "/collection",
    "/shitposts", "/guestbook", "/webring", "/buttons", "/admin",
    "/yourpage" // Add your new page
  ];
  if (allPages.every((p) => updated.visitedPages.includes(p))) {
    setTimeout(() => unlockRef.current?.("explorer"), 500);
  }
}
```

### Step 5: (Optional) Add Image Loading

If your page loads dynamic images, add it to the image wait list:

```javascript
const NavClick = async (page) => {
  // ... navigation logic

  // Wait for images if needed
  if (page === "/shitposts" || page === "/collection" || page === "/yourpage") {
    await waitForImages(1000, 500);
  }

  setTransitioning(false);
};
```

## Page-Specific Considerations

### Pages with Dynamic Content

**Collection & Shitposts:**
- Fetch data from API on mount
- Wait for images to load before revealing
- Use loading states

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/your-endpoint')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    });
}, []);

if (loading) {
  return <div className="text-white">Loading...</div>;
}
```

### Admin-Only Pages

Check admin status before showing content:

```javascript
import { useCurrentUser } from "../../hooks/CurrentUser";

export default function AdminPage() {
  const { isAdmin } = useCurrentUser();

  if (!isAdmin) {
    return (
      <div className="text-center text-white">
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    // Admin content
  );
}
```

### Pages with Forms

Use the retro button styling:

```javascript
import Button from "../ui/Button";

<Button
  variant="primary"
  size="md"
  onClick={handleSubmit}
>
  Submit
</Button>
```

## Mobile Detection

The site detects mobile devices and can show adapted UI:

```javascript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const ua = navigator.userAgent || window.opera;
  if (/android|iphone|ipad|ipod|windows phone/i.test(ua)) {
    setIsMobile(true);
  }
}, []);
```

Use `isMobile` state to conditionally render mobile-specific UI.

## Transition Animations

### CSS Animations

Pages use Tailwind animation classes:

- `animate-fadeIn` - Fade in on page load
- `animate-slideUp` - Slide up on page load
- `animate-dropdown` - Dropdown animation for menus

### Loading Spinner

A spinner shows during transitions:

```javascript
{transitioning && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#39ff14]"></div>
  </div>
)}
```

**Styling:**
- Full screen overlay with `fixed inset-0`
- Semi-transparent background `bg-black/50`
- Neon green spinner border
- High z-index to appear above content

## Achievement Integration

### Tracking Page Visits

Every page should track its visit:

```javascript
import { useAchievements } from "../../hooks/useAchievements";

export default function YourPage() {
  const { updateStats } = useAchievements();

  useEffect(() => {
    updateStats("visitedPages", "/yourpage");
  }, [updateStats]);

  // ... rest of component
}
```

### Explorer Achievement

The explorer achievement unlocks when users visit all 9 main pages:

```javascript
const allPages = [
  "/about", "/projects", "/blog", "/collection",
  "/shitposts", "/guestbook", "/webring", "/buttons", "/admin"
];
```

**Progression:**
- User: 5/9 pages visited
- User visits: /buttons
- User: 6/9 pages visited
- ... continues until 9/9
- Achievement unlocks!

## Styling Guidelines

### Page Container

Use consistent spacing and animations:

```jsx
<div className="space-y-6 animate-fadeIn">
  {/* Page content */}
</div>
```

### Page Headers

Use neon green with bottom border:

```jsx
<h1 className="text-4xl font-bold text-[#39ff14] border-b-2 border-[#39ff14] pb-2">
  Page Title
</h1>
```

### Content Sections

White text with vertical spacing:

```jsx
<div className="space-y-4 text-white">
  <p>Your content here</p>
</div>
```

### Retro Borders

Use neon green borders for sections:

```jsx
<div className="border-2 border-[#39ff14] p-4">
  {/* Bordered content */}
</div>
```

## Performance Optimization

### Code Splitting

Dynamic imports automatically code-split pages:
- Only loads the page component when needed
- Reduces initial bundle size
- Faster initial page load

### Preloading Strategy

Hover preloading balances performance and UX:
- **Pros**: Instant navigation feel, better UX
- **Cons**: Extra bandwidth if user doesn't click
- **Mitigation**: Only preloads on hover, not all pages at once

### Image Loading Strategy

Two-phase approach:
1. **Show spinner** - User knows something is happening
2. **Wait for images** - Prevents layout shift on reveal

Timeouts prevent infinite waiting.

## Troubleshooting

### Page doesn't appear in navigation

- Check that the page is registered in both `pageComponents` and `pageImports`
- Verify the import path is correct
- Check for syntax errors in the page component

### Navigation is slow

- Check if page is being preloaded on hover
- Verify dynamic import is working (check Network tab)
- Consider adding the page to initial preload if it's frequently accessed

### Images cause layout shift

- Add the page to the `waitForImages` condition
- Increase timeout if images are large
- Consider using `width` and `height` attributes on images

### Achievement doesn't track

- Verify `updateStats("visitedPages", "/page")` is called in `useEffect`
- Check that the page path matches exactly (e.g., "/about" not "about")
- Ensure `useAchievements` hook is imported and used

### Transitions feel janky

- Check that `transitioning` state is being set correctly
- Verify CSS animations are not conflicting
- Reduce `waitForImages` timeout if too long

## Best Practices

1. **Always preload on hover**: Wire up `onMouseEnter` for instant navigation
2. **Track page visits**: Use `updateStats` for achievement tracking
3. **Use consistent styling**: Neon green accents, white text, retro borders
4. **Add fade animations**: Use `animate-fadeIn` for smooth reveals
5. **Handle loading states**: Show loading UI for pages with async data
6. **Wait for images**: Use `waitForImages` for pages with dynamic images
7. **Test mobile**: Ensure pages work on mobile devices
8. **Check admin access**: Protect admin-only pages with `isAdmin` check

## Future Enhancements

Potential improvements to the navigation system:
- Browser back/forward button support (history API)
- URL routing with Next.js App Router
- Page transition direction animations (slide left/right)
- Breadcrumb navigation
- Page-specific loading states
- Keyboard navigation (arrow keys, numbers)
- Page bookmarking/favorites
- Recently viewed pages history
