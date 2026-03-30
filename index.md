---
layout: home

hero:
  name: "WASHMACHINE"
  text: "Shellcode Loader Toolkit"
  tagline: "YAML-driven generation · PE tooling · CLI + Desktop"
  actions:
    - theme: brand
      text: ⚡ Get Started
      link: /getting-started
    - theme: alt
      text: CLI Reference
      link: /cli-reference
    - theme: alt
      text: GitHub →
      link: https://github.com/0xhmza/washmachine

features:
  - icon: 🧬
    title: Shared Core Architecture
    details: "Washmachine.Core hosts compile, catalog, PE, and provisioning services — consumed by both the CLI and WinUI 3 desktop client through a unified pipeline."
    link: /architecture
    linkText: Explore architecture →
  - icon: ⚙️
    title: YAML-Controlled Generation
    details: "Templates, snippets, encoders, and envelopes are loaded from a runtime catalog and rendered into compilable C++ sources — fully configurable."
    link: /cli-reference
    linkText: View commands →
  - icon: 🧪
    title: Built-in Validation Paths
    details: "Analyze, strip, backdoor, and test workflows for artifact inspection, payload extraction, PE patching, and automated regression checks."
    link: /getting-started
    linkText: Try it now →
  - icon: 🔗
    title: Bin2Shell Integration
    details: "Optional encoding and envelope stages powered by Bin2Shell — provisioned and invoked through the same generation pipeline for seamless transforms."
    link: /bin2shell
    linkText: Learn more →
---

## Overview

Washmachine is a Windows-focused shellcode loader toolkit featuring:

- **`washmachine-cli`** — command-line interface for automated workflows
- **`washmachine`** — WinUI 3 desktop application for interactive use
- **`Washmachine.Core`** — shared implementation layer powering both interfaces

The project uses a **catalog-based model** where generation logic and snippet composition are configured through YAML assets. Both interfaces execute identical backend services for consistent behavior.

## Repository Components

| Component | Description |
|---|---|
| `washmachine` | WinUI 3 desktop application |
| `Washmachine.Cli` | CLI command surface |
| `Washmachine.Core` | Shared business logic and pipeline services |
| `Assets/vx_api_snippets.yaml` | Runtime catalog for templates and snippets |

## Documentation

| Page | Description |
|---|---|
| [Quickstart](/getting-started) | Prerequisites, installation, and first execution |
| [CLI Reference](/cli-reference) | Command contracts, options, and examples |
| [Architecture](/architecture) | Internal pipeline and service design |
| [Bin2Shell](/bin2shell) | Encoding tool behavior and integration model |

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
