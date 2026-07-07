# Higgsfield generation brief — RESOLE hero sequence

Goal: replace the procedural blueprint animation with a photorealistic
cinematic shot, keeping the site's art direction and the scroll narrative
(a dead shoe brought back to life).

## Model & settings

- Video model: Veo 3.1 or Kling 3.0 (whichever the account has credits for)
- Duration: 6–10 s (the extractor samples 120 frames evenly, any length works)
- Aspect: 16:9, highest available resolution
- No audio needed (frames only)

## Prompt

> Macro cinematic shot inside a dark cobbler's workshop. A single worn
> leather sneaker on a scarred wooden workbench, lit by a warm ember-orange
> key light from the lower left and a faint bone-white rim light from the
> upper right, deep near-black background (#14100c), floating dust motes.
> Camera slowly orbits and pushes in as the shoe is rebuilt: sole
> reattached, seams restitched with waxed amber thread, leather polished
> until it glows. The shoe finishes pristine, resting hero-centered.
> Photorealistic, shallow depth of field, 35mm film grain, slow deliberate
> motion, single continuous take, no cuts, no text, no hands visible.

Negative / avoid: cuts, camera shake, text overlays, hands, logos, daylight.

## Why these constraints

- **Single continuous take, slow motion** — the video becomes a scroll
  scrubber; cuts or fast motion feel broken when scrubbed by hand.
- **Dark background near #14100c** — the canvas must blend into the page
  background at the frame edges.
- **Ember + bone lighting** — matches the site palette (polish-tin ember
  `#c9472b`, waxed-thread bone `#ece3d1`, gum amber `#d29a55`).
- **Ends hero-centered and pristine** — the last frame sits behind the
  manifesto transition, and reduced-motion users see only this frame.

## Pipeline

1. Generate with the Higgsfield MCP tools (video model above).
2. Take the returned MP4 URL (or download it), then:
   `npm run frames:video -- <url-or-file>`
3. Refresh the site — the hero scrubs the new sequence automatically.
