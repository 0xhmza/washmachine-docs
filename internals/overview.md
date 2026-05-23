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

| Service | Responsibility |
|---|---|
| `CompilerService` | Full compile pipeline orchestration — plan → render → compile |
| `PeBackdoorService` | PE injection with carrier stubs — 5 methods, 3 modes (normal / silence / dropper) |
| `PeAnalyzerService` | Deep PE analysis and security scoring |
| `PeStripService` | Binary extraction from PE files (incl. managed-PE detection) |
| `PePostCompileService` | Post-build resource clone + NOP padding |
| `CompilerToolLocator` | C++ toolchain discovery (MSVC / clang / g++ / vswhere) |
| `RequirementProvisioner` | External tool download + install (Bin2Shell, SGN, Donut) |
| `CppFileConverter` | Compiler invocation and output naming |
| `LlvmPipelineService` | clang-cl + LLVM pass plugin orchestration |
| `LlvmPassRegistry` | Discovers built `pass.dll` files under `Assets/llvm-passes/` |
| `PlaybookService` | Playbook (YAML catalog) parsing + validation |
| `TemplateScannerService` | Static analysis of playbook for invariant violations |
| `ToolPreflightService` | `doctor` preflight — LLVM/clang/MSVC/Bin2Shell + LLVM version check |
| `Bin2ShellRunner` | Bin2Shell process wrapper |
| `Bin2ShellWebOutputParser` | Bin2Shell web-bundle YAML parser |
| `ShellcodeEncodingCatalogService` | Dynamic encoder/envelope catalog |
| `DonutService` | .NET assembly → PIC shellcode via bundled `donut.exe` |
| `AppPaths` | Centralized path resolution (Assets, Tools, runtime headers) |
| `AppSettings` | Persisted JSON settings |

::: tip Renamed in the ship-prep
`YamlCodeSnippetCatalogService` was renamed to **`PlaybookService`** (and `ICodeSnippetCatalogService` → `IPlaybookService`) for naming consistency with the user-facing "playbook" terminology. The interface and behaviour are otherwise unchanged.
:::

## Desktop Application

The WinUI 3 desktop application provides an interactive interface:

| Page | Purpose |
|---|---|
| **StartupWindow** | First-run / launch preflight — provisioning → compiler discovery → `ToolPreflightService` (the same three steps the CLI REPL runs). Surfaces a "missing / incompatible" warning row when LLVM/clang/Bin2Shell aren't ready. |
| **MainPage** | Shellcode source selection (file, hex, URL). When a `.exe` is selected the page auto-detects whether it is a managed (.NET) assembly and reveals either the donut options panel or the PE strip options panel accordingly. |
| **CompilePage** | Template selection, snippet configuration, compilation. `.exe` shellcode sources are transparently routed through `DonutService` (managed) or the CLI `strip` command (native shellcode-format PEs) before encoding. The Compilation Backend combo selects between MSVC and the LLVM obfuscation backend. |
| **PackingPage** | Output binary packing options |
| **BackdooringPage** | PE modification across 5 injection methods with 3 modes |
| **SettingsPage** | Application preferences |

Additional windows: `WebPayloadWizardWindow`, `CompilerDetectionWindow`, `RequirementsProgressWindow`.

The application uses Mica backdrop (Windows 11) and renders at 980×720 with a minimum width of 700px. The `StartupWindow` is 560×380.

## End-to-end pipeline

```text
                    ┌─────────────────────────────────────────┐
                    │            Shellcode source              │
                    │   file / hex / URL / managed PE          │
                    └────────────────────┬────────────────────┘
                                         ▼
        ┌──────────────────────────────────────────────────────────┐
        │                  CompilerService.CompileAsync             │
        │                                                            │
        │   PlaybookService            ← template + snippets         │
        │   SGN (optional)             ← Shikata Ga Nai pre-pass     │
        │   Bin2ShellRunner            ← encoder + envelope + carrier│
        │   CppCompilationPlan         ← assembled render state      │
        │   RenderTemplate             ← substitute {{TOKEN}}        │
        │   CompilerToolLocator        ← cl / clang++ / g++          │
        │   LlvmPipelineService (opt)  ← clang-cl + pass plugins     │
        │   CppFileConverter           ← compile + link              │
        │   PePostCompileService (opt) ← clone donor PE resources    │
        └──────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                          <timestamp>-<sha256>.exe
```

See [Compile Pipeline](/internals/compile-pipeline) for the step-by-step walkthrough and [LLVM Obfuscation Backend](/internals/llvm-backend) for the optional clang-cl path.
