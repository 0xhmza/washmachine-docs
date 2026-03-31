# PE Analysis

`PeAnalyzerService` (~1,130 lines) performs deep PE inspection returning a comprehensive analysis result.

## Analysis scope

| Category | Fields |
|---|---|
| **File info** | Path, name, size, SHA-256 hash |
| **PE classification** | Architecture (x86/x64), type (EXE/DLL/Driver), subsystem, .NET status |
| **DOS header** | Magic, PE signature offset, Rich header detection |
| **File header** | Machine type, characteristics, timestamp |
| **Optional header** | Linker version, OS version, section count, DLL characteristics |
| **Sections** | Name, virtual/raw addresses and sizes, permissions (RWX), entropy, padding analysis |
| **Imports** | DLL list with functions; suspicious API detection (~50 sensitive APIs) |
| **Exports** | Name, ordinal, RVA, forwarding info |
| **Resources** | Manifest, icon, version info; type/name/size listing |
| **TLS** | Callback count and addresses |
| **Code caves** | Per-section null-byte sequences with offset, RVA, size, injectable status |
| **Security** | ASLR, DEP, CFG, High Entropy VA, SEH, SafeSEH, RFG, Authenticode; composite 0–100 score |
| **Injection feasibility** | Per-method assessment with recommended approach |

## Suspicious import detection

The analyzer flags approximately 50 Windows API functions commonly associated with injection, process manipulation, and evasion:

- **Memory**: `VirtualAlloc`, `VirtualAllocEx`, `VirtualProtect`, `VirtualProtectEx`
- **Process**: `WriteProcessMemory`, `ReadProcessMemory`, `CreateRemoteThread`, `OpenProcess`
- **Threading**: `NtCreateThreadEx`, `RtlCreateUserThread`, `QueueUserAPC`
- **Execution**: `CreateProcessA/W`, `ShellExecuteA/W`, `WinExec`
- **Loading**: `GetProcAddress`, `LoadLibraryA/W`, `LdrLoadDll`
- **Syscall**: `NtOpenProcess`, `NtOpenThread`, `NtAllocateVirtualMemory`
