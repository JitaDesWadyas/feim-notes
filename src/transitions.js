// Shared transition utilities and crossfade setup
import { crossfade } from 'svelte/transition';
import { quintOut, cubicOut } from 'svelte/easing';

// Crossfade for view transitions
export const [send, receive] = crossfade({
  duration: 220,
  easing: quintOut,
  fallback(node, params) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
      duration: 220,
      easing: quintOut,
      css: t => `
        transform: ${transform} scale(${0.95 + (t * 0.05)});
        opacity: ${t}
      `
    };
  }
});

// Standard transition durations
export const DURATION = {
  fast: 120,
  normal: 180,
  slow: 220
};

// Check for reduced motion preference
export function shouldReduceMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Conditional transition helpers
export function conditionalSlide(node, params) {
  if (shouldReduceMotion()) {
    return { duration: 0 };
  }
  const { slide } = require('svelte/transition');
  return slide(node, { ...params, duration: params.duration || DURATION.normal });
}

export function conditionalFade(node, params) {
  if (shouldReduceMotion()) {
    return { duration: 0 };
  }
  const { fade } = require('svelte/transition');
  return fade(node, { ...params, duration: params.duration || DURATION.fast });
}
