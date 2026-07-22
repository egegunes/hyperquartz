---
title: Reinforcement Learning
date: 2026-07-07
tags:
  - seed
---

- At every step of interaction, the agent sees a (possibly partial) observation $o$ of the state $s$ of the world, and then decides on an action $a_t$ from the action space to take.
	- The agent also perceives a **reward** signal from the environment, a number that tells it how good or bad the current world state is.
	- The goal of the agent is to maximize its cumulative reward, called **return**.