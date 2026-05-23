# Bin2Shell Overview

Bin2Shell is the encoding, envelope, and payload-hiding engine bundled with Washmachine. It converts a binary payload into self-contained C/C++ reconstruction logic, with optional per-run randomisation so two builds of the same command produce different-looking source.

Washmachine consumes Bin2Shell output during compilation when `--encoder`, `--envelope`, or the new `--carrier` options are set. Bin2Shell can also be run standalone — both products ship from the same source.

## What's in the box

| Feature | What it does |
|---|---|
| **11 encoders** | Reversible byte transforms — modern entries (RC4-random, TEA, XTEA, ChaCha20, XOR-random) use per-build random keys so every build is unique |
| **11 envelopes** | Wraps encoded bytes as printable text — Base91, Base64, Base32, Hex, Base58, Ascii85, IPv4-array, MAC-array, UUID-array, Base32Hex |
| **4 carriers** | Hides the payload inside a valid-looking external file on disk — PNG, BMP, ICO, INI — that the generated C++ opens and unwraps at runtime |
| **Polymorphism** | Per-run symbol renamer + seed support; the generated source has fresh internal names every build |
| **Web bundle mode** | Outputs a YAML package with WinHTTP / WinINet / URLMon fetch helpers so the payload arrives over HTTP at runtime instead of being embedded |
| **YAML-driven catalog** | Encoders, envelopes, and web helpers are declared in `data/yaml/algos.yaml`; carriers are defined in Python (`bin2shell/carriers.py`) |
| **WinForms GUI** | Dark-mode Rufus-style front-end exposing every flag |

## Project reference

- **Upstream:** [Bin2Shell on GitHub](https://github.com/0xhmza/bin2shell)
- **Role inside Washmachine:** invoked by `CompilerService` via `Bin2ShellRunner` when encoding/envelope/carrier options are set
- **Runtime:** Python 3.10+
- **Provisioning:** `washmachine-cli provision` installs Bin2Shell automatically; `washmachine-cli doctor` confirms the install

## Source layout

```text
Tools/Bin2Shell/
├── main.py                      Thin CLI entry
├── bin2shell.exe                Optional WinForms GUI
├── bin2shell/
│   ├── cli.py                   Argument parsing, generation pipeline
│   ├── catalog.py               YAML catalog loader (encoders, envelopes, web helpers)
│   ├── carriers.py              External-file carriers (ini / png / bmp / ico)
│   ├── polymorphism.py          Per-run symbol renamer + seed-based RNG
│   ├── formatting.py            C array / string formatting utilities
│   └── utils.py                 File I/O, terminal width
├── data/yaml/
│   └── algos.yaml               Encoder, envelope, web-helper definitions
└── testing.py                   Matrix test harness (148 cases incl. carrier sweep)
```

## Requirements

| Component | Version | Notes |
|---|---|---|
| Python | 3.10+ | Required for all Bin2Shell operations |
| PyYAML | latest | Single Python dependency for catalog parsing |

::: tip GUI
The WinForms GUI ships as `bin2shell.exe` (~175 KB single-file) and runs alongside `main.py` and the `bin2shell/` package. It exposes every CLI flag — including the new Carrier dropdown, Polymorphism level, and Seed field.
:::

## Where to next

| Page | Topic |
|---|---|
| [Encoders & Envelopes](/bin2shell/encoders) | Full catalog of the 11 encoders and 11 envelopes with parameters and example outputs |
| [External Carriers](/bin2shell/carriers) | PNG / BMP / ICO / INI file spoofing — how the wrap and runtime unwrap work |
| [Polymorphism](/bin2shell/polymorphism) | Per-run symbol renamer, `--seed`, and what stays stable in the public ABI |
| [Washmachine Integration](/bin2shell/integration) | How `CompilerService` invokes Bin2Shell during the compile pipeline |
| [Web Mode & Security](/bin2shell/advanced) | Runtime HTTP fetch via WinHTTP / WinINet / URLMon, and the catalog trust model |
