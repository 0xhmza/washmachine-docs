# YAML Catalog

Generation behavior is defined by a YAML catalog (`Assets/default.yaml`, ~2,700 lines) that is the single source of truth for all generation logic.

## What the catalog provides

- **Template definitions** — complete C++ source templates with `{{PLACEHOLDER}}` tokens
- **Snippet sections** — categorized C++ code fragments selectable per template
- **Dynamic inputs** — UI-driven parameters (target process name, guardrail conditions)
- **Encoder/envelope metadata** — algorithm catalogs loaded from Bin2Shell at runtime

Adding new evasion techniques, injection methods, or template layouts requires only YAML edits — no recompilation.

## Catalog structure

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
| **Persistence** | `persistence` | No | None (skip), HKCU Run Key, User Startup Folder, Scheduled Task (user/logon), HKLM Run Key, Logon Script (MPR/UserInitMprLogonScript), All-Users Startup Folder, Scheduled Task as SYSTEM at boot, Winlogon Userinit Hijack, WMI Permanent Event Subscription |
| **Evasion** | `evasion` | Yes | Defender exclusions (self + all tracked persistence drops via `wash_copies[]`) |
| **Process Injection** | `psinjection` | No | NtCreateSection + NtMapViewOfSection, VirtualAllocEx + CreateRemoteThread, QueueUserAPC |
| **Shellcode Execution** | `shellcodeexecution` | No | VirtualAlloc RW→RX, HeapAlloc, CreateThread, NtCreateThreadEx, fiber, callback, threadpool, syscall |
| **Generic Payload** | `genericshellcode` | No | Built-in calc.exe and MessageBox shellcodes for testing (used as shellcode source, not a template placeholder) |

## Persistence techniques

The `persistence` section is single-select (one technique per build) and present in every template. Techniques are split by privilege level:

### User-level (no admin required)

| ID | Display | Trigger | Registry / FS location |
|---|---|---|---|
| `HkcuRunKey` | HKCU Run Key | Every user logon | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` |
| `StartupFolder` | User Startup Folder | Every user logon | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\` |
| `ScheduledTask` | Scheduled Task (user) | Every user logon (`/SC ONLOGON /RL LIMITED`) | Task Scheduler — current user |
| `LogonScript` | Logon Script (MPR) | Every interactive logon via winlogon.exe | `HKCU\Environment\UserInitMprLogonScript` + `%APPDATA%\Microsoft\Windows\` |

### Admin-level (requires UAC bypass)

| ID | Display | Trigger | Registry / FS location |
|---|---|---|---|
| `HklmRunKey` | HKLM Run Key | Every logon, all users | `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` |
| `AllUsersStartup` | All-Users Startup Folder | Every logon, all users | `%ProgramData%\Microsoft\Windows\Start Menu\Programs\Startup\` |
| `SchtasksSystem` | Scheduled Task as SYSTEM | Every boot, before any user session | Task Scheduler — SYSTEM account (`/SC ONSTART /RU SYSTEM /RL HIGHEST`) |
| `WinlogonUserinit` | Winlogon Userinit Hijack | Every interactive logon | `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Userinit` |
| `WmiEventSubscription` | WMI Permanent Event Subscription | Every interactive logon (Win32_LogonSession type 2) | WMI `root\subscription` namespace — invisible to registry and Task Scheduler |

::: tip Pairing with UAC bypass
All admin-level persistence items declare `requires: [uac_bypass]`. The generator enforces this at code-gen time — selecting one without a UAC bypass snippet in the same build is rejected. Use `-Snippet uacb=FodHelper` or `-Snippet uacb=ComputerDefaults` to satisfy the constraint.
:::

::: details WMI subscription internals
`WmiEventSubscription` avoids COM ceremony in C++ by writing a UTF-16LE PowerShell script to `%TEMP%\wusa_svc.ps1`, executing it via `powershell.exe -ExecutionPolicy Bypass -File`, then deleting the file. The PS script creates three WMI objects in `root\subscription`:

1. `__EventFilter` — WQL query: `SELECT * FROM __InstanceCreationEvent WITHIN 30 WHERE TargetInstance ISA 'Win32_LogonSession' AND TargetInstance.LogonType=2`
2. `CommandLineEventConsumer` — runs the payload exe when the event fires
3. `__FilterToConsumerBinding` — links filter to consumer

Entries live in the WMI repository (CIM database), not in the registry or Task Scheduler, making them invisible to most AV/EDR persistence checkers.
:::

## Template definitions

| Template | Description | Placeholders | Special behavior |
|---|---|---|---|
| **default** | Full-featured loader | 10 snippet sections | All sections: anti-emulation, guardrails, sandbox, anti-debug, decoy, UAC bypass, persistence, evasion, injection, execution |
| **paranoid** | Defense-in-depth | 9 snippet sections + watchdog | Monitoring thread polling debuggers every 500ms; includes anti-analysis |
| **aggressive** | Active countermeasures | 7 snippet sections + monitor | Terminates debuggers and analysis tools; includes anti-analysis |
| **stealth** | Maximum evasion | 8 snippet sections | Six-layer sequential defense (anti-emulation → sandbox → guardrails → anti-debug → UAC → persistence → evasion → execution) |
| **minimal** | Bare-bones loader | 3 snippet sections | `SHELLCODE_SOURCE` + `PERSISTENCE` + `SHELLCODE_EXECUTION`; no evasion layers |
| **minimal-dll** | DLL entry point | 3 snippet sections | `DllMain` → `DLL_PROCESS_ATTACH` → `ExecutePayload()` with persistence + execution |
| **sgncarrier** | SGN-encoded payload carrier | 3 snippet sections | Wraps a Shikata Ga Nai-encoded `.bin`; execution snippet must allocate RWX for the self-modifying decoder stub |
