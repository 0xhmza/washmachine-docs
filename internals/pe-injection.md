# PE Injection

The `backdoor` command injects shellcode into PE files with register-safe carrier stubs and optional encryption.

## Injection methods

| Method | Description | Constraints |
|---|---|---|
| **Code Cave** | Locate null-byte sequences in `.text` section | Requires caves large enough for shellcode + carrier |
| **New Section** | Append a new executable section (default: `.extra`) | Increases file size; section table must have room |
| **Section Extension** | Extend the last PE section and append payload | Modifies section headers; may break signed binaries |

## Carrier code

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

## Exit call patching

The injector scans shellcode for Metasploit-style API hash constants and replaces destructive exit calls:

| Original API | Replaced With | Effect |
|---|---|---|
| `ExitProcess` | `ExitThread` | Prevents the host process from terminating |
| `ExitThread` | *(preserved)* | Already thread-safe |
| `RtlExitUserThread` | *(preserved)* | Already thread-safe |

## Post-injection operations

1. **Signature stripping** — removes Authenticode signature overlay (unless `--no-remove-sig`)
2. **Subsystem patching** — changes CUI → GUI to suppress console window (unless `--no-patch-subsystem`)
3. **PE checksum recalculation** — updates the optional header checksum
4. **Session logging** — writes full audit trail

## PE Strip

The `strip` command extracts raw bytes from PE files into flat binary payloads.

| Mode | Description |
|---|---|
| **EntryPointToEnd** | Extract from entry point offset to end of containing section (default) |
| **Section** | Extract the entire named section (default name: `.text`) |

Optional trailing-zero trimming removes null padding from extracted payloads. Managed (.NET) executables are auto-detected and routed through Donut instead of raw stripping.

## Donut

Washmachine uses bundled `donut.exe` to convert managed (.NET) assemblies into position-independent shellcode. The compile pipeline routes `.exe` shellcode sources through Donut whenever the input is a managed PE; native shellcode-format PEs go through the strip path instead.

The service invokes Donut with the smallest flag set that produces a working payload — optional features that embed signature-rich code (compression, staging URLs, wide-string encoding) are intentionally left disabled to maximise target compatibility and minimise the Donut-specific signature surface.

| Flag | Purpose |
|---|---|
| `-a <arch>` | Target bitness — defaults to `3` (x86+x64) for maximum host compatibility |
| `-b 1` | Disables Donut's built-in AMSI/WLDP bypass blob |
| `-c <class>` | Fully-qualified class, for DLLs or multi-entry-point assemblies |
| `-m <method>` | Method to invoke (defaults to `Main`) |
| `-p <params>` | Comma-separated entry-point arguments |

Donut is provisioned as an optional download — see [`provision`](/cli/provision).
