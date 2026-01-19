---
title: Device mapper
date: 2026-01-18
tags:
  - seed
aliases:
  - devmapper
---
Device-mapper is a Linux kernel framework that maps virtual block devices to physical storage.

Targets in device-mapper are plugsins that define how device-mapper handles IO for a region of a virtual block device.

## `thin-pool`

Target that provides:

1. thin provisioning: you can create virtual block devices that appear to have a certain size (e.g., 100GB) but only consume actual storage for the data actually written. The pool allocates blocks on-demand
2. copy-on-write snapshots: the snapshot and original share all their data until something is modified, at which point only the changed blocks are copied.