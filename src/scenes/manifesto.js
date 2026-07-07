import gsap from 'gsap'

export function initManifesto({ reducedMotion }) {
  const el = document.querySelector('.manifesto-text')

  if (reducedMotion) return

  // Split into words so the diagnosis reads itself in as you scroll.
  const words = el.textContent.trim().split(/\s+/)
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ')

  gsap.fromTo(
    el.querySelectorAll('.w'),
    { opacity: 0.12, y: 10 },
    {
      opacity: 1,
      y: 0,
      ease: 'none',
      stagger: 0.4,
      scrollTrigger: {
        trigger: '.manifesto',
        start: 'top 70%',
        end: 'center 45%',
        scrub: true,
      },
    }
  )

  // The stamp slams down once, like a real one.
  gsap.from('.stamp', {
    scale: 3.4,
    autoAlpha: 0,
    duration: 0.45,
    ease: 'power4.in',
    scrollTrigger: {
      trigger: '.stamp',
      start: 'top 82%',
      toggleActions: 'play none none reverse',
    },
  })
}
