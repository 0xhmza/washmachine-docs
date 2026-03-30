# Architecture

Washmachine is implemented as a shared-core system where CLI and desktop clients execute the same backend services and data contracts.

## Solution layout

```text
washmachine.sln
├── Washmachine.Core   (shared services and pipeline)
├── Washmachine.Cli    (console interface)
└── washmachine        (WinUI 3 desktop app)
```

## Dependency graph

```text
washmachine (GUI) ---> Washmachine.Core
Washmachine.Cli  ---> Washmachine.Core
```

`Washmachine.Cli` and `washmachine` are sibling entry points. Neither depends on the other; both depend on `Washmachine.Core`.

## Runtime configuration model

Core generation behavior is defined by runtime YAML assets (for example `Assets/vx_api_snippets.yaml`) that provide:

- template definitions,
- snippet fragments and replacements,
- encoder/envelope catalog metadata,
- and options exposed through interface layers.

This approach decouples generation behavior from UI implementation details.

## Compile pipeline internals

Primary flow executed through `CompilerService`:

1. Load templates/snippets from `Assets/vx_api_snippets.yaml`
2. Resolve source mode (`file`, `raw hex`, `URL`, or test payload)
3. Optionally run Bin2Shell for encoding/envelope
4. Render template placeholders with selected snippets/includes
5. Emit C++ source into temp workspace
6. Discover available compiler toolchain and build
7. Save output artifact and session logs

## Toolchain discovery

`CompilerToolLocator` is responsible for selecting an available compiler from supported Windows toolchains:

- MSVC
- MinGW-w64 `g++`
- `clang++`

Toolchain detection allows the same command surface to operate across multiple development environments.

## Key shared services

Notable components in `Washmachine.Core`:

- `CompilerService`
- `CompilerToolLocator`
- `CppFileConverter`
- `YamlCodeSnippetCatalogService`
- `ShellcodeEncodingCatalogService`
- `PeAnalyzerService`
- `PeBackdoorService`
- `RequirementProvisioner`

## PE operation services

`PeAnalyzerService` and `PeBackdoorService` provide executable-focused workflows used by CLI commands:

- metadata and structure analysis,
- payload extraction support via strip flows,
- and shellcode injection strategies for patch workflows.

## Provisioning and external dependency integration

`RequirementProvisioner` handles dependency setup required for optional flows, especially Bin2Shell-backed encoder/envelope execution.

## Logging and artifact model

Runtime outputs are persisted into predictable locations:

- generated and compiled outputs in `temp/cpp/Compiled Binaries/`,
- per-session diagnostics in `logging/session_<timestamp>_<uuid>/`,
- harness summary output in `test_results.json`.

This model supports command-line automation and post-run inspection.

## Test harness model

The CLI test harness (`washmachine-cli test`) covers:

- Phase 1: encoder × envelope × web-helper combinations
- Phase 2: template × snippet combinations
- Phase 3: multiple shellcode input assets

Results are written to `test_results.json`.

## Packaging notes

### CLI package

- `washmachine-cli.exe`
- `Assets/vx_api_snippets.yaml`

### GUI package

- `washmachine.exe` and runtime output files
- `Assets/vx_api_snippets.yaml`

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
