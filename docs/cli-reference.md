# CLI Reference

The Washmachine CLI provides a comprehensive set of commands for building shellcode loaders, analyzing PE files, and backdooring executables.

## Usage

```bash
washmachine-cli <command> [options]
```

## Commands

### compile

Build a shellcode loader executable.

#### Options

| Option | Description |
|--------|-------------|
| `-s, --shellcode` | Path to shellcode file (.bin) |
| `-t, --template` | Template ID (default, shellcode-minimal) |
| `-e, --encoder` | Encoder index (0=none, 1=XOR, 2=RC4, etc.) |
| `--json` | Output result as JSON |

#### Examples

```bash
# Compile from a .bin shellcode file using the minimal template
washmachine-cli compile -s payload.bin -t shellcode-minimal

# Compile with XOR encoding, output as JSON
washmachine-cli compile -s payload.bin -e 1 --json

# Compile with default template
washmachine-cli compile -s payload.bin
```

### analyze

Analyze a PE file (headers, sections, imports, code caves).

#### Options

| Option | Description |
|--------|-------------|
| `<pe-file>` | Path to PE file to analyze |
| `--json` | Output result as JSON |

#### Examples

```bash
# Analyze a PE file
washmachine-cli analyze target.exe

# Analyze with JSON output
washmachine-cli analyze target.exe --json
```

### backdoor

Inject shellcode into an existing PE via code-cave.

#### Options

| Option | Description |
|--------|-------------|
| `--pe` | Path to target PE file |
| `-s, --shellcode` | Path to shellcode file (.bin) |
| `-o, --output` | Output path for patched PE |

#### Examples

```bash
# Inject shellcode into an existing PE
washmachine-cli backdoor --pe target.exe -s payload.bin -o patched.exe
```

### list

List available templates, encoders, snippets, or compilers.

#### Options

| Option | Description |
|--------|-------------|
| `--compilers` | List discovered compilers |
| `--templates` | List available templates |
| `--encoders` | List available encoders |
| `--snippets` | List available code snippets |

#### Examples

```bash
# List discovered compilers
washmachine-cli list --compilers

# List available templates
washmachine-cli list --templates

# List available encoders
washmachine-cli list --encoders

# List available snippets
washmachine-cli list --snippets
```

### provision

Download and install required external tools (Bin2Shell).

#### Examples

```bash
# Download Bin2Shell (run once before using encoding features)
washmachine-cli provision
```

### test

Run the automated test harness.

#### Options

| Option | Description |
|--------|-------------|
| `--shellcode` | Path to shellcode file for testing |
| `--phase` | Test phase to run (1, 2, 3, or all) |
| `--url` | URL for web delivery testing |
| `--test-assets` | Path to test assets directory |

#### Test Phases

| Phase | Description |
|-------|-------------|
| 1 | All encoder × envelope × web-helper combinations |
| 2 | All template × snippet permutations with default encoding |
| 3 | Multiple shellcode inputs from test assets directory |
| all | Run all phases sequentially |

#### Examples

```bash
# Run the automated test harness (all phases)
washmachine-cli test --shellcode messagebox.bin --phase all

# Run only Phase 1 (encoding combinations)
washmachine-cli test --shellcode messagebox.bin --phase 1

# Run Phase 1 with web delivery
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin

# Run only Phase 3 (multiple shellcode inputs from test assets)
washmachine-cli test --phase 3 --test-assets "testing assets\binary\shellcodes"
```

## Output Locations

### Compilation Output

Compiled executables are saved to:

```
temp/cpp/Compiled BInaries/
```

### Session Logs

Each compilation session saves artifacts to:

```
logging/session_<timestamp>_<uuid>/
├── source.cpp       # Generated C++ source
└── build_log.txt    # Compiler output
```

### Test Results

Test harness results are written to:

```
test_results.json
```

## JSON Output Format

When using the `--json` flag, commands output structured JSON for easy parsing:

### Compile Command

```json
{
  "success": true,
  "message": "Compilation successful",
  "outputPath": "temp/cpp/Compiled BInaries/loader.exe",
  "template": "shellcode-minimal",
  "encoder": "XOR"
}
```

### Analyze Command

```json
{
  "success": true,
  "peFile": "target.exe",
  "headers": { ... },
  "sections": [ ... ],
  "imports": [ ... ],
  "codeCaves": [ ... ]
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Compilation failed |

::: tip
Use the `--json` flag to integrate Washmachine into automation pipelines and scripts.
:::

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
