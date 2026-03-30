# Architecture

Washmachine is designed as a shared-core platform: one pipeline, multiple surfaces.

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

The CLI and GUI are siblings over the same core—not dependencies of each other.

## Core compile pipeline

High-level flow in `CompilerService`:

1. Load templates/snippets from `Assets/vx_api_snippets.yaml`
2. Resolve source mode (`file`, `raw hex`, `URL`, or test payload)
3. Optionally run Bin2Shell for encoding/envelope
4. Render template placeholders with selected snippets/includes
5. Emit C++ source into temp workspace
6. Discover available compiler toolchain and build
7. Save output artifact and session logs

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

## Testing model

The CLI test harness (`washmachine-cli test`) covers:

- Phase 1: encoder × envelope × web-helper combinations
- Phase 2: template × snippet combinations
- Phase 3: multiple shellcode input assets

Results are written to `test_results.json`.

## Delivery notes

### CLI package

- `washmachine-cli.exe`
- `Assets/vx_api_snippets.yaml`

### GUI package

- `washmachine.exe` and runtime output files
- `Assets/vx_api_snippets.yaml`

::: tip Design Note
Washmachine’s uniqueness is operational consistency: a single runtime catalog influences both interface layers and keeps behavior aligned.
:::

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
