// Shared building blocks: toon materials, ink hulls (inverted-hull outlines, the cheap stand-in for the
// cartoon-3d-short InkPass), canvas textures for signs/faces, sprite stickers.
import * as THREE from "three";

export const INK = "#0b0a0c";
const grad = (() => {
  // 3-step toon ramp: shade / mid / lit (two-tone look of the cartoon-3d-short style)
  const d = new Uint8Array([92, 92, 92, 255, 178, 178, 178, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map<string, THREE.Material>();
export const toon = (color: string, emissive = 0) => {
  const k = color + "|" + emissive;
  if (!matCache.has(k)) {
    const m = new THREE.MeshToonMaterial({ color, gradientMap: grad });
    if (emissive) { m.emissive = new THREE.Color(color); m.emissiveIntensity = emissive; }
    matCache.set(k, m);
  }
  return matCache.get(k)!;
};
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

/** inverted hull with a constant world thickness t on every side of a w*h*d box-like mesh */
export const ink = (m: THREE.Mesh, w: number, h: number, d: number, t = 0.045) => {
  const o = new THREE.Mesh(m.geometry, inkMat);
  o.scale.set(1 + (2 * t) / w, 1 + (2 * t) / h, 1 + (2 * t) / d);
  o.castShadow = false; o.receiveShadow = false;
  m.add(o);
  return m;
};

const boxGeo = new Map<string, THREE.BoxGeometry>();
export const geo = (w: number, h: number, d: number) => {
  const k = `${w}|${h}|${d}`;
  if (!boxGeo.has(k)) boxGeo.set(k, new THREE.BoxGeometry(w, h, d));
  return boxGeo.get(k)!;
};

export const box = (parent: THREE.Object3D, w: number, h: number, d: number, color: string | THREE.Material | THREE.Material[],
  x = 0, y = 0, z = 0, t: number | false = 0.045) => {
  const mat = typeof color === "string" ? toon(color) : color;
  const m = new THREE.Mesh(geo(w, h, d), mat as THREE.Material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (t !== false) ink(m, w, h, d, t);
  parent.add(m);
  return m;
};

export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/** unlit sign face (painted signs lit by a side sun go grey: gotcha from cartoon-3d-short) */
export const signTex = (text: string, bg: string, fg: string, w = 512, h = 160, font = 92) =>
  canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = INK; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = fg; g.font = `900 ${font}px "DejaVu Sans", Arial, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 4);
  });

export const sign = (parent: THREE.Object3D, text: string, bg: string, fg: string, w: number, h: number,
  x: number, y: number, z: number, ry = 0, font = 92) => {
  const tex = signTex(text, bg, fg, 512, Math.round((512 * h) / w), font);
  const faceM = new THREE.MeshBasicMaterial({ map: tex });
  const side = toon(bg);
  const m = new THREE.Mesh(geo(w, h, 0.18), [side, side, side, side, faceM, side]);
  m.position.set(x, y, z); m.rotation.y = ry;
  ink(m, w, h, 0.18, 0.04);
  parent.add(m);
  return m;
};

/** comic sticker: camera-facing sprite, drawn on top, pops in (0.6 -> 1.15 -> 1) */
export type Sticker = { sprite: THREE.Sprite; at: number; dur: number; size: number; follow?: () => THREE.Vector3 };
export const makeSticker = (text: string, fill: string, size: number, at: number, dur: number, pos: THREE.Vector3 | (() => THREE.Vector3)): Sticker => {
  const W = 512, H = 256;
  const tex = canvasTex(W, H, (g) => {
    g.font = `900 ${text.length > 4 ? 120 : 170}px "DejaVu Sans", Arial, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineJoin = "round";
    g.fillStyle = INK; g.fillText(text, W / 2 + 10, H / 2 + 12);
    g.strokeStyle = INK; g.lineWidth = 26; g.strokeText(text, W / 2, H / 2);
    g.fillStyle = fill; g.fillText(text, W / 2, H / 2);
  });
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true });
  const s = new THREE.Sprite(mat);
  s.renderOrder = 999;
  if (typeof pos !== "function") s.position.copy(pos);
  return { sprite: s, at, dur, size, follow: typeof pos === "function" ? pos : undefined };
};
export const poseSticker = (s: Sticker, f: number) => {
  const t = f - s.at;
  const on = t >= 0 && t < s.dur;
  s.sprite.visible = on;
  if (!on) return;
  if (s.follow) s.sprite.position.copy(s.follow());
  const pop = t < 3 ? 0.6 + (0.55 * t) / 3 : t < 6 ? 1.15 - (0.15 * (t - 3)) / 3 : 1;
  const out = s.dur - t < 4 ? (s.dur - t) / 4 : 1;
  const k = s.size * pop * out;
  s.sprite.scale.set(k * 2, k, 1);
  s.sprite.position.y += Math.sin(t * 0.25) * 0.02 * s.size;
};

export const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
export const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
