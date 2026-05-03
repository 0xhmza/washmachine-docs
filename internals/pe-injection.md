# PE Injection

`PeBackdoorService` (~1,260 lines) injects shellcode into PE files with register-safe carrier stubs and optional encryption.

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

The service scans shellcode for Metasploit-style API hash constants and patches destructive exit calls:

| Hash | Original API | Patched To |
|---|---|---|
| `0x56A2B5F0` | `ExitProcess` | `ExitThread` |
| `0x0A2A1DE0` | `ExitThread` | *(preserved)* |
| `0x6F721347` | `RtlExitUserThread` | *(preserved)* |

## Post-injection operations

1. **Signature stripping** — removes Authenticode signature overlay (unless `--no-remove-sig`)
2. **Subsystem patching** — changes CUI → GUI to suppress console window (unless `--no-patch-subsystem`)
3. **PE checksum recalculation** — updates the optional header checksum
4. **Session logging** — writes full audit trail

## PE Strip Service

`PeStripService` (~570 lines) extracts raw bytes from PE files into flat binary payloads.

| Mode | Description |
|---|---|
| **EntryPointToEnd** | Extract from entry point offset to end of containing section (default) |
| **Section** | Extract the entire named section (default name: `.text`) |

Optional trailing-zero trimming removes null padding from extracted payloads. The service also exposes `IsManagedPe(byte[])` — a lightweight check on `DataDirectory[14]` (CLR runtime header) used by the GUI to auto-detect managed (.NET) executables and route them through donut instead of raw stripping.

## Donut Service

`DonutService` (~185 lines) shells out to bundled `donut.exe` to convert managed (.NET) assemblies into position-independent shellcode. The compile pipeline routes `.exe` shellcode sources through donut whenever the input is a managed PE; native shellcode-format PEs go through `PeStripService` instead.

| Option | Default | Description |
|---|---|---|
| `Arch` | `2` (x64) | Target arch — `1`=x86, `2`=x64, `3`=x86+x64 |
| `Class` | *(unset)* | Fully-qualified class to invoke (DLLs / multi-EP assemblies) |
| `Method` | `Main` | Method to invoke on `Class` |
| `Params` | *(unset)* | Comma-separated args passed to the entry point |

Donut is provisioned as an optional download — see [`provision`](/cli/provision).
