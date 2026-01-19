---
title: "OCI Image"
date: "2026-01-18"
tags:
  - seed
---
[OCI](https://github.com/opencontainers/image-spec) is the standardized container format used by [[thoughts/docker]].

A useful way to look at a Dockerfile is as a series of shell commands, each generating a tarball; we call these "layers".

To rehydrate a container from its image, we just start the the first layer and unpack one on top of the next.

You can then unpack the container layers into a mounted [[thoughts/loop device]].

