# Quick Start Guide

## Installation (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

This installs:

- `pixi.js` - Rendering engine
- `vite` - Development server

### Step 2: Start Development Server

```bash
npm run dev
```

Output:

```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   https://localhost:5173/
  ➜  press h to show help
```

### Step 3: Open in Browser

Navigate to: **https://localhost:5173**

You should see:

- Large dark canvas on the left
- Control panel on the right
- Status indicators for microphone
- Asset loading section

## First Time Setup (2 minutes)

### 1. Test the Animation System

1. Select **Test Mode** → "Animation Test"
2. You'll see manual animation controls appear
3. Click buttons or press keyboard:
   - Press `A` → mouth animates to "A" position
   - Press `Space` → eye blinks
   - Click "Mouth - O" button → mouth shows "O"

**✅ If animation works, PixiJS is initialized correctly**

### 2. Test Microphone Permission

1. Click **Enable Microphone**
2. Browser will prompt for permission
3. Click "Allow"
4. Green indicator should appear

**✅ If microphone works, WebAudio is initialized correctly**

### 3. Test Lip Sync

1. Select **Test Mode** → "Audio/Lip Sync Test"
2. Click **Enable Microphone** (if not already enabled)
3. Click "Enable Microphone" button
4. Speak into your microphone
5. Watch the diagnostic panel

You should see:

```
PHONEME DETECTION
Current: A
History: rest → M → A → E

AUDIO INPUT
Level: 45%
```

**✅ If phonemes update, lip sync is working**

## Loading Your Own Sprites (10 minutes)

### Creating Sprite Files

You need PNG images for each mouth and eye position.

**Recommended Dimensions:**

- Mouth sprites: 200×150 pixels
- Eye sprites: 100×60 pixels
- Body sprite: 400×600 pixels

**File Format:**

- PNG with transparent background
- Recommended: Draw on 32-bit RGBA canvas
- Examples:
  - `mouth_a.png` - Character with mouth open wide (A position)
  - `mouth_m.png` - Character with lips closed (M position)
  - `eye_open.png` - Character with eyes open
  - `eye_closed.png` - Character with eyes closed

### Loading Assets into App

1. Click **Load PNG Assets**
2. Select **Asset Type** from dropdown (e.g., "Mouth - A")
3. Click "Load PNG Assets" and select your file
4. Repeat for each sprite type

**Status shows:** "Assets loaded: 5"

### Testing Your Sprites

1. Switch to **Animation Test Mode**
2. Click mouth/eye control buttons
3. Your sprites should display
4. Adjust positioning in your image editor if needed

## Live Streaming with OBS (5 minutes)

### OBS Browser Source Setup

1. In OBS:
   - **Sources** → **Add Source** → **Browser**
   - **URL:** `https://localhost:5173`
   - **Width:** 1280
   - **Height:** 720

2. The canvas should appear in your OBS preview

### Audio Configuration

The character responds to microphone input, but OBS captures audio separately:

1. In OBS:
   - **Audio Input Capture** → Select your microphone
   - Place below the browser source in Source Order

2. Start streaming

**Result:** Character animates with your voice while OBS captures audio.

## Troubleshooting

### "Connection refused" error

**Problem:** `https://localhost:5173` not reachable

**Solutions:**

1. Ensure Vite server is running: `npm run dev`
2. Check terminal for error messages
3. Try different port: `npm run dev -- --port 3000`

### Microphone not working

**Problem:** "Permission Denied" or no audio input

**Solutions:**

1. Check browser microphone permissions
2. Ensure microphone is connected and works in other apps
3. Try different browser (Chrome, Firefox, Edge)
4. Check OS-level audio settings

### Sprites not appearing

**Problem:** Placeholder rectangles instead of your images

**Solutions:**

1. Verify PNG file format (must be PNG, not JPG)
2. Check file exists in browser DevTools Console
3. Ensure file path is correct
4. Try smaller file size first

### Performance issues (stuttering)

**Problem:** Animation isn't smooth at 60 FPS

**Solutions:**

1. Close other browser tabs
2. Check Task Manager → GPU usage
3. Disable browser extensions
4. Use Chrome instead of other browsers

## Next Steps

### For Better Lip Sync

Download official Rhubarb WASM from:
https://github.com/DanielSWolf/rhubarb-lip-sync

Then place `rhubarb.wasm` in `public/wasm/` directory.

### For Production Streaming

Build for deployment:

```bash
npm run build
```

Output in `dist/` folder - ready to host on any HTTPS server.

### Adding More Animations

Current supported mouth states:

- Vowels: A, E, O, U
- Consonants: M (closed), F (teeth visible)
- Silence: Idle, Closed

You can add more by:

1. Creating corresponding PNG files
2. Editing phoneme mapping in `src/lipsync.js`
3. Loading them in the app

## Example Workflow

```
1. Create your character artwork
   ↓
2. Export 10 PNG files (mouth + eye states)
   ↓
3. Start `npm run dev`
   ↓
4. Load each PNG via UI
   ↓
5. Test in Animation mode
   ↓
6. Enable Microphone + test Audio mode
   ↓
7. Add to OBS as Browser Source
   ↓
8. Stream with your voice!
```

## Common Questions

**Q: Can I use the same PNG for multiple mouth states?**
A: Yes, but it won't animate properly. Each state should be a separate sprite.

**Q: How do I change animation speed?**
A: Edit `blinkDuration` and `nextBlinkTime` in `src/animation.js`

**Q: Can I add custom mouth positions?**
A: Yes! Edit the phoneme mapping in `src/lipsync.js` and add PNG files.

**Q: What if I don't have all sprite files?**
A: App uses placeholders - animation will work but look basic until you load real sprites.

**Q: Can I use this offline?**
A: Microphone requires HTTPS, so not truly offline. Local dev works with https://localhost.

**Q: How do I export my avatar?**
A: The app doesn't export - it's a viewer/animator. Export your sprites separately.

---

**Ready to animate!** 🎬✨

For detailed info, see [README.md](README.md)
