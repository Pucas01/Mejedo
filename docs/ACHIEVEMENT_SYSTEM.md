# Achievement System

Gamification system with unlockable achievements that track user actions across the website.

## Core Files

- [app/hooks/useAchievements.js](../app/hooks/useAchievements.js) - Context provider (455 lines)
- [app/components/achievements/AchievementToast.jsx](../app/components/achievements/AchievementToast.jsx) - Toast notifications
- [app/components/achievements/AchievementsModal.jsx](../app/components/achievements/AchievementsModal.jsx) - Achievement viewer

## Usage

```javascript
import { useAchievements } from "../hooks/useAchievements";

const { updateStats, unlock, achievements, unlockedAchievements } = useAchievements();

// Track a stat
updateStats("visitedPages", "/about");

// Direct unlock
unlock("konami_master");
```

## Current Achievements (25 total)

### Visible
- **first_visit** - Visit the website
- **explorer** - Visit all 9 pages
- **rhythm_master** - Score 10000+ points in rhythm game
- **guestbook_signer** - Leave a guestbook message
- **blog_reader** - Read a blog post
- **collection_viewer** - View a console and manga
- **changelog_reader** - Read the changelog
- **junpei_clicker** - Click on Miku
- **stalker** - Click a social link
- **button_copier** - Copy the website button
- **guestbook_visitor** - Visit someone's website from guestbook
- **widget_opener** - Open a widget
- **music_listener** - Play a song
- **teto_watcher** - Watch Teto Mix video
- **pong_scorer** - Score in Pong
- **performance_watcher** - Watch an Ado performance
- **timeline_scroller** - Scroll Ado timeline

### Hidden
- **konami_master** - Enter Konami code (↑↑↓↓←→←→)
- **futaba_funeral** - Hide the mascot
- **futaba_fan** - Find all-out attack easter egg
- **click_happy** - Click Futaba 10 times
- **not_him** - Try to log in to admin
- **window_rebel** - Try to close non-closable window
- **collector** - Unlock 5 achievements
- **completionist** - Unlock all achievements

## Adding an Achievement

### 1. Define in ACHIEVEMENTS object

Edit [app/hooks/useAchievements.js:7-134](../app/hooks/useAchievements.js#L7-L134):

```javascript
your_id: {
  id: "your_id",
  name: "Achievement Name",
  description: "What the user did",
  icon: "🎯",
  hidden: false,
},
```

### 2. Add stat tracking (if needed)

Add stat to initial state at [line 193](../app/hooks/useAchievements.js#L193):

```javascript
yourStat: false,
```

### 3. Add unlock logic

Add condition in `updateStats` function:

```javascript
if (key === "yourStat") {
  updated.yourStat = value;
  if (condition_met) {
    setTimeout(() => unlockRef.current?.("your_id"), 500);
  }
}
```

### 4. Trigger from component

```javascript
updateStats("yourStat", true);
```

## Common Patterns

**Boolean trigger:**
```javascript
if (key === "didAction") {
  updated.didAction = true;
  setTimeout(() => unlockRef.current?.("achievement_id"), 500);
}
```

**Counter:**
```javascript
if (key === "actionCount") {
  updated.actionCount = prev.actionCount + 1;
  if (updated.actionCount >= 10) {
    setTimeout(() => unlockRef.current?.("achievement_id"), 500);
  }
}
```

**Array tracking:**
```javascript
if (key === "visitedItems" && !prev.visitedItems.includes(value)) {
  updated.visitedItems = [...prev.visitedItems, value];
  if (allItems.every(item => updated.visitedItems.includes(item))) {
    setTimeout(() => unlockRef.current?.("achievement_id"), 500);
  }
}
```

## Storage

- **localStorage key**: `mejedo_achievements` (unlocked achievements)
- **localStorage key**: `mejedo_stats` (user stats)
- **Cross-tab sync**: Storage event + custom events

## Modal

Open with `show` prop:

```javascript
<AchievementsModal
  show={achievementsOpen}
  onClose={() => setAchievementsOpen(false)}
/>
```

Shows X/25 achievements unlocked, with locked achievements as "???".
