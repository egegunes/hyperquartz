---
title: Beating Myers algorithm on large diffs
date: 2026-07-21
tags:
  - fruit
  - technical
draft: false
---

I was profiling our agent process recently to chase down some multi-second stalls that sometimes showed up while editing files. I expected the usual suspects: serialization, the streaming path, maybe some weird look-behind regex. Instead, one of the largest self-time consumers in the CPU profile was `jsdiff`!

Every time the agent edits a file, the workspace shows a card in the activity feed with a unified diff of the change. That diff was produced by taking the file contents before and after the edit and handing both to `jsdiff`'s `createPatch`, which runs the same Myers algorithm `git diff` uses.

## Why Myers is slow on large diffs

Myers finds the shortest edit script between two sequences of lines. Its cost is $O(N \cdot D)$, where $N$ is the number of lines and $D$ is the edit distance between the two versions. For human edits this feels linear as $D$ is almost always tiny (most people are not usually wholesale replacing files) and the algorithm terminates quickly.

> To form an edit graph, Myers arranged the source sequence left-to-right along an x-axis and the destination sequence top-to-bottom along a y-axis with an orthogonal grid of horizontal and vertical edges projected from them. Starting in the upper-left and seeking the bottom-right, each move along the graph's edges toward a vertex would correspond to an edit instruction on the source sequence. Horizontal moves would be deletions from the source element; vertical moves would be insertions of the destination element. Where source and destination elements of the sequence are equivalent, diagonal movement is permitted.
>
> from _[Visualizing Diffs](https://nathaniel.ai/myers-diff/)_ by Nathaniel W. Wroblewski

```plaintext /·/#dim /─/#dim /│/#dim /╲/#dim
    d   r   i   f   t   w   o   o   d
  ·───·───·───·───·───·───·───·───·───·
a │   │   │   │   │   │   │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
r │   │ ╲ │   │   │   │   │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
t │   │   │   │   │ ╲ │   │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
w │   │   │   │   │   │ ╲ │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
o │   │   │   │   │   │   │ ╲ │ ╲ │   │
  ·───·───·───·───·───·───·───·───·───·
r │   │ ╲ │   │   │   │   │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
k │   │   │   │   │   │   │   │   │   │
  ·───·───·───·───·───·───·───·───·───·
  the edit graph for driftwood → artwork: every cell where
  the letters match allows a free diagonal step
```

```plaintext /╲/#path /─/#path /│/#path /·/#dim
    d   r   i   f   t   w   o   o   d
  ·───·   ·   ·   ·   ·   ·   ·   ·   ·
a     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
r       ╲
  ·   ·   ·───·───·   ·   ·   ·   ·   ·
t                   ╲
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
w                       ╲
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
o                           ╲
  ·   ·   ·   ·   ·   ·   ·   ·───·───·
r                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
k                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
  the shortest path rides 4 of those diagonals, D = 8
```

The shortest edit is a path that is nearly one unbroken diagonal, and Myers only explores a thin band around it. The whole search becomes a simple 2D DP problem:

```python
# a = before lines, b = after lines
def myers_distance(a, b):
    V = {1: 0}                    # farthest x reached on each diagonal k
    for d in range(len(a) + len(b) + 1):  # d = edits spent so far
        for k in range(-d, d + 1, 2):     # sweep every diagonal in the band
            if k == -d or (k != d and V[k - 1] < V[k + 1]):
                x = V[k + 1]              # came from above: insert b[y]
            else:
                x = V[k - 1] + 1          # came from the left: delete a[x]
            y = x - k
            while x < len(a) and y < len(b) and a[x] == b[y]:
                x, y = x + 1, y + 1       # matching lines are free
            V[k] = x
            if x == len(a) and y == len(b):
                return d          # a real diff also keeps a trail per d,
                                  # then walks it back to recover the script
```

The nested loops are where $O(N \cdot D)$ comes from.

Agents produce the opposite workload. Our Edit tool reads files up to 16MB, models happily rewrite blocks of thousands of lines in a single call, and `replace_all` can touch thousands of sites at once. In the large rewrite case, there are few to no matches to follow, so the band keeps widening until it covers the whole graph.

```plaintext /─/#path /│/#path /·/#dim
    d   r   i   f   t   w   o   o   d
  ·───·───·───·───·───·───·───·───·───·
s                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
u                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
n                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
b                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
e                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
a                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
m                                     │
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
  driftwood → sunbeam: nothing matches, no free diagonals
  anywhere, so every one of the D = 16 steps is paid
```

When most lines differ, $D$ approaches $2N$ and the search becomes $O(N^2)$. We had a single degenerate diff that took 4.3 seconds and stalled the whole agent!

## Building the diff from what we already know

Turns out that there is information we are discarding here that we can use to make this diff faster.

---

The Edit tool is a classic `str_replace` tool. It takes an `old_string` and a `new_string` and performs the replacement itself. By definition, it already knows exactly which character ranges changed.

What if we recorded these ranges to help us identify the hunks we need to render for the diff?

```ts
// before: recompute the change from scratch
const after = before.split(oldStr).join(newStr)
const patch = createPatch(path, before, after) // O(N·D) search

// after: record spans as we replace
const { after, spans } = edit(before, oldStr, newStr)
const patch = diffFromSpans(before, after, spans) // O(N + D)
```

`edit` now collects the replacement spans in a single `indexOf` pass and derives the new file content from those same spans.

To build the diff, we do a single pass over the spans. For each span, widen it to the line boundaries around it, slice those lines out of both files, and merge hunks whose context would overlap.

```python
CONTEXT = 4

def diff_from_spans(before, after, spans):
    hunks = []
    delta = 0                                  # net chars added by earlier spans
    for (start, old_len, new_len) in spans:    # sorted, from the indexOf pass
        # widen the replacement to whole lines of `before`
        lo = before.rfind("\n", 0, start) + 1
        hi = before.find("\n", start + old_len)
        removed  = lines(before[lo:hi])
        inserted = lines(after[lo + delta : hi + delta + new_len - old_len])
        line_no  = newlines_up_to(lo)          # running tally, not a rescan
        if hunks and line_no - end(hunks[-1]) <= 2 * CONTEXT:
            merge(hunks[-1], line_no, removed, inserted)
        else:
            hunks.append(hunk(line_no, removed, inserted))
        delta += new_len - old_len
    return render_unified(hunks, CONTEXT)
```

Say the agent replaces `readFile(path)` with `readFile(path, "utf8")`:

```plaintext /readFile(path)/#path /└──── span ────┘/#path
before:  export function load(path) {\n  return readFile(path)\n}
                                                └──── span ────┘
```

The span widens to line 2's boundaries, lines 1 and 3 come along as context, and the builder emits the same hunk `jsdiff` would have produced:

```diff
@@ -1,3 +1,3 @@
 export function load(path) {
-  return readFile(path)
+  return readFile(path, "utf8")
 }
```

*Hey!* I hear you complain, *there's still an $O(N)$ hiding in here!* The newline hops and the running line count are both linear scans. Two things make this less bad.

1. The hops stop at the nearest line boundary, so they cost a line rather than the whole file. 
2. The line count is at most one pass over the file, which is work the edit already does.

What the spans actually get rid of is the multiplication, so an edit now costs $O(N + D)$ instead of $O(N + N \cdot D)$.

## Fuzzing for correctness

Generating the unified diff came with some more unexpected challenges. The diff format is surprisingly complex!

Rather than trying to enumerate the corner cases, I wrote a fuzzing suite that treats `jsdiff` as an oracle: every diff we construct gets applied back onto the original content with `jsdiff`'s `applyPatch`, and the result must reproduce the written file identically.

Luckily this wasn't for naught as it caught a particularly nasty bug. When a deletion eats a line's trailing newline, the leftover text joins the _following_ line:

```plaintext /"XX\n"/#path /← wrong: "b" is no longer its own line/#dim
before: "aXX\nb\n"      old_string: "XX\n"      after: "ab\n"

the deletion starts mid-line and eats line 1's newline,
so the leftover "a" merges with line 2:

  -aXX          not        -aXX
  -b                       +a
  +ab                       b    ← wrong: "b" is no longer its own line
```

After enough rounds of fuzzing, we felt confident enough to ship this to production and no longer see stalls in this codepath.

## Results

Median times on my dev machine, old Myers diff vs. new span approach:

| Scenario                           | Old     | New    | Speedup |
| ---------------------------------- | ------- | ------ | ------- |
| 1KB file, single edit              | 9µs     | 2µs    | 4x      |
| 1MB file, single edit              | 5.4ms   | 0.11ms | 51x     |
| 1MB file, `replace_all` (258 hits) | 19.5ms  | 0.71ms | 27x     |
| 1MB file, 5k-line block rewrite    | 4,262ms | 1.3ms  | ~3,300x |
| 16MB file, single edit             | 137ms   | 1.6ms  | 87x     |
