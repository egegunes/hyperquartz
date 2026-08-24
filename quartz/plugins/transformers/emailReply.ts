import { QuartzTransformerPlugin } from "../types"
import { Root, Element } from "hast"

export interface Options {
  address: string
  linkText: string
}

export const EmailReply: QuartzTransformerPlugin<Options> = (opts) => ({
  name: "EmailReply",
  htmlPlugins() {
    return [
      () => (tree: Root, file) => {
        if (!opts?.address) return
        if (!file.data.relativePath?.startsWith("posts/")) return
        if (file.data.slug === "posts/index") return

        const title = file.data.frontmatter?.title
        if (!title) return

        const href = `mailto:${opts.address}?subject=${encodeURIComponent("Re: " + title)}`
        const node: Element = {
          type: "element",
          tagName: "p",
          properties: { className: ["reply-via-email"] },
          children: [
            {
              type: "element",
              tagName: "a",
              properties: { href, className: ["no-external-icon"] },
              children: [{ type: "text", value: opts.linkText }],
            },
          ],
        }
        tree.children.push(node)
      },
    ]
  },
})
