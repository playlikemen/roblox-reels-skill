// Original blocky (6-block) cast with drawn faces (roblox-in-this-town: characters_and_faces.md) and
// stackable block hats - the town's rule made visible.
import * as THREE from "three";
import { box, toon, canvasTex, geo, ink, INK } from "./kit";

export type Expr = "neutral" | "smile" | "smug" | "grin" | "suspicious" | "proud" | "shocked" | "awe" | "nervous" | "bored" | "wink" | "worried";
type Mouth = "line" | "smile" | "big" | "smirk" | "o" | "frown" | "wavy" | "talk";
const EX: Record<Expr, { brow: [number, number]; mouth: Mouth; eye: number; py: number; px: number; sweat?: boolean; wink?: boolean; heavy?: boolean }> = {
  neutral: { brow: [0, 0], mouth: "line", eye: 1, py: 0, px: 0 },
  smile: { brow: [-4, 0], mouth: "smile", eye: 1, py: 0, px: 0 },
  smug: { brow: [6, -6], mouth: "smirk", eye: 0.9, py: 0, px: 0, heavy: true },
  grin: { brow: [-8, -2], mouth: "big", eye: 1.05, py: 0, px: 0 },
  suspicious: { brow: [10, -4], mouth: "smirk", eye: 0.75, py: 0, px: -6, heavy: true },
  proud: { brow: [-8, -4], mouth: "big", eye: 0.9, py: 0, px: 0, heavy: true },
  shocked: { brow: [-16, -16], mouth: "o", eye: 1.25, py: 0, px: 0 },
  awe: { brow: [-14, -10], mouth: "o", eye: 1.15, py: -12, px: 0 },
  nervous: { brow: [-12, 6], mouth: "wavy", eye: 1, py: 0, px: 0, sweat: true },
  bored: { brow: [2, 2], mouth: "line", eye: 0.8, py: 2, px: 0, heavy: true },
  wink: { brow: [-6, -2], mouth: "smirk", eye: 1, py: 0, px: 0, wink: true },
  worried: { brow: [-14, 8], mouth: "frown", eye: 1.05, py: 0, px: 0 },
};

const faceCache = new Map<string, THREE.Texture>();
export const faceTex = (skin: string, e: Expr, talk: boolean, blink: boolean) => {
  const k = `${skin}|${e}|${talk}|${blink}`;
  if (faceCache.has(k)) return faceCache.get(k)!;
  const S = 256, p = EX[e];
  const t = canvasTex(S, S, (g) => {
    g.fillStyle = skin; g.fillRect(0, 0, S, S);
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = "round"; g.lineJoin = "round";
    const eyes = [[86, 112], [170, 112]];
    eyes.forEach(([x, y], i) => {
      const closed = blink || (p.wink && i === 1);
      if (closed) { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 16, y + 4); g.quadraticCurveTo(x, y + 12, x + 16, y + 4); g.stroke(); return; }
      g.beginPath(); g.ellipse(x + p.px, y + p.py, 14 * p.eye, 21 * p.eye, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + p.px - 4, y + p.py - 8, 4.5, 0, Math.PI * 2); g.fill(); g.fillStyle = INK;
      if (p.heavy) { g.fillStyle = skin; g.fillRect(x - 24, y + p.py - 30, 48, 20); g.fillStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 17, y + p.py - 10); g.lineTo(x + 17, y + p.py - 10); g.stroke(); }
    });
    // brows as filled quads (thick strokes as polygons, not wide lines)
    eyes.forEach(([x], i) => {
      const s = i === 0 ? 1 : -1;
      const inner = 72 + p.brow[0], outer = 72 + p.brow[1];
      const xi = x + 18 * s, xo = x - 22 * s;
      g.beginPath(); g.moveTo(xo, outer); g.lineTo(xi, inner); g.lineTo(xi, inner + 11); g.lineTo(xo, outer + 11); g.closePath(); g.fill();
    });
    const my = 178, m: Mouth = talk ? "talk" : p.mouth;
    g.lineWidth = 9;
    if (m === "line") { g.beginPath(); g.moveTo(104, my); g.lineTo(152, my); g.stroke(); }
    if (m === "smile") { g.beginPath(); g.moveTo(96, my - 6); g.quadraticCurveTo(128, my + 22, 160, my - 6); g.stroke(); }
    if (m === "smirk") { g.beginPath(); g.moveTo(100, my + 2); g.quadraticCurveTo(140, my + 10, 162, my - 12); g.stroke(); }
    if (m === "frown") { g.beginPath(); g.moveTo(100, my + 10); g.quadraticCurveTo(128, my - 10, 156, my + 10); g.stroke(); }
    if (m === "wavy") { g.beginPath(); g.moveTo(94, my); g.bezierCurveTo(108, my - 12, 116, my + 12, 128, my); g.bezierCurveTo(140, my - 12, 150, my + 12, 162, my); g.stroke(); }
    if (m === "big" || m === "talk") {
      g.beginPath();
      if (m === "big") { g.moveTo(90, my - 14); g.lineTo(166, my - 14); g.quadraticCurveTo(164, my + 30, 128, my + 32); g.quadraticCurveTo(92, my + 30, 90, my - 14); }
      else g.ellipse(128, my + 2, 20, 17, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = m === "big" ? "#ffffff" : "#c8495a";
      if (m === "big") g.fillRect(98, my - 10, 60, 10); else { g.beginPath(); g.ellipse(128, my + 10, 11, 6, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = INK;
    }
    if (m === "o") { g.beginPath(); g.ellipse(128, my + 4, 16, 22, 0, 0, Math.PI * 2); g.fill(); }
    if (p.sweat) { g.fillStyle = "#7cc7ff"; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(206, 60); g.quadraticCurveTo(222, 92, 206, 98); g.quadraticCurveTo(190, 92, 206, 60); g.fill(); g.stroke(); }
  });
  faceCache.set(k, t);
  return t;
};

export type Look = {
  skin: string; shirt: string; pants: string; hair: string; hat: string; hat2?: string;
  hairStyle?: "short" | "pony" | "messy" | "bald"; apron?: string; sash?: string; hatW?: number;
};
export const HAT_H = 0.55;

export class Char {
  root = new THREE.Group();
  hips = new THREE.Group();
  head = new THREE.Group();
  armL = new THREE.Group(); armR = new THREE.Group();
  legL = new THREE.Group(); legR = new THREE.Group();
  hat = new THREE.Group();
  blocks: THREE.Mesh[] = [];
  faceMat: THREE.MeshToonMaterial;
  prop = new THREE.Group(); // held in the right hand
  look: Look;
  constructor(look: Look, maxHat = 24) {
    this.look = look;
    const L = look;
    this.root.add(this.hips);
    // legs, pivot at hip
    for (const [g, x] of [[this.legL, -0.5], [this.legR, 0.5]] as const) {
      g.position.set(x, 2, 0); this.hips.add(g);
      box(g, 0.98, 2, 1, L.pants, 0, -1, 0);
    }
    box(this.hips, 2, 2, 1, L.shirt, 0, 3, 0);
    if (L.apron) box(this.hips, 1.5, 1.7, 0.06, L.apron, 0, 2.8, 0.53, 0.03);
    if (L.sash) { const s = box(this.hips, 0.42, 2.6, 1.08, L.sash, 0, 3, 0, 0.03); s.rotation.z = 0.75; }
    for (const [g, x] of [[this.armL, -1.5], [this.armR, 1.5]] as const) {
      g.position.set(x, 3.9, 0); this.hips.add(g);
      box(g, 0.98, 2, 1, L.shirt, 0, -0.9, 0);
      box(g, 0.99, 0.5, 1.01, L.skin, 0, -1.68, 0, false); // hands
    }
    this.armR.add(this.prop); this.prop.position.set(0, -1.9, 0.3);
    // head: face on +z
    this.head.position.set(0, 4, 0); this.hips.add(this.head);
    const sk = toon(L.skin);
    this.faceMat = new THREE.MeshToonMaterial({ color: "#ffffff", gradientMap: (toon(L.skin) as THREE.MeshToonMaterial).gradientMap });
    const hm = new THREE.Mesh(geo(1.25, 1.25, 1.25), [sk, sk, sk, sk, this.faceMat, sk]);
    hm.position.y = 0.625; hm.castShadow = true; ink(hm, 1.25, 1.25, 1.25, 0.04);
    this.head.add(hm);
    const hs = L.hairStyle ?? "short";
    if (hs !== "bald") {
      box(this.head, 1.33, 0.22, 1.33, L.hair, 0, 1.3, 0, 0.035);
      box(this.head, 1.33, 0.9, 0.2, L.hair, 0, 0.85, -0.6, 0.035);
      if (hs === "pony") { box(this.head, 0.45, 0.9, 0.45, L.hair, 0, 0.6, -0.85, 0.035); }
      if (hs === "messy") {
        // the terrible haircut: uneven spikes
        const sp = [[-0.45, 0.25, 0.5, 0.3], [0.1, 0.45, 0.35, -0.2], [0.5, 0.2, 0.3, 0.45], [-0.2, 0.35, 0.3, -0.5], [0.35, 0.55, 0.25, 0.1]];
        sp.forEach(([x, h, w, z], i) => { const b = box(this.head, w, h, w, L.hair, x, 1.42 + h / 2, z, 0.03); b.rotation.z = (i % 2 ? 1 : -1) * 0.3; b.rotation.x = 0.2 * (i - 2); });
        box(this.head, 0.35, 0.3, 0.12, L.hair, -0.3, 1.12, 0.66, 0.03);
      }
    }
    // hat stack
    this.hat.position.y = hs === "messy" ? 2.05 : 1.42;
    this.head.add(this.hat);
    const hw = L.hatW ?? 1.36;
    for (let i = 0; i < maxHat; i++) {
      const c = i % 2 ? (L.hat2 ?? shade(L.hat, 0.86)) : L.hat;
      const b = box(this.hat, hw, HAT_H, hw, c, 0, HAT_H / 2 + i * HAT_H, 0, 0.04);
      b.visible = false;
      this.blocks.push(b);
    }
  }
  /** n blocks; the newest pops in over 6 frames when it appeared `since` frames ago; wobble grows with height */
  setHat(n: number, since = 99, wob = 0, t = 0) {
    this.blocks.forEach((b, i) => {
      b.visible = i < n;
      if (!b.visible) return;
      const top = i === n - 1 && since < 6;
      const s = top ? [0.2, 0.7, 1.15, 1.18, 1.06, 1][since] : 1;
      b.scale.set(s, s, s);
      const h = i / Math.max(1, n);
      b.position.x = wob * Math.sin(t * 0.13 + i * 0.15) * h * h;
      b.position.z = wob * 0.5 * Math.cos(t * 0.11 + i * 0.12) * h * h;
    });
  }
  hatTop(n: number) {
    const v = new THREE.Vector3(0, this.hat.position.y + n * HAT_H + 0.4, 0);
    return this.head.localToWorld(v);
  }
  setFace(e: Expr, talk = false, blink = false) {
    const t = faceTex(this.look.skin, e, talk, blink);
    if (this.faceMat.map !== t) { this.faceMat.map = t; this.faceMat.needsUpdate = true; }
  }
}

export const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString();
};
