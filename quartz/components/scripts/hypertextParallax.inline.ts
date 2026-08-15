// Index-only decorative scene: a parallax field of hypertext. Fragments of
// link syntax ([[wikilinks]], <a href> tags, #anchors, underlined link words)
// drift across the banner on depth layers — near fragments are large, dark and
// fast; far ones small, faded and slow. The pointer (or device tilt) shifts
// the layers by depth, and the fragment nearest the cursor lights up like a
// hovered link. Plain 2D canvas, no dependencies; words are seeded from the
// blog's own vocabulary (recurring words and phrases from content/posts) plus
// whatever links are actually on the page.

const CANON = [
  "hypersubject",
  "smallweb",
  "archipelago",
  "quilting points",
  "digital community",
  "collectivity",
  "discourse",
  "the global village",
  "webring",
  "junited",
  "blogroll",
  "zine",
  "antilibrary",
  "unread books",
  "read-it-never",
  "the studio",
  "clay",
  "syzygy",
  "phronesis",
  "sunday reflection",
  "drafts piling up",
  "publish",
  "peace with the ordinary",
  "days passing",
  "busy, busy, busy",
  "yearning",
  "rekindle the fire",
  "i feel lighter",
  "fingers crossed",
  "we'll see",
  "yak shaving",
  "blind spot",
  "emergency brake",
  "the last 20%",
  "hyperimages",
  "hyperobjects",
  "vibepression",
  "the inner-anarchist",
  "it's okay",
  "sculpting",
  "art",
  "revolution",
  "weekly-update",
]

type Fragment = {
  z: number // depth: 0 far -> 1 near
  x: number // css px, unparallaxed
  y: number
  word: string
  variant: number // 0 [[w]], 1 <a href>, 2 #w, 3 underlined link, 4 plain
  width: number // measured at current font size (css px)
  speed: number // px/s leftward
  bobAmp: number
  bobFreq: number
  bobPhase: number
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function cssColor(name: string, fallback: string): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return hexToRgb(v && v.trim().startsWith("#") ? v : fallback)
}
// gamma-aware mix (blend in ~linear light): a linear sRGB lerp toward a dark
// background goes perceptually dim far too fast, which killed dark mode
function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(Math.sqrt(v * v + (b[i] * b[i] - v * v) * t)))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
function contentSize(el: HTMLElement): [number, number] {
  const cs = getComputedStyle(el)
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
  return [Math.max(1, el.clientWidth - padX), Math.max(1, el.clientHeight - padY)]
}

// harvest link texts from the page so the field is the site's own hypertext
function pageWords(): string[] {
  const seen = new Set<string>()
  for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("article a"))) {
    const t = a.textContent?.trim()
    if (t && t.length >= 3 && t.length <= 24 && !t.startsWith("http")) seen.add(t)
  }
  return Array.from(seen)
}

function initScene(container: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.className = "hypertext-canvas"
  container.appendChild(canvas)
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const rootStyle = () => getComputedStyle(document.documentElement)
  let bodyFont = rootStyle().getPropertyValue("--bodyFont") || "sans-serif"
  let codeFont = rootStyle().getPropertyValue("--codeFont") || "monospace"

  // theme palette, re-read on themechange
  let bg: [number, number, number]
  let ink: [number, number, number]
  let linkInk: [number, number, number]
  let hot: [number, number, number]
  const syncColors = () => {
    bg = cssColor("--light", "#f5eedd")
    ink = cssColor("--darkgray", "#4e2d73")
    linkInk = cssColor("--secondary", "#4d2878")
    hot = cssColor("--tertiary", "#c8482b")
    if (reduce) draw(0)
  }

  const words = pageWords().concat(CANON)
  const pick = () => words[Math.floor(Math.random() * words.length)]

  let w = 600
  let h = 180
  const dpr = Math.min(2, window.devicePixelRatio || 1)

  const fontSize = (z: number) => 9 + 17 * Math.pow(z, 1.4)
  const fontFor = (f: Fragment) =>
    f.variant === 1 || f.variant === 2
      ? `${(fontSize(f.z) * 0.85).toFixed(1)}px ${codeFont}`
      : `${fontSize(f.z).toFixed(1)}px ${bodyFont}`
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
  const textFor = (f: Fragment) =>
    f.variant === 0
      ? `[[${f.word}]]`
      : f.variant === 1
        ? `<a href="/${slug(f.word)}">`
        : f.variant === 2
          ? `#${slug(f.word)}`
          : f.word

  const measure = (f: Fragment) => {
    ctx.font = fontFor(f)
    f.width = ctx.measureText(textFor(f)).width
  }
  const spawn = (z: number, anywhere: boolean): Fragment => {
    const f: Fragment = {
      z,
      x: 0,
      y: 10 + Math.random() * (h - 20),
      word: pick(),
      variant: Math.floor(Math.random() * 5),
      width: 0,
      speed: (5 + Math.random() * 6) * (0.25 + z),
      bobAmp: 1 + 2.5 * z,
      bobFreq: 0.2 + Math.random() * 0.4,
      bobPhase: Math.random() * Math.PI * 2,
    }
    measure(f)
    // enter just past the right edge, or scatter across the frame on first fill
    f.x = anywhere ? Math.random() * (w + f.width) - f.width : w + 30 + Math.random() * w * 0.3
    return f
  }

  let frags: Fragment[] = []
  const populate = () => {
    const count = Math.max(18, Math.min(64, Math.round((w * h) / 3200)))
    frags = []
    for (let i = 0; i < count; i++) frags.push(spawn(Math.pow(Math.random(), 1.6), true))
    frags.sort((a, b) => a.z - b.z) // draw far -> near; respawns keep their z
  }

  const resize = () => {
    ;[w, h] = contentSize(container)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + "px"
    canvas.style.height = h + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    populate()
    if (reduce) draw(0)
  }

  // --- parallax input: pointer position (desktop) / device tilt (mobile) -----
  let parX = 0
  let parY = 0
  let parXT = 0
  let parYT = 0
  let cursorX = -1e5 // canvas-local, for the hover highlight
  let cursorY = -1e5
  const onMove = (e: PointerEvent) => {
    parXT = (e.clientX / window.innerWidth - 0.5) * 2
    parYT = (e.clientY / window.innerHeight - 0.5) * 2
    const r = canvas.getBoundingClientRect()
    cursorX = e.clientX - r.left
    cursorY = e.clientY - r.top
  }
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma != null) parXT = Math.max(-1, Math.min(1, e.gamma / 35))
    if (e.beta != null) parYT = Math.max(-1, Math.min(1, (e.beta - 40) / 35))
  }
  window.addEventListener("pointermove", onMove, { passive: true })
  window.addEventListener("deviceorientation", onTilt)

  // --- render ---------------------------------------------------------------
  const draw = (t: number) => {
    ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`
    ctx.fillRect(0, 0, w, h)
    ctx.textBaseline = "middle"

    // the fragment under the cursor becomes a "hovered link"
    let hotIdx = -1
    let hotDist = 55
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i]
      const px = f.x + parX * 22 * f.z
      const py = f.y + parY * 9 * f.z + Math.sin(t * f.bobFreq + f.bobPhase) * f.bobAmp
      const d = Math.hypot(px + f.width / 2 - cursorX, py - cursorY)
      if (d < hotDist) {
        hotDist = d
        hotIdx = i
      }
    }

    for (let i = 0; i < frags.length; i++) {
      const f = frags[i]
      const px = f.x + parX * 22 * f.z
      const py = f.y + parY * 9 * f.z + Math.sin(t * f.bobFreq + f.bobPhase) * f.bobAmp
      const fade = 0.85 - 0.75 * f.z // far fragments melt into the wall
      const isHot = i === hotIdx
      const base = f.variant === 3 ? linkInk : ink
      ctx.font = fontFor(f)
      ctx.fillStyle = isHot ? `rgb(${hot[0]},${hot[1]},${hot[2]})` : mix(base, bg, fade)
      ctx.fillText(textFor(f), px, py)
      if (f.variant === 3 || isHot) {
        const uy = py + fontSize(f.z) * 0.55
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = Math.max(0.5, f.z)
        ctx.beginPath()
        ctx.moveTo(px, uy)
        ctx.lineTo(px + f.width, uy)
        ctx.stroke()
      }
    }
  }

  let raf = 0
  let running = true
  let prevMs = 0
  let tReal = 0
  const loop = (ms: number) => {
    const dt = prevMs ? Math.min(0.05, (ms - prevMs) / 1000) : 0.016
    prevMs = ms
    tReal += dt
    parX += (parXT - parX) * 0.06
    parY += (parYT - parY) * 0.06
    for (const f of frags) {
      f.x -= f.speed * dt
      if (f.x + f.width < -30) {
        // recycle past the left edge: new word, same depth, enter from the right
        f.word = pick()
        f.variant = Math.floor(Math.random() * 5)
        measure(f)
        f.x = w + 30 + Math.random() * w * 0.3
        f.y = 10 + Math.random() * (h - 20)
      }
    }
    draw(tReal)
    if (running) raf = requestAnimationFrame(loop)
  }
  const onVis = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
    } else if (!reduce) {
      running = true
      prevMs = 0
      raf = requestAnimationFrame(loop)
    }
  }

  syncColors()
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  document.addEventListener("themechange", syncColors)

  if (reduce) {
    draw(0)
    // fonts arrive after first paint; re-render the static frame once they do
    document.fonts?.ready.then(() => draw(0))
  } else {
    raf = requestAnimationFrame(loop)
    document.addEventListener("visibilitychange", onVis)
  }

  window.addCleanup(() => {
    running = false
    cancelAnimationFrame(raf)
    ro.disconnect()
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("deviceorientation", onTilt)
    document.removeEventListener("themechange", syncColors)
    document.removeEventListener("visibilitychange", onVis)
    canvas.remove()
  })
}

document.addEventListener("nav", () => {
  const el = document.querySelector(".hypertext-scene") as HTMLElement | null
  if (!el || el.dataset.init === "true") return
  el.dataset.init = "true"
  initScene(el)
})

// mark this file as a module so its helpers don't collide with other
// import-free inline scripts in the checker's global scope
export {}
