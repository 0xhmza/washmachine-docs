---
layout: home

hero:
  name: "WASHMACHINE"
  text: "Shellcode Loader Toolkit"
  tagline: "YAML-driven loader generation · PE analysis & injection · Encoder/envelope transforms · CLI + Desktop"
  actions:
    - theme: brand
      text: ⚡ Get Started
      link: /guide/setup
    - theme: alt
      text: CLI Reference
      link: /cli/overview
    - theme: alt
      text: GitHub →
      link: https://github.com/0xhmza/washmachine

features:
  - icon: 🧬
    title: Shared Core Architecture
    details: "Three-project .NET 8 solution — Washmachine.Core hosts 16 services (compiler, PE analysis, backdoor, strip, catalog, provisioning) consumed by both the CLI and WinUI 3 desktop client through a unified pipeline."
    link: /internals/overview
    linkText: Explore architecture →
  - icon: ⚙️
    title: YAML-Controlled Generation
    details: "10 snippet sections, 6 templates, and 50+ evasion techniques loaded from a runtime YAML catalog (~1,400 lines). Anti-debugging, anti-sandbox, process injection, UAC bypass — fully configurable per compilation."
    link: /cli/compile
    linkText: View commands →
  - icon: 🔍
    title: PE Analysis & Injection
    details: "Deep PE inspection with headers, sections, imports, exports, TLS callbacks, code caves, and a 0–100 security score. Backdoor injection via code cave, new section, or section extension with register-safe carrier stubs."
    link: /internals/pe-analysis
    linkText: See PE tooling →
  - icon: 🧪
    title: Automated Test Harness
    details: "Three-phase validation: encoder × envelope × web combinations, template × snippet permutations, and multi-shellcode asset testing. JSON output for CI/CD integration."
    link: /guide/testing
    linkText: Try it now →
  - icon: 🔗
    title: Bin2Shell Integration
    details: "Optional encoding (XOR, ARX8) and envelope (Base91, Base64, Base32) stages powered by Bin2Shell. Web delivery mode separates payload from loader with runtime HTTP fetch and reconstruction."
    link: /bin2shell/overview
    linkText: Learn more →
  - icon: 🖥️
    title: Desktop Application
    details: "WinUI 3 interface with Mica backdrop, visual shellcode source selection, template configuration, compiler detection, and a web payload wizard for guided encoding workflows."
    link: /internals/overview#desktop-application
    linkText: View desktop docs →
---

## Overview

Washmachine is a Windows-focused shellcode loader generation toolkit. It compiles customizable C++ loaders from a YAML-driven catalog of evasion techniques, injection methods, and encoding transforms.

### Core capabilities

| Capability | Description |
|---|---|
| **Compile** | Generate C++ loaders from shellcode with selectable templates, snippet combinations, and Bin2Shell encoding/envelope transforms |
| **Analyze** | Deep PE inspection — headers, sections, imports, exports, code caves, suspicious APIs, security scoring (0–100) |
| **Backdoor** | Inject shellcode into existing PE files via code cave, new section, or section extension injection with register preservation |
| **Strip** | Extract raw shellcode from PE files — entry point, named section, all executable sections, or raw byte ranges |
| **Test** | Automated three-phase validation across encoder/envelope/template/snippet combinations |
| **Provision** | Download and install Bin2Shell and external dependencies |

### Interfaces

- **`washmachine-cli`** — command-line interface with one-shot execution and an interactive REPL with tab completion
- **`washmachine`** — WinUI 3 desktop application with visual configuration and guided workflows
- **`Washmachine.Core`** — shared .NET 8 class library powering both interfaces with identical behavior

### Project structure

| Component | Technology | Description |
|---|---|---|
| `Washmachine.Core` | .NET 8 class library | 16 services, 16 models — compile pipeline, PE tools, catalog, provisioning |
| `Washmachine.Cli` | .NET 8 console app | 7 commands, interactive REPL, Spectre.Console rich output |
| `washmachine` | .NET 8 WinUI 3 | 5 pages, wizard windows, Mica backdrop, 980×720 default |
| `Assets/default.yaml` | YAML catalog | 10 snippet sections, 6 templates, ~1,400 lines |

## Documentation

| Page | Description |
|---|---|
| [Setup](/guide/setup) | Prerequisites, build, and validation |
| [First Compilation](/guide/first-compile) | Compile, analyze, strip, and backdoor workflows |
| [CLI Reference](/cli/overview) | All 7 commands with every option |
| [Architecture](/internals/overview) | Solution layout, services, and desktop app |
| [YAML Catalog](/internals/yaml-catalog) | Snippet sections, templates, and catalog format |
| [Compile Pipeline](/internals/compile-pipeline) | Pipeline stages, toolchain discovery |
| [Bin2Shell](/bin2shell/overview) | Encoder/envelope algorithms and integration |

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
