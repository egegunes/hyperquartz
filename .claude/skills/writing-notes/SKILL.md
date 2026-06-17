---
name: writing-notes
description: Use when creating or editing a note/thought for this site's digital garden (files in content/thoughts/, and the essayistic long-forms in content/posts/). Covers where a piece goes, note structure, frontmatter/tags, wikilink conventions, and how to write in Jacky's plain, non-aphoristic voice instead of generic-AI prose. Trigger on any "write a note", "write a thought", "add a note about X", "write a note for <url>" request.
---

# Writing notes for the garden

This is a Quartz digital garden. There are two homes for writing, and picking the wrong one is the first mistake:

- `content/thoughts/` is for short, idea-first, bullet-heavy garden notes. This is the DEFAULT for "write a note/thought". They capture one transferable idea, link out heavily, and stay terse.
- `content/posts/` is for long, first-person, lyrical essays (`nothing-stops`, `casual magic`, `here's to the fools who dream`, `agentic-computing`). Only write in this mode when explicitly asked for an essay or post. Do NOT default here.

## Before writing: read the anchors

Always read 2 or 3 of these first and match their cadence. Do not write from a generic mental model of "a good note."

- Mechanism/idea notes (best structural anchors): `content/thoughts/information scaling threshold.md`, `content/thoughts/form fits the context.md`, `content/thoughts/Jevons Paradox.md`, `content/thoughts/automation.md`, `content/thoughts/complexity.md`
- Voice for essays (posts only): `content/posts/nothing-stops.md`

## Anatomy of a thoughts/ note

1. Conceptual title. Name the transferable idea, not the source. A note about Andy Jones's "Horses" became `Step changes from steady progress`, with `## Horses` as a section inside it. The source is an instance of the idea; the note is about the idea.
2. Frontmatter:
   ```
   ---
   title: Step changes from steady progress
   date: YYYY-MM-DD
   tags:
     - seed
     - pattern
   ---
   ```
   - Growth-stage tag, exactly one: `seed` (new or stub, the default for a fresh note), `sapling` (developed), `fruit` or `evergreen` (mature, rare). A brand-new note is `seed`.
   - Optional category tag: `pattern`, `book`, `technical`, `writing`, and so on.
   - No `draft:` field on thoughts notes. No `fruit`+`writing` on a fresh note (that was the essay misfire).
3. Lead with the idea, in one or two plain sentences, or a `[Source](url)` link, or both. Don't open with a mood-setting quote plus vibe; that is essay mode.
4. Develop with bullets that explain the mechanism plainly. Nest with tabs if needed.
5. Put the source material in its own `## Section` with `[Source](url)`, an optional `![[thoughts/images/...]]`, and the concrete facts as bullets.
6. Pull one real quote from the source as a `>` blockquote only if it earns its place.
7. End with a `See also:` line and a few `[[wikilinks]]`.

Keep it SHORT. Across edits the clear signal was: cut roughly 70% of a first draft. Cut footnotes, personal asides ("I build these systems..."), scholarly name-drops, emotional turns, and moralizing conclusions UNLESS one of them is the actual point. When unsure, leave it out, then offer to add it back rather than padding by default.

## Voice: the thing that keeps going wrong

The repeated complaint is "sounds quite AI." The cause is aphoristic diction: balanced, clever, conclusive one-liners. Jacky's notes explain a mechanism and ground it, in plain (sometimes slightly long or run-on) sentences. Hunt these tells and kill them:

- Rule-of-three or escalating lists: "reads as nothing, nothing, nothing, everything." (no)
- Symmetric punchlines: "A smooth curve is lived as a cliff." / "the way the fastest horse still lost to the slowest engine." (no)
- Sentence-fragment epigrams: "A qualitative leap out of a purely quantitative trend." (no)
- `not X but Y` or `isn't just X, it's Y` reversals used as a stylistic crutch. (no)
- Abstract labeling: "The category error is confusing what a thing is for with what a thing is." (no)
- Poetic restating closers: "so it was never the engine's to take." (no)
- Parallel second-person flourishes: "You prepare as if you have the decades, and get the months." (no)

Instead (what survived the edits):
- Explain causally with conditionals: "While you're far behind, the reference wins almost every time, so years of steady improvement register as no change at all."
- "There was no Jevons rescue either, since cheaper traction made us want more engines rather than more horses."
- Vary sentence length, but make the short ones observations, not epigrams. "But the horse was only horsepower to us, never to itself." is fine; "Never the engine's to take." is not.
- A plain thesis sentence at the top is good and is not an aphorism: "Progress in a capability can be steady while equivalence to it arrives all at once."

Quick self-check before finishing: read each sentence and ask "is this explaining something, or is it a clever summary?" Delete or flatten the clever summaries.

## Formatting conventions

- Use em-dashes sparingly. Prefer a comma, a period, a colon, or parentheses. If the sentence reads fine without the dash, drop it. (Jacky has flagged em-dash overuse specifically, so err toward none.)
- Use bold sparingly. A short note usually wants zero bold; at most one bold term, and only when a single word is genuinely the crux. Use italics sparingly too. Plain prose is the default.
- Bullets and tabs for nesting. Bullet-dominant notes are normal here.

## Wikilinks: verify before you link

- Format: `[[thoughts/note name|anchor text]]` or `[[posts/slug|anchor]]`. Filenames can contain spaces, and case plus spelling matter (for example `emergent behaviour`, not `behavior`).
- Before adding any `[[link]]`, confirm the target file exists (`ls content/thoughts/ | grep -i ...`). Broken wikilinks are a real defect. Link liberally, but only to things that exist.
- Only reference an image (`![[thoughts/images/x.png]]`) if it actually exists. Don't invent chart or image paths.

## Process checklist

1. If the request points at an external URL, fetch it (`WebFetch`) for the real content.
2. Read 2 or 3 anchor notes above.
3. Decide: thoughts/ note (default) or posts/ essay (only if asked).
4. Draft short. Title is the idea, source is a section.
5. Scrub for aphorisms using the tells list.
6. Cut em-dashes and bold down to almost none.
7. Verify every wikilink target and image path exists.
8. Hand it over lean; offer to add back anything you cut.
