---
name: minecraft-story
description: Bikin video storytelling Minecraft format "In this world / In this town" (fiktif, wajib 2:15) dari analisa script referensi → script VO → skin karakter → storyboard + LAYOUT → Wave Produksi paralel (set, visual, kamera) → compile & cek → VO lock → take code-driven (Scarpet + BBS + ReplayMod) → render. Pakai saat user minta video cerita Minecraft "in this world/town".
---

# Minecraft Story — "In This World / In This Town"

Kamu adalah ORCHESTRATOR.
- **Step 1–5 berurutan**, satu agent sekali jalan.
- **Setelah GATE 5 jalan Wave Produksi paralel** (Step 6).
- Setiap GATE = berhenti, tunjukkan hasil, tunggu user bilang "lanjut" atau memberi revisi.

Baca `RULES.md` sebelum mulai. Baca `PIPELINE.md` sebelum Step 5. Baca `TOOLS.md` sebelum Step 8.

**Path absolut.** Semua script dipanggil dari folder skill:
`SKILL = ~/.claude/skills/minecraft-story` → `node SKILL/scripts/...`.
Jalankan dari root repo (tempat `projects/` dan `.rcon.json`).
Folder skill di tempat lain? `node <folder-skill>/scripts/install.mjs` menulis ulang path di agent yang dipasang; `SKILL` di dokumen ini = folder itu.

## Prinsip pipeline
1. **Yang bisa dikodekan, dikodekan.** World, blok, mob, prop, kamera, dan render berupa file + command.
2. **Satu shot = empat lapisan, satu pemilik per lapisan.**
   - Lapisannya: `shots/<shot>/{base,world,visual,camera}.json`.
   - `compile_shots.mjs` menggabungkannya jadi `shots/<shot>.json`, satu-satunya file yang dijalankan.
   - Hasil compile tidak pernah diedit tangan.
3. **Satu sistem koordinat.** `LAYOUT.json` (dari storyboard-director) memuat origin, bbox, arah depan, dan anchor bernama tiap set. Semua agent menunjuk posisi lewat anchor, bukan angka tebakan.
4. **Kepemilikan ketat.**
   - `ownership.json` mendefinisikan wilayah tiap agent.
   - Hook di frontmatter agent menolak tulisan di luar wilayah.
   - `check_ownership.mjs` mengaudit hasil setelah wave.
   - Butuh perubahan di luar wilayah → tulis ke `REQUESTS/`.
5. **Deterministik.** Gamerule dikunci, seed dicatat, animasi jalan di 20 tps, render 30 fps.
6. **VO dikunci sebelum take.** Key kamera memakai `t` 0..1, jadi timing VO hanya mengubah frame lewat compile ulang. Isi lapisan tidak perlu diubah.

## Struktur project (buat di awal)
```
projects/<slug>/
  refs/  FORMULA.md  SCRIPT.md  ORIGINALITY.md  CAST.md  assets/skins/
  SHOTLIST.md        # storyboard + SET LIST (storyboard-director)
  LAYOUT.json        # origin/bbox/front/anchor per set (storyboard-director) — BACA SAJA setelah GATE 5
  LOOK.md            # waktu/cuaca/cahaya/shader per scene (visual-director)
  shots/
    <shot>/base.json     # storyboard-director — BACA SAJA setelah GATE 5
    <shot>/world.json    # set-builder
    <shot>/visual.json   # visual-director
    <shot>/camera.json   # camera-director
    <shot>.json          # HASIL compile_shots.mjs — jangan edit
  sets/<set>/        # SPEC.md, <set>.mjs, build/<set>.mcfunction (set-builder untuk set itu)
  REQUESTS/          # <agent>__<topik>.md — permintaan lintas wilayah; orchestrator merangkum ke REQUESTS.md
  CONTINUITY.md      # hasil continuity-checker (ditulis orchestrator)
  .wave/             # snapshot.json, compile.json (dibuat script)
  scarpet/  captures/<shot>/  audio/  PUBLISH.md  MODLIST.txt
```

## Peta agent & model
| Step | Agent | Model | Tulis (MILIKKU) |
|---|---|---|---|
| 1 | formula-analyst | opus | FORMULA.md |
| 2 | script-writer | opus | SCRIPT.md |
| 3 | originality-checker | sonnet | ORIGINALITY.md |
| 5 | storyboard-director | sonnet | SHOTLIST.md, LAYOUT.json, shots/*/base.json |
| 6 | set-builder (×1 per set) | sonnet | sets/<set>/**, shots/<shot>/world.json (shot di set itu) |
| 6 | visual-director | sonnet | LOOK.md, shots/*/visual.json |
| 6 | camera-director | sonnet | shots/*/camera.json |
| 6 | continuity-checker | sonnet | — (Read/Glob/Grep saja; hasil di balasan) |
| 9 | packager-qa | haiku | PUBLISH.md, captions.srt, QA.md |
Step 0, 4, 7, 8 dikerjakan orchestrator.

**Agent harus terpasang.** File sumber ada di `SKILL/agents/`. Pasang dengan `node SKILL/scripts/install.mjs` (menyalin ke `~/.claude/agents/` dan menyesuaikan path hook), mulai sesi baru, lalu `node SKILL/scripts/doctor.mjs` → harus **0 FAIL**. Kalau agent tidak muncul sebagai tipe subagent atau path hook salah, kunci kepemilikan tidak jalan (tanpa peringatan). Jangan jalankan wave tanpa kunci.

**Subagent sonnet gagal?** Ulangi agent yang sama dengan `model: opus`. Jangan kerjakan lapisannya sendiri di orchestrator, karena itu melanggar kepemilikan.

---

## Step 0 — Intake
Tanya (sekaligus, singkat):
1. Script referensi (minimal 2, ideal 3–5). Simpan ke `refs/`.
2. Ide cerita / tema (atau "bebas" → nanti kasih 5 konsep).
3. Konfirmasi setup: Minecraft Java **1.20.1 + Fabric** + **dedicated server lokal** (RCON) + client terpisah. Lihat TOOLS.md §0.
4. Path produksi:
   - **P1 — Code-driven in-game (DEFAULT)**: Scarpet + BBS + ReplayMod.
   - **P2 — Hybrid**: P1 + Blender/MCprep untuk shot `[ANIM]`.
   - **P3 — Blender penuh.**
   - **P4 — Mine-imator** (mesin lemah).

## Step 0.5 — Setup stack (sekali per mesin)
Ikuti `TOOLS.md` §8:
1. Server 1.20.1 Fabric (Carpet + WorldEdit, `enable-rcon=true`), lalu tes `node SKILL/scripts/mc/rcon.mjs --check`.
2. Client 1.20.1 Fabric (Iris + BBS + ReplayMod + skin loader) → connect `localhost`.
3. Copy `SKILL/scripts/mc/scarpet/*.sc` ke `<server>/config/carpet/scripts/`.
4. Isi `.rcon.json` di root repo. World server: **superflat** (`level-type=minecraft\:flat`, `generate-structures=false`) supaya terrain asli tidak masuk bbox set.
5. **Kunci command freeze.** Di Carpet 1.20.1 `tick freeze` adalah TOGGLE dan `tick unfreeze` belum tentu ada. Di server: `/tick freeze status`, coba `/tick freeze on` dan `/tick freeze off`. Tulis yang berfungsi ke `.rcon.json`:
   `"tick_freeze": "tick freeze on", "tick_unfreeze": "tick freeze off"`. `shot.mjs` memakai dua key itu.
6. **Tes tiap app scarpet di game** (berdiri di area kosong, ganti koordinat dengan posisimu):
   - `/script load crowd` → `/script in crowd run wander('minecraft:villager',12,[x,y,z],8,2)` → 12 villager tersebar melingkar (bukan menumpuk) → `/script in crowd run clear()` → semua hilang.
   - `/script in crowd run march('minecraft:pillager',6,[x,y,z],[x+20,y,z],0.055)` → barisan bergerak ke +x dan menghadap arah jalan → `clear()`.
   - `/script load wall` → `/script in wall run ring_now([x,y,z],10,4,'minecraft:stone_bricks',1)` → lingkaran penuh.
   - `/script load env` → `/script in env run torches([x,y,z],[x+8,y,z+8],4)`.
   - `/script load actor` → summon 1 villager bernama `tes` → `/script in actor run follow('tes',[[x,y,z],[x+5,y,z]],0.06)`.
   Ada error di chat/log? Perbaiki app-nya dulu (catat di `scripts/mc/README.md`).
7. `node SKILL/scripts/doctor.mjs --rcon` → 0 FAIL.

Kalau langkah 5–7 gagal, jangan lanjut ke Step 8.

Cek pipeline tanpa server: `node SKILL/tests/run_tests.mjs` → harus "0 gagal".

## Step 1 — Analisa formula → `formula-analyst`
Hasilnya `FORMULA.md`: beat map + timing %, pola hook, ritme, device retensi, dan daftar JANGAN DITIRU. **GATE 1.**

## Step 2 — Konsep + Script → `script-writer`
1. 5 konsep (logline + aturan dunia + twist). **GATE 2a**: user pilih.
2. `SCRIPT.md` (format RULES §C). Cek dengan `node SKILL/scripts/word_count.mjs projects/<slug>/SCRIPT.md`. Target 347–368 kata (VO 2:10–2:14).
3. Tampilkan script English (KEY WORDS CAPS), terjemahan Indonesia, dan 3 judul.

## Step 3 — Cek transformative → `originality-checker`
Jalankan `node SKILL/scripts/overlap_check.mjs projects/<slug>/SCRIPT.md projects/<slug>/refs/`.
Gagal kalau: ada 6-gram yang sama, overlap 4-gram > 3%, atau premis/twist sama. Maksimal 2 loop revisi. **GATE 3** (script terkunci).

## Step 4 — Skin karakter (orchestrator)
1. Dari SCRIPT.md: karakter utama + peran + 1 kalimat visual. **Id aktor = slug nama** (`ruby`, `kid1`).
2. User upload skin PNG per karakter (nama file = id).
3. Validasi: `node SKILL/scripts/check_skin.mjs projects/<slug>/assets/skins/`.
4. Tulis `CAST.md`: id | file skin | nama fake player / aktor BBS | tipe arm | warna dominan | ciri yang harus kelihatan.
5. Pasang skin ke client (manual, sekali per karakter): untuk fake player lewat skin lokal CustomSkinLoader (file bernama nama fake player; lokasi folder: lihat dokumentasi CustomSkinLoader), untuk aktor BBS lewat form BBS. Nama fake player di CAST.md = nama yang dipakai visual-director (`"fake"`).

**GATE 4.**

## Step 5 — Storyboard + LAYOUT → `storyboard-director`
Hasilnya:
- `SHOTLIST.md`, termasuk **SET LIST** dengan zona berkoordinat.
- `LAYOUT.json`: origin, bbox, front, dan anchor `actor` / `landmark` / `cam_entry` per set. Jarak antar set ≥ 256 blok.
- `shots/<shot>/base.json` per shot.

Sebelum GATE 5, orchestrator menjalankan
`node SKILL/scripts/compile_shots.mjs projects/<slug> --partial --dry`.
Semua FAIL dengan label `LAYOUT` harus nol.

Tunjukkan ke user:
- tabel shot,
- daftar set + anchor,
- 3 shot paling sulit.

**GATE 5.** Setelah ini `LAYOUT.json`, `base.json`, `SHOTLIST.md`, `SCRIPT.md` dan `CAST.md` jadi BACA SAJA.

## Step 6 — Wave Produksi (paralel)
0. **Kunci aktif?** `node SKILL/scripts/doctor.mjs` → 0 FAIL. Kalau FAIL: `install.mjs`, sesi baru, ulangi.
1. **Snapshot**: `node SKILL/scripts/check_ownership.mjs projects/<slug> --snapshot`
2. **Spawn dalam SATU pesan**, semua `run_in_background`:
   - satu `set-builder` per set di LAYOUT (prompt baris pertama `SET: <set>`, lalu slug project),
   - satu `visual-director`,
   - satu `camera-director`.

   Prompt hanya berisi slug + (untuk set-builder) nama set. Semua aturan ada di file agent.
3. **Selama wave tidak ada yang mengirim command ke server**, termasuk orchestrator. Agent hanya menghasilkan file.
4. Setelah semua agent selesai:
   - `node SKILL/scripts/check_ownership.mjs projects/<slug> --verify`. Kalau FAIL, kembalikan file itu dan ulangi agent pemiliknya.
   - Rangkum `REQUESTS/*.md` ke `REQUESTS.md`. Setujui atau tolak tiap permintaan bersama user.
   - Permintaan yang disetujui dikerjakan oleh **pemilik file itu** (panggil ulang agentnya), bukan oleh peminta.
   - Perubahan LAYOUT/base berarti membuka lagi GATE 5 untuk file itu.
5. **Compile**: `node SKILL/scripts/compile_shots.mjs projects/<slug>`. Sebelum Step 7, timing masih estimasi.
   - Tiap FAIL menyebut file dan pemiliknya, jadi panggil ulang agent pemilik itu saja.
   - Maksimal 2 putaran, lalu tanya user.
6. **Continuity**: panggil `continuity-checker`. Tulis balasannya ke `CONTINUITY.md`, lalu kirim FAIL ke pemilik masing-masing (maksimal 2 putaran).
7. **GATE 6**: tunjukkan hasil compile (OK/WARN/FAIL per shot), tabel continuity, SPEC tiap set, dan REQUESTS terbuka.

## Step 7 — VO & timing lock (orchestrator)
1. Generate VO dari SCRIPT.md (minta OK user sebelum memakai kredit).
2. Ukur: `node SKILL/scripts/word_count.mjs projects/<slug>/SCRIPT.md --audio projects/<slug>/audio/vo.wav`. Target VO 2:10–2:14.
3. Tulis `audio/TIMING.md` (`| B01 | mulai | selesai | durasi |`, detik) dan `audio/words.json` (`[{w,s,e}]`) untuk `start_word`.
4. **Compile ulang**: `compile_shots.mjs projects/<slug>`. Sekarang `timing: "vo"` dan total harus tepat 4050 frame.
5. Musik + SFX list dari SHOTLIST.md (rekaman saja; tunjukkan daftar dulu). Musik ditaruh di `audio/music/`.
   `audio/mix.wav` = milik orchestrator: taruh mix buatan sendiri di situ, atau biarkan `assemble.mjs` (Step 9) membuatnya dari `vo.wav` + file pertama di `audio/music/`.

`TIMING.md` dan `words.json` harus dari timestamp kata audio asli (alignment, mis. Whisper word timestamps), bukan dibagi rata.

**GATE 7** (timing terkunci).

## Step 8 — Take & render (orchestrator, code-driven)
Detail di `PIPELINE.md` §4. Per shot:
1. Client berdiri di set shot itu (mode spectator). Set tidak perlu dibangun terpisah: `prep` memuat chunk (`forceload`) dan membangun set.
2. **Dry run**: `node SKILL/scripts/mc/shot.mjs projects/<slug>/shots/<shot>.json --dry`, lalu baca `captures/<shot>/commands.txt`.
3. **Prep**: `--run --only prep` (pre, build, actors, load). Dunia beku, set dan aktor siap, app scarpet ter-load.
   - Ada baris `ERR` atau "command GAGAL" → shot belum siap. Perbaiki penyebabnya, ulangi prep. Jangan lanjut ke take.
4. **Inspeksi framing** (manual, cepat): ketik perintah `/tp @s …` yang tercetak di `commands.txt` (posisi + yaw/pitch `camera.keys[0]`).
   - Salah → perbaiki di **lapisan pemiliknya**.
   - Lalu compile ulang dan ulangi langkah 3.
5. **Take**: mulai rekam ReplayMod → `--run --only take` (unfreeze, lalu scarpet) → tunggu `frames/30 + 1` detik → stop → `captures/<shot>/take01.mcpr`.
6. **Kamera**: ReplayMod camera path dari `camera.keys`: tiap key punya `pos`, `yaw`, `pitch` dan `f` (detik = f/30). Satu `fov` per shot, diatur di opsi game sebelum render.
7. **Render**: 1080×1920, 30 fps, shader aktif → `captures/<shot>/render.mp4`.
8. **Catat** satu baris di `captures/NOTES.md`.

Shot `[BBS]` dan `[ANIM]`: lihat PIPELINE.md §4b.

## Step 9 — Assembly (orchestrator) → Packaging & QA (`packager-qa`)
1. **Cek render**: `node SKILL/scripts/assemble.mjs projects/<slug> --check`. Tiap shot harus punya `render.mp4` 1080×1920 dengan jumlah frame ≥ `frames`. Shot FAIL → render ulang shot itu saja.
2. **Gabung + mux**: `node SKILL/scripts/assemble.mjs projects/<slug>` → `final.mp4`, tepat 4050 frame (2:15.0), audio dari `audio/mix.wav`. Laporan di `.wave/assemble.json`. Ganti nama file jadi judul upload setelah QA.
3. `packager-qa`: `PUBLISH.md`, `captions.srt`, `QA.md`. Caption green-screen pakai skill `captions` (selalu diserahkan).
