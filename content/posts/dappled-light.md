---
title: Experiments in procedural dappled light shaders
date: 2026-08-02
tags:
  - technical
draft: false
socialImage: ../thoughts/images/dappled-og.png
---
One of my personal philosophies is that [[thoughts/websites as homes|one's personal site should feel like a digital home]]. As someone who stops to enjoy the light a lot, I felt it was very important that my digital home have nice lighting too. For a long time, I had this dappled light effect on my website [that I made and open-sourced](https://github.com/jackyzha0/sunlit).

<video class="lazy" data-src="/thoughts/images/sunlit.webm" autoplay loop muted></video>

At some point though, I noticed that if I zoomed in any amount on Chrome, there was a CSS compositing bug which would render a strange black gradient over the whole site. I tried for a few hours to resolve it but found no success and so decided to rip it out entirely.

This left my site feeling a little too flat and soulless. The time was 1am, and a brief scroll through my Pinterest and Google Photos gave me ample inspiration as to where to take the site next.

![[thoughts/images/new-website-inspo.png]]

I was thinking something with the bold colors of late 90s print tests, but with the soul of komorebi (木漏れ日, sunlight filtering through the leaves). I found a lot of inspiration in the digital homes of [Katherine](https://kayserifserif.place/), [Henry](https://henry.codes/), and [Michael](https://www.mek.gallery/).

---

## Noise and dithering

The first revision was mostly figuring out how to get something that looked like shadows of leaves and trees. I thought that having thresholded Perlin noise in multiple octaves would provide a good approximation of a canopy and went with that.

The problem is that at too high of a resolution, the blobs look way too... blob-like. I decided to purposefully render the canvas at a much lower resolution with `image-rendering: pixelated;` and dither the colorspace to give it that pixel-art bit-crunch aesthetic.

![[thoughts/images/bayer.png]]

To make it feel more alive, I added some wind, which was some simple translation that varied by the noise octave, so the scene stirs when you wave at it and settles when you stop.


<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="1"></canvas></div>


## Golden warm fringe

If you squinted, it did _kind of_ look like dappled light. When I looked at my references though, it felt flat in comparison.

The main thing was that real dappled light has a warm 'fringe' where the sun blooms around the edge of a shadow. I wanted a third color between the two tones to provide that effect. My first pass used a small band of solid gold.


<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="2"></canvas></div>


The more I looked though, the more solid gold felt wrong. I realized then that the color was more of a *coloring property*. So I instead changed the shader to color *post-dithering* and to only be gold if the tone is mid-range and there is a sharp gradient between light and dark (i.e., only fringes and no interiors).


<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="3"></canvas></div>

<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="0.8" step="0.01" value="0.45" data-dappled-param="goldLo" data-dappled-label="gold start"></label>
    <label><span></span><input type="range" min="0.2" max="0.95" step="0.01" value="0.7" data-dappled-param="goldHi" data-dappled-label="gold end"></label>
</div>

## Noise and L-Systems

The colors mostly looked fine but the structure was still too disorganized and chaotic. It just looked like noise. It lacked the components a real tree has; there was no discernible trunk, branches, or leaves.

How do we encode that procedurally? My first attempt tried to recreate those using the same noise primitives. I stretched the 'trunk' noise heavily in the `y` direction and skewed the noise in the branch layers.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="4"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="3" step="0.05" value="1" data-dappled-param="windScale" data-dappled-label="wind"></label>
    <label><span></span><input type="range" min="0" max="1" step="0.02" value="0.8" data-dappled-param="blurW" data-dappled-label="leaves blur"></label>
    <button data-dappled-act="reseed">reseed</button>
</div>


It still didn't feel right. Especially when looking at just some of the layers isolated by themselves, it looked more like connective tissue than trees and branches.

If you threshold a 2D noise field, you get patches. I thought Voronoi cell edges could be an interesting way to represent the branches because they form a web, but it instead looked more like cracked mud. It felt like no amount of pure fragment shader-based approaches would approximate a real tree.

I did a bit of digging to see what prior art existed for generative tree shaders and came across the concept of L-systems which are recursive systems that allow the natural expression of organic and fractal-like forms.

It is commonly defined as $G = (V, \omega, P)$, where:

- $V$ is the alphabet containing the set of symbols containing elements that can be replaced (variables) and those which cannot (terminal values).
- $\omega$ is the initial state composed of a string of symbols from $V$.
- $P$ is a set of production rules defining how variables can be replaced with combinations of variables and terminal values.

For example, the definition of a fractal plant (called the [Barnsley Fern](https://en.wikipedia.org/wiki/Barnsley_fern)) is as follows:

```plaintext
variables: X, F
constants: +, -, [, ]
start:     -X

rules:
(X -> F+[[X]-X]-F[-FX]+X)
(F -> FF)
```

And then rendering the plant is iterating rule application some number of times, then feeding the resulting string through a function to interpret or map it[^1].

[^1]: The Barnsley Fern is rendered via a stack. `F` draws forward, `-` turns right 25 degrees, `+` turns left 25 degrees, `X` is a noop, `[` pushes the current position and angle to the stack, and `]` pops the top of the stack.

![Barnsley Fern|300](https://upload.wikimedia.org/wikipedia/commons/4/4b/Fractal_Farn.gif)

I chose to implement a probabilistic grammar for the tree generation that produced what felt more like natural branch splitting.

```plaintext
variables: X, F
constants: +, -, [, ]
start:     X

rules:
(X -> FX)            p = 0.30    leader extends, no fork
(X -> F[+X]X)        p = 0.245   fork: leader + one side branch
(X -> F[-X]X)        p = 0.245
(X -> F[+X][-X]X)    p = 0.21    fork: leader + two side branches
```

Unlike most L-systems though, this algorithm continues unrolling until all branches hit a terminal width. The output is a string of symbols which we can write as a list of branch/trunk segments. Then, the fragment shader just takes the resulting list of segments and, for each pixel, renders the color based on the distance to the nearest segment. I kept the leaf layer as thresholded noise.

## da Vinci and the Golden Ratio

As with many L-systems though, getting it to look somewhat convincing took a brief foray into plant biology.

da Vinci noticed that if you add up the thickness of all the branches at any height of a tree, you get roughly the thickness of the trunk. The modern version is that cross-sectional *area* is conserved across a fork. Following this rule helps us get much more natural-looking branch splits.

![[thoughts/images/davinci-pipe.png]]

It also turns out that the golden ratio sneaks its way into this. Real trees don't alternate sides in a strict left-right-left-right pattern. Successive buds emerge rotated ~137.5° around the stem in a spiral arrangement called [phyllotaxis](https://en.wikipedia.org/wiki/Phyllotaxis). Because the golden ratio is irrational, it guarantees that no two leaves ever follow the same radial line from center to edge.

We can get a 2D approximation of this effect by keeping a running angle per branch, advancing it by the golden angle at each fork, and then using the cosine of the angle to pick the side. This produces an alternation that drifts between left and right without ever settling into a repeating pattern.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="6"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="1" step="0.05" value="1" data-dappled-param="golden" data-dappled-label="golden phyllotaxis"></label>
    <label><span></span><input type="range" min="0" max="0.8" step="0.02" value="0.3" data-dappled-param="curl" data-dappled-label="curl"></label>
    <label><span></span><input type="range" min="0.4" max="1.6" step="0.01" value="0.95" data-dappled-param="conserve" data-dappled-label="volume carry"></label>
    <label><span></span><input type="range" min="1" max="16" step="1" value="12" data-dappled-param="maxIter" data-dappled-label="iterations"></label>
    <button data-dappled-act="reshuffle">reshuffle tree</button>
</div>

## Adding depth

Now that the biology was mostly okay, it became important to start focusing on the composition of the scene.

One of the biggest simplifications I made early on was assuming that each layer had a singular individual depth-value (kind of like a `z-index`).

A tree is a volume. The trunk is a column somewhere in the middle, and the branches reach both toward you and away, wrapping around it. When rendered, this depth should come through in the brightness/dithering, with some limbs crisp and dark and others hazy.

This effect was achieved by doing proper penumbral blurring in the shader. If we set a focal depth for the scene, $U = f \cdot \frac{b}{a}$, where $f$ is the focal-spot size, $a$ is the distance from camera to object, and $b$ is the distance from object to wall.

```plaintext /░/#path /╱/#dim /╲/#dim /│/#dim /╳/#dim /┊/#dim
          ●─────●            focal spot, size f
          │╲   ╱│          ┊
          │ ╲ ╱ │          ┊
          │  ╳  │          a
          │ ╱ ╲ │          ┊
          │╱   ╲│          ┊
          ███████            branch
         ╱│     │╲         ┊
        ╱ │     │ ╲        ┊
       ╱  │     │  ╲       b
      ╱   │     │   ╲      ┊
     ╱    │     │    ╲     ┊
────░░░░░░███████░░░░░░────  wall
    └─ U ─┘
  a point inside the fringe sees only part of the focal spot; U
  grows with b, so limbs far from the wall blur wide and limbs
  near it stay crisp
```

This was mostly for the branch and trunk segments though, as the leaf layer would be too computationally expensive to do for each leaf. Instead, I opted for a depth gradient which multiplied the noise threshold. I also added a 'depth following parameter' to nudge the depth of the leaves to follow the depth of the branch when they are nearby. The resulting effect is a nice variation in the canopy density.

```plaintext /┄/#path /·/#dim
  flat threshold, one altitude for the whole layer

            ╱╲
     ╱╲    ╱  ╲
  ┄┄╱┄┄╲┄┄╱┄┄┄┄╲┄┄┄┄┄┄╱╲┄┄┄┄┄┄╱╲┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄    threshold
   ╱    ╲╱      ╲    ╱  ╲    ╱  ╲    ╱╲  ╱╲  ╱╲  ╱╲  ╱╲     noise
  ╱              ╲  ╱    ╲  ╱    ╲  ╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲
                  ╲╱      ╲╱      ╲╱

  ···██····████·········································    canopy

  with a depth gradient, the threshold tilts across the layer

            ╱╲
  ┄┄┄╱╲┄┄┄┄╱┄ ╲
    ╱  ╲  ╱  ┄┄╲┄┄┄┄┄┄╱╲      ╱╲
   ╱    ╲╱      ╲    ╱  ╲┄┄┄┄╱┄┄╲┄┄  ╱╲  ╱╲  ╱╲  ╱╲  ╱╲
  ╱              ╲  ╱    ╲  ╱    ╲ ┄╱┄┄╲╱┄┄╲╱┄ ╲╱  ╲╱  ╲
                  ╲╱      ╲╱      ╲╱          ┄┄┄┄┄┄┄┄┄┄

  ··········███···············██·····██··██··███████████    canopy

  canopy = the stretches of noise poking above the threshold
```

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="8"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="3" step="0.05" value="1.4" data-dappled-param="leafFall" data-dappled-label="canopy falloff"></label>
    <label><span></span><input type="range" min="0" max="1" step="0.02" value="0.6" data-dappled-param="leafFollow" data-dappled-label="depth follow"></label>
    <button data-dappled-act="reshuffle">reshuffle tree</button>
</div>


As a nice bonus, we can use these depth values for parallax! As your mouse moves across the page, each layer slides sideways in proportion to its distance from the wall, giving it a more embodied sense of depth in addition to the blurring above.

## Composition

The rest of the polish was just applying good principles of photography.

There should be areas that draw your attention and focus. Variations in texture, color, and light can be used to that effect. Depth and parallax help focus your attention on what is sharp. We can align trunks and branches, which serve as subjects, along a rule-of-thirds line. Leave purposeful empty space.

<div class="dappled-frame"><canvas class="dappled-canvas" data-dappled-stage="7"></canvas></div>
<div class="dappled-controls">
    <label><span></span><input type="range" min="0" max="0.9" step="0.05" value="0.4" data-dappled-param="depthDrift" data-dappled-label="depth drift"></label>
    <label><span></span><input type="range" min="0" max="1.6" step="0.02" value="0.9" data-dappled-param="rootOffset" data-dappled-label="root offset"></label>
    <button data-dappled-act="reshuffle">reshuffle tree</button>
</div>

When these [[thoughts/A Pattern Language|patterns]] are combined and adhered to, the composition begins to feel interesting. Each intersection of trunks, branches, leaves, and light are new each time!

I'm really glad for that one random Chrome bug that kicked off my sudden itch to redo the site -- it feels as if I have a whole new digital home!

Thanks for reading, I hope you stay a while.

<script>
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

  // stage 4: port of commit 5f3a17a599 (DAPPLED LIGHT YUM)
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
    const maxIter = tree.maxIter || 99
    const grow = (x, y, ang, width, curl, phase, depth, iter) => {
      if (iter >= maxIter || minW > width || segs.length >= MAXSEG) return
      const len = Math.min(width * tree.lenRatio, tree.maxLen) * (0.85 + rng() * 0.3)
      const a = ang + curl + (rng() - 0.5) * 0.05
      const ex = x + Math.cos(a) * len
      const ey = y + Math.sin(a) * len
      const wEnd = width * 0.97
      segs.push([x, y, ex, ey, width, wEnd, depth])
      const totalA = wEnd * wEnd * tree.conserve
      if (1 > tree.forkProb) {
        if (rng() >= tree.forkProb) {
          grow(ex, ey, a, Math.sqrt(totalA), curl, phase + GOLDEN, drift(depth, tree.depthDrift * 0.25), iter + 1)
          return
        }
      }
      const n = tree.split3 > rng() ? 3 : 2
      const leaderA = totalA * (tree.leader * (0.92 + rng() * 0.16))
      const wLeader = Math.sqrt(Math.min(totalA, leaderA))
      grow(ex, ey, a, wLeader, curl, phase + GOLDEN, drift(depth, tree.depthDrift * 0.25), iter + 1)
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
        grow(ex, ey, sa, wc, (rng() - 0.5) * tree.curl, ph, drift(depth, tree.depthDrift), iter + 1)
      }
    }
    if (tree.bottomUp) {
      // no scene logic: root each tree just below the bottom edge, growing up
      const nTrees = Math.max(1, Math.round(tree.nTrees))
      for (let i = 0; nTrees > i; i++) {
        if (segs.length >= MAXSEG) break
        const fx = clampN((i + 0.5) / nTrees + (rng() - 0.5) * 0.2, 0.06, 0.94)
        const w = tree.trunkWidth * (0.9 + rng() * 0.2)
        grow(fx * aspect, -tree.rootOffset, Math.PI / 2 + (rng() - 0.5) * 0.25, w, (rng() - 0.5) * tree.curl, rng() * Math.PI * 2, 0, 0)
      }
      return {
        segs,
        posScale: aspect + 2,
        leafG: [0, 1],
        trunkCount: 0,
        trunkX0: 0.5,
        trunkX1: 0.5,
        trunkW: 0.01,
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
      grow(x, y, ang, w, (rng() - 0.5) * tree.curl, rng() * Math.PI * 2, base, 0)
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
    bottomUp: true, nTrees: 2, trunkWidth: 0.05, lenRatio: 16, maxLen: 0.16,
    curl: 0.3, split3: 0.3, forkProb: 1, depthDrift: 0, leader: 0.618,
    golden: 1, conserve: 0.95, endPx: 0.5, rootOffset: 0.02,
    trunks: false, depthMode: 'v2', maxIter: 12,
  }
  const HEAD_TREE = {
    sceneType: -1, nTrees: 6, trunkWidth: 0.035, lenRatio: 16, maxLen: 0.4,
    curl: 0.3, split3: 0.3, forkProb: 0.7, depthDrift: 0.4, leader: 0.618,
    golden: 1, conserve: 0.95, endPx: 0.5, rootOffset: 0.9,
    trunks: true, depthMode: 'head',
  }
  const LEAF_TREE = {
    bottomUp: true, nTrees: 2, trunkWidth: 0.05, lenRatio: 16, maxLen: 0.16,
    curl: 0.3, split3: 0.3, forkProb: 0.7, depthDrift: 0.5, leader: 0.618,
    golden: 1, conserve: 0.95, endPx: 0.5, rootOffset: 0.02,
    trunks: false, depthMode: 'head', maxIter: 12,
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
      params: { goldLo: 0.45, goldHi: 0.7, windScale: 1, blurW: 0.8, leafFall: 1.4, leafFollow: 0.6 },
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
      d.u1f('uLeafFall', d.params.leafFall)
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
      6: (c) =>
        makeDemo(c, FRAG_LSYS_V2, {
          init: (d) => setupLSys(d, Object.assign({}, V2_TREE)),
          onResize: (d) => { if (d.rebuild) d.rebuild() },
          frame: (d, t, env) => {
            lsysCommonUniforms(d, t, env)
            d.u4f('uLayerOn', 0, 1, 0, 0)
            d.u4f('uBlur', 0.0, 0.12, 0.35, 0.45)
            d.u1f('uParallax', 0)
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
      8: (c) =>
        makeDemo(c, FRAG_FINAL, {
          init: (d) => setupLSys(d, Object.assign({}, LEAF_TREE)),
          onResize: (d) => { if (d.rebuild) d.rebuild() },
          frame: (d, t, env) => {
            lsysCommonUniforms(d, t, env)
            d.u4f('uLayerOn', 0, 1, 0, 1)
            d.u4f('uBlur', 0.0, 0.12, 0.35, 0.45)
            d.u1f('uParallax', env.parallax)
            d.u3fv('uFloor', [0.1, 0.4, 0.7])
            d.u1f('uLeafFollow', d.params.leafFollow)
            d.u1f('uTrunkCount', 0)
            d.u2f('uTrunkX', 0.5, 0.5)
            d.u1f('uTrunkW', 0.01)
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
              d.noiseSeed = [Math.random() * 1000, Math.random() * 1000]
              if (d.rebuild) d.rebuild()
              if (reduce) drawAll()
            })
        })
        fig.querySelectorAll('input[data-dappled-param]').forEach((sl) => {
          const key = sl.dataset.dappledParam
          const span = sl.parentElement ? sl.parentElement.querySelector('span') : null
          const digits = parseFloat(sl.step) >= 1 ? 0 : 2
          const setLabel = (v) => {
            if (span) span.textContent = (sl.dataset.dappledLabel || key) + ': ' + v.toFixed(digits)
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
