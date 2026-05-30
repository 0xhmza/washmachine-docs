# Templates & snippets

Washmachine doesn't ship one loader — it ships a **composable system** for building loaders. Templates define the program structure; snippets fill it with techniques. Pick a template, select the snippets you want for each section, and the engine assembles a complete C++ source file ready for the compiler.

This is the layer that turns "I want a stealthy loader with FodHelper UAC bypass, WMI persistence, ChaCha20 encoding, and three anti-debug checks" into a single CLI invocation.

## The model

```text
Template  (C++ skeleton with {{PLACEHOLDER}} tokens)
   +
Snippets  (one or more fragments per resolved placeholder)
   =
Complete C++ source file  →  Compiler  →  .exe
```

When you run `encode`, Washmachine:

1. Loads the selected template from the active playbook
2. For each `{{PLACEHOLDER}}` token, finds the snippet section it maps to
3. Substitutes each placeholder with the C++ code of the selected snippet(s)
4. Feeds the resulting source file to the compiler

Both steps are auditable — the rendered source lands in `logging/session_<ts>/source.cpp` after every build.

## Anatomy of a template

A template is a C++ `main()` function (or `DllMain` for DLL templates) with placeholder tokens marking where each technique-specific code block lands:

```yaml
templates:
  - id: "default"
    content: |
      INT main(VOID) {
        {{SHELLCODE_SOURCE}}
        {{ANTI_EMULATION}}
        {{GUARDRAILS}}
        {{ANTI_SANDBOX}}
        {{ANTI_DEBUGGING}}
        {{DECOY}}
        {{UAC_BYPASS}}
        {{INSTALLATION}}
        {{PERSISTENCE}}
        {{EVASION}}
        {{PROCESS_INJECTION}}
        {{SHELLCODE_EXECUTION}}
        return 0;
      }
```

The order isn't arbitrary — it reflects a deliberate execution strategy.

## Why the execution order matters

| Step | Placeholder | Why here |
|---|---|---|
| 1 | `SHELLCODE_SOURCE` | Decode/prepare bytes before anything else needs them |
| 2 | `ANTI_EMULATION` | Stall AV emulators *before* doing anything they'd want to log |
| 3 | `GUARDRAILS` | Abort fast if the environment is wrong (domain, date, env var) — cheap exit |
| 4 | `ANTI_SANDBOX` | Abort if running in a VM/sandbox — cheap exit |
| 5 | `ANTI_DEBUGGING` | Abort if a debugger is attached — cheap exit |
| 6 | `DECOY` | Visible distraction (open Notepad, MessageBox) to look benign |
| 7 | `UAC_BYPASS` | Re-launch elevated *before* installation needs admin |
| 8 | `INSTALLATION` | Copy to stable path *before* persistence references it |
| 9 | `PERSISTENCE` | Register the stable path — not the temp path you launched from |
| 10 | `EVASION` | Apply Defender exclusions *before* execution touches them |
| 11 | `PROCESS_INJECTION` | Inject into a remote process if requested |
| 12 | `SHELLCODE_EXECUTION` | Finally — run the payload |

Custom templates should keep this order. Run installation after persistence and your Run keys point at a path that might not exist anymore. Run anti-debug after execution and the debugger has already seen the shellcode get unpacked.

## Snippet sections

Snippets are organized into sections. A section maps to exactly one `{{PLACEHOLDER}}` token.

| Section | Key | Multi-select |
|---|---|---|
| Anti Emulation | `antiemulation` | Yes |
| Anti Analysis | `antianalysis` | Yes |
| Anti Debugging | `antidebugging` | Yes |
| Anti Sandbox/VM | `antisandbox` | Yes |
| Guardrails | `guardrail` | Yes |
| Decoy | `decoy` | Yes |
| UAC Bypass | `uacb` | No |
| **Installation** | `installation` | No |
| Persistence | `persistence` | No |
| Evasion | `evasion` | Yes |
| Process Injection | `psinjection` | No |
| Shellcode Execution | `shellcodeexecution` | No |

For **multi-select** sections, all selected snippets are injected in order. For **single-select** sections (UAC bypass, installation, persistence, process injection), exactly one snippet is chosen — or none, with "None" meaning the placeholder is empty.

## Installation — solving the temp-path problem

A common failure mode for naive loaders: persist a Run key pointing at the path the loader was launched from, then have that path get cleaned up by the user, the installer, or the AV quarantine. The Run key now references a dead file.

The `installation` section solves this by running *before* persistence and *before* evasion:

1. The loader copies itself to a stable directory (e.g. `%APPDATA%\Microsoft\EdgeUpdate\`)
2. The copied path is stored internally and used by all subsequent persistence and evasion snippets
3. The loader relaunches from the new path and exits the original instance
4. On the relaunch, it detects it's already at the destination and proceeds normally

The end result: Run keys, scheduled tasks, and Defender exclusions all point at the permanent install location regardless of where the loader was first executed.

When no installation snippet is selected, the loader runs in-place and persistence references the launch path. Sometimes that's what you want — `installation=None` is a valid choice.

## Built-in templates

| Template | Designed for |
|---|---|
| `minimal` | Bare-bones loader — shellcode source + installation + persistence + execution |
| `minimal-dll` | Same as `minimal`, but with a `DllMain` entry point |
| `default` | Full-featured — all sections active |
| `paranoid` | Defense-in-depth with a continuous watchdog thread polling for debuggers |
| `aggressive` | Actively terminates analysis tools and debuggers |
| `stealth` | Six-layer sequential defense with delayed execution |
| `sgncarrier` | Carrier for an SGN-encoded payload (requires RWX allocation) |

Pick the template that matches the threat model, then customize snippets within it. The templates are starting points, not contracts — every snippet selection can be overridden per build.

## Customizing — the cheap path

Drop a new `.yaml` into `Assets/`. Add sections, add snippets, add templates. The schema lives at `Assets/playbook.schema.json` for IDE autocomplete.

```yaml
sections:
  - header: "My Custom Section"
    template: "mycustom"
    allowMultiple: true
    items:
      - id: "MyTechnique"
        snippet: |
          // your C++ here
        includes: "#include <windows.h>"

templates:
  - id: "my-template"
    content: |
      INT main(VOID) {
        {{SHELLCODE_SOURCE}}
        {{MY_CUSTOM}}     // <- maps to your new section
        {{SHELLCODE_EXECUTION}}
      }
    placeholders:
      - name: "MY_CUSTOM"
        kind: "snippet"
        snippetTemplate: "mycustom"
```

No recompilation. Switch playbooks from the GUI Settings page or by editing `Assets/.active-playbook`.

→ Full schema: [Playbook reference](/internals/yaml-catalog)

## Session artifacts

After each build, Washmachine writes the rendered source to `logging/session_<timestamp>/source.cpp`. Review this file to verify that your snippet selections produced the expected code, or to debug compilation errors — the line numbers in `build_log.txt` are relative to this file.
