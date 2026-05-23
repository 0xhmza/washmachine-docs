# Encoders & Envelopes

Bin2Shell separates the pipeline into two reversible stages: **encoders** transform the raw bytes, and **envelopes** render the encoded bytes as printable text. Both stages emit C++ inverse logic that runs inside the loader at process start.

```text
raw bytes  ─→  encoder  ─→  envelope (optional)  ─→  embed or carrier  ─→  loader source
```

The pipeline is order-invariant in its CLI: `-e <N>` picks the encoder, `-v <N>` picks the envelope. Pass `0` for either to disable that stage.

## Encoders

The four modern encoders (indices 6–10) use `keys_snippet` to mint a fresh random key on every build, so two `bin2shell` runs of the same command produce different ciphertexts and different key arrays.

| Index | Name | Block / Mode | Key | Notes |
|---|---|---|---|---|
| `0` | `none` | Pass-through | — | No transform; useful when only envelope-encoding matters |
| `1` | `xor42` | Byte | Fixed `0x42` | Legacy; deterministic — easily fingerprinted |
| `2` | `rc4` | Stream | Fixed key `"bin2shell"` | Legacy; keep for backward compat |
| `3` | `xor_key` | Multi-byte | Fixed key `"secret"` | Legacy |
| `4` | `caesar` | Byte | — | Add-13 |
| `5` | `rol3` | Byte | — | Rotate-left by 3 |
| `6` | **`rc4_random`** | Stream | **Random 16-byte** | RC4 with a fresh per-build key |
| `7` | **`xor_random`** | Multi-byte | **Random 16-byte** | Multi-byte XOR with a fresh per-build key |
| `8` | **`tea`** | 64-bit block, CTR | **Random 128-bit** | TEA Feistel — 32 rounds — keystream XOR per block index |
| `9` | **`xtea`** | 64-bit block, CTR | **Random 128-bit** | Hardened TEA variant |
| `10` | **`chacha20`** | Stream | **Random 256-bit key + 96-bit nonce** | RFC 8439 ChaCha20 — recommended for new builds |

### Key materialisation

Encoders with `keys_snippet` emit one or more `unsigned char` arrays into the loader source. Polymorphism (`--poly 1` default) then renames these arrays to per-run-random identifiers (e.g. `xor_key` → `_k8ib40s`). See [Polymorphism](/bin2shell/polymorphism) for details on what stays stable.

### Recommended pairings

| Use case | Pick |
|---|---|
| **Strongest evasion** | `chacha20` (10) — random 256-bit key, no key reuse across builds |
| **Smallest C++ footprint** | `xor_random` (7) — ~12 lines of inverse code |
| **Block cipher + small** | `xtea` (9) — ~28 lines, 32 rounds, random 128-bit key |
| **Legacy compatibility** | `xor42` (1) / `rc4` (2) — fixed keys, predictable bytes |
| **No encoder** | `none` (0) — leave envelope to do the work |

## Envelopes

Envelopes turn binary bytes into printable text. They emit:

- A `code_blob_text` string literal (or carrier-loaded vector — see [Carriers](/bin2shell/carriers))
- An inline C++ decoder that produces `enc_buf` / `enc_len` for the encoder inverse to consume

| Index | Name | Alphabet size | Bytes-out per byte-in | Notes |
|---|---|---|---|---|
| `0` | `none` | — | 1.00× | Raw byte array; no envelope decode runs |
| `1` | `base91` | 91 | ~1.23× | Densest printable encoding; ASCII printable only |
| `2` | `base64` | 64 | 1.33× | RFC 4648 standard |
| `3` | `base32` | 32 | 1.60× | RFC 4648 standard (uppercase + digits) |
| `4` | `hex` | 16 | 2.00× | Lowercase Base16 |
| `5` | `base58` | 58 | ~1.37× | Bitcoin-style — no 0OIl confusables |
| `6` | `base85` | 85 | 1.25× | Ascii85 / RFC 1924 — Python `base85encode` variant |
| `7` | `ipv4_array` | — | varies | Comma-separated IPv4 addresses; survives DPI that scans for IP lists |
| `8` | `mac_array` | — | varies | Comma-separated MAC addresses (hex, hyphen-separated) |
| `9` | `uuid_array` | — | varies | Comma-separated strict UUIDs; Microsoft little-endian field layout |
| `10` | `base32hex` | 32 | 1.60× | Base32Hex (RFC 4648) — sortable, hex-aligned |

### Choosing an envelope

| Constraint | Suggestion |
|---|---|
| **Smallest output** | `base91` (1) — densest text encoding |
| **Looks like config data** | `base64` (2) — most common, blends in with API tokens, JWT, etc. |
| **Looks like infrastructure** | `ipv4_array` (7) / `mac_array` (8) — reads as network telemetry |
| **Looks like GUIDs** | `uuid_array` (9) — reads as installer registration data |
| **Maximum density without envelope** | `none` (0) — embed as raw byte array |

## Examples

### Pure encoder, no envelope

```powershell
python main.py -e 10 payload.bin -o loader.cpp
```

Emits a raw `unsigned char enc_buf[]` byte array plus the ChaCha20 inverse — no text decoding stage.

### Encoder + envelope (the common case)

```powershell
python main.py -e 10 -v 2 payload.bin -o loader.cpp
```

Emits a `const char code_blob_text[]` Base64 string + inline Base64 decode + ChaCha20 inverse.

### Just the envelope

```powershell
python main.py -e 0 -v 7 payload.bin -o loader.cpp
```

Embeds the payload as a comma-separated list of IPv4 addresses; no encryption stage.

### Reproducible build (same source every run)

```powershell
python main.py -e 10 -v 2 --seed 0xDEADBEEF payload.bin -o loader.cpp
```

Pin the polymorphism RNG so a given seed always produces the same identifiers and the same encoder keys.

## Catalog format

Encoders live in `data/yaml/algos.yaml`:

```yaml
- index: 10
  name: chacha20
  desc: ChaCha20 stream cipher with per-build random 256-bit key + 96-bit nonce
  keys_snippet: |
    def gen_keys():
        import os
        return {"chacha_key": os.urandom(32), "chacha_nonce": os.urandom(12)}
  python_snippet: |
    def encode(data: bytes, keys: dict) -> bytes:
        # … ChaCha20 implementation, returns ciphertext bytes
  cpp_inverse: |
    // ChaCha20 stream cipher (RFC 8439) — symmetric: same code decodes
    // (full C++ implementation here, references chacha_key / chacha_nonce)
```

The catalog validator enforces: unique `index`, unique `name`, non-empty `python_snippet`, non-empty `cpp_inverse`. `keys_snippet` is optional — when present, its `gen_keys()` is called per build and the returned `{name: bytes}` dict becomes `unsigned char` arrays at file scope.

See [Washmachine Integration](/bin2shell/integration) for how `CompilerService` consumes this output.
