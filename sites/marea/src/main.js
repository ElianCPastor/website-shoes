import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Below-the-fold films load lazily and only run while on screen.
const lazyVideos = document.querySelectorAll('.lazy-video')
if (!reducedMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.play().catch(() => {})
      else e.target.pause()
    })
  }, { rootMargin: '25% 0px', threshold: 0.1 })
  lazyVideos.forEach((v) => io.observe(v))
}

if (reducedMotion) {
  document.querySelectorAll('video').forEach((v) => {
    v.removeAttribute('autoplay')
    v.pause()
  })
} else {
  const lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Hero: entrance + slow parallax drift on the photograph.
  gsap.from('.hero-copy > *', {
    y: 40, autoAlpha: 0, duration: 1.05, stagger: 0.12,
    ease: 'power3.out', delay: 0.15,
  })
  // (title, scrim and cue fade out inside the comp timeline below)

  // ————————————————————————————————————————————
  // LA COMPOSICIÓN — real plating order, 40%+ overlapped flights,
  // weight-based eases, one caption at a time, snap to resolved states.
  // Every scrubbed tween of this scene lives INSIDE this one timeline
  // (secondary triggers on pinned content get shifted by the pin spacer).
  // ————————————————————————————————————————————
  const vw = (n) => () => (window.innerWidth * n) / 100
  const vh = (n) => () => (window.innerHeight * n) / 100

  // beats follow how a cevichero actually plates: base → fish → citrus
  // → onion → heat → garnish. weight: heavy lands slow, light overshoots.
  // The film is the subject: scroll drives video.currentTime through a
  // lerped rAF loop (never seek while seeking — the reference technique).
  const film = document.querySelector('.film')
  let filmTarget = 0
  let filmCurrent = 0
  ScrollTrigger.create({
    trigger: '.comp', start: 'top top', end: 'bottom bottom',
    onUpdate(self) { filmTarget = self.progress },
  })
  gsap.ticker.add(() => {
    if (!film || !film.duration) return
    filmCurrent += (filmTarget - filmCurrent) * 0.12
    const t = filmCurrent * (film.duration - 0.05)
    if (!film.seeking && Math.abs(film.currentTime - t) > 0.02) film.currentTime = t
  })

  const INGS_UNUSED = [
    { sel: '.ing-camote',   beat: 0, w: 'heavy', from: { x: -28, y: 58, r: -35 }, to: { x: -4,  y: 15, r: 9 } },
    { sel: '.ing-choclo',   beat: 0, w: 'heavy', from: { x: 30,  y: 58, r: 30 },  to: { x: -15, y: 10, r: -14 } },
    { sel: '.ing-pescado',  beat: 1, w: 'heavy', from: { x: -62, y: -30, r: -40 }, to: { x: 1,  y: -3, r: -5 } },
    { sel: '.ing-limas',    beat: 2, w: 'light', from: { x: 55,  y: -42, r: 50 },  to: { x: -14, y: -13, r: 8 } },
    { sel: '.ing-cebolla',  beat: 3, w: 'mid',   from: { x: -58, y: 20, r: -55 },  to: { x: 12,  y: -14, r: -11 } },
    { sel: '.ing-aji',      beat: 4, w: 'light', from: { x: 48,  y: 38, r: 65 },   to: { x: 18,  y: 3,  r: 24 } },
    { sel: '.ing-cancha',   beat: 4, w: 'mid',   from: { x: 62,  y: -8, r: 25 },   to: { x: 13,  y: 14, r: 4 } },
    { sel: '.ing-cilantro', beat: 5, w: 'light', from: { x: 4,   y: -56, r: 28 },  to: { x: 3,   y: -7, r: -7 } },
  ]
  const EASE = { heavy: 'power2.out', mid: 'power3.out', light: 'back.out(1.35)' }
  const DUR = { heavy: 0.19, mid: 0.16, light: 0.13 }
  const BEAT_AT = [0, 0.105, 0.21, 0.315, 0.42, 0.525] // overlapped: next starts while previous still flying

  const comp = gsap.timeline({
    scrollTrigger: {
      trigger: '.comp',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      preventOverlaps: true,
      // no snap: snap tweens re-enter through Lenis and cascade label-to-label
    },
  })

  const LABELS = ['base', 'pescado', 'citrus', 'cebolla', 'aji', 'garnish']
  LABELS.forEach((l, i) => comp.addLabel(l, BEAT_AT[i]))
  comp.addLabel('plated', 0.8)

  void INGS_UNUSED; void EASE; void DUR; void vw; void vh; void LABELS

  // The title rides frame one, then hands the film over.
  comp.to('.hero-copy, .hero-scrim, .cue', {
    autoAlpha: 0, ease: 'none', duration: 0.06,
  }, 0.01)

  // Captions ACCUMULATE — each ingredient stays on screen once it lands.
  gsap.utils.toArray('.beat').forEach((el) => {
    const b = Number(el.dataset.beat)
    comp.fromTo(el, { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.045 }, BEAT_AT[b] + 0.06)
  })

  // The finished-dish card over the film's last gesture.
  comp.fromTo('.comp-final', { autoAlpha: 0, y: 34 },
    { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.06 }, 'plated+=0.1')
  comp.to('.comp-label', { autoAlpha: 0, ease: 'none', duration: 0.04 }, 'plated')

  // Parallax: anything with data-speed drifts at its own pace.
  gsap.utils.toArray('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed)
    gsap.fromTo(el,
      { yPercent: (1 - speed) * 14 },
      { yPercent: (speed - 1) * 14, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
  })

  // Section reveals.
  gsap.utils.toArray('.carta-head, .plato, .origen-head, .origen-media, .ruta, .bar-media, .bar-info, .reservar-card').forEach((el) => {
    gsap.from(el, {
      y: 48, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
    })
  })

  // Marquee.
  gsap.to('.marquee-track', { xPercent: -50, ease: 'none', duration: 22, repeat: -1 })

  // The brasa pill breathes slightly as it crosses the viewport.
  gsap.fromTo('.brasa-band', { scale: 0.94 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.brasa', start: 'top 85%', end: 'center 45%', scrub: true },
  })

  // Magnetic reserve button — mouse pointers only, tween-safe.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const btn = document.querySelector('.btn')
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' })
    let attracted = false
    window.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      if (Math.hypot(dx, dy) < 130) {
        attracted = true
        xTo(dx * 0.35)
        yTo(dy * 0.35)
      } else if (attracted) {
        attracted = false
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
      }
    })
  }
}
