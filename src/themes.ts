import liquidGlassBg from './assets/liquid_glass_bg.png';

export type ThemeName = 'classic' | 'onyx' | 'typewriter' | 'liquidglass';

export interface Theme {
  name: ThemeName;
  label: string;
  vars: Record<string, string>;
  bodyBg?: string; // Optional full CSS value for body background (supports images)
}

export const themes: Theme[] = [
  {
    name: 'classic',
    label: '📜 Classic Vintage',
    vars: {
      '--bg-color':       '#1a1715',
      '--bg-texture':     '#231f1c',
      '--text-primary':   '#e8dbce',
      '--text-secondary': '#a39688',
      '--accent-color':   '#c9884e',
      '--accent-hover':   '#e0a36e',
      '--border-color':   '#3b332d',
      '--node-bg':        'rgba(35, 31, 28, 0.95)',
      '--node-choice-bg': 'rgba(35, 31, 28, 0.7)',
      '--glass-blur':     'none',
      '--on-accent':      '#1a1715',
    },
  },
  {
    name: 'onyx',
    label: '💎 Midnight Onyx',
    vars: {
      '--bg-color':       '#0a0a0f',
      '--bg-texture':     '#12121a',
      '--text-primary':   '#e2e0f0',
      '--text-secondary': '#7b78a8',
      '--accent-color':   '#8b5cf6',
      '--accent-hover':   '#a78bfa',
      '--border-color':   '#1e1e2e',
      '--node-bg':        'rgba(18, 18, 26, 0.7)',
      '--node-choice-bg': 'rgba(139, 92, 246, 0.08)',
      '--glass-blur':     'blur(12px)',
      '--on-accent':      '#0a0a0f',
    },
  },
  {
    name: 'typewriter',
    label: '📄 Typewriter Light',
    vars: {
      '--bg-color':       '#f5f0e8',
      '--bg-texture':     '#fffef9',
      '--text-primary':   '#1a1410',
      '--text-secondary': '#6b5e52',
      '--accent-color':   '#c0392b',
      '--accent-hover':   '#e74c3c',
      '--border-color':   '#d4c9b8',
      '--node-bg':        'rgba(255, 254, 249, 0.97)',
      '--node-choice-bg': 'rgba(192, 57, 43, 0.07)',
      '--glass-blur':     'none',
      '--on-accent':      '#fffef9',
    },
  },
  {
    name: 'liquidglass',
    label: '🫧 Liquid Glass',
    bodyBg: `url(${liquidGlassBg}) center/cover no-repeat fixed`,
    vars: {
      '--bg-color':       'transparent',
      '--bg-texture':     'rgba(255,255,255,0.06)',
      '--text-primary':   '#f0eeff',
      '--text-secondary': 'rgba(220, 210, 255, 0.65)',
      '--accent-color':   '#c8b8ff',
      '--accent-hover':   '#e0d4ff',
      '--border-color':   'rgba(255, 255, 255, 0.15)',
      '--node-bg':        'rgba(255, 255, 255, 0.08)',
      '--node-choice-bg': 'rgba(200, 184, 255, 0.07)',
      '--glass-blur':     'blur(24px) saturate(180%)',
      '--on-accent':      '#1a0a2e',
    },
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  // Apply special body background for themes that need it (e.g. Liquid Glass wallpaper)
  document.body.style.background = theme.bodyBg ?? theme.vars['--bg-color'] ?? '';
  localStorage.setItem('paperize-theme', theme.name);
}

export function loadSavedTheme(): Theme {
  const saved = localStorage.getItem('paperize-theme') as ThemeName | null;
  return themes.find((t) => t.name === saved) ?? themes[0];
}

