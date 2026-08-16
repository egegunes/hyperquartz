import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "ege's weblog",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "fathom",
      siteId: "ZSADLGKN",
    },
    locale: "en-US",
    baseUrl: "hypersubject.net",
    ignorePatterns: ["private", "templates"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: {
          name: "DM Serif Display",
          weights: [400],
        },
        body: "Bricolage Grotesque",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#f5eedd",
          lightgray: "#e3d9c0",
          gray: "#9a8e76",
          darkgray: "#4e2d73",
          dark: "#30164e",
          secondary: "#4d2878",
          tertiary: "#c8482b",
          highlight: "#c8482b1a",
          textHighlight: "#f4c84b88",
        },
        darkMode: {
          light: "#19062f",
          lightgray: "#2a1245",
          gray: "#9271b8",
          darkgray: "#decaf4",
          dark: "#f5eefc",
          secondary: "#b48fde",
          tertiary: "#e0552f",
          highlight: "#e0552f24",
          textHighlight: "#c9542f55",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.Poetry(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        parseTags: false,
        mermaid: false,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "relative", lazyLoad: true }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssFullHtml: true,
        rssFilter: (data) => data.relativePath?.startsWith("posts/") && data.slug! !== "posts/index" && data.frontmatter?.rss !== false,
        rssLinkParams: "utm_source=rss&utm_medium=rss&utm_campaign=rss",
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
      Plugin.AliasRedirects(),
    ],
  },
}

export default config
