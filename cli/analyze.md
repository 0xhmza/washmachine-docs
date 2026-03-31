# `analyze`

Perform a comprehensive PE file analysis covering headers, sections, imports, exports, resources, TLS, code caves, security features, packing detection, and injection feasibility assessment.

```text
washmachine-cli analyze <pe-file> [--json]
```

## Arguments

| Argument | Type | Description |
|---|---|---|
| `<pe-file>` | positional | Path to the PE file to analyze |

## Options

| Option | Type | Description |
|---|---|---|
| `--json` | flag | Emit the full `PeAnalysisResult` object as JSON |

## Analysis output

The text output renders a multi-panel dashboard:

| Section | Content |
|---|---|
| **File Overview** | Name, size, SHA-256, architecture, subsystem, compile timestamp, linker version, .NET status |
| **Security Score** | 0–100 score with assessment; flags for ASLR, DEP, CFG, High Entropy VA, SEH, SafeSEH, RFG, Authenticode |
| **PE Headers** | Entry point, image base, checksum, section/file alignment, DLL characteristics, machine type |
| **Sections** | Name, virtual address, virtual size, raw address, raw size, permissions, entropy with visual bar |
| **Imports** | DLL list with function counts; suspicious import detection with reason |
| **Exports** | Name, ordinal, RVA, forwarding status |
| **Resources** | Manifest, icon, version info presence; type/name/size table |
| **TLS** | Callback count and addresses |
| **Code Caves** | Total caves and space; section, offset, RVA, size, injectable status |
| **Injection Feasibility** | Per-method assessment with recommended method |

## Examples

```powershell
# Full text dashboard
washmachine-cli analyze target.exe

# JSON for downstream processing
washmachine-cli analyze target.exe --json
```
