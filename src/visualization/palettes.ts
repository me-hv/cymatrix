import * as THREE from 'three';

export interface ColorPalette {
  id: 'neon' | 'gold' | 'sea' | 'thermal' | 'mono';
  name: string;
  node: string;   // low intensity
  accent: string; // mid intensity
  peak: string;   // high intensity
  colors: string[]; // for UI swatches
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'neon',
    name: 'NEON',
    node: '#02030a',
    accent: '#001144',
    peak: '#00f0ff',
    colors: ['#02030a', '#001144', '#00f0ff']
  },
  {
    id: 'gold',
    name: 'LIQUID GOLD',
    node: '#0f0904',
    accent: '#b8860b',
    peak: '#ffffff',
    colors: ['#0f0904', '#b8860b', '#ffffff']
  },
  {
    id: 'sea',
    name: 'DEEP SEA',
    node: '#020a10',
    accent: '#046a38',
    peak: '#39ff14',
    colors: ['#020a10', '#046a38', '#39ff14']
  },
  {
    id: 'thermal',
    name: 'THERMAL',
    node: '#0d021a',
    accent: '#d10000',
    peak: '#ffae00',
    colors: ['#0d021a', '#d10000', '#ffae00']
  },
  {
    id: 'mono',
    name: 'MONO (X-RAY)',
    node: '#000000',
    accent: '#3a3d40',
    peak: '#ffffff',
    colors: ['#000000', '#3a3d40', '#ffffff']
  }
];

export const hexToRgb = (hex: string): THREE.Vector3 => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return new THREE.Vector3(r, g, b);
};
