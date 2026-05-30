# CLI overview

`washmachine-cli` is the command-line front-end for the Washmachine engine. Same playbook, same output, same compilation pipeline as the desktop app — built for one-liners, REPL sessions, and CI.

```text
washmachine-cli <command> [options]
```

## Two execution modes

### One-shot

Pass everything on the command line. The process runs the command and exits with a status code — perfect for CI/CD and scripts.

```powershell
washmachine-cli encode -Shellcode payload.bin -Template default
```

### Interactive REPL

Launch with no arguments to drop into a persistent shell — tab completion, command history, Metasploit-style sub-shells per command.

```powershell
washmachine-cli
```

The REPL runs three preflight steps on launch before showing the banner: **provisioning** external requirements (Bin2Shell, SGN, Donut), **locating** a C/C++ compiler, and **verifying** the LLVM/clang version matches the bundled obfuscation passes. If anything's wrong, you'll know immediately.

Inside the REPL you get:

- **Tab completion** — context-aware suggestions for commands, options, and known values
- **Command history** — per-command history (up to 200 entries per scope) navigable with arrow keys
- **Line editing** — cursor movement, insert, delete, Home, End, Ctrl+A, Ctrl+E
- **Sub-shells** — commands like `encode`, `analyze`, `backdoor`, `strip`, and `show` enter dedicated sub-shells when invoked without arguments

::: tip Keyboard shortcuts
| Key | Action |
|---|---|
| `Tab` | Auto-complete current token |
| `↑` / `↓` | Navigate command history |
| `←` / `→` | Move cursor within line |
| `Home` / `End` | Jump to start / end of line |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line |
| `Ctrl+C` | Cancel current input |
:::

## Commands

| Command | Purpose |
|---|---|
| [`encode`](/cli/compile) | Build a shellcode loader executable from a template + snippets + optional encoding |
| [`analyze`](/cli/analyze) | Deep PE file analysis — headers, imports, code caves, security score |
| [`strip`](/cli/strip) | Extract raw executable bytes from a PE file |
| [`backdoor`](/cli/backdoor) | Inject shellcode into an existing PE — 5 methods, 3 execution modes |
| [`show`](/cli/list) | Browse playbook templates, snippets, encoders, envelopes, compilers (alias: `list`) |
| [`doctor`](/cli/doctor) | Preflight: verify LLVM/clang, MSVC, Bin2Shell + LLVM version compatibility |
| [`provision`](/cli/provision) | Download and install required external tools |
| [`test`](/cli/test) | Run the automated test harness |
| `scan` | Scan a PE file or directory for known signatures |

## Global behavior

| Aspect | Detail |
|---|---|
| **Exit codes** | `0` on success, `1` on argument, runtime, or processing failure |
| **Output** | Human-readable by default (Spectre.Console); `--json` for machine-readable output |
| **Color** | Honours `NO_COLOR` (strips ANSI) and `WASHMACHINE_SCHEME=<name>` for theme override |
| **Verbosity** | `--verbose` increases diagnostic output on supported commands |
| **Help** | `--help`, `-h`, `-?`, or `help` on any command prints usage |
| **Version** | `--version`, `-V`, or `version` prints the CLI version |
| **Playbook** | Template, snippet, encoder, and envelope selection comes from `Assets/default.yaml` (the active playbook) |
| **Compiler** | `encode` requires at least one discoverable C++ toolchain (MSVC, GCC, or Clang); `doctor` verifies LLVM-version compatibility for the obfuscation backend |
| **Provisioning** | Encoding and envelope features require Bin2Shell; run `provision` if missing |

## Common workflows

```powershell
# Verify the toolchain before anything else
washmachine-cli doctor

# Build a loader (one-liner)
washmachine-cli encode -s payload.bin -t default

# Build with encoding + LLVM obfuscation
washmachine-cli encode -s payload.bin -t stealth -e 10 -v 2 --backend llvm

# Analyze a PE
washmachine-cli analyze target.exe

# Drop into the REPL for an interactive session
washmachine-cli
```

→ Full pipeline walkthrough: [How it works](/internals/overview) · [Compilation flow](/internals/compile-pipeline)
