---
outline: deep
---

# Architecture

Washmachine is a three-project .NET 8 solution where a shared core library provides all business logic, consumed by both a CLI console application and a WinUI 3 desktop client.

## Solution Layout

```text
washmachine.sln
├── Washmachine.Core       net8.0 class library — headless business logic
├── Washmachine.Cli        net8.0 console app   — terminal interface
└── washmachine            net8.0-windows10.0   — WinUI 3 desktop app
```

## Dependency Graph

```text
washmachine (WinUI 3 GUI) ──→ Washmachine.Core
Washmachine.Cli           ──→ Washmachine.Core
```

`Washmachine.Cli` and `washmachine` are sibling entry points. Neither depends on the other; both depend exclusively on `Washmachine.Core`. The solution forces the CLI to build before the GUI via a project dependency declaration.

## Runtime Configuration Model

Generation behavior is defined by a YAML catalog (`Assets/default.yaml`, ~1,400 lines) that provides:

- **Template definitions** — complete C++ source templates with `{{PLACEHOLDER}}` tokens
- **Snippet sections** — categorized C++ code fragments selectable per template
- **Dynamic inputs** — UI-driven parameters (target process name, guardrail conditions)
- **Encoder/envelope metadata** — algorithm catalogs loaded from Bin2Shell at runtime

The catalog is the single source of truth for all generation logic. Adding new evasion techniques, injection methods, or template layouts requires only YAML edits — no recompilation of the Washmachine codebase.

### Catalog structure

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
        placement: "before"            # before | after selector
        required: false

templates:
  - id: "default"
    display: "Default Loader"
    description: "Full-featured loader with all protection placeholders."
    preamble: |                        # File-scope shared code
      #include <windows.h>
      // shared infrastructure...
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
        kind: "snippet"                # "system" or "snippet"
        snippetTemplate: "antidebugging"
      - name: "SHELLCODE_SOURCE"
        kind: "system"
```

### Snippet sections

The catalog defines 10 configurable snippet sections:

| Section | Key | Multi-select | Techniques |
|---|---|---|---|
| **Anti Emulation** | `antiemulation` | Yes | Memory exhaustion, kernel time reads, NtDelayExecution, CPU stress, FLS callbacks |
| **Anti Analysis** | `antianalysis` | Yes | Thread hiding, analysis tool termination, NTDLL unhooking |
| **Anti Debugging** | `antidebugging` | Yes | IsDebuggerPresent, PEB flags, NtGlobalFlag, heap flags, hardware breakpoints, RDTSC timing, NtQueryInformationProcess, parent process checks, trap flag detection |
| **Anti Sandbox/VM** | `antisandbox` | Yes | CPUID hypervisor bit, VM vendor strings, MAC prefix checks, registry keys, process blacklists, resource limits, username blacklists, screen resolution, file age |
| **Guardrails** | `guardrail` | Yes | Environment variable checks, domain membership, date range validation, file existence, user activity (idle time), minimum recent files |
| **Decoy** | `decoy` | Yes | Open notepad/calculator, show MessageBox, create dummy files |
| **Process Injection** | `psinjection` | No | NtCreateSection + NtMapViewOfSection (process reflection), VirtualAllocEx + CreateRemoteThread (classic), QueueUserAPC |
| **Shellcode Execution** | `shellcodeexecution` | No | VirtualAlloc RW→RX, HeapAlloc, CreateThread, NtCreateThreadEx, fiber, callback (EnumWindows), threadpool, RWX direct, syscall |
| **UAC Bypass** | `uacb` | No | FodHelper registry hijack, ComputerDefaults registry hijack |
| **Generic Payload** | `genericshellcode` | No | Built-in calc.exe and MessageBox shellcodes for testing |

### Template definitions

| Template | Description | Placeholders | Special behavior |
|---|---|---|---|
| **default** | Full-featured loader | All 10 sections | Standard sequential execution |
| **paranoid** | Defense-in-depth | 9 sections + watchdog | Spawns a monitoring thread that polls IsDebuggerPresent, checks hardware breakpoints, and scans for analysis tools every 500ms; sets `g_SafeToRun` volatile flag |
| **aggressive** | Active countermeasures | 7 sections + monitor | Continuous `AntiAnalysisThread` that terminates debuggers and analysis tools |
| **stealth** | Maximum evasion | 8 sections | Six-layer sequential defense: emulation → sandbox → environment → debugger → payload → execution |
| **minimal** | Bare-bones POC | 2 sections | Only `SHELLCODE_SOURCE` + `SHELLCODE_EXECUTION` |
| **minimal-dll** | DLL entry | 2 sections | `DllMain` → `DLL_PROCESS_ATTACH` → `ExecutePayload()` |

## Compile Pipeline Internals

The compilation pipeline is orchestrated by `CompilerService` (~1,700 lines) and follows this flow:

```text
UiData (control-value snapshot)
  │
  ├─ Session directory creation (logging/session_YYYYMMDD_HHMMSS_<guid>/)
  │
  ├─ Compiler discovery (CompilerToolLocator)
  │    └─ Search: manual → bundled → env vars → VS installs → PATH
  │
  ├─ Template resolution (YamlCodeSnippetCatalogService)
  │    └─ Load YAML → parse sections → resolve template by ID
  │
  ├─ CppCompilationPlan construction
  │    ├─ Map snippet selections to template placeholders
  │    ├─ Collect #include directives and function implementations
  │    ├─ Process shellcode source (file / hex / URL / web payload)
  │    └─ Apply Bin2Shell encoding/envelope if requested
  │
  ├─ Template rendering
  │    └─ Substitute all {{PLACEHOLDER}} tokens with resolved content
  │
  ├─ C++ source persistence (temp/cpp/)
  │
  ├─ CppFileConverter.ConvertAsync()
  │    ├─ Detect compiler kind (cl.exe / g++.exe / clang++.exe)
  │    ├─ Detect DllMain presence (switches to DLL output)
  │    ├─ Detect required libraries (winhttp, urlmon, etc.)
  │    ├─ Build compiler arguments:
  │    │    MSVC: /O1 /Gy /EHsc /std:c++17 + link kernel32..ntdll
  │    │    GCC:  -Os -s -ffunction-sections + link flags
  │    ├─ Set up environment (vcvars for MSVC, PATH for GCC internals)
  │    └─ Execute compiler subprocess with output capture
  │
  └─ Output naming: YYYYMMDD_HHMMSS-<sha256[0:5]>.exe
```

### Shellcode source resolution

The pipeline supports five shellcode source kinds:

| Kind | Source | Behavior |
|---|---|---|
| **File** | `--shellcode <path>` | Read binary, convert to C++ byte array literal |
| **Raw** | `--shellcode-hex <hex>` | Parse hex string, convert to byte array |
| **URL** | `--shellcode-url <url>` | Emit C++ runtime code that fetches payload via WinHTTP |
| **Generic** | Built-in test payloads | Embed calc or MessageBox shellcode from catalog |
| **WebPayload** | Bin2Shell web mode | Generate includes, declarations, fetch helper, decode logic |

## Toolchain Discovery

`CompilerToolLocator` (~465 lines) searches for C++ compilers in strict priority order:

1. **Manual candidates** — paths registered via `AddManualCandidateAsync()`
2. **Bundled tools** — `<app>/Tools/` directory (ships MinGW in some distributions)
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022/2019/2017 across BuildTools, Community, Professional, Enterprise editions; legacy versions 14.0 through 10.0
5. **System PATH** — searches for `cl.exe`, `g++.exe`, `clang++.exe`

Each candidate is validated (file existence check) and ranked. The discovery result includes:

- **Best candidate** — the recommended compiler
- **All candidates** — full list with kind, path, VS year/edition, and notes
- **Errors** — any issues encountered during discovery

### Compiler arguments

| Compiler | Optimization | Standard | Linking |
|---|---|---|---|
| **MSVC** (`cl.exe`) | `/O1 /Gy /EHsc` | `/std:c++17` | `kernel32.lib user32.lib gdi32.lib advapi32.lib shell32.lib ole32.lib comdlg32.lib ntdll.lib` |
| **GCC** (`g++.exe`) | `-Os -s -ffunction-sections` | C++17 default | `-lkernel32 -luser32 ...` (detected from source) |
| **Clang** (`clang++.exe`) | Same as GCC | Same as GCC | Same as GCC |

When source files reference WinHTTP or URL download APIs, the linker automatically adds `-lwinhttp` / `-lurlmon`.

## PE Analysis Engine

`PeAnalyzerService` (~1,130 lines) performs deep PE inspection returning a comprehensive `PeAnalysisResult`:

### Analysis scope

| Category | Fields |
|---|---|
| **File info** | Path, name, size, SHA-256 hash |
| **PE classification** | Architecture (x86/x64), type (EXE/DLL/Driver), subsystem, .NET status |
| **DOS header** | Magic, PE signature offset, Rich header detection |
| **File header** | Machine type, characteristics, timestamp |
| **Optional header** | Linker version, OS version, section count, DLL characteristics |
| **Sections** | Name, virtual/raw addresses and sizes, permissions (RWX), entropy, padding analysis |
| **Imports** | DLL list with functions; suspicious API detection (~50 sensitive Windows APIs) |
| **Exports** | Name, ordinal, RVA, forwarding info |
| **Resources** | Manifest, icon, version info; type/name/size listing |
| **TLS** | Callback count and addresses |
| **Code caves** | Per-section null-byte sequences with offset, RVA, size, injectable status |
| **Security** | ASLR, DEP, CFG, High Entropy VA, SEH, SafeSEH, RFG, Authenticode; composite 0–100 score |
| **Injection feasibility** | Per-method assessment with recommended approach |

### Suspicious import detection

The analyzer flags approximately 50 Windows API functions commonly associated with injection, process manipulation, and evasion:

- Memory: `VirtualAlloc`, `VirtualAllocEx`, `VirtualProtect`, `VirtualProtectEx`
- Process: `WriteProcessMemory`, `ReadProcessMemory`, `CreateRemoteThread`, `OpenProcess`
- Threading: `NtCreateThreadEx`, `RtlCreateUserThread`, `QueueUserAPC`
- Execution: `CreateProcessA/W`, `ShellExecuteA/W`, `WinExec`
- Loading: `GetProcAddress`, `LoadLibraryA/W`, `LdrLoadDll`
- Syscall: `NtOpenProcess`, `NtOpenThread`, `NtAllocateVirtualMemory`

## PE Backdoor Service

`PeBackdoorService` (~1,260 lines) injects shellcode into PE files with register-safe carrier stubs and optional encryption.

### Injection methods

| Method | Description | Constraints |
|---|---|---|
| **Code Cave** | Locate null-byte sequences in `.text` section and place payload/carrier there | Requires caves large enough for shellcode + carrier |
| **New Section** | Append a new executable section (default name: `.extra`) to the PE | Increases file size; section table must have room |
| **Section Extension** | Extend the last PE section and append payload after existing content | Modifies section headers; may break signed binaries |

### Carrier code architecture

The carrier stub preserves the execution environment:

**x64 flow (registers + flags preserved):**
```text
push rax..rdi, r8..r15    ← save all general-purpose registers
pushfq                     ← save flags
sub rsp, 0x20              ← shadow space for Windows x64 ABI
call shellcode_address     ← execute payload
add rsp, 0x20              ← clean shadow space
popfq                      ← restore flags
pop r15..rax               ← restore registers
jmp original_entry_point   ← resume normal execution
```

**x86 flow:**
```text
pushad / pushfd            ← save all registers + flags
call shellcode_address     ← execute payload
popfd / popad              ← restore
jmp original_entry_point   ← resume
```

### Exit call patching

The service scans shellcode for Metasploit-style API hash constants and patches destructive exit calls:

| Hash | Original API | Patched To |
|---|---|---|
| `0x56A2B5F0` | `ExitProcess` | `ExitThread` |
| `0x0A2A1DE0` | `ExitThread` | *(preserved)* |
| `0x6F721347` | `RtlExitUserThread` | *(preserved)* |

This prevents the shellcode from terminating the host process after execution.

### Post-injection operations

1. **Signature stripping** — removes Authenticode signature overlay (unless `--no-remove-sig`)
2. **Subsystem patching** — changes CUI → GUI to suppress console window (unless `--no-patch-subsystem`)
3. **PE checksum recalculation** — updates the optional header checksum
4. **Session logging** — writes full audit trail including PE metadata, section tables, shellcode hashes, pre-flight checks, injection plan, and step-by-step results

## PE Strip Service

`PeStripService` (~455 lines) extracts raw bytes from PE files into flat binary payloads.

| Mode | Description |
|---|---|
| **EntryPointToEnd** | Extract from entry point offset to end of containing section |
| **Section** | Extract the entire named section |
| **AllExecutable** | Concatenate all sections with execute permission |
| **RawRange** | Extract bytes at a specific file offset and length |

Optional trailing-zero trimming removes null padding from extracted payloads.

## Key Shared Services

| Service | Lines | Responsibility |
|---|---|---|
| `CompilerService` | ~1,700 | Full compile pipeline orchestration |
| `PeBackdoorService` | ~1,260 | PE injection with carrier stubs and encryption |
| `PeAnalyzerService` | ~1,130 | Deep PE analysis and security scoring |
| `CompilerToolLocator` | ~465 | C++ toolchain discovery across VS/GCC/Clang |
| `PeStripService` | ~455 | Binary extraction from PE files |
| `CppFileConverter` | ~412 | Compiler invocation and output naming |
| `YamlCodeSnippetCatalogService` | ~350 | YAML catalog parsing with fuzzy matching |
| `Bin2ShellWebOutputParser` | ~270 | Bin2Shell YAML output parsing with escape repair |
| `RequirementProvisioner` | ~235 | External tool download and installation |
| `ShellcodeEncodingCatalogService` | ~197 | Dynamic encoder/envelope catalog from Bin2Shell help output |
| `AppPaths` | ~160 | Centralized path resolution for assets, temp, and logging |
| `AppSettings` | ~77 | Persisted JSON settings at `%LOCALAPPDATA%/washmachine/` |
| `Bin2ShellRunner` | ~61 | Python process wrapper for Bin2Shell execution |

## Provisioning and External Dependencies

`RequirementProvisioner` handles Bin2Shell setup:

1. Check for `Tools/Bin2Shell/main.py` and `data/yaml/algos.yaml`
2. If missing, download ZIP from GitHub (`main` branch, falling back to `master`)
3. Extract to temp, locate root directory, move atomically to `Tools/Bin2Shell/`
4. Patch algorithm descriptions into `algos.yaml` if absent
5. Clean up temp files

Both CLI and GUI use the same provisioner — the CLI wraps it with a Spectre.Console progress bar, the GUI wraps it with `RequirementsProgressWindow`.

## Logging and Artifacts

Runtime outputs follow predictable directory patterns:

| Path | Content |
|---|---|
| `logging/session_YYYYMMDD_HHMMSS_<guid>/source.cpp` | Final rendered C++ source |
| `logging/session_YYYYMMDD_HHMMSS_<guid>/build_log.txt` | Compiler stdout/stderr |
| `logging/backdoor_YYYYMMDD_HHMMSS_<guid>/log.txt` | Full backdoor operation audit trail |
| `temp/cpp/Compiled Binaries/` | Named output binaries |
| `test_results.json` | Test harness summary |

### Logging infrastructure

| Logger | Target | Description |
|---|---|---|
| `ConsoleLogger` | stdout | Spectre.Console with colored icons (✓ ⚠ ✗ ⋯) and optional verbose mode |
| `RichEditBoxLogger` | WinUI RichEditBox | Colored text: gray (info), gold (warn), red (error), green (ok), dim (debug) |
| `TeeLogger` | Both | Writes to inner logger + file simultaneously; supports file-only mode |

## Settings

Application settings persist as JSON at `%LOCALAPPDATA%/washmachine/settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `sessionLoggingEnabled` | bool | `true` | Write session logs for compile/backdoor operations |
| `saveBinaryArtifact` | bool | `true` | Copy compiled binaries to session directory |
| `saveShellcodeCopy` | bool | `true` | Copy input shellcode to session directory |
| `verboseFileLogging` | bool | `false` | Include debug-level messages in file logs |

## Test Harness Model

The CLI test harness (`washmachine-cli test`) covers three phases:

| Phase | Matrix | Description |
|---|---|---|
| **1** | Encoder × Envelope × Web helper | Tests all Bin2Shell encoding/envelope combinations with web delivery |
| **2** | Template × Snippet permutations | Tests all templates with snippet combinations at encoder index 0 |
| **3** | Multiple shellcode assets | Tests compilation with each `.bin` file in the assets directory |

The test runner starts a local Python HTTP server (default port 18923) for URL-mode testing and produces `test_results.json` with pass/fail counts.

## Build and Packaging

### Build script (`build.ps1`)

```powershell
.\build.ps1 [-Config Debug|Release] [-Launch]
```

Builds the full solution via `dotnet build washmachine.sln`. The `-Launch` flag starts the GUI after build.

### Publish script (`publish.ps1`)

```powershell
.\publish.ps1 [-Clean]
```

Produces release builds of both CLI and GUI, consolidating outputs into `Output/Release/publish/`.

### Build outputs

| Project | Debug Path | Release Path |
|---|---|---|
| **CLI** | `Output/cli/Debug/net8.0/washmachine-cli.exe` | `Output/cli/Release/publish/washmachine-cli.exe` |
| **GUI** | `Output/Debug/net8.0-windows10.0.19041.0/washmachine.exe` | `Output/Release/publish/washmachine.exe` |
| **Core** | `Washmachine.Core/bin/Debug/net8.0/` | *(published as part of CLI/GUI)* |

### Packaging

**CLI package:** `washmachine-cli.exe` + `Assets/default.yaml`

**GUI package:** `washmachine.exe` + supporting DLLs + `Assets/default.yaml`

Both packages require the YAML catalog at runtime. The catalog path is resolved relative to the executable directory via `AppPaths`.

## Desktop Application

The WinUI 3 desktop application provides an interactive interface:

| Page | Purpose |
|---|---|
| **MainPage** | Shellcode source selection (file, hex, URL) |
| **CompilePage** | Template selection, snippet configuration, compilation |
| **PackingPage** | Output binary packing options |
| **BackdooringPage** | PE modification with code cave injection |
| **SettingsPage** | Application preferences |

Additional windows: `WebPayloadWizardWindow` (encoding/envelope/web), `CompilerDetectionWindow` (toolchain feedback), `RequirementsProgressWindow` (provisioning progress).

`MainFormCoordinator` acts as the central mediator between UI events and core services.

The application uses Mica backdrop (Windows 11) and renders at 980×720 with a minimum width of 700px.

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
