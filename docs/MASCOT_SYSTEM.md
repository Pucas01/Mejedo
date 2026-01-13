# Mascot & Easter Egg System

Interactive animated mascot (Futaba) with tips, achievements, and hidden Easter eggs.

## Core Files

- [app/components/mascot/Mascot.jsx](../app/components/mascot/Mascot.jsx) - Main mascot (265 lines)
- [app/components/easteregg/futaba.jsx](../app/components/easteregg/futaba.jsx) - Fullscreen Futaba overlay
- [app/components/widgets/widgets/RhythmGameWidget.jsx](../app/components/widgets/widgets/RhythmGameWidget.jsx) - FNF-style rhythm game (955 lines)
- [app/hooks/useKonamiCode.js](../app/hooks/useKonamiCode.js) - Konami code detection

## Mascot Animation

Uses 2-frame sprite animation:
- Frame files: `frame1.png`, `frame2.png`, `frame1_happy.png`, `frame2_happy.png`
- Normal speed: 500ms per frame
- Excited speed: 250ms per frame (when showing tips)

## Responsive Sizing

Breakpoints:
- xs (<768px): 56px
- sm (768-1024px): 72px
- md (1024-1280px): 88px
- lg (1280-1536px): 100px
- xl (1536-1920px): 116px
- 2xl (≥1920px): 132px

## Tip System

29 randomized tips displayed in speech bubbles:
- First tip: 10 seconds after load
- Auto tips: Every 30-60 seconds
- Duration: 5 seconds each
- Click mascot to show tip immediately

## Click Tracking

```javascript
const { updateStats } = useAchievements();
updateStats("mascotClicks"); // Increments counter
```

Achievements:
- **click_happy**: Click 10 times
- **futaba_funeral**: Hide mascot

## Konami Code

Sequence: ↑ ↑ ↓ ↓ ← → ← → (arrow keys only, no B/A)

```javascript
import { useKonamiCode } from "../hooks/useKonamiCode";

useKonamiCode(() => {
  // Your easter egg code
  unlock("konami_master");
});
```

## Rhythm Game

FNF-style rhythm game with 4 lanes (DFJK keys).

**Timing windows:**
- Perfect: ±30ms (100 points)
- Good: ±60ms (50 points)
- Miss: Outside window (breaks combo)

**Songs:** lit-up, dadbattle, ugh-erect, 2hot

**Achievement:** rhythm_master (10000+ points)

## Easter Eggs

1. **Konami Code** → Opens rhythm game
2. **Futaba Overlay** → Fullscreen image with audio
3. **All-Out Attack** → Hidden trigger for `futaba_fan` achievement
4. **Window Rebel** → Try closing non-closable windows
