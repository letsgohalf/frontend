/**
 * LetsGoHalf Design System
 * ========================
 * A sophisticated monochrome + electric blue palette
 * Two themes: Light (Daylight) and Dark (Midnight)
 */

export const colors = {
  // ============================================
  // CORE BLUE PALETTE - Electric/Vibrant Series
  // ============================================
  blue: {
    50: '#EFF6FF',   // Whisper - barely there tint
    100: '#DBEAFE',  // Frost - subtle backgrounds
    200: '#BFDBFE',  // Mist - hover states light
    300: '#93C5FD',  // Sky - borders, dividers
    400: '#60A5FA',  // Azure - secondary actions
    500: '#3B82F6',  // Electric - PRIMARY brand color
    600: '#2563EB',  // Cobalt - hover on primary
    700: '#1D4ED8',  // Royal - active states
    800: '#1E40AF',  // Deep - dark mode accents
    900: '#1E3A8A',  // Navy - dark mode primary
    950: '#172554',  // Abyss - darkest blue
  },

  // ============================================
  // NEUTRAL PALETTE - Pure Monochrome
  // ============================================
  neutral: {
    0: '#FFFFFF',    // Pure white
    50: '#FAFAFA',   // Snow - page backgrounds
    100: '#F5F5F5',  // Smoke - card backgrounds
    150: '#EEEEEE',  // Ash - subtle borders
    200: '#E5E5E5',  // Silver - borders
    300: '#D4D4D4',  // Gray - disabled states
    400: '#A3A3A3',  // Stone - placeholder text
    500: '#737373',  // Slate - secondary text
    600: '#525252',  // Graphite - body text dark
    700: '#404040',  // Charcoal - headings dark
    800: '#262626',  // Onyx - dark backgrounds
    850: '#1C1C1C',  // Carbon - card dark
    900: '#171717',  // Obsidian - page dark
    950: '#0A0A0A',  // Void - true dark
    1000: '#000000', // Pure black
  },

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  semantic: {
    success: '#22C55E',
    successLight: '#DCFCE7',
    successDark: '#16A34A',

    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',

    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',

    info: '#3B82F6', // Uses primary blue
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',
  },
} as const;

// ============================================
// LIGHT THEME - "Daylight"
// ============================================
export const lightTheme = {
  name: 'daylight',

  // Backgrounds
  bg: {
    page: colors.neutral[50],        // #FAFAFA - main page
    elevated: colors.neutral[0],      // #FFFFFF - cards, modals
    subtle: colors.neutral[100],      // #F5F5F5 - secondary sections
    inverse: colors.neutral[900],     // #171717 - inverted elements
    overlay: 'rgba(0, 0, 0, 0.5)',    // Modal overlays

    // Interactive backgrounds
    hover: colors.neutral[100],       // Hover state
    active: colors.neutral[150],      // Active/pressed state
    selected: colors.blue[50],        // Selected items

    // Brand backgrounds
    brand: colors.blue[500],          // Primary brand bg
    brandSubtle: colors.blue[50],     // Subtle brand bg
    brandHover: colors.blue[600],     // Brand hover
  },

  // Text colors
  text: {
    primary: colors.neutral[900],     // #171717 - headings, important
    secondary: colors.neutral[600],   // #525252 - body text
    tertiary: colors.neutral[500],    // #737373 - captions, metadata
    disabled: colors.neutral[400],    // #A3A3A3 - disabled text
    inverse: colors.neutral[0],       // #FFFFFF - on dark bg

    // Brand text
    brand: colors.blue[600],          // Links, CTAs
    brandHover: colors.blue[700],     // Link hover

    // Semantic
    success: colors.semantic.successDark,
    warning: colors.semantic.warningDark,
    error: colors.semantic.errorDark,
  },

  // Borders
  border: {
    default: colors.neutral[200],     // Standard borders
    subtle: colors.neutral[150],      // Subtle dividers
    strong: colors.neutral[300],      // Emphasized borders
    focus: colors.blue[500],          // Focus rings
    brand: colors.blue[500],          // Brand accent borders
  },

  // Interactive elements
  interactive: {
    // Primary button
    primaryBg: colors.blue[500],
    primaryBgHover: colors.blue[600],
    primaryBgActive: colors.blue[700],
    primaryText: colors.neutral[0],

    // Secondary button
    secondaryBg: colors.neutral[0],
    secondaryBgHover: colors.neutral[50],
    secondaryBgActive: colors.neutral[100],
    secondaryText: colors.neutral[700],
    secondaryBorder: colors.neutral[300],

    // Ghost/text button
    ghostText: colors.blue[600],
    ghostTextHover: colors.blue[700],
    ghostBgHover: colors.blue[50],
  },

  // Shadows
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

    // Colored shadows for depth
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    glowStrong: '0 0 30px rgba(59, 130, 246, 0.25)',
  },

  // Special UI elements
  ui: {
    // Feed-specific
    cardBorder: 'transparent',
    cardBorderHover: colors.blue[200],
    cardAccent: colors.blue[500],     // Left accent line

    // Avatar ring
    avatarRing: colors.blue[500],
    verifiedBadge: colors.blue[500],

    // Reactions
    reactionBg: colors.neutral[100],
    reactionBgActive: colors.blue[50],
    reactionText: colors.neutral[600],
    reactionTextActive: colors.blue[600],

    // Input
    inputBg: colors.neutral[0],
    inputBorder: colors.neutral[300],
    inputBorderFocus: colors.blue[500],
    inputPlaceholder: colors.neutral[400],
  },
} as const;

// ============================================
// DARK THEME - "Midnight"
// ============================================
export const darkTheme = {
  name: 'midnight',

  // Backgrounds
  bg: {
    page: colors.neutral[950],        // #0A0A0A - main page (true dark)
    elevated: colors.neutral[900],    // #171717 - cards, modals
    subtle: colors.neutral[850],      // #1C1C1C - secondary sections
    inverse: colors.neutral[0],       // #FFFFFF - inverted elements
    overlay: 'rgba(0, 0, 0, 0.7)',    // Modal overlays

    // Interactive backgrounds
    hover: colors.neutral[800],       // Hover state
    active: colors.neutral[700],      // Active/pressed state
    selected: 'rgba(59, 130, 246, 0.15)', // Selected items

    // Brand backgrounds
    brand: colors.blue[500],          // Primary brand bg
    brandSubtle: 'rgba(59, 130, 246, 0.1)', // Subtle brand bg
    brandHover: colors.blue[400],     // Brand hover (lighter in dark)
  },

  // Text colors
  text: {
    primary: colors.neutral[50],      // #FAFAFA - headings, important
    secondary: colors.neutral[400],   // #A3A3A3 - body text
    tertiary: colors.neutral[500],    // #737373 - captions, metadata
    disabled: colors.neutral[600],    // #525252 - disabled text
    inverse: colors.neutral[900],     // #171717 - on light bg

    // Brand text
    brand: colors.blue[400],          // Links, CTAs (brighter in dark)
    brandHover: colors.blue[300],     // Link hover

    // Semantic
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
  },

  // Borders
  border: {
    default: colors.neutral[800],     // Standard borders
    subtle: colors.neutral[850],      // Subtle dividers
    strong: colors.neutral[700],      // Emphasized borders
    focus: colors.blue[500],          // Focus rings
    brand: colors.blue[500],          // Brand accent borders
  },

  // Interactive elements
  interactive: {
    // Primary button
    primaryBg: colors.blue[500],
    primaryBgHover: colors.blue[400],
    primaryBgActive: colors.blue[600],
    primaryText: colors.neutral[0],

    // Secondary button
    secondaryBg: colors.neutral[800],
    secondaryBgHover: colors.neutral[700],
    secondaryBgActive: colors.neutral[600],
    secondaryText: colors.neutral[100],
    secondaryBorder: colors.neutral[700],

    // Ghost/text button
    ghostText: colors.blue[400],
    ghostTextHover: colors.blue[300],
    ghostBgHover: 'rgba(59, 130, 246, 0.1)',
  },

  // Shadows (more subtle in dark mode)
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',

    // Glow effects more prominent in dark
    glow: '0 0 20px rgba(59, 130, 246, 0.2)',
    glowStrong: '0 0 40px rgba(59, 130, 246, 0.3)',
  },

  // Special UI elements
  ui: {
    // Feed-specific
    cardBorder: colors.neutral[800],
    cardBorderHover: colors.blue[800],
    cardAccent: colors.blue[500],     // Left accent line

    // Avatar ring
    avatarRing: colors.blue[500],
    verifiedBadge: colors.blue[400],

    // Reactions
    reactionBg: colors.neutral[800],
    reactionBgActive: 'rgba(59, 130, 246, 0.15)',
    reactionText: colors.neutral[400],
    reactionTextActive: colors.blue[400],

    // Input
    inputBg: colors.neutral[900],
    inputBorder: colors.neutral[700],
    inputBorderFocus: colors.blue[500],
    inputPlaceholder: colors.neutral[500],
  },
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================
// SPACING SCALE
// ============================================
export const spacing = {
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',

  // Specific animations
  hover: '150ms ease-out',
  expand: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Type exports
export type Theme = typeof lightTheme | typeof darkTheme;
export type ThemeName = 'daylight' | 'midnight';
