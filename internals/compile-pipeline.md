# Compilation Flow

When you run `encode`, Washmachine executes a multi-step pipeline that takes your shellcode and options and produces a compiled Windows executable.

## What happens during a build

```text
1. Resolve shellcode source
2. Apply encoding (if requested)
3. Load playbook and resolve template
4. Render C++ source
5. Discover compiler
6. Compile and link
7. Post-process output
```

### 1. Resolve shellcode source

Washmachine accepts shellcode in three forms:

| Source | How to pass it |
|---|---|
| Binary file | `-Shellcode <path>` |
| Inline hex | `-ShellcodeHex <hex>` |
| Runtime URL fetch | `-ShellcodeUrl <url>` (loader fetches at runtime via WinHTTP) |

For `.exe` inputs: if the file is a managed .NET assembly, it is automatically converted to position-independent shellcode via Donut before compilation. For native shellcode-format PEs, use [`strip`](/cli/strip) to extract the flat binary first.

### 2. Apply encoding

When `--encoder`, `--envelope`, or `--sgn` are set, the raw shellcode bytes are passed through Bin2Shell and/or SGN before being embedded. The result is C++ code that decodes and reconstructs the payload at loader startup.

See [Encoding](/bin2shell/overview) for available algorithms and options.

### 3. Load playbook and resolve template

The active playbook (`Assets/default.yaml` by default) is parsed and the requested template is resolved. Each `{{PLACEHOLDER}}` token in the template is mapped to its corresponding snippet section.

### 4. Render C++ source

Snippet selections are applied: for each placeholder, the selected snippet's C++ code is substituted. Multi-select sections combine multiple snippets into a single block. The result is a complete, compilable `.cpp` file written to `logging/session_<timestamp>/source.cpp`.

### 5. Discover compiler

Washmachine searches for a C++ compiler in the following order:

1. `Tools/` directory (bundled tools)
2. Visual Studio installations (VS 2022, 2019, 2017 — all editions)
3. Environment variables (`VCToolsInstallDir`, `VCINSTALLDIR`)
4. System `PATH` (`cl.exe`, `g++.exe`, `clang++.exe`)

Run `washmachine-cli show compilers` to see what was found. If the list is empty, see [Troubleshooting](/guide/troubleshooting).

### 6. Compile and link

The resolved compiler builds the rendered source with size-optimized flags and automatically links required Windows libraries (`kernel32`, `user32`, `advapi32`, etc.). When WinHTTP or URL download code is detected in the source, the appropriate libraries are added automatically.

When `--backend llvm` is set, `clang-cl` is used instead of `cl.exe`, with LLVM obfuscation passes loaded as plugins during compilation.

### 7. Post-process output

The output binary is named `YYYYMMDD_HHMMSS-<sha256prefix>.exe` and written to `temp/cpp/Compiled Binaries/`. If PE metadata cloning is enabled (`-CloneMetadata`), resources and version info are copied from the donor PE to the output binary.

## Compiler arguments

| Compiler | Optimization | Standard |
|---|---|---|
| `cl.exe` (MSVC) | `/O1 /Gy /EHsc` | `/std:c++17` |
| `g++.exe` / `clang++.exe` | `-Os -s -ffunction-sections` | C++17 |

## Session artifacts

Every build writes artifacts to a timestamped session directory:

| File | Description |
|---|---|
| `logging/session_<ts>/source.cpp` | Rendered C++ source fed to the compiler |
| `logging/session_<ts>/build_log.txt` | Full compiler stdout and stderr |
| `logging/session_<ts>/session.json` | Build metadata: template, snippets, shellcode hash, output path |
