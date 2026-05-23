# Build & Installer

Washmachine ships three artefacts: the CLI exe, the GUI exe, and a one-shot MSI installer that bundles LLVM + Bin2Shell.

## Build script (`build.ps1`)

```powershell
.\build.ps1 [-Launch] [-SkipClean]
```

Always Release. Cleans every `bin/`, `obj/`, and `Output/` directory by default (skip with `-SkipClean`), then runs:

```powershell
dotnet build Washmachine.Core\Washmachine.Core.csproj   -c Release
dotnet build washmachine.csproj                          -c Release
dotnet build Washmachine.Cli\Washmachine.Cli.csproj      -c Release -r win-x64 --self-contained false
```

The `-Launch` flag starts the GUI after a successful build.

## Publish script (`publish.ps1`)

```powershell
.\publish.ps1 [-Installer] [-SkipBin2ShellProvision] [-Version <X.Y.Z>]
```

Two phases:

| Phase | What runs |
|---|---|
| **A — always** | `dotnet publish` GUI + CLI; provision Bin2Shell into `Tools\Bin2Shell\`; stage `payload\` |
| **B — `-Installer`** | `dotnet tool restore`; `dotnet wix build` → `Washmachine-Setup-<version>.msi` |

The version embedded in the MSI defaults to `<Version>` from `washmachine.csproj`; override with `-Version`.

Use `-SkipBin2ShellProvision` for offline builds — the installer will ship without Bin2Shell and first-run preflight will trigger provisioning on the end-user's machine.

## Build outputs

| Project | Debug Path | Release Path |
|---|---|---|
| **CLI** | `Output/Debug/washmachine-cli.exe` | `Output/Release/publish/washmachine-cli.exe` |
| **GUI** | `Output/Debug/washmachine.exe` | `Output/Release/publish/washmachine.exe` |
| **Core** | `Washmachine.Core/bin/Debug/net8.0/` | *(published as part of CLI/GUI)* |
| **Bundle** | — | `Output/Release-Bundle/payload/` |
| **Installer** | — | `Output/Release-Bundle/Washmachine-Setup-<version>.msi` |

## What's in the MSI

The installer lays out the bundle under `%ProgramFiles%\Washmachine\`:

```text
%ProgramFiles%\Washmachine\
├── washmachine.exe                  GUI
├── washmachine-cli.exe              CLI
├── Washmachine.Core.dll             Shared library
├── …WindowsAppSDK runtime…          WinUI 3 + Bootstrap projection DLLs
├── Assets\
│   ├── default.yaml                 Default playbook
│   ├── playbook.schema.json
│   ├── runtime\…                    C++ runtime headers
│   └── llvm-passes\*\               Pass plugins + pass.dll artefacts
└── Tools\
    ├── LLVM\bin\                    clang++, clang-cl, lld-link, LLVM-C.dll
    └── Bin2Shell\                   Python encoder/envelope/carrier engine
```

Plus two Start-Menu shortcuts (Washmachine GUI + Washmachine CLI in a cmd window).

Approximate sizes:

| Component | Approximate |
|---|---|
| Washmachine core (CLI + GUI + Core + deps) | ~70 MB |
| `Tools\LLVM\bin\` | ~320 MB |
| `Tools\Bin2Shell\` | ~1 MB |
| **MSI total (compressed)** | ~90 MB |

## What's not bundled

**MSVC `cl.exe` is intentionally excluded.** Bundling the MSVC toolchain costs ~2 GB and is licence-sensitive. Instead, `doctor` flags it as missing on first run and tells the user to install VS Build Tools (`vs_BuildTools.exe` with the C++ workload).

`clang-cl` from the bundled LLVM uses the system MSVC sysroot — so the build path is:

```
washmachine ─┬─ clang-cl (bundled) ───┐
             └─ clang++  (bundled) ───┴─ link against MSVC sysroot (system)
```

## WiX manifest

The installer is built with **WiX v5** (the last release under the standard MS-RL licence — v7+ requires the OSMF EULA, which is a commercial-licensing decision the user has to make). The WiX toolset is installed as a project-local dotnet tool:

```text
.config/dotnet-tools.json     # version-pinned WiX 5.0.2
installer/Washmachine.wxs     # MSI manifest
```

Key choices in `Washmachine.wxs`:

- `Scope="perMachine"` — installs to `%ProgramFiles%`, requires elevation
- `MajorUpgrade` — newer installs roll up older ones in one transaction
- `<Files Include="!(bindpath.payload)\**" />` — WiX 5's native harvester walks the staged payload tree and emits one Component per file (no separate `heat` step)
- Start-Menu shortcuts under `ApplicationProgramsFolder`

## Logging

Runtime outputs follow predictable directory patterns:

| Path | Content |
|---|---|
| `logging/session_YYYYMMDD_HHMMSS_<guid>/source.cpp` | Final rendered C++ source |
| `logging/session_YYYYMMDD_HHMMSS_<guid>/build_log.txt` | Compiler stdout/stderr |
| `logging/backdoor_YYYYMMDD_HHMMSS_<guid>/log.txt` | Full backdoor operation audit trail |
| `temp/cpp/Compiled BInaries/` | Named output binaries |

### Logging infrastructure

| Logger | Target | Description |
|---|---|---|
| `ConsoleLogger` | stdout | Colored icons and optional verbose mode |
| `RichEditBoxLogger` | WinUI RichEditBox | Colored text for desktop UI |
| `TeeLogger` | Both | Writes to inner logger + file simultaneously |
