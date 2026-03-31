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

`PeStripService` (~455 lines) extracts raw bytes from PE files into flat binary payloads.

| Mode | Description |
|---|---|
| **EntryPointToEnd** | Extract from entry point offset to end of containing section |
| **Section** | Extract the entire named section |
| **AllExecutable** | Concatenate all sections with execute permission |
| **RawRange** | Extract bytes at a specific file offset and length |

Optional trailing-zero trimming removes null padding from extracted payloads.
