# Styling Guide

The Mejedo website blends Windows 95/98 retro computing, terminal/hacker culture, and Y2K-era web design into a cohesive aesthetic. This guide ensures design consistency across all new features.

## Design Philosophy

The site's aesthetic is built on three equally important pillars:

1. **Windows 95/98 Retro Computing** - Beveled buttons, window chrome, sharp edges
2. **Terminal/Hacker Culture** - Monospace fonts, neon green, command-line inspired
3. **Y2K/Early Web Nostalgia** - Pixel art, playful personality, nostalgic references

**Core Principles:**
- Sharp, pixelated edges (no rounded corners)
- High contrast for readability
- Functional, minimal animations
- Monospace typography everywhere
- Strict color palette adherence

## Color System

### The Sacred Palette

**DO NOT add new colors.** Use only these approved colors:

#### Primary Colors

- **Neon Green (Primary Accent)**: `#39ff14`
  - Borders, highlights, CTA elements, active states
  - The signature color of the site
  - Use: `border-[#39ff14]`, `text-[#39ff14]`, `bg-[#39ff14]/10`

- **Dark Background**: `#121217`
  - Main container backgrounds, cards
  - Use: `bg-[#121217]`

- **Deeper Dark**: `#1a1a1f`
  - Alternative containers, menus, darker sections
  - Use: `bg-[#1a1a1f]`

- **Pure White**: `#ffffff` or `white`
  - Primary text color
  - Use: `text-white`

#### Text Colors

```jsx
// Primary text
<p className="text-white">Main content</p>

// Accent/highlighted text
<span className="text-[#39ff14]">Important</span>

// Secondary/muted text
<p className="text-gray-400">Supporting text</p>
<p className="text-gray-500">Less important</p>
```

#### Windows 95/98 Button Colors

**Default Gray Button:**
```
Background: #c0c0c0
Text: black
Border Top/Left: #ffffff
Border Right/Bottom: #808080
```

**Primary Green Button:**
```
Gradient: #5a9c4a → #4a7c3a
Text: white
Border Top/Left: #7abc6a
Border Right/Bottom: #2a5c1a
Hover: #6aac5a → #5a9c4a
```

**Danger Red Button:**
```
Gradient: #e85d5d → #c62828
Text: white
Border Top/Left: #ff8080
Border Right/Bottom: #8b1a1a
Hover: #ff6b6b → #d32f2f
```

#### Status Colors

Only use these for specific status indicators:

- Discord Online: `#43b581`
- Discord Idle: `#faa61a`
- Discord DND: `#f04747`
- Discord Offline: `#747f8d`

**Example:**
```jsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-[#43b581]"></div>
  <span className="text-white">Online</span>
</div>
```

### Color Opacity

Use opacity modifiers for subtle effects:

```jsx
// Very subtle hover (preferred)
<div className="hover:bg-[#39ff14]/5">Item</div>

// Light background
<div className="bg-[#39ff14]/10">Active</div>

// Medium background
<div className="bg-[#39ff14]/15">Selected</div>

// Strong background
<div className="bg-[#39ff14]/20">Highlighted</div>
```

**Opacity Scale:**
- `/5` - Very subtle (hovers)
- `/10` - Light backgrounds
- `/15` - Selected/active states
- `/20` - Strong highlights
- `/30` - Borders, separators

## Typography

### Font Stack

**Only one font family is used site-wide:**

```css
font-family: 'JetBrainsMonoNF', monospace;
```

Apply with: `font-jetbrains` (Tailwind class)

**Never use:**
- Sans-serif fonts
- Serif fonts
- Script/decorative fonts
- Any non-monospace font

### Font Sizes

```jsx
// Extra small (10px) - Tiny labels
<span className="text-[10px]">XS</span>

// Small (0.875rem) - Secondary text, labels
<p className="text-sm">Small text</p>

// Base (1rem) - Default body text
<p className="text-base">Normal text</p>

// Large (1.125rem) - Section subheadings
<h3 className="text-lg">Section</h3>

// Extra large (1.25rem) - Page subheadings
<h2 className="text-xl">Heading</h2>

// 2XL (1.5rem) - Major headings
<h1 className="text-2xl">Title</h1>

// 4XL (2.25rem) - Hero headings
<h1 className="text-4xl">Page Title</h1>
```

### Font Weights

```jsx
// Regular (default) - Body text
<p>Regular weight</p>

// Bold - Headings, emphasis, buttons
<h1 className="font-bold">Bold text</h1>
```

**Don't use:** `font-semibold`, `font-light`, `font-extrabold`

### Text Effects

```jsx
// Pixelated rendering (for pixel art text)
<span className="pixelated">Retro</span>

// Blinking cursor effect
<span className="animate-blink">|</span>

// Drop shadow for contrast
<h1 className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
  Shadowed Title
</h1>

// Green underline (for links)
<a className="underline decoration-[#39ff14] underline-offset-5">
  Link
</a>
```

## Component Patterns

### Buttons

**Always use the Button component** for consistency:

```jsx
import Button from "../ui/Button";

// Primary action (green retro)
<Button variant="primary" size="md" onClick={handleClick}>
  Continue
</Button>

// Default action (gray retro)
<Button variant="default" size="md" onClick={handleClick}>
  Cancel
</Button>

// Dangerous action (red retro)
<Button variant="danger" size="md" onClick={handleDelete}>
  Delete
</Button>

// Small button
<Button variant="primary" size="sm" onClick={handleClick}>
  OK
</Button>

// Large button
<Button variant="primary" size="lg" onClick={handleClick}>
  Start Game
</Button>
```

**Don't create custom buttons** unless absolutely necessary. Use the Button component.

### Containers & Cards

```jsx
// Standard container
<div className="bg-[#121217] border-2 border-[#39ff14] p-4">
  Content
</div>

// Card with shadow
<div className="bg-[#121217] border-2 border-[#39ff14] p-4 shadow-lg">
  Card content
</div>

// Darker container (for nested elements)
<div className="bg-[#1a1a1f] border border-[#39ff14] p-3">
  Nested content
</div>
```

**Key Rules:**
- Always use `border-[#39ff14]`
- Border width: `border-2` for primary, `border` for secondary
- No `rounded` classes (sharp edges only!)
- Background: `bg-[#121217]` or `bg-[#1a1a1f]`

### Window Decorations

For draggable windows and modals, use WindowDecoration:

```jsx
import WindowDecoration from "../window/WindowDecoration";

<div className="bg-[#121217] border-2 border-[#39ff14]">
  <WindowDecoration
    title="Window Title"
    onClose={handleClose}
    onMinimize={handleMinimize} // optional
    showControls={true}
  />
  <div className="p-4">
    Window content
  </div>
</div>
```

### Form Inputs

```jsx
// Text input
<input
  type="text"
  className="bg-[#121217] border border-[#39ff14] text-white px-3 py-2 font-jetbrains"
  placeholder="Enter text..."
/>

// Textarea
<textarea
  className="bg-[#121217] border border-[#39ff14] text-white px-3 py-2 font-jetbrains resize-none"
  rows={4}
  placeholder="Enter message..."
/>

// Checkbox/Radio (custom styling)
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" className="accent-[#39ff14]" />
  <span className="text-white">Option</span>
</label>
```

### Range Slider

Use the `.retro-slider` class for styled range inputs:

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

This applies the retro green slider styling automatically.

### Lists & Navigation

```jsx
// Navigation menu items
<button className="w-full text-left px-4 py-1.5 flex items-center gap-2 transition-colors border-l-2 border-r-2 border-l-transparent border-r-transparent hover:bg-[#39ff14]/10 hover:border-l-[#39ff14]/50 hover:border-r-[#39ff14]/50">
  <span className="text-gray-500">▶</span>
  <span className="text-white">Menu Item</span>
</button>

// Active state
<button className="w-full text-left px-4 py-1.5 flex items-center gap-2 bg-[#39ff14]/15 border-l-2 border-r-2 border-l-[#39ff14] border-r-[#39ff14]">
  <span className="text-[#39ff14]">▶</span>
  <span className="text-white">Active Item</span>
</button>
```

## Layout Patterns

### Spacing System

**Use consistent spacing:**

```jsx
// Padding
p-1    // 4px
p-2    // 8px
p-3    // 12px
p-4    // 16px
p-6    // 24px

// Gap (flex/grid)
gap-1  // 4px
gap-2  // 8px
gap-3  // 12px
gap-4  // 16px

// Specific sides
px-3   // horizontal padding
py-2   // vertical padding
```

**Common Patterns:**

```jsx
// Container with content spacing
<div className="p-4 space-y-4">
  <div>Section 1</div>
  <div>Section 2</div>
</div>

// Flex with gap
<div className="flex items-center gap-2">
  <span>Icon</span>
  <span>Text</span>
</div>

// Vertical stack
<div className="flex flex-col gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Container Widths

```jsx
// Full width
<div className="w-full">Content</div>

// Fixed widths for specific components
<div className="min-w-[240px]">Menu</div>
<div className="max-w-[600px]">Modal</div>
<div className="max-w-[320px]">Card</div>

// Responsive widths (rare, only if needed)
<div className="w-full md:w-1/2 lg:w-1/3">Content</div>
```

### Z-Index Layers

Maintain strict z-index hierarchy:

```jsx
// Components (normal flow)
z-10, z-20, z-30, z-40

// Floating elements
z-40  // Mascot speech bubble
z-45  // Widget button
z-50  // Dropdown menus

// Overlays
z-[9998]  // Achievement toasts
z-[9999]  // Modals, full-screen overlays
```

## Animations & Transitions

### Animation Philosophy

**Keep animations minimal and functional:**
- Fade in/out for content reveals
- Subtle slide for dropdowns
- No spinning, no bouncing (except mascot)
- No complex keyframe animations
- Duration: 200-400ms maximum

### Standard Transitions

```jsx
// Hover effects (preferred)
<button className="transition-colors hover:bg-[#39ff14]/10">
  Hover me
</button>

// Multiple properties
<div className="transition-all hover:scale-105">
  Scale on hover
</div>

// Opacity fade
<div className="transition-opacity opacity-0 hover:opacity-100">
  Fade in
</div>
```

### Built-in Animations

```jsx
// Fade in (page loads)
<div className="animate-fadeIn">
  Content
</div>

// Slide up (modals, cards)
<div className="animate-slideUp">
  Modal content
</div>

// Dropdown menu
<div className="animate-dropdown">
  Menu
</div>

// Blinking cursor
<span className="animate-blink">|</span>
```

### Custom Animations

Only create custom animations for unique, necessary effects. Use existing animations first.

```jsx
// Mascot bounce (already defined)
<div className="animate-mascot-bounce">Mascot</div>

// Speech bubble enter (already defined)
<div className="animate-bubble-enter">Tip</div>
```

## Retro Aesthetic Elements

### Pixel Art Rendering

For pixel art images (mascot, icons, buttons):

```jsx
<img
  src="/mascot/futaba0.png"
  alt="Mascot"
  className="pixelated"
  style={{ imageRendering: 'pixelated' }}
/>
```

### Custom Cursors

Cursors are automatically applied, but you can override:

```jsx
// Link cursor (buttons, links)
<a className="cursor-pointer">Link</a>

// Move cursor (draggable elements)
<div style={{ cursor: "url('/cursors/Move.cur'), move" }}>
  Drag me
</div>

// Not-allowed cursor (disabled)
<button disabled className="cursor-not-allowed">
  Disabled
</button>
```

### Borders

**Always sharp, never rounded:**

```jsx
// ✅ Correct
<div className="border-2 border-[#39ff14]">Content</div>

// ❌ Wrong - NO ROUNDED CORNERS
<div className="border-2 border-[#39ff14] rounded-lg">Wrong</div>
```

**Border Patterns:**

```jsx
// Primary border (2px, bold)
border-2 border-[#39ff14]

// Secondary border (1px, subtle)
border border-[#39ff14]

// Faint border (with opacity)
border border-[#39ff14]/30

// Dashed separator
<div className="custom-dash">
  {/* Pre-styled dashed border */}
</div>
```

### Shadows & Depth

```jsx
// Drop shadow (for overlays, modals)
<div className="shadow-lg">Content</div>

// Custom shadow (Windows XP style)
<div className="shadow-[2px_2px_8px_rgba(0,0,0,0.5)]">
  Dropdown menu
</div>

// Text drop shadow (for contrast)
<h1 className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
  Heading
</h1>
```

**Don't use:**
- Modern soft shadows (`shadow-md`, `shadow-xl`)
- Colored shadows (except neon green glow)
- Inner shadows (except retro button bevels)

### Beveled Button Effect

The Button component handles this automatically, but for reference:

```css
/* Top-left light border */
border-top: 2px solid #7abc6a;
border-left: 2px solid #7abc6a;

/* Bottom-right dark border */
border-right: 2px solid #2a5c1a;
border-bottom: 2px solid #2a5c1a;

/* Inset highlights */
box-shadow: inset 1px 1px 0 0 #8acc7a, inset -1px -1px 0 0 #1a4c0a;
```

## Common Patterns

### Page Structure

```jsx
export default function YourPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <h1 className="text-4xl font-bold text-[#39ff14] border-b-2 border-[#39ff14] pb-2">
        Page Title
      </h1>

      {/* Content sections */}
      <div className="space-y-4 text-white">
        <div className="bg-[#121217] border-2 border-[#39ff14] p-4">
          Section 1
        </div>

        <div className="bg-[#121217] border-2 border-[#39ff14] p-4">
          Section 2
        </div>
      </div>
    </div>
  );
}
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="bg-[#121217] border-2 border-[#39ff14] p-4">
      <h3 className="text-[#39ff14] font-bold mb-2">{item.title}</h3>
      <p className="text-white text-sm">{item.description}</p>
    </div>
  ))}
</div>
```

### Modal Overlay

```jsx
{isOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
    <div className="bg-[#121217] border-2 border-[#39ff14] max-w-[600px] w-full animate-slideUp">
      <WindowDecoration
        title="Modal Title"
        onClose={handleClose}
        showControls={true}
      />
      <div className="p-6">
        Modal content
      </div>
    </div>
  </div>
)}
```

### Loading States

```jsx
{loading ? (
  <div className="flex items-center justify-center h-full text-white">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#39ff14]"></div>
      <p className="text-sm">Loading...</p>
    </div>
  </div>
) : (
  <div>{content}</div>
)}
```

### Empty States

```jsx
<div className="flex flex-col items-center justify-center h-full text-center p-8">
  <p className="text-[#39ff14] text-2xl mb-2">¯\\_(ツ)_/¯</p>
  <p className="text-white mb-1">No data found</p>
  <p className="text-gray-500 text-sm">Try again later</p>
</div>
```

## Common Mistakes (Don't Do This!)

### ❌ Rounded Corners

```jsx
// WRONG
<div className="rounded-lg border-2 border-[#39ff14]">
  This breaks the retro aesthetic
</div>

// CORRECT
<div className="border-2 border-[#39ff14]">
  Sharp edges maintain the Windows 95 look
</div>
```

### ❌ Modern Shadows

```jsx
// WRONG
<div className="shadow-2xl">
  Modern soft shadow
</div>

// CORRECT
<div className="shadow-lg">
  Simple sharp shadow
</div>

// OR
<div className="shadow-[2px_2px_8px_rgba(0,0,0,0.5)]">
  Windows XP style shadow
</div>
```

### ❌ Non-Monospace Fonts

```jsx
// WRONG
<p className="font-sans">
  Regular font
</p>

// CORRECT
<p className="font-jetbrains">
  Monospace font (or no class, it's default)
</p>
```

### ❌ New Colors

```jsx
// WRONG
<button className="bg-blue-500 text-white">
  Blue button
</button>

// CORRECT - Use existing Button component
<Button variant="primary">
  Green retro button
</Button>
```

### ❌ Smooth Rounded Buttons

```jsx
// WRONG
<button className="rounded-full px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
  Modern button
</button>

// CORRECT
<Button variant="primary">
  Retro beveled button
</Button>
```

### ❌ Gradient Backgrounds

```jsx
// WRONG
<div className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
  Colorful gradient
</div>

// CORRECT
<div className="bg-[#121217]">
  Solid dark background
</div>
```

### ❌ Complex Animations

```jsx
// WRONG
<div className="animate-bounce duration-1000 repeat-infinite">
  Bouncing element
</div>

// CORRECT
<div className="transition-colors hover:bg-[#39ff14]/10">
  Subtle hover effect
</div>
```

### ❌ Lowercase or Mixed Case Class Names

```jsx
// WRONG - Inconsistent style
<h1 className="Text-4xl Font-Bold">Title</h1>

// CORRECT - All lowercase, kebab-case
<h1 className="text-4xl font-bold">Title</h1>
```

## Responsive Design

### Breakpoint Usage

Use Tailwind breakpoints sparingly. The site is desktop-first:

```jsx
// Mobile: hide on small screens
<div className="hidden md:block">
  Desktop content
</div>

// Mobile: show only on small screens
<div className="block md:hidden">
  Mobile content
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive heading
</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Grid items
</div>
```

**Prefer fixed layouts** over fluid responsive designs. The retro aesthetic works best with defined sizes.

## Accessibility

### Contrast & Readability

✅ **Good contrast:**
- White text on `#121217` background
- `#39ff14` on dark backgrounds
- Black text on `#c0c0c0` (gray buttons)

❌ **Poor contrast (avoid):**
- Gray text on dark gray backgrounds
- Light green on white

### Focus States

Always show focus indicators for keyboard navigation:

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-[#39ff14]">
  Keyboard accessible
</button>
```

### Alt Text

Always provide alt text for images:

```jsx
<img
  src="/mascot/futaba0.png"
  alt="Futaba mascot character"
  className="pixelated"
/>
```

## File Organization

### Where to Find Styles

- **Global styles**: `/app/globals.css`
- **Tailwind config**: `/tailwind.config.js`
- **Component styles**: Inline with Tailwind classes
- **Custom animations**: Defined in `globals.css`

### Adding New Styles

1. **Try Tailwind first** - Use existing utility classes
2. **Check globals.css** - Look for existing custom classes
3. **Add to globals.css** - If truly necessary, add new class
4. **Update this guide** - Document new patterns

## Quick Reference

### Color Classes

```jsx
text-white           // White text
text-[#39ff14]       // Neon green text
text-gray-400        // Secondary text
text-gray-500        // Muted text
bg-[#121217]         // Dark background
bg-[#1a1a1f]         // Darker background
bg-[#39ff14]/10      // Light green background
border-[#39ff14]     // Neon green border
border-2             // 2px border
```

### Layout Classes

```jsx
flex flex-col        // Vertical flex
flex items-center    // Center items
gap-2 gap-3 gap-4    // Spacing between flex items
p-2 p-3 p-4 p-6      // Padding
space-y-4            // Vertical spacing (children)
w-full               // Full width
h-full               // Full height
```

### Transition Classes

```jsx
transition-colors    // Color transitions
transition-all       // All property transitions
hover:bg-[#39ff14]/10   // Hover background
hover:scale-105      // Hover scale
active:translate-y-px   // Button press effect
```

### Animation Classes

```jsx
animate-fadeIn       // Fade in
animate-slideUp      // Slide up
animate-dropdown     // Dropdown menu
animate-blink        // Blinking cursor
```

## Need Help?

- **Unsure about a pattern?** Check existing components for reference
- **Need a new component?** Look for similar components first
- **Color not in palette?** Use neon green (#39ff14) as accent
- **Animation feels off?** Reduce duration or remove animation

**Golden Rule:** When in doubt, look at existing code and match that style exactly.
