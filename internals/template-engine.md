# Templates & Snippets

Every loader built by Washmachine is generated from a **template** — a C++ skeleton that defines the overall program structure — combined with **snippets** — short code fragments that implement individual techniques.

## How generation works

```text
Template  (C++ skeleton with {{PLACEHOLDER}} tokens)
  +
Snippets  (one fragment per resolved placeholder)
  =
Complete C++ source file  →  Compiler  →  .exe
```

When you run `encode`, Washmachine:

1. Loads the selected template from the playbook
2. For each `{{PLACEHOLDER}}` token in the template, finds the snippet section it maps to
3. Substitutes each placeholder with the C++ code of the selected snippet(s)
4. Feeds the resulting source file to the C++ compiler

## Template structure

A template is a C++ `main()` function (or `DllMain` for DLL templates) with placeholder tokens that mark where technique-specific code is injected:

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

The order of placeholders is intentional and should not be changed in custom templates — evasion checks run before persistence, and installation runs before persistence so the correct path is registered.

## Template execution order

The sequence within `main()` reflects a deliberate execution strategy:

| Step | Placeholder | Purpose |
|---|---|---|
| 1 | `SHELLCODE_SOURCE` | Decode and prepare payload bytes |
| 2 | `ANTI_EMULATION` | Stall or confuse AV emulators |
| 3 | `GUARDRAILS` | Abort if environment checks fail |
| 4 | `ANTI_SANDBOX` | Abort if running in a VM or sandbox |
| 5 | `ANTI_DEBUGGING` | Abort if a debugger is detected |
| 6 | `DECOY` | Perform a distraction action |
| 7 | `UAC_BYPASS` | Re-launch elevated if needed |
| 8 | `INSTALLATION` | Copy loader to stable path |
| 9 | `PERSISTENCE` | Register the stable path for re-execution |
| 10 | `EVASION` | Apply exclusions to all tracked paths |
| 11 | `PROCESS_INJECTION` | Inject shellcode into a remote process |
| 12 | `SHELLCODE_EXECUTION` | Execute shellcode in the current process |

## Snippet sections

Snippets are organized into sections. A section maps to exactly one `{{PLACEHOLDER}}` token.

| Section | Key | Multi-select | Notes |
|---|---|---|---|
| Anti Emulation | `antiemulation` | Yes | |
| Anti Analysis | `antianalysis` | Yes | |
| Anti Debugging | `antidebugging` | Yes | |
| Anti Sandbox/VM | `antisandbox` | Yes | |
| Guardrails | `guardrail` | Yes | |
| Decoy | `decoy` | Yes | |
| UAC Bypass | `uacb` | No | |
| Installation | `installation` | No | Runs before persistence |
| Persistence | `persistence` | No | |
| Evasion | `evasion` | Yes | |
| Process Injection | `psinjection` | No | |
| Shellcode Execution | `shellcodeexecution` | No | |

For **multi-select** sections, all selected snippets are injected in order. For **single-select** sections, exactly one snippet is chosen (or none, with "None" meaning the placeholder is empty).

## Installation and path coordination

The `installation` section solves a common persistence problem: if a loader runs from a temporary or user-writable path, persistence entries that reference that path become invalid as soon as the file is moved or deleted.

When an installation snippet is selected:

1. The loader copies itself to a stable directory (e.g. `%APPDATA%\Microsoft\EdgeUpdate\`)
2. The copied path is stored internally and used by all subsequent persistence and evasion snippets
3. The loader relaunches from the new path and exits the original instance
4. On the relaunch, it detects it's already at the destination and proceeds normally

This ensures that Run keys, scheduled tasks, and Defender exclusions always point to the permanent install location regardless of where the loader was initially executed from.

When no installation snippet is selected (the default), the loader runs in-place and persistence entries reference the launch path.

## Session artifacts

After each build, Washmachine writes the rendered source to `logging/session_<timestamp>/source.cpp`. Review this file to verify that your snippet selections produced the expected code, or to debug compilation errors.
