# Washmachine Integration

How Washmachine consumes Bin2Shell through its core services.

## Integration services

### Bin2ShellRunner

Process wrapper that executes the Bin2Shell Python script:

- Detects Python via `py` (Windows launcher) or `python3` (Unix fallback)
- Runs with UTF-8 stdout (Bin2Shell itself forces `sys.stdout.reconfigure(encoding="utf-8")`)
- Returns stdout as a string; raises on non-zero exit code
- Lives at `Washmachine.Core/Services/Bin2ShellRunner.cs`

### ShellcodeEncodingCatalogService

Parses the Bin2Shell catalog so the CLI can render `show encoders` / `show envelopes` without re-implementing the listing logic:

- Invokes `bin2shell -h` and parses the formatted catalog footer
- Recognises section headers: "available encoders", "available envelopes", "available carriers", "available web helpers"
- Parses line format: `  [<index>] <name>  <description>`
- Returns a strongly-typed `ShellcodeEncodingCatalog`

### Bin2ShellWebOutputParser

When `--web` is set, Bin2Shell emits a YAML bundle (`cpp_includes`, `cpp_web_fetch`, `cpp_payload_init`, `cpp_decode`, `payload`, `options`). This parser turns that bundle into typed C# objects, repairs C++ escape sequences, and exposes assembly helpers used by `CompilerService`.

## Compile-time integration flow

```text
1. Washmachine resolves raw shellcode bytes (file / hex / URL)
2. If --encoder, --envelope, or --carrier is set:
   │
   ├─ Bin2ShellRunner.RunAsync() invokes Bin2Shell with:
   │   • Input shellcode file
   │   • Encoder index (-e)
   │   • Envelope index (-v)
   │   • Carrier (--carrier) + --carrier-out next to the build
   │   • Polymorphism seed (--seed, optional)
   │   • Catalog path (-y algos.yaml)
   │
   ├─ For inline mode: stdout is captured C++ source — injected
   │   into the {{SHELLCODE_SOURCE}} placeholder.
   │
   ├─ For --web: Bin2ShellWebOutputParser parses the YAML bundle
   │   • Extracts cpp_includes / cpp_web_fetch / cpp_payload_init / cpp_decode
   │   • Repairs C++ escape sequences
   │   • Parses payload checksum and length
   │
   └─ For --carrier: the wrapped carrier file (e.g. payload.png)
       is copied alongside the build output. The emitted C++
       contains the file-load + unwrap block.
3. Template is rendered with the encoded payload section
4. Compiler builds the final executable (cl.exe / clang++ / g++)
```

## Pipeline mapping

| Bin2Shell output | Washmachine destination |
|---|---|
| Inline `unsigned char enc_buf[]` + inverse C++ | `{{SHELLCODE_SOURCE}}` placeholder |
| Carrier load block + `__carrier_payload` vector | `{{SHELLCODE_SOURCE}}` placeholder |
| Web bundle: `cpp_includes` | `{{PREAMBLE}}` placeholder |
| Web bundle: `cpp_web_fetch` | `{{PREAMBLE}}` placeholder |
| Web bundle: `cpp_payload_init` + `cpp_decode` | `{{SHELLCODE_SOURCE}}` placeholder |
| Carrier file on disk | Copied next to the compiled `.exe` |

## CLI passthrough

Washmachine's `encode` command surfaces every relevant Bin2Shell flag:

| Washmachine flag | Bin2Shell equivalent |
|---|---|
| `-Encoder <N>` | `-e <N>` |
| `-Envelope <N>` | `-v <N>` |
| `-Sgn` `-SgnCount` `-SgnMax` | Wraps Shikata Ga Nai *before* invoking Bin2Shell |
| *(planned)* `-Carrier` | `--carrier` |
| *(planned)* `-Seed` | `--seed` |

::: tip Calling Bin2Shell directly
You can always bypass Washmachine and call Bin2Shell standalone — it ships in the same `Tools/Bin2Shell/` directory the runner uses. The CLI is fully documented at the [Bin2Shell overview](/bin2shell/overview).
:::

## Standalone test matrix

`Tools/Bin2Shell/testing.py` runs every encoder × envelope combination plus a carrier sweep and compiles each `.cpp` with a discovered compiler. The current matrix is **148 cases** (1 simple + 11 × 11 encoder/envelope + 22 default fallbacks + 4 carrier sweeps):

```powershell
cd Tools\Bin2Shell
python testing.py --out report.html `
  --compiler "C:\Program Files\LLVM\bin\clang++.exe"
```

Report headline:

```text
Totals: 148 cases, 0 main errors, 0 compile errors, 0 compile skipped, 148 compile OK
```

This is the same harness Washmachine's CI uses to gate Bin2Shell updates.

## Provisioning

Bin2Shell is auto-provisioned on first use of encoding/envelope/carrier features. Trigger it manually:

```powershell
washmachine-cli provision
```

…and confirm with:

```powershell
washmachine-cli doctor       # checks Bin2Shell + LLVM + MSVC
washmachine-cli show encoders
washmachine-cli show envelopes
```

See [`provision`](/cli/provision) and [`doctor`](/cli/doctor) for the full reference.
