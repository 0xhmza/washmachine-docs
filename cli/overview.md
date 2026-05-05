# CLI Overview

```text
washmachine-cli <command> [options]
```

## Execution Modes

### One-shot mode

Pass a command and its arguments directly:

```powershell
washmachine-cli encode -Shellcode payload.bin -Template default
```

The process executes the command and exits with a status code.

### Interactive REPL

Launch without arguments to enter an interactive shell:

```powershell
washmachine-cli
```

The REPL provides:

- **Tab completion** — context-aware suggestions for commands, options, and values
- **Command history** — per-command history (up to 200 entries per scope) navigable with arrow keys
- **Line editing** — cursor movement, insert, delete, Home, End, Ctrl+A, Ctrl+E
- **Sub-shells** — commands like `encode`, `analyze`, `backdoor`, `strip`, and `show` enter dedicated sub-shells when invoked without arguments

::: tip Keyboard Shortcuts
| Key | Action |
|---|---|
| `Tab` | Auto-complete current token |
| `↑` / `↓` | Navigate command history |
| `←` / `→` | Move cursor within line |
| `Home` / `End` | Jump to start / end of line |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line |
| `Ctrl+C` | Cancel current input |
:::

## Global Behavior

| Aspect | Detail |
|---|---|
| **Exit codes** | `0` on success, `1` on argument, runtime, or processing failure |
| **Output** | Human-readable text by default (Spectre.Console); `--json` for machine-readable output |
| **Verbosity** | `--verbose` increases diagnostic output on supported commands |
| **Help** | `--help`, `-h`, or `help` on any command prints usage |
| **Catalog dependency** | Template, snippet, encoder, and envelope selection depends on the YAML catalog at `Assets/default.yaml` |
| **Compiler dependency** | `encode` requires at least one discoverable C++ toolchain (MSVC, GCC, or Clang) |
| **Provisioning** | Encoding and envelope features require Bin2Shell; run `provision` if missing |

## Command Index

| Command | Description |
|---|---|
| [`encode`](/cli/compile) | Build a shellcode loader executable from a template and shellcode input |
| [`analyze`](/cli/analyze) | Perform deep PE file analysis |
| [`strip`](/cli/strip) | Extract raw executable bytes from a PE file |
| [`backdoor`](/cli/backdoor) | Inject shellcode into an existing PE file |
| [`show`](/cli/list) | Enumerate available templates, encoders, envelopes, snippets, or compilers |
| [`provision`](/cli/provision) | Download and install required external tools |
| [`test`](/cli/test) | Run the automated test harness |
| `scan` | Scan a PE file or directory for known signatures |
