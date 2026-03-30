---
outline: deep
---

# Architecture

Washmachine is implemented as a shared-core system where CLI and desktop clients execute the same backend services and data contracts.

## Solution Layout

```text
washmachine.sln
├── Washmachine.Core   (shared services and pipeline)
├── Washmachine.Cli    (console interface)
└── washmachine        (WinUI 3 desktop app)
```

## Dependency Graph

```text
washmachine (GUI) ---> Washmachine.Core
Washmachine.Cli  ---> Washmachine.Core
```

`Washmachine.Cli` and `washmachine` are sibling entry points. Neither depends on the other; both depend on `Washmachine.Core`.

## Runtime Configuration Model

Core generation behavior is defined by runtime YAML assets (for example `Assets/vx_api_snippets.yaml`) that provide:

- template definitions,
- snippet fragments and replacements,
- encoder/envelope catalog metadata,
- and options exposed through interface layers.

This approach decouples generation behavior from UI implementation details.

## Compile Pipeline Internals

Primary flow executed through `CompilerService`:

1. Load templates/snippets from `Assets/vx_api_snippets.yaml`
2. Resolve source mode (`file`, `raw hex`, `URL`, or test payload)
3. Optionally run Bin2Shell for encoding/envelope
4. Render template placeholders with selected snippets/includes
5. Emit C++ source into temp workspace
6. Discover available compiler toolchain and build
7. Save output artifact and session logs

## Toolchain Discovery

`CompilerToolLocator` is responsible for selecting an available compiler from supported Windows toolchains:

- MSVC
- MinGW-w64 `g++`
- `clang++`

Toolchain detection allows the same command surface to operate across multiple development environments.

## Key Shared Services

Notable components in `Washmachine.Core`:

| Service | Responsibility |
|---|---|
| `CompilerService` | Orchestrates the full compile pipeline |
| `CompilerToolLocator` | Discovers available C++ toolchains |
| `CppFileConverter` | Transforms sources into compilable C++ |
| `YamlCodeSnippetCatalogService` | Loads template and snippet definitions |
| `ShellcodeEncodingCatalogService` | Manages encoder/envelope catalog |
| `PeAnalyzerService` | PE file analysis and inspection |
| `PeBackdoorService` | Shellcode injection strategies |
| `RequirementProvisioner` | External dependency setup |

## PE Operation Services

`PeAnalyzerService` and `PeBackdoorService` provide executable-focused workflows used by CLI commands:

- metadata and structure analysis,
- payload extraction support via strip flows,
- and shellcode injection strategies for patch workflows.

## Provisioning and External Dependencies

`RequirementProvisioner` handles dependency setup required for optional flows, especially Bin2Shell-backed encoder/envelope execution.

## Logging and Artifacts

Runtime outputs are persisted into predictable locations:

| Path | Content |
|---|---|
| `temp/cpp/Compiled Binaries/` | Generated C++ sources and compiled binaries |
| `logging/session_<timestamp>_<uuid>/` | Per-session diagnostic logs |
| `test_results.json` | Test harness summary output |

This model supports command-line automation and post-run inspection.

## Test Harness Model

The CLI test harness (`washmachine-cli test`) covers:

- Phase 1: encoder × envelope × web-helper combinations
- Phase 2: template × snippet combinations
- Phase 3: multiple shellcode input assets

Results are written to `test_results.json`.

## Packaging Notes

### CLI Package

- `washmachine-cli.exe`
- `Assets/vx_api_snippets.yaml`

### GUI Package

- `washmachine.exe` and runtime output files
- `Assets/vx_api_snippets.yaml`

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
