# Build & Packaging

## Build script (`build.ps1`)

```powershell
.\build.ps1 [-Config Debug|Release] [-Launch]
```

Builds the full solution via `dotnet build washmachine.sln`. The `-Launch` flag starts the GUI after build.

## Publish script (`publish.ps1`)

```powershell
.\publish.ps1 [-Clean]
```

Produces release builds of both CLI and GUI, consolidating outputs into `Output/Release/publish/`.

## Build outputs

| Project | Debug Path | Release Path |
|---|---|---|
| **CLI** | `Output/cli/Debug/net8.0/washmachine-cli.exe` | `Output/cli/Release/publish/washmachine-cli.exe` |
| **GUI** | `Output/Debug/net8.0-windows10.0.19041.0/washmachine.exe` | `Output/Release/publish/washmachine.exe` |
| **Core** | `Washmachine.Core/bin/Debug/net8.0/` | *(published as part of CLI/GUI)* |

## Packaging

**CLI package:** `washmachine-cli.exe` + `Assets/default.yaml`

**GUI package:** `washmachine.exe` + supporting DLLs + `Assets/default.yaml`

Both packages require the YAML catalog at runtime. The catalog path is resolved relative to the executable directory via `AppPaths`.

## Logging

Runtime outputs follow predictable directory patterns:

| Path | Content |
|---|---|
| `logging/session_YYYYMMDD_HHMMSS_<guid>/source.cpp` | Final rendered C++ source |
| `logging/session_YYYYMMDD_HHMMSS_<guid>/build_log.txt` | Compiler stdout/stderr |
| `logging/backdoor_YYYYMMDD_HHMMSS_<guid>/log.txt` | Full backdoor operation audit trail |
| `temp/cpp/Compiled Binaries/` | Named output binaries |

### Logging infrastructure

| Logger | Target | Description |
|---|---|---|
| `ConsoleLogger` | stdout | Colored icons and optional verbose mode |
| `RichEditBoxLogger` | WinUI RichEditBox | Colored text for desktop UI |
| `TeeLogger` | Both | Writes to inner logger + file simultaneously |
