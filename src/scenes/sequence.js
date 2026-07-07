// Shared canvas frame-sequence scrubber used by the hero and teardown scenes.

export const FRAME_COUNT = 120

// Base-aware so the site works at a sub-path (e.g. GitHub Pages /website-shoes/).
const BASE = import.meta.env.BASE_URL || '/'

export function framePath(dir, i) {
  return `${BASE}${dir}/frame_${String(i + 1).padStart(4, '0')}.webp`
}

/** Frame count from the sequence's manifest.json, falling back to the default. */
export async function loadFrameCount(dir) {
  try {
    const res = await fetch(`${BASE}${dir}/manifest.json`)
    if (res.ok) {
      const m = await res.json()
      if (Number.isInteger(m.count) && m.count > 1) return m.count
    }
  } catch { /* no manifest — use default */ }
  return FRAME_COUNT
}

/**
 * Preloads a frame directory and draws cover-fit onto a canvas.
 * Returns { draw } — call draw(index) with 0-based frame index.
 */
export function createFrameScrubber({ canvas, dir, count = FRAME_COUNT }) {
  const ctx = canvas.getContext('2d')
  const images = new Array(count).fill(null)
  let current = 0

  function pickLoaded(index) {
    for (let i = index; i >= 0; i--) {
      const im = images[i]
      if (im && im.complete && im.naturalWidth) return im
    }
    for (let i = index + 1; i < count; i++) {
      const im = images[i]
      if (im && im.complete && im.naturalWidth) return im
    }
    return null
  }

  function draw(index) {
    current = index
    const img = pickLoaded(index)
    if (!img) return
    const cw = canvas.width
    const ch = canvas.height
    const scale = Math.max(cw / img.width, ch / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
  }

  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
    draw(current)
  }

  for (let i = 0; i < count; i++) {
    const img = new Image()
    img.decoding = 'async'
    img.src = framePath(dir, i)
    img.onload = () => {
      if (Math.abs(i - current) < 2 || i === 0) draw(current)
    }
    images[i] = img
  }

  window.addEventListener('resize', resize)
  resize()

  return { draw }
}
