import gsap from 'gsap'
import { createFrameScrubber, FRAME_COUNT } from './sequence.js'

export function initHeroSequence({ reducedMotion }) {
  const scrub = createFrameScrubber({
    canvas: document.querySelector('.hero-canvas'),
    dir: 'frames',
  })

  if (reducedMotion) {
    // Show the finished shoe, no pinning, no scrub.
    scrub.draw(FRAME_COUNT - 1)
    return
  }

  // One timeline on the pin's trigger — secondary tweens live INSIDE it,
  // otherwise the pin spacer pushes their start positions past the pin.
  const seq = { frame: 0 }
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
    },
  })
  tl.to(seq, {
    frame: FRAME_COUNT - 1,
    ease: 'none',
    duration: 1,
    onUpdate: () => scrub.draw(Math.round(seq.frame)),
  }, 0)
  // Copy drifts away as the rebuild begins.
  tl.to('.hero-copy', { yPercent: -20, autoAlpha: 0, ease: 'none', duration: 0.3 }, 0)
  tl.to('.scroll-cue', { autoAlpha: 0, ease: 'none', duration: 0.1 }, 0)

  // Entrance on load.
  gsap.from('.hero-title .line', {
    y: 90,
    autoAlpha: 0,
    duration: 1.1,
    stagger: 0.14,
    ease: 'power4.out',
    delay: 0.2,
  })
  gsap.from('.hero .ticket, .hero-sub, .scroll-cue', {
    autoAlpha: 0,
    y: 24,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.55,
  })
}
