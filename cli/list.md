# `list`

Enumerate runtime resources available to the generation and compilation pipeline.

```text
washmachine-cli list <target>
```

## Targets

| Target | Aliases | Description |
|---|---|---|
| `templates` | `--templates` | List all C++ loader templates from the YAML catalog |
| `encoders` | `--encoders` | List Bin2Shell encoders and envelopes (requires provisioning) |
| `snippets` | `--snippets` | List all snippet sections and items with `--snippet` key format |
| `compilers` | `--compilers` | Discover and list available C++ toolchains |

## Compiler discovery order

When listing compilers, the discovery engine searches:

1. **Manual candidates** — user-registered paths
2. **Bundled tools** — `<app>/Tools/` directory (MinGW if present)
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022, 2019, 2017 (BuildTools, Community, Professional, Enterprise)
5. **System PATH** — `cl.exe`, `g++.exe`, `clang++.exe`

## Examples

```powershell
washmachine-cli list templates
washmachine-cli list encoders
washmachine-cli list snippets
washmachine-cli list compilers
```
