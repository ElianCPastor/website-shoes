# RESOLE — The Repair Atelier

Cinematic single-page site for a fictional shoe-repair atelier. Built to
demonstrate scroll choreography: GSAP ScrollTrigger, Lenis smooth scroll, and a
fully local automated frame-extraction pipeline feeding a scroll-scrubbed
canvas image sequence.

## Quick start

```bash
npm install
npm run frames   # regenerate the hero image sequence (needs ffmpeg)
npm run dev      # http://localhost:5173
```

The generated frames are committed under `public/frames/`, so `npm run dev`
works without running the pipeline first.

## How the hero works

`tools/generate-frames.mjs` renders 120 frames of a procedural sneaker rebuild
(SVG → sharp PNG), encodes them to `public/media/resole-sequence.mp4` with
ffmpeg, then **extracts frames back out of the video** (ffmpeg → sharp WebP)
into `public/frames/`. The hero pins for 260vh and scrubs those frames on a
`<canvas>` keyed to ScrollTrigger progress — frame-exact, no video seeking.

## Photorealistic hero via Higgsfield

The hosted Higgsfield MCP (`https://mcp.higgsfield.ai/mcp`) is registered in
Claude Code user scope. To swap the procedural animation for an AI-generated
photorealistic shot:

1. Generate a video with a Higgsfield video model using the prompt in
   `tools/higgsfield-brief.md` (single continuous take, dark workshop, ember
   light — constraints matter for scrubbing).
2. Run `npm run frames:video -- <mp4 url or file>` — it decodes the video,
   samples 120 evenly spaced frames, and replaces `public/frames/`.
3. Refresh the site. Revert anytime with `npm run frames`.

## Scroll scenes

| Scene | Technique |
| --- | --- |
| Hero rebuild | pinned timeline, canvas frame scrub, copy parallax-out |
| Manifesto | per-word opacity scrub + rubber-stamp slam |
| Services | pinned horizontal track (x-translate scrub) |
| Process | stitch line clip-path sew + step reveals |
| Ledger | one-shot counters, velocity-reactive marquee |
| Rebirth | magnetic CTA button (pointer, elastic release) |

Lenis drives scroll (`lerp: 0.09`) and is wired into GSAP's ticker with
`lagSmoothing(0)`. `prefers-reduced-motion` disables pinning/scrubbing and
shows final states.

## Structure

```
index.html                  # all markup
src/styles.css              # design tokens + sections
src/main.js                 # Lenis + GSAP boot, scene registry
src/scenes/*.js             # one module per scroll scene
tools/generate-frames.mjs   # frame pipeline (SVG → PNG → MP4 → WebP)
public/frames/              # generated: 120 webp frames (~1.5 MB)
public/media/               # generated: preview mp4
```
