# `strip`

Extract raw executable bytes from a PE file into a flat binary payload.

```text
washmachine-cli strip <pe-file> [options]
```

## Arguments

| Argument | Type | Description |
|---|---|---|
| `<pe-file>` | positional | PE file to extract from |

## Options

| Option | Alias | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | path | `<input>.bin` | Output file path |
| `--mode` | `-m` | enum | `ep` | Extraction mode (see below) |
| `--section` | | string | | Section name for `section` mode |
| `--range` | | `start:len` | | Raw file range (hex `0x` or decimal) for `range` mode |
| `--no-trim` | | flag | | Disable trailing zero trimming |
| `--analyze` | | flag | | Show analysis without extracting |

## Extraction modes

| Mode | Aliases | Description |
|---|---|---|
| `ep` | `entry-point` | Extract from entry point to end of containing section (default) |
| `section` | | Extract the entire named section |
| `all-exec` | | Concatenate all executable sections |
| `range` | | Extract a raw byte range specified as `offset:length` |

## Examples

```powershell
# Default: entry point to end of .text
washmachine-cli strip loader.exe

# Extract specific section
washmachine-cli strip loader.exe -m section --section .text -o payload.bin

# Raw range (hex offsets)
washmachine-cli strip loader.exe -m range --range 0x400:0x200

# Analyze without extracting
washmachine-cli strip loader.exe --analyze
```
