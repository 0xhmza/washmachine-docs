# Web Delivery & Security

## Web delivery mode

Bin2Shell web mode (`-w`) separates the payload from the loader. The loader fetches the encoded payload at runtime via HTTP.

### Output format

```yaml
cpp_includes: |
  #include <windows.h>
  #include <winhttp.h>
cpp_declarations: |
  unsigned char* code_blob = NULL;
  size_t code_blob_len = 0;
cpp_web_fetch: |
  // HTTP fetch helper function
cpp_payload_init: |
  // Payload initialization code
cpp_decode: |
  // Decode and reconstruction logic
payload: "<hex-encoded payload>"
payload_checksum:
  value: "<sha256>"
options:
  payload_len: 512
```

The parser handles both new and legacy formats, and repairs C++ escape sequences that may be corrupted during YAML serialization.

### Assembly methods

| Method | Returns | Used for |
|---|---|---|
| `BuildPreamble()` | Includes + web fetch helper | `PREAMBLE` placeholder |
| `BuildBody()` | Declarations + init + decode | `SHELLCODE_SOURCE` placeholder |
| `BuildShellcodeSourceBlock()` | All C++ sections combined | Standalone integration |
| `ReplacePayloadUrl(url)` | *(mutates)* | Updates fetch URL for deployment |

## Security and trust model

Algorithm catalogs and snippet definitions execute generation-time logic and emit compile-time code.

::: danger Trust boundary
Only use Bin2Shell algorithm catalogs from trusted sources. Modified catalogs can inject arbitrary C++ code into compiled loaders.
:::

## Verification workflow

```powershell
# 1. Verify Bin2Shell is installed
washmachine-cli list encoders

# 2. Verify snippet catalog is accessible
washmachine-cli list snippets

# 3. Test compilation with encoding
washmachine-cli compile -s payload.bin -e 1 -v 1

# 4. Test all combinations
washmachine-cli test --shellcode payload.bin --phase 1
```

Inspect session logs at `logging/session_*/` for the rendered source code and compiler output.

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
