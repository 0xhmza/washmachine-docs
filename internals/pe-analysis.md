# PE analysis

`washmachine-cli analyze` performs deep inspection of a PE file and returns a structured report covering headers, sections, imports, exports, TLS, code caves, security flags, and per-method injection feasibility — plus a composite 0–100 security score.

Use it before you backdoor a binary, before you ship a loader, or any time you need to know what's inside a `.exe` without booting up IDA.

## What it tells you

The analyzer produces a multi-panel dashboard. Each panel is independently useful — read the security score in isolation if you just want a quick verdict, or drill into the section table when you're planning an injection.

| Category | Fields |
|---|---|
| **File info** | Path, name, size, SHA-256 hash |
| **PE classification** | Architecture (x86/x64), type (EXE/DLL/Driver), subsystem, .NET status |
| **DOS header** | Magic, PE signature offset, Rich header detection |
| **File header** | Machine type, characteristics, compile timestamp |
| **Optional header** | Linker version, OS version, section count, DLL characteristics |
| **Sections** | Name, virtual/raw addresses and sizes, RWX permissions, entropy, padding analysis |
| **Imports** | DLL list with functions; suspicious API detection (~50 sensitive APIs) |
| **Exports** | Name, ordinal, RVA, forwarding info |
| **Resources** | Manifest, icon, version info; type/name/size listing |
| **TLS** | Callback count and addresses |
| **Code caves** | Per-section null-byte sequences with offset, RVA, size, injectable status |
| **Security flags** | ASLR, DEP, CFG, High Entropy VA, SEH, SafeSEH, RFG, Authenticode |
| **Security score** | Composite 0–100 verdict with assessment text |
| **Injection feasibility** | Per-method assessment with recommended approach |

## The security score

A single 0–100 number that summarises the binary's hardening posture. It's not a magic threat indicator — it's a *defensive-posture* score, weighted by which mitigations are enabled. ASLR, DEP, CFG, and SafeSEH all contribute; missing them all is the worst case.

Use the score to:

- **Triage a binary at a glance** — "is this hardened or naked?"
- **Compare donor candidates** for PE cloning — pick a donor with similar posture to your loader
- **Sanity-check your own builds** before shipping

## Suspicious import detection

The analyzer flags ~50 Win32 APIs commonly associated with injection, process manipulation, and evasion. These aren't proof of anything — half of legitimate Windows apps call `VirtualAlloc` — but they're useful signals when triaging an unknown binary.

| Category | APIs |
|---|---|
| **Memory** | `VirtualAlloc`, `VirtualAllocEx`, `VirtualProtect`, `VirtualProtectEx` |
| **Process** | `WriteProcessMemory`, `ReadProcessMemory`, `CreateRemoteThread`, `OpenProcess` |
| **Threading** | `NtCreateThreadEx`, `RtlCreateUserThread`, `QueueUserAPC` |
| **Execution** | `CreateProcessA/W`, `ShellExecuteA/W`, `WinExec` |
| **Loading** | `GetProcAddress`, `LoadLibraryA/W`, `LdrLoadDll` |
| **Syscall** | `NtOpenProcess`, `NtOpenThread`, `NtAllocateVirtualMemory` |

## Code caves

The analyzer walks every section and finds runs of null bytes large enough to be useful for injection. For each cave it reports:

| Field | Meaning |
|---|---|
| **Section** | Section name (`.text`, `.rdata`, …) |
| **Offset** | File-offset of the cave |
| **RVA** | Relative virtual address — where it lands at runtime |
| **Size** | Cave length in bytes |
| **Injectable** | Whether the section is executable and writable enough for the cave to be usable |

This feeds directly into the `backdoor` injection planner — when you run `backdoor --method code-cave`, it picks the largest injectable cave automatically.

## Injection feasibility

The most actionable panel: for each of the five `backdoor` methods, the analyzer reports whether the target binary supports it and which method it recommends.

| Method | Feasibility heuristics |
|---|---|
| **Code Cave** | Total injectable cave space ≥ shellcode + carrier size |
| **New Section** | Section table has room for another entry |
| **Section Extension** | Last section can grow without colliding with anything |
| **Text Pad** | `.text` has slack space at its tail |
| **TLS Callback** | x64 binary with a TLS directory (or room to add one) |

The recommendation is what you'd pick if you had to choose blindly. You can always override.

## JSON output

```powershell
washmachine-cli analyze target.exe --json
```

Emits the full `PeAnalysisResult` object — every field above, every cave, every import, every flag — as JSON. Drop it into a pipeline, diff it against another binary, or feed it to a triage tool.

→ See [`analyze`](/cli/analyze) for the full CLI reference and [PE injection](/internals/pe-injection) for what the feasibility scores feed into.
