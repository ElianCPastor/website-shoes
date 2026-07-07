import gsap from 'gsap'

export function initProcess({ reducedMotion }) {
  if (reducedMotion) return

  // The stitch line sews down the rail as the steps come in.
  gsap.fromTo(
    '.stitch-svg',
    { clipPath: 'inset(0 0 100% 0)' },
    {
      clipPath: 'inset(0 0 0% 0)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.process-rail',
        start: 'top 72%',
        end: 'bottom 40%',
        scrub: true,
      },
    }
  )

  gsap.utils.toArray('.step').forEach((step) => {
    gsap.from(step, {
      autoAlpha: 0,
      x: -36,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
  })
}
