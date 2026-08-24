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

const fetchMentions = async (target: string): Promise<WMEntry[]> => {
  const variants = new Set([
    target,
    target + "/",
    target.replace(/^https:/, "http:"),
    target.replace(/^https:/, "http:") + "/",
  ])
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

const renderMention = (entry: WMEntry): HTMLLIElement => {
  const li = document.createElement("li")
  li.className = "webmention"

  const authorUrl = safeUrl(entry.author?.url)
  const photoUrl = safeUrl(entry.author?.photo)
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

  const text = entry.content?.text?.trim()
  if (text) {
    const p = document.createElement("p")
    p.className = "webmention-content"
    p.textContent = text.length > 400 ? text.slice(0, 400).trimEnd() + "…" : text
    body.appendChild(p)
  }

  li.appendChild(body)
  return li
}

const pluralize = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`

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

  const likes = entries.filter((e) => e["wm-property"] === "like-of").length
  const reposts = entries.filter((e) => e["wm-property"] === "repost-of").length
  const bookmarks = entries.filter((e) => e["wm-property"] === "bookmark-of").length
  const mentions = entries.filter((e) =>
    ["in-reply-to", "mention-of", "rsvp"].includes(e["wm-property"] ?? ""),
  )

  const counts = container.querySelector<HTMLElement>(".webmention-counts")
  if (counts) {
    const parts = []
    if (likes > 0) parts.push(pluralize(likes, "like"))
    if (reposts > 0) parts.push(pluralize(reposts, "repost"))
    if (bookmarks > 0) parts.push(pluralize(bookmarks, "bookmark"))
    counts.textContent = parts.join(" · ")
    counts.hidden = parts.length === 0
  }

  const list = container.querySelector<HTMLElement>(".webmention-list")
  if (list) {
    list.replaceChildren(...mentions.map(renderMention))
    list.hidden = mentions.length === 0
  }

  container.hidden = false
})
