# Architecture Overview

Washmachine is a three-project .NET 8 solution where a shared core library provides all business logic, consumed by both a CLI console application and a WinUI 3 desktop client.

## Solution Layout

```text
washmachine.sln
├── Washmachine.Core       net8.0 class library — headless business logic
├── Washmachine.Cli        net8.0 console app   — terminal interface
└── washmachine            net8.0-windows10.0   — WinUI 3 desktop app
```

## Dependency Graph

```text
washmachine (WinUI 3 GUI) ──→ Washmachine.Core
Washmachine.Cli           ──→ Washmachine.Core
```

`Washmachine.Cli` and `washmachine` are sibling entry points. Neither depends on the other; both depend exclusively on `Washmachine.Core`.

## Key Services

| Service | Lines | Responsibility |
|---|---|---|
| `CompilerService` | ~1,700 | Full compile pipeline orchestration |
| `PeBackdoorService` | ~1,260 | PE injection with carrier stubs |
| `PeAnalyzerService` | ~1,130 | Deep PE analysis and security scoring |
| `CompilerToolLocator` | ~465 | C++ toolchain discovery |
| `PeStripService` | ~455 | Binary extraction from PE files |
| `CppFileConverter` | ~412 | Compiler invocation and output naming |
| `YamlCodeSnippetCatalogService` | ~350 | YAML catalog parsing with fuzzy matching |
| `Bin2ShellWebOutputParser` | ~270 | Bin2Shell YAML output parsing |
| `RequirementProvisioner` | ~235 | External tool download and installation |
| `ShellcodeEncodingCatalogService` | ~197 | Dynamic encoder/envelope catalog |
| `AppPaths` | ~160 | Centralized path resolution |
| `AppSettings` | ~77 | Persisted JSON settings |

## Desktop Application

The WinUI 3 desktop application provides an interactive interface:

| Page | Purpose |
|---|---|
| **MainPage** | Shellcode source selection (file, hex, URL) |
| **CompilePage** | Template selection, snippet configuration, compilation |
| **PackingPage** | Output binary packing options |
| **BackdooringPage** | PE modification with code cave injection |
| **SettingsPage** | Application preferences |

Additional windows: `WebPayloadWizardWindow`, `CompilerDetectionWindow`, `RequirementsProgressWindow`.

The application uses Mica backdrop (Windows 11) and renders at 980×720 with a minimum width of 700px.
