/**
 * WCAG 2.1 Contrast & Color Utility Functions
 * Enforces WCAG AA (4.5:1 for body text, 3:1 for large text and UI components)
 */

export interface ContrastResult {
  ratio: number;
  passAA: boolean;
  passAALarge: boolean;
  score: 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

/**
 * Parses a hex string to [r, g, b] in 0-255
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return [0, 0, 0];
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts [r, g, b] to hex #rrggbb
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates WCAG 2.1 Relative Luminance (0 to 1)
 */
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG Contrast Ratio between two hex colors (1:1 to 21:1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (brighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Evaluates WCAG AA & AAA compliance
 */
export function evaluateContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  const passAA = ratio >= 4.5;
  const passAALarge = ratio >= 3.0;
  let score: ContrastResult['score'] = 'Fail';
  if (ratio >= 7.0) score = 'AAA';
  else if (passAA) score = 'AA';
  else if (passAALarge) score = 'AA Large';

  return { ratio, passAA, passAALarge, score };
}

/**
 * Lightens or adjusts color for dark mode background (#0b1120) to ensure high visibility
 */
export function generateAccessibleDarkVariant(hex: string, targetBg: string = '#0b1120'): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = getRelativeLuminance(hex);

  // If already bright enough on dark background (contrast >= 4.5)
  if (getContrastRatio(hex, targetBg) >= 4.5) {
    return hex;
  }

  // Desaturate and lighten progressively until ratio >= 4.5
  let currentR = r;
  let currentG = g;
  let currentB = b;

  for (let i = 0; i < 30; i++) {
    currentR = Math.min(255, currentR + 10);
    currentG = Math.min(255, currentG + 10);
    currentB = Math.min(255, currentB + 10);
    const candidate = rgbToHex(currentR, currentG, currentB);
    if (getContrastRatio(candidate, targetBg) >= 4.5) {
      return candidate;
    }
  }

  return '#38bdf8'; // Fallback accessible sky
}
