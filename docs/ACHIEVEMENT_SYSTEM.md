# Achievement System Documentation

The achievement system provides gamification through unlockable achievements that track user interactions across the entire website.

## Features

- **Stats Tracking**: Monitors user actions (page visits, clicks, game scores, etc.)
- **Toast Notifications**: Visual feedback when achievements unlock
- **LocalStorage Persistence**: Achievements persist across sessions
- **Cross-Tab Sync**: Updates sync across multiple browser tabs/windows
- **Cascading Unlocks**: Some achievements unlock other achievements
- **Progress Modal**: View all achievements and track completion

## Architecture

### Core Files

- `/app/hooks/useAchievements.js` - Context provider managing achievement state (425 lines)
- `/app/components/achievements/AchievementToast.jsx` - Toast notification UI
- `/app/components/achievements/AchievementsModal.jsx` - Achievement viewer modal

### State Management

The system uses React Context to provide global achievement state:

```javascript
const {
  achievements,           // All achievement definitions
  unlockedAchievements,  // User's unlocked achievements
  stats,                 // User statistics
  unlock,                // Function to unlock achievements
  updateStats,           // Function to update stats
  isLoaded              // LocalStorage load status
} = useAchievements();
```

### Achievement Structure

Each achievement has the following properties:

```javascript
{
  id: "achievement_id",
  name: "Achievement Name",
  description: "What the user did to earn this",
  icon: "🏆", // or empty string
  hidden: false // true for hidden achievements
}
```

### Stats Structure

User stats tracked for achievement conditions:

```javascript
{
  visitedPages: [],          // Array of visited page paths
  mascotClicks: 0,           // Number of mascot clicks
  rhythmHighScore: 0,        // Highest score in rhythm game
  viewedConsole: false,      // Viewed a console from collection
  viewedManga: false,        // Viewed a manga from collection
  openedWidget: false,       // Opened any widget
  playedSong: false,         // Played a song in music player
  openedTetoWidget: false,   // Opened Teto YouTube widget
  scoredPongPoint: false     // Scored a point in Pong
}
```

## Achievement Categories

### Activity Achievements (Visible)

- **first_visit** - Visit the website for the first time
- **explorer** - Visit all pages (/about, /projects, /blog, /collection, /shitposts, /guestbook, /webring, /buttons, /admin)
- **rhythm_master** - Score over 1000 points in rhythm game
- **guestbook_signer** - Leave a message in the guestbook
- **blog_reader** - Read a blog post
- **collection_viewer** - View both a console and a manga
- **changelog_reader** - Read the changelog
- **junpei_clicker** - Click on Miku in the website
- **stalker** - Click on a social link
- **button_copier** - Copy the website button code
- **guestbook_visitor** - Visit someone's website from guestbook
- **widget_opener** - Open a widget for the first time
- **music_listener** - Play a song in the music player
- **teto_watcher** - Watch the Teto Mix video
- **pong_scorer** - Score a point in Pong

### Hidden Achievements

- **konami_master** - Enter the Konami code (↑↑↓↓←→←→BA)
- **futaba_funeral** - Hide the mascot
- **futaba_fan** - Find the all-out attack easter egg
- **click_happy** - Click on Futaba 10 times
- **not_him** - Try to log in to the admin page
- **window_rebel** - Try to close a non-closable window
- **collector** - Unlock 5 achievements (cascading)
- **completionist** - Unlock all achievements (cascading)

## Adding a New Achievement

### Step 1: Define the Achievement

Edit `/app/hooks/useAchievements.js` and add to the `ACHIEVEMENTS` object:

```javascript
export const ACHIEVEMENTS = {
  // ... existing achievements

  your_achievement: {
    id: "your_achievement",
    name: "Achievement Name",
    description: "How to unlock this achievement",
    icon: "🎯", // Optional emoji
    hidden: false, // or true for hidden achievements
  },
};
```

**Naming Convention:**
- ID: lowercase with underscores (e.g., `rhythm_master`)
- Name: Title case (e.g., "Rhythm Master")
- Description: Casual, fun tone matching the site's personality

### Step 2: Add Stat Tracking (If Needed)

If your achievement needs to track user actions, add a stat to the initial state:

```javascript
const [stats, setStats] = useState({
  visitedPages: [],
  mascotClicks: 0,
  // ... existing stats
  yourNewStat: false, // or 0 for counters, or [] for arrays
});
```

### Step 3: Implement Unlock Logic

Add the unlock condition in the `updateStats` function:

```javascript
const updateStats = useCallback((key, value) => {
  if (!isLoadedRef.current) return;

  setStats((prev) => {
    const updated = { ...prev };

    // Your new stat logic
    if (key === "yourNewStat") {
      updated.yourNewStat = value;

      // Check for achievement unlock
      if (value === targetValue) {
        setTimeout(() => unlockRef.current?.("your_achievement"), 500);
      }
    }

    return updated;
  });
}, []);
```

**Common Patterns:**

**Boolean trigger (one-time action):**
```javascript
if (key === "didAction") {
  updated.didAction = true;
  setTimeout(() => unlockRef.current?.("your_achievement"), 500);
}
```

**Counter with threshold:**
```javascript
if (key === "actionCount") {
  updated.actionCount = prev.actionCount + 1;

  if (updated.actionCount >= 10) {
    setTimeout(() => unlockRef.current?.("your_achievement"), 500);
  }
}
```

**Array tracking (e.g., visited items):**
```javascript
if (key === "visitedItems" && !prev.visitedItems.includes(value)) {
  updated.visitedItems = [...prev.visitedItems, value];

  const allItems = ["item1", "item2", "item3"];
  if (allItems.every(item => updated.visitedItems.includes(item))) {
    setTimeout(() => unlockRef.current?.("your_achievement"), 500);
  }
}
```

**Multiple conditions (AND logic):**
```javascript
if (key === "viewedItemB") {
  updated.viewedItemB = true;

  // Unlock only if both conditions are met
  if (updated.viewedItemA && updated.viewedItemB) {
    setTimeout(() => unlockRef.current?.("your_achievement"), 500);
  }
}
```

### Step 4: Trigger in Components

Call `updateStats` from any component where the action occurs:

```javascript
import { useAchievements } from "../hooks/useAchievements";

function YourComponent() {
  const { updateStats } = useAchievements();

  const handleAction = () => {
    // Your action logic

    // Trigger achievement check
    updateStats("yourNewStat", true);
  };

  return <button onClick={handleAction}>Click Me</button>;
}
```

**Direct unlock (for instant unlocks without stats):**
```javascript
const { unlock } = useAchievements();

const handleKonamiCode = () => {
  unlock("konami_master");
};
```

## Cascading Achievements

Some achievements automatically unlock when certain conditions are met across all achievements:

### Collector Achievement

Unlocks when user has 5 or more achievements:

```javascript
// In the unlock function
const count = Object.keys(updated).length;
if (count >= 5 && !updated.collector) {
  setTimeout(() => unlock("collector"), 1500);
}
```

### Completionist Achievement

Unlocks when user has all achievements except completionist itself:

```javascript
const totalAchievements = Object.keys(ACHIEVEMENTS).length - 1;
if (count >= totalAchievements && !updated.completionist) {
  setTimeout(() => unlock("completionist"), 1500);
}
```

**Note:** Use `setTimeout` with delays (1500ms) to stagger multiple achievement unlocks.

## LocalStorage & Sync

### Storage Keys

- `mejedo_achievements` - Unlocked achievements data
- `mejedo_stats` - User statistics

### Cross-Tab Synchronization

The system uses two mechanisms for sync:

**1. Storage Event (Different Tabs):**
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'mejedo_achievements' && e.newValue) {
    setUnlockedAchievements(JSON.parse(e.newValue));
  }
});
```

**2. Custom Event (Same Window):**
```javascript
window.dispatchEvent(new CustomEvent('achievementsUpdated', {
  detail: { achievements: unlockedAchievements }
}));
```

### Data Format

**Unlocked Achievements:**
```javascript
{
  "achievement_id": {
    "unlockedAt": "2025-01-12T10:30:00.000Z"
  }
}
```

**Stats:**
```javascript
{
  "visitedPages": ["/about", "/projects"],
  "mascotClicks": 3,
  "rhythmHighScore": 850
}
```

## Toast Notifications

Achievements automatically show toast notifications when unlocked.

### Toast Behavior

- **Duration**: 4 seconds (configurable)
- **Position**: Top-right of screen
- **Animation**: Slide in from right, slide out to right
- **Sound**: Optional achievement unlock sound
- **Auto-dismiss**: Automatically hides after duration
- **Manual dismiss**: User can click to dismiss early

### Toast Content

- Achievement icon (if provided)
- Achievement name
- "Achievement Unlocked!" heading
- Neon green accent color (#39ff14)

## Achievement Modal

Users can view all achievements by clicking the trophy button in the header.

### Modal Features

- **Progress tracking**: Shows X/26 achievements unlocked
- **Locked achievements**: Shows "???" for name and description
- **Hidden achievements**: Only visible once unlocked
- **Unlock timestamp**: Shows when each achievement was earned
- **Scrollable**: Can handle any number of achievements

### Opening the Modal

The modal is controlled in `/app/page.jsx`:

```javascript
const [achievementsOpen, setAchievementsOpen] = useState(false);

<AchievementsModal
  open={achievementsOpen}
  onClose={() => setAchievementsOpen(false)}
/>
```

## Common Use Cases

### Tracking Page Visits

```javascript
useEffect(() => {
  if (isLoaded) {
    updateStats("visitedPages", "/your-page");
  }
}, [isLoaded, updateStats]);
```

### Tracking Button Clicks

```javascript
const handleClick = () => {
  updateStats("buttonClicked", true);
  // Your other logic
};
```

### Tracking Game Scores

```javascript
useEffect(() => {
  if (score > highScore) {
    updateStats("rhythmHighScore", score);
  }
}, [score, highScore, updateStats]);
```

### Multiple Actions for One Achievement

```javascript
// Mark action A complete
const handleActionA = () => {
  updateStats("completedActionA", true);
};

// Mark action B complete
const handleActionB = () => {
  updateStats("completedActionB", true);
};

// In updateStats:
if (key === "completedActionB") {
  updated.completedActionB = true;

  // Unlock if both actions are complete
  if (updated.completedActionA && updated.completedActionB) {
    setTimeout(() => unlockRef.current?.("both_actions_achievement"), 500);
  }
}
```

## Styling Guidelines

### Toast Styling

Toasts use the site's neon green accent:
- Border: `border-2 border-[#39ff14]`
- Background: `bg-[#121217]` (dark)
- Text: `text-white` with `text-[#39ff14]` accents
- Shadow: `shadow-lg` for depth

### Modal Styling

The modal follows the Windows 95/98 aesthetic:
- Window decoration with title bar
- Retro scrollbar
- Grid layout for achievement cards
- Hover effects on locked achievements

## Troubleshooting

### Achievement doesn't unlock

- Check that the achievement ID matches exactly in `ACHIEVEMENTS` and `unlock()` call
- Verify `isLoaded` is true before calling `updateStats`
- Check that the condition logic in `updateStats` is correct
- Look for console errors

### Stats not persisting

- Ensure `isLoaded` is true before updating stats
- Check browser's localStorage (DevTools → Application → Local Storage)
- Verify localStorage isn't disabled or full

### Toast doesn't appear

- Check that `pendingAchievement` state is being set
- Verify `AchievementToast` is rendered in the component tree
- Check z-index conflicts

### Cascading achievements don't trigger

- Verify the count logic includes/excludes the right achievements
- Check that `setTimeout` delays don't conflict
- Ensure cascading achievements aren't already unlocked

## Best Practices

1. **Use meaningful stat names**: `scoredFirstGoal` not `stat1`
2. **Add 500ms delay**: Use `setTimeout(() => unlock(...), 500)` to ensure smooth toast displays
3. **Check isLoaded**: Always check `isLoaded` before updating stats on mount
4. **Descriptive descriptions**: Make achievement descriptions fun and clear
5. **Hidden for spoilers**: Mark achievements hidden if they spoil Easter eggs
6. **Test unlock flow**: Manually test the unlock by triggering the action
7. **Clear localStorage**: Test fresh user experience by clearing localStorage

## Future Enhancements

Potential improvements to the achievement system:
- Achievement rarity tiers (common, rare, legendary)
- Achievement sharing (generate image to share)
- Achievement leaderboards
- Seasonal/time-limited achievements
- Achievement rewards (unlock special features)
- Undo achievement unlocks (for testing)
- Achievement hints for hidden ones
