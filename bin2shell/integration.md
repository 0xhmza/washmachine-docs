# Bin2Shell Integration

How Washmachine consumes Bin2Shell through its core services.

## Integration services

### Bin2ShellRunner

Process wrapper that executes the Bin2Shell Python script:

- Detects Python via `py` (Windows launcher) or `python3` (Unix)
- Runs with UTF-8 encoding and no shell execution
- Returns stdout as a string; throws on non-zero exit code

### ShellcodeEncodingCatalogService

Parses Bin2Shell help output (`bin2shell -h`) to dynamically build the encoder/envelope catalog:

- Recognizes section headers: "Available Encoders", "Available Envelopes", "Available Compressors"
- Parses line format: `[<index>]  <name>  [<description>]`
- Returns strongly-typed `ShellcodeEncodingCatalog` with categorized items

## Compile-time integration flow

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

## Algorithms

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

# List available options
washmachine-cli list encoders
```
