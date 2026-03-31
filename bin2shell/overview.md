# Bin2Shell Overview

Bin2Shell is the encoding and envelope transformation engine used by Washmachine. It converts binary payloads into C/C++ reconstruction logic, enabling payload obfuscation and format transformation within the compile pipeline.

## Project Reference

- **Upstream:** [Bin2Shell on GitHub](https://github.com/0xhmza/bin2shell)
- **Role:** Optional transformation stage invoked during compilation when `--encoder` or `--envelope` options are set
- **Runtime:** Python 3.10+
- **Provisioning:** `washmachine-cli provision` downloads and installs Bin2Shell automatically

## Purpose

When integrated into the Washmachine compile pipeline, Bin2Shell provides:

- **Reversible payload transforms** — encoding algorithms that obfuscate shellcode bytes
- **Envelope conversion** — transforms binary payloads into printable text representations (Base91, Base64, Base32)
- **C++ decode snippets** — generated inverse/decode routines compiled directly into the loader
- **Web delivery mode** — separates payload from loader with runtime HTTP fetch and reconstruction

## Internal Structure

```text
Tools/Bin2Shell/
├── main.py                    CLI entry point
├── bin2shell/
│   ├── cli.py                 Argument parsing and output generation
│   ├── catalog.py             YAML algorithm catalog loading
│   ├── formatting.py          Output formatting utilities
│   └── utils.py               Shared helpers
├── data/yaml/
│   └── algos.yaml             Encoder/envelope definitions
└── testing.py                 Matrix testing
```

## Requirements

| Component | Version | Notes |
|---|---|---|
| Python | 3.10+ | Required for all Bin2Shell operations |
| PyYAML | latest | Python dependency for YAML parsing |
