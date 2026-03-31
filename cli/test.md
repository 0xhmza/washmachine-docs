# `test`

Run the automated test harness across configurable phases. Results are written to `test_results.json`.

```text
washmachine-cli test [options]
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--shellcode` | path | auto-detected | Shellcode `.bin` file for testing |
| `--phase` | `1`/`2`/`3`/`all` | `all` | Test phase to execute |
| `--url` | URL | auto (local HTTP) | URL for web-mode payload delivery |
| `--test-assets` | path | `testing assets/binary/shellcodes` | Directory of shellcode files for Phase 3 |

## Test phases

The harness runs up to three phases, each exercising a different axis of the generation pipeline. For detailed phase descriptions, see [Testing Guide](/guide/testing).

| Phase | Coverage |
|---|---|
| **1** | Encoder × Envelope × Web helper combinations |
| **2** | Template × Snippet permutations |
| **3** | Multiple shellcode inputs from an assets directory |

## Result categories

Each test sample is classified into one of the following categories in the output:

| Category | Meaning |
|---|---|
| **Passed** | Compilation succeeded and the binary executed without error |
| **Compile failure** | The C++ source failed to compile — check `build_log.txt` for compiler errors. Common causes: incompatible snippet combinations, missing libraries, or toolchain issues. |
| **Runtime failure** | The binary compiled but crashed or returned a non-zero exit code at runtime. This may indicate a bug in the generated loader or an incompatible shellcode payload. |
| **Security-blocked** | The binary was blocked by Windows Defender or another security product before or during execution. This is expected in security testing — it means the AV detected the sample. |

## Interpreting `test_results.json`

After a test run completes, the results file contains a JSON object with aggregate counts and per-sample details:

```json
{
  "total": 42,
  "passed": 35,
  "compile_failures": 2,
  "runtime_failures": 1,
  "security_blocked": 4,
  "results": [
    {
      "template": "default",
      "encoder": 1,
      "envelope": 2,
      "status": "passed",
      "output": "20250101_120000-a1b2c.exe"
    },
    {
      "template": "stealth",
      "encoder": null,
      "envelope": null,
      "status": "compile_failure",
      "error": "error C2065: 'undeclared_var': undeclared identifier"
    }
  ]
}
```

- **`total`** — Number of test permutations executed
- **`passed`** — Samples that compiled and ran successfully
- **`compile_failures`** — Samples where compilation failed; review the `error` field and corresponding `build_log.txt`
- **`runtime_failures`** — Samples that compiled but failed at execution
- **`security_blocked`** — Samples quarantined or blocked by AV; expected in detection testing
- **`results[]`** — Per-sample detail including template, encoder/envelope IDs, status, and output file or error message

## Examples

```powershell
# Run all phases
washmachine-cli test --shellcode messagebox.bin --phase all

# Run phase 1 only with explicit URL
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin

# Run phase 3 with custom assets
washmachine-cli test --phase 3 --test-assets "testing assets/binary/shellcodes"
```
