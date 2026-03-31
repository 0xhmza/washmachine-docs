# YAML Catalog

Generation behavior is defined by a YAML catalog (`Assets/default.yaml`, ~1,400 lines) that is the single source of truth for all generation logic.

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
| **Process Injection** | `psinjection` | No | NtCreateSection + NtMapViewOfSection, VirtualAllocEx + CreateRemoteThread, QueueUserAPC |
| **Shellcode Execution** | `shellcodeexecution` | No | VirtualAlloc RW→RX, HeapAlloc, CreateThread, NtCreateThreadEx, fiber, callback, threadpool, syscall |
| **UAC Bypass** | `uacb` | No | FodHelper registry hijack, ComputerDefaults registry hijack |
| **Generic Payload** | `genericshellcode` | No | Built-in calc.exe and MessageBox shellcodes for testing |

## Template definitions

| Template | Description | Placeholders | Special behavior |
|---|---|---|---|
| **default** | Full-featured loader | All 10 sections | Standard sequential execution |
| **paranoid** | Defense-in-depth | 9 sections + watchdog | Monitoring thread polling debuggers every 500ms |
| **aggressive** | Active countermeasures | 7 sections + monitor | Terminates debuggers and analysis tools |
| **stealth** | Maximum evasion | 8 sections | Six-layer sequential defense |
| **minimal** | Bare-bones POC | 2 sections | Only `SHELLCODE_SOURCE` + `SHELLCODE_EXECUTION` |
| **minimal-dll** | DLL entry | 2 sections | `DllMain` → `DLL_PROCESS_ATTACH` → `ExecutePayload()` |
