---
layout: home

hero:
  name: Washmachine
  text: Technical documentation for the Washmachine platform
  tagline: YAML-driven shellcode loader generation and PE tooling exposed through a CLI and a WinUI 3 desktop client.
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
  - icon: 🧩
    title: Shared core architecture
    details: "Washmachine.Core hosts compile, catalog, PE, and provisioning services consumed by both washmachine-cli and the WinUI application."
  - icon: ⚙️
    title: YAML-controlled generation
    details: "Templates, snippets, encoders, and envelopes are loaded from the runtime catalog and rendered into compilable C++ sources."
  - icon: 🧪
    title: Built-in validation paths
    details: "The CLI includes analyze, strip, backdoor, and test workflows for artifact inspection, payload extraction, patching, and regression checks."
  - icon: 🔗
    title: Bin2Shell integration
    details: "Optional encoding and envelope stages can be provisioned and invoked through the same generation pipeline."
---

## Overview

Washmachine is a Windows-focused shellcode loader toolkit with:

- a command-line interface (`washmachine-cli`),
- a desktop interface (`washmachine`, WinUI 3),
- and a shared implementation layer (`Washmachine.Core`).

The project uses a catalog-based model where generation logic and snippet composition are configured through YAML assets. Both user interfaces execute the same backend services to keep behavior consistent between automation and interactive use.

## Repository components

The public repository includes:

- `washmachine` — WinUI 3 desktop application
- `Washmachine.Cli` — CLI command surface
- `Washmachine.Core` — shared business logic and pipeline services
- `Assets/vx_api_snippets.yaml` — runtime catalog for template and snippet content

## Documentation set

- [Quickstart](/getting-started) — prerequisites, installation, and first command execution
- [CLI Reference](/cli-reference) — command contracts, options, and examples
- [Architecture](/architecture) — internal pipeline and service design
- [Bin2Shell Integration](/bin2shell) — assisting tool behavior, output contracts, and integration model

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
