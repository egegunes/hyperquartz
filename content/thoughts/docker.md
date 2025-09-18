---
title: Docker
date: 2025-07-30
tags:
  - seed
---


## Networking
### Host Network Driver

If you use the `host` network mode for a container, that container's network stack isn't isolated from the Docker host (the container shares the host's networking namespace), and the container doesn't get its own IP-address allocated.

### Bridge Network Driver

A bridge network is a [[thoughts/Link Layer|Link Layer]] device which forwards traffic between network segments.

Docker creates a default bridge network (also called bridge) and newly-started containers connect to it unless otherwise specified. These containers can all talk to each other by IP address (unless you manually `--link` them).

In Docker, a bridge network uses a software bridge which lets containers connected to the same bridge network communicate, while providing isolation from containers that aren't connected to that bridge network by installing IP tables rules in the host machine so that containers on different bridge networks can't communicate directly with each other.

User-defined bridges allow containers can resolve each other by name.