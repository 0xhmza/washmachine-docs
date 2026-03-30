# Getting Started

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

## Clone and build

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
dotnet build washmachine.sln
```

## CLI usage flow

```powershell
# Build a loader from shellcode file
washmachine-cli compile -s payload.bin -t shellcode-minimal

# Analyze a PE file
washmachine-cli analyze target.exe --json

# Strip shellcode from a PE into .bin
washmachine-cli strip target.exe -o extracted.bin

# Backdoor a PE with shellcode
washmachine-cli backdoor --pe target.exe -s payload.bin -o patched.exe
```

## Provision Bin2Shell

```powershell
washmachine-cli provision
```

Bin2Shell is also auto-provisioned by the desktop app on first run when required.

## Output locations

- Compiled binaries: `temp/cpp/Compiled BInaries/`
- Session logs: `logging/session_<timestamp>_<uuid>/`
- Test harness results: `test_results.json`

## Next steps

- Read the [CLI Reference](/cli-reference) for full command details.
- Read the [Architecture](/architecture) for project and pipeline internals.

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
