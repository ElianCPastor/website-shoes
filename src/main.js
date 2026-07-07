import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { initHeroSequence } from './scenes/hero-sequence.js'
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

// Header flips to bone while the dark hero band is under it.
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top 64px',
  end: 'bottom 64px',
  toggleClass: { targets: '.site-head', className: 'on-dark' },
})

const ctx = { reducedMotion }
initHeroSequence(ctx)
initManifesto(ctx)
initServices(ctx)
initProcess(ctx)
initStats(ctx)
initCta(ctx)

window.addEventListener('load', () => ScrollTrigger.refresh())
