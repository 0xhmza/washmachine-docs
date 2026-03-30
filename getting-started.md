# Quickstart

Welcome to Washmachine—the fast lane for YAML-driven shellcode loader workflows.

If you want a clean first run with zero guesswork, follow this page top-to-bottom.

## What you get

- A shared pipeline available as CLI and desktop app
- Template + snippet composition from one runtime catalog
- Optional Bin2Shell-backed encoding/envelope flow
- Built-in PE analysis and transformation operations

## Requirements

### CLI (`washmachine-cli`)

| Component | Version |
|---|---|
| OS | Windows 10 1809+ / Windows 11 |
| .NET | 8.0 Runtime x64 |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` |
| Python | 3.10+ (required for Bin2Shell features) |

### Desktop app (`washmachine`)

| Component | Version |
|---|---|
| OS | Windows 10 1809+ / Windows 11 |
| .NET | 8.0 Desktop Runtime x64 |
| Windows App SDK | 1.8 Runtime |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` |
| Python | 3.10+ (required for Bin2Shell features) |

## 1) Clone and build

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
dotnet build washmachine.sln
```

## 2) Run a core CLI flow

```powershell
# Compile a loader from shellcode
washmachine-cli compile -s payload.bin -t shellcode-minimal

# Analyze PE metadata and sections
washmachine-cli analyze target.exe --json

# Extract executable bytes into .bin payload
washmachine-cli strip target.exe -o extracted.bin

# Inject shellcode into an existing PE
washmachine-cli backdoor --pe target.exe -s payload.bin -o patched.exe
```

## 3) Provision Bin2Shell (optional but recommended)

```powershell
washmachine-cli provision
```

The desktop app can auto-provision Bin2Shell on first use when required.

## 4) Know your output paths

- Compiled binaries: `temp/cpp/Compiled Binaries/`
- Session logs: `logging/session_<timestamp>_<uuid>/`
- Test harness results: `test_results.json`

## Next moves

- Continue with [CLI Reference](/cli-reference) for complete options
- Continue with [Architecture](/architecture) for internals and flow

::: tip Exclusivity Note
Washmachine’s edge is its single-catalog operating model: one YAML source, many execution paths, consistent outcomes.
:::

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
