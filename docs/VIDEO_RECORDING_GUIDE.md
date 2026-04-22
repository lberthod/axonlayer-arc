# 🎬 Arc Agent Hub — Video Recording Guide

**Format:** MP4, 1080p (1920×1080), 30 FPS  
**Duration:** 2-3 minutes  
**Audio:** Clear narration + background music (optional)  
**File:** `arc-agent-hub-demo.mp4`

---

## 📹 Recording Setup

### Hardware
- **Computer:** Mac/Windows with screen recording capability
- **Microphone:** Built-in or external (USB recommended)
- **Screen Resolution:** 1920×1080 native (set before recording)
- **Internet:** Stable connection (for localhost access)

### Software Options
- **Mac:** QuickTime Player (built-in) or ScreenFlow
- **Windows:** OBS Studio (free), Camtasia, or ScreenFlow alternative
- **Cross-platform:** OBS Studio (free, professional)

### Browser Setup
- **Browser:** Chrome or Edge (modern, clean UI)
- **Terminal:** 2-3 terminal windows (Backend, Frontend, Arc Explorer)
- **Font Size:** Increase to 125-150% for readability
- **Extensions:** Disable distracting extensions
- **Tab:** Open localhost:3000 frontend and Arc testnet explorer

---

## 🎯 Recording Checklist

### Before Recording
- [ ] Backend running: `npm run dev` (port 3001) ✅
- [ ] Frontend running: `npm run dev` (port 3000) ✅
- [ ] Test task submission in frontend (make sure it works)
- [ ] Have Arc testnet explorer ready in separate window/tab
- [ ] Narration script printed or on second monitor
- [ ] Screen brightness/contrast optimized for video
- [ ] Close Slack, email, and other notifications
- [ ] Set volume to comfortable level (test recording quality)

### Recording Workspace
```
[Main Monitor: Broadcast Window]
├─ Browser window 1: http://localhost:3000 (frontend)
├─ Browser window 2: Arc Testnet Explorer (side-by-side or tab)
└─ Text editor: Narration script (reference only)

[Second Monitor (if available)]
└─ Terminal windows showing logs (for credibility)
```

---

## **🎬 SHOT LIST: Scene-by-Scene Breakdown**

### **SCENE 1: PROBLEM (0:00-0:30) — 30 seconds**

#### Setup
```
Title Slide: "The Problem"
Background: Arc Agent Hub cover image (static slide)
Narration: Read from script
```

#### Narration Script
```
"Why can't agents execute work at scale?

Traditional blockchains make it impossible:
- OpenAI costs $0.005 per task
- Ethereum gas = $50-200 per transaction
- That means agents lose all margin to fees

This is the core problem we solve.
```

#### Visual Actions
1. Display static slide with "The Problem" title
2. Show comparison chart (OpenAI $0.005 vs Ethereum $50+)
3. Fade to black, transition to next scene

#### Duration: 30 sec
**Quality Check:** Voiceover clear, text readable, no background noise

---

### **SCENE 2: SOLUTION (0:30-1:15) — 45 seconds**

#### Setup
```
Live demo: Arc Agent Hub frontend (localhost:3000)
Browser window showing MissionControl dashboard
Terminal showing backend logs
```

#### Narration Script
```
"Arc Agent Hub solves this. Here's how it works:

First, a user submits a task. Let's summarize Arc Agent Hub."

[Click the task submission form]

"Three agents immediately compete on price and quality:
- Worker Agent: 'I can do this for 0.0002 USDC'
- Validator Agent: 'I'll verify for 0.0001 USDC'  
- Orchestrator: 'I'll coordinate for 0.0002 USDC'

The best one wins. Execution happens in less than 100 milliseconds.

[Show execution happening]

Total cost to the user? Just 0.0005 USDC.

That's 100 times cheaper than ChatGPT."
```

#### Visual Actions
1. **[0:30-0:35]** Close "Problem" slide, open browser showing frontend
2. **[0:35-0:45]** Show the task submission form in Arc Agent Hub
3. **[0:45-0:50]** Fill in input: "Summarize Arc Agent Hub"
4. **[0:50-0:55]** Click "Submit Task" button
5. **[0:55-1:10]** Show task execution timeline/results appearing
6. **[1:10-1:15]** Highlight the pricing breakdown displayed

#### Terminal Logs
- Show backend logs reflecting task execution
- Display timestamps showing sub-second execution
- Highlight "SETTLEMENT COMPLETE" message

#### Duration: 45 sec
**Quality Check:** Click timing, text entry clearly visible, results display obvious

---

### **SCENE 3: PROOF ON-CHAIN (1:15-2:00) — 45 seconds**

#### Setup
```
Split screen or tab-switch:
- Left: Arc Agent Hub results dashboard
- Right: Arc Testnet Block Explorer
```

#### Narration Script
```
"But here's what makes this different from ChatGPT:
Everything is on-chain. Transparent. Verifiable.

Let me show you the transactions on Arc.

[Navigate to Arc block explorer]

Here are the three transactions:
- TX1: Client pays Worker 0.0002 USDC ✓
- TX2: Client pays Validator 0.0001 USDC ✓  
- TX3: Client pays Orchestrator 0.0002 USDC ✓

All confirmed. All on-chain.
All happened in less than 1 second.

Compare this to ChatGPT:
- ChatGPT: Black box. No audit trail. No transparency.
- Arc Agent Hub: Fully transparent. Blockchain proof. Immutable."
```

#### Visual Actions
1. **[1:15-1:25]** Show task results screen with txids visible
2. **[1:25-1:30]** Click Arc Block Explorer link or navigate to explorer
3. **[1:30-1:45]** Search for first transaction, show details
4. **[1:45-1:55]** Show second and third transactions
5. **[1:55-2:00]** Highlight transaction amounts and timestamps
6. **[2:00]** Close explorer, fade back to Arc Agent Hub results

#### Block Explorer Display
- Show transaction details clearly
- Highlight: TX hash, From/To addresses, Amount (0.0002 USDC), Status (Confirmed)
- Zoom in if text is small (readability important)

#### Duration: 45 sec
**Quality Check:** Explorer loads quickly, txs clearly visible, amounts readable, timestamps clear

---

### **SCENE 4: WHY ARC (2:00-2:30) — 30 seconds**

#### Setup
```
Comparison slide (PowerPoint or custom graphic):
"Why Arc? Gas Cost Comparison"
```

#### Narration Script
```
"Why is this possible on Arc?

Because Arc was purpose-built for payments:

- Ethereum: $50-200 per transaction. Impossible.
- Polygon: $0.001-0.01 per transaction. Still too high.
- Arc: $0.00 gas. Free.

USDC is Arc's native gas token.
That means zero overhead. No wrappers, no approvals.

Sub-second finality. Direct nano-payments.

This is the infrastructure for the agent economy.

And Arc Agent Hub is the first application proving it works."
```

#### Visual Actions
1. **[2:00-2:10]** Show comparison chart (gas costs by chain)
2. **[2:10-2:20]** Highlight Arc's $0.00 gas advantage
3. **[2:20-2:25]** Show Arc logo and branding
4. **[2:25-2:30]** Final shot: Arc Agent Hub logo + title

#### Comparison Chart
```
Ethereum    $50-200/tx    ❌ Impossible
Polygon     $0.001-0.01   ⚠️  Marginal
Base        $0.0001-0.001 ⚠️  Tight
Arc         $0.00         ✅ VIABLE
```

#### Duration: 30 sec
**Quality Check:** Chart clearly visible, text readable, logos professional

---

## 🎙️ Audio & Narration

### Voice Quality
- **Tone:** Professional, enthusiastic, clear
- **Pace:** Moderate (not too fast, allows time to process)
- **Clarity:** Pronounce "USDC" as "U-S-D-C", "Orchestrator" as "or-KES-tray-tor"
- **Pauses:** Pause 1-2 seconds after key points (e.g., "$0.0005", "100× cheaper")

### Recording Narration
- **Option 1:** Record voiceover simultaneously with screen recording
- **Option 2:** Record screen first, then record voiceover separately and sync in post-production
- **Recommended:** Option 1 (easier to sync with visuals)

### Background Music (Optional)
- **If included:** Royalty-free instrumental (YouTube Audio Library, Epidemic Sound)
- **Volume:** Subtle (25-35% mix with voiceover)
- **Genres:** Tech, electronic, uplifting

### Audio Levels
- **Voiceover:** -12dB to -6dB (peak)
- **Background:** -20dB to -15dB
- **Total mix:** Normalize to -3dB (leave headroom)

---

## 📹 Recording Parameters

### Codec Settings
- **Container:** MP4 (H.264)
- **Resolution:** 1920×1080
- **Frame Rate:** 30 FPS
- **Bitrate:** 5-8 Mbps (video), 128 kbps (audio)
- **Color Space:** RGB (for web)

### OBS Studio Settings (if using)
```
Video:
  Base Resolution: 1920×1080
  Output Resolution: 1920×1080
  FPS: 30

Audio:
  Sample Rate: 44.1 kHz or 48 kHz
  Channels: Stereo (2)
  Bitrate: 128 kbps

Output:
  Format: MP4
  Encoder: x264 (or NVIDIA NVENC if available)
  Preset: Medium (quality vs file size balance)
```

---

## ✂️ Post-Production (If Needed)

### Editing Software
- **Mac:** Final Cut Pro, DaVinci Resolve (free)
- **Windows:** Adobe Premiere Pro, DaVinci Resolve (free)
- **Online:** CapCut (web version, free)

### Editing Tasks
1. **Trim:** Remove dead air, failed clicks, long pauses
2. **Cuts:** Jump from scene to scene (0:30, 1:15, 2:00 marks)
3. **Titles:** Add text overlays (problem, solution, proof, why Arc)
4. **Color:** Slight saturation boost (make frontend colors pop)
5. **Audio:** Normalize levels, remove background hum/noise

### Title Overlays (Recommended)
```
0:00-0:30: "THE PROBLEM"
0:30-1:15: "THE SOLUTION: Arc Agent Hub"
1:15-2:00: "PROOF ON-CHAIN"
2:00-2:30: "WHY ARC?"
```

---

## 🎬 Recording Session Plan

### Timeline
```
10:00 AM - Setup (servers, browser, terminal)
10:05 AM - Test recording (voice, cursor, clicks)
10:10 AM - SCENE 1 recording (problem slide)
10:12 AM - SCENE 2 recording (demo interaction)
10:18 AM - SCENE 3 recording (block explorer)
10:24 AM - SCENE 4 recording (comparison + closing)
10:27 AM - Review and check quality
10:30 AM - Export and save to file

Total time: ~30 minutes
```

### Quick Testing
Before final recording:
1. Submit one task in the frontend (make sure it completes)
2. Check that transaction appears in Arc explorer
3. Record 30 seconds, review for audio/video quality
4. Adjust lighting, volume, or positioning if needed

---

## 📊 Quality Checklist

### Video Quality
- [ ] 1920×1080 resolution throughout
- [ ] No black bars or letterboxing
- [ ] Smooth panning/scrolling (no jitter)
- [ ] No dropped frames or stuttering
- [ ] Text readable at normal viewing (not too small)
- [ ] Colors vibrant and professional

### Audio Quality
- [ ] Voiceover clear and audible
- [ ] No background hum or noise
- [ ] No harsh s-sounds or plosives
- [ ] Levels consistent throughout
- [ ] No clipping or distortion
- [ ] Narration synchronized with visuals

### Content Quality
- [ ] All 4 scenes present (Problem → Solution → Proof → Why Arc)
- [ ] Timestamps accurate (2:30 total)
- [ ] Demo flows smoothly (no errors visible)
- [ ] Block explorer transactions clearly visible
- [ ] Key points (0.0005, 100×, <1 second) highlighted
- [ ] Closing message clear

---

## 📤 Exporting & Uploading

### Export Settings
```
Format:     MP4
Codec:      H.264
Resolution: 1920×1080
FPS:        30
Bitrate:    5-8 Mbps
Audio:      AAC, 128 kbps, Stereo
```

### File Info
- **Filename:** `arc-agent-hub-demo.mp4`
- **Size:** ~100-150 MB (typical for 2:30 video)
- **Location:** `/Users/berthod/Desktop/arc-USDC1/arc-agent-hub-demo.mp4`

### Upload to lablab.ai
1. Go to hackathon submission form
2. Find "Video Presentation" or "Demo Video" field
3. Upload `arc-agent-hub-demo.mp4`
4. Verify upload completed (shows file size/duration)
5. Confirm upload before submitting form

---

## 🚀 Pro Tips

1. **Re-record if needed:** Don't accept "good enough" — this is judges' first impression
2. **Multiple takes:** Record Scene 2 (demo) 2-3 times, pick best
3. **Fast internet:** If Arc explorer is slow, pre-record explorer transactions separately and splice in
4. **Backup:** Save raw footage before editing (in case you need to re-export)
5. **Test playback:** Play final MP4 on different devices (laptop, phone) to verify quality
6. **Captions (optional):** Add SRT captions for accessibility — judges may watch muted

---

## ⏱️ Time Breakdown Reference

```
SCENE 1: "The Problem"
  0:00-0:05   Title slide + intro
  0:05-0:20   Problem explanation + graphics
  0:20-0:30   Transition to solution

SCENE 2: "The Solution"
  0:30-0:35   Brief intro ("Here's how it works")
  0:35-0:45   Task submission form (with click)
  0:45-0:50   Form filled, button clicked
  0:50-1:10   Results displayed, explanation
  1:10-1:15   Pricing breakdown highlighted

SCENE 3: "Proof On-Chain"
  1:15-1:20   Transition to block explorer
  1:20-1:30   TX1 shown and explained
  1:30-1:40   TX2 and TX3 shown
  1:40-1:55   Comparison (Arc vs ChatGPT)
  1:55-2:00   Conclusion

SCENE 4: "Why Arc?"
  2:00-2:15   Comparison chart (gas costs)
  2:15-2:25   Arc advantages explained
  2:25-2:30   Final shot + closing message

TOTAL: 2:30
```

---

## ✅ Final Checklist

- [ ] Backend and frontend are running
- [ ] Arc testnet explorer accessible
- [ ] Narration script finalized
- [ ] Recording software configured
- [ ] Audio levels tested
- [ ] Screen resolution set to 1920×1080
- [ ] Recording session scheduled (quiet room, no interruptions)
- [ ] All four scenes ready to record
- [ ] Post-production plan prepared
- [ ] Export settings configured
- [ ] Upload location ready

---

**Status:** Ready to record  
**Deadline:** Before April 26, 2026 @ 7:00 AM Indochina Time  
**Next Step:** Press record! 🎥

Good luck! 🚀
