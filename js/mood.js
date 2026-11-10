const KEY = 'bbf-mood';
const DEFAULT_GLOW = '229 9 20';
const root = document.documentElement;
const cache = new Map();
let enabled = localStorage.getItem(KEY) !== 'off';
let lastUrl = null;

// 포스터를 작게 줄여 그린 뒤 채도 높은 픽셀에 가중치를 줘 대표 색을 뽑는다.
function extractColor(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          try {
            const w = 24;
            const h = 36;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(image, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            let r = 0;
            let g = 0;
            let b = 0;
            let total = 0;
            for (let i = 0; i < data.length; i += 4) {
              const max = Math.max(data[i], data[i + 1], data[i + 2]);
              const min = Math.min(data[i], data[i + 1], data[i + 2]);
              const sat = max ? (max - min) / max : 0;
              const weight = sat * sat * (max / 255) + 0.01;
              r += data[i] * weight;
              g += data[i + 1] * weight;
              b += data[i + 2] * weight;
              total += weight;
            }
            resolve([r, g, b].map((v) => Math.round(v / total)));
          } catch {
            resolve(null);
          }
        };
        image.onerror = () => resolve(null);
        image.src = url;
      }),
    );
  }
  return cache.get(url);
}

export async function applyMood(url) {
  lastUrl = url;
  if (!enabled || !url) {
    root.style.setProperty('--glow', DEFAULT_GLOW);
    return;
  }
  const color = await extractColor(url);
  if (url !== lastUrl) return;
  root.style.setProperty('--glow', color ? color.join(' ') : DEFAULT_GLOW);
}

export function initMood(button) {
  const sync = () => {
    button.setAttribute('aria-pressed', String(enabled));
    document.body.classList.toggle('mood-off', !enabled);
  };
  button.addEventListener('click', () => {
    enabled = !enabled;
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
    sync();
    applyMood(lastUrl);
  });
  sync();
}
