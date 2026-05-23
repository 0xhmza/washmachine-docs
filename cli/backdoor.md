# `backdoor`

Inject shellcode into an existing PE file. Supports 5 injection methods, 3 execution modes (normal / silence / dropper), register-safe carrier code, exit-call patching, subsystem patching, and session logging.

```text
washmachine-cli backdoor --pe <file> --shellcode <file> [options]
```

Run `backdoor` with no arguments to drop into an interactive session that walks you through every option.

## Required arguments

| Option | Alias | Type | Description |
|---|---|---|---|
| `--pe` | | path | Target PE file to backdoor |
| `--shellcode` | `-s` | path | Shellcode `.bin` file to inject |

## Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | path | `<input>.backdoored.exe` | Output file path |
| `--method` | `-m` | enum | `code-cave` | Injection method (see below) |
| `--mode` | | enum | `normal` | Execution mode (see below) |
| `--implant` | | path | none | Standalone implant `.exe` to embed (required when `--mode dropper`) |
| `--carrier` | `--invoke` | enum | `entry-point` | Carrier invocation strategy (`entry-point` or `dll-main`) |
| `--encryption` | `--enc` | enum | `none` | Payload transform — done in `encode`, not here |
| `--section-name` | | string | `.extra` | Name for new/extended section |
| `--cave-min-size` | | int | `0` | Minimum code cave size in bytes |
| `--no-remove-sig` | | flag | | Retain PE digital signature |
| `--no-patch-subsystem` | | flag | | Don't patch subsystem to GUI |
| `--no-preserve-entry` | | flag | | Don't resume the original entry point after payload |
| `--no-patch-iat` | | flag | | Skip IAT patching during backdoor |
| `--no-patch-exit` | | flag | | Don't patch exit calls in shellcode |
| `--dry-run` | | flag | | Analyze and plan without injecting |
| `--session-log` | | flag | | Force per-run session logging on |
| `--no-session-log` | | flag | | Force per-run session logging off |
| `--verbose` | | flag | | Enable verbose diagnostic output |
| `--json` | | flag | | Emit machine-readable JSON |

## Injection methods

| Method | Aliases | Description |
|---|---|---|
| `code-cave` | `codecave`, `cave` | Locate and use existing null-byte sequences in executable sections — zero structural change |
| `new-section` | `newsection`, `section` | Append a new executable section — unlimited payload size, structurally obvious |
| `section-ext` | `sectionext`, `extend` | Extend the last section and append the payload |
| `text-pad` | `textpad` | Use slack space at the end of `.text` — zero file-size growth |
| `tls-callback` | `tlscb` | Register a TLS callback (x64 only) — runs **before** `main()` |

## Execution modes

| Mode | Behavior |
|---|---|
| `normal` | Implant and host run together. Payload executes during the carrier hook then control returns to the host's entry point. |
| `silence` | Host runs normally; the implant fires silently only when the binary is launched with arguments. Useful when the target needs to remain functionally identical. |
| `dropper` | The host drops and runs a separate implant `.exe` from an embedded `.dpl` section on first launch. Requires `--implant <file>` — that file is XOR-encrypted and appended to the host. |

## Processing stages

1. Validate inputs and parse injection parameters.
2. Analyze target PE: architecture, sections, entry point, code caves.
3. Read shellcode bytes and compute SHA-256.
4. Run pre-flight checks: .NET assembly, packing, entry point validity, signature presence, cave space.
5. *(If `--dry-run`)* Report analysis and exit.
6. Optionally strip digital signature.
7. Write shellcode payload to selected location.
8. Generate register-safe carrier code (push/pop all registers, call shellcode, restore, jump to original EP).
9. Patch exit calls in shellcode (`ExitProcess` → `ExitThread`).
10. Optionally patch subsystem to GUI (suppress console window).
11. Recalculate PE checksum.
12. Write backdoored PE to output path.

## JSON output schema

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
  ]
}
```

## Examples

```powershell
# Basic code-cave injection
washmachine-cli backdoor --pe target.exe -s payload.bin

# New section method with custom output
washmachine-cli backdoor --pe target.exe -s payload.bin -m new-section -o patched.exe

# TLS callback — runs before main()
washmachine-cli backdoor --pe target.exe -s payload.bin -m tls-callback

# Silence mode: host stays identical, implant fires only when args are passed
washmachine-cli backdoor --pe notepad.exe -s payload.bin --mode silence -o notepad.patched.exe

# Dropper mode: host drops and runs an embedded implant
washmachine-cli backdoor --pe legit.exe -s loader.bin --mode dropper --implant implant.exe

# Dry run to assess feasibility
washmachine-cli backdoor --pe target.exe -s payload.bin --dry-run

# JSON output with verbose logging
washmachine-cli backdoor --pe target.exe -s payload.bin --json --verbose

# Keep signature and skip exit patching
washmachine-cli backdoor --pe target.exe -s payload.bin --no-remove-sig --no-patch-exit
```
