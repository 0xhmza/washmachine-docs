# Compile Pipeline

The compilation pipeline is orchestrated by `CompilerService` (~1,700 lines).

## Pipeline flow

```text
UiData (control-value snapshot)
  │
  ├─ Session directory creation (logging/session_YYYYMMDD_HHMMSS_<guid>/)
  │
  ├─ Compiler discovery (CompilerToolLocator)
  │    └─ Search: manual → bundled → env vars → VS installs → PATH
  │
  ├─ Template resolution ([YamlCodeSnippetCatalogService](/internals/yaml-catalog))
  │    └─ Load YAML → parse sections → resolve template by ID
  │
  ├─ CppCompilationPlan construction
  │    ├─ Map snippet selections to template placeholders
  │    ├─ Collect #include directives and function implementations
  │    ├─ Process shellcode source (file / hex / URL / web payload)
  │    └─ Apply Bin2Shell encoding/envelope if requested
  │
  ├─ Template rendering
  │    └─ Substitute all {{PLACEHOLDER}} tokens with resolved content
  │
  ├─ C++ source persistence (temp/cpp/)
  │
  ├─ CppFileConverter.ConvertAsync()
  │    ├─ Detect compiler kind (cl.exe / g++.exe / clang++.exe)
  │    ├─ Detect DllMain presence (switches to DLL output)
  │    ├─ Detect required libraries (winhttp, urlmon, etc.)
  │    ├─ Build compiler arguments
  │    ├─ Set up environment (vcvars for MSVC, PATH for GCC)
  │    └─ Execute compiler subprocess with output capture
  │
  └─ Output naming: YYYYMMDD_HHMMSS-<sha256[0:5]>.exe
```

## Shellcode source resolution

| Kind | Source | Behavior |
|---|---|---|
| **File** | `--shellcode <path>` | Read binary, convert to C++ byte array literal |
| **Raw** | `--shellcode-hex <hex>` | Parse hex string, convert to byte array |
| **URL** | `--shellcode-url <url>` | Emit C++ runtime code that fetches payload via WinHTTP |
| **Generic** | Built-in test payloads | Embed calc or MessageBox shellcode from catalog |
| **WebPayload** | Bin2Shell web mode | Generate includes, declarations, fetch helper, decode logic |

## Toolchain discovery

`CompilerToolLocator` searches for C++ compilers in strict priority order:

1. **Manual candidates** — paths registered via `AddManualCandidateAsync()`
2. **Bundled tools** — `<app>/Tools/` directory
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022/2019/2017 across all editions; legacy 14.0–10.0
5. **System PATH** — `cl.exe`, `g++.exe`, `clang++.exe`

## Compiler arguments

| Compiler | Optimization | Standard | Linking |
|---|---|---|---|
| **MSVC** (`cl.exe`) | `/O1 /Gy /EHsc` | `/std:c++17` | `kernel32.lib user32.lib advapi32.lib ntdll.lib ...` |
| **GCC** (`g++.exe`) | `-Os -s -ffunction-sections` | C++17 default | `-lkernel32 -luser32 ...` (detected from source) |
| **Clang** (`clang++.exe`) | Same as GCC | Same as GCC | Same as GCC |

When source files reference WinHTTP or URL download APIs, the linker automatically adds `-lwinhttp` / `-lurlmon`.
