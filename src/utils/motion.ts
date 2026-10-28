import { Variants, Transition } from 'framer-motion';

/**
 * ============================================================================
 * CENTRALIZED MOTION SYSTEM (Smart Municipal Dustbin Platform)
 * Inspired by Kumkang motion patterns:
 * - Controlled, purposeful animation ("Motion must explain something")
 * - Restrained timing: 80ms - 500ms
 * - Consistent cubic-bezier curves
 * - Accessible: respects prefers-reduced-motion
 * ============================================================================
 */

// Centralized Timing Tokens (Section 33)
export const MOTION_DURATIONS = {
  fast: 0.1,       // 80–120ms: micro-interactions, clicks, toggles
  micro: 0.15,     // 120–180ms: icons, hover feedback, dropdowns
  standard: 0.2,   // 150–250ms: cards, buttons, badges
  page: 0.2,       // 180–250ms: global page transitions
  drawer: 0.28,    // 220–300ms: side inspection drawer
  modal: 0.2,      // 200ms: confirmation and config modals
  section: 0.35,   // 300–500ms: viewport section reveal
  number: 0.35,    // 350ms: KPI count-up animation
  chart: 0.6,      // 400–800ms: charts data reveal
} as const;

// Centralized Easing Curves (Section 33)
export const MOTION_EASINGS = {
  // General UI easing: smooth, controlled deceleration
  smooth: [0.22, 1, 0.36, 1] as const,
  // Fast mechanical deceleration for drawers and slide-outs
  drawer: [0.16, 1, 0.3, 1] as const,
  // Subtle card hover ease
  card: [0.4, 0, 0.2, 1] as const,
  // Standard CSS-friendly ease
  easeOut: 'easeOut' as const,
} as const;

// 1. Global Page Transition Variants (Section 3)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.page,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: MOTION_DURATIONS.page,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// 2. Section Reveal on Scroll (Section 5)
export const sectionRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.section,
      ease: MOTION_EASINGS.smooth,
    },
  },
};

// 3. Staggered Container for Lists and Grids (Section 4)
export const createStaggerContainer = (staggerDelay = 0.04, initialDelay = 0.02): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: initialDelay,
    },
  },
});

export const staggerContainerVariants: Variants = createStaggerContainer(0.04, 0.02);

// 4. Staggered Child Card Entrance (Section 4 & 6)
export const cardEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// 5. Right-side Drawer Slide Animation (Section 12)
export const drawerVariants: Variants = {
  hidden: {
    opacity: 0,
    x: '100%',
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.drawer,
      ease: MOTION_EASINGS.drawer,
    },
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: {
      duration: 0.22,
      ease: MOTION_EASINGS.drawer,
    },
  },
};

// 6. Modal Entrance & Exit (Section 13)
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.modal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.16,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// 7. Interactive Micro-Interactions (Section 14 & 6)
export const cardHoverTap = {
  whileHover: { y: -2.5, transition: { duration: 0.18, ease: MOTION_EASINGS.easeOut } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const buttonHoverTap = {
  whileHover: { y: -1, transition: { duration: 0.12, ease: MOTION_EASINGS.easeOut } },
  whileTap: { scale: 0.98, transition: { duration: 0.08 } },
};
