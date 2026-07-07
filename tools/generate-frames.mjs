/**
 * RESOLE frame pipeline — fully automated, fully local.
 *
 *   1. Render N frames of a procedural sneaker rebuild as SVG
 *      (blueprint line-draw → parts assemble → materialize → glow).
 *   2. Rasterize each SVG to PNG with sharp.
 *   3. Encode the PNGs to an H.264 MP4 with ffmpeg.
 *   4. Extract WebP frames back OUT of the video with ffmpeg
 *      → public/frames/frame_%04d.webp, consumed by the scroll scrubber.
 *
 * Usage:  node tools/generate-frames.mjs            # full pipeline
 *         node tools/generate-frames.mjs --preview  # 6 stills, no ffmpeg
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PNG_DIR = path.join(ROOT, 'tools/.build/png')
const PREVIEW_DIR = path.join(ROOT, 'tools/.build/preview')
const FRAMES_DIR = path.join(ROOT, 'public/frames')
const MEDIA_DIR = path.join(ROOT, 'public/media')

const FRAMES = 120
const W = 1520
const H = 760
const PREVIEW = process.argv.includes('--preview')

// ————— helpers —————
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic
const out = (t) => 1 - Math.pow(1 - t, 3) // easeOutCubic
const back = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2) // soft overshoot
const seg = (t, a, b) => clamp01((t - a) / (b - a))
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296
}

// ————— palette (matches src/styles.css) —————
const COAL = '#14100c'
const BONE = '#ece3d1'
const BONE_DIM = '#8f8571'
const EMBER = '#c9472b'
const GUM = '#d29a55'

// ————— shoe parts —————
// Each part: path(s), exploded offset, draw window (blueprint), assemble window,
// final fill (materialize phase) and stroke treatment.
const PARTS = [
  {
    id: 'outsole',
    d: 'M398 588 L1092 588 C1136 588 1152 566 1148 549 C1145 535 1124 528 1098 530 L432 542 C406 544 394 556 394 570 C394 580 396 588 398 588 Z',
    explode: { dx: 0, dy: 128, rot: -3 },
    draw: [0.0, 0.16], asm: [0.34, 0.5],
    fill: '#a8743c', len: 1600,
  },
  {
    id: 'midsole',
    d: 'M432 542 L1098 530 C1116 529 1126 519 1123 507 L1120 497 C1010 482 800 474 640 478 L448 486 C428 488 420 507 422 524 C423 534 427 540 432 542 Z',
    explode: { dx: -34, dy: 74, rot: 2.5 },
    draw: [0.04, 0.2], asm: [0.38, 0.54],
    fill: '#d9cdb6', len: 1500,
  },
  {
    // tongue renders BEFORE the upper so the collar covers its base
    id: 'tongue',
    d: 'M614 384 C628 354 670 344 702 356 C726 366 736 388 728 408 L714 424 C670 410 638 400 616 392 Z',
    explode: { dx: 18, dy: -168, rot: -10 },
    draw: [0.12, 0.28], asm: [0.46, 0.62],
    fill: '#1e1611', len: 520,
  },
  {
    id: 'upper',
    d: 'M446 336 C486 308 550 312 578 344 C604 372 642 382 694 394 L930 468 C1008 486 1078 494 1114 504 C1130 509 1132 498 1122 494 C1012 480 800 474 640 478 L448 486 C436 486 430 478 428 468 C424 424 430 372 446 336 Z',
    explode: { dx: -52, dy: -108, rot: 4 },
    draw: [0.08, 0.26], asm: [0.42, 0.58],
    fill: '#241a12', len: 2400,
  },
  {
    id: 'toecap',
    d: 'M938 482 C984 452 1046 454 1084 496',
    explode: { dx: 132, dy: -46, rot: 9 },
    draw: [0.14, 0.3], asm: [0.5, 0.66],
    fill: 'none', stroke: EMBER, width: 4.5, len: 240,
  },
  {
    id: 'heelseam',
    d: 'M566 344 C542 410 544 462 560 486',
    explode: { dx: -128, dy: -18, rot: -7 },
    draw: [0.14, 0.3], asm: [0.5, 0.66],
    fill: 'none', width: 3.5, len: 180,
  },
  {
    id: 'laces',
    d: 'M648 384 L704 430 M712 402 L768 446 M776 420 L832 462 M840 438 L896 478 M704 386 L652 424 M768 404 L716 442 M832 422 L780 458',
    explode: { dx: 24, dy: -216, rot: 7 },
    draw: [0.16, 0.32], asm: [0.54, 0.7],
    fill: 'none', width: 6, cap: 'round', len: 90,
  },
]

// dashed stitch seams — appear with assembly, gum-colored when materialized
const STITCHES = [
  'M470 468 C650 458 900 466 1088 490',
  'M482 352 C520 330 556 334 582 356',
  'M962 488 C1008 456 1066 458 1102 504',
]

// eyelets along the lace rails
const EYELETS = [
  [644, 380], [708, 398], [772, 416], [836, 434], [900, 456],
  [652, 428], [716, 446], [780, 462], [844, 480],
]

// blueprint annotations at exploded positions (fade out when assembly starts)
const NOTES = [
  { x: 330, y: 700, text: 'OUTSOLE — GUM RUBBER, 9MM' },
  { x: 300, y: 208, text: 'UPPER — FULL-GRAIN, RE-DYED' },
  { x: 1092, y: 180, text: 'LACES — WAXED THREAD Nº 1.2' },
  { x: 1120, y: 690, text: 'TOE CAP — REBUILT' },
]

function partTransform(part, t) {
  const p = io(seg(t, part.asm[0], part.asm[1]))
  const b = back(p) // slight overshoot as parts click in
  const k = 1 - b
  const { dx, dy, rot } = part.explode
  return `translate(${(dx * k).toFixed(2)} ${(dy * k).toFixed(2)}) rotate(${(rot * k).toFixed(2)} 760 460)`
}

function svgFrame(t) {
  const grid = 1 - io(seg(t, 0.55, 0.8)) // pattern paper fades as shoe becomes real
  const material = io(seg(t, 0.66, 0.86)) // fills come alive
  const glow = out(seg(t, 0.82, 1)) // ember warmth at the end
  const noteAlpha = (1 - io(seg(t, 0.3, 0.4))) * io(seg(t, 0.04, 0.12))
  const zoom = 1.055 - 0.055 * io(seg(t, 0.3, 0.85))
  const settle = Math.sin(Math.PI * seg(t, 0.68, 0.8)) * 7 // weight lands

  const rand = rng(48213)
  let dust = ''
  for (let i = 0; i < 26; i++) {
    const px = 240 + rand() * 1040
    const py = 140 + rand() * 500
    const phase = rand()
    const drift = 44 * ((t + phase) % 1)
    const a = Math.sin(Math.PI * ((t + phase) % 1)) * 0.5 * io(seg(t, 0.45, 0.6))
    const r = 1 + rand() * 1.8
    dust += `<circle cx="${px.toFixed(1)}" cy="${(py - drift).toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 3 ? BONE : GUM}" opacity="${a.toFixed(3)}"/>`
  }

  const parts = PARTS.map((part) => {
    const drawn = out(seg(t, part.draw[0], part.draw[1]))
    if (drawn <= 0.001) return ''
    const dash = part.len
    const offset = dash * (1 - drawn)
    const fillOpacity = part.fill === 'none' ? 0 : material
    const strokeCol = part.stroke || BONE
    const strokeAlpha = 0.92 - 0.45 * material
    const width = part.width || 2.4
    const cap = part.cap ? ` stroke-linecap="${part.cap}"` : ''
    return `<g transform="${partTransform(part, t)}">
      <path d="${part.d}" fill="${part.fill}" fill-opacity="${(fillOpacity).toFixed(3)}"
        stroke="${strokeCol}" stroke-opacity="${strokeAlpha.toFixed(3)}" stroke-width="${width}"${cap}
        stroke-dasharray="${dash}" stroke-dashoffset="${offset.toFixed(1)}"/>
    </g>`
  }).join('\n')

  const stitchAlpha = io(seg(t, 0.6, 0.78))
  const stitches = STITCHES.map(
    (d) => `<path d="${d}" fill="none" stroke="${GUM}" stroke-width="2.4"
      stroke-dasharray="9 7" stroke-opacity="${(stitchAlpha * 0.95).toFixed(3)}"/>`
  ).join('\n')

  const eyeAlpha = io(seg(t, 0.58, 0.72))
  const eyelets = EYELETS.map(
    ([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${COAL}" stroke="${GUM}"
      stroke-width="2" opacity="${eyeAlpha.toFixed(3)}"/>`
  ).join('\n')

  const notes = NOTES.map(
    (n, i) => `<text x="${n.x}" y="${n.y}" font-family="Menlo, monospace" font-size="17"
      fill="${BONE_DIM}" opacity="${noteAlpha.toFixed(3)}" ${i % 2 ? 'text-anchor="end"' : ''}>${n.text}</text>`
  ).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="88%" r="55%">
      <stop offset="0%" stop-color="${EMBER}" stop-opacity="0.5"/>
      <stop offset="55%" stop-color="${EMBER}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${EMBER}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="key" cx="72%" cy="12%" r="70%">
      <stop offset="0%" stop-color="${BONE}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${BONE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="62%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${COAL}"/>
  <rect width="${W}" height="${H}" fill="url(#key)"/>

  <!-- pattern paper -->
  <g opacity="${(grid * 1).toFixed(3)}">
    ${gridLines()}
    <text x="${W - 48}" y="64" text-anchor="end" font-family="Menlo, monospace" font-size="17" fill="${BONE_DIM}" opacity="0.85">RESOLE ATELIER — PATTERN Nº 48213 — SCALE 1:1</text>
    <path d="M400 648 L1128 648" stroke="${BONE_DIM}" stroke-width="1.2" opacity="0.6"/>
    <path d="M400 640 L400 656 M1128 640 L1128 656" stroke="${BONE_DIM}" stroke-width="1.2" opacity="0.6"/>
    <text x="764" y="676" text-anchor="middle" font-family="Menlo, monospace" font-size="15" fill="${BONE_DIM}" opacity="0.75">L 312 MM — EU 44</text>
  </g>

  <g opacity="${noteAlpha > 0 ? 1 : 0}">${notes}</g>

  <!-- ember glow rises as the shoe comes back to life -->
  <rect width="${W}" height="${H}" fill="url(#glow)" opacity="${glow.toFixed(3)}"/>

  <!-- ground shadow -->
  <ellipse cx="763" cy="600" rx="${(390 * material).toFixed(1)}" ry="${(16 * material).toFixed(1)}"
    fill="#000" opacity="${(0.55 * material).toFixed(3)}"/>

  <!-- the shoe -->
  <g transform="translate(${(760 * (1 - zoom)).toFixed(2)} ${(460 * (1 - zoom) + settle).toFixed(2)}) scale(${zoom.toFixed(4)})">
    ${parts}
    <g transform="${partTransform(PARTS.find((p) => p.id === 'upper'), t)}">${stitches}${eyelets}</g>
  </g>

  ${dust}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`
}

function gridLines() {
  let s = ''
  for (let x = 0; x <= W; x += 40) {
    const major = x % 200 === 0
    s += `<path d="M${x} 0 L${x} ${H}" stroke="${BONE}" stroke-width="1" opacity="${major ? 0.07 : 0.032}"/>`
  }
  for (let y = 0; y <= H; y += 40) {
    const major = y % 200 === 0
    s += `<path d="M0 ${y} L${W} ${y}" stroke="${BONE}" stroke-width="1" opacity="${major ? 0.07 : 0.032}"/>`
  }
  return s
}

// ————— pipeline —————
async function renderPng(t, file) {
  const svg = svgFrame(t)
  await sharp(Buffer.from(svg)).png().toFile(file)
}

async function main() {
  if (PREVIEW) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true })
    const stops = [0, 0.18, 0.35, 0.55, 0.75, 1]
    for (const t of stops) {
      const file = path.join(PREVIEW_DIR, `t${String(Math.round(t * 100)).padStart(3, '0')}.png`)
      await renderPng(t, file)
      console.log('preview →', file)
    }
    return
  }

  console.log(`[1/4] rendering ${FRAMES} SVG frames → PNG`)
  fs.rmSync(PNG_DIR, { recursive: true, force: true })
  fs.mkdirSync(PNG_DIR, { recursive: true })
  for (let i = 0; i < FRAMES; i++) {
    const t = i / (FRAMES - 1)
    await renderPng(t, path.join(PNG_DIR, `frame_${String(i + 1).padStart(4, '0')}.png`))
    if ((i + 1) % 20 === 0) console.log(`      ${i + 1}/${FRAMES}`)
  }

  console.log('[2/4] encoding PNG sequence → MP4 (ffmpeg)')
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  execFileSync('ffmpeg', [
    '-y', '-framerate', '30',
    '-i', path.join(PNG_DIR, 'frame_%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '15',
    path.join(MEDIA_DIR, 'resole-sequence.mp4'),
  ], { stdio: 'pipe' })

  console.log('[3/4] extracting frames ← MP4 (ffmpeg, automated frame extraction) → WebP (sharp)')
  const EXTRACT_DIR = path.join(ROOT, 'tools/.build/extracted')
  fs.rmSync(EXTRACT_DIR, { recursive: true, force: true })
  fs.mkdirSync(EXTRACT_DIR, { recursive: true })
  execFileSync('ffmpeg', [
    '-y', '-i', path.join(MEDIA_DIR, 'resole-sequence.mp4'),
    '-vf', 'scale=1216:-2',
    path.join(EXTRACT_DIR, 'frame_%04d.png'),
  ], { stdio: 'pipe' })

  fs.rmSync(FRAMES_DIR, { recursive: true, force: true })
  fs.mkdirSync(FRAMES_DIR, { recursive: true })
  const extracted = fs.readdirSync(EXTRACT_DIR).filter((f) => f.endsWith('.png')).sort()
  for (const f of extracted) {
    await sharp(path.join(EXTRACT_DIR, f))
      .webp({ quality: 82 })
      .toFile(path.join(FRAMES_DIR, f.replace('.png', '.webp')))
  }

  console.log('[4/4] verifying output')
  const files = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.webp'))
  const empty = files.filter((f) => fs.statSync(path.join(FRAMES_DIR, f)).size === 0)
  if (files.length !== FRAMES || empty.length) {
    throw new Error(`frame extraction failed: ${files.length}/${FRAMES} frames, ${empty.length} empty`)
  }
  const total = files.reduce((s, f) => s + fs.statSync(path.join(FRAMES_DIR, f)).size, 0)
  console.log(`      ✓ ${files.length} frames, ${(total / 1024 / 1024).toFixed(1)} MB total`)
}

main().catch((err) => {
  console.error('pipeline failed:', err.message)
  process.exit(1)
})
