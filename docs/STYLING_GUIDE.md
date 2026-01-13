# Styling Guide

Retro aesthetic combining Windows 95/98, terminal/hacker culture, and Y2K web design.

## Design Principles

- Sharp, pixelated edges (no rounded corners)
- High contrast for readability
- Monospace typography everywhere
- Minimal, functional animations
- Strict color palette

## Colors

**Primary:**
- `#39ff14` - Neon green (borders, accents, highlights)
- `#121217` - Dark background (containers)
- `#1a1a1f` - Deeper dark (nested elements)
- `white` - Primary text

**Secondary:**
- `text-gray-400` - Secondary text
- `text-gray-500` - Muted text

**Buttons:**
- Default: `#c0c0c0` background, `#ffffff`/`#808080` borders
- Primary: `#5a9c4a → #4a7c3a` gradient, `#7abc6a`/`#2a5c1a` borders
- Danger: `#e85d5d → #c62828` gradient, `#ff8080`/`#8b1a1a` borders

**Status (Discord only):**
- Online: `#43b581`
- Idle: `#faa61a`
- DND: `#f04747`
- Offline: `#747f8d`

## Typography

**Font:** JetBrains Mono (monospace)

```jsx
// Use CSS variable
className="font-[var(--font-jetbrains)]"

// Or rely on body default (already set)
```

**Sizes:**
- `text-sm` - Small (labels, secondary)
- `text-base` - Default body
- `text-lg` - Section headings
- `text-xl` - Page subheadings
- `text-2xl` - Major headings
- `text-4xl` - Hero/page titles

**Weights:** Regular (default) or `font-bold` only.

**Effects:**
```jsx
// Pixel art rendering
style={{ imageRendering: 'pixelated' }}

// Drop shadow for contrast
className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"

// Underline links
className="underline decoration-[#39ff14] underline-offset-5"
```

## Components

### Buttons

```jsx
import Button from "../ui/Button";

<Button variant="primary" size="md">Continue</Button>
<Button variant="default" size="md">Cancel</Button>
<Button variant="danger" size="md">Delete</Button>
```

Variants: `default`, `primary`, `danger`
Sizes: `sm`, `md`, `lg`

### Containers

```jsx
// Primary container
<div className="bg-[#121217] border-2 border-[#39ff14] p-4">
  Content
</div>

// Nested/darker
<div className="bg-[#1a1a1f] border border-[#39ff14] p-3">
  Nested content
</div>
```

**Rules:**
- Always use `border-[#39ff14]`
- No `rounded` classes (sharp edges only)
- Use `border-2` for primary, `border` for secondary

### Form Inputs

```jsx
// Text input
<input
  type="text"
  className="bg-[#121217] border border-[#39ff14] text-white px-3 py-2"
/>

// Range slider
<input type="range" className="retro-slider" />

// Checkbox
<input type="checkbox" className="accent-[#39ff14]" />
```

## Layout

**Spacing:**
```jsx
p-1, p-2, p-3, p-4, p-6    // Padding
gap-1, gap-2, gap-3, gap-4  // Flex/grid gap
space-y-4                   // Vertical stack
```

**Z-index:**
- Components: `z-10` to `z-40`
- Floating: `z-40` to `z-50`
- Overlays: `z-[9998]` to `z-[9999]`

## Animations

**Transitions (preferred):**
```jsx
className="transition-colors hover:bg-[#39ff14]/10"
className="transition-all hover:scale-105"
```

**Built-in animations:**
```jsx
animate-fadeIn      // Page load fade
animate-slideUp     // Modal slide
animate-dropdown    // Dropdown menu
animate-blink       // Blinking cursor
```

**Duration:** 200-400ms maximum. Keep animations minimal and functional.

## Common Patterns

### Page Structure

```jsx
<div className="space-y-6 animate-fadeIn">
  <h1 className="text-4xl font-bold text-[#39ff14] border-b-2 border-[#39ff14] pb-2">
    Page Title
  </h1>
  <div className="space-y-4 text-white">
    {/* Content */}
  </div>
</div>
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-[#121217] border-2 border-[#39ff14] p-4">
    <h3 className="text-[#39ff14] font-bold mb-2">Title</h3>
    <p className="text-white text-sm">Content</p>
  </div>
</div>
```

### Loading State

```jsx
<div className="flex items-center justify-center h-full text-white">
  <div className="flex flex-col items-center gap-2">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#39ff14]"></div>
    <p className="text-sm">Loading...</p>
  </div>
</div>
```

## Don't Do This

❌ Rounded corners: `rounded-lg`, `rounded-full` (except spinners/dots)
❌ Non-monospace fonts: `font-sans`, `font-serif`
❌ New colors outside the palette
❌ Modern soft shadows: `shadow-2xl`
❌ Complex animations: `animate-bounce duration-1000`
❌ Gradient backgrounds (except buttons)

## Responsive Design

Use breakpoints sparingly. Desktop-first approach:

```jsx
// Hide on mobile
<div className="hidden md:block">Desktop content</div>

// Show on mobile only
<div className="block md:hidden">Mobile content</div>
```

Prefer fixed layouts over fluid responsive designs.

## Accessibility

- High contrast: White on dark, green on dark
- Focus indicators: `focus:ring-2 focus:ring-[#39ff14]`
- Alt text: Always provide for images
- Keyboard navigation: Support for all interactions

## Custom Classes

Available in [globals.css](../app/globals.css):

- `.retro-slider` - Styled range inputs
- `.custom-dash` - Dashed border separator
- `.scrollbar-hide` - Hide scrollbars

## Quick Reference

```jsx
// Colors
text-white           bg-[#121217]
text-[#39ff14]       bg-[#1a1a1f]
text-gray-400        bg-[#39ff14]/10
border-[#39ff14]

// Layout
flex flex-col        gap-2 gap-3 gap-4
p-2 p-3 p-4         space-y-4
w-full h-full

// Effects
transition-colors    hover:bg-[#39ff14]/10
animate-fadeIn       animate-slideUp
```

**Golden Rule:** When in doubt, check existing components and match that style exactly.
