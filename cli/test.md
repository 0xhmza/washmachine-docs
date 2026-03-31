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

| Phase | Coverage | Description |
|---|---|---|
| **1** | Encoder × Envelope × Web helper | Tests all encoding and envelope combinations with web delivery |
| **2** | Template × Snippet permutations | Tests all templates with snippet combinations |
| **3** | Multiple shellcode inputs | Tests compilation with each `.bin` file in the assets directory |

## Examples

```powershell
# Run all phases
washmachine-cli test --shellcode messagebox.bin --phase all

# Run phase 1 only with explicit URL
washmachine-cli test --shellcode messagebox.bin --phase 1 --url http://host/payload.bin

# Run phase 3 with custom assets
washmachine-cli test --phase 3 --test-assets "testing assets/binary/shellcodes"
```
