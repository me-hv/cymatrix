// We map long keys to compact 2-letter keys to minimize URL length
const KEY_MAP: Record<string, string> = {
  visualizationMode: 'vm',
  frequency: 'fr',
  symmetry: 'sy',
  damping: 'da',
  brightness: 'br',
  gain: 'ga',
  thickness: 'th',
  speed: 'sp',
  is3D: 'td',
  exaggeration: 'ex',
  smoothing: 'sm',
  meshDetail: 'md',
  viewMode: 'vM',
  colorMode: 'cM',
  heatMap: 'hm',
  activePaletteId: 'ap',
  colorContrast: 'cc',
  chromaticAberration: 'ca',
  inputMode: 'im',
  sensitivity: 'se',
  audioSmoothing: 'as',
  freqFocus: 'ff',
  plateShape: 'pS',
  plateDamping: 'pD',
  plateMaterial: 'pM',
  fluidViscosity: 'fV',
  fluidity: 'fl',
  fluidGrowthRate: 'fG',
  oscA: 'oA',
  oscB: 'oB',
  oscC: 'oC',
  cameraZoom: 'zm',
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

const OSC_MAP: Record<string, string> = {
  enabled: 'en',
  frequency: 'fr',
  gain: 'ga',
  type: 'ty',
  detune: 'de',
  phase: 'ph',
  lfoEnabled: 'le',
  lfoRate: 'lr',
};

const REVERSE_OSC_MAP = Object.fromEntries(
  Object.entries(OSC_MAP).map(([k, v]) => [v, k])
);

function base64UrlEncode(str: string): string {
  try {
    const utf8Str = unescape(encodeURIComponent(str));
    return btoa(utf8Str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    return decodeURIComponent(escape(binary));
  } catch (e) {
    console.error('Decoding error:', e);
    return '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeState(state: any): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compact: Record<string, any> = {};

  Object.entries(KEY_MAP).forEach(([longKey, shortKey]) => {
    const val = state[longKey];
    if (val === undefined) return;

    if (longKey === 'oscA' || longKey === 'oscB' || longKey === 'oscC') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compactOsc: Record<string, any> = {};
      Object.entries(OSC_MAP).forEach(([oscLong, oscShort]) => {
        if (val[oscLong] !== undefined) {
          compactOsc[oscShort] = val[oscLong];
        }
      });
      compact[shortKey] = compactOsc;
    } else {
      compact[shortKey] = val;
    }
  });

  return base64UrlEncode(JSON.stringify(compact));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deserializeState(dnaStr: string): any {
  if (!dnaStr) return null;
  try {
    const jsonStr = base64UrlDecode(dnaStr);
    if (!jsonStr) return null;
    
    const compact = JSON.parse(jsonStr);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(compact).forEach(([shortKey, val]: [string, any]) => {
      const longKey = REVERSE_KEY_MAP[shortKey];
      if (!longKey) return;

      if (longKey === 'oscA' || longKey === 'oscB' || longKey === 'oscC') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const osc: Record<string, any> = {};
        Object.entries(val as Record<string, unknown>).forEach(([oscShort, oscVal]) => {
          const oscLong = REVERSE_OSC_MAP[oscShort];
          if (oscLong) {
            osc[oscLong] = oscVal;
          }
        });
        state[longKey] = osc;
      } else {
        state[longKey] = val;
      }
    });

    return state;
  } catch (e) {
    console.error('Failed to parse DNA preset:', e);
    return null;
  }
}
