# 🎨 Arc Agent Hub — Cover Image Design Spec

**Format:** PNG (1920×1080 pixels, 72 DPI)  
**Purpose:** Hackathon submission hero image  
**File:** `assets/hackathon-cover.png`

---

## 🎯 Design Concept

**Theme:** 3 autonomous agents coordinating via USDC payments on Arc blockchain  
**Mood:** Modern, tech-forward, trustworthy, futuristic  
**Color Palette:**
- **Arc Blue:** #0052CC (primary)
- **USDC Yellow:** #FFC107 (accent - USDC coins)
- **White:** #FFFFFF (background, text)
- **Dark Gray:** #1A1A1A (typography, depth)
- **Green:** #10B981 (success, settlement confirmation)

---

## 📐 Layout Structure

### Canvas: 1920×1080 pixels
```
[BACKGROUND: Gradient - top-left Arc blue, bottom-right white]
        ↓
[3 AGENT HEXAGONS arranged horizontally with spacing]
        ↓
[USDC COINS flowing between agents (animated path suggestion)]
        ↓
[TITLE TEXT + SUBTITLE]
        ↓
[ARC LOGO + CIRCLE LOGO in bottom corner]
```

---

## 🔷 Agent Hexagons (Left, Center, Right)

### Structure for Each:
- **Shape:** Hexagon (slightly rotated 30°)
- **Size:** 320×320 pixels each
- **Background:** Gradient from Arc blue (#0052CC) to lighter blue (#4A90E2)
- **Border:** White stroke, 3px
- **Inner Icon:** Centered, 150×150 pixels

### Three Agent Types:

#### **LEFT: Worker Agent** 🤖
- Icon: Gear/processor symbol
- Label below: "Worker"
- Sublabel: "Execute"
- Color accent: Cyan (#06B6D4)

#### **CENTER: Orchestrator Agent** 🧠
- Icon: Brain/hub symbol (network node)
- Label below: "Orchestrator"
- Sublabel: "Route & Settle"
- Color accent: Arc Blue (#0052CC)
- Slightly larger (350×350) to emphasize importance

#### **RIGHT: Validator Agent** ✓
- Icon: Checkmark/shield symbol
- Label below: "Validator"
- Sublabel: "Verify Quality"
- Color accent: Green (#10B981)

---

## 💰 USDC Coin Animations (Static Representation)

**Visual:** 5-7 USDC coins flowing between agents showing payment direction

### Flow Paths:
1. **Worker → Orchestrator:** 0.0002 USDC (subtle arrow)
2. **Validator → Orchestrator:** 0.0001 USDC (subtle arrow)
3. **Orchestrator → Worker/Validator:** Return signals (dashed lines with checkmarks)

### Coin Design:
- **Shape:** Circle, 40×40 pixels each
- **Fill:** USDC Yellow (#FFC107)
- **Icon:** Dollar sign ($) in white, centered
- **Border:** Dark gray outline, 2px
- **Shadow:** Subtle drop shadow for depth

### Arrow Design:
- **Style:** Gradient arrows (USDC Yellow → Arc Blue)
- **Width:** 4px
- **Animation path:** Smooth curves following hexagon connections

---

## 📝 Typography

### Title: "Arc Agent Hub"
- **Font:** Bold, Modern sans-serif (e.g., Inter Bold, Helvetica Neue Bold)
- **Size:** 72px
- **Color:** Dark gray (#1A1A1A)
- **Position:** Center, above hexagons (20px margin from top of agents)
- **Letter spacing:** +2px (wide, professional)

### Subtitle: "The Execution Layer for the Agent Economy"
- **Font:** Medium sans-serif (e.g., Inter Medium)
- **Size:** 28px
- **Color:** Arc Blue (#0052CC)
- **Position:** Center, below title (15px gap)
- **Width:** 70% of canvas, centered

### Agent Labels (Worker / Orchestrator / Validator)
- **Font:** Bold sans-serif, 18px
- **Color:** White
- **Position:** Below each hexagon (8px margin)

### Small Callout (Optional, Bottom-Left):
- **Text:** "$0.0005 per task • Sub-second settlement • Free gas"
- **Font:** Regular sans-serif, 16px
- **Color:** Dark gray (#1A1A1A)
- **Style:** Light background box (rgba(0,0,0,0.05)), 12px padding, rounded corners

---

## 🏷️ Logos (Bottom-Right Corner)

### Arc Logo
- **Size:** 80×80 pixels
- **Position:** Bottom-right, 20px from edges
- **Background:** White with slight opacity (0.95)
- **Border:** Arc Blue outline, 2px

### Circle Logo  
- **Size:** 60×60 pixels
- **Position:** To the left of Arc logo, overlapping 10px
- **Background:** White, slightly transparent

---

## 🎨 Design Recommendations

### Software to Use:
- **Figma** (recommended - collaborative, easy to iterate)
- **Adobe XD** (alternative - component-based)
- **Affinity Designer** (alternative - professional, pixel-perfect)
- **Canva Pro** (quick option - templates available)

### Visual Effects:
- **Gradients:** Smooth linear gradients between hexagons
- **Shadows:** Subtle drop shadows (0 4px 12px rgba(0,0,0,0.1))
- **Blur:** Optional light background blur on bottom text box
- **Glow:** Subtle glow around center (Orchestrator) hexagon (#0052CC, 15px blur)

### Final Export:
- Format: **PNG**
- Resolution: **1920×1080**
- Color Mode: **RGB**
- Compression: **Optimized (8-bit)**
- DPI: **72 DPI** (web standard)

---

## ✅ Checklist Before Export

- [ ] All three hexagons clearly visible and distinctive
- [ ] USDC coins show payment flow direction
- [ ] Title and subtitle readable and well-positioned
- [ ] Agent labels match colors (Cyan, Blue, Green)
- [ ] Logos in bottom-right corner, not overlapping main content
- [ ] No text extends beyond 1900px width or 1050px height
- [ ] Colors match brand guidelines
- [ ] Background gradient smooth and professional
- [ ] Export as PNG with transparency where needed

---

## 🚀 Usage

Save as: `/Users/berthod/Desktop/arc-USDC1/assets/hackathon-cover.png`

Then upload to lablab.ai submission form under "Cover Image" field.

---

**Created:** April 20, 2026  
**Status:** Design specification ready for implementation
