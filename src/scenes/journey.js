import gsap from 'gsap'
import { createFrameScrubber, loadFrameCount } from './sequence.js'

/**
 * The film: one fixed full-viewport canvas behind the entire page.
 * Total document scroll drives the master frame sequence, so paper sections
 * slide over the movie and transparent windows reveal whichever chapter
 * you've scrolled into.
 */
export async function initJourney({ reducedMotion }) {
  const canvas = document.querySelector('.journey-canvas')
  const count = await loadFrameCount('frames')
  const scrub = createFrameScrubber({ canvas, dir: 'frames', count })

  if (reducedMotion) {
    scrub.draw(count - 1)
    return
  }

  const seq = { frame: 0 }
  gsap.to(seq, {
    frame: count - 1,
    ease: 'none',
    scrollTrigger: {
      start: 0,
      end: 'max',
      scrub: 0.4,
      invalidateOnRefresh: true,
    },
    onUpdate: () => scrub.draw(Math.round(seq.frame)),
  })

  // Hero copy drifts away over the first stretch of scroll.
  gsap.to('.hero-copy', {
    yPercent: -18,
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { start: 0, end: () => window.innerHeight * 0.7, scrub: true },
  })
  gsap.to('.scroll-cue', {
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { start: 0, end: () => window.innerHeight * 0.25, scrub: true },
  })

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

  // Chapter captions surface mid-window, then hand the frame back to the film.
  gsap.utils.toArray('.window-caption').forEach((cap) => {
    gsap.fromTo(cap,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: cap.parentElement, start: 'top 55%', end: 'top 15%', scrub: true },
      })
    gsap.to(cap, {
      autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: cap.parentElement, start: 'bottom 75%', end: 'bottom 45%', scrub: true },
    })
  })
}
