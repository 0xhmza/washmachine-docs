# LLVM obfuscation backend

Most obfuscators work on source — find-and-replace, macro tricks, polymorphic templates. Washmachine's LLVM backend works one layer down: at **LLVM IR**, after the C++ source has already been parsed and normalised. That means transformations apply uniformly to every function, every basic block, every literal — regardless of how the source was written or whether it came from a snippet you wrote five minutes ago or a Win32 API call.

When you set `--backend llvm`, the compile stage routes through `clang-cl` (using the MSVC sysroot) with four IR-level pass plugins loaded via `-fpass-plugin`. The result is a binary whose control flow, arithmetic, and string literals all look different from what the source would suggest.

## The four passes

| Pass | What it does | What it defeats |
|---|---|---|
| **Bogus control flow** | Every safe basic block gets a junk twin guarded by an opaque-true predicate (a condition that's always true but a static analyzer can't prove it). Both branches are emitted; only one runs. | CFG-based signatures, decompilers that follow visible control flow |
| **Control-flow flattening** | Restructures the entire CFG into a single `while(switch)` dispatch loop. The original block-to-block edges become switch cases keyed by a state variable. | Decompilers, taint analysis, graph-based diffing tools |
| **Instruction substitution** | Replaces arithmetic operations with mathematically equivalent expressions. `a + b` might become `(a ^ b) + 2 * (a & b)`. | Constant folding, peephole signature matchers |
| **String obfuscation** | Encrypts string literals; the decryptor stub runs on first use. Strings never appear in the binary in plaintext. | `strings` command, static IOC extractors |

Each pass is a hot-loadable `pass.dll` built against the system LLVM install. The Washmachine binary itself stays a normal .NET app — clang's plugin loader does the heavy lifting at compile time.

## Why IR-level, not source-level?

Source-level obfuscation is fragile. It depends on the parser, on macro expansion order, on whether the code you wrote happens to fit the patterns the obfuscator knows about. Anything the compiler simplifies — constant folding, inlining, dead-code elimination — undoes the work.

IR-level obfuscation runs **after** the compiler has already done its normalisation. Every function looks the same to the pass, regardless of how it was written. The transformations survive optimisation because they happen between the optimisation passes — Washmachine slots the obfuscation between the default `-O1` passes, so the compiler can't undo what it doesn't see.

This stacks cleanly with Bin2Shell's source-layer polymorphism. Use both: the source is renamed, the IR is mangled, the compiled bytes are different on every build.

## Toolchain selection

Washmachine picks a compiler at runtime:

1. **MSVC discoverable?** → `clang-cl.exe` + MSVC sysroot via `vcvars*.bat`. No MinGW dependency.
2. **MSVC not found?** → `clang++.exe -target x86_64-w64-mingw32` (requires MinGW headers on PATH or under `Tools\mingw\`).

Both paths consume the same `pass.dll` plugins via `-fpass-plugin=<path>`.

## Version policy

The bundled passes use new pass-manager APIs introduced in LLVM 16–20:

| Requirement | Value | Why |
|---|---|---|
| **Required minimum** | **20** | New pass-manager API surface the bundled passes consume |
| **Recommended** | **22** | Full obfuscation-pass API; matches the version bundled in the MSI |

`washmachine-cli doctor` parses `clang++ --version` and flags mismatches:

```text
[!] LLVM clang++: Version 18.1.8 is below the required minimum 20. Obfuscation
    passes will fail to load. Upgrade to LLVM 22+.
```

When clang is below the minimum, the rest of Washmachine (analyze, strip, backdoor, encode-without-obfuscation) still works — only the LLVM backend is disabled.

## What the MSI bundles

The Washmachine installer ships LLVM 22 next to the executable so end-users don't have to install LLVM separately:

```text
Tools\LLVM\bin\
├── clang++.exe
├── clang-cl.exe
├── lld-link.exe
└── LLVM-C.dll
```

…plus the prebuilt `pass.dll` files under `Assets\llvm-passes\*/`. MSVC's `cl.exe` is **not** bundled — it's ~2 GB and licence-sensitive. `doctor` flags it if missing and points you at `vs_BuildTools.exe`.

## Pass plugin source layout

```text
Assets/llvm-passes/
├── build-all.ps1                    # Build every pass against a local LLVM install
├── test-passes.ps1                  # Smoke-test each built pass.dll
├── bogus-control-flow/
│   ├── CMakeLists.txt               # Standard LLVM plugin config
│   ├── pass.cpp                     # Pass implementation
│   ├── pass.dll                     # Built artefact (gitignored)
│   └── pass.json                    # Metadata: pass name, CLI label, defaults
├── control-flow-flattening/         # …same layout
├── instruction-substitution/        # …same layout
└── string-obfuscation/              # …same layout
```

Any directory under `Assets/llvm-passes/` that contains a built `pass.dll` is automatically picked up and exposed to the `encode` command.

## Building the passes

`Assets/llvm-passes/build-all.ps1` iterates every pass folder, resolves an LLVM SDK that ships C++ headers (the official Windows binary release only ships the C API headers; the script auto-finds Scoop, MSYS2, or a build-from-source prefix), and produces `pass.dll` next to each `pass.cpp`:

```powershell
# Default: looks for LLVM at C:\Program Files\LLVM\lib\cmake\llvm
.\Assets\llvm-passes\build-all.ps1

# Custom LLVM SDK
.\Assets\llvm-passes\build-all.ps1 -LlvmDir "C:\Dev\llvm-22-sdk\lib\cmake\llvm" -Clean
```

The script also patches the `diaguids.lib` path in `LLVMExports.cmake` if the bundled absolute path is stale — necessary because the official LLVM release bakes the build machine's `Microsoft Visual Studio\<edition>\…` path into the export file.

## Stacking with Bin2Shell

The two layers compose naturally:

```powershell
# Source-layer diversification + IR-layer obfuscation in one build
washmachine-cli encode `
    -s payload.bin `
    -Encoder 10 -Envelope 2 `      # Bin2Shell: fresh ciphertext, fresh keys
    -Backend llvm                  # LLVM: bogus CFG + flattening + sub + strings
```

The Bin2Shell pass produces source where the encoder keys, internal symbols, and ciphertext are all fresh. The LLVM passes then mangle the IR before emission. Two layers, two seeds, one binary.

→ See it end-to-end in the [Compilation flow](/internals/compile-pipeline) and [Polymorphism](/bin2shell/polymorphism).
