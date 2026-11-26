// Shot plan + per-frame direction. The voice is the clock: every cut, pop and face change is anchored to a
// word start from words.json (faster-whisper, aligned to script.txt). Camera grammar from cartoon-3d-short:
// smootherstep glides between keys, every hold creeps in, flip-kicks on impacts; framing from
// roblox-in-this-town: player camera (wide lens, above head height) by default, close-ups only on punches.
import * as THREE from "three";
import words from "./words.json";
import { smooth, makeSticker, poseSticker, Sticker } from "./kit";
import { World } from "./world";
import { Char, Expr } from "./chars";

export const FPS = 30;
export const TOTAL = 1260;
const byLine: { w: string; s: number }[][] = [];
for (const w of words as { w: string; line: number; s: number }[]) (byLine[w.line] ||= []).push(w);
export const W = (l: number, i: number) => Math.round(byLine[l][i].s * FPS);

type V = [number, number, number];
type Key = { f: number; p: V; l: V; fov: number };
type Shot = { a: number; name: string; keys: Key[]; creep?: number };
const k = (f: number, p: V, l: V, fov: number): Key => ({ f, p, l, fov });

const H: V = [3, 0, -5];       // hero spot in the square
const P: V = [6.8, 0, -4.2];   // Pip
const M: V = [-0.6, 0, -2.6];  // mayor during the test
const ALLEY: V = [0, 0, -38];  // hero behind the town hall early on: only the "tower" shows above the roofs

export const SHOTS: Shot[] = [
  { a: 0, name: "hook-fred", keys: [k(0, [0.2, 7.2, 13.5], [-3, 5.0, 2], 50), k(105, [-0.4, 7.6, 12.0], [-3, 6.2, 2], 50)] },
  { a: W(1, 0) - 3, name: "baker-mayor-tower", keys: [
    k(W(1, 0) - 3, [-11.2, 6.0, -3.6], [-15, 4.8, -13], 50), k(205, [-12.2, 6.6, -5.2], [-15, 6.2, -13], 50),
    k(232, [2.6, 6.6, -3.4], [0, 7.0, -13.5], 54), k(262, [2.0, 7.4, -2.6], [0, 14.5, -13.5], 56),
    k(284, [1.4, 8.0, 2.0], [0, 20, -26], 54), k(304, [1.0, 7.0, 6.5], [0, 30, -38], 50)] },
  { a: W(4, 0) - 2, name: "barber", keys: [k(W(4, 0) - 2, [5.0, 10.5, 7.5], [14, 6.2, -12.5], 50), k(414, [9.0, 11.0, 7.0], [15.2, 7.0, -12.8], 50)] },
  { a: W(5, 0) - 2, name: "drone-crowd", keys: [k(W(5, 0) - 2, [-5, 24, 24], [0, 3, -4], 55), k(452, [1, 21, 19], [1.5, 3, -6], 55)] },
  { a: W(5, 5) - 2, name: "hero-except-me", keys: [k(452, [3.0, 5.6, 2.6], [3, 4.6, -5], 50)], creep: 0.003 },
  { a: W(6, 0) - 2, name: "hero-never", keys: [k(482, [4.4, 6.2, 4.0], [3, 4.6, -5], 46)], creep: 0.0035 },
  { a: W(7, 0) - 3, name: "two-shot-pip", keys: [k(544, [4.9, 7.4, 6.8], [4.9, 4.3, -4.6], 52)], creep: 0.0025 },
  { a: W(8, 0) - 2, name: "ots-pip", keys: [k(608, [0.4, 6.1, -3.2], [6.8, 5.0, -4.2], 46)], creep: 0.003 },
  { a: W(9, 0) - 2, name: "insert-haircut", keys: [k(677, [2.1, 6.0, -2.5], [6.8, 5.5, -4.2], 50)], creep: 0.004 },
  { a: W(9, 3) - 3, name: "hero-love-it", keys: [k(703, [6.6, 5.6, -1.6], [3, 4.6, -5], 50)], creep: 0.003 },
  { a: W(10, 0) - 3, name: "nothing", keys: [k(746, [4.9, 8.4, 6.2], [4.9, 5.6, -4.8], 52)], creep: 0.003 },
  { a: W(11, 0) - 2, name: "ots-mayor", keys: [k(773, [4.6, 5.3, -8.6], [-0.6, 5.0, -2.6], 50)], creep: 0.003 },
  { a: W(12, 0) - 2, name: "hero-of-course", keys: [k(838, [0.2, 5.6, -0.4], [3, 4.6, -5], 50)], creep: 0.003 },
  { a: W(13, 0) - 2, name: "quiet-wide", keys: [k(864, [3.5, 10.5, 16], [3.8, 4, -5], 48), k(946, [3.5, 9.4, 12.5], [3.8, 4.2, -5], 48)] },
  { a: W(14, 0) - 2, name: "pip-looks-up", keys: [k(947, [4.6, 5.0, 1.8], [6.8, 5.6, -4.2], 50)], creep: 0.003 },
  { a: W(14, 4) - 2, name: "crane-up", keys: [k(975, [3.3, 6.6, -0.9], [3, 7.6, -5], 55), k(989, [3.5, 26, 2.5], [3, 33, -5], 55), k(1001, [3.9, 51.5, 8.0], [3, 52.8, -5], 50), k(1024, [3.9, 52, 7.4], [3, 53, -5], 50)] },
  { a: W(15, 0) - 2, name: "fall-down", keys: [k(1025, [3.9, 50, 7.4], [3, 50, -5], 50), k(1052, [3.9, 3.2, 1.5], [3, 7.5, -5], 58), k(1096, [3.9, 3.3, 0.9], [3, 7.6, -5], 58)] },
  { a: W(16, 0) - 2, name: "pull-back", keys: [k(1097, [3.2, 7.5, 5.5], [3, 10, -5], 55), k(1141, [11, 31, 60], [3, 25, -5], 55)] },
  { a: W(17, 0) - 2, name: "fourth-wall", keys: [k(1143, [3.4, 6.3, 2.8], [3, 5.3, -5], 50)], creep: 0.0022 },
];
const KICKS = [W(3, 6), W(14, 8), W(16, 0)];
export const FLASH_AT = W(16, 0) - 2;
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].a <= f) i++; return i; };

const lerp3 = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const camAt = (f: number) => {
  const s = SHOTS[shotAt(f)], K = s.keys;
  let p = K[0].p, l = K[0].l, fov = K[0].fov;
  for (let i = 0; i + 1 < K.length; i++) {
    if (f >= K[i].f) {
      const t = smooth((f - K[i].f) / Math.max(1, K[i + 1].f - K[i].f));
      p = lerp3(K[i].p, K[i + 1].p, t); l = lerp3(K[i].l, K[i + 1].l, t); fov = K[i].fov + (K[i + 1].fov - K[i].fov) * t;
    }
  }
  // every hold creeps in (no static hold): push toward the look point
  const c = (s.creep ?? 0.0012) * (f - s.a);
  p = lerp3(p, l, Math.min(0.35, c));
  // flip-kick on impacts, decaying over 7 frames
  let kick = 0;
  for (const kf of KICKS) { const d = f - kf; if (d >= 0 && d < 7) kick += (d % 2 ? -1 : 1) * (1 - d / 7) * 0.22; }
  return { p, l: [l[0] + kick, l[1] + kick * 0.6, l[2]] as V, fov, roll: kick * 0.04 };
};

// ---------------- direction ----------------
type Sched = [number, number][];
const hatAt = (s: Sched, f: number) => {
  let n = s[0][1], since = 99;
  for (const [at, c] of s) if (f >= at) { since = c > n ? f - at : 99; n = c; }
  return { n, since };
};
const faceTo = (c: Char, x: number, z: number) => { c.root.rotation.y = Math.atan2(x - c.root.position.x, z - c.root.position.z); };
const place = (c: Char, v: V, look?: [number, number]) => { c.root.position.set(v[0], v[1], v[2]); if (look) faceTo(c, look[0], look[1]); };
const talking = (f: number, wins: [number, number][]) => wins.some(([a, b]) => f >= a && f < b) && ((f >> 2) & 1) === 0;
const blinkAt = (f: number, seed: number) => ((f + Math.floor(seed * 37)) % 67) < 3;
const rest = (c: Char) => { c.armL.rotation.set(0, 0, 0); c.armR.rotation.set(0, 0, 0); c.head.rotation.set(0, 0, 0); c.hips.rotation.set(0, 0, 0); c.hips.position.y = 0; c.legL.rotation.set(0, 0, 0); c.legR.rotation.set(0, 0, 0); };
const breathe = (c: Char, f: number, seed: number, frozen: boolean) => { if (!frozen) c.hips.position.y = Math.sin(f * 0.09 + seed) * 0.03; };

const TOWN: [number, number][] = [[-7, 0], [-9, -9.5], [-9, 6.5], [-8, 3.5], [12, 8], [-12, 9], [-14, 4], [20, 8], [-16, -2], [-18, -8], [-4, -10.5], [-6, -12], [-14, 14], [14, 15], [-22, 2], [-20, 12]];
const RING: [number, number][] = (() => {
  const out: [number, number][] = [];
  const angs = [200, 215, 232, 250, 268, 286, 304, 322, 338, 352, 165, 12, 185, 228, 300, 330];
  angs.forEach((a, i) => { const r = i < 12 ? 9 + (i % 3) * 1.4 : 13.5; const t = (a * Math.PI) / 180; out.push([4.6 + Math.cos(t) * r, -4.6 + Math.sin(t) * r]); });
  return out;
})();
const QUIET = [W(13, 0) - 2, W(14, 0) - 2];

export class Director {
  stickers: Sticker[] = [];
  constructor(public w: World) {
    const c = w.cast, R = w.root;
    const add = (s: Sticker) => { this.stickers.push(s); R.add(s.sprite); };
    add(makeSticker("+1", "#ffd21f", 1.0, W(0, 4), 26, () => c.fred.hatTop(4)));
    add(makeSticker("+1", "#ffd21f", 1.0, W(0, 13), 22, () => c.fred.hatTop(5)));
    add(makeSticker("+1", "#ffd21f", 1.0, W(1, 4), 24, () => c.baker.hatTop(6)));
    add(makeSticker("6", "#ffffff", 1.5, W(2, 4), 30, () => c.baker.hatTop(6).add(new THREE.Vector3(1.6, -1.5, 0))));
    add(makeSticker("19", "#ffffff", 2.0, W(2, 9), 40, new THREE.Vector3(-2.3, 11.5, -13.5)));
    add(makeSticker("-8", "#ff5a4a", 1.4, W(4, 8) + 4, 26, new THREE.Vector3(13.2, 10.5, -12.2)));
    add(makeSticker("0 LIES", "#7cf08a", 0.9, W(6, 5), 34, new THREE.Vector3(3.9, 7.0, -5)));
    add(makeSticker("???", "#ffd21f", 1.1, W(7, 6), 26, new THREE.Vector3(6.8, 8.3, -4.2)));
    add(makeSticker("...", "#ffffff", 1.0, W(10, 0), 22, new THREE.Vector3(3, 7.3, -5)));
    add(makeSticker("!!!", "#ff5a4a", 0.8, W(14, 2), 20, new THREE.Vector3(7.4, 7.0, -4.2)));
    add(makeSticker("+1", "#ffd21f", 0.75, W(17, 8), 26, new THREE.Vector3(3.9, 8.6, -5)));
  }

  update(f: number, cam: THREE.PerspectiveCamera) {
    const w = this.w, c = w.cast, si = shotAt(f), shot = SHOTS[si].name;
    const frozen = f >= QUIET[0] && f < QUIET[1];
    Object.values(c).forEach(rest); w.extras.forEach(rest); w.queue.forEach(rest);

    // ---- camera
    const ca = camAt(f);
    cam.position.set(...ca.p); cam.fov = ca.fov; cam.up.set(0, 1, 0); cam.lookAt(...ca.l);
    cam.rotateZ(ca.roll); cam.updateProjectionMatrix();

    // ---- hero + tower
    const early = f < SHOTS[3].a;
    place(c.hero, early ? ALLEY : H);
    c.hero.root.rotation.y = 0;
    c.hero.setHat(1);
    w.tower.visible = early || f >= SHOTS[15].a;
    w.tower.rotation.set(0, 0, 0);
    if (f >= FLASH_AT) { const t = f - FLASH_AT; w.tower.rotation.z = 0.018 * Math.sin(t * 0.16); w.tower.rotation.x = 0.012 * Math.sin(t * 0.11 + 1); }
    const topSince = f - W(17, 8);
    w.towerTopBlock.visible = topSince >= 0;
    if (topSince >= 0 && topSince < 6) { const s = [0.2, 0.7, 1.15, 1.18, 1.06, 1][topSince]; w.towerTopBlock.scale.set(s, s, s); } else w.towerTopBlock.scale.set(1, 1, 1);
    let he: Expr = "smug", htalk: [number, number][] = [];
    if (shot === "hero-except-me") he = "smug";
    if (shot === "hero-never") { he = "proud"; c.hero.armR.rotation.z = Math.PI * 0.86; c.hero.armL.rotation.z = -0.15; }
    if (si >= 6) faceTo(c.hero, P[0], P[2]);
    if (shot === "two-shot-pip") he = "smile";
    if (shot === "ots-pip" || shot === "insert-haircut") he = f > W(9, 0) ? "worried" : "neutral";
    if (shot === "hero-love-it") { he = "grin"; htalk = [[W(9, 3), W(9, 6)]]; c.hero.armR.rotation.x = -1.5; c.hero.armR.rotation.z = 0.2; }
    if (shot === "nothing") { he = "nervous"; c.hero.head.rotation.x = -0.15; }
    if (shot === "ots-mayor" || shot === "hero-of-course") { faceTo(c.hero, M[0], M[2]); he = "nervous"; htalk = [[W(12, 0), W(12, 2)]]; }
    if (shot === "quiet-wide") { faceTo(c.hero, M[0], M[2]); he = "nervous"; }
    if (shot === "pip-looks-up" || shot === "crane-up") { faceTo(c.hero, P[0], P[2]); he = "nervous"; }
    if (shot === "fall-down") { c.hero.root.rotation.y = 0.15; he = "nervous"; c.hero.head.rotation.x = 0.12; c.hero.armR.rotation.z = 0.5; c.hero.armR.rotation.x = -0.4; }
    if (shot === "pull-back") { c.hero.root.rotation.y = 0; he = "nervous"; }
    if (shot === "fourth-wall") {
      c.hero.root.rotation.y = 0; he = f >= W(17, 6) ? "wink" : "smug";
      c.hero.armL.rotation.z = -0.25; c.hero.armR.rotation.z = 0.25;
    }
    breathe(c.hero, f, 1, frozen);
    c.hero.setFace(he, talking(f, htalk), he !== "wink" && !frozen && blinkAt(f, 0.3));

    // ---- Fred (hook)
    place(c.fred, [-3, 0, 2]);
    c.fred.root.rotation.y = -0.45; // three-quarter toward the lens, talking to his neighbour
    const fh = hatAt([[0, 3], [W(0, 4), 4], [W(0, 13), 5]], f);
    c.fred.setHat(fh.n, fh.since, 0.05, f);
    c.fred.setFace(f > W(0, 13) ? "nervous" : "grin", talking(f, [[8, 40], [50, 70]]), blinkAt(f, 0.7));
    c.fred.armR.rotation.x = f < 75 ? -0.9 + Math.sin(f * 0.35) * 0.25 : 0; // the salesman gesture of a lie
    breathe(c.fred, f, 2, frozen);
    if (si >= 6) { const r = RING[11]; place(c.fred, [r[0], 0, r[1]], [H[0], H[2]]); c.fred.setFace(frozen || si >= 15 ? "shocked" : "suspicious", false, false); if (si >= 15) c.fred.head.rotation.x = -0.4; }

    // ---- baker
    place(c.baker, [-15, 0, -13], [-12.5, -4]);
    const bh = hatAt([[0, 5], [W(1, 4), 6]], f);
    c.baker.setHat(bh.n, bh.since, 0.06, f);
    c.baker.armR.rotation.x = -1.6; c.baker.armR.rotation.z = 0.3; // holding up the burnt loaf
    w.loaf.visible = true;
    c.baker.setFace(f < W(1, 4) ? "grin" : "proud", talking(f, [[W(1, 0) - 2, W(1, 3)]]), blinkAt(f, 0.2));
    breathe(c.baker, f, 3, frozen);
    if (si >= 6) {
      place(c.baker, [-1.6, 0, -9.2], [H[0], H[2]]); c.baker.armR.rotation.set(0, 0, 0); w.loaf.visible = false;
      c.baker.setFace(si >= 15 ? "shocked" : frozen ? "shocked" : "suspicious", false, blinkAt(f, 0.2) && !frozen);
      if (si >= 15) c.baker.head.rotation.x = -0.4;
    }

    // ---- mayor
    if (si < 6) place(c.mayor, [0, 0, -13.5], [1.6, -3]);
    else place(c.mayor, M, [H[0], H[2]]);
    c.mayor.setHat(19, 99, si >= 6 ? 0.12 : 0.1, f);
    let me: Expr = "smug";
    if (shot === "ots-mayor") { c.mayor.hips.rotation.x = 0.12; c.mayor.armR.rotation.x = -0.8; }
    if (frozen) me = "suspicious";
    if (si >= 15) { me = "shocked"; c.mayor.head.rotation.x = -0.45; }
    c.mayor.setFace(me, talking(f, [[W(11, 4), W(11, 8) + 8]]), blinkAt(f, 0.5) && !frozen);
    breathe(c.mayor, f, 4, frozen);

    // ---- Pip
    if (si >= 6) {
      place(c.pip, P, [H[0], H[2]]);
      c.pip.setHat(4, 99, 0.04, f);
      let pe: Expr = "suspicious", pt: [number, number][] = [];
      if (shot === "two-shot-pip") { c.pip.armL.rotation.set(0, 0, -0.55); c.pip.armR.rotation.set(0, 0, 0.55); }
      if (shot === "ots-pip") { pe = f >= W(8, 4) ? "proud" : "suspicious"; pt = [[W(8, 4), W(8, 8) + 10]]; if (f >= W(8, 4)) c.pip.armR.rotation.z = Math.PI * 0.9; if (f >= W(8, 1)) c.pip.hips.rotation.x = 0.1; }
      if (shot === "insert-haircut") { pe = "proud"; c.pip.armR.rotation.z = Math.PI * 0.9; }
      if (shot === "hero-love-it") pe = "proud";
      if (shot === "nothing") { pe = "suspicious"; c.pip.head.rotation.x = -0.25; }
      if (frozen) pe = "suspicious";
      if (shot === "pip-looks-up" && f >= W(14, 2) - 1) { pe = "awe"; c.pip.head.rotation.x = -0.45; }
      if (si >= 15) { pe = "shocked"; c.pip.head.rotation.x = -0.45; c.pip.armL.rotation.z = -2.4; c.pip.armR.rotation.z = 2.4; }
      c.pip.setFace(pe, talking(f, pt), !frozen && pe !== "shocked" && blinkAt(f, 0.9));
      breathe(c.pip, f, 5, frozen);
    } else place(c.pip, [60, 0, 60]);

    // ---- barber + queue
    place(c.barber, [17.4, 3.0, -13.8], [15.5, -12.6]);
    c.barber.setHat(2, 99, 0, f);
    const sawT = f - W(4, 8);
    c.barber.armR.rotation.z = Math.PI * 0.7; c.barber.armR.rotation.x = -0.4 + (sawT < 0 && f > SHOTS[2].a ? Math.sin(f * 0.9) * 0.25 : 0);
    c.barber.setFace("bored", false, blinkAt(f, 0.4));
    const cust = w.queue[0];
    place(cust, [15.4, 0, -12.6], [10, -12]);
    cust.setHat(sawT < 1 ? 14 : 6, 99, 0.08, f);
    cust.setFace(sawT < 1 ? "worried" : "smile", false, blinkAt(f, 0.6));
    [[11.6, -11.4, 9], [9.2, -11.0, 12], [6.8, -10.6, 10]].forEach(([x, z, n], i) => {
      const q = w.queue[i + 1]; place(q, [x, 0, z], [x + 4, z - 0.6]); q.setHat(n, 99, 0.09, f + i * 20); q.setFace("bored", false, blinkAt(f, 0.1 + i * 0.2)); breathe(q, f, 6 + i, frozen);
    });
    w.falling.forEach((b, i) => {
      const t = sawT - 1 - i * 1.5;
      if (t < 0 || t > 40) { b.visible = false; return; }
      b.visible = true;
      const y0 = 4 + 2.05 * 0 + 1.42 + 0.275 + (6 + i * 2) * 0.55;
      const y = Math.max(0.28, y0 - 0.5 * 0.045 * t * t);
      b.position.set(15.4 - 0.12 * t - i * 0.3, y, -12.6 + 0.08 * t + i * 0.2);
      b.rotation.set(y > 0.3 ? t * 0.09 : 0.3, 0, y > 0.3 ? t * 0.13 * (i % 2 ? 1 : -1) : 0.2 * i);
    });

    // ---- the town's people
    w.extras.forEach((e, i) => {
      const s = e.root.userData.seed as number;
      if (si < 6) {
        const [x, z] = TOWN[i];
        const a = f * 0.012 + s;
        place(e, [x + Math.cos(a) * 1.2, 0, z + Math.sin(a) * 1.2]);
        e.root.rotation.y = -a + Math.PI; // walking around a small loop
        const sw = Math.sin(f * 0.25 + s) * 0.45;
        e.legL.rotation.x = sw; e.legR.rotation.x = -sw; e.armL.rotation.x = -sw * 0.7; e.armR.rotation.x = sw * 0.7;
        e.hips.position.y = Math.abs(Math.cos(f * 0.25 + s)) * 0.08;
        e.setFace(i % 4 === 0 ? "bored" : i % 4 === 1 ? "smile" : i % 4 === 2 ? "neutral" : "smug", false, blinkAt(f, s));
      } else {
        const [x, z] = RING[i === 11 ? 15 : i];
        place(e, [x, 0, z], [H[0] + 1.5, H[2]]);
        let ee: Expr = i % 3 === 0 ? "suspicious" : i % 3 === 1 ? "neutral" : "bored";
        if (frozen) ee = "suspicious";
        if (si >= 15) { ee = i % 2 ? "shocked" : "awe"; e.head.rotation.x = -0.4; }
        if (si >= 17 && i % 4 === 0) { e.armL.rotation.z = -2.5; e.armR.rotation.z = 2.5; }
        e.setFace(ee, false, !frozen && si < 15 && blinkAt(f, s));
        breathe(e, f, s, frozen);
      }
      e.setHat(e.root.userData.hat, 99, 0.07, f + s * 10);
    });

    w.root.updateMatrixWorld(true);
    this.stickers.forEach((s) => poseSticker(s, f));
  }
}
