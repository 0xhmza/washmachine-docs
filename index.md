---
layout: home

hero:
  name: "WASHMACHINE"
  text: "Template based Evasion Framework"
  tagline: "Playbook-driven loader generation · LLVM obfuscation backend · PE analysis & injection · Polymorphic Bin2Shell · CLI + Desktop"
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
    details: "Three-project .NET 8 solution — Washmachine.Core hosts every service (compiler, PlaybookService, LlvmPipelineService, PE analysis, backdoor, strip, ToolPreflightService) consumed by both the CLI and WinUI 3 desktop client through a unified pipeline."
    link: /internals/overview
    linkText: Explore architecture →
  - icon: 📖
    title: Playbook-Driven Generation
    details: "A single YAML playbook (Assets/default.yaml) declares every template and snippet. 12 snippet sections, 7 templates, 60+ evasion techniques — anti-debug, anti-sandbox, process injection, UAC bypass, persistence — swappable without recompilation."
    link: /internals/yaml-catalog
    linkText: View playbook spec →
  - icon: ⚙️
    title: LLVM Obfuscation Backend
    details: "Optional clang-cl + LLVM pass plugins: bogus control flow, control-flow flattening, instruction substitution, string obfuscation. Each pass is a hot-loadable .dll built against LLVM 20+ (recommended 22+). The doctor command preflight checks version compatibility."
    link: /internals/llvm-backend
    linkText: See obfuscation passes →
  - icon: 🔍
    title: PE Analysis & Injection
    details: "Deep PE inspection: headers, sections, imports, exports, TLS callbacks, code caves, security score (0–100). Backdoor injection via code cave, new section, section extension, .text padding, or TLS callback — with register-safe carrier stubs and three modes (normal, silence, dropper)."
    link: /internals/pe-analysis
    linkText: See PE tooling →
  - icon: 🧪
    title: Automated Test Harness
    details: "Three-phase validation: encoder × envelope × web-helper combinations, template × snippet permutations, and multi-shellcode asset testing. JSON output for CI/CD integration. doctor subcommand verifies every external tool at startup."
    link: /guide/testing
    linkText: Try it now →
  - icon: 🔗
    title: Polymorphic Bin2Shell
    details: "11 encoders (XOR, RC4-random, TEA, XTEA, ChaCha20…), 11 envelopes (Base91, Base64, IPv4/MAC/UUID arrays…), 4 external-file carriers (PNG, BMP, ICO, INI), and a per-run symbol renamer so two builds of the same command produce different-looking source."
    link: /bin2shell/overview
    linkText: Learn more →
---

## Overview

Washmachine is a Windows-focused shellcode loader generation toolkit. It compiles customizable C++ loaders from a YAML playbook of evasion techniques, injection methods, and encoding transforms — and ships everything as a one-click MSI installer with the LLVM obfuscation toolchain bundled.

### Core capabilities

| Capability | Description |
|---|---|
| **Encode** | Generate C++ loaders from shellcode with selectable templates, snippet combinations, and Bin2Shell encoding/envelope/carrier transforms |
| **Analyze** | Deep PE inspection — headers, sections, imports, exports, code caves, suspicious APIs, security scoring (0–100) |
| **Backdoor** | Inject shellcode into existing PEs via 5 methods (code-cave, new-section, section-ext, text-pad, TLS callback) with 3 execution modes (normal, silence, dropper) |
| **Strip** | Extract raw shellcode from PE files — entry point, named section, raw range, or every executable section. Managed (.NET) assemblies are auto-routed through donut for PIC conversion |
| **Show** | Browse playbook templates, snippets, encoders, envelopes, and discovered compilers in a Metasploit-style catalog view |
| **Doctor** | Preflight check — verifies LLVM/clang, MSVC, Bin2Shell are installed and that the LLVM version is compatible with the bundled obfuscation passes |
| **Test** | Automated three-phase validation across encoder/envelope/template/snippet combinations |
| **Provision** | Download and install Bin2Shell and optional external tools (SGN, Donut) |

### Interfaces

- **`washmachine-cli`** — command-line interface with one-shot execution and an interactive REPL (tab completion, command history, Metasploit-style sub-shells for each command)
- **`washmachine`** — WinUI 3 desktop application with visual configuration and guided workflows
- **`Washmachine.Core`** — shared .NET 8 class library powering both interfaces with identical behavior

### Project structure

| Component | Technology | Description |
|---|---|---|
| `Washmachine.Core` | .NET 8 class library | All services — compile pipeline, PE tools, PlaybookService, ToolPreflightService, LlvmPipelineService, provisioning |
| `Washmachine.Cli` | .NET 8 console app | 9 commands, interactive REPL, Spectre.Console rich output |
| `washmachine` | .NET 8 WinUI 3 | Multi-page navigation, wizard windows, Mica backdrop, startup preflight |
| `Assets/default.yaml` | YAML playbook | 12 snippet sections, 7 templates |
| `Assets/llvm-passes/*` | LLVM pass plugins | 4 obfuscation passes; built locally via `Assets/llvm-passes/build-all.ps1` |
| `installer/Washmachine.wxs` | WiX manifest | One-shot MSI installer that bundles LLVM/clang + Bin2Shell |

## Documentation

| Page | Description |
|---|---|
| [Setup](/guide/setup) | Prerequisites, build, and the doctor preflight check |
| [First Compilation](/guide/first-compile) | Encode, analyze, strip, and backdoor workflows |
| [CLI Reference](/cli/overview) | All 9 commands with every option |
| [Architecture](/internals/overview) | Solution layout, services, and desktop app |
| [Playbook (YAML Catalog)](/internals/yaml-catalog) | Snippet sections, templates, and playbook format |
| [LLVM Obfuscation Backend](/internals/llvm-backend) | Pass plugins, version requirements, build steps |
| [Build & Installer](/internals/build) | publish.ps1, the WiX MSI, what ships in the bundle |
| [Bin2Shell](/bin2shell/overview) | Encoders, envelopes, carriers, polymorphism |

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
