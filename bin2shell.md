# Bin2Shell Integration

This page documents Bin2Shell as the assisting tool used by Washmachine for payload encoding and envelope generation workflows.

## Project reference

- Upstream repository: `https://github.com/0xhmza/bin2shell`
- Role in Washmachine: optional transformation stage used by compile workflows when encoder/envelope options are selected

## Purpose

Bin2Shell converts binary payloads into C/C++ reconstruction logic. In Washmachine integration scenarios, it provides:

- reversible payload transforms through encoder algorithms,
- optional conversion into printable envelope formats,
- and C++ inverse/decode snippets consumed during loader generation.

## Internal structure (Bin2Shell)

From the public Bin2Shell project layout:

```text
bin2shell/
  main.py
  testing.py
  bin2shell/
    cli.py
    catalog.py
    formatting.py
    utils.py
  data/yaml/
    algos.yaml
  ui/
    Bin2ShellUI.csproj
    MainForm.cs
    Program.cs
```

### Component responsibilities

- `main.py`: CLI entry point
- `bin2shell/cli.py`: argument parsing and output generation
- `bin2shell/catalog.py`: YAML algorithm catalog loading and execution
- `data/yaml/algos.yaml`: encoder/envelope definitions and snippets
- `testing.py`: matrix testing across algorithm combinations
- `ui/*`: .NET 8 WinForms desktop interface

## Integration contract in Washmachine

Washmachine consumes Bin2Shell capabilities through provisioning and compile-time transformation stages.

High-level contract:

1. Washmachine resolves raw shellcode bytes from file/hex/URL inputs.
2. If encoder/envelope options are set, Washmachine invokes Bin2Shell-supported transformations.
3. Generated C++ inverse/decode content is incorporated into template rendering.
4. Final source is compiled through the selected C++ toolchain.

## Algorithms and options

Bin2Shell defines encoder and envelope algorithms by index in YAML catalogs.

Documented encoder set:

- `[0]` none
- `[1]` xor
- `[2]` xor2
- `[3]` arx8
- `[4]` arx82

Documented envelope set:

- `[0]` none
- `[1]` base91
- `[2]` base64
- `[3]` base32

In Washmachine CLI, these are selected through:

- `compile --encoder <index>`
- `compile --envelope <index>`

## Output behavior

Bin2Shell native output contract includes:

- reconstructed runtime byte pointer: `code_blob`
- reconstructed runtime byte length: `code_blob_len`

When an envelope is used, output can include:

- encoded text payload constants,
- decode routines to recover encoded bytes,
- and inverse logic to reconstruct original payload bytes.

Washmachine integrates this output into generated C++ templates before compilation.

## Web bundle mode

Bin2Shell can emit a YAML bundle with:

- C++ template for runtime web retrieval,
- encoded payload material,
- payload checksum metadata,
- algorithm option metadata.

When used in compatibility testing or advanced workflows, this mode supports payload separation and runtime retrieval patterns.

## Requirements

Bin2Shell requirements (from upstream project):

- Python 3.10+
- PyYAML
- .NET 8 SDK (GUI only)

Washmachine requirement linkage:

- Bin2Shell-dependent features require a Python runtime in host environment.
- `washmachine-cli provision` installs/configures required external components.

## Security and trust model

Algorithm catalogs and snippet definitions execute generation-time logic and emit compile-time code. Only trusted Bin2Shell catalog sources should be used in production environments.

## Verification workflow

Recommended validation sequence after provisioning:

1. `washmachine-cli list --encoders`
2. `washmachine-cli list --snippets`
3. `washmachine-cli compile -s <payload.bin> --encoder <idx> --envelope <idx>`
4. Inspect session logs and resulting artifacts for expected transform behavior.

::: warning Security Notice
For educational and authorized security testing purposes only.
:::
