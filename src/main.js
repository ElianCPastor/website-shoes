import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { initJourney } from './scenes/journey.js'
import { initManifesto } from './scenes/manifesto.js'
import { initServices } from './scenes/services.js'
import { initProcess } from './scenes/process.js'
import { initStats } from './scenes/stats.js'
import { initCta } from './scenes/cta.js'

gsap.registerPlugin(ScrollTrigger)

// dev-only handle for debugging scroll scenes from the console
window.gsap = gsap
window.ScrollTrigger = ScrollTrigger

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!reducedMotion) {
  const lenis = new Lenis({ lerp: 0.09 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

// The seam at the top of the page sews itself shut as you scroll.
const progress = document.querySelector('.stitch-progress')
ScrollTrigger.create({
  start: 0,
  end: () => document.documentElement.scrollHeight - window.innerHeight,
  onUpdate(self) {
    progress.style.clipPath = `inset(0 ${(1 - self.progress) * 100}% 0 0)`
  },
})

// Header flips to bone while a film window (dark) is under it.
// Measured geometrically each scroll tick — trigger bookkeeping drifts once
// the services pin spacer moves section positions around.
const head = document.querySelector('.site-head')
const bands = Array.from(document.querySelectorAll('.hero, .window, .cta'))
const updateHead = () => {
  const dark = bands.some((b) => {
    const r = b.getBoundingClientRect()
    return r.top <= 64 && r.bottom >= 64
  })
  head.classList.toggle('on-dark', dark)
}
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateHead })
updateHead()

const ctx = { reducedMotion }
initJourney(ctx)
initManifesto(ctx)
initServices(ctx)
initProcess(ctx)
initStats(ctx)
initCta(ctx)

window.addEventListener('load', () => ScrollTrigger.refresh())
