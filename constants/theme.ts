/**
 * Design tokens for the Virtual Kitchen app, derived from the Figma prototype.
 * Palette: warm yellow accents on white, black text, sage-green secondary action.
 * Type: Inria Serif (wordmark / display) + Jost (a geometric match for the
 * prototype's Futura) for headings and body.
 */

export const Colors = {
  background: '#FFFFFF',
  text: '#000000',
  muted: '#6B6B6B',
  yellow: '#F1D67E',
  green: '#A8C998',
  greenText: '#2E4A26',
  field: '#D9D9D9',
  profileBg: '#D3D3D3',
  card: '#FFFFFF',
  danger: '#C0392B',
  hairline: '#000000',
  // Freshness scale
  fresh: '#5B9A4B',
  soon: '#E0A53A',
  expiring: '#C0392B',
};

export const Fonts = {
  serif: 'InriaSerif_400Regular',
  serifItalic: 'InriaSerif_400Regular_Italic',
  serifBold: 'InriaSerif_700Bold',
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
  sansSemiBold: 'Jost_600SemiBold',
  sansBold: 'Jost_700Bold',
};

export const Spacing = {
  screenX: 24,
  gap: 16,
};

export const Radius = {
  pill: 20,
  card: 14,
};
