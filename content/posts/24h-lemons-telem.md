---
title: Building a live telemetry system for a $800 race car
date: 2026-03-23
tags:
  - seed
draft: true
---
I race a manual 1992 Honda Accord in [24 Hours of Lemons](https://24hoursoflemons.com/) with our team Magicarp Motors. We all built and raced the car together, but the telemetry system was built over the course of about a week in late March. Shihao and I both took time off work to build it from scratch before our Sonoma race. He designed the hardware architecture and wrote the embedded software; I built the software stack and data flows.

## Why we built our own

The main commercial options (RaceChrono, Harry's Lap Timer) get you phone GPS (which is normally only accurate to ~10m) and maybe an OBD-II connection, but we wanted real sensors: actual throttle position off the ECU, manifold pressure, coolant temp, brake pressure, tach signal, vehicle speed signal. We wanted live video with telemetry overlays compositable in OBS, proper pace deltas, and telemetry review for analyzing post-race. So we built the whole thing.

This post walks through the software side: what it does, how each part works, and the decisions we made along the way.

## Hardware

Shihao covers the hardware in detail in [his post](https://www.shihaocao.com/builds/telemetry).

The short version: the Accord is pre-OBD2, so most telemetry points come from analog sense taps off the ECU harness — voltage dividers for 12V signals, direct connections for 5V.

An Arduino Mega 2560 reads five analog sensors (coolant temp, throttle position, MAP, brake pressure, battery voltage) plus interrupt-driven RPM and VSS at 25Hz. A RaceBox Micro handles GPS and IMU over BLE at the same rate.

Everything feeds into an NVIDIA Jetson Nano that runs the telemetry server, bridge processes, and GStreamer video streaming — two USB webcams (H.264 encoded on the Jetson's GPU, streamed via SRT) and a Rode LavMicro-U mic. The whole system runs off the kill switch's +12V downstream.

## Firmware: frequency measurement

Shihao wrote the embedded firmware on the Mega; I wrote the serial bridge that reads its output on the Jetson side. The firmware uses a ring buffer of 16 timestamps for RPM and VSS frequency measurement. The reason is a little subtle, and it matters enough that I'll walk through it.

Say the engine is at 5000 RPM and drops to 1000 RPM. The last five pulses in the ring buffer came in at 100, 102, 104, 106, and 108ms. It's now 150ms and no new pulses have arrived.

The naive approach — what I'm calling **pulse-only frequency** — looks at the oldest and newest pulse in the buffer: 5 pulses over 8ms = 625 Hz. This reflects what the engine _was_ doing, not what it's doing now. During deceleration it massively overestimates because all those pulses arrived when RPM was still high, and the 42ms silence since the last pulse is invisible.

A better measure is **frequency-including-gap-to-now**: use the span from the oldest pulse to the current time. That gives 5 pulses over 50ms = 100 Hz. The growing gap since the last pulse pulls the estimate down as the engine slows.

We take the minimum of the two — min(625, 100) = 100 Hz. This gives the right answer in every regime. During steady state, both methods agree. During deceleration, the gap-to-now method is lower (correct). During acceleration, the pulse-only method is lower (also correct — you don't want to overcount based on future expectations). Without this, the tach hangs at the old RPM reading during engine braking until enough new slow pulses fill the ring buffer. Very noticeable lag on the dashboard.

## Data pipeline: the WAL engine

The Jetson has 4GB of RAM and limited storage. My initial approach stored everything in an in-memory Map, which OOM'd at 16 million entries. A real database felt like overkill, so I built a custom write-ahead log.

Each ingest batch becomes one JSON line with all channels merged: `{"seq":1,"ts":...,"d":{"rpm":3500,"speed":65,...}}`. Files rotate every 5,000 ticks — roughly 200 seconds of data. Each WAL file ends with a range footer (`#range:min,max`) so the index can rebuild on recovery without scanning every line. The write path is synchronous with `fsync` for durability; the read path is async and non-blocking. A lock file (`wal.lock`) prevents concurrent server instances and protects data during compaction.

## Wire format: JSON → NDJSON → MessagePack

This went through three iterations. I started with `JSON.stringify` of full response arrays — on the Jetson this turned out to be the bottleneck. A single lap took 5–8 seconds to serialize. Switching to NDJSON streaming (piping raw WAL lines with zero serialization) dropped server CPU to near zero. Then I switched again to MessagePack via `msgpackr` for ~40% smaller payloads over the wire.

## Lap detection

Lap detection is GPS-based, no trackside hardware needed. Each GPS point gets projected onto the nearest segment of the track centerline polyline to produce a normalized progress value from 0 to 1. A finish line crossing is detected when progress drops from above 0.85 to below 0.15 (the wraparound). First lap is automatically flagged as an out lap; stopping a session flags the current lap as an in lap.

## Pace deltas

This is the part I care most about getting right, because most consumer lap timers do it differently than we wanted.

Traditional pace delta compares elapsed time at the same point _in time_ — e.g. "at 30 seconds in, you're 0.5s ahead." The problem: if you're faster, you're at a different part of the track at the 30-second mark. You end up comparing braking into turn 5 against mid-straight before turn 4. The number is hard to act on when looking back on telemetry data.

Instead, we compare at the same _track position_. Build a reference curve from the best lap: for each GPS point, compute (progress, elapsed), where progress is 0–1 around the track and elapsed is time since lap start. This gives a monotonically increasing curve — "how long it took the best lap to reach each point on track."

To query: take the current GPS fix, project it onto the track to get progress (say 0.42), and look up the best lap's elapsed time at that same progress. If the best lap reached 0.42 at 28.3s and you're at 27.8s, delta = −0.5s — you're ahead. Since the best lap won't have a data point at exactly 0.42, linearly interpolate between the two nearest points.

This means the delta always compares the same corner entry, the same apex, the same braking zone — regardless of pace. A driver sees "+0.3s" entering turn 7 and knows they lost time _there_, not at some time-shifted point on the track.

## Streaming: SRT over Tailscale

Video runs on GStreamer pipelines: MJPEG capture → `jpegdec` → `nvvidconv` → `nvv4l2h264enc` (hardware H.264) → MPEG-TS → SRT. Audio goes through `alsasrc` → Opus at 64kbps → MPEG-TS → SRT on port 9002.

SRT latency is set to 100ms, which is about half the Tailscale RTT of ~150ms — enough headroom for one retransmit attempt. I initially had it at 50ms, which isn't even enough time to round-trip an ACK, let alone retransmit a dropped packet. I also reduced the GOP from 30 to 15 frames (0.5 seconds) to limit how long "bit bleeding" artifacts persist when packets drop. A clock overlay is baked into the primary stream so I can sync video to telemetry in post.

We ran driver communication completely separately from telemetry — just a Discord audio call. This meant that if the telemetry stack restarted (or browned out from a crank), comms stayed up. Very useful during hot pits.

## What's next

We're racing again at Buttonwillow later this year. We want to tap brake pressure, individual gear detection, and tire and brake temps. Longer term, we want to generalize the system to other vehicles. Most of the stack is car-agnostic — the WAL, the client, the streaming, the lap detection — and the car-specific parts (sensor taps, pulse calibration) are really just a config file and a wiring afternoon. We've already had a few other Lemons teams ask about running it. For a donation to the team, Shihao and I are happy to help bootstrap you and call until the system works. We love seeing more teams have more fans cheer for them.

The whole system came together in about a week. Most of the code is messy, but it worked, and we made it to the grid. When I stayed out for one more lap chasing a 2:28, it was the delta on S's screen that told him to let me. I think that's the best thing a telemetry system can do — not just record what happened, but give the people in the pit enough confidence to trust the driver's instinct in the moment.