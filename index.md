---
layout: home

hero:
  name: Washmachine
  text: The aura-first shellcode loader builder toolkit
  tagline: Build faster, move cleaner, and ship stronger loaders with one YAML-driven platform powering both CLI and WinUI 3 desktop workflows.
  actions:
    - theme: brand
      text: Quickstart
      link: /getting-started
    - theme: alt
      text: CLI Reference
      link: /cli-reference
    - theme: alt
      text: GitHub
      link: https://github.com/0xhmza/washmachine

features:
  - icon: ⚡
    title: One catalog, full control
    details: Templates, snippets, and UI inputs live in one YAML source of truth so operators can evolve techniques without rebuilding the app.
  - icon: 🎯
    title: Dual interface edge
    details: Same core engine across washmachine-cli and the WinUI 3 desktop app—pick speed in terminal or control in UI.
  - icon: 🧠
    title: Compiler-flex mindset
    details: Auto-detects MSVC, MinGW g++, and clang++ from common Windows environments to keep compilation friction low.
  - icon: 🌐
    title: Real-world source options
    details: Work from .bin files, raw hex, URL-hosted payloads, or test payload mode for fast validation loops.
  - icon: 🔒
    title: Bin2Shell integration
    details: Supports encoder/envelope workflows with provisioning support, enabling layered payload handling in one pipeline.
  - icon: 🧪
    title: Built-in PE operations
    details: Analyze, strip, and backdoor command paths are available directly from CLI workflows.
---

## Why Washmachine stands out

Washmachine is built for practitioners who want **repeatable, modular, and fast** loader workflows without juggling fragmented scripts.

It is not just another builder. It is a unified operator surface that combines:

- consistent YAML-defined behavior,
- dual delivery modes (CLI + desktop), and
- practical PE tooling in the same ecosystem.

That combination gives Washmachine a distinctive execution aura: **agile in setup, serious in capability, and clean in structure**.

## Documentation map

- **New here?** Start with [Quickstart](/getting-started)
- **Need command detail?** Jump to [CLI Reference](/cli-reference)
- **Want internals?** Read [Architecture](/architecture)

## From the public project

The public repository currently includes:

- `washmachine` (WinUI desktop app)
- `Washmachine.Cli` (CLI toolkit)
- `Washmachine.Core` (shared pipeline/services)
- `Assets/vx_api_snippets.yaml` (template and snippet source catalog)

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
