---
title: Loop Device
date: 2026-01-18
tags:
  - seed
---
Loop devices are [[thoughts/Unix#Pseudo-devices|Unix pseudo-devices]] to makes a computer file accessible as a [[thoughts/block device]].

Typically used for image-file like ISO images or to mount an encrypted file system as if it was unencrypted (loop devices allow for data elaboration, the 'file' used in the loop device may be another pseudo-device)

You can construct loop devices that can then be used as base layers for overlay filesystems.