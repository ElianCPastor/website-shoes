import gsap from 'gsap'

export function initServices({ reducedMotion }) {
  const track = document.querySelector('.services-track')

  if (reducedMotion) {
    // Leave the track scrollable horizontally by touch/trackpad.
    track.parentElement.style.overflowX = 'auto'
    track.style.height = 'auto'
    return
  }

  const distance = () => track.scrollWidth - window.innerWidth

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.services',
      start: 'top top',
      end: () => '+=' + distance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  })
}
