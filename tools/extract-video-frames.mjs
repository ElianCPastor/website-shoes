/**
 * Extract the hero scroll sequence from ANY video (e.g. a Higgsfield render).
 *
 *   node tools/extract-video-frames.mjs <video.mp4 | https://…/video.mp4>
 *     [--out <dir under public/>]   default: frames        (hero sequence)
 *     [--reverse]                   store frames in reverse play order
 *
 * Decodes every frame with ffmpeg, picks 120 evenly spaced ones, converts to
 * WebP and replaces the target directory. The site needs no code change —
 * each scene scrubs whatever lives in its directory. Use
 * `--out frames-anatomy --reverse` on a decomposition video so scrolling
 * plays parts → whole.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const OUT_DIR = outIdx !== -1 ? args[outIdx + 1] : 'frames'
const REVERSE = args.includes('--reverse')
const countIdx = args.indexOf('--count')
const FRAME_COUNT = countIdx !== -1 ? Number(args[countIdx + 1]) : 120
if (!Number.isInteger(FRAME_COUNT) || FRAME_COUNT < 2) throw new Error(`bad --count: ${FRAME_COUNT}`)
if (!/^[a-z0-9-]+$/.test(OUT_DIR || '')) throw new Error(`bad --out dir name: ${OUT_DIR}`)
const FRAMES_DIR = path.join(ROOT, 'public', OUT_DIR)
const WIDTH = 1216

async function resolveInput(arg) {
  if (!arg) throw new Error('usage: node tools/extract-video-frames.mjs <video file or URL> [--out <dir>] [--reverse]')
  if (/^https?:\/\//.test(arg)) {
    console.log('[0/3] downloading video…')
    const res = await fetch(arg)
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`)
    const file = path.join(os.tmpdir(), `resole-input-${process.pid}.mp4`)
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    return file
  }
  if (!fs.existsSync(arg)) throw new Error(`no such file: ${arg}`)
  return path.resolve(arg)
}

async function main() {
  const optionValues = new Set([OUT_DIR, String(FRAME_COUNT)])
  const input = await resolveInput(args.find((a) => !a.startsWith('--') && !optionValues.has(a)))
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resole-extract-'))

  console.log('[1/3] decoding all frames (ffmpeg)…')
  execFileSync('ffmpeg', [
    '-y', '-i', input,
    '-vf', `scale=${WIDTH}:-2`,
    path.join(workDir, 'raw_%05d.png'),
  ], { stdio: 'pipe' })

  const raw = fs.readdirSync(workDir).filter((f) => f.startsWith('raw_')).sort()
  if (raw.length < 2) throw new Error(`video decoded to only ${raw.length} frame(s)`)
  console.log(`      ${raw.length} frames decoded`)

  console.log(`[2/3] sampling ${FRAME_COUNT} evenly spaced frames → WebP…`)
  const old = fs.existsSync(FRAMES_DIR) ? fs.readdirSync(FRAMES_DIR) : []
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true })
  fs.mkdirSync(FRAMES_DIR, { recursive: true })
  for (let i = 0; i < FRAME_COUNT; i++) {
    let srcIdx = Math.round((i * (raw.length - 1)) / (FRAME_COUNT - 1))
    if (REVERSE) srcIdx = raw.length - 1 - srcIdx
    await sharp(path.join(workDir, raw[srcIdx]))
      .webp({ quality: 82 })
      .toFile(path.join(FRAMES_DIR, `frame_${String(i + 1).padStart(4, '0')}.webp`))
  }
  fs.rmSync(workDir, { recursive: true, force: true })

  console.log('[3/3] verifying…')
  const files = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.webp'))
  const empty = files.filter((f) => fs.statSync(path.join(FRAMES_DIR, f)).size === 0)
  if (files.length !== FRAME_COUNT || empty.length) {
    throw new Error(`extraction failed: ${files.length}/${FRAME_COUNT} frames, ${empty.length} empty`)
  }
  fs.writeFileSync(path.join(FRAMES_DIR, 'manifest.json'), JSON.stringify({ count: FRAME_COUNT }))
  const total = files.reduce((s, f) => s + fs.statSync(path.join(FRAMES_DIR, f)).size, 0)
  console.log(`      ✓ replaced ${old.length} old frames with ${files.length} new (${(total / 1024 / 1024).toFixed(1)} MB) + manifest.json`)
  console.log('      tip: regenerate the procedural sequence anytime with `npm run frames`')
}

main().catch((err) => {
  console.error('extraction failed:', err.message)
  process.exit(1)
})
