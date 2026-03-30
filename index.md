---
layout: home

hero:
  name: Washmachine
  text: Shellcode loader builder toolkit
  tagline: A CLI-first shellcode loader builder with a WinUI 3 desktop app, powered by a single YAML catalog.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/0xhmza/washmachine

features:
  - icon: 🧩
    title: YAML-driven templates
    details: Templates, snippet sections, and UI inputs are all defined in one runtime catalog.
  - icon: 🖥️
    title: CLI + Desktop app
    details: Same core engine exposed through washmachine-cli and a WinUI 3 GUI.
  - icon: 🛠️
    title: Compiler discovery
    details: Auto-detects MSVC, MinGW g++, and clang++ from PATH and Visual Studio locations.
  - icon: 🌐
    title: Multiple shellcode sources
    details: Supports .bin files, raw hex, URL mode, and a built-in test payload.
  - icon: 🔐
    title: Bin2Shell integration
    details: Optional encoder and envelope pipeline with auto-provisioning support.
  - icon: 📦
    title: PE tooling included
    details: Analyze, strip, and backdoor workflows are available directly in the CLI.
---

## Quick links

- [Getting Started](/getting-started)
- [CLI Reference](/cli-reference)
- [Architecture](/architecture)
- [Main Repository](https://github.com/0xhmza/washmachine)

## Current project status

The public repository currently includes:

- `washmachine` (WinUI desktop app)
- `Washmachine.Cli` (CLI toolkit)
- `Washmachine.Core` (shared pipeline/services)
- `Assets/vx_api_snippets.yaml` (single source of truth for templates/snippets)

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
