import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"

// standalone HTML pages in the content folder, served verbatim instead of
// going through the markdown pipeline. slugifyFilePath drops the .html the
// same way it drops .md, so emit <slug>/index.html to keep the content type
// and still get a clean /slug/ URL
const pagesToCopy = async (argv: Argv, cfg: QuartzConfig) => {
  return await glob("**/*.html", argv.directory, cfg.configuration.ignorePatterns)
}

const destFor = (argv: Argv, fp: FilePath) =>
  joinSegments(argv.output, slugifyFilePath(fp), "index.html") as FilePath

const copyPage = async (argv: Argv, fp: FilePath) => {
  const src = joinSegments(argv.directory, fp) as FilePath
  const dest = destFor(argv, fp)

  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  await fs.promises.copyFile(src, dest)
  return dest
}

export const RawHtmlPage: QuartzEmitterPlugin = () => {
  return {
    name: "RawHtmlPage",
    async *emit({ argv, cfg }) {
      const fps = await pagesToCopy(argv, cfg)
      for (const fp of fps) {
        yield copyPage(argv, fp)
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      for (const changeEvent of changeEvents) {
        if (path.extname(changeEvent.path) !== ".html") continue

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield copyPage(ctx.argv, changeEvent.path)
        } else if (changeEvent.type === "delete") {
          await fs.promises.rm(destFor(ctx.argv, changeEvent.path), { force: true })
        }
      }
    },
  }
}
