import { useEffect } from 'react'
import Lenis from 'lenis'

let lenis: Lenis | null = null

/**
 * Eased, weighted scrolling for the whole site (the feel of the BIFA template). It is turned off
 * for anyone who asked their system for reduced motion, and on touch screens, where the browser's
 * own momentum is better than anything we can add.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (still || touch) return
    const l = new Lenis({ duration: 1.1, wheelMultiplier: 0.9, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    lenis = l
    let raf = 0
    const loop = (time: number) => { l.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); l.destroy(); lenis = null }
  }, [])
}

/** Jump to the top on a route change, without the eased travel. */
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true })
  else window.scrollTo({ top: 0 })
}
