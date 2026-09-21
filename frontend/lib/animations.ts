const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Variant used with `whileInView`. The hidden state is only applied when the
 * visitor has not asked for reduced motion; callers pass `initial={false}`
 * otherwise so nothing can be left stuck at zero opacity.
 */
export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/** Entrance props for an element that animates as soon as it mounts. */
export function revealMotion(
  reduceMotion: boolean | null,
  options?: {
    x?: number;
    y?: number;
    scale?: number;
    delay?: number;
    duration?: number;
  },
) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1, x: 0, y: 0, scale: 1 },
      animate: { opacity: 1, x: 0, y: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: {
      opacity: 0,
      x: options?.x ?? 0,
      y: options?.y ?? 14,
      scale: options?.scale ?? 1,
    },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: {
      duration: options?.duration ?? 0.4,
      delay: options?.delay ?? 0,
      ease: easeOut,
    },
  };
}

/** Slow idle drift for the hero visual and its floating cards. */
export function floatMotion(reduceMotion: boolean | null, delay = 0) {
  if (reduceMotion) {
    return {
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    animate: { y: [0, -8, 0], opacity: 1 },
    transition: {
      duration: 5.5,
      delay,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };
}
