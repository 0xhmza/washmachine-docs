# `list`

Enumerate runtime resources available to the generation and compilation pipeline.

```text
washmachine-cli list <target>
```

## Targets

| Target | Aliases | Description |
|---|---|---|
| `templates` | `--templates` | List all C++ loader templates from the YAML catalog |
| `encoders` | `--encoders` | List Bin2Shell encoders and envelopes (requires provisioning) |
| `snippets` | `--snippets` | List all snippet sections and items with `--snippet` key format |
| `compilers` | `--compilers` | Discover and list available C++ toolchains |

## Compiler discovery order

When listing compilers, the discovery engine searches:

1. **Manual candidates** — user-registered paths
2. **Bundled tools** — `<app>/Tools/` directory (MinGW if present)
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022, 2019, 2017 (BuildTools, Community, Professional, Enterprise)
5. **System PATH** — `cl.exe`, `g++.exe`, `clang++.exe`

## Examples

### Listing templates

```powershell
washmachine-cli list templates
```

Example output:

```text
Available Templates (3):
  ID            Name                  Description
  ──────────────────────────────────────────────────────────────
  default       Default Loader        Standard VirtualAlloc shellcode loader
  stealth       Stealth Loader        Loader with anti-analysis and evasion
  dll           DLL Loader            DllMain-based shellcode loader (DLL output)
```

### Listing snippets

```powershell
washmachine-cli list snippets
```

Example output:

```text
Snippet Sections:
  [antiemulation] Anti-Emulation (3 items)
    --snippet antiemulation=SirAllocALot
    --snippet antiemulation=SleepCheck
    --snippet antiemulation=Default

  [antidebugging] Anti-Debugging (2 items)
    --snippet antidebugging=IsDebuggerPresent
    --snippet antidebugging=Default

  [shellcodeexecution] Shellcode Execution (4 items)
    --snippet shellcodeexecution=VirtualAlloc
    --snippet shellcodeexecution=CreateThread
    --snippet shellcodeexecution=NtCreateThread
    --snippet shellcodeexecution=Default
```

### Listing compilers

```powershell
washmachine-cli list compilers
```

Example output:

```text
Discovered Compilers (2):
  Kind     Version              Path
  ──────────────────────────────────────────────────────────────
  MSVC     14.42.34433          C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.42.34433\bin\Hostx64\x64\cl.exe
  GCC      13.2.0               C:\mingw64\bin\g++.exe
```

### Listing encoders

```powershell
washmachine-cli list encoders
```

Example output:

```text
Bin2Shell Encoders (4):
  ID    Name              Description
  ──────────────────────────────────────────────────────────────
  1     XOR               Single-byte XOR encoding
  2     AES-256           AES-256-CBC encryption
  3     RC4               RC4 stream cipher
  4     Custom            User-defined encoder

Bin2Shell Envelopes (2):
  ID    Name              Description
  ──────────────────────────────────────────────────────────────
  1     Direct            Direct shellcode execution
  2     Web               HTTP fetch and decode at runtime
```

---

::: tip Related
See [compile](/cli/compile) to use listed templates and snippets in a build.
See [provision](/cli/provision) for encoder setup if `list encoders` returns empty.
:::
