# `doctor`

Preflight: verify that every external tool Washmachine needs is installed and version-compatible. The same check runs automatically at REPL startup; `doctor` is the explicit, detailed form.

```text
washmachine-cli doctor [--json]
```

## What it checks

| Tool | Required? | Source of truth |
|---|---|---|
| **LLVM clang++** | Yes (for the obfuscation backend) | `Tools\LLVM\bin\clang++.exe` next to the executable, or `clang++.exe` on PATH |
| **LLVM clang-cl** | Yes (for clang-cl + MSVC sysroot) | `Tools\LLVM\bin\clang-cl.exe`, or PATH |
| **MSVC cl.exe** | Yes (sysroot for clang-cl) | Discovered via `CompilerToolLocator` — VS installer, `VCToolsInstallDir`, or PATH |
| **Bin2Shell** | Yes (for encoding/envelope features) | `Tools\Bin2Shell\main.py` |

For each tool the report includes:

| Column | Meaning |
|---|---|
| **Status** | `OK`, `INCOMPATIBLE`, or `MISSING` |
| **Version** | Parsed from `clang++ --version` for LLVM tools |
| **Detail** | Remediation hint when the status isn't `OK` |

## LLVM version policy

The LLVM/clang minimum is set by the new pass-manager APIs the bundled obfuscation passes consume:

| Constant | Value | Why |
|---|---|---|
| `ToolPreflightService.RequiredLlvmMajor` | **20** | `registerOptimizerEarlyEPCallback` with `ThinOrFullLTOPhase` (LLVM 16+), `getFirstNonPHIIt()` returning `BasicBlock::iterator` (LLVM 20+) |
| `ToolPreflightService.RecommendedLlvmMajor` | **22** | Full obfuscation-pass API surface |

If the parsed major is < 20, `doctor` flags `INCOMPATIBLE` and the LLVM obfuscation backend will be unavailable at compile time. Other commands (analyze, strip, backdoor, encode without obfuscation) continue to work.

## Options

| Option | Description |
|---|---|
| `--json` | Emit machine-readable JSON instead of the styled table; exit code remains `0` when everything passes, `1` otherwise |
| `--help`, `-h` | Print usage |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All required tools present and version-compatible |
| `1` | One or more tools missing or incompatible — see the per-row detail |

## Example output

```text
                                 Tool preflight
╭───────────────┬─────────┬─────────┬──────────────────────────────────────────╮
│ Tool          │ Status  │ Version │ Detail                                   │
├───────────────┼─────────┼─────────┼──────────────────────────────────────────┤
│ LLVM clang++  │ OK      │ 22.1.4  │ OK.                                      │
│ LLVM clang-cl │ OK      │ 22.1.4  │ OK.                                      │
│ MSVC cl.exe   │ OK      │ —       │ OK — required by clang-cl for the MSVC   │
│               │         │         │ sysroot.                                 │
│ Bin2Shell     │ MISSING │ —       │ main.py not found at Tools\Bin2Shell\…   │
│               │         │         │ Run 'washmachine-cli provision' …        │
╰───────────────┴─────────┴─────────┴──────────────────────────────────────────╯

[-] Bin2Shell: main.py not found … Run 'washmachine-cli provision' …
Required LLVM major: ≥ 20   Recommended: 22+
```

## JSON schema

```json
{
  "allOk": false,
  "requiredLlvmMajor": 20,
  "recommendedLlvmMajor": 22,
  "statuses": [
    {
      "tool": "LLVM clang++",
      "found": true,
      "location": "C:\\…\\Tools\\LLVM\\bin\\clang++.exe",
      "version": "22.1.4",
      "meetsRequirements": true,
      "detail": "OK."
    },
    {
      "tool": "Bin2Shell",
      "found": false,
      "location": null,
      "version": null,
      "meetsRequirements": false,
      "detail": "main.py not found at Tools\\Bin2Shell\\main.py. Run 'washmachine-cli provision' …"
    }
  ]
}
```

## Examples

```powershell
# Detailed preflight before shipping a build
washmachine-cli doctor

# Machine-readable form for CI / Make targets
washmachine-cli doctor --json
```

## Related

- [Setup](/guide/setup) — how to install the prerequisites `doctor` checks for
- [provision](/cli/provision) — installs the Bin2Shell `main.py` that `doctor` looks for
- [Troubleshooting](/guide/troubleshooting) — what to do when `doctor` reports `INCOMPATIBLE` or `MISSING`
