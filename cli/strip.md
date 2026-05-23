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
| `--section` | | string | `.text` | Section name for `section` mode |
| `--no-trim` | | flag | | Disable trailing zero trimming |
| `--analyze` | | flag | | Show analysis without extracting |

## Extraction modes

| Mode | Aliases | Description |
|---|---|---|
| `ep` | `entry-point` | Extract from entry point to end of containing section (default) |
| `section` | | Extract the entire named section |
| `all-exec` | | Concatenate every executable section |
| `range` | | Extract an explicit `start:length` byte range — both decimal and hex accepted |

::: tip Use `--analyze` first
Run `strip <pe-file> --analyze` to inspect the section layout, entry-point location, and an estimated extracted size before committing to a mode. The analyze view also flags managed (.NET) PEs, for which raw stripping does **not** produce working shellcode — use [donut](https://github.com/TheWover/donut) instead.
:::

## Examples

```powershell
# Default: entry point to end of containing section
washmachine-cli strip loader.exe

# Extract a specific section
washmachine-cli strip loader.exe -m section --section .text -o payload.bin

# Extract a raw byte range (hex or decimal)
washmachine-cli strip loader.exe -m range --range 0x400:0x200

# Concatenate every executable section
washmachine-cli strip loader.exe -m all-exec

# Keep trailing zero padding
washmachine-cli strip loader.exe --no-trim

# Analyze without extracting
washmachine-cli strip loader.exe --analyze
```

## Output sanity warnings

The strip pipeline prints a warning when the extracted bytes look unlikely to be real shellcode:

| Condition | Warning |
|---|---|
| Result starts with `MZ` | "Extracted data starts with MZ header — you may be extracting the whole PE, not flat code." |
| Result is mostly zero bytes (>70%) | "High zero-byte ratio — extracted data may be mostly padding. Consider trimming." |
| Result is `<4` bytes | "Extracted binary is very small — may not be valid shellcode." |

The GUI surfaces two extra warnings after stripping a `.exe` shellcode source for compilation:

- **`< 64` bytes** — the input is almost certainly not a shellcode-format PE; use raw `.bin` shellcode (e.g. `msfvenom -f raw`) instead.
- **`> 1 MiB`** — large outputs trip MSVC `C1060` (out of heap space) when embedded as a C array; pick `ep` mode or a smaller source.

## Limitations

`strip` only works on PEs **specifically built to be flattened** — donut output, sRDI, `pe2shellcode`, and similar shellcode-format binaries. Stripping a stock `.exe` (Metasploit-generated, Cobalt Strike, etc.) will produce non-functional bytes; convert managed assemblies through donut and use raw `.bin` shellcode for everything else.
