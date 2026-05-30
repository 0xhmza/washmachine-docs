# Compilation flow

Every `encode` run is a six-stage pipeline. You can dial individual stages on or off — the pipeline still picks safe defaults for the rest — but the *order* is fixed, because each stage transforms an artifact the next one consumes.

This page walks every stage end-to-end: what it does, why it's there, and what knobs you have.

![Washmachine compilation pipeline — six stages from raw shellcode to a hardened executable](/pipeline.svg)

## Stage 1 — Source resolution

::: info What it does
Takes shellcode in one of three forms and produces a uniform byte buffer for the rest of the pipeline.
:::

| Source | How to pass it | When to use |
|---|---|---|
| **Binary file** | `-Shellcode <path>` | Default — flat `.bin` from `msfvenom -f raw`, Donut, sRDI |
| **Inline hex** | `-ShellcodeHex <hex>` | Short payloads embedded in scripts or CI configs |
| **Runtime URL fetch** | `-ShellcodeUrl <url>` | Staged delivery — the loader fetches the payload over WinHTTP at runtime |

**Why three modes?** Different operational profiles. Binary file is the day-to-day default. Inline hex is friction-free for tiny shellcode in CI. URL fetch separates the loader from the payload — useful when you want to retarget a single compiled binary without recompiling.

### Automatic routing

When the input is a `.exe`:

- **Managed (.NET) assembly?** → Routed through **Donut** to produce position-independent shellcode automatically.
- **Native shellcode-format PE?** → Use [`strip`](/cli/strip) first to flatten it to a `.bin`.

The desktop client does this routing transparently; the CLI surfaces the choice via the `strip` and `provision` commands.

## Stage 2 — Encoding (optional)

::: info What it does
Transforms the raw bytes through one or more reversible stages — encoder, envelope, optional carrier — and emits the inverse logic into the loader source.
:::

This stage is powered by [Bin2Shell](/bin2shell/overview). When `--encoder`, `--envelope`, `--carrier`, or `--sgn` are set, the raw bytes are routed through the Bin2Shell pipeline before being embedded:

```text
raw bytes  →  SGN (optional)  →  encoder  →  envelope (optional)  →  embed | carrier | web bundle
              ChaCha20 / XTEA…      Base91 / Base64 / IPv4-array…    PNG / BMP / ICO / INI
```

**Why a pipeline of pipelines?** Each layer plays a different game:

- **SGN (Shikata Ga Nai)** — Metasploit-style polymorphic decoder; useful as a pre-pass when you want decoder-level diversification
- **Encoder** — ciphers the bytes; the modern entries (ChaCha20, XTEA, RC4-random, XOR-random) mint fresh keys on every build
- **Envelope** — turns binary into printable text (Base91, Base64, IPv4 lists, UUIDs…) so the embedded blob looks like config data, not a payload
- **Carrier** — moves the encoded bytes *out of the loader* into a valid PNG / BMP / ICO / INI file on disk; the loader unwraps it at runtime
- **Web bundle** — same idea but over HTTP — the loader fetches from a URL using WinHTTP, WinINet, or URLMon

Layer them as the threat model demands. Skip the stage entirely with `-e 0 -v 0` and the raw bytes get embedded as a plain `unsigned char` array.

→ [Encoders & envelopes](/bin2shell/encoders) · [External carriers](/bin2shell/carriers) · [Polymorphism](/bin2shell/polymorphism) · [Web mode](/bin2shell/advanced)

## Stage 3 — Template render

::: info What it does
Loads the chosen template from the active playbook, resolves every `{{PLACEHOLDER}}` to the selected snippet(s), and writes a complete `.cpp` source file.
:::

A template is a C++ `main()` (or `DllMain`) skeleton with placeholder tokens marking where technique-specific code is injected. Each placeholder maps to a **snippet section** in the playbook:

```cpp
INT main(VOID) {
  {{SHELLCODE_SOURCE}}
  {{ANTI_EMULATION}}
  {{GUARDRAILS}}
  {{ANTI_SANDBOX}}
  {{ANTI_DEBUGGING}}
  {{DECOY}}
  {{UAC_BYPASS}}
  {{INSTALLATION}}     // runs BEFORE persistence — so Run keys point at the stable path
  {{PERSISTENCE}}
  {{EVASION}}          // Defender exclusions applied to all tracked paths
  {{PROCESS_INJECTION}}
  {{SHELLCODE_EXECUTION}}
  return 0;
}
```

**Why is order fixed?** The sequence reflects a deliberate execution strategy. Anti-debug runs before persistence so a debugger never sees the persistence write. Installation runs before persistence so the Run key points at the *installed* path, not a temp directory that gets cleaned. Evasion runs before execution so AV exclusions are in place before the shellcode hits memory.

The rendered source is written to `logging/session_<ts>/source.cpp` so you can audit exactly what was compiled.

→ [Templates & snippets](/internals/template-engine) · [Playbook reference](/internals/yaml-catalog)

## Stage 4 — Compiler discovery

::: info What it does
Finds a C++ toolchain on the machine in a deterministic order — and reports what it picked.
:::

```text
1. Tools/ next to the executable       (bundled MinGW or LLVM)
2. Visual Studio installations         (2022 / 2019 / 2017, all editions, via vswhere)
3. Environment variables               (VCToolsInstallDir, VCINSTALLDIR, VSINSTALLDIR)
4. System PATH                         (cl.exe, g++.exe, clang++.exe)
```

Run `washmachine-cli show compilers` to see what was found. If the list is empty, `doctor` will tell you exactly what to install.

**Why not just use PATH?** Because Windows developer machines accumulate compilers — the Tools/ override lets you ship a known-good toolchain alongside the app, and the vswhere path means VS Build Tools work even when MSVC isn't on PATH.

## Stage 5 — Compile & link

::: info What it does
Builds the rendered C++ source with size-optimized flags and links the required Windows libraries.
:::

Two backend choices:

### Default backend

The discovered compiler builds with size-optimised flags:

| Compiler | Optimization | Standard |
|---|---|---|
| `cl.exe` (MSVC) | `/O1 /Gy /EHsc` | `/std:c++17` |
| `g++.exe` / `clang++.exe` | `-Os -s -ffunction-sections` | C++17 |

Library detection is automatic — when the rendered source references WinHTTP, `winhttp.lib` gets linked; URL download code pulls in WinINet or URLMon. You never have to think about `#pragma comment(lib, …)` boilerplate.

### LLVM obfuscation backend

Set `--backend llvm` and the compile step routes through `clang-cl` with **four IR-level pass plugins** loaded via `-fpass-plugin`:

| Pass | What it does |
|---|---|
| **Bogus control flow** | Every safe basic block gets a junk twin guarded by an opaque-true predicate — doubles the apparent CFG complexity |
| **Control-flow flattening** | Rewrites the CFG into a single `while(switch)` dispatch loop — destroys CFG-based signatures |
| **Instruction substitution** | Replaces arithmetic with mathematically equivalent expressions — every `a + b` looks different |
| **String obfuscation** | Encrypts string literals; the decryptor runs on first use — strings don't show up in `strings` |

These run **after** every source-layer transformation Bin2Shell did, so signatures have to survive *two* layers of diversification.

The MSI installer bundles `Tools\LLVM\bin\` (clang++, clang-cl, lld-link, LLVM-C.dll) plus the prebuilt `pass.dll` files under `Assets\llvm-passes\*/`. MSVC's `cl.exe` is not bundled (~2 GB, license-sensitive) — `doctor` flags it if missing.

→ [LLVM obfuscation backend](/internals/llvm-backend)

## Stage 6 — Post-process

::: info What it does
Names the output, optionally clones PE metadata, and writes a full session log.
:::

| Step | What it does |
|---|---|
| **Hash naming** | Output named `YYYYMMDD_HHMMSS-<sha256prefix>.exe` for unambiguous, sortable artifacts |
| **PE metadata cloning** | With `--clone-metadata --clone-from <donor.exe>`, copies resources, version info, and (optionally) the icon from a donor binary |
| **Session logging** | Writes the rendered source, full compiler stdout/stderr, and a structured `session.json` to `logging/session_<ts>/` |

**Why clone metadata?** A loader that ships with empty version info or a generic icon stands out at a glance. Cloning from a known-good donor gives the binary plausible-looking properties without lying about its hash.

## Session artifacts

Every build writes to a timestamped session directory you can audit later:

| File | What it contains |
|---|---|
| `logging/session_<ts>/source.cpp` | Rendered C++ source fed to the compiler — review to verify snippet selections |
| `logging/session_<ts>/build_log.txt` | Full compiler stdout + stderr — first place to check on compile failures |
| `logging/session_<ts>/session.json` | Build metadata: template, snippet selections, shellcode SHA-256, output path |

These artifacts make every build reproducible and debuggable. If a build fails, the rendered source plus the build log tell you exactly what happened.

→ [Output & artifacts](/guide/output)

## Putting it together

```powershell
# Minimal — file in, exe out
washmachine-cli encode -s payload.bin

# Full pipeline — encoding + LLVM obfuscation + metadata cloning
washmachine-cli encode `
    -s payload.bin `
    -t stealth `
    -Encoder 10 -Envelope 2 `
    -Snippet "antidebugging=IsDebuggerPresent,PebNtGlobalFlag" `
    -Snippet "installation=AppDataDir" `
    -Snippet "persistence=HkcuRunKey" `
    -Backend llvm `
    -CloneMetadata -CloneFrom C:\Windows\System32\notepad.exe
```

Every option you skip falls back to a safe default. The pipeline is composable, not all-or-nothing.

→ Full CLI reference: [`encode`](/cli/compile)
