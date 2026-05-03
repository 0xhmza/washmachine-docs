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

`DonutService` (~200 lines) shells out to bundled `donut.exe` to convert managed (.NET) assemblies into position-independent shellcode. The compile pipeline routes `.exe` shellcode sources through donut whenever the input is a managed PE; native shellcode-format PEs go through `PeStripService` instead.

### Minimal-feature mode

The service deliberately invokes donut with the **smallest** flag set that still produces a working payload — every optional feature that would embed signature-rich code (compression, threading, staging URL, wide-string encoding, runtime pinning) is left at its donut default and never enabled. The resulting shellcode contains only the donut loader stub and the embedded assembly, maximising target compatibility and keeping the donut-specific signature surface as small as possible.

The full command line emitted is:

```text
donut.exe -a <arch> -b 1 -o <out.bin> [-c <class>] [-m <method>] [-p <params>] -i <input.exe>
```

| Flag | Always sent? | Reason |
|---|---|---|
| `-a <arch>` | yes | Target bitness — defaults to `3` (x86+x64) for maximum host compatibility |
| `-b 1` | yes | **Disables** donut's AMSI/WLDP bypass blob; that stub is heavily signatured and can crash the loader on hardened/patched hosts |
| `-o <out>` | yes | Output `.bin` path |
| `-i <input>` | yes | Input .NET assembly (.exe / .dll) |
| `-c <class>` | only if user-set | Fully-qualified class for DLLs or multi-entry-point assemblies |
| `-m <method>` | only if user-set | Method to invoke (donut defaults to `Main`) |
| `-p <params>` | only if user-set | Comma-separated entry-point args |

### `DonutOptions` defaults

| Option | Default | Description |
|---|---|---|
| `Arch` | `3` (x86+x64) | Most-compatible bitness — runs in either a 32-bit or 64-bit host process |
| `Class` | *(unset)* | Fully-qualified class to invoke (DLLs / multi-EP assemblies) |
| `Method` | *(unset → donut default)* | Method to invoke on `Class` (donut uses `Main`) |
| `Params` | *(unset)* | Comma-separated args passed to the entry point |

Donut is provisioned as an optional download — see [`provision`](/cli/provision).
