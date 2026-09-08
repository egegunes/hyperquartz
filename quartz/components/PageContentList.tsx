import { FullSlug, resolveRelative } from "../util/path"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { SortFn, byDateAndAlphabetical } from "./PageList"
import { htmlToJsx } from "../util/jsx"
import style from "./styles/pageContentList.scss"

type Props = {
  limit?: number
  sort?: SortFn
} & QuartzComponentProps

// like PageList, but renders each page in full instead of just linking to it
export const PageContentList: QuartzComponent = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
}: Props) => {
  const sorter = sort ?? byDateAndAlphabetical(cfg)
  let list = allFiles.sort(sorter)
  if (limit) {
    list = list.slice(0, limit)
  }

  return (
    <ul class="content-list">
      {list.map((page) => {
        const permalink = resolveRelative(fileData.slug!, page.slug!)
        const tags = page.frontmatter?.tags ?? []
        const date = page.dates && getDate(cfg, page)

        return (
          <li class="content-list-item">
            <article>
              <p class="meta">
                {date && (
                  <a href={permalink} class="internal permalink">
                    <Date date={date} locale={cfg.locale} />
                  </a>
                )}
              </p>
              <div class="content-list-body">
                {page.htmlAst
                  ? htmlToJsx(page.filePath!, page.htmlAst)
                  : page.description && <p>{page.description}</p>}
              </div>
              {tags.length > 0 && (
                <ul class="tags">
                  {tags.map((tag) => (
                    <li>
                      <a
                        class="internal tag-link"
                        href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                      >
                        {tag}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        )
      })}
    </ul>
  )
}

PageContentList.css = style
