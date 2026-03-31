# Test Harness

Validate your setup by running the automated test suite across configurable phases.

## Running tests

```powershell
# Run all test phases
washmachine-cli test --shellcode messagebox.bin --phase all

# Run encoder/envelope combinations only
washmachine-cli test --shellcode messagebox.bin --phase 1

# Run template/snippet permutations
washmachine-cli test --shellcode messagebox.bin --phase 2

# Run multi-shellcode testing
washmachine-cli test --phase 3 --test-assets "testing assets/binary/shellcodes"
```

## Test phases

| Phase | Coverage | Description |
|---|---|---|
| **1** | Encoder × Envelope × Web helper | Tests all encoding and envelope combinations with web delivery |
| **2** | Template × Snippet permutations | Tests all templates with snippet combinations |
| **3** | Multiple shellcode inputs | Tests compilation with each `.bin` file in the assets directory |

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--shellcode` | path | auto-detected | Shellcode `.bin` file for testing |
| `--phase` | `1`/`2`/`3`/`all` | `all` | Test phase to execute |
| `--url` | URL | auto (local HTTP) | URL for web-mode payload delivery |
| `--test-assets` | path | `testing assets/binary/shellcodes` | Directory of shellcode files for Phase 3 |

## Results

Results are written to `test_results.json` with counts for: total, passed, compile failures, runtime failures, and security-blocked executions.

The test runner starts a local Python HTTP server (default port 18923) for URL-mode testing.

## Provisioning Bin2Shell

Bin2Shell provides encoding and envelope capabilities. Provision it before using `--encoder` or `--envelope` options:

```powershell
washmachine-cli provision
```

This downloads the Bin2Shell Python tool from GitHub and installs it to `Tools/Bin2Shell/`. Verify:

```powershell
washmachine-cli list encoders
```
