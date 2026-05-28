---
layout: home

hero:
  name: "WASHMACHINE"
  text: "Template-based Evasion Framework"
  tagline: "Playbook-driven loader generation · LLVM obfuscation · PE analysis & injection · Polymorphic encoding · CLI + Desktop"
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
    title: Playbook-Driven Generation
    details: "All templates, snippets, and evasion techniques live in a single YAML playbook. Swap techniques, add new ones, or build entirely custom loaders without touching any code."
    link: /internals/yaml-catalog
    linkText: View playbook reference →
  - icon: ⚙️
    title: LLVM Obfuscation Backend
    details: "Optional clang-cl compilation path with four IR-level pass plugins: bogus control flow, control-flow flattening, instruction substitution, and string obfuscation."
    link: /internals/llvm-backend
    linkText: Configure obfuscation →
  - icon: 🔍
    title: PE Analysis & Injection
    details: "Deep PE inspection covering headers, sections, imports, TLS callbacks, code caves, and a 0–100 security score. Backdoor injection across five methods and three execution modes."
    link: /internals/pe-analysis
    linkText: Learn PE tooling →
  - icon: 🔗
    title: Polymorphic Encoding
    details: "11 encoders (including ChaCha20, XTEA, XOR-random), 11 envelopes (Base91, IPv4-array, UUID-array…), 4 external carriers (PNG, BMP, ICO, INI), and per-run symbol renaming."
    link: /bin2shell/overview
    linkText: Explore encoding →
  - icon: 🖥️
    title: CLI + Desktop
    details: "A full-featured command-line interface with an interactive REPL and tab completion, plus a WinUI 3 desktop application with guided workflows — both driven by the same engine."
    link: /cli/overview
    linkText: CLI reference →
  - icon: 🧪
    title: Automated Testing
    details: "Three-phase test harness: encoder/envelope combinations, template/snippet permutations, and multi-shellcode corpus testing. JSON output for CI/CD integration."
    link: /guide/testing
    linkText: Run tests →
---

## Overview

Washmachine is a Windows-focused shellcode loader generation toolkit. It compiles customizable C++ loaders from a YAML playbook of evasion techniques, injection methods, and encoding transforms — and ships as a one-click MSI installer with the LLVM obfuscation toolchain bundled.

### Capabilities

| Capability | Description |
|---|---|
| **encode** | Generate C++ loaders from shellcode with selectable templates, snippet combinations, and encoding transforms |
| **analyze** | Deep PE inspection — headers, sections, imports, exports, code caves, security scoring (0–100) |
| **backdoor** | Inject shellcode into existing PEs via 5 methods (code-cave, new-section, section-ext, text-pad, TLS callback) with 3 execution modes |
| **strip** | Extract raw shellcode from PE files — entry point, named section, raw range, or every executable section |
| **show** | Browse playbook templates, snippets, encoders, envelopes, and discovered compilers |
| **doctor** | Preflight check — verifies LLVM/clang, MSVC, and Bin2Shell are installed and version-compatible |
| **test** | Automated three-phase validation across encoder/envelope/template/snippet combinations |
| **provision** | Download and install Bin2Shell and optional external tools (SGN, Donut) |

### Interfaces

- **`washmachine-cli`** — command-line interface with one-shot execution and an interactive REPL (tab completion, command history, Metasploit-style sub-shells)
- **`washmachine`** — WinUI 3 desktop application with visual configuration and guided workflows

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
