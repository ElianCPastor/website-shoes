import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initStats({ reducedMotion }) {
  const counters = gsap.utils.toArray('.stat dd')

  const fmt = (dd, v) =>
    dd.dataset.format === 'plain' ? String(Math.round(v)) : Math.round(v).toLocaleString('en-US')

  if (reducedMotion) {
    counters.forEach((dd) => {
      dd.textContent = fmt(dd, Number(dd.dataset.count))
    })
    return
  }

  counters.forEach((dd) => {
    const target = Number(dd.dataset.count)
    const state = { v: 0 }
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: dd, start: 'top 88%', once: true },
      onUpdate() {
        dd.textContent = fmt(dd, state.v)
      },
    })
  })

  // Marquee runs on its own clock; scroll velocity leans on it.
  const track = document.querySelector('.marquee-track')
  const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 24, repeat: -1 })

  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const boost = Math.min(3, Math.abs(self.getVelocity()) / 500)
      gsap.to(loop, { timeScale: 1 + boost, duration: 0.2, overwrite: true })
      gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false })
    },
  })
}
