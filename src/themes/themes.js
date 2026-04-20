export const themes = {
  'minimal-light': {
    name: 'Minimal Light',
    '--bg': '#f8f8f6',
    '--card': '#ffffff',
    '--text': '#1a1a1a',
    '--accent': '#6366f1',
    '--muted': '#6b7280',
    '--border': '#e5e5e5',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'minimal-dark': {
    name: 'Minimal Dark',
    '--bg': '#0f0f0f',
    '--card': '#1a1a1a',
    '--text': '#e8e8e8',
    '--accent': '#a855f7',
    '--muted': '#6b7280',
    '--border': '#2d2d2d',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'space': {
    name: 'Space',
    '--bg': '#050510',
    '--card': '#0d0d1f',
    '--text': '#c8d8ff',
    '--accent': '#8b5cf6',
    '--muted': '#4a5568',
    '--border': '#1a1a3a',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '1',
  },
  'hacking': {
    name: 'Hacking',
    '--bg': '#000000',
    '--card': '#0a0a0a',
    '--text': '#00ff41',
    '--accent': '#00ff41',
    '--muted': '#006400',
    '--border': '#003300',
    '--font': "'JetBrains Mono', monospace",
    '--star': '0',
  },
  'nord': {
    name: 'Nord',
    '--bg': '#2e3440',
    '--card': '#3b4252',
    '--text': '#eceff4',
    '--accent': '#88c0d0',
    '--muted': '#4c566a',
    '--border': '#4c566a',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'sunset': {
    name: 'Sunset',
    '--bg': '#1a0a0f',
    '--card': '#2d1520',
    '--text': '#ffcba4',
    '--accent': '#ff6b6b',
    '--muted': '#8b4557',
    '--border': '#3d1f2a',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'cyberpunk': {
    name: 'Cyberpunk',
    '--bg': '#0d0221',
    '--card': '#130334',
    '--text': '#fffb00',
    '--accent': '#ff2d78',
    '--muted': '#6b21a8',
    '--border': '#2d0a5e',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
}

export const applyTheme = (themeName) => {
  const theme = themes[themeName]
  if (!theme) return

  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name') {
      root.style.setProperty(key, value)
    }
  })
}

export const themeList = Object.keys(themes).map(key => ({
  id: key,
  name: themes[key].name
}))
