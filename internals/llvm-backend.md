# LLVM Obfuscation Backend

Washmachine ships an optional compilation backend that swaps the default `cl.exe` / `g++` path for **clang-cl + LLVM pass plugins**, applying IR-level transformations during the build:

- **Bogus control flow** — every safe basic block is duplicated into a junk twin guarded by an opaque-true predicate
- **Control-flow flattening** — restructures the CFG into a single `while(switch)` dispatch loop
- **Instruction substitution** — replaces arithmetic with mathematically equivalent expressions
- **String obfuscation** — encrypts string literals; decryptor stub runs on first use

Each pass is a hot-loadable `pass.dll` built against the system LLVM install. The Washmachine binary itself stays a normal .NET app — clang's plugin loader does the heavy lifting at compile time.

## Toolchain selection

Washmachine selects a compiler at runtime:

1. **MSVC discoverable?** Use `clang-cl.exe` + the MSVC sysroot via `vcvars*.bat`. No MinGW dependency.
2. **MSVC not found?** Fall back to `clang++.exe -target x86_64-w64-mingw32` (requires MinGW headers in PATH or `Tools\mingw\`).

Both paths consume the same `pass.dll` plugins via `-fpass-plugin=<path>`.

## Version requirements

| Requirement | Value | Why |
|---|---|---|
| **Required minimum** | **20** | Bundled passes use new pass-manager APIs introduced in LLVM 16–20 |
| **Recommended** | **22** | Full obfuscation-pass API surface; matches the version bundled in the MSI |

`washmachine-cli doctor` parses `clang++ --version` and flags mismatches:

```text
[!] LLVM clang++: Version 18.1.8 is below the required minimum 20. Obfuscation
    passes will fail to load. Upgrade to LLVM 22+.
```

When clang is below the minimum, the rest of Washmachine (analyze, strip, backdoor, encode-without-obfuscation) still works — only the LLVM backend is disabled.

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

## Bundled LLVM in the installer

The MSI installer (`publish.ps1 -Installer`) bundles `Tools\LLVM\` next to the executable so end-users don't need to install LLVM separately. The bundle includes:

```text
Tools\LLVM\bin\
├── clang++.exe
├── clang-cl.exe
├── lld-link.exe
└── LLVM-C.dll
```

…plus the built `pass.dll` files under `Assets\llvm-passes\*/`. MSVC is **not** bundled (see [Build & Installer](/internals/build) for why).

