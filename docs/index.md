---
layout: home

hero:
  name: Washmachine
  text: Shellcode Loader Builder
  tagline: A CLI-first shellcode loader builder with a WinUI 3 desktop app — driven entirely by a single YAML catalog.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/0xhmza/washmachine

features:
  - icon: 🔄
    title: Multiple Shellcode Sources
    details: Support for file (.bin), raw hex paste, URL (web delivery), or built-in test payload
  - icon: 🌐
    title: Web Payload Wizard
    details: Step-by-step UI to configure encoding, envelope, and web-fetch helper via Bin2Shell
  - icon: 📝
    title: YAML Template Engine
    details: One file defines every C++ template and snippet — no recompile needed to add new techniques
  - icon: 🔌
    title: Pluggable Snippets
    details: Anti-debugging, evasion, guardrails, process injection, shellcode execution, UAC bypass
  - icon: 🔍
    title: Auto-discovered Compiler
    details: Detects MSVC (cl.exe), GCC (g++.exe), or Clang (clang++.exe) from PATH and VS install paths
  - icon: 🔐
    title: Payload Encoding
    details: Bin2Shell integration for encoder, envelope, anti-emulation, and web-helper selection
---

## Overview

Washmachine wraps the full shellcode-loader workflow into one tool: pick a shellcode source, choose a C++ template, stack pluggable feature snippets (anti-debugging, evasion, guardrails, process injection, shellcode execution, UAC bypass), and compile with whatever toolchain is on the machine.

Available as both a **standalone CLI** (`washmachine-cli`) and a **WinUI 3 desktop app**.

## Documentation

- [Getting Started](/getting-started) — installation, setup, and first run
- [CLI Reference](/cli-reference) — command flags and examples
- [Architecture](/architecture) — catalog model and rendering flow

## Requirements

### CLI (washmachine-cli)

| Component | Version |
|-----------|---------|
| **OS** | Windows 10 1809+ / Windows 11 |
| **.NET** | 8.0 Runtime x64 |
| **C++ Compiler** | MSVC, MinGW-w64, or Clang |
| **Python** | 3.10+ (for Bin2Shell) |

### Desktop App (washmachine)

| Component | Version |
|-----------|---------|
| **OS** | Windows 10 1809+ / Windows 11 |
| **.NET** | 8.0 Desktop Runtime x64 |
| **Windows App SDK** | 1.8 Runtime |
| **C++ Compiler** | MSVC, MinGW-w64, or Clang |
| **Python** | 3.10+ (for Bin2Shell) |

## Quick Start

### Building

```bash
# Build docs locally
npm install
npm run docs:dev
```

### CLI Examples

```bash
# Compile from a .bin shellcode file
washmachine-cli compile -s payload.bin -t shellcode-minimal

# Compile with XOR encoding
washmachine-cli compile -s payload.bin -e 1 --json

# Analyze a PE file
washmachine-cli analyze target.exe --json

# Inject shellcode into an existing PE
washmachine-cli backdoor --pe target.exe -s payload.bin -o patched.exe

# List available templates and compilers
washmachine-cli list --templates
washmachine-cli list --compilers
```

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
