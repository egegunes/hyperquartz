---
title: To grow a tree
date: 2026-06-01
tags:
  - technical
draft: true
---
*Experiments in WebGL, L-systems, and dithering*

- havent updated my site in like 2 years
- had this old sunlight effect but there was this weird rendering artifact

## the long detour through noise

My first instinct was to make branches out of noise, and I spent a long time learning why that doesn't work. Every approach failed for a reason that was obvious only in hindsight.

Ridged noise gave me blobs. If you threshold a 2D noise field you get patches, not lines, and patches don't read as branches no matter how you tune them. Voronoi cell edges looked promising because the edges form one connected web, but every edge encloses a cell, so the result is cracked mud or stained glass. A tree is the opposite of that. It's open, and it never closes a loop. Iso-contours of a smooth field gave me clean connected curves, but they run roughly parallel, like a topographic map, with no sense of a trunk shedding limbs. The closest I got was a kaleidoscopic fractal tree, the kind you fold out of space with `abs()` and a rotation each step, but it's bilaterally symmetric and its canopy is roughly square. The banner is a long thin letterbox, so I was only ever seeing a horizontal slice through the middle of the tree, which is almost all trunk.

The thing all of these miss is that a tree isn't a field. It's a structure with direction and lineage. Grow this way, then split into thinner children that do the same. Noise has no notion of a parent branch or a direction of growth, so there was never going to be a magic threshold that turned it into a tree.

## growing it on the CPU

So I stopped asking the GPU to invent the tree per pixel and grew it once, in plain JavaScript, before drawing anything. A little turtle walks an L-system. It starts with a trunk and buds off thinner, shorter side branches as it goes, and it spits out a flat list of tapered segments. The shader's only job is to take that list and, for each pixel, find the distance to the nearest segment.

Splitting it this way is the whole trick. The structure lives in code I can read and tune, and the drawing is dumb and parallel and fast. Almost every good decision after this point came from being able to change the tree without touching the renderer.

## two pieces of botany

A fractal tree and a real tree are not the same thing, and the gap between them turned out to be two bits of actual plant biology.

The first is da Vinci's pipe model. He noticed that if you add up the thickness of all the branches at any height of a tree, you get roughly the thickness of the trunk. The modern version is that cross-sectional *area* is conserved across a fork, so two equal children are each about 0.71 times the parent's radius rather than half. I'd started with the naive version, conserving width directly, and the branches thinned so fast they died after a split or two. Conserving area instead lets a limb survive six or eight forks and taper gracefully down to a point.

The second is phyllotaxis. Plants tend to space successive branches and leaves around a stem by about 137.5 degrees, the golden angle, which is the most irrational angle there is and therefore the one that packs new growth so it shadows itself the least. I carry a phase down each branch that advances by that angle at every node, and a side shoot's placement comes from the cosine of that phase. Combined with letting the main limb keep the golden fraction of the area at each split, you get the particular rhythm real branches have, where the spacing is regular without ever being even. It's tunable from fully random to fully golden, and the golden end just looks more alive.

## drawing the light

The shader never draws a branch. It draws light, and the branches are the things in the way.

Each layer (the trunk, the branches, the leaves) reports how much light gets through at a given pixel, and I multiply those together to get how lit the wall is. Multiplication is the right move here for two reasons. A shadow falling on a shadow should be darker, and solid wood times anything stays solid, so the trunk never accidentally gets brightened by the dappling around it.

How sharp a shadow is comes down to how far the thing casting it sits from the wall. The sun isn't a point, so a twig pressed against the wall throws a hard dark edge, and a branch high overhead throws a soft faint one as the penumbra spreads. The important bit is that the shadow doesn't darken evenly. It falls off across a band, darkest in the middle and fading at the rim, and the width of that band is what distance controls.

This is the part I got wrong at first. I was filling each branch with one flat shade, which made the thick limbs read as opaque cutouts. Once the falloff is an actual gradient, thickness sorts itself out. A thick limb is wider than its penumbra band, so its core still reaches full dark while the edges lighten. A thin twig is narrower than the band, so its two edges blur into each other and it never fully darkens, which is why the fine stuff naturally dissolves into a softer grey. I stopped having to special-case thin branches at all.

Distance also isn't one number per tree, which is a mistake I made for a while. A real tree is a volume. The trunk is a column somewhere in the middle and the branches reach both toward you and away, wrapping around it. So depth wanders as the tree grows. The trunk holds a central plane, the main limb stays near it, and the side branches drift forward and back each time they fork. The nice consequence is that a single tree carries its own range of focus, some limbs crisp and dark because they happened to land near the wall, others hazy because they drifted behind it. The leaves sit furthest out, the softest layer of all.

Once I have a continuous brightness per pixel I run it through a small curve, a gamma to lift the midtones and then a contrast and a center, which is just me choosing what counts as fully lit, fully shadowed, and the band in between.

## two inks and a dot pattern

The scene renders at a fraction of the real resolution and gets scaled back up with nearest-neighbor sampling, which is where the chunky pixel look comes from. Rather than antialiasing the grey midtones, I dither them. Each pixel compares its brightness against a fixed Bayer threshold pattern and snaps to either lit or shadow, so the grey never actually exists on screen. It's an illusion made of two colors and an ordered field of dots, the same trick a newspaper or an old Game Boy uses. Because the underlying render is low resolution, the dots are big and travel with the image instead of shimmering.

There are really only two inks. The light theme is a letterpress poster, deep navy on warm cream, and the dark theme is a cyanotype, pale blue on prussian. But there's a third color that shows up in exactly one situation. Where a shadow's edge is soft and its tone lands right in the middle between lit and dark, I let it bloom gold. It's gated on two conditions at the same time: the brightness has to be mid-range, and there has to be a real edge there, which I check by looking at the local rate of change of the light. Flat interiors don't qualify. That keeps the gold on the rims of the blurry, far-off branches, which is just where real backlit foliage catches the sun.

## wind

Nothing here is a video. The whole scene is redrawn every frame, so wind is just me nudging the segments over time. A slow gust envelope runs underneath as a resting breeze, and the speed of your cursor raises a ceiling on top of it, so the canopy stirs when you move the mouse and eases back when you stop. The sway accumulates down the tree the way a real one does. The trunk barely moves, the branches lean, and the leaves at the tips flutter the most, each at its own frequency so the whole thing never swings like one rigid board.

## composition

The last layer is plain art direction. There are a handful of scene types, light coming from the top, from one of the top corners, or from a bottom corner, and every tree in a given scene is rooted to the same side so it reads as one source instead of a scatter. I anchor the main trunk near a rule-of-thirds line and leave the opposite side mostly open as sky. The leaves lean toward the same side as the branches. And the roots get pushed well past the edge of the frame, so the boring straight stretch of trunk happens off-screen and you only ever see the part that has already started to fork.

All of it sits behind a debug panel I open with the Konami code, every constant on a slider, because you can't really design a generative system by reading its source. You reshuffle it a few hundred times and watch.
