import gsap from 'gsap'

export function initCta({ reducedMotion }) {
  const btn = document.querySelector('.btn-magnetic')

  if (!reducedMotion) {
    gsap.from('.cta-title', {
      y: 70,
      autoAlpha: 0,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.cta', start: 'top 65%', toggleActions: 'play none none reverse' },
    })

    // Magnetic pull toward the pointer, elastic release.
    const strength = 0.38
    const zone = 140
    window.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < zone) {
        gsap.to(btn, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power3.out' })
      } else {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
      }
    })
  }
}
