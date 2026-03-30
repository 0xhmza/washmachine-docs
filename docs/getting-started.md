# Getting Started

## Requirements

### CLI (washmachine-cli)

| Component | Version |
|-----------|---------|
| OS | Windows 10 1809 (build 17763)+ / Windows 11 |
| .NET | 8.0 Runtime x64 |
| C++ Compiler | Any of: MSVC (VS Build Tools), MinGW-w64 g++, or clang++ on PATH |
| Python | 3.10+ on PATH — required for Bin2Shell encoding features |

### Desktop App (washmachine)

| Component | Version |
|-----------|---------|
| OS | Windows 10 1809 (build 17763)+ / Windows 11 |
| .NET | 8.0 Desktop Runtime x64 |
| Windows App SDK | 1.8 Runtime |
| C++ Compiler | Any of: MSVC (VS Build Tools), MinGW-w64 g++, or clang++ on PATH |
| Python | 3.10+ on PATH — required for Bin2Shell encoding features |

## Building from Source

### Clone the Repository

```bash
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
```

### Build All Projects

```bash
dotnet build washmachine.sln
```

Debug outputs:

| Project | Debug Output |
|---------|-------------|
| Washmachine.Cli | `Output\Debug\net8.0\washmachine-cli.exe` |
| washmachine (GUI) | `Output\Debug\net8.0-windows10.0.19041.0\washmachine.exe` |

### Publish for Release

#### CLI — Single-file Executable

```bash
# CLI — single-file executable → Output\Release\cli\publish\
dotnet publish Washmachine.Cli\Washmachine.Cli.csproj -c Release
```

#### GUI — Framework-dependent

```bash
# GUI — framework-dependent → Output\Release\publish\
dotnet publish washmachine.csproj -c Release
```

## Usage Guide

### Shellcode Sources

Choose one source mode from the Source section:

| Mode | How to Use |
|------|-----------|
| **File** | Browse to a `.bin` shellcode file |
| **Raw** | Paste raw hex bytes (e.g. `\xfc\x48\x83...`) directly into the text box |
| **URL** | Enter the remote URL where the payload is hosted — triggers web delivery mode |
| **Test payload** | Selects the built-in calc.exe shellcode for smoke-testing the pipeline |

### Web Payload Wizard

When URL mode is selected, click Web Payload Wizard to:

1. Choose an encoder and envelope from Bin2Shell's catalog
2. Optionally pick a web-fetch helper (download method)
3. Enter the hosting URL — the tool calls Bin2Shell in `-w` mode and verifies the endpoint responds
4. On success, the generated C++ fetch + decode code is stitched into the template automatically

### Templates

The Template combo lists every `id` defined under `templates:` in `Assets/vx_api_snippets.yaml`. Two ship by default:

| Template ID | Description |
|------------|-------------|
| `default` | Full loader with all feature placeholders (GUARDRAILS, ANTI_DEBUGGING, UAC_BYPASS, PROCESS_INJECTION, SHELLCODE_EXECUTION) |
| `shellcode-minimal` | Bare minimum — shellcode source + one execution snippet, nothing else |

### Snippet Sections

Each template placeholder of `kind: snippet` maps to one section in the catalog. The UI renders a dropdown per section populated with that section's items.

Sections that declare `allowMultiple: true` (e.g. Anti Debugging) let you stack several snippets; others allow only one choice.

Sections that declare `inputs` render extra text boxes in the UI for parameters (e.g. target process name for process injection, guardrail condition string).

### Encoding Options

The Encoding panel (enabled only when Bin2Shell is present) exposes:

- **Encoder** — transforms the raw shellcode bytes (XOR, RC4, AES, etc.)
- **Envelope** — wraps the encoded payload (Base64, Base32, Base91, etc.)
- **Anti-emulation** — adds sandbox-detection arguments to the Bin2Shell invocation

### Compilation

After clicking Go, the pipeline runs in order:

1. Shellcode is encoded via Bin2Shell (if encoding is configured)
2. Snippets are collected; their `includes` and `implementation` blocks are deduplicated and merged
3. The selected template's `content` is rendered — all `{{PLACEHOLDER}}` tokens are substituted
4. The final `.cpp` source is written to `temp/cpp/`
5. The compiler is invoked; output exe lands in `temp/cpp/Compiled BInaries/`
6. Session artifacts (`source.cpp`, `build_log.txt`) are saved under `logging/session_<timestamp>_<uuid>/`

## Initial Setup

### Download Bin2Shell

Bin2Shell is required for encoding features and is downloaded automatically on first run:

#### CLI

```bash
washmachine-cli provision
```

#### GUI

The GUI will prompt automatically on first launch if Bin2Shell is not present.

## Next Steps

- Check out the [CLI Reference](/cli-reference) for detailed command documentation
- Learn about the [Architecture](/architecture) to understand the project structure
- Explore the [GitHub repository](https://github.com/0xhmza/washmachine) for the latest updates

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
