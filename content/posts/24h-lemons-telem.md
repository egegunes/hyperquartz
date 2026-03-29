---
title: How we built racecar telemetry for a '92 Accord
date: 2026-03-23
tags:
  - seed
draft: true
---
  Building a DIY Racing Telemetry System for a 1992 Honda Accord

  The car

  - 1992 Honda Accord EX, F22A4 engine, H2U5 5-speed manual
  - 195/50R15 Hankook RS4 tires
  - Used for track days at Sonoma Raceway and Thunder Hill

  Hardware stack

  - Arduino Mega 2560: Reads 5 analog sensors (ECT, TPS, MAP, brake, battery) + 2 interrupt-driven pulse signals (RPM tach, VSS) at 25Hz over serial
  - RaceBox Micro: BLE GPS/IMU at 25Hz — lat/lon/speed/heading + 3-axis accelerometer + 3-axis gyro
  - NVIDIA Jetson Nano: Runs the telemetry server, serial/BLE bridges, and GStreamer video streaming
  - 2x USB webcams (Logitech C930e + secondary): H.264 encoded on Jetson GPU, streamed via SRT + Rode LavMicro-U mic for in-car audio, Opus encoded

  Firmware design decisions

  - Ring buffer of 16 timestamps for RPM/VSS frequency measurement — avoids the classic problem of overestimating frequency during deceleration by comparing pulse-only frequency vs. frequency-including-gap-to-now and taking the minimum [^1]
  - 5.0 tach pulses per revolution (empirically calibrated — Honda FSMs don't specify this for the F22)
	  - did this by having one person rev to a fixed rpm and count edges for a fixed period and divide count by duration

  Data pipeline: WAL engine

  - Custom write-ahead log instead of a database — the Jetson has 4GB RAM and limited storage, needed something lightweight
  - Compact disk format: one JSON line per ingest batch with all channels merged: `{"seq":1,"ts":...,"d":{"rpm":3500,"speed":65,...}}`
  - Generation-based file rotation at 5,000 ticks per file (~200 seconds of data)
  - Range footers (#range:min,max) on last line of each WAL file for fast index rebuilding
  - Write path is synchronous (fsync for durability), read path is async (non-blocking queries)
  - Lock file (wal.lock) prevents concurrent server instances and protects during compaction

  Wire format: JSON → NDJSON → MessagePack

  - Started with JSON.stringify of full response arrays — on the Jetson this was the bottleneck (5-8s for a single lap)
  - Switched to NDJSON streaming (pipe raw WAL lines with zero serialization) — server CPU dropped to near zero
  - Then switched to MessagePack (msgpackr) for ~40% smaller payloads

  Lap detection

  - GPS-based, no trackside hardware needed
  - Project each GPS point onto nearest segment of track centerline polyline → normalized progress 0–1
  - Detect finish line crossing: previousProgress > 0.85 && currentProgress < 0.15
  - First lap auto-flagged as "out lap", stopping a session flags the current lap as "in lap"
  - Pace delta computed from progress-vs-time curve of best lap, interpolated at current track position

  Client: Vite multi-page app

  - Dashboard: Live gauges (speed/RPM/throttle with colored segment bars), GPS follow map (satellite tiles, heading-rotated), track overview (dark tiles, fixed bearing), g-force dial, diagnostics stack (coolant °F, MAP kPa, battery V, Jetson temp °C), lap times with pace delta
  - Review: Session/lap browser with IndexedDB cache (stale-while-revalidate), seekable lap replay with carry-forward channel merging, trail color modes (speed/throttle/RPM/brake), g-force dial + gauges at seek position
  - Debug: Auto-discovered channel grid with sparklines and hover readout, systemd service management (status/logs/restart with sudo prompt), camera exposure controls
  - Editor: Leaflet track polyline editor with toolbar modes (track/turn/finish/select), satellite toggle, bearing slider 0-360°, download-only (no server save)
  - Stream overlays: 3 transparent-background pages for OBS browser source compositing — track map, car data (value + sparkline), lap timing

  Streaming: SRT over Tailscale

  - GStreamer pipelines: MJPEG capture → jpegdec → nvvidconv → nvv4l2h264enc (hardware H.264) → MPEG-TS → SRT
  - C930e pinned to port 9000 (primary), secondary cameras at 720p on 9001
  - Audio: alsasrc → Opus 64kbps → MPEG-TS → SRT on port 9002
  - SRT latency set to 100ms (half the Tailscale RTT of ~150ms) — allows one retransmit attempt
  - GOP reduced to 15 frames (0.5s) to limit "bit bleeding" artifact duration when packets drop
  - Clock overlay baked into primary video stream

  What's next

  - Gear detection calibration (H2U5 ratios are known but RPM/VSS mapping needs
  real-world validation with calibrate-gears.ts)
  - VSS pulses-per-km calibration (currently placeholder at 4000)
  - Possibly switching WAL disk format to binary for even faster reads

  Tools & stack

  - TypeScript everywhere (server, client, firmware bridge scripts)
  - PlatformIO for Arduino firmware
  - Vite for client bundling
  - Vitest for server tests (72 passing)
  - Leaflet + leaflet-rotate for maps
  - msgpackr for binary serialization
  - node-ble for RaceBox BLE connection
  - GStreamer + nvv4l2h264enc for hardware-accelerated video
  - Tailscale for zero-config networking to Jetson

  - Day 0 (Feb 6): Initial commit — just a PlatformIO config and Arduino Mega
  firmware skeleton for reading sensors. Project sat dormant for 5 weeks.
  - Day 1 (Mar 16): Everything came alive in one burst. Stood up the Node.js
  telemetry server, Vite client, Bluetooth bridge for RaceBox, systemd services for
  headless Jetson operation. First g-force circle visualization. Basic SSE streaming
   working end-to-end.
  - Day 2 (Mar 17): Multi-camera streaming marathon. 17+ commits trying SDP, then
  settling on SRT + MPEG-TS. Auto-detection of USB cameras by card name. Flipped the
   secondary camera, tuned exposure/gain/brightness on the C930e. Added audio
  capture. Many commits like try? and sfdklsdfjl — classic hardware debugging
  energy.
  - Day 3 (Mar 18): Serial bridge debugging — getting the Mega actually talking to
  the Jetson reliably over /dev/ttyACM0. Fixed digital pin assignments for tach and
  VSS (had them swapped). Added camera controls to the web UI. Built the track map
  editor. First pass at theming — dark mode with orange accents.
  - Day 4 (Mar 19): Signal quality work. RPM was reporting 1.5x too high — went
  through several tach pulse-per-rev calibrations (4.5 → 4.0 → 5.0) before settling
  on 5.0 empirically. Added EMA smoothing to the serial bridge for RPM. Built the
  fonts/styling system, imported Berkeley Mono. First real data flowing through the
  whole stack.
  - Day 5 (Mar 20): The big architecture day. Built the WAL engine from scratch
  after the initial approach (in-memory Map of all entries) OOM'd the Jetson at 16M+
   entries. Removed startup replay, removed snapshots, switched to scanning only the
   last WAL file for recovery. Added systemd service controls to the debug page.
  Session management with CRUD endpoints. Lap detection algorithm. Started the
  codebase refactoring plan.
  - Day 6 (Mar 21): Performance obsession. WAL compaction script (ran against 3,535
  files / 17M entries on the Jetson). Discovered that per-channel WAL lines weren't
  being merged — fixed compaction to coalesce same-timestamp entries within 50ms
  buckets. Switched wire format from JSON → NDJSON (zero server-side serialization)
  → MessagePack (40% smaller). Built the review page with IndexedDB caching. Added
  transparent stream overlay pages for OBS compositing.
  - Day 7 (Mar 22): Streaming tuning. Diagnosed SRT packet drops — RTT to Jetson
  over Tailscale was 130-170ms but SRT latency was set to 50ms (impossible to even
  round-trip an ACK). Bumped to 100ms. Reduced GOP from 30 to 15 frames to limit
  corruption duration on drops. Pinned C930e to port 9000 regardless of USB
  enumeration order. Capped secondary cameras to 720p. Audio pipeline tuning — ALSA
  buffer from default ~200ms down to 40ms, Opus frame size to 10ms.
  - Day 8 (Mar 23): Polish. Services panel UX (prompt for sudo on restart instead of
   persistent password field, larger fonts). WAL lock file for mutual exclusion.
  Compact script falls back to server endpoint if lock is held. Fixed client-side
  dedup bug where per-batch seq numbers caused all channels except the first to be
  silently dropped from the live dashboard.

## overestimation problem

```
Say the engine is at 5000 RPM and drops to 1000 RPM. You have a ring buffer of recent pulse timestamps:

pulse times:  [100ms, 102ms, 104ms, 106ms, 108ms]
											↑ last pulse
now = 150ms

Method 1 — pulse-only frequency: Look at oldest and newest pulse in the buffer. 5 pulses / (108-100)ms = 625 Hz. This reflects what the engine was doing, not what it's doing now. During decel, this massively overestimates because all those pulses came in when RPM was still high. No new pulses have arrived in 42ms but this method doesn't know that.

Method 2 — frequency-including-gap-to-now: Use the span from oldest pulse to right now. 5 pulses / (150-100)ms = 100 Hz. This accounts for the silence since the last pulse. If the engine is slowing down, the growing gap since the last pulse pulls the frequency estimate down.

Take the minimum: min(625, 100) = 100 Hz. During steady-state RPM both methods agree. During deceleration, method 2 is lower (correct). During acceleration, method 1 is lower (correct — you don't want to overcount based on future expectations).

Without this, the tach would "hang" at the old RPM reading during engine braking until enough new slow pulses fill the ring buffer — a very noticeable lag on the dashboard.
```

## how to calculate deltas

```
Traditional pace delta compares elapsed time at the same time into the lap (e.g. "at 30 seconds in, you're 0.5s ahead"). This is wrong — if you're faster, you're at a different part of the track at the 30-second mark, so you're comparing braking into turn 5 against mid-straight before turn 4.

Instead, compare at the same track position:

1. Build the reference curve from best lap: For each GPS point in the best lap, compute (progress, elapsed) — where progress is 0–1 around the track (projected onto the centerline polyline) and elapsed is time since lap start. This gives you a monotonically increasing curve of "how long it took the best lap to reach each point on track."
   
2. Query at current position: Take your current GPS, project it onto the track to get your current progress (say 0.42), and look up what elapsed time the best lap had at progress 0.42. Say it was 28.3s. You're currently at 27.8s elapsed. Delta = -0.5s (you're ahead).
   
3. Interpolation: The best lap doesn't have a data point at exactly progress 0.42, so linearly interpolate between the two nearest points in the curve.

This means the delta is always comparing the same corner entry, the same apex, the same braking zone — regardless of whether you're going faster or slower overall. A driver sees "+0.3s" entering turn 7 and knows they lost time at that part of the track, not some time-shifted section.
```

## self-healing services

- brown-outs during car starting

```
The Jetson runs headless in the car with no monitor or keyboard — it boots, connects to Tailscale, and needs everything running automatically. 

Five systemd services handle this:
1. racebox-connect (establishes BLE connection to the RaceBox),
2. telem-server (the WAL engine and HTTP API on port 4400),
3. racebox-bridge (pipe racebox data from BLE to the server)
4. serial-bridge (pipe serial data from arduino into the server), and
5. video-streaming (GStreamer camera/audio capture over SRT)

Systemd also gives us process supervision for free — if a bridge crashes (BLE disconnects, USB camera gets unplugged), systemd restarts it automatically. The debug page exposes service status, log tailing, and restart buttons over HTTP so you can troubleshoot from your laptop trackside without SSH. The RaceBox bridge has its own 30-second watchdog (no BLE packets → exit → systemd restart), and the streaming script monitors its child PIDs and tears down all streams if any single
pipeline dies. This matters because the car is bouncing around a track — USB connections are unreliable and the system needs to self-heal without anyone touching it.
```