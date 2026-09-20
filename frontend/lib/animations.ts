const easeOut = [0.22, 1, 0.36, 1] as const;

const reducedTransition = { duration: 0.01, ease: easeOut };

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const floating = {
  hidden: { y: 0 },
  visible: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const reducedFade = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: reducedTransition,
  },
};

const stillFloating = {
  hidden: { y: 0 },
  visible: { y: 0, transition: reducedTransition },
};

export function motionSafe(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return { initial: false as const, animate: "visible" as const };
  }

  return { initial: "hidden" as const, animate: "visible" as const };
}

export function withReducedMotion<T>(
  variant: T,
  reduceMotion: boolean | null,
): T | typeof reducedFade {
  return reduceMotion ? reducedFade : variant;
}

export function floatingMotion(reduceMotion: boolean | null) {
  return reduceMotion ? stillFloating : floating;
}
