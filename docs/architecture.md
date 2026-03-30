# Architecture

## Overview

Washmachine is structured as a **three-project solution**. All business logic lives in a platform-neutral core library shared by both a standalone CLI and a WinUI 3 desktop app.

```
washmachine.sln
├── Washmachine.Core     (class library, net8.0)         ← headless business logic
├── Washmachine.Cli      (console app, net8.0)           ← terminal interface
└── washmachine          (WinExe, net8.0-windows10.0.…) ← WinUI 3 desktop app
```

## Dependency Graph

```
washmachine (GUI) ──references──► Washmachine.Core
Washmachine.Cli  ──references──► Washmachine.Core
Washmachine.Core ──no internal project dependencies──
```

The GUI and CLI **never reference each other**. Core has no WinUI or Windows-specific dependencies.

## Project Structure

### Washmachine.Core (Shared Library)

Platform-neutral business logic used by both CLI and GUI:

```
Washmachine.Core/
├── Logging/
│   ├── IAppLogger.cs               ← logger interface
│   └── ConsoleLogger.cs            ← stdout/stderr implementation
├── Models/
│   ├── UIData.cs                   ← headless control-value snapshot
│   ├── CodeSnippetModels.cs
│   ├── CodeTemplateModels.cs
│   ├── PeAnalysisModels.cs
│   └── PeBackdoorModels.cs
├── Services/
│   ├── AppPaths.cs                 ← filesystem path resolution
│   ├── CompilerService.cs          ← plan → render → compile pipeline
│   ├── CompilerToolLocator.cs      ← discovers cl.exe / g++ / clang++
│   ├── CppFileConverter.cs         ← spawns compiler subprocess
│   ├── Bin2ShellRunner.cs          ← spawns python main.py
│   ├── Bin2ShellWebOutputParser.cs ← parses Bin2Shell -w YAML output
│   ├── PeAnalyzerService.cs        ← PE header / section analysis
│   ├── PeBackdoorService.cs        ← PE code-cave injection
│   ├── RequirementProvisioner.cs   ← downloads Bin2Shell
│   ├── ProgressReporter.cs         ← IProgressReporter + ConsoleProgressReporter
│   ├── ShellcodeEncodingCatalogService.cs
│   └── YamlCodeSnippetCatalogService.cs
├── Testing/
│   └── TestHarness.cs              ← headless combinatorial test runner
└── Washmachine.Core.csproj
```

### Washmachine.Cli (Console Application)

Terminal interface that delegates to Core services:

```
Washmachine.Cli/
├── Program.cs                      ← subcommands: compile / analyze / backdoor /
│                                      list / provision / test
└── Washmachine.Cli.csproj
```

### washmachine (GUI Application)

WinUI 3 desktop application with GUI-specific services:

```
washmachine/
├── Controllers/
│   └── MainFormCoordinator.cs      ← GUI event ↔ service coordinator
├── Logging/
│   └── RichTextBoxLogger.cs        ← WinUI RichEditBox logger
├── Services/                       ← GUI-only services
│   ├── ClipboardService.cs
│   ├── HeaderListPopulator.cs
│   ├── UiDataFactory.cs            ← walks WinUI visual tree → UIData
│   ├── UserInteractionService.cs
│   └── WindowProgressReporter.cs   ← IProgressReporter wrapping RequirementsProgressWindow
├── Views/                          ← WinUI pages & windows
│   ├── MainPage.xaml[.cs]
│   ├── BackdooringPage.xaml[.cs]
│   ├── SettingsPage.xaml[.cs]
│   ├── WebPayloadWizardWindow.cs
│   └── RequirementsProgressWindow.cs
├── App.xaml[.cs]
├── MainWindow.xaml[.cs]
├── Program.cs                      ← GUI entry point (WinUI bootstrap)
└── washmachine.csproj
```

### Shared Assets

```
Assets/
└── vx_api_snippets.yaml            ← YAML catalog: all templates & snippets
```

## Key Flows

### Compilation Pipeline (Shared)

```
UIData (control-value snapshot)
    │
    ▼
CompilerService.CompileAsync(data)
    │
    ├─ YamlCodeSnippetCatalogService  ← resolves template + snippets from YAML
    ├─ Bin2ShellRunner                ← optional encoding (spawns python main.py)
    │
    ▼
CppCompilationPlan                    ← assembled render state
    │  SnippetIncludes[], SnippetImplementations[], CustomSnippetBlocks{}, …
    │
    ▼
RenderTemplate(plan, template)        ← substitutes all {{TOKEN}} placeholders
    │
    ▼
CppFileConverter.ConvertAsync()       ← cl.exe / g++ / clang++ subprocess
    │
    ▼
<timestamp>-<sha256>.exe              ← output binary
logging/session_*/source.cpp          ← saved source
logging/session_*/build_log.txt       ← compiler stdout/stderr
```

### GUI-Specific Path

```
WinUI Views ──events──► MainFormCoordinator
                │  UiDataFactory.FromVisualTree()  ← walks WinUI visual tree → UIData
                └──► CompilerService (Core)
```

### IProgressReporter Pattern

`RequirementProvisioner` reports download progress through `IProgressReporter` (Core interface):

- **CLI** → `ConsoleProgressReporter` (Core) — prints to stdout
- **GUI** → `WindowProgressReporter` (GUI) — updates `RequirementsProgressWindow`

## YAML Catalog System

All templates and snippets are defined in `Assets/vx_api_snippets.yaml`. This is the single source of truth for:

- C++ template definitions
- Code snippet implementations
- UI control configurations
- Placeholder mappings

The catalog is parsed by `YamlCodeSnippetCatalogService` using YamlDotNet with camelCase naming.

### Adding New Techniques

To add a new technique, simply edit `Assets/vx_api_snippets.yaml`. No code recompilation is required. The YAML file supports:

- Custom templates with placeholders
- Snippet sections with multiple items
- Dynamic UI input controls
- Include and implementation blocks

## Build Process

### Development Build

```bash
dotnet build washmachine.sln
```

| Project | Output Path |
|---------|------------|
| Washmachine.Core | `Washmachine.Core\bin\Debug\net8.0\` |
| Washmachine.Cli | `Output\cli\Debug\net8.0\washmachine-cli.exe` |
| washmachine (GUI) | `Output\Debug\net8.0-windows10.0.19041.0\washmachine.exe` |

### Release Build

#### CLI — Single-file Executable

```bash
dotnet publish Washmachine.Cli\Washmachine.Cli.csproj -c Release
```

Output: `Output\cli\Release\publish\washmachine-cli.exe`

#### GUI — Framework-dependent WinExe

```bash
dotnet publish washmachine.csproj -c Release
```

Output: `Output\Release\publish\washmachine.exe` + supporting files

## Delivery

### CLI Tool (washmachine-cli)

Minimum required files:

```
washmachine-cli.exe         ← single-file executable
Assets\
└── vx_api_snippets.yaml    ← YAML catalog (required at runtime)
```

**Runtime prerequisite:** .NET 8 Runtime x64

### GUI Desktop App (washmachine)

Required files:

```
washmachine.exe
washmachine.dll
Assets\
└── vx_api_snippets.yaml
(supporting .dll files from dotnet publish)
```

**Runtime prerequisites:**
- .NET 8 Desktop Runtime x64
- Windows App SDK 1.8 Runtime

### Bin2Shell (Auto-provisioned)

Bin2Shell is expected at `Tools\Bin2Shell\main.py` relative to the executable. It is downloaded automatically when:

- Running `washmachine-cli provision`
- Launching the GUI for the first time (via `RequirementProvisioner`)

## Testing Architecture

The test harness lives in `Washmachine.Core/Testing/TestHarness.cs` and is exposed through the CLI's `test` subcommand.

| Phase | What it tests |
|-------|--------------|
| 1 | All encoder × envelope × web-helper combinations |
| 2 | All template × snippet permutations with default encoding |
| 3 | Multiple shellcode inputs from test assets directory |

Results are written to `test_results.json` in the CLI executable's directory.

::: tip Design Philosophy
The three-project architecture ensures:
- **Separation of Concerns**: Business logic is independent of UI
- **Reusability**: Core services can be used in any .NET application
- **Testability**: Headless components are easy to unit test
- **Flexibility**: New interfaces (web API, PowerShell module) can easily consume Core
:::

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
