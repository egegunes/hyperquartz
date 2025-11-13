---
title: "SyncConf Notes"
date: "2025-11-12"
tags:
  - seed
---

## Teaching models to collaborate
Talk by Lee Byron

- How to design for model <> user <> document interaction
	- Especially for repeated iteration on the same document is hard
- They got sliders! But instead of deterministic edits, it sends a prompt to have the model edit
- Model-based inline feedback
	- The model gets a cursor
	- Everything is undoable
	- You see the model working live
- Canvas is [[thoughts/Operational Transform|OT]]! And is powered using an event sourcing DB
- How do we convert tool calls to doc edits?
- Teaching a model to edit
	- Didn't do naive overwriting
	- Didn't make it write raw ot ops as it requires counting and models suck at that
	- Didn't do gitpatches because models suck at counting
		- Context based patching? Kinda works at least for code because lots of new lines
	- WYSIWYG?
		- Operator is a computer use agent trained to take actions
		- Wayyy too expensive and too slow
	- See/Think/Do -> Think/Tell/Do
		- Equivalent for models: After/Select/Content
			- `{ after "Rice crispy ", select "treats", content: "sprinkle-treats" }`
		- If I couldn't use my eyes and I needed to tell another person to make the edit how would i do it?
		- Just `sed`?
			- `{ pattern: "(?<=Rice crispy) treats", global: true, content: "sprinkle-treats" }`
		- Worked but still had accuracy problems
		- RegExp training regime
			- Format: teaching formats that work well
			- Precision: test its ability to place a cursor
			- Accuracy: test its ability to produce an outcome
			- Efficiency: reward the smallest edit
			- Clarity: reward a human readable edit
		- Easy to map the sed pattern back to OT
		- Optimistically completed tool-call to OT
			- `{ pattern: ` -> draw cursor
			- `{ pattern: "(?<=Classic` -> move cursor to right after 'Classic'
			- `{ pattern: "(?<=Classic Rice Crispy)Treats", content: "Ba ` -> replace content
- Lessons & problems
	- Escaping hell
		- Inside a regexp inside a json body
		- Many syntax mistakes and measurable intelligence loss
		- Maybe just write code?
	- Can't predict iteration
		- Model struggles when to create a canvas + when to edit it
	- MX -> model experience
		- Successful agentic training requires learning andp laying to model strengths
		- Both users and models need to know how to successfully use our products
		- see also [[thoughts/interaction design|interaction design]]

## Synchronizing data across computation
Talk by Frank McSherry

- Not about syncing data between peers but rather about `data -> f(data)`
- Doesn't scale because you might have `f(data)` and `g(data)` and `h(f(data), g(data))`
- Light doesn't travel instantaneously, we have [[thoughts/causality|causal]] interactions but we can use [[thoughts/clocks|logical clocks]] to simplify reasoning about it
	- Turns a consistency issue into a performance issue
	- We can do partial computation which allows us to get even faster performance than going and asking the source to recompute!
- [[thoughts/incremental view maintenance|Incremental view maintenance]] (keeping computed results up to data given new information)
	- `data -> f(data)`
	- `a -> f(a)`
	- `b - a -> f(b) - f(a)`
	- `c - b -> f(c) - f(b)`
	- Virtual time + incremental view maintenance -> sync
	- Never incorrect only ever out-of-date (with a bound on 'freshness')
- If you use data parallel operators (fan out + process + collect) it allows us to avoid recalculation for unchanged inputs

## Conflict resolution x Notion blocks
Talk by Angelique Nehmzow

- Block are units of content
	- Blocks can be reordered, split, and merged
- Collaborative product but they were last-writer-wins for a really long time (and blocked offline support for a long time!)
- They use [[posts/bft-json-crdt#List CRDTs (RGA Explained)|RGA]] under the hood and Peritext to support rich-text editing (which is span-based)
- How to support splits and merging
	- Text slice `<start>content<end>`
	- Introduce a 'split' item `<split>content<end>`
	- Need to update the insert op to provide more path information to traverse the tree (block ID, text instance)
		- This is basically RGA (for nested text instances) within RGA (for blocks)
- Backwards compatibility
	- Used a lens to upgrade LWW style ops to CRDT ops
	- Server-side upgrade blocks to CRDT blocks
		- To unblock offline support, upgrade the block when page is downloaded
- How do they run the merge code?
	- All handled on the server
	- I'm guessing rendering is still client
- How did they handle dual-writes/rollback potential

## Why physical replication still matters
Talk by Carl Sverre

- Logical vs physical replication
	- Logical: description of change
	- Physical: bits and bytes
- Storage agnostic-ness
	- "a database is just a bunch of pages"
	- Page as in $2^n$ length of bytes (e.g. 4kb page b-tree leaf node)
- Bulk changes are efficient as its linear with the size of the change
- Checking for consistency is easy, just hash the bytes
- Isn't good at partial replication though (say we only care about part of the dataset)
	- How do you know what data (at the bits and bytes level the application actually cares about)
- Isn't good at conflict resolution
	- Not enough metadata / understanding about the domain to reconcile conflicts
- Hybrid model? Logical up and physical down
	- Devices stream logical changes to a coordinator (elected via consensus, or centralized server)
		- Do conflict resolutions and permissions
	- Then the raw bytes can be physically replicated to peer devices
	- Replay local logical ops on top of new data
	- How to solve partial replication?
- [Graft](https://graft.rs/) - storage-agnostic partial physical replication
	- Graft is a transactional storage engine designed for lazy, partial replication to the edge.
	- Core insight is you can split metadata and data (like git) so you can have all the 'pages' locally just with no data pulled locally until you need it
	- [[thoughts/consistency|Consistency properties]]
		- All read operations are executed on an isolated snapshot of a Volume.
		- A write transaction must be based on the latest snapshot to commit. Assuming a compliant Graft client, this enforces strict serializability.
	
## Can sync be network-optional?
Talk by Brendan O'Brien (b5 or number0)

- There is no one approach to sync, its all tradeoff analyses
- All pairwise sync algorithms have two phases (and an optional third):
	- Set reconciliation (what are we syncing)
	- Data transfer (let's sync)
	- Incremental updates (here's whats new)
- Both partial replication and CRDTs allow recursive decomposition for more granular sync
	- More granularity means bigger sync state space
	- Bigger state space makes authorization hard
- Clients & Servers are both computers
	- What separates them?
		- Hardware -> perf, specs
		- Dialability -> reachability (see: [[thoughts/NAT|NAT]])
			- Eventually want to move to multi-transport (which we hope will evolve out of [multipath QUIC](https://multipath-quic.org/))
		- Roles -> who is authoritative
- [iroh](https://www.iroh.computer/)
	- Dial keys not IPs (lots of hole-punching, etc.)
	- Sublinear scaling: desirable! as number of peer go up, work per peer goes down
		- Space filling -> avoid collisions
		- Fractal -> hierarchical and recursive rules
		- Same terminal units -> all 'ends' are the same

## How to design a sync-first database
Talk by James Cowling

- People are getting worse at systems and LLMs suck at distributed systems
- Where did we go wrong?
	- Gave up on transactions
	- Client-side reactivity without backend reactivity
- What do platforms need to look like to make race-conditions go away
	- Transactions as an easy way for thread-safe programming
	- SQL is not expressive, ORMs are great for this!
	- ORM + MVCC on steroids
		- Write the handlers in TS but make it side-effect and deterministic, run it in a V8 Isolate that runs in the DB directly
		- Handlers run on snapshots and commit if no conflicting reads/writes
		- Importantly, handler code is in the read-set of the query so it reruns


## A tale of two sync engines
Talk by Arushi Bandi

- Can we combine CRDT multiplayer sync and non-file sync (e.g. comments)?
	- Multiplayer is just file data and handles reads and writes
	- LiveGraph syncs non-file sources (e.g. Postgres, Redis) and is a readonly-only system
- Not everything should be a CRDT
	- notifications, server-driven changes
	- derived state
	- ephemeral state
- Lessons from scaling sync
	- Initial load prioritization helps with graceful degradation and load distribution
		- HTTP for initial fetch
		- WebSocket updates subscription
			- doesn't do HTTP long polling

## Always be pair programming
Talk by swyx

- Put humans back in the loop, steering is nice when mistakes happen... and mistakes happen!
- Flow window is important (dependent on task but Windsurf/Cognition uses 5s)
	- Any task longer than this leads to users just leaving to do something else before coming back
- Probability of breaking flow geometrically increases 10% every second that passes while you wait for agent response
- Don't die in the semi-async valley of death
	- Actually argues that hard problems should _involve people more_ than harder tasks
- Rate limits of [[thoughts/human computer interaction|human computer interaction]]
	- Typing 40wpm
	- Reading 200pm
	- Speaking 150wpm
	- Listening 300wpm
	- Cost to sync you 24hrs/day into GPT5
		- Text: $0.09, 150wpm x 60 x 24hrs = 216k tokens
		- Voice: $4.32-8.64, 1440mins/day
		- Vision: $7.50, 1080 => 1750 toks, 1fps => 151m tokens
- Principles
	- No buttons (don't only trigger inference when the user does something, arguing for 'always-on')
	- Use vision
	- Never block input
		- Work on interactive planning, agent work syncing via an intermediate document/worklist
