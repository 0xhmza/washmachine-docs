# Playbook Reference

Loader generation behaviour is defined by a **playbook** — a YAML file that is the single source of truth for templates, snippets, and the wiring between them. The default playbook ships as `Assets/default.yaml`.

You can drop additional playbooks into `Assets/` and switch the active one through the GUI Settings page or the CLI. Washmachine looks for any `.yaml` / `.yml` file in the Assets directory and remembers the selection in `Assets/.active-playbook`.

## What the playbook provides

- **Template definitions** — complete C++ source templates with `{{PLACEHOLDER}}` tokens
- **Snippet sections** — categorized C++ code fragments selectable per template
- **Dynamic inputs** — UI-driven parameters (target process name, guardrail conditions)
- **Encoder/envelope metadata** — algorithm catalogs loaded from Bin2Shell at runtime

Adding new evasion techniques, injection methods, or template layouts requires only playbook edits — no recompilation.

## Validating a playbook

A companion JSON Schema lives at `Assets/playbook.schema.json`. Point any YAML extension that supports JSON Schema (e.g. VS Code's `yaml-language-server`) at it for autocomplete and inline error reporting.

## Playbook structure

```yaml
sections:
  - header: "Anti Debugging"          # UI group label
    template: "antidebugging"          # Placeholder mapping key
    display: "Anti-Debug Features"     # Display name
    allowMultiple: true                # Multi-select vs. single-select
    items:
      - id: "IsDebuggerPresent"
        display: "IsDebuggerPresent"
        default: true
        snippet: |                     # Inline C++ code
          if (IsDebuggerPresent()) ExitProcess(0);
        includes: "#include <windows.h>"
        implementation: ""             # Optional function body
    inputs:                            # Dynamic UI inputs
      - id: "paramTextBox"
        label: "Custom Parameter"
        placement: "before"
        required: false

templates:
  - id: "default"
    display: "Default Loader"
    description: "Full-featured loader."
    preamble: |                        # File-scope shared code
      #include <windows.h>
    content: |                         # Template body
      INT main(VOID) {
        {{SHELLCODE_SOURCE}}
        {{ANTI_EMULATION}}
        {{GUARDRAILS}}
        {{ANTI_SANDBOX}}
        {{ANTI_DEBUGGING}}
        {{SHELLCODE_EXECUTION}}
        return 0;
      }
    placeholders:
      - name: "ANTI_DEBUGGING"
        kind: "snippet"
        snippetTemplate: "antidebugging"
      - name: "SHELLCODE_SOURCE"
        kind: "system"
```

## Snippet sections

| Section | Key | Multi-select | Techniques |
|---|---|---|---|
| **Anti Emulation** | `antiemulation` | Yes | Memory exhaustion, kernel time reads, NtDelayExecution, CPU stress, FLS callbacks |
| **Anti Analysis** | `antianalysis` | Yes | Thread hiding, analysis tool termination, NTDLL unhooking |
| **Anti Debugging** | `antidebugging` | Yes | IsDebuggerPresent, PEB flags, NtGlobalFlag, heap flags, hardware breakpoints, RDTSC timing, NtQueryInformationProcess, parent process checks, trap flag detection |
| **Anti Sandbox/VM** | `antisandbox` | Yes | CPUID hypervisor bit, VM vendor strings, MAC prefix checks, registry keys, process blacklists, resource limits, username blacklists, screen resolution, file age |
| **Guardrails** | `guardrail` | Yes | Environment variable checks, domain membership, date range validation, file existence, user activity |
| **Decoy** | `decoy` | Yes | Open notepad/calculator, show MessageBox, create dummy files |
| **UAC Bypass** | `uacb` | No | FodHelper registry hijack, ComputerDefaults registry hijack |
| **Installation** | `installation` | No | Copy loader to a stable directory before persistence registers it |
| **Persistence** | `persistence` | No | None, HKCU Run Key, User Startup Folder, Scheduled Task, HKLM Run Key, Logon Script, All-Users Startup, Scheduled Task as SYSTEM, Winlogon Userinit, WMI Event Subscription |
| **Evasion** | `evasion` | Yes | Defender exclusions applied to every tracked payload path |
| **Process Injection** | `psinjection` | No | NtCreateSection + NtMapViewOfSection, VirtualAllocEx + CreateRemoteThread, QueueUserAPC |
| **Shellcode Execution** | `shellcodeexecution` | No | VirtualAlloc RW→RX, HeapAlloc, CreateThread, NtCreateThreadEx, fiber, callback, threadpool, syscall |

## Installation techniques

The `installation` section runs **before** persistence and evasion, ensuring those sections always operate on the stable installed path.

| ID | Location | Admin required | Text inputs |
|---|---|---|---|
| `None` | Run in-place (default) | No | — |
| `AppDataDir` | `%APPDATA%\<subdir>\<file>` | No | Sub-directory, installed filename |
| `LocalAppDataDir` | `%LOCALAPPDATA%\<subdir>\<file>` | No | Sub-directory, installed filename |
| `ProgramDataDir` | `%ProgramData%\<subdir>\<file>` | Yes (requires UAC bypass) | Sub-directory, installed filename |

## Persistence techniques

The `persistence` section is single-select. Techniques are grouped by privilege level.

### User-level (no admin required)

| ID | Trigger | Location |
|---|---|---|
| `HkcuRunKey` | Every user logon | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` |
| `StartupFolder` | Every user logon | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\` |
| `ScheduledTask` | Every user logon | Task Scheduler — current user |
| `LogonScript` | Every interactive logon | `HKCU\Environment\UserInitMprLogonScript` |

### Admin-level (requires UAC bypass)

| ID | Trigger | Location |
|---|---|---|
| `HklmRunKey` | Every logon, all users | `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` |
| `AllUsersStartup` | Every logon, all users | `%ProgramData%\Microsoft\Windows\Start Menu\Programs\Startup\` |
| `SchtasksSystem` | Every boot, before any user session | Task Scheduler — SYSTEM account |
| `WinlogonUserinit` | Every interactive logon | `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Userinit` |
| `WmiEventSubscription` | Every interactive logon | WMI `root\subscription` — invisible to registry and Task Scheduler |

::: tip Pairing with UAC bypass
All admin-level persistence items require a UAC bypass snippet in the same build. Use `-Snippet uacb=FodHelper` or `-Snippet uacb=ComputerDefaults` to satisfy the constraint.
:::

## Template definitions

| Template | Description | Notes |
|---|---|---|
| **default** | Full-featured loader | All sections active |
| **paranoid** | Defense-in-depth | Adds a monitoring thread polling for debuggers every 500 ms |
| **aggressive** | Active countermeasures | Terminates debuggers and analysis tools |
| **stealth** | Maximum evasion | Sequential six-layer defense |
| **minimal** | Bare-bones loader | Shellcode source + installation + persistence + execution only |
| **minimal-dll** | DLL entry point | `DllMain` → `DLL_PROCESS_ATTACH` |
| **sgncarrier** | SGN payload carrier | Requires RWX allocation for the Shikata Ga Nai decoder stub |
