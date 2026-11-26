// One place, revisited (roblox-in-this-town: "places, not shots"): the town square with its bakery, town hall,
// barber and the people who belong there. Painted-toon look from cartoon-3d-short: two-tone shading, black ink,
// saturated sky gradient, fog = horizon colour.
import * as THREE from "three";
import { box, toon, sign, canvasTex, geo, ink, rng, INK } from "./kit";
import { Char, Look, HAT_H } from "./chars";

export const SKY_TOP = "#3e7fd2", SKY_HOR = "#b8d0ec";

const sky = () => {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY_TOP) }, hor: { value: new THREE.Color(SKY_HOR) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.02,0.0,1.0); gl_FragColor = vec4(mix(hor, top, pow(h,0.8)),1.0); }",
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m);
  s.renderOrder = -10;
  return s;
};

const cobbleTex = () => {
  const t = canvasTex(512, 512, (g) => {
    g.fillStyle = "#b9ab93"; g.fillRect(0, 0, 512, 512);
    const r = rng(7);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const ox = (y % 2) * 32, l = 200 + r() * 22;
      g.fillStyle = `rgb(${l},${l - 12},${l - 34})`;
      g.beginPath(); g.roundRect(x * 64 + ox + 4, y * 64 + 4, 56, 56, 12); g.fill();
    }
    g.strokeStyle = "rgba(60,50,40,0.55)"; g.lineWidth = 3;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { g.beginPath(); g.roundRect(x * 64 + (y % 2) * 32 - 60 + 64, y * 64 + 4, 56, 56, 12); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30);
  return t;
};

type B = { x: number; z: number; w: number; h: number; d: number; wall: string; roof: string; face: number };
const building = (root: THREE.Object3D, b: B, signText?: [string, string, string]) => {
  const g = new THREE.Group();
  g.position.set(b.x, 0, b.z); g.rotation.y = b.face;
  root.add(g);
  box(g, b.w, b.h, b.d, b.wall, 0, b.h / 2, 0, 0.06);
  box(g, b.w + 0.3, 0.5, b.d + 0.3, "#e9e0cc", 0, b.h + 0.25, 0, 0.05); // cornice
  box(g, b.w + 0.2, 0.7, b.d + 0.2, "#8d8273", 0, 0.35, 0, 0.05); // plinth
  // low gable roof: triangle (depth x rise) extruded along the building width
  const rd = b.d + 0.6, rise = b.d * 0.32, rw = b.w + 0.6;
  const sh = new THREE.Shape(); sh.moveTo(-rd / 2, 0); sh.lineTo(rd / 2, 0); sh.lineTo(0, rise); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: rw, bevelEnabled: false }); rg.center();
  const roof = new THREE.Mesh(rg, toon(b.roof));
  roof.rotation.y = Math.PI / 2; roof.position.set(0, b.h + 0.5 + rise / 2, 0); roof.castShadow = true;
  ink(roof, rd, rise, rw, 0.06);
  g.add(roof);
  const zf = b.d / 2 + 0.05;
  // windows: two upper rows, warm practical glow
  for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const x = (i - 1) * (b.w / 3.2), y = b.h * (0.55 + row * 0.25);
    box(g, 1.6, 2.0, 0.2, "#efe6d2", x, y, zf, 0.04);
    box(g, 1.2, 1.6, 0.12, toon("#ffcf7a", 0.35), x, y, zf + 0.08, false);
    box(g, 0.12, 1.6, 0.14, "#efe6d2", x, y, zf + 0.12, false);
  }
  // door
  box(g, 2.2, 3.4, 0.3, "#6b3f2a", 0, 1.7 + 0.7, zf, 0.05);
  box(g, 2.8, 0.3, 0.6, "#d8ccb4", 0, 0.85, zf + 0.25, 0.04);
  if (signText) sign(g, signText[0], signText[1], signText[2], Math.min(b.w - 1.5, 8), 1.8, 0, b.h * 0.36 + 1.6, zf + 0.15);
  return g;
};

const tree = (root: THREE.Object3D, x: number, z: number, s = 1) => {
  box(root, 0.8 * s, 3 * s, 0.8 * s, "#7a5233", x, 1.5 * s, z, 0.05);
  box(root, 3.4 * s, 2.4 * s, 3.4 * s, "#5f9e3d", x, 3.8 * s, z, 0.06);
  box(root, 2.2 * s, 1.6 * s, 2.2 * s, "#6fb048", x, 5.6 * s, z, 0.06);
};
const lamp = (root: THREE.Object3D, x: number, z: number) => {
  box(root, 0.3, 6, 0.3, "#2f3540", x, 3, z, 0.04);
  box(root, 0.9, 1, 0.9, toon("#ffd98a", 0.6), x, 6.4, z, 0.05);
  box(root, 1.1, 0.25, 1.1, "#2f3540", x, 7.0, z, 0.04);
};
const bench = (root: THREE.Object3D, x: number, z: number, ry: number) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
  box(g, 3.2, 0.25, 1, "#a8743f", 0, 1, 0, 0.04); box(g, 3.2, 0.8, 0.2, "#a8743f", 0, 1.6, -0.45, 0.04);
  box(g, 0.25, 1, 0.9, "#2f3540", -1.3, 0.5, 0, 0.03); box(g, 0.25, 1, 0.9, "#2f3540", 1.3, 0.5, 0, 0.03);
};

export const STONE = ["#d5c7a6", "#c3b38f"];
export const TOWER_N = 82;

const clockTex = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#d5c7a6"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#fbf6e8"; g.strokeStyle = INK; g.lineWidth = 12;
  g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fill(); g.stroke();
  g.lineWidth = 8;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(128 + Math.sin(a) * 82, 128 - Math.cos(a) * 82); g.lineTo(128 + Math.sin(a) * 94, 128 - Math.cos(a) * 94); g.stroke(); }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 62); g.stroke();
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(176, 150); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(128, 128, 10, 0, Math.PI * 2); g.fill();
});

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight;
  cast: Record<string, Char> = {};
  extras: Char[] = [];
  queue: Char[] = [];
  tower = new THREE.Group();     // the "clock tower": every lie the hero ever told, stacked on her head
  towerTopBlock: THREE.Mesh;
  falling: THREE.Mesh[] = [];
  saw = new THREE.Group();
  loaf = new THREE.Group();
  constructor() {
    const R = this.root;
    R.add(sky());
    const hemi = new THREE.HemisphereLight("#dfeeff", "#b49f80", 1.15); R.add(hemi);
    this.sun = new THREE.DirectionalLight("#fff3dc", 2.4);
    this.sun.position.set(28, 60, 42);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 70; sc.bottom = -50; sc.near = 1; sc.far = 220;
    this.sun.shadow.bias = -0.0008; this.sun.shadow.normalBias = 0.04;
    R.add(this.sun); R.add(this.sun.target);
    // ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshToonMaterial({ map: cobbleTex(), gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; R.add(ground);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon("#7fae55"));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; R.add(grass);

    // north row (faces +z): bakery, town hall, barber
    building(R, { x: -17, z: -23, w: 12, h: 11, d: 12, wall: "#e3d2a8", roof: "#b5523b", face: 0 }, ["BAKERY", "#f6ead0", "#8a3b22"]);
    building(R, { x: 0, z: -26, w: 14, h: 15, d: 14, wall: "#c98f6b", roof: "#4f5a7a", face: 0 }, ["TOWN HALL", "#2f3b5c", "#f6e7b8"]);
    building(R, { x: 17, z: -23, w: 12, h: 10, d: 12, wall: "#9fb8c9", roof: "#4b6b8a", face: 0 }, ["BARBER", "#f2f2f2", "#c0392b"]);
    // bakery awning + chalkboard + bread
    const aw = box(R, 9, 0.3, 3, "#c0563f", -17, 5.4, -15.6, 0.05); aw.rotation.x = 0.35;
    const cb = sign(R, "FRESH TODAY", "#2e3b33", "#f5f1e6", 3.0, 2.0, -12.0, 1.9, -14.5, -0.35, 62); cb.rotation.x = -0.12;
    box(R, 0.15, 1.2, 0.15, "#6b4a2b", -12.0, 0.6, -14.6, false);
    // town hall steps
    for (let i = 0; i < 3; i++) box(R, 10 - i * 1.2, 0.4, 1.4, "#cfc5b4", 0, 0.2 + i * 0.4, -18.2 - i * 0.7, 0.04);
    // barber pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3, 16), new THREE.MeshToonMaterial({
      map: canvasTex(64, 256, (g) => { g.fillStyle = "#fff"; g.fillRect(0, 0, 64, 256); g.fillStyle = "#d33a2c"; for (let i = -4; i < 12; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(64, i * 32 + 48); g.lineTo(64, i * 32 + 64); g.lineTo(0, i * 32 + 16); g.fill(); } }),
      gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap }));
    pole.position.set(11.6, 4, -16.6); pole.castShadow = true; ink(pole, 0.7, 3, 0.7, 0.04); R.add(pole);
    box(R, 1.8, 3.0, 1.4, "#3c3c46", 17.4, 1.5, -13.8, 0.05); // tall barber stool
    // east / west / south rows
    const walls = ["#e7c9a0", "#d9a98a", "#efe0bd", "#c7b48f", "#e6d2b5", "#b9c7a7"], roofs = ["#9c4a3a", "#566a8c", "#7a5a3c", "#a2573f"];
    for (let i = 0; i < 4; i++) {
      building(R, { x: -36, z: -12 + i * 13, w: 12, h: 9 + (i % 2) * 2.5, d: 10, wall: walls[i], roof: roofs[i % 4], face: Math.PI / 2 });
      building(R, { x: 36, z: -12 + i * 13, w: 12, h: 10 - (i % 2) * 2, d: 10, wall: walls[(i + 2) % 6], roof: roofs[(i + 1) % 4], face: -Math.PI / 2 });
    }
    for (let i = 0; i < 5; i++) building(R, { x: -28 + i * 14, z: 34, w: 13, h: 9 + (i % 3) * 1.8, d: 10, wall: walls[(i + 3) % 6], roof: roofs[(i + 2) % 4], face: Math.PI });
    // back rows (seen above roofs)
    for (let i = 0; i < 6; i++) building(R, { x: -40 + i * 16, z: -48, w: 14, h: 13 + (i % 3) * 3, d: 12, wall: walls[i % 6], roof: roofs[i % 4], face: 0 });
    [[-27, -10], [27, -10], [-27, 20], [27, 22], [-10, 26], [12, 27]].forEach(([x, z], i) => tree(R, x, z, 1 + (i % 2) * 0.2));
    [[-8, -12], [8, -12], [-14, 10], [14, 10]].forEach(([x, z]) => lamp(R, x, z));
    bench(R, -20, 6, Math.PI / 2); bench(R, 21, 4, -Math.PI / 2);
    // flower planters
    [[-6, -16], [6, -16]].forEach(([x, z]) => { box(R, 2.4, 1, 1.2, "#8d6b4a", x, 0.5, z, 0.04); box(R, 2.2, 0.6, 1.0, "#e0506a", x, 1.2, z, 0.04); });

    // --- cast ---
    const L = (o: Partial<Look>): Look => ({ skin: "#e8b48f", shirt: "#7d8a99", pants: "#3d4352", hair: "#3b2a20", hat: "#a07c5b", ...o });
    const c = this.cast;
    c.hero = new Char(L({ skin: "#b57a52", shirt: "#f2c230", pants: "#2f3a56", hair: "#1e1714", hairStyle: "pony", hat: STONE[0], hatW: 1.5 }), 1);
    c.pip = new Char(L({ skin: "#f0c7a2", shirt: "#3fae5a", pants: "#4a3f35", hair: "#d9752b", hairStyle: "messy", hat: "#3d8fd6" }), 6);
    c.baker = new Char(L({ skin: "#e9c09a", shirt: "#f4f1ea", pants: "#6b6f78", hair: "#6b5442", apron: "#ffffff", hat: "#fbfaf6", hat2: "#e9e4d8" }), 8);
    c.mayor = new Char(L({ skin: "#d9a07c", shirt: "#6a3d8f", pants: "#2b2433", hair: "#9a9a9a", sash: "#e2b33c", hat: "#4b2a66", hat2: "#5d3880" }), 20);
    c.barber = new Char(L({ skin: "#8d5a3b", shirt: "#e9eef2", pants: "#2f3a56", hair: "#151515", hat: "#c0392b", hat2: "#f0f0f0" }), 3);
    c.fred = new Char(L({ skin: "#f1c6a6", shirt: "#c46b4b", pants: "#4b5563", hair: "#7a4a2a", hat: "#3a6b5a" }), 8);
    Object.values(c).forEach((ch) => R.add(ch.root));
    // tower on the hero's head: blocks 2..N in stone, then the clock and the roof
    c.hero.hat.add(this.tower);
    for (let i = 1; i < TOWER_N; i++) box(this.tower, 1.5, HAT_H, 1.5, STONE[i % 2], 0, HAT_H / 2 + i * HAT_H, 0, 0.04);
    const ct = clockTex(), st = toon(STONE[0]);
    const cm = new THREE.MeshToonMaterial({ map: ct, gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap });
    const clock = new THREE.Mesh(geo(3.6, 3.6, 3.6), [cm, cm, st, st, cm, cm]);
    const yTop = TOWER_N * HAT_H;
    clock.position.y = yTop + 1.8; clock.castShadow = true; ink(clock, 3.6, 3.6, 3.6, 0.06);
    this.tower.add(clock);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.6, 4), toon("#7a3b34"));
    roof.rotation.y = Math.PI / 4; roof.position.y = yTop + 3.6 + 1.8; roof.castShadow = true; ink(roof, 4.4, 3.6, 4.4, 0.06);
    this.tower.add(roof);
    this.towerTopBlock = box(this.tower, 1.5, HAT_H, 1.5, STONE[0], 0, yTop + 7.6, 0, 0.04); // the "+1" at the very end
    // extras: the town's people, calm tones, each with their own lies
    const r = rng(42);
    const shirts = ["#8a9bb0", "#b08a7a", "#7f9c86", "#a99a7a", "#9a86a8", "#c0a070", "#7a8fa0", "#b0907f"];
    const skins = ["#f1c6a6", "#d9a07c", "#8d5a3b", "#e8b48f", "#b57a52", "#f0d0b0"];
    const hats = ["#5a6e8c", "#8c5a5a", "#5a8c6e", "#8c7a5a", "#6e5a8c", "#4f7f86"];
    for (let i = 0; i < 16; i++) {
      const e = new Char(L({ skin: skins[i % 6], shirt: shirts[i % 8], pants: ["#3d4352", "#4a3f35", "#2f3a56"][i % 3], hair: ["#3b2a20", "#151515", "#7a4a2a", "#c9a35a"][i % 4], hairStyle: i % 3 === 0 ? "pony" : "short", hat: hats[i % 6] }), 14);
      e.root.userData.hat = 2 + Math.floor(r() * 10);
      e.root.userData.seed = r() * 100;
      this.extras.push(e); R.add(e.root);
    }
    for (let i = 0; i < 4; i++) {
      const q = new Char(L({ skin: skins[(i + 2) % 6], shirt: shirts[(i + 3) % 8], hair: ["#151515", "#3b2a20"][i % 2], hat: hats[(i + 2) % 6], hat2: i === 0 ? "#71889c" : undefined }), 16);
      this.queue.push(q); R.add(q.root);
    }
    // props
    box(this.loaf, 1.2, 0.6, 0.7, "#2a1c14", 0, 0, 0, 0.04); box(this.loaf, 0.9, 0.18, 0.5, "#3a2a1e", 0, 0.36, 0, 0.03);
    c.baker.prop.add(this.loaf);
    box(this.saw, 0.25, 0.6, 0.35, "#7a4a2a", 0, 0, 0, 0.03);
    box(this.saw, 0.05, 0.5, 2.0, "#cfd6dc", 0, 0.05, 1.1, 0.03);
    c.barber.prop.add(this.saw);
    for (let i = 0; i < 4; i++) { const b = box(R, 1.36, HAT_H, 1.36, i % 2 ? "#71889c" : hats[2], 0, -10, 0, 0.04); this.falling.push(b); }
  }
}
