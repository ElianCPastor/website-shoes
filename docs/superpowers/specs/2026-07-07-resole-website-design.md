# RESOLE — Cinematic Scroll Website (Design Spec)

**Date:** 2026-07-07
**Status:** Approved (user granted full creative freedom; direction presented in-session)

## Purpose

A single-page cinematic marketing site for **RESOLE**, a fictional shoe company whose
promise is "we repair anything." Goal: demonstrate maximum front-end capability —
GSAP ScrollTrigger choreography, Lenis smooth scroll, and an automated
frame-extraction pipeline feeding a scroll-scrubbed canvas image sequence.

Note: Higgsfield MCP was requested but is not connected in this environment.
Substitute: a fully local procedural pipeline (SVG → raster → ffmpeg video →
ffmpeg frame extraction), which delivers the same scroll-scrubbed cinematic result
with zero external services.

## Brand

- **Name:** RESOLE (pun on re-sole)
- **Voice:** confident atelier / workshop. "Dead shoes walk again."
- **Palette (from the cobbler's bench):** stained-bench coal `#14100c`, waxed-thread
  bone `#ece3d1`, polish-tin ember `#c9472b`, gum-sole amber `#d29a55`.
  (Deliberately NOT black + acid green — grounded in workshop materials.)
- **Type:** Big Shoulders (condensed industrial display), Archivo (body),
  IBM Plex Mono (repair-ticket labels). Google Fonts at runtime; system fallbacks.
- **Signature:** the page reads as a repair ticket — sections are work-order stages
  (INTAKE → DIAGNOSIS → REBUILD → REBIRTH), mono stamped labels, stitch-line
  dividers that sew on scroll, one rubber-stamp slam ("GUARANTEED FOR LIFE").

## Architecture

```
website-test-fable/
├── index.html              # all section markup
├── src/
│   ├── main.js             # boot: Lenis + GSAP wiring, scene registry
│   ├── styles.css          # design system + sections
│   └── scenes/             # one module per scroll scene (small files)
│       ├── hero-sequence.js    # canvas frame scrubber (pinned)
│       ├── manifesto.js        # word-by-word reveal
│       ├── services.js         # pinned horizontal gallery
│       ├── process.js          # timeline + stitch line draw
│       ├── stats.js            # counters + marquee
│       └── cta.js              # magnetic button, footer
├── tools/
│   └── generate-frames.mjs # procedural SVG shoe animation → sharp PNG →
│                           # ffmpeg mp4 → ffmpeg extracts webp frames
├── public/
│   ├── frames/frame_0001..N.webp   # generated, scrubbed by hero
│   └── media/resole-sequence.mp4   # generated preview video
└── package.json            # vite, gsap, lenis; sharp as devDependency
```

## Frame pipeline (automated frame extraction)

1. `generate-frames.mjs` renders ~120 SVG frames of a procedural sneaker:
   phase A blueprint line-draw (exploded parts, dashed strokes animating),
   phase B parts converge/assemble, phase C lighting sweep + volt glow + particles.
2. `sharp` rasterizes each SVG to PNG (1520x760).
3. `ffmpeg` encodes PNGs → `resole-sequence.mp4`.
4. `ffmpeg` extracts frames back out of the video as WebP → `public/frames/`.
   (This is the literal automated frame-extraction step.)
5. Hero preloads frames as `Image`s and draws to a `<canvas>` keyed to
   ScrollTrigger progress (pinned, `scrub: true`).

## Scroll choreography

- Lenis instance drives scroll; `lenis.on('scroll', ScrollTrigger.update)` and
  GSAP ticker drives `lenis.raf` (standard integration, `lagSmoothing(0)`).
- Scenes: hero pin+scrub, manifesto word stagger, horizontal services pin
  (x-translate scrub), process step parallax + SVG stitch-line `stroke-dashoffset`
  scrub, stats counters (`once`), infinite marquee (time-based, not scroll),
  footer magnetic button (pointer, not scroll).
- Reduced motion: `prefers-reduced-motion` disables pinning/scrub, shows final
  frame statically, keeps content readable.

## Error handling

- Frame preload failures degrade to a static poster (last frame) — site never blocks.
- Pipeline script fails loudly with per-stage messages (svg gen / raster / encode / extract).

## Testing / verification

- Pipeline: run script, assert frame count + non-zero file sizes.
- Site: run Vite dev server, verify in real browser (screenshots at multiple
  scroll positions), check console for errors.
