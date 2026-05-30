---
layout: home

hero:
  name: "WASHMACHINE"
  text: "Build evasive Windows loaders from a single YAML playbook."
  tagline: "A template-based evasion framework that turns shellcode into a hardened executable in a single command — with LLVM obfuscation, polymorphic encoding, and surgical PE injection built in."
  image:
    src: /logo.png
    alt: Washmachine
  actions:
    - theme: brand
      text: Get started in 60 seconds
      link: /guide/setup
    - theme: alt
      text: How it works
      link: /internals/overview
    - theme: alt
      text: GitHub →
      link: https://github.com/0xhmza/washmachine

features:
  - icon: 🧬
    title: One YAML, every loader
    details: "Templates, snippets, encoders, and evasion techniques all live in one playbook. Swap techniques, ship new ones, or fork the whole catalog without touching a single line of C++ or rebuilding the app."
    link: /internals/yaml-catalog
    linkText: Inside the playbook →
  - icon: ⚙️
    title: LLVM obfuscation, plug-and-play
    details: "Optional clang-cl backend with four IR-level pass plugins: bogus control flow, control-flow flattening, instruction substitution, and string obfuscation. Static signatures don't survive a rebuild."
    link: /internals/llvm-backend
    linkText: See the passes →
  - icon: 🔍
    title: PE inspection that knows what to look for
    details: "Deep PE analysis covering headers, sections, imports, TLS, code caves, and a 0–100 security score. Combined with five-method backdoor injection that picks the safest path automatically."
    link: /internals/pe-analysis
    linkText: Analyze a PE →
  - icon: 🔗
    title: Bin2Shell encoding pipeline
    details: "11 encoders (ChaCha20, XTEA, XOR-random), 11 envelopes (Base91, IPv4-array, UUID-array…), and 4 external carriers (PNG, BMP, ICO, INI). Polymorphism reseeds every symbol on every build."
    link: /bin2shell/overview
    linkText: Explore the encoders →
  - icon: 🖥️
    title: CLI and desktop, one engine
    details: "A full-featured CLI with an interactive REPL, tab completion, and Metasploit-style sub-shells — paired with a WinUI 3 desktop app with guided workflows. Same playbook, same output, your choice of front-end."
    link: /cli/overview
    linkText: Drive the CLI →
  - icon: 🧪
    title: Three-phase test harness
    details: "Validate encoder × envelope combinations, template × snippet permutations, and multi-shellcode corpora — all in one command. JSON output drops into CI/CD without ceremony."
    link: /guide/testing
    linkText: Run the matrix →
---

<div class="vp-doc" style="max-width: 1152px; margin: 0 auto; padding: 0 24px;">

## Why Washmachine

Most loader generators give you one technique and one binary. Washmachine gives you a **catalog** — a YAML playbook that lets you compose evasion, persistence, encoding, and execution like building blocks. Edit one file, get a new loader; every build is unique by default.

It's the same engine, the same playbook, two front-ends:

- **`washmachine-cli`** — for one-liners, REPL sessions, and CI pipelines
- **`washmachine`** — a WinUI 3 desktop client with guided workflows

Both produce identical output because they share a single C++ core.

## The pipeline at a glance

Every build follows the same six-stage pipeline — from a raw `.bin` to a compiled, obfuscated, optionally packaged executable. Stages are composable: turn off encoding, swap the compiler backend, or skip injection — Washmachine still picks the safest defaults for what's left.

[![Washmachine compilation pipeline](/pipeline.svg)](/internals/compile-pipeline)

→ **Walk through every stage** in the [Compilation Flow](/internals/compile-pipeline).

## At a glance

| Capability | One-liner |
|---|---|
| **`encode`** | Build a loader from a template + snippet selection + optional encoding |
| **`analyze`** | Deep PE inspection — headers, imports, code caves, 0–100 security score |
| **`backdoor`** | Inject shellcode into existing PEs via 5 methods × 3 execution modes |
| **`strip`** | Extract raw shellcode from a PE — entry point, named section, or byte range |
| **`show`** | Browse the playbook — templates, snippets, encoders, envelopes, compilers |
| **`doctor`** | Preflight: LLVM, MSVC, Bin2Shell — all checked, all explained |
| **`test`** | Three-phase validation matrix with JSON output for CI |
| **`provision`** | One-command install of Bin2Shell, SGN, and Donut |

## Get started

```powershell
# 1. Verify the toolchain
washmachine-cli doctor

# 2. Build your first loader
washmachine-cli encode -s payload.bin -t default

# 3. Or drop into the interactive REPL
washmachine-cli
```

→ Full walkthrough: [Setup](/guide/setup) · [First Compilation](/guide/first-compile)

::: warning Security notice
Washmachine is built **exclusively** for educational use and authorized security testing. By using it you agree to apply it only where you have explicit, written authorization.
:::

</div>
