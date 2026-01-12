# Mascot & Easter Egg System Documentation

The mascot system provides an interactive animated character (Futaba) with tips, achievements, and hidden Easter eggs including a full rhythm game.

## Features

- **Animated Mascot**: 2-frame sprite animation with bounce effects
- **Tip System**: 36+ randomized tips displayed in chat bubbles
- **Achievement Integration**: Tracks clicks and triggers special achievements
- **Responsive Sizing**: 6 breakpoints for different screen sizes
- **Easter Eggs**: Konami code, rhythm game, Futaba overlay, and more
- **Toggle Visibility**: Hide/show mascot with achievement reward

## Architecture

### Core Files

- `/app/components/mascot/Mascot.jsx` - Main mascot component (265 lines)
- `/app/components/easteregg/FutabaOverlay.jsx` - Fullscreen Futaba image with audio
- `/app/components/easteregg/RhythmGame.jsx` - Full FNF-style rhythm game (953 lines)
- `/app/components/easteregg/ArrowHint.jsx` - Konami code visual hint
- `/app/hooks/useKonamiCode.js` - Konami code detection hook

## Mascot System

### Animation System

The mascot uses a 2-frame sprite animation:

```javascript
const [frame, setFrame] = useState(0); // 0 or 1
const [excited, setExcited] = useState(false); // Animation speed

useEffect(() => {
  const interval = setInterval(() => {
    setFrame(prev => (prev + 1) % 2); // Toggle between 0 and 1
  }, excited ? 250 : 500); // 250ms when excited, 500ms normal

  return () => clearInterval(interval);
}, [excited]);
```

**Frame 0** triggers bounce animation:
```jsx
<img
  src={`/mascot/futaba${frame}.png`}
  className={`pixelated cursor-pointer transition-transform ${
    frame === 0 ? 'animate-bounce-once' : ''
  }`}
/>
```

**Animation States:**
- **Normal**: 500ms per frame (slower, calm)
- **Excited**: 250ms per frame (faster, energetic)

### Responsive Sizing

Mascot scales based on screen size using Tailwind breakpoints:

```javascript
const getResponsiveSize = () => {
  if (typeof window === 'undefined') return 200;

  const width = window.innerWidth;
  if (width < 640) return 120;        // xs: 120px
  if (width < 768) return 150;        // sm: 150px
  if (width < 1024) return 180;       // md: 180px
  if (width < 1280) return 200;       // lg: 200px (default)
  if (width < 1536) return 220;       // xl: 220px
  return 250;                          // 2xl: 250px
};
```

**Breakpoints:**
- xs (<640px): 120px - Mobile portrait
- sm (640-768px): 150px - Mobile landscape
- md (768-1024px): 180px - Tablet
- lg (1024-1280px): 200px - Small desktop (default)
- xl (1280-1536px): 220px - Desktop
- 2xl (>1536px): 250px - Large desktop

### Tip System

36+ tips are displayed in a randomized, non-repeating queue:

```javascript
const allTips = [
  "Hi! I'm Futaba! Click me for tips!",
  "Press ↑↑↓↓←→←→ for a surprise!",
  "Check out the achievements page!",
  // ... 33+ more tips
];

// Fisher-Yates shuffle for randomization
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
```

**Tip Display Logic:**

1. **Initial tip**: Shows immediately on page load
2. **Click tip**: Shows when user clicks mascot
3. **Auto tips**: Shows every 30-60 seconds automatically
4. **Duration**: Each tip displays for 5 seconds
5. **Queue**: When all tips are shown, queue reshuffles

```javascript
const showTip = useCallback(() => {
  // If queue is empty, reshuffle
  if (tipQueueRef.current.length === 0) {
    tipQueueRef.current = shuffleArray(allTips);
  }

  // Get next tip
  const nextTip = tipQueueRef.current.shift();
  setCurrentTip(nextTip);
  setShowTip(true);
  setExcited(true);

  // Hide after 5 seconds
  setTimeout(() => {
    setShowTip(false);
    setExcited(false);
  }, 5000);
}, []);
```

**Timing:**
- First auto tip: 10 seconds after page load
- Subsequent auto tips: Random 30-60 seconds apart

### Click Tracking

Mascot clicks trigger achievements:

```javascript
const handleClick = () => {
  updateStats("mascotClicks"); // Increment counter

  // Show tip on click
  if (!showingTip) {
    showTip();
  }
};
```

**Achievements:**
- **click_happy**: Click mascot 10 times
- **junpei_clicker**: Click on the specific character

### Achievement Display

When achievements unlock, mascot shows them:

```javascript
useEffect(() => {
  if (pendingAchievement) {
    setCurrentTip(`🏆 ${pendingAchievement.name}: ${pendingAchievement.description}`);
    setShowTip(true);
    setExcited(true);

    setTimeout(() => {
      setShowTip(false);
      setExcited(false);
      clearPendingAchievement();
    }, 5000);
  }
}, [pendingAchievement]);
```

### Toggle Visibility

Users can hide/show the mascot:

```javascript
const toggleMascot = () => {
  setMascotVisible(prev => {
    const newValue = !prev;
    // If hiding, unlock achievement
    if (!newValue) {
      unlock("futaba_funeral");
    }
    return newValue;
  });
};
```

**Achievement:** `futaba_funeral` - "You fucking killed futaba"

## Konami Code System

### Detection Hook

`/app/hooks/useKonamiCode.js` detects the famous Konami code:

```javascript
export function useKonamiCode(callback) {
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let currentIndex = 0;

    const handleKeyDown = (e) => {
      if (e.key === konamiCode[currentIndex]) {
        currentIndex++;

        if (currentIndex === konamiCode.length) {
          callback(); // Trigger Easter egg
          currentIndex = 0; // Reset
        }
      } else {
        currentIndex = 0; // Wrong key, reset
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
}
```

**Usage:**

```javascript
useKonamiCode(() => {
  setRhythmGameOpen(true);
  unlock("konami_master");
});
```

**Code Sequence:** ↑ ↑ ↓ ↓ ← → ← → B A

### Arrow Hint

Visual hint shows the Konami code sequence:

```jsx
<ArrowHint />
```

Displays animated arrows teaching users the code.

## Rhythm Game

A full FNF-style rhythm game with 4 lanes, notes, and hold mechanics.

### Game Features

- **4 Lanes**: Left, Down, Up, Right (DFJK keys)
- **Note Types**:
  - Regular notes (tap once)
  - Hold notes (tap and hold)
- **Timing Windows**:
  - Perfect: ±30ms (100 points)
  - Good: ±60ms (50 points)
  - Miss: Outside window (0 points, breaks combo)
- **Visual Feedback**: Hit flashes, judgment text
- **Combo System**: Consecutive hits multiply score
- **Song Selection**: Multiple songs with custom charts

### Game State

```javascript
const [gameState, setGameState] = useState('menu');
// States: 'menu', 'song-select', 'playing', 'paused', 'finished'

const [score, setScore] = useState(0);
const [combo, setCombo] = useState(0);
const [notes, setNotes] = useState([]); // Active notes on screen
const [currentSong, setCurrentSong] = useState(null);
```

### Note Structure

```javascript
{
  id: uniqueId,
  lane: 0, // 0=left, 1=down, 2=up, 3=right
  time: 2500, // Time in ms when note should be hit
  type: 'normal', // or 'hold'
  holdDuration: 500, // Only for hold notes
  hit: false,
  missed: false
}
```

### Gameplay Loop

1. **Song loads**: Parse chart JSON
2. **Music starts**: Audio plays, timer begins
3. **Notes spawn**: Notes appear at top of lanes
4. **Notes fall**: Move down toward hit zone (requestAnimationFrame)
5. **Player input**: Key press/release detected
6. **Hit detection**: Check timing window
7. **Scoring**: Award points, update combo
8. **Visual feedback**: Flash lane, show judgment
9. **Song ends**: Show final score, check for achievement

### Hit Detection

```javascript
const checkHit = (lane, time) => {
  // Find notes in lane that haven't been hit
  const possibleNotes = notes.filter(note =>
    note.lane === lane &&
    !note.hit &&
    !note.missed
  );

  // Find closest note to current time
  let closestNote = null;
  let smallestDiff = Infinity;

  possibleNotes.forEach(note => {
    const diff = Math.abs(note.time - time);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestNote = note;
    }
  });

  // Check timing windows
  if (closestNote) {
    if (smallestDiff <= 30) {
      // Perfect hit
      return { note: closestNote, judgment: 'perfect', points: 100 };
    } else if (smallestDiff <= 60) {
      // Good hit
      return { note: closestNote, judgment: 'good', points: 50 };
    }
  }

  // Miss
  return { note: null, judgment: 'miss', points: 0 };
};
```

### Hold Note Mechanics

Hold notes require continuous key press:

```javascript
// On key press
if (note.type === 'hold') {
  note.holding = true;
  note.holdStartTime = currentTime;
}

// While holding
if (note.holding) {
  const holdProgress = currentTime - note.holdStartTime;

  // Check if held long enough
  if (holdProgress >= note.holdDuration) {
    note.hit = true;
    // Award points
  }
}

// On key release (early release = miss)
if (note.holding && !keyPressed) {
  note.holding = false;
  note.missed = true;
}
```

### Visual Design

**Lane Colors (FNF style):**
- Left: Purple (`#C24B99`)
- Down: Cyan (`#00FFFF`)
- Up: Green (`#12FA05`)
- Right: Red (`#F9393F`)

**Note Appearance:**
- Arrow symbols: ← ↓ ↑ →
- Border matches lane color
- Hold notes have extended tail

**Hit Zone:**
- Transparent overlay at bottom of lanes
- Notes must reach this zone to be hit
- Visual flash on successful hit

### Song Chart Format

```json
{
  "name": "Song Name",
  "artist": "Artist Name",
  "audioFile": "/music/song.mp3",
  "bpm": 120,
  "notes": [
    { "time": 1000, "lane": 0, "type": "normal" },
    { "time": 1500, "lane": 1, "type": "hold", "holdDuration": 500 },
    { "time": 2000, "lane": 2, "type": "normal" }
  ]
}
```

### Achievement Integration

```javascript
// Update high score
useEffect(() => {
  if (score > highScore) {
    setHighScore(score);
    updateStats("rhythmHighScore", score);
  }
}, [score]);
```

**Achievement:** `rhythm_master` - Score over 1000 points

## Easter Eggs

### Futaba Overlay

Fullscreen image with audio that appears on special triggers:

```jsx
<FutabaOverlay
  open={open}
  onClose={() => setOpen(false)}
/>
```

**Features:**
- Fullscreen background image
- Auto-playing audio
- Click anywhere to close
- Achievement on trigger

### All-Out Attack

Hidden Easter egg that shows Futaba fan art:

**Trigger:** Clicking specific element
**Achievement:** `futaba_fan` - "Find the all out attack easter egg"

### Window Rebel

Hidden achievement for trying to close non-closable windows:

**Trigger:** Clicking X on specific windows
**Achievement:** `window_rebel` - "Try to close a window that can't be closed (idiot)"

## Adding New Tips

Edit `/app/components/mascot/Mascot.jsx` and add to the `allTips` array:

```javascript
const allTips = [
  "Hi! I'm Futaba! Click me for tips!",
  "Your new tip here!",
  "Another cool tip!",
  // ... existing tips
];
```

**Tip Guidelines:**
- Keep tips under 100 characters
- Use friendly, casual tone
- Reference site features or Easter eggs
- Use emoji sparingly (works in tips!)
- Mix helpful tips with fun facts

## Adding New Easter Eggs

### Simple Easter Egg (Direct Unlock)

```javascript
const handleSpecialClick = () => {
  unlock("your_easter_egg_achievement");
  // Show special content
  setShowEasterEgg(true);
};
```

### Complex Easter Egg (With Conditions)

```javascript
// Track multiple actions
const [action1Done, setAction1Done] = useState(false);
const [action2Done, setAction2Done] = useState(false);

useEffect(() => {
  if (action1Done && action2Done) {
    unlock("complex_easter_egg");
  }
}, [action1Done, action2Done]);
```

### Easter Egg with Animation

```javascript
const [showEgg, setShowEgg] = useState(false);

const triggerEasterEgg = () => {
  setShowEgg(true);
  unlock("animated_easter_egg");

  // Auto-hide after 5 seconds
  setTimeout(() => setShowEgg(false), 5000);
};

// In render
{showEgg && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadeIn">
    <img src="/easter-egg.png" alt="Easter Egg" className="max-w-2xl animate-bounce" />
  </div>
)}
```

## Styling Guidelines

### Mascot Styling

- **Image rendering**: Use `pixelated` class for crisp pixel art
- **Cursor**: `cursor-pointer` to indicate clickability
- **Transitions**: Smooth scale on hover
- **Position**: `fixed bottom-4 right-4` in corner

### Tip Bubble Styling

- **Background**: `bg-[#121217]` (dark)
- **Border**: `border-2 border-[#39ff14]` (neon green)
- **Text**: `text-white` with `text-[#39ff14]` accents
- **Arrow**: CSS triangle pointing to mascot
- **Animation**: Slide in from bottom

### Rhythm Game Styling

- **Lanes**: Vertical flex columns with lane colors
- **Notes**: Circular with arrow, colored borders
- **Hit zone**: Semi-transparent overlay
- **UI**: Retro style with pixelated font
- **Judgments**: Large text, colored by accuracy

## Performance Considerations

### Animation Performance

- Use `requestAnimationFrame` for smooth animations
- Limit sprite frame rate (500ms/250ms) for performance
- Clean up intervals on unmount

### Rhythm Game Performance

- Spawn notes in batches, not all at once
- Remove notes after they pass hit zone
- Throttle hit detection checks
- Pause game loop when not playing

### Tip System Performance

- Tips stored in ref (not state) for queue
- Only one tip shown at a time
- Auto-dismiss prevents memory leaks

## Troubleshooting

### Mascot doesn't animate

- Check that `/public/mascot/futaba0.png` and `futaba1.png` exist
- Verify `frame` state is toggling (0 → 1 → 0)
- Check interval is running (not cleared prematurely)

### Tips don't show

- Verify `allTips` array is not empty
- Check `showTip()` function is being called
- Look for errors in shuffle logic
- Confirm `showingTip` state is updating

### Konami code doesn't trigger

- Test key sequence (↑↑↓↓←→←→BA) carefully
- Check console for key event logs
- Verify callback is wired up correctly
- Ensure no input fields are focused (stealing keys)

### Rhythm game lag

- Reduce number of simultaneous notes
- Increase spawn interval
- Check audio file size (large files cause lag)
- Profile with React DevTools

### Hold notes not working

- Verify `keydown` and `keyup` events fire
- Check `holding` state is tracked correctly
- Ensure `holdDuration` is reasonable (500-1000ms)
- Test on different browsers (event behavior varies)

## Best Practices

1. **Mascot positioning**: Keep in corner, don't block content
2. **Tip frequency**: Not too often (30-60s is good balance)
3. **Easter egg hints**: Give subtle clues, not obvious
4. **Animation smoothness**: Use `requestAnimationFrame` for 60fps
5. **Achievement integration**: Always unlock achievements for Easter eggs
6. **Audio autoplay**: Handle browser autoplay policies
7. **Mobile support**: Scale mascot, adapt rhythm game for touch
8. **Accessibility**: Provide keyboard controls for all interactions

## Future Enhancements

Potential improvements to the mascot and Easter egg systems:
- More mascot animations (idle, celebrate, sad)
- Mascot costume/skin unlocks
- More rhythm game songs and difficulties
- Multiplayer rhythm game mode
- Custom tip submission from users
- Mascot voice lines (text-to-speech)
- More Easter egg types (puzzles, mini-games)
- Achievement hints in tips
- Mascot personality (different moods)
