import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/webmentions.scss"
// @ts-ignore
import script from "./scripts/webmentions.inline"

export default (() => {
  const Webmentions: QuartzComponent = ({ displayClass, fileData, cfg }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    if (!slug.startsWith("posts/") || slug === "posts/index") {
      return null
    }

    const target = `https://${cfg.baseUrl ?? "example.com"}/${slug}`
    return (
      <section class={classNames(displayClass, "webmentions")} data-target={target} hidden>
        <h3>Webmentions</h3>
        <p class="webmention-counts"></p>
        <ul class="webmention-list"></ul>
      </section>
    )
  }

  Webmentions.css = style
  Webmentions.afterDOMLoaded = script

  return Webmentions
}) satisfies QuartzComponentConstructor
