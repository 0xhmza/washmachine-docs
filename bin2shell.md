---
outline: deep
---

# Bin2Shell Integration

Bin2Shell is the encoding and envelope transformation engine used by Washmachine. It converts binary payloads into C/C++ reconstruction logic, enabling payload obfuscation and format transformation within the compile pipeline.

## Project Reference

- **Upstream:** [Bin2Shell on GitHub](https://github.com/0xhmza/bin2shell)
- **Role:** Optional transformation stage invoked during compilation when `--encoder` or `--envelope` options are set
- **Runtime:** Python 3.10+
- **Provisioning:** `washmachine-cli provision` downloads and installs Bin2Shell automatically

## Purpose

When integrated into the Washmachine compile pipeline, Bin2Shell provides:

- **Reversible payload transforms** — encoding algorithms that obfuscate shellcode bytes
- **Envelope conversion** — transforms binary payloads into printable text representations (Base91, Base64, Base32)
- **C++ decode snippets** — generated inverse/decode routines compiled directly into the loader
- **Web delivery mode** — separates payload from loader with runtime HTTP fetch and reconstruction

## Internal Structure

Bin2Shell is installed at `Tools/Bin2Shell/` relative to the Washmachine executable:

```text
Tools/Bin2Shell/
├── main.py                    CLI entry point
├── bin2shell/
│   ├── cli.py                 Argument parsing and output generation
│   ├── catalog.py             YAML algorithm catalog loading and execution
│   ├── formatting.py          Output formatting utilities
│   └── utils.py               Shared helpers
├── data/yaml/
│   └── algos.yaml             Encoder/envelope definitions and snippets
├── testing.py                 Matrix testing across algorithm combinations
└── ui/
    ├── Bin2ShellUI.csproj     .NET 8 WinForms desktop interface
    ├── MainForm.cs
    └── Program.cs
```

## Integration Contract

Washmachine consumes Bin2Shell through two core services:

### Bin2ShellRunner

Process wrapper that executes the Bin2Shell Python script:

- Detects Python via `py` (Windows launcher) or `python3` (Unix)
- Runs with UTF-8 encoding and no shell execution
- Returns stdout as a string; throws on non-zero exit code

### ShellcodeEncodingCatalogService

Parses Bin2Shell help output (`bin2shell -h`) to dynamically build the encoder/envelope catalog:

- Recognizes section headers: "Available Encoders", "Available Envelopes", "Available Compressors", "Anti-Emulation", "Web Helpers"
- Parses line format: `[<index>]  <name>  [<description>]`
- Returns strongly-typed `ShellcodeEncodingCatalog` with categorized items

### Compile-time integration flow

```text
1. Washmachine resolves raw shellcode bytes (file / hex / URL)
2. If --encoder or --envelope is set:
   │
   ├─ Bin2ShellRunner.RunAsync() invokes Bin2Shell with:
   │   • Input shellcode file
   │   • Encoder index (-e)
   │   • Envelope index (-v)
   │   • Algorithm catalog path (-y algos.yaml)
   │
   ├─ Bin2ShellWebOutputParser parses YAML output
   │   • Extracts C++ includes, declarations, decode logic
   │   • Repairs C++ escape sequences
   │   • Parses payload checksum and length
   │
   └─ Generated C++ code is injected into template placeholders
       • Includes → PREAMBLE section
       • Declarations + init + decode → SHELLCODE_SOURCE section
       • Web fetch helper → PREAMBLE section (web mode)
3. Template is rendered with encoded payload
4. Compiler builds the final executable
```

## Algorithms and Options

Bin2Shell defines encoder and envelope algorithms by index in YAML catalogs.

### Encoders

| Index | Name | Description |
|---|---|---|
| `0` | none | No encoding; raw shellcode passthrough |
| `1` | xor | Single-byte XOR cipher |
| `2` | xor2 | Two-byte XOR cipher |
| `3` | arx8 | 8-bit ARX (add-rotate-XOR) transform |
| `4` | arx82 | Two-round 8-bit ARX transform |

### Envelopes

| Index | Name | Description |
|---|---|---|
| `0` | none | No envelope; raw binary output |
| `1` | base91 | Base91 text encoding (high density) |
| `2` | base64 | Base64 text encoding (standard) |
| `3` | base32 | Base32 text encoding (alphanumeric) |

### CLI usage

```powershell
# Compile with XOR encoding
washmachine-cli compile -s payload.bin -e 1

# Compile with XOR encoding and Base91 envelope
washmachine-cli compile -s payload.bin -e 1 -v 1

# Compile with ARX8 encoding and Base64 envelope
washmachine-cli compile -s payload.bin -e 3 -v 2
```

### Listing available options

```powershell
washmachine-cli list encoders
```

This invokes Bin2Shell's help output and displays:
- **Encoders** table with index, name, description
- **Envelopes** table with index, name, description

::: tip
If Bin2Shell is not installed, the `list encoders` command displays a warning and suggests running `washmachine-cli provision`.
:::

## Output Behavior

### Standard mode

Bin2Shell standard output includes C++ code that reconstructs the original payload at runtime:

| Output | Description |
|---|---|
| `code_blob` | Reconstructed runtime byte pointer |
| `code_blob_len` | Reconstructed runtime byte length |

When an envelope is applied, the output additionally includes:

- Encoded text payload constants (Base91/64/32 string literals)
- Decode routines that recover bytes from the text representation
- Inverse logic that reverses the encoding transform

### Web delivery mode

Bin2Shell web mode (`-w`) emits a structured YAML bundle consumed by `Bin2ShellWebOutputParser`:

```yaml
# New format (preferred)
cpp_includes: |
  #include <windows.h>
  #include <winhttp.h>
cpp_declarations: |
  unsigned char* code_blob = NULL;
  size_t code_blob_len = 0;
cpp_web_fetch: |
  // HTTP fetch helper function
cpp_payload_init: |
  // Payload initialization code
cpp_decode: |
  // Decode and reconstruction logic
payload: "<hex-encoded payload>"
payload_checksum:
  value: "<sha256>"
options:
  payload_len: 512
```

The parser handles both new and legacy formats, and repairs C++ escape sequences (CRLF, NUL, TAB) that may be corrupted during YAML serialization.

### Assembled output

`Bin2ShellWebOutput` provides assembly methods for template integration:

| Method | Returns | Used for |
|---|---|---|
| `BuildPreamble()` | Includes + web fetch helper | `PREAMBLE` placeholder |
| `BuildBody()` | Declarations + init + decode | `SHELLCODE_SOURCE` placeholder |
| `BuildShellcodeSourceBlock()` | All C++ sections combined | Standalone integration |
| `ReplacePayloadUrl(url)` | *(mutates)* | Updates fetch URL for deployment |

## Requirements

### Bin2Shell requirements

| Component | Version | Notes |
|---|---|---|
| Python | 3.10+ | Required for all Bin2Shell operations |
| PyYAML | latest | Python dependency for YAML parsing |
| .NET 8 SDK | latest | Only for Bin2Shell GUI (not required by Washmachine) |

### Washmachine integration requirements

- Bin2Shell must be provisioned at `Tools/Bin2Shell/` relative to the Washmachine executable
- The algorithm catalog `data/yaml/algos.yaml` must be present
- `washmachine-cli provision` handles both automatically

## Security and Trust Model

Algorithm catalogs and snippet definitions execute generation-time logic and emit compile-time code. The generated C++ is compiled locally and included in the output binary.

::: danger Trust boundary
Only use Bin2Shell algorithm catalogs from trusted sources. Modified catalogs can inject arbitrary C++ code into compiled loaders.
:::

## Verification Workflow

After provisioning, validate the full integration path:

```powershell
# 1. Verify Bin2Shell is installed
washmachine-cli list encoders

# 2. Verify snippet catalog is accessible
washmachine-cli list snippets

# 3. Test compilation with encoding
washmachine-cli compile -s payload.bin -e 1 -v 1

# 4. Test compilation with all combinations
washmachine-cli test --shellcode payload.bin --phase 1
```

Inspect session logs at `logging/session_*/` for the rendered source code and compiler output to verify expected encoding behavior.

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
