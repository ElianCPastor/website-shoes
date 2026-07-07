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

  // The object: the ring sweeps in from the right, spinning slowly,
  // and docks beside the copy while the words arrive.
  const ringTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.object',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
    },
  })
  ringTl.fromTo('.object-ring',
    { xPercent: 160, rotation: 38, scale: 0.8 },
    { xPercent: 0, rotation: 0, scale: 1, ease: 'power1.out', duration: 0.55 }, 0)
  ringTl.from('.object-copy > *', {
    x: -60,
    autoAlpha: 0,
    stagger: 0.1,
    ease: 'none',
    duration: 0.3,
  }, 0.18)
  // A slow final drift so the pin never feels frozen.
  ringTl.to('.object-ring', { yPercent: -6, rotation: -6, ease: 'none', duration: 0.45 }, 0.55)

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
