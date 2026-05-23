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

On launch the REPL runs three preflight steps before showing the banner: provisioning external requirements (Bin2Shell, SGN, Donut), locating a C/C++ compiler, and verifying the LLVM/clang version matches the bundled obfuscation passes (see [`doctor`](/cli/doctor)).

The REPL then provides:

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
| **Colour** | Honours `NO_COLOR` (strips ANSI) and `WASHMACHINE_SCHEME=<name>` for theme override |
| **Verbosity** | `--verbose` increases diagnostic output on supported commands |
| **Help** | `--help`, `-h`, `-?`, or `help` on any command prints usage |
| **Version** | `--version`, `-V`, or `version` prints the CLI version |
| **Playbook** | Template, snippet, encoder, and envelope selection comes from `Assets/default.yaml` (the active playbook) |
| **Compiler** | `encode` requires at least one discoverable C++ toolchain (MSVC, GCC, or Clang); `doctor` verifies LLVM-version compatibility for the obfuscation backend |
| **Provisioning** | Encoding and envelope features require Bin2Shell; run `provision` if missing |

## Command Index

| Command | Description |
|---|---|
| [`encode`](/cli/compile) | Build a shellcode loader executable from a template and shellcode input |
| [`analyze`](/cli/analyze) | Perform deep PE file analysis |
| [`strip`](/cli/strip) | Extract raw executable bytes from a PE file |
| [`backdoor`](/cli/backdoor) | Inject shellcode into an existing PE file (5 methods, 3 modes) |
| [`show`](/cli/list) | Browse playbook templates, snippets, encoders, envelopes, modules, and compilers (alias: `list`) |
| [`doctor`](/cli/doctor) | Preflight: verify LLVM/clang, MSVC, Bin2Shell + LLVM version compatibility |
| [`provision`](/cli/provision) | Download and install required external tools |
| [`test`](/cli/test) | Run the automated test harness |
| `scan` | Scan a PE file or directory for known signatures |
