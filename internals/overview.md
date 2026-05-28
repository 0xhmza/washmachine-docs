# How It Works

Washmachine turns raw shellcode into a compiled Windows executable by combining a YAML playbook, an optional encoding pipeline, and a C++ compiler. This page walks through the main concepts so you can make informed decisions when building loaders.

## The generation pipeline

Every `encode` run follows the same sequence:

```text
Shellcode source (file / hex / URL)
        │
        ▼
Encoding (optional)
  Bin2Shell: encoder + envelope + carrier
  SGN: Shikata Ga Nai pre-pass
        │
        ▼
Template rendering
  Load template from playbook
  Resolve snippet selections
  Substitute {{PLACEHOLDER}} tokens
        │
        ▼
Compilation
  Auto-discovered C++ compiler (MSVC / GCC / Clang)
  Optional: clang-cl + LLVM obfuscation passes
        │
        ▼
Output binary  (YYYYMMDD_HHMMSS-<hash>.exe)
```

See [Templates & Snippets](/internals/template-engine) for a detailed walkthrough of template rendering, and [Compilation Flow](/internals/compile-pipeline) for what happens during the compile step.

## The playbook

All loader behaviour is defined in `Assets/default.yaml`. The playbook declares:

- **Templates** — C++ skeleton files with `{{PLACEHOLDER}}` tokens at each injection point
- **Snippet sections** — categorized C++ code fragments that fill those placeholders
- **Inputs** — configurable parameters (target process name, install directory, guardrail conditions)

Changing a technique means editing the YAML. No recompilation required.

You can drop additional `.yaml` files into `Assets/` and switch between them from the GUI Settings page or the CLI. See [Playbook Reference](/internals/yaml-catalog) for the full format.

## Snippet sections

| Section | Key | Purpose |
|---|---|---|
| Anti Emulation | `antiemulation` | Stall or confuse AV emulators before payload runs |
| Anti Analysis | `antianalysis` | Detect and terminate analysis tools |
| Anti Debugging | `antidebugging` | Detect active debuggers |
| Anti Sandbox/VM | `antisandbox` | Detect virtual environments |
| Guardrails | `guardrail` | Environment checks — domain, date, file existence |
| Decoy | `decoy` | Distraction actions (open Notepad, show a dialog) |
| UAC Bypass | `uacb` | Re-launch elevated without a UAC prompt |
| Installation | `installation` | Copy loader to a stable directory before persistence |
| Persistence | `persistence` | Register the loader with the OS for re-execution |
| Evasion | `evasion` | Defender exclusions applied to every tracked path |
| Process Injection | `psinjection` | Inject shellcode into a remote process |
| Shellcode Execution | `shellcodeexecution` | Execute shellcode in the current process |

Most sections are multi-select; UAC bypass, installation, persistence, and process injection are single-select.

## Templates

Seven built-in templates are available out of the box. Each template controls which snippet sections are active and in what order:

| Template | Description |
|---|---|
| `minimal` | Shellcode source + installation + persistence + execution — no evasion layers |
| `minimal-dll` | Same as minimal, but with a `DllMain` entry point |
| `default` | All sections: full evasion, UAC bypass, installation, persistence |
| `paranoid` | Defense-in-depth with a continuous watchdog thread polling for debuggers |
| `aggressive` | Actively terminates analysis tools and debuggers |
| `stealth` | Six-layer sequential defense with delayed execution |
| `sgncarrier` | Designed for Shikata Ga Nai pre-encoded payloads (requires RWX allocation) |

## Encoding

Encoding is an optional layer handled by [Bin2Shell](/bin2shell/overview). When enabled, raw shellcode bytes are transformed before being embedded in the loader source:

```text
raw shellcode  →  encoder  →  envelope  →  loader source
                   (e.g. ChaCha20)   (e.g. Base64)
```

Alternatively, the encoded payload can be written to a carrier file (PNG, BMP, ICO, INI) that the loader reads from disk at runtime.

## Interfaces

Both interfaces — CLI and desktop — produce identical output because they share the same compilation engine.

### `washmachine-cli`

A command-line tool with two execution modes:

- **One-shot:** pass all arguments on the command line and exit immediately
- **Interactive REPL:** run without arguments to enter a persistent shell with tab completion, command history, and Metasploit-style sub-shells per command

### `washmachine` (desktop app)

A WinUI 3 application with page-based navigation:

| Page | Purpose |
|---|---|
| **Main** | Shellcode source selection — file, hex string, or URL. Auto-detects .NET assemblies and shows conversion options |
| **Compile** | Template selection, snippet configuration, and compilation. Supports both MSVC and the LLVM obfuscation backend |
| **Backdoor** | PE injection with all 5 methods and 3 execution modes |
| **Settings** | Application preferences and session logging configuration |

## Output locations

After a successful build:

| Path | Contents |
|---|---|
| `temp/cpp/Compiled Binaries/` | Output `.exe` / `.dll`, named `YYYYMMDD_HHMMSS-<hash>.exe` |
| `logging/session_<timestamp>/source.cpp` | Rendered C++ source before compilation |
| `logging/session_<timestamp>/build_log.txt` | Full compiler output (stdout + stderr) |

See [Output & Artifacts](/guide/output) for details on all artifact paths and settings.
