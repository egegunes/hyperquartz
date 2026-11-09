import { QuartzTransformerPlugin } from "../types"
import { Root, Element } from "hast"
import { FullSlug, resolveRelative } from "../../util/path"

export interface Options {
  linkText: string
}

export const AIEditsLink: QuartzTransformerPlugin<Options> = (opts) => ({
  name: "AIEditsLink",
  htmlPlugins(ctx) {
    return [
      () => (tree: Root, file) => {
        const slug = file.data.slug
        if (!slug?.startsWith("posts/")) return
        if (slug === "posts/index" || slug.startsWith("posts/ai-edits/")) return

        const target = slug.replace(/^posts\//, "posts/ai-edits/") as FullSlug
        if (!ctx.allSlugs.includes(target)) return

        const node: Element = {
          type: "element",
          tagName: "p",
          properties: { className: ["ai-edits-link"] },
          children: [
            {
              type: "element",
              tagName: "a",
              properties: { href: resolveRelative(slug, target), className: ["internal"] },
              children: [{ type: "text", value: opts?.linkText ?? "See AI edits" }],
            },
          ],
        }
        tree.children.push(node)
      },
    ]
  },
})
