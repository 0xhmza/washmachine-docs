# `backdoor`

Inject shellcode into an existing PE file. Supports multiple injection strategies, register-safe carrier code, exit call patching, and session logging.

```text
washmachine-cli backdoor --pe <file> --shellcode <file> [options]
```

## Required arguments

| Option | Alias | Type | Description |
|---|---|---|---|
| `--pe` | | path | Target PE file to backdoor |
| `--shellcode` | `-s` | path | Shellcode `.bin` file to inject |

## Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | path | `<input>.backdoored.exe` | Output file path |
| `--method` | `-m` | enum | `code-cave` | Injection method |
| `--carrier` | `--invoke` | enum | `entry-point` | Carrier invocation strategy |
| `--section-name` | | string | `.extra` | Name for new section |
| `--cave-min-size` | | int | `0` | Minimum code cave size in bytes |
| `--no-remove-sig` | | flag | | Retain PE digital signature |
| `--no-patch-subsystem` | | flag | | Don't patch subsystem to GUI |
| `--no-patch-exit` | | flag | | Don't patch exit calls in shellcode |
| `--dry-run` | | flag | | Analyze and plan without injecting |
| `--verbose` | | flag | | Enable verbose diagnostic output |
| `--json` | | flag | | Emit machine-readable JSON |

## Injection methods

| Method | Aliases | Description |
|---|---|---|
| `code-cave` | `codecave`, `cave` | Locate and use existing null-byte sequences in `.text` |
| `new-section` | `newsection`, `section` | Append a new executable section to the PE |
| `section-ext` | `sectionext`, `extend` | Extend the last section and append the payload |

## Carrier invocation

| Strategy | Aliases | Description |
|---|---|---|
| `entry-point` | `entrypoint`, `hijack` | Redirect PE entry point to carrier stub, then jump back to original |

## Processing stages

1. Validate inputs and parse injection parameters.
2. Analyze target PE: architecture, sections, entry point, code caves.
3. Read shellcode bytes and compute SHA-256.
4. Run pre-flight checks: .NET assembly, packing, entry point validity, signature presence, cave space.
5. *(If `--dry-run`)* Report analysis and exit.
6. Optionally strip digital signature.
7. Write shellcode payload to selected location.
8. Generate register-safe carrier code (push/pop all registers, call shellcode, restore, jump to original EP).
9. Patch exit calls in shellcode (ExitProcess → ExitThread).
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

# Dry run to assess feasibility
washmachine-cli backdoor --pe target.exe -s payload.bin --dry-run

# JSON output with verbose logging
washmachine-cli backdoor --pe target.exe -s payload.bin --json --verbose

# Keep signature and skip exit patching
washmachine-cli backdoor --pe target.exe -s payload.bin --no-remove-sig --no-patch-exit
```
