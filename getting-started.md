---
outline: deep
---

# Quickstart

Minimal technical path to install Washmachine, validate runtime dependencies, and execute primary CLI workflows.

::: tip After completing this page you will have
- A working build of the solution
- A validated CLI runtime
- A provisioned Bin2Shell integration (optional)
- Familiarity with output artifacts and logs
:::

## Requirements

### CLI (`washmachine-cli`)

| Component | Version |
|---|---|
| OS | Windows 10 1809+ / Windows 11 |
| .NET | 8.0 Runtime x64 |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` |
| Python | 3.10+ (required for Bin2Shell features) |

### Desktop application (`washmachine`)

| Component | Version |
|---|---|
| OS | Windows 10 1809+ / Windows 11 |
| .NET | 8.0 Desktop Runtime x64 |
| Windows App SDK | 1.8 Runtime |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` |
| Python | 3.10+ (required for Bin2Shell features) |

## 1) Clone and build the solution

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
dotnet build washmachine.sln
```

## 2) Validate command availability

```powershell
washmachine-cli --help
washmachine-cli list --templates
washmachine-cli list --compilers
```

This confirms that the CLI executable is available, the runtime catalog is readable, and compiler discovery is functioning.

## 3) Execute core CLI workflows

```powershell
# Compile a loader from shellcode input
washmachine-cli compile -s payload.bin -t shellcode-minimal

# Analyze PE metadata and sections
washmachine-cli analyze target.exe --json

# Extract executable bytes into .bin payload
washmachine-cli strip target.exe -o extracted.bin

# Inject shellcode into an existing PE
washmachine-cli backdoor --pe target.exe -s payload.bin -o patched.exe
```

## 4) Provision Bin2Shell integration (optional)

```powershell
washmachine-cli provision
```

Provisioning downloads and configures the Bin2Shell tool used by encoder/envelope flows.
The desktop application can also invoke provisioning automatically when these features are requested.

## 5) Verify output locations

- Generated C++ sources and compiled binaries: `temp/cpp/Compiled Binaries/`
- Session-scoped diagnostic logs: `logging/session_<timestamp>_<uuid>/`
- Test harness summary file: `test_results.json`

## Continue

- [CLI Reference](/cli-reference) — command-level options and argument contracts
- [Architecture](/architecture) — internal service flow and pipeline stages
- [Bin2Shell](/bin2shell) — encoder/envelope implementation details and data contracts

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
