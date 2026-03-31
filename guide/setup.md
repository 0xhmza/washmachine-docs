# Setup

This guide covers installing Washmachine and validating the runtime environment.

## Requirements

### CLI (`washmachine-cli`)

| Component | Version | Notes |
|---|---|---|
| OS | Windows 10 1809+ / Windows 11 | x64 only |
| .NET | 8.0 Runtime x64 | Required for CLI execution |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` | At least one must be discoverable |
| Python | 3.10+ | Required only for Bin2Shell features (encoding/envelope) |

### Desktop application (`washmachine`)

| Component | Version | Notes |
|---|---|---|
| OS | Windows 10 1809+ / Windows 11 | x64 only |
| .NET | 8.0 Desktop Runtime x64 | Required for WinUI 3 |
| Windows App SDK | 1.8 Runtime | Mica backdrop, NavigationView |
| C++ Compiler | MSVC, MinGW-w64 `g++`, or `clang++` | At least one must be discoverable |
| Python | 3.10+ | Required only for Bin2Shell features |

### Compiler support

The build system auto-discovers compilers in this order:

1. Environment variables (`VCToolsInstallDir`, `VCINSTALLDIR`)
2. Visual Studio installations (2017–2022, all editions)
3. System PATH (`cl.exe`, `g++.exe`, `clang++.exe`)

Run `washmachine-cli list compilers` to verify which toolchains are available.

## Clone and build

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
dotnet build washmachine.sln
```

The solution builds three projects:

| Project | Output |
|---|---|
| `Washmachine.Core` | Shared class library (dependency of CLI and GUI) |
| `Washmachine.Cli` | `Output/cli/Debug/net8.0/washmachine-cli.exe` |
| `washmachine` | `Output/Debug/net8.0-windows10.0.19041.0/washmachine.exe` |

::: tip Build scripts
Use the included build script for convenience:
```powershell
.\build.ps1                    # Build Debug
.\build.ps1 -Config Release   # Build Release
.\build.ps1 -Launch           # Build and launch GUI
```
:::

## Validate the installation

```powershell
washmachine-cli --help
```

Verify the runtime catalog and compiler discovery:

```powershell
washmachine-cli list templates
washmachine-cli list compilers
washmachine-cli list snippets
```

::: tip Interactive REPL
Launch `washmachine-cli` without arguments to enter the interactive shell with tab completion, command history, and sub-shells for each command.
:::
