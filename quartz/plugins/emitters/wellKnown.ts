import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { FullSlug, joinSegments } from "../../util/path"

interface Options {
  files: Record<string, string>
}

export const WellKnown: QuartzEmitterPlugin<Options> = (opts) => ({
  name: "WellKnown",
  async emit(ctx) {
    const paths = []
    for (const [name, content] of Object.entries(opts?.files ?? {})) {
      paths.push(
        await write({
          ctx,
          content,
          slug: joinSegments(".well-known", name) as FullSlug,
          ext: "",
        }),
      )
    }
    return paths
  },
  async *partialEmit() {},
})
