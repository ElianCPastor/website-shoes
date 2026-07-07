import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (reducedMotion) {
  // Respect the preference: freeze the ambient films on their poster frame.
  document.querySelectorAll('video').forEach((v) => {
    v.removeAttribute('autoplay')
    v.pause()
  })
} else {
  const lenis = new Lenis({ lerp: 0.09 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Hero entrance.
  gsap.from('.hero .label, .hero h1, .hero .sub, .cue', {
    y: 40,
    autoAlpha: 0,
    duration: 1.1,
    stagger: 0.13,
    ease: 'power3.out',
    delay: 0.2,
  })

  // Gold marquee on its own clock.
  gsap.to('.marquee-track', { xPercent: -50, ease: 'none', duration: 26, repeat: -1 })

  // Section reveals.
  gsap.utils.toArray('.atelier-visual, .atelier-copy > *, .collection-head, .piece, .collection-note, .commission > *').forEach((el) => {
    gsap.from(el, {
      y: 44,
      autoAlpha: 0,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
    })
  })

  // Magnetic commission button.
  const btn = document.querySelector('.btn')
  window.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    if (Math.hypot(dx, dy) < 130) {
      gsap.to(btn, { x: dx * 0.35, y: dy * 0.35, duration: 0.4, ease: 'power3.out' })
    } else {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    }
  })
}

// The object: a turntable frame sequence — the ring spins on its own axis
// as it sweeps in, and keeps turning for as long as you scroll the pin.
initObjectScene()

async function initObjectScene() {
  const canvas = document.querySelector('.object-ring')
  const ctx = canvas.getContext('2d')
  const BASE = import.meta.env.BASE_URL || '/'

  let count = 96
  try {
    const m = await fetch(`${BASE}frames-ring/manifest.json`).then((r) => r.json())
    if (Number.isInteger(m.count) && m.count > 1) count = m.count
  } catch { /* fall back to default */ }

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
    img.src = `${BASE}frames-ring/frame_${String(i + 1).padStart(4, '0')}.webp`
    img.onload = () => { if (Math.abs(i - current) < 2 || i === 0) draw(current) }
    images[i] = img
  }
  window.addEventListener('resize', resize)
  resize()

  if (reducedMotion) {
    draw(0)
    return
  }

  const seq = { frame: 0 }
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.object',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
    },
  })
  // The turntable runs across the WHOLE pin — the ring never stops turning.
  tl.to(seq, {
    frame: count - 1,
    ease: 'none',
    duration: 1,
    onUpdate: () => draw(Math.round(seq.frame)),
  }, 0)
  // Sweep in from the right while already spinning.
  tl.fromTo(canvas,
    { xPercent: 120, scale: 0.85 },
    { xPercent: 0, scale: 1, ease: 'power1.out', duration: 0.5 }, 0)
  tl.from('.object-copy > *', {
    x: -60,
    autoAlpha: 0,
    stagger: 0.1,
    ease: 'none',
    duration: 0.3,
  }, 0.15)
}
