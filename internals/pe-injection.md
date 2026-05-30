# PE injection

`washmachine-cli backdoor` injects shellcode into existing PE files. Three things make it different from "just append bytes and patch the entry point":

1. **Register-safe carrier stubs** — execution returns cleanly to the original entry point with every flag and register preserved
2. **Exit-call patching** — destructive `ExitProcess` calls in the shellcode get rewritten to `ExitThread` so the host stays alive
3. **Five methods, three modes** — the planner picks the safest injection given what `analyze` found

The result is a backdoored binary that still does whatever the host did *and* runs your payload.

## Injection methods

| Method | What it does | Trade-off |
|---|---|---|
| **Code Cave** | Locate existing null-byte runs in `.text` and write payload + carrier inline | Zero structural change; requires caves large enough |
| **New Section** | Append a new executable section (default name: `.extra`) | Unlimited payload size; structurally obvious |
| **Section Extension** | Extend the last PE section and append the payload | No new section header; may break signed binaries |
| **Text Pad** | Use slack space at the tail of `.text` | Zero file-size growth; payload size capped by the slack |
| **TLS Callback** | Register a TLS callback (x64 only) | Runs **before** `main()` — fires even if the host crashes early |

Run `analyze` first and the per-method feasibility table will tell you which methods are viable for your target.

## The carrier stub

The carrier is the small piece of code that runs first when the entry point hits — saves the execution environment, calls the shellcode, restores everything, and resumes the original entry point.

### x64 flow

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

### x86 flow

```text
pushad / pushfd            ← save all registers + flags
call shellcode_address     ← execute payload
popfd / popad              ← restore
jmp original_entry_point   ← resume
```

**Why save everything?** Because the shellcode is opaque — Washmachine doesn't know what it clobbers. Saving the full register file plus flags means the host process resumes as if the carrier never ran. The shadow space allocation matches the Windows x64 calling convention so the shellcode can call further Win32 APIs without ABI surprises.

## Exit call patching

A common failure mode: the shellcode ends with `ExitProcess(0)` — which kills the host. The injector scans the shellcode for Metasploit-style API hash constants and rewrites destructive exits:

| Original API | Replaced With | Effect |
|---|---|---|
| `ExitProcess` | `ExitThread` | Prevents the host process from terminating |
| `ExitThread` | *(preserved)* | Already thread-safe |
| `RtlExitUserThread` | *(preserved)* | Already thread-safe |

Turn it off with `--no-patch-exit` if you actually *want* the host to die.

## Execution modes

| Mode | Behavior |
|---|---|
| `normal` | Implant and host run together. Payload executes during the carrier hook then control returns to the host's entry point. |
| `silence` | Host runs normally; the implant fires silently only when the binary is launched with arguments. Useful when the target needs to remain functionally identical. |
| `dropper` | The host drops and runs a separate implant `.exe` from an embedded `.dpl` section on first launch. Requires `--implant <file>` — that file is XOR-encrypted and appended to the host. |

## Post-injection cleanup

After writing the payload, the injector runs four cleanup steps to make the result look like a normal binary:

1. **Signature stripping** — removes the Authenticode signature overlay (unless `--no-remove-sig`). A binary with a broken signature is a louder signal than one with no signature at all.
2. **Subsystem patching** — changes CUI → GUI to suppress the console window for command-line hosts (unless `--no-patch-subsystem`).
3. **PE checksum recalculation** — updates the optional header checksum so loaders and AV that validate the checksum don't bail out.
4. **Session logging** — writes a full audit trail to `logging/backdoor_<ts>/log.txt` for review later.

## `strip` — extracting shellcode from a PE

The reverse direction. `strip` pulls raw bytes out of a PE file into a flat binary payload — useful when you have a shellcode-format PE (Donut output, sRDI, `pe2shellcode`) and need the inner shellcode for re-use.

| Mode | What it extracts |
|---|---|
| **EntryPointToEnd** | Entry point offset → end of containing section (default) |
| **Section** | The entire named section (default: `.text`) |
| **All Exec** | Concatenates every executable section |
| **Range** | An explicit `start:length` byte range |

Optional trailing-zero trimming removes null padding. Managed (.NET) executables are auto-detected and routed through Donut instead of raw stripping — raw bytes from a managed PE don't work as shellcode.

## Donut — managed → shellcode

For .NET assemblies, raw stripping doesn't produce working shellcode (the CLR has to be loaded, the assembly invoked through reflection, etc). Washmachine bundles `donut.exe` and uses it transparently whenever an `.exe` input is detected as a managed PE.

The service invokes Donut with the smallest flag set that produces a working payload — optional features that embed signature-rich code (compression, staging URLs, wide-string encoding) are intentionally left off to maximise target compatibility and minimise Donut-specific signature surface.

| Flag | Purpose |
|---|---|
| `-a <arch>` | Target bitness — defaults to `3` (x86+x64) for maximum host compatibility |
| `-b 1` | Disables Donut's built-in AMSI/WLDP bypass blob |
| `-c <class>` | Fully-qualified class, for DLLs or multi-entry-point assemblies |
| `-m <method>` | Method to invoke (defaults to `Main`) |
| `-p <params>` | Comma-separated entry-point arguments |

Donut is provisioned as an optional download — see [`provision`](/cli/provision).

→ Full CLI references: [`backdoor`](/cli/backdoor) · [`strip`](/cli/strip) · [`analyze`](/cli/analyze)
