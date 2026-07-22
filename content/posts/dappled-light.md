---
title: Experiments in procedural dappled light shaders
date: 2026-06-01
tags:
  - technical
draft: true
---
*Experiments in WebGL, L-systems, and dithering*

For about two years the front page of this site ran [Sunlit](https://sunlit.pages.dev/), a pure CSS scene of light streaming through a window: blinds, a leaf shadow warped by an SVG turbulence filter, a sunrise and a sunset when you toggled the theme. It was built out of stacked `backdrop-filter` strips, and Chrome had a compositing quirk where pinch-zooming smeared the strips into a dark blotch over the whole page. I spent an evening trying to fix it from the CSS side, couldn't, and pulled the effect out entirely.

![[thoughts/images/sunlit.webm]]

That left the site plain, and left me a little restless. A bit after 1am I started on a replacement with a smaller footprint: not a whole-page effect but a single framed scene above the homepage article. A tree casting dappled light on a wall. Same width as the content, no more than 200 pixels tall, drawn only in theme colors.

---

The version on the [home page](/) now took about two days of iterating to land. What follows is the build log in order, with each intermediate stage rebuilt from git history and running live in this post. The sliders under some of them are lifted straight from the debug panel I used while tuning.


## two tones on a quad

The first version was the simplest thing that could plausibly read as leaves. One fullscreen triangle in raw WebGL, a fragment shader that thresholds a few octaves of value noise into blobs, and the blobs are the canopy. Light or shadow, decided per pixel.

The scene renders at half resolution and gets scaled back up with nearest-neighbor sampling, which is where the chunky pixel look comes from. Rather than antialiasing the grey midtones, I dither them. Each pixel compares its brightness against a fixed Bayer threshold pattern and snaps to either lit or shadow, so the grey never actually exists on screen. It's an illusion made of two colors and an ordered field of dots, the same trick a newspaper or an old Game Boy uses. Because the underlying render is low resolution, the dots are big and travel with the image instead of shimmering.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="1"></canvas></div>

## komorebi

It read as dappled light if you squinted, but it was flat. Real dappled light has a warm fringe where the sun blooms around the edge of a shadow, so I wanted a third color between the two, a gold. My first pass quantized brightness into three flat bands, and the gold sat there as a solid stripe:

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="2"></canvas></div>

Solid gold was wrong because the fringe isn't a region of the wall, it's a property of shadow edges. So the image stays two-tone at heart, and gold became a condition. A pixel can only go gold where the tone is mid-range *and* the brightness is actually changing, which I check with the local rate of change of the light. Flat interiors don't qualify. The gold also dithers on its own offset Bayer pattern instead of filling solid. All of this keeps it on the rims of soft shadows, which is where real backlit foliage catches the sun. Try pushing the band around:

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="3"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="0.8" step="0.01" value="0.45" data-dappled-param="goldLo" data-dappled-label="gold start"></label>
    <label><span></span><input type="range" min="0.2" max="0.95" step="0.01" value="0.7" data-dappled-param="goldHi" data-dappled-label="gold end"></label>
</div>

The palette never grew past these three. The light theme is a letterpress poster, deep navy on warm cream. The dark theme is a cyanotype, and there the fringe turns into a soft penumbra dimmer than the moonlit wall, because moonlight doesn't glow.

## model the tree, not the texture

By 2am the constants were fighting each other, every fix to the gold breaking the wind or the leaves. So I stopped tweaking and wrote down the thing I was actually trying to fake.

There's wind. It comes and goes in slow 20 to 30 second cycles, and moving your cursor raises a ceiling that the gusts ride under, so the scene stirs when you wave at it and settles when you stop. There's a tree: a trunk that barely moves, thick branches, thin branches, and leaves, each layer riding the same wind with its own elasticity, the sway accumulating down the tree so the tips flutter the most. And there's the wall. Each layer reports how much light gets through at a pixel and the layers multiply, because a shadow falling on a shadow should be darker, and because solid wood times anything stays solid, so the trunk never gets brightened by the dappling around it.

Writing it down also forced me to notice what the dithering actually was. How sharp a shadow is comes down to how far the thing casting it sits from the wall. The sun isn't a point, so a twig pressed against the wall throws a hard dark edge while a branch high overhead throws a soft faint one. Brightness, and therefore dithering, is purely a function of shadow sharpness. Each layer carries a blur value that is secretly a distance, and the dither *is* the penumbra.

The next morning I put every constant behind a debug panel that opens with the Konami code, fps chart, wind chart, a slider for everything, because you can't design a generative system by reading its source. You reshuffle it a few hundred times and watch. By 11am it was live on the site. The commit is called `DAPPLED LIGHT YUM`.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="4"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="3" step="0.05" value="1" data-dappled-param="windScale" data-dappled-label="wind"></label>
    <label><span></span><input type="range" min="0" max="1" step="0.02" value="0.8" data-dappled-param="blurW" data-dappled-label="leaves blur"></label>
    <button data-dappled-act="reseed">reseed</button>
</div>

The wind model survived every rewrite that came after. Move your mouse around quickly and the canopy stirs, stop and it eases back to the resting breeze.

## noise doesn't fork

I thought I was done. Then that evening I started isolating layers in the debug panel, and the branch layers alone look like this:

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="5"></canvas></div>

Not branches. Connective tissue. Nothing forks, nothing descends from a trunk, limbs float in the air attached to nothing. The branches were ridged noise, and I spent the rest of the night learning why no amount of tuning would save them.

If you threshold a 2D noise field you get patches, not lines, and patches don't read as branches. Voronoi cell edges looked promising because the edges form one connected web, but every edge encloses a cell, so the result is cracked mud or stained glass. A tree is the opposite of that. It's open, and it never closes a loop. Iso-contours of a smooth field gave me clean connected curves, but they run roughly parallel, like a topographic map, with no sense of a trunk shedding limbs. The closest I got was a kaleidoscopic fractal tree, the kind you fold out of space with `abs()` and a rotation each step, but it's bilaterally symmetric and its canopy is roughly square. The banner is a long thin letterbox, so I was only ever seeing a horizontal slice through the middle of the tree, which is almost all trunk.

The thing all of these miss is that a tree isn't a field. It's a structure with direction and lineage. Grow this way, then split into thinner children that do the same. Noise has no notion of a parent branch or a direction of growth, so there was never going to be a magic threshold that turned it into a tree. A little after midnight I gave up on noise.

## grow it on the CPU

Instead of asking the GPU to invent a tree per pixel, I grew one, once, in plain JavaScript, before drawing anything. A little turtle walks an L-system. It starts with a trunk and buds off thinner, shorter side branches as it goes, and it spits out a flat list of tapered segments. The shader's only job is to take that list and, for each pixel, find the distance to the nearest segment.

Splitting it this way is the whole trick. The structure lives in code I can read and tune, and the drawing is dumb and parallel and fast. Almost every good decision after this point came from being able to change the tree without touching the renderer.

A fractal tree and a real tree are not the same thing though, and the gap between them turned out to be two bits of actual plant biology.

The first is da Vinci's pipe model. He noticed that if you add up the thickness of all the branches at any height of a tree, you get roughly the thickness of the trunk. The modern version is that cross-sectional *area* is conserved across a fork, so two equal children are each about 0.71 times the parent's radius rather than half. I'd started with the naive version, conserving width directly, and the branches thinned so fast they died after a split or two. Conserving area instead lets a limb survive six or eight forks and taper gracefully down to a point.

The second is phyllotaxis. Plants tend to space successive branches and leaves around a stem by about 137.5 degrees, the golden angle, which is the most irrational angle there is and therefore the one that packs new growth so it shadows itself the least. I carry a phase down each branch that advances by that angle at every node, and a side shoot's placement comes from the cosine of that phase. Combined with letting the main limb keep the golden fraction of the area at each split, you get the particular rhythm real branches have, where the spacing is regular without ever being even. Drag the phyllotaxis slider to zero to let branches pick sides at random instead; it still works, but it loses the rhythm.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="6"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="1" step="0.05" value="1" data-dappled-param="golden" data-dappled-label="golden phyllotaxis"></label>
    <label><span></span><input type="range" min="0" max="0.8" step="0.02" value="0.3" data-dappled-param="curl" data-dappled-label="curl"></label>
    <button data-dappled-act="reshuffle">reshuffle tree</button>
</div>

That commit landed at 1am the second night. It's called `hella tweaks, thanks da vinci :)`.

## the tree is a volume

The next day was about depth, the part I'd been getting wrong the longest. I had been filling each branch with one flat shade, which made the thick limbs read as opaque cutouts. The fix follows from the penumbra idea that was already there: the shadow darkens across a band that widens with the caster's distance. A thick limb is wider than its band, so its core still reaches full dark while the edges lighten. A thin twig is narrower than its band, so its two edges blur into each other and it never fully darkens, and the fine stuff dissolves into a softer grey on its own. I stopped having to special-case thin branches at all.

Distance also isn't one number per tree, which is the other mistake I'd been carrying. A real tree is a volume. The trunk is a column somewhere in the middle and the branches reach both toward you and away, wrapping around it. So depth wanders as the tree grows: the trunk holds a central plane, the main limb stays near it, and the side branches drift forward and back each time they fork. A single tree then carries its own range of focus, some limbs crisp and dark because they happened to land near the wall, others hazy because they drifted behind it. The leaves sit furthest out, the softest layer of all.

The rest is plain art direction. There are a handful of scene types, light coming from the top, from one of the top corners, or from a bottom corner, and every tree in a given scene is rooted to the same side so it reads as one light source instead of a scatter. I anchor the main trunk near a rule-of-thirds line and leave the opposite side mostly open as sky. And the roots get pushed well past the edge of the frame, so the boring straight stretch of trunk happens off-screen and you only ever see the part that has already started to fork.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="7"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="0.9" step="0.05" value="0.4" data-dappled-param="depthDrift" data-dappled-label="depth drift"></label>
    <label><span></span><input type="range" min="0" max="1.6" step="0.02" value="0.9" data-dappled-param="rootOffset" data-dappled-label="root offset"></label>
    <button data-dappled-act="reshuffle">reshuffle tree</button>
</div>

## fin

The finished scene is on the [home page](/), growing a new tree on every load. If you want to take it apart yourself, the arrows still work: up up down down left right left right.

<script>
// Live demos of the shader's intermediate stages, reconstructed from git
// history (stages 4/6/7 are ports of committed code; 1-3/5 rebuild
// uncommitted states from the prompt logs). Runs entirely inside this post:
// each canvas tagged data-dappled-stage above gets its own tiny WebGL program.
// Initializes on Quartz's 'nav' event on a direct load of this page.
;(() => {
  if (window.__dappledIterDemos) return
  window.__dappledIterDemos = true

  const COMMON = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.55;
    for (int i = 0; i != 4; i++) { v += a * noise(p); p = p * 2.02 + 7.0; a *= 0.5; }
    return v;
  }
  float ridged(vec2 p){ return 1.0 - abs(2.0 * noise(p) - 1.0); }
  float ridgedFbm(vec2 p){
    float v = 0.0, a = 0.6;
    for (int i = 0; i != 4; i++) { v += a * ridged(p); a *= 0.5; p = p * 1.97 + 3.3; }
    return v;
  }
  float bayer4(vec2 c){
    int x = int(mod(c.x, 4.0));
    int y = int(mod(c.y, 4.0));
    int i = x + y * 4;
    float t = 5.0;
    if (i==0) t=0.0; else if (i==1) t=8.0; else if (i==2) t=2.0; else if (i==3) t=10.0;
    else if (i==4) t=12.0; else if (i==5) t=4.0; else if (i==6) t=14.0; else if (i==7) t=6.0;
    else if (i==8) t=3.0; else if (i==9) t=11.0; else if (i==10) t=1.0; else if (i==11) t=9.0;
    else if (i==12) t=15.0; else if (i==13) t=7.0; else if (i==14) t=13.0;
    return (t + 0.5) / 16.0;
  }
  float dec16(vec2 c){ return (c.x * 255.0 * 256.0 + c.y * 255.0) / 65535.0; }
  `

  const VERT = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`

  // stages 1-3: fbm blobs, three tone treatments
  const FRAG_BLOB = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA, uColorMid, uColorB;
  uniform float uMode;
  uniform float uLayers;
  uniform float uWind;
  uniform float uCenter;
  uniform float uGoldLo;
  uniform float uGoldHi;
  uniform vec2 uSeed;
  varying vec2 vUv;
  ${COMMON}
  float leafL(vec2 buv, float scale, vec2 disp, vec2 seed){
    float s = smoothstep(0.56, 0.44, fbm(buv * scale + disp + seed));
    return mix(1.0, 0.3, s);
  }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 buv = vec2(uv.x * aspect, uv.y);
    vec2 DIR = vec2(0.97, 0.22);
    float light;
    if (1.5 > uLayers) {
      vec2 d0 = DIR * uWind * (0.3 + 0.25 * sin(uTime * 1.3));
      light = leafL(buv, 8.0, d0, uSeed);
    } else {
      vec2 d1 = DIR * uWind * (0.10 + 0.08 * sin(uTime * 0.9 + 1.0));
      vec2 d2 = DIR * uWind * (0.22 + 0.18 * sin(uTime * 1.7 + 2.4));
      vec2 d3 = DIR * uWind * (0.34 + 0.30 * sin(uTime * 3.0 + 3.9));
      light = leafL(buv, 5.0, d1, uSeed)
            * leafL(buv, 8.5, d2, uSeed + vec2(37.0, 19.0))
            * leafL(buv, 13.0, d3, uSeed + vec2(13.0, 89.0));
      light = pow(light, 0.6) * 1.15;
    }
    light = clamp((light - 0.5) * 1.6 + uCenter + 0.07, 0.0, 1.0);
    float bayer = bayer4(gl_FragCoord.xy);
    vec3 col;
    if (0.5 > uMode) {
      col = step(bayer, light) > 0.5 ? uColorA : uColorB;
    } else if (1.5 > uMode) {
      float v = light + (bayer - 0.5) * 0.35;
      col = v > 0.62 ? uColorA : (v > 0.38 ? uColorMid : uColorB);
    } else {
      float bayerG = bayer4(gl_FragCoord.xy + vec2(2.0, 1.0));
      float lit = step(bayer, light);
      float goldMix = smoothstep(uGoldLo, uGoldHi, light) * smoothstep(0.015, 0.1, fwidth(light));
      vec3 dark = step(bayerG, goldMix) > 0.5 ? uColorMid : uColorB;
      col = lit > 0.5 ? uColorA : dark;
    }
    gl_FragColor = vec4(col, 1.0);
  }`

  // stages 4-5: port of commit 5f3a17a599 (DAPPLED LIGHT YUM)
  const FRAG_V1 = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform float uTime;
  uniform vec2 uDisp[4];
  uniform vec2 uResolution;
  uniform vec3 uColorA, uColorMid, uColorB;
  uniform float uContrast, uCenter, uGoldLo, uGoldHi, uCanopy;
  uniform vec4 uLayerOn;
  uniform vec4 uBlur;
  uniform float uDither;
  uniform vec2 uSeed;
  varying vec2 vUv;
  ${COMMON}
  float leafLayer(vec2 buv, float scale, vec2 disp, float b, vec2 seed){
    vec2 p = buv * scale + disp + seed;
    float soft = 0.05 + b * 0.30;
    float floorT = b * 0.45;
    float s = smoothstep(0.5 + soft, 0.5 - soft, fbm(p));
    return mix(1.0, floorT, s);
  }
  float branchLayer(vec2 buv, float scale, vec2 disp, float thick, float b, vec2 seed){
    vec2 p = buv * scale + disp + seed;
    p += (vec2(noise(p * 0.5 + 2.1), noise(p * 0.5 + 8.7)) - 0.5) * 1.6;
    mat2 R = mat2(0.86, -0.51, 0.51, 0.86);
    float r = ridgedFbm(R * p * vec2(1.0, 0.42));
    float soft = 0.03 + b * 0.22;
    float floorT = b * 0.45;
    float s = smoothstep(thick, thick + soft, r);
    return mix(1.0, floorT, s);
  }
  float trunkLayer(vec2 uv, vec2 disp, float thick, float b, vec2 seed){
    float lean = (noise(vec2(seed.y, uv.y * 0.6)) - 0.5) * 0.06;
    float x = uv.x + lean;
    float halfw = 0.015 + (1.0 - thick) * 0.05;
    float c0 = fract(sin(seed.x * 0.017 + 1.3) * 43758.5453);
    float c1 = fract(sin(seed.y * 0.023 + 4.7) * 43758.5453);
    float use2 = step(0.4, fract(sin(seed.x * 0.041) * 9871.0));
    float d = min(abs(x - c0), mix(10.0, abs(x - c1), use2));
    float s = 1.0 - smoothstep(halfw, halfw + 0.02 + b * 0.1, d);
    return mix(1.0, b * 0.45, s);
  }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 buv = vec2(uv.x * aspect, uv.y);
    float t = uTime;
    float l0 = mix(1.0, trunkLayer(uv, uDisp[0], 0.55, uBlur.x, uSeed), uLayerOn.x);
    float l1 = mix(1.0, branchLayer(buv, 3.4, uDisp[1], 0.78, uBlur.y, uSeed + vec2(37.0, 19.0)), uLayerOn.y);
    float l2 = mix(1.0, branchLayer(buv, 6.2, uDisp[2], 0.76, uBlur.z, uSeed + vec2(71.0, 43.0)), uLayerOn.z);
    float l3 = mix(1.0, leafLayer(buv, 11.0, uDisp[3], uBlur.w, uSeed + vec2(13.0, 89.0)), uLayerOn.w);
    float canopy = smoothstep(0.3, 0.7, fbm(buv * 0.4 + vec2(t * 0.01, 19.0) + uSeed + vec2(101.0, 57.0)));
    float bias = (canopy - 0.5) * uCanopy + (1.0 - uv.y) * 0.10 - uv.x * 0.05;
    float light = pow(l0 * l1 * l2 * l3, 0.6) * 1.3 + bias;
    light = clamp((light - 0.5) * uContrast + uCenter, 0.0, 1.0);
    float bayer = uDither > 0.5 ? bayer4(gl_FragCoord.xy) : 0.5;
    float bayerG = uDither > 0.5 ? bayer4(gl_FragCoord.xy + vec2(2.0, 1.0)) : 0.5;
    float lit = step(bayer, light);
    float goldMix = smoothstep(uGoldLo, uGoldHi, light) * smoothstep(0.015, 0.1, fwidth(light));
    float darkIsGold = step(bayerG, goldMix);
    vec3 dark = darkIsGold > 0.5 ? uColorMid : uColorB;
    vec3 col = lit > 0.5 ? uColorA : dark;
    gl_FragColor = vec4(col, 1.0);
  }`

  const LSYS_UNIFORMS = `
  uniform sampler2D uSegTex;
  uniform float uPosScale;
  uniform float uWidScale;
  uniform int uSegCount;
  uniform vec2 uLeafGrad;
  uniform float uLeafFall;
  uniform float uTime;
  uniform vec2 uDisp[4];
  uniform vec2 uResolution;
  uniform vec3 uColorA, uColorMid, uColorB;
  uniform float uContrast, uCenter, uGoldLo, uGoldHi, uCanopy;
  uniform vec4 uLayerOn;
  uniform vec4 uBlur;
  uniform float uDither;
  uniform vec2 uSeed;
  uniform float uParallax;
  uniform vec3 uFloor;
  varying vec2 vUv;`

  const TONE_MAP = `
    float bayer = uDither > 0.5 ? bayer4(gl_FragCoord.xy) : 0.5;
    float bayerG = uDither > 0.5 ? bayer4(gl_FragCoord.xy + vec2(2.0, 1.0)) : 0.5;
    float lit = step(bayer, light);
    float goldMix = smoothstep(uGoldLo, uGoldHi, light) * smoothstep(0.015, 0.1, fwidth(light));
    float darkIsGold = step(bayerG, goldMix);
    vec3 dark = darkIsGold > 0.5 ? uColorMid : uColorB;
    vec3 col = lit > 0.5 ? uColorA : dark;
    gl_FragColor = vec4(col, 1.0);`

  // stage 6: port of commit b6441d7ed2 (the da Vinci L-system rewrite)
  const FRAG_LSYS_V2 = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  #define MAXSEG 1024
  ${LSYS_UNIFORMS}
  ${COMMON}
  float branchLSystem(vec2 buv, vec2 disp){
    buv.x += uParallax * 0.04;
    buv += disp * 0.5;
    float d = 1e9;
    float nearW = 0.02;
    float nearDepth = 0.0;
    float rowScale = 1.0 / float(MAXSEG);
    for (int i = 0; i != MAXSEG; i++){
      if (i >= uSegCount) break;
      float row = (float(i) + 0.5) * rowScale;
      vec4 t0 = texture2D(uSegTex, vec2(0.5 / 4.0, row));
      vec4 t1 = texture2D(uSegTex, vec2(1.5 / 4.0, row));
      vec4 t2 = texture2D(uSegTex, vec2(2.5 / 4.0, row));
      vec2 a = vec2(dec16(t0.rg), dec16(t0.ba)) * uPosScale - 1.0;
      vec2 bb = vec2(dec16(t1.rg), dec16(t1.ba)) * uPosScale - 1.0;
      vec2 pa = buv - a, ba = bb - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      float r = mix(dec16(t2.rg), dec16(t2.ba), h) * uWidScale;
      float dist = length(pa - ba * h) - r;
      if (d > dist) {
        d = dist; nearW = r;
        nearDepth = dec16(texture2D(uSegTex, vec2(3.5 / 4.0, row)).rg);
      }
    }
    float soft = 0.003 + nearDepth * 0.05;
    float cover = 1.0 - smoothstep(0.0, soft, d);
    float thinness = 1.0 - smoothstep(0.004, 0.022, nearW);
    float darkness = max(thinness, nearDepth * 0.9);
    float floorT = mix(0.03, 0.32, darkness);
    return mix(1.0, floorT, cover);
  }
  float leafLayer(vec2 buv, float scale, vec2 disp, float b, vec2 seed, float cover){
    buv.x += uParallax * (0.15 + b) * 0.1;
    vec2 p = buv * scale + disp + seed;
    float soft = 0.05 + b * 0.30;
    float floorT = b * 0.38;
    float thr = mix(0.85, 0.48, cover);
    float s = smoothstep(thr + soft, thr - soft, fbm(p));
    return mix(1.0, floorT, s);
  }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 buv = vec2(uv.x * aspect, uv.y);
    float t = uTime;
    float l1 = mix(1.0, branchLSystem(buv, uDisp[1]), uLayerOn.y);
    float leafCover = clamp(0.55 + dot(uLeafGrad, uv - 0.5) * uLeafFall, 0.12, 1.0);
    float l3 = mix(1.0, leafLayer(buv, 11.0, uDisp[3], uBlur.w, uSeed + vec2(13.0, 89.0), leafCover), uLayerOn.w);
    float canopy = smoothstep(0.3, 0.7, fbm(buv * 0.4 + vec2(t * 0.01, 19.0) + uSeed + vec2(101.0, 57.0)));
    float modulate = 1.0 + (canopy - 0.5) * uCanopy + (1.0 - uv.y) * 0.10 - uv.x * 0.05;
    float light = pow(l1 * l3, 0.6) * 1.3 * modulate;
    light = clamp((light - 0.5) * uContrast + uCenter, 0.0, 1.0);
    ${TONE_MAP}
  }`

  // stage 7: port of the shader as it ships today
  const FRAG_FINAL = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  #define MAXSEG 1024
  ${LSYS_UNIFORMS}
  uniform float uLeafFollow;
  uniform float uTrunkCount;
  uniform vec2 uTrunkX;
  uniform float uTrunkW;
  ${COMMON}
  vec2 branchField(vec2 buv){
    buv.x += uParallax * 0.04;
    buv += uDisp[1] * 0.5;
    float d = 1e9;
    float nearDepth = 0.0;
    float rowScale = 1.0 / float(MAXSEG);
    for (int i = 0; i != MAXSEG; i++){
      if (i >= uSegCount) break;
      float row = (float(i) + 0.5) * rowScale;
      vec4 t0 = texture2D(uSegTex, vec2(0.5 / 4.0, row));
      vec4 t1 = texture2D(uSegTex, vec2(1.5 / 4.0, row));
      vec4 t2 = texture2D(uSegTex, vec2(2.5 / 4.0, row));
      vec2 a = vec2(dec16(t0.rg), dec16(t0.ba)) * uPosScale - 1.0;
      vec2 bb = vec2(dec16(t1.rg), dec16(t1.ba)) * uPosScale - 1.0;
      vec2 pa = buv - a, ba = bb - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      float r = mix(dec16(t2.rg), dec16(t2.ba), h) * uWidScale;
      float dist = length(pa - ba * h) - r;
      if (d > dist) {
        d = dist;
        nearDepth = dec16(texture2D(uSegTex, vec2(3.5 / 4.0, row)).rg);
      }
    }
    return vec2(d, nearDepth);
  }
  float branchShadow(float d, float nearDepth){
    float pen = 0.006 + nearDepth * 0.06;
    float shadow = 1.0 - smoothstep(-pen, pen, d);
    float umbra = mix(0.03, 0.34, nearDepth);
    return mix(1.0, umbra, shadow);
  }
  float leafLayer(vec2 buv, float scale, vec2 disp, float b, vec2 seed, float cover){
    buv.x += uParallax * (0.15 + b) * 0.1;
    vec2 p = buv * scale + disp + seed;
    float soft = 0.05 + b * 0.30;
    float floorT = b * 0.38;
    float thr = mix(0.85, 0.48, cover);
    float s = smoothstep(thr + soft, thr - soft, fbm(p));
    return mix(1.0, floorT, s);
  }
  float trunkLayer(vec2 uv, float thick, float b, float topRange){
    if (0.5 > uTrunkCount) return 1.0;
    float lean = (noise(vec2(uTrunkX.x * 41.0, uv.y * 0.6)) - 0.5) * 0.06;
    float x = uv.x + lean + uParallax * 0.015;
    float halfw = uTrunkW;
    float d = abs(x - uTrunkX.x);
    if (uTrunkCount > 1.5) d = min(d, abs(x - uTrunkX.y));
    float s = 1.0 - smoothstep(halfw, halfw + 0.02 + b * 0.1, d);
    float floorT = b * b * topRange;
    return mix(1.0, floorT, s);
  }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 buv = vec2(uv.x * aspect, uv.y);
    float t = uTime;
    vec2 bf = branchField(buv);
    float l0 = mix(1.0, trunkLayer(uv, 0.45, uBlur.x, uFloor.x), uLayerOn.x);
    float l1 = mix(1.0, branchShadow(bf.x, bf.y), uLayerOn.y);
    float leafCover = clamp(0.55 + dot(uLeafGrad, uv - 0.5) * uLeafFall, 0.12, 1.0);
    float leafDepth = mix(uBlur.w, clamp(bf.y + 0.2, 0.0, 1.0), uLeafFollow);
    float l3 = mix(1.0, leafLayer(buv, 11.0, uDisp[3], leafDepth, uSeed + vec2(13.0, 89.0), leafCover), uLayerOn.w);
    float canopy = smoothstep(0.3, 0.7, fbm(buv * 0.4 + vec2(t * 0.01, 19.0) + uSeed + vec2(101.0, 57.0)));
    float modulate = 1.0 + (canopy - 0.5) * uCanopy + (1.0 - uv.y) * 0.10 - uv.x * 0.05;
    float light = pow(l0 * l1 * l3, 0.6) * 1.3 * modulate;
    light = clamp((light - 0.5) * uContrast + uCenter, 0.0, 1.0);
    ${TONE_MAP}
  }`

  // L-system growth (CPU side); v2 and the current tree share this with a mode switch
  const MAXSEG = 1024
  const WIDSCALE = 0.1
  const mulberry32 = (a) => () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const SCENES = [
    { edges: [2], fx: 0.33, top: true, gx: 0, gy: 1 },
    { edges: [2, 0], fx: 0.33, top: true, gx: -0.7, gy: 0.7 },
    { edges: [2, 1], fx: 0.67, top: true, gx: 0.7, gy: 0.7 },
    { edges: [3, 1], fx: 0.67, top: false, gx: 0.7, gy: -0.7 },
    { edges: [3, 0], fx: 0.33, top: false, gx: -0.7, gy: -0.7 },
  ]
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v))

  function growTree(seed, tree, bw, bh) {
    const aspect = bw / Math.max(bh, 1)
    const pxPerUnit = bh
    const rng = mulberry32(seed)
    const segs = []
    const minW = tree.endPx / (2 * pxPerUnit)
    const GOLDEN = Math.PI * (3 - Math.sqrt(5))
    const drift = (depth, amt) =>
      0 >= amt ? depth : Math.min(0.98, Math.max(0.02, depth + (rng() - 0.5) * amt))
    const grow = (x, y, ang, width, curl, phase, depth) => {
      if (minW > width || segs.length >= MAXSEG) return
      const len = Math.min(width * tree.lenRatio, tree.maxLen) * (0.85 + rng() * 0.3)
      const a = ang + curl + (rng() - 0.5) * 0.05
      const ex = x + Math.cos(a) * len
      const ey = y + Math.sin(a) * len
      const wEnd = width * 0.97
      segs.push([x, y, ex, ey, width, wEnd, depth])
      const totalA = wEnd * wEnd * tree.conserve
      if (1 > tree.forkProb) {
        if (rng() >= tree.forkProb) {
          grow(ex, ey, a, Math.sqrt(totalA), curl, phase + GOLDEN, drift(depth, tree.depthDrift * 0.25))
          return
        }
      }
      const n = tree.split3 > rng() ? 3 : 2
      const leaderA = totalA * (tree.leader * (0.92 + rng() * 0.16))
      const wLeader = Math.sqrt(Math.min(totalA, leaderA))
      grow(ex, ey, a, wLeader, curl, phase + GOLDEN, drift(depth, tree.depthDrift * 0.25))
      let remA = Math.max(0, totalA - wLeader * wLeader)
      for (let k = 0; n - 1 > k; k++) {
        const ac = k === n - 2 ? remA : remA * (0.45 + rng() * 0.25)
        remA -= ac
        const wc = Math.sqrt(ac)
        if (minW > wc) continue
        const ph = phase + (k + 1) * GOLDEN
        const lat = tree.golden * Math.cos(ph) + (1 - tree.golden) * (rng() - 0.5) * 2
        const side = lat >= 0 ? 1 : -1
        const thin = 1 - Math.min(1, wc / Math.max(wEnd, 1e-6))
        const sa = a + side * (0.35 + thin * 0.55) + (rng() - 0.5) * 0.15
        grow(ex, ey, sa, wc, (rng() - 0.5) * tree.curl, ph, drift(depth, tree.depthDrift))
      }
    }
    const sceneIdx = tree.sceneType >= 0 ? Math.min(4, Math.round(tree.sceneType)) : Math.floor(rng() * SCENES.length)
    const scene = SCENES[sceneIdx]
    const tr = rng()
    const trunkCount = tree.trunks ? (0.4 > tr ? 0 : 0.8 > tr ? 1 : 2) : 0
    const trunkX0 = clampN(scene.fx + (rng() - 0.5) * 0.25, 0.05, 0.95)
    const trunkX1 = clampN(scene.fx + (rng() - 0.5) * 0.5, 0.05, 0.95)
    const trunkW = 0.008 + rng() * rng() * 0.03
    const off = tree.rootOffset
    const rootForEdge = (edge, depth) => {
      const spread = 0.1 + depth * 0.45
      const fx = clampN(scene.fx + (rng() - 0.5) * spread, 0.04, 0.96)
      if (edge === 2) return [fx * aspect, 1.0 + off, -Math.PI / 2 + (rng() - 0.5) * 0.6]
      if (edge === 3) return [fx * aspect, -off, Math.PI / 2 + (rng() - 0.5) * 0.6]
      const yc = scene.top ? 0.7 : 0.3
      const y = clampN(yc + (rng() - 0.5) * spread, 0.05, 0.95)
      if (edge === 0) return [-off, y, (rng() - 0.5) * 0.6]
      return [aspect + off, y, Math.PI + (rng() - 0.5) * 0.6]
    }
    const nTrees = Math.max(1, Math.round(tree.nTrees))
    for (let i = 0; nTrees > i; i++) {
      if (segs.length >= MAXSEG) break
      const edge = scene.edges[i % scene.edges.length]
      const role = nTrees > 1 ? i / (nTrees - 1) : 0
      const base = tree.depthMode === 'v2' ? role : clampN(0.12 + role * 0.4 + (rng() - 0.5) * 0.1, 0.04, 0.95)
      const [x, y, ang] = rootForEdge(edge, role)
      const w = tree.trunkWidth * (1 - role * 0.5) * (0.9 + rng() * 0.2)
      grow(x, y, ang, w, (rng() - 0.5) * tree.curl, rng() * Math.PI * 2, base)
    }
    return {
      segs,
      posScale: aspect + 2,
      leafG: [scene.gx, scene.gy],
      trunkCount,
      trunkX0,
      trunkX1,
      trunkW,
    }
  }

  function packSegs(gl, tex, data, res) {
    const enc = (v, off) => {
      const val = Math.max(0, Math.min(65535, Math.round(v * 65535)))
      data[off] = (val >> 8) % 256
      data[off + 1] = val % 256
    }
    data.fill(0)
    const ps = res.posScale
    const n = Math.min(res.segs.length, MAXSEG)
    for (let i = 0; n > i; i++) {
      const s = res.segs[i]
      const base = i * 16
      enc((s[0] + 1) / ps, base)
      enc((s[1] + 1) / ps, base + 2)
      enc((s[2] + 1) / ps, base + 4)
      enc((s[3] + 1) / ps, base + 6)
      enc(s[4] / WIDSCALE, base + 8)
      enc(s[5] / WIDSCALE, base + 10)
      enc(s[6], base + 12)
    }
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, MAXSEG, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
    return n
  }

  const V2_TREE = {
    sceneType: -1, nTrees: 6, trunkWidth: 0.035, lenRatio: 16, maxLen: 0.4,
    curl: 0.3, split3: 0.3, forkProb: 1, depthDrift: 0, leader: 0.618,
    golden: 1, conserve: 0.95, endPx: 0.5, rootOffset: 0.05,
    trunks: false, depthMode: 'v2',
  }
  const HEAD_TREE = {
    sceneType: -1, nTrees: 6, trunkWidth: 0.035, lenRatio: 16, maxLen: 0.4,
    curl: 0.3, split3: 0.3, forkProb: 0.7, depthDrift: 0.4, leader: 0.618,
    golden: 1, conserve: 0.95, endPx: 0.5, rootOffset: 0.9,
    trunks: true, depthMode: 'head',
  }

  // palette: read the site's komorebi vars so light/dark themes just work
  const hexToRgbDemo = (hex) => {
    let h = hex.trim().replace('#', '')
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const n = parseInt(h.slice(0, 6), 16)
    return [((n >> 16) % 256) / 255, ((n >> 8) % 256) / 255, (n % 256) / 255]
  }
  const cssColor = (name, fb) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name)
    return v.trim().startsWith('#') ? hexToRgbDemo(v) : hexToRgbDemo(fb)
  }
  const cssNumDemo = (name, fb) => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
    return isNaN(v) ? fb : v
  }
  const readColors = () => ({
    A: cssColor('--komorebi-light', '#f5eedd'),
    M: cssColor('--komorebi-mid', '#e89a39'),
    B: cssColor('--komorebi-shadow', '#233452'),
    center: cssNumDemo('--komorebi-center', 0.38),
  })

  const SCALE = 2
  const REST = 0.35
  const SENS = 5
  const BEND = [0.0, 0.05, 0.1, 0.36]
  const FLUT = [0.0, 0.03, 0.08, 0.42]
  const FREQ = [0.0, 0.7, 1.5, 3.2]
  const FPH = [0.0, 1.0, 2.4, 3.9]
  const DIR = [0.97, 0.22]
  const gust = (t) => 0.7 + 0.3 * (0.65 * Math.sin(t * 0.27) + 0.35 * Math.sin(t * 0.13 + 2.0))
  const cleanup = (fn) => (window.addCleanup ? window.addCleanup(fn) : void 0)

  function makeDemo(canvas, fragSrc, hooks) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return null
    gl.getExtension('OES_standard_derivatives')
    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error('[dappled-demos]', gl.getShaderInfoLog(sh))
      return sh
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error('[dappled-demos]', gl.getProgramInfoLog(prog))
    gl.useProgram(prog)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
    const locs = {}
    const loc = (n) => (n in locs ? locs[n] : (locs[n] = gl.getUniformLocation(prog, n)))
    const d = {
      canvas,
      gl,
      prog,
      bw: 1,
      bh: 1,
      visible: true,
      noiseSeed: [Math.random() * 1000, Math.random() * 1000],
      layerOn: [1, 1, 1, 1],
      params: { goldLo: 0.45, goldHi: 0.7, windScale: 1, blurW: 0.8 },
      disp: new Float32Array(8),
      u1f: (n, v) => gl.uniform1f(loc(n), v),
      u1i: (n, v) => gl.uniform1i(loc(n), v),
      u2f: (n, a, b) => gl.uniform2f(loc(n), a, b),
      u3fv: (n, v) => gl.uniform3f(loc(n), v[0], v[1], v[2]),
      u4f: (n, a, b, c, e) => gl.uniform4f(loc(n), a, b, c, e),
      u2fv: (n, v) => gl.uniform2fv(loc(n), v),
      draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
      frame: hooks.frame,
      onResize: hooks.onResize || null,
      resize() {
        const box = canvas.parentElement
        const cs = getComputedStyle(box)
        const w = Math.max(1, box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
        const h = Math.max(1, box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom))
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
        this.bw = Math.max(1, Math.round(w / SCALE))
        this.bh = Math.max(1, Math.round(h / SCALE))
        canvas.width = this.bw
        canvas.height = this.bh
        gl.viewport(0, 0, this.bw, this.bh)
        if (this.onResize) this.onResize(this)
      },
    }
    d.resize()
    if (hooks.init) hooks.init(d)
    return d
  }

  function setupLSys(d, treeOpts) {
    const gl = d.gl
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    d.segTex = tex
    d.texData = new Uint8Array(4 * MAXSEG * 4)
    d.treeSeed = Math.floor(Math.random() * 1e9)
    d.treeOpts = treeOpts
    d.rebuild = () => {
      d.tree = growTree(d.treeSeed, d.treeOpts, d.bw, d.bh)
      d.segCount = packSegs(gl, tex, d.texData, d.tree)
    }
    d.rebuild()
  }

  function init() {
    const canvases = Array.from(document.querySelectorAll('canvas[data-dappled-stage]')).filter(
      (c) => c.dataset.init !== 'true',
    )
    if (canvases.length === 0) return
    canvases.forEach((c) => (c.dataset.init = 'true'))

    let colors = readColors()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const demos = []
    const cumulativeDisp = (t, wind, out) => {
      let s = 0
      for (let i = 0; 4 > i; i++) {
        s += wind * (BEND[i] + FLUT[i] * Math.sin(t * FREQ[i] + FPH[i]))
        out[2 * i] = DIR[0] * s
        out[2 * i + 1] = DIR[1] * s
      }
    }

    const lsysCommonUniforms = (d, t, env) => {
      cumulativeDisp(t, env.wind * d.params.windScale, d.disp)
      d.u1f('uTime', t)
      d.u2f('uResolution', d.bw, d.bh)
      d.u2fv('uDisp[0]', d.disp)
      d.u3fv('uColorA', colors.A)
      d.u3fv('uColorMid', colors.M)
      d.u3fv('uColorB', colors.B)
      d.u1f('uContrast', 1.6)
      d.u1f('uCenter', colors.center)
      d.u1f('uGoldLo', d.params.goldLo)
      d.u1f('uGoldHi', d.params.goldHi)
      d.u1f('uCanopy', 1.2)
      d.u1f('uDither', 1)
      d.u2f('uSeed', d.noiseSeed[0], d.noiseSeed[1])
      d.gl.activeTexture(d.gl.TEXTURE0)
      d.gl.bindTexture(d.gl.TEXTURE_2D, d.segTex)
      d.u1i('uSegTex', 0)
      d.u1f('uPosScale', d.tree.posScale)
      d.u1f('uWidScale', WIDSCALE)
      d.u1i('uSegCount', d.segCount)
      d.u2f('uLeafGrad', d.tree.leafG[0], d.tree.leafG[1])
      d.u1f('uLeafFall', 1.4)
    }

    const blobFrame = (mode, layers) => (d, t, env) => {
      d.u1f('uTime', t)
      d.u2f('uResolution', d.bw, d.bh)
      d.u3fv('uColorA', colors.A)
      d.u3fv('uColorMid', colors.M)
      d.u3fv('uColorB', colors.B)
      d.u1f('uCenter', colors.center)
      d.u1f('uGoldLo', d.params.goldLo)
      d.u1f('uGoldHi', d.params.goldHi)
      d.u1f('uMode', mode)
      d.u1f('uLayers', layers)
      d.u1f('uWind', env.wind * d.params.windScale)
      d.u2f('uSeed', d.noiseSeed[0], d.noiseSeed[1])
      d.draw()
    }
    const v1Frame = (d, t, env) => {
      cumulativeDisp(t, env.wind * d.params.windScale, d.disp)
      d.u1f('uTime', t)
      d.u2f('uResolution', d.bw, d.bh)
      d.u2fv('uDisp[0]', d.disp)
      d.u3fv('uColorA', colors.A)
      d.u3fv('uColorMid', colors.M)
      d.u3fv('uColorB', colors.B)
      d.u1f('uContrast', 1.6)
      d.u1f('uCenter', colors.center)
      d.u1f('uGoldLo', d.params.goldLo)
      d.u1f('uGoldHi', d.params.goldHi)
      d.u1f('uCanopy', 1.2)
      d.u4f('uLayerOn', d.layerOn[0], d.layerOn[1], d.layerOn[2], d.layerOn[3])
      d.u4f('uBlur', 0.0, 0.12, 0.35, d.params.blurW)
      d.u1f('uDither', 1)
      d.u2f('uSeed', d.noiseSeed[0], d.noiseSeed[1])
      d.draw()
    }

    const STAGES = {
      1: (c) => makeDemo(c, FRAG_BLOB, { frame: blobFrame(0, 1) }),
      2: (c) => makeDemo(c, FRAG_BLOB, { frame: blobFrame(1, 3) }),
      3: (c) => makeDemo(c, FRAG_BLOB, { frame: blobFrame(2, 3) }),
      4: (c) => makeDemo(c, FRAG_V1, { frame: v1Frame }),
      5: (c) =>
        makeDemo(c, FRAG_V1, {
          init: (d) => (d.layerOn = [0, 1, 1, 0]),
          frame: v1Frame,
        }),
      6: (c) =>
        makeDemo(c, FRAG_LSYS_V2, {
          init: (d) => setupLSys(d, Object.assign({}, V2_TREE)),
          onResize: (d) => { if (d.rebuild) d.rebuild() },
          frame: (d, t, env) => {
            lsysCommonUniforms(d, t, env)
            d.u4f('uLayerOn', 0, 1, 0, 1)
            d.u4f('uBlur', 0.0, 0.12, 0.35, 0.45)
            d.u1f('uParallax', env.parallax)
            d.u3fv('uFloor', [0.1, 0.4, 0.7])
            d.draw()
          },
        }),
      7: (c) =>
        makeDemo(c, FRAG_FINAL, {
          init: (d) => setupLSys(d, Object.assign({}, HEAD_TREE)),
          onResize: (d) => { if (d.rebuild) d.rebuild() },
          frame: (d, t, env) => {
            lsysCommonUniforms(d, t, env)
            d.u4f('uLayerOn', 1, 1, 0, 1)
            d.u4f('uBlur', 0.0, 0.12, 0.35, 0.45)
            d.u1f('uParallax', env.parallax)
            d.u3fv('uFloor', [0.1, 0.4, 0.7])
            d.u1f('uLeafFollow', 0.6)
            d.u1f('uTrunkCount', d.tree.trunkCount)
            d.u2f('uTrunkX', d.tree.trunkX0, d.tree.trunkX1)
            d.u1f('uTrunkW', d.tree.trunkW)
            d.draw()
          },
        }),
    }

    for (const c of canvases) {
      const make = STAGES[c.dataset.dappledStage]
      if (!make) continue
      const d = make(c)
      if (!d) continue
      demos.push(d)

      const frame = c.parentElement
      const sib = frame ? frame.nextElementSibling : null
      const fig = sib ? (sib.classList.contains('dappled-controls') ? sib : null) : null
      if (fig) {
        fig.querySelectorAll('[data-dappled-act]').forEach((el) => {
          const act = el.dataset.dappledAct
          if (act === 'reseed')
            el.addEventListener('click', () => {
              d.noiseSeed = [Math.random() * 1000, Math.random() * 1000]
              if (reduce) drawAll()
            })
          if (act === 'reshuffle')
            el.addEventListener('click', () => {
              d.treeSeed = Math.floor(Math.random() * 1e9)
              if (d.rebuild) d.rebuild()
              if (reduce) drawAll()
            })
        })
        fig.querySelectorAll('input[data-dappled-param]').forEach((sl) => {
          const key = sl.dataset.dappledParam
          const span = sl.parentElement ? sl.parentElement.querySelector('span') : null
          const setLabel = (v) => {
            if (span) span.textContent = (sl.dataset.dappledLabel || key) + ': ' + v.toFixed(2)
          }
          setLabel(parseFloat(sl.value))
          sl.addEventListener('input', () => {
            const v = parseFloat(sl.value)
            setLabel(v)
            if (d.treeOpts) {
              if (d.treeOpts[key] !== undefined) {
                d.treeOpts[key] = v
                if (d.rebuild) d.rebuild()
              } else {
                d.params[key] = v
              }
            } else {
              d.params[key] = v
            }
            if (reduce) drawAll()
          })
        })
      }
    }
    if (demos.length === 0) return

    let ceiling = REST
    let ceilingTarget = REST
    let parallax = 0
    let parallaxTarget = 0
    let lastX = 0
    let lastY = 0
    let lastT = 0
    const onMove = (e) => {
      const now = e.timeStamp
      if (lastT) {
        const dtm = now - lastT
        if (dtm > 0) {
          const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dtm
          ceilingTarget = Math.min(1, Math.max(ceilingTarget, speed / SENS))
        }
      }
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
      parallaxTarget = (e.clientX / window.innerWidth - 0.5) * 2
    }
    const onTilt = (e) => {
      if (e.gamma != null) parallaxTarget = Math.max(-1, Math.min(1, e.gamma / 35))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('deviceorientation', onTilt)

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const d = demos.find((x) => x.canvas === en.target)
          if (d) d.visible = en.isIntersecting
        }
      },
      { rootMargin: '100px' },
    )
    demos.forEach((d) => io.observe(d.canvas))

    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        demos.forEach((d) => {
          d.gl.useProgram(d.prog)
          d.resize()
        })
        if (reduce) drawAll()
      }, 120)
    }
    window.addEventListener('resize', onResize)

    const onTheme = () => {
      colors = readColors()
      if (reduce) drawAll()
    }
    document.addEventListener('themechange', onTheme)

    let tGlobal = 0
    let prevMs = 0
    let raf = 0
    let running = true
    const drawAll = () => {
      for (const d of demos) {
        d.gl.useProgram(d.prog)
        d.frame(d, tGlobal, { wind: REST, parallax: 0 })
      }
    }
    const loop = (ms) => {
      const dt = prevMs ? Math.min(0.05, (ms - prevMs) / 1000) : 0.016
      prevMs = ms
      tGlobal += dt
      ceilingTarget = Math.max(REST, ceilingTarget * 0.97)
      ceiling += (ceilingTarget - ceiling) * (ceilingTarget > ceiling ? 0.02 : 0.05)
      parallax += (parallaxTarget - parallax) * 0.08
      const wind = gust(tGlobal) * ceiling
      for (const d of demos) {
        if (!d.visible) continue
        d.gl.useProgram(d.prog)
        d.frame(d, tGlobal, { wind, parallax })
      }
      if (running) raf = requestAnimationFrame(loop)
    }
    if (reduce) drawAll()
    else raf = requestAnimationFrame(loop)

    cleanup(() => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onTilt)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('themechange', onTheme)
      demos.forEach((d) => {
        const ext = d.gl.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      })
    })
  }

  document.addEventListener('nav', init)
  if (document.readyState === 'complete' || document.readyState === 'interactive') init()
})()
</script>
