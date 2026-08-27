interface WMAuthor {
  name?: string
  url?: string
  photo?: string
}

interface WMEntry {
  "wm-property"?: string
  "wm-received"?: string
  author?: WMAuthor
  url?: string
  published?: string | null
  content?: { text?: string; html?: string }
}

// only ever link out to http(s) urls, mention data is untrusted
const safeUrl = (u?: string): string | null => {
  if (!u) return null
  try {
    const url = new URL(u)
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

// strict allowlist sanitizer for mention html: only these tags survive, unknown
// tags are unwrapped to their children, and no attributes are copied except a
// validated href on links
const ALLOWED_TAGS = new Set([
  "p",
  "blockquote",
  "a",
  "em",
  "i",
  "strong",
  "b",
  "code",
  "pre",
  "br",
  "ul",
  "ol",
  "li",
])

// dropped wholesale, children included, so e.g. script/style text never leaks
const DROPPED_TAGS = new Set(["script", "style", "template", "iframe", "object", "embed"])

const sanitizeNode = (node: Node): Node[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    return [document.createTextNode(node.textContent ?? "")]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  if (DROPPED_TAGS.has(tag)) return []
  const children = [...el.childNodes].flatMap(sanitizeNode)
  if (!ALLOWED_TAGS.has(tag)) return children
  const clean = document.createElement(tag)
  if (tag === "a") {
    const href = safeUrl(el.getAttribute("href") ?? undefined)
    if (href) {
      clean.setAttribute("href", href)
      clean.setAttribute("rel", "nofollow noopener")
    }
  }
  clean.append(...children)
  return [clean]
}

const sanitizeHtml = (html: string): DocumentFragment => {
  // DOMParser never executes scripts; rebuilding fresh elements from the
  // allowlist drops event handlers and every other attribute
  const doc = new DOMParser().parseFromString(html, "text/html")
  const frag = document.createDocumentFragment()
  frag.append(...[...doc.body.childNodes].flatMap(sanitizeNode))
  return frag
}

const fetchMentions = async (target: string): Promise<WMEntry[]> => {
  // mentions sent from feed readers target the rssLinkParams-decorated url
  const rssParams = "?utm_source=rss&utm_medium=rss&utm_campaign=rss"
  const bases = [
    target,
    target + "/",
    target.replace(/^https:/, "http:"),
    target.replace(/^https:/, "http:") + "/",
  ]
  const variants = new Set(bases.flatMap((t) => [t, t + rssParams]))
  const params = [...variants].map((t) => `target[]=${encodeURIComponent(t)}`).join("&")
  const res = await fetch(
    `https://webmention.io/api/mentions.jf2?per-page=100&sort-by=published&sort-dir=up&${params}`,
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data.children) ? data.children : []
}

const formatDate = (entry: WMEntry): string | null => {
  const raw = entry.published ?? entry["wm-received"]
  if (!raw) return null
  const date = new Date(raw)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const VERBS: Record<string, string> = {
  "in-reply-to": "replied",
  "mention-of": "mentioned this",
  "bookmark-of": "bookmarked this",
  rsvp: "RSVPed",
  "like-of": "liked this",
  "repost-of": "reposted this",
}

// likes and reposts list as a bare "<name> liked this · <date>" line:
// no avatar, and no body (see renderMention)
const REACTIONS = new Set(["like-of", "repost-of"])
const isReaction = (entry: WMEntry): boolean => REACTIONS.has(entry["wm-property"] ?? "")

// the same like can arrive more than once: bridgy re-sends, and the http/https
// and rss-param target variants we ask for all land in one response
const dedupe = (entries: WMEntry[]): WMEntry[] => {
  const seen = new Map<string, WMEntry>()
  for (const [i, entry] of entries.entries()) {
    const author = safeUrl(entry.author?.url) ?? entry.author?.name?.trim() ?? entry.url
    seen.set(`${entry["wm-property"]}\u0000${author ?? `anon-${i}`}`, entry)
  }
  return [...seen.values()]
}

const renderMention = (entry: WMEntry): HTMLLIElement => {
  const li = document.createElement("li")
  li.className = "webmention"

  const authorUrl = safeUrl(entry.author?.url)
  const photoUrl = isReaction(entry) ? null : safeUrl(entry.author?.photo)
  const sourceUrl = safeUrl(entry.url)

  if (photoUrl) {
    const img = document.createElement("img")
    img.className = "webmention-avatar"
    img.src = photoUrl
    img.alt = ""
    img.loading = "lazy"
    img.addEventListener("error", () => img.remove())
    li.appendChild(img)
  }

  const body = document.createElement("div")
  body.className = "webmention-body"

  const meta = document.createElement("p")
  meta.className = "webmention-meta"

  const authorName = entry.author?.name?.trim() || "Someone"
  if (authorUrl) {
    const a = document.createElement("a")
    a.href = authorUrl
    a.rel = "nofollow noopener"
    a.textContent = authorName
    meta.appendChild(a)
  } else {
    const span = document.createElement("span")
    span.textContent = authorName
    meta.appendChild(span)
  }

  const verb = VERBS[entry["wm-property"] ?? ""]
  if (verb) {
    meta.appendChild(document.createTextNode(` ${verb}`))
  }

  const date = formatDate(entry)
  if (sourceUrl || date) {
    const a = document.createElement(sourceUrl ? "a" : "span") as HTMLElement
    a.className = "webmention-date"
    if (sourceUrl) {
      ;(a as HTMLAnchorElement).href = sourceUrl
      ;(a as HTMLAnchorElement).rel = "nofollow noopener"
    }
    a.textContent = date ?? "source"
    meta.appendChild(document.createTextNode(" · "))
    meta.appendChild(a)
  }

  body.appendChild(meta)

  // webmention.io synthesises content for a reaction ("X liked <post title>"),
  // which only restates the meta line above, so drop it
  const html = isReaction(entry) ? undefined : entry.content?.html?.trim()
  const text = isReaction(entry) ? undefined : entry.content?.text?.trim()
  if (html) {
    const div = document.createElement("div")
    div.className = "webmention-content"
    div.appendChild(sanitizeHtml(html))
    body.appendChild(div)
  } else if (text) {
    const p = document.createElement("p")
    p.className = "webmention-content"
    p.textContent = text.length > 400 ? text.slice(0, 400).trimEnd() + "…" : text
    body.appendChild(p)
  }

  li.appendChild(body)
  return li
}

document.addEventListener("nav", async () => {
  const container = document.querySelector<HTMLElement>("section.webmentions")
  if (!container || !container.dataset.target) return

  let entries: WMEntry[]
  try {
    entries = await fetchMentions(container.dataset.target)
  } catch {
    return
  }

  // spa nav may have replaced the page while we were fetching
  if (!container.isConnected) return
  if (entries.length === 0) return

  // reactions first: one-liners are cheap to scan before the quoted responses
  const mentions = [
    ...dedupe(entries.filter(isReaction)),
    ...entries.filter((e) => !isReaction(e) && VERBS[e["wm-property"] ?? ""] !== undefined),
  ]

  const list = container.querySelector<HTMLElement>(".webmention-list")
  if (list) {
    list.replaceChildren(...mentions.map(renderMention))
    list.hidden = mentions.length === 0
  }

  container.hidden = false
})
