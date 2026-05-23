# External Carriers

A **carrier** moves the encoded payload out of the loader's source and onto disk in a file that looks innocuous — a 1×1 PNG, a tiny BMP, an icon, or an INI config. The generated C++ opens the file at runtime, strips the carrier framing, then runs the existing envelope-decode → encoder-inverse pipeline unchanged.

```text
encoder + envelope ──→ carrier wrap (Python, build time) ──→ payload.png
                                                                │
                                                                ▼
                       loader.exe ──→ open file ──→ unwrap ──→ envelope decode ──→ encoder inverse ──→ code_blob
```

Carriers and the [web mode](/bin2shell/advanced) are mutually exclusive — the carrier reads from disk, the web bundle fetches over HTTP.

## Catalog

| Index | Name | File ext. | Framing | Looks like |
|---|---|---|---|---|
| `0` | `ini` | `.ini` | Base64 under `[Settings] data=` | A normal Windows configuration file |
| `1` | `png` | `.png` | Custom ancillary `wMpL` chunk between IHDR and IDAT | A valid 1×1 PNG that decodes to a single grayscale pixel |
| `2` | `bmp` | `.bmp` | Payload appended after the declared pixel block | A valid 1×1 24-bit BMP |
| `3` | `ico` | `.ico` | Payload appended after the declared bitmap data | A valid 1×1 32-bit ICO |

Pick a carrier with `--carrier <name|index>` (alias `-c`).

## CLI

```text
python main.py -e <enc> -v <env> --carrier <NAME|N>
               [--carrier-out FILE]
               [--carrier-runtime-path EXPR]
               INPUT -o OUTPUT
```

| Flag | Default | Description |
|---|---|---|
| `--carrier NAME\|N` | (none) | Wrap the encoded payload in the named carrier |
| `--carrier-out FILE` | derived from `-o` (e.g. `loader.png` next to `loader.cpp`) | Where to write the wrapped carrier file on the build host |
| `--carrier-runtime-path EXPR` | basename of `--carrier-out` as a string literal | C++ expression evaluating to the path the loader opens at runtime |

The default runtime path is just the carrier's basename, so the loader expects the carrier file to sit alongside it on disk. Override with an absolute path expression for fixed deployment locations:

```powershell
python main.py -e 10 -v 2 --carrier png `
  --carrier-runtime-path '"C:/ProgramData/MyApp/icon.png"' `
  payload.bin -o loader.cpp
```

## How each carrier works

### INI

Payload bytes are base64-encoded and stored under a `data=` key inside a `[Settings]` block:

```ini
; Application configuration
; Auto-generated; do not edit.
[Settings]
version=1.0
enabled=true
data=BASE64-OF-PAYLOAD-HERE
checksum=0
```

The loader greps for `data=`, reads to the next newline, and inline-decodes the base64 into a `std::vector<unsigned char>`.

### PNG

The payload lives in a custom **ancillary** PNG chunk with type `wMpL`. PNG decoders are required by spec to skip unknown ancillary chunks, so the file decodes to a valid 1×1 grayscale pixel in any image viewer:

```
89 50 4E 47 0D 0A 1A 0A          # PNG signature
00 00 00 0D  IHDR  …  CRC        # 1×1 8-bit grayscale
00 00 NN NN  wMpL  <payload> CRC # ← our payload chunk
00 00 NN NN  IDAT  <pixel>   CRC
00 00 00 00  IEND  CRC
```

The loader walks the chunk list, matches on the 4-byte `wMpL` type, and reads exactly `chunk_length` bytes.

### BMP

A valid 1×1 24-bit BMP has a 14-byte file header + 40-byte info header + 4 bytes of pixel data. The payload is appended **after** the declared pixel block — BMP readers stop at `pixel_offset + pixel_size` and silently ignore trailing data. The loader reads the declared offsets from the header and slices from there to EOF.

### ICO

Same idea: a valid 1×1 32-bit ICO has a 6-byte ICONDIR + 16-byte ICONDIRENTRY + 40-byte BITMAPINFOHEADER + 4 bytes of bitmap data. The payload is appended after `image_offset + image_size`. The loader parses the directory entry and slices from there to EOF.

## What the loader produces

When you combine a carrier with an envelope, the carrier replaces the inline `const char code_blob_text[]` declaration with a file-load block that fills a `std::vector<unsigned char>` and rebinds:

```cpp
// Carrier: PNG — payload in custom ancillary chunk
std::ifstream __cf("loader.png", std::ios::binary);
// … walk PNG chunks, find wMpL …
std::vector<unsigned char> __carrier_payload(/* … */);

const char* code_blob_text = (const char*)__carrier_payload.data();
unsigned int code_blob_text_len = (unsigned int)__carrier_payload.size();
```

When you combine a carrier with envelope `none`, the rebinding targets `enc_buf` / `enc_len` instead. Either way, the existing envelope-decoder and encoder-inverse code runs unchanged downstream.

## What you get on disk

```powershell
python main.py -e 10 -v 2 --carrier png payload.bin -o loader.cpp
# Carrier 'png' written to loader.png (659 bytes)
```

Two artefacts:

| File | Role |
|---|---|
| `loader.cpp` | The generated C++ source with carrier-load logic; compiles into `loader.exe` |
| `loader.png` | The wrapped carrier file; deploy alongside the compiled `loader.exe` (or wherever your `--carrier-runtime-path` points) |

## Failure modes the loader catches

The generated C++ throws `std::runtime_error` on every recoverable failure so a debugger or wrapper script can react:

| Condition | Message |
|---|---|
| File not found | `Cannot open carrier file` |
| Wrong magic bytes | `Carrier is not a PNG` / `… BMP` / `… ICO` |
| Truncated payload chunk | `Truncated carrier chunk` |
| Missing payload chunk | `Carrier payload chunk not found` (PNG only) |
| INI missing `data=` line | `Carrier marker missing` |
| Empty trailing payload | `BMP carrier has no trailing payload` (BMP/ICO) |

## Implementation reference

| File | Role |
|---|---|
| `bin2shell/carriers.py` | Wrap functions + C++ load templates + the `CARRIERS` registry |
| `bin2shell/cli.py` `_apply_carrier()` | Mutates the section list to swap the inline payload section for a carrier-load section, writes the wrapped file |

Carriers are intentionally defined in Python (not in `algos.yaml`) — each carrier needs both build-time wrap logic and an emit-time C++ template, and shipping them as code is easier to test and review than nested YAML heredocs.
