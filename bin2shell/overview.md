# Bin2Shell

Bin2Shell is the encoding, envelope, and payload-hiding engine bundled with Washmachine. It takes a binary payload and turns it into self-contained C/C++ reconstruction logic — with per-run randomisation that makes every build look different, even when you run the same exact command twice.

When you pass `--encoder`, `--envelope`, or `--carrier` to `washmachine-cli encode`, this is what runs under the hood. You can also use it standalone — both products ship from the same source.

## What you get

| Feature | What it does | Why it matters |
|---|---|---|
| **11 encoders** | Reversible byte transforms — ChaCha20, XTEA, TEA, RC4-random, XOR-random… | The modern entries mint a fresh random key on every build, so two builds have different ciphertexts |
| **11 envelopes** | Render encoded bytes as printable text — Base91, Base64, Base32, Hex, Base58, Ascii85, IPv4-array, MAC-array, UUID-array, Base32Hex | The blob looks like config data, telemetry, or installer metadata — not a payload |
| **4 carriers** | Hide the payload in a valid PNG, BMP, ICO, or INI file on disk | The file opens correctly in any viewer; the payload hides in plain sight |
| **Polymorphism** | Per-run symbol renamer reseeds every internal identifier | Two builds of the same command produce different-looking source files |
| **Web bundle mode** | Emit a loader that fetches the payload over HTTP at runtime (WinHTTP / WinINet / URLMon) | One compiled binary, many payload endpoints — retarget without recompiling |
| **YAML-driven catalog** | Encoders, envelopes, and web helpers declared in `data/yaml/algos.yaml` | Add new algorithms without touching Python; carriers stay in code because they need both wrap + unwrap |
| **WinForms GUI** | Dark-mode Rufus-style front-end exposing every flag | Click-to-encode for when you don't feel like typing flags |

## The encoding pipeline

Bin2Shell separates the work into discrete, reversible stages. Each stage is optional — pass `0` to disable.

```text
raw bytes  →  encoder  →  envelope (optional)  →  embed | carrier | web bundle  →  loader source
              ChaCha20…    Base91 / Base64 /        const char[]    .png / .bmp /     reconstruction
                           IPv4 / UUID / …          inline          .ico / .ini       runs at startup
                                                                    or HTTP fetch
```

**Why pipeline it?** Each stage plays a different role in the same goal of making the payload look like something else:

- **Encoder** rolls the bytes through a cipher with a per-build key. Two builds produce different ciphertexts, so signature databases keyed off ciphertext bytes don't survive a rebuild.
- **Envelope** turns the (cipherer'ed) bytes into printable text. The choice of envelope decides what the embedded blob *looks like* — Base64 looks like a JWT, IPv4-array looks like network telemetry, UUID-array looks like installer registration data.
- **Carrier** moves the encoded blob out of the loader entirely, into a valid PNG / BMP / ICO / INI file. The loader opens that file at runtime, finds the payload chunk (or appended bytes), and feeds it back into the same envelope-decode → encoder-inverse pipeline.
- **Web bundle** does the same, but over HTTP — the encoded blob is hosted somewhere you control, and the loader fetches it at startup.

## Quick start

```powershell
# ChaCha20 + Base64 — common case
python main.py -e 10 -v 2 payload.bin -o loader.cpp

# Hide the payload in a PNG file
python main.py -e 10 -v 2 --carrier png payload.bin -o loader.cpp

# Fetch from a URL at runtime instead of embedding
python main.py -e 10 -v 2 -w payload.bin -o loader.yaml

# Pin the polymorphism RNG for a reproducible build
python main.py -e 10 -v 2 --seed 0xCAFE payload.bin -o loader.cpp
```

Or invoked indirectly through Washmachine:

```powershell
washmachine-cli encode -s payload.bin -Encoder 10 -Envelope 2
washmachine-cli encode -s payload.bin -Encoder 10 -Envelope 2 -Carrier png
```

## Polymorphism — every build is unique

Modern encoders (`rc4_random`, `xor_random`, `tea`, `xtea`, `chacha20`) mint a fresh random key on every run. The polymorphism layer then walks the generated source and renames every internal identifier — buffer names, struct names, key arrays — to fresh `_b…` / `_k…` symbols.

```cpp
// Build #1
unsigned char xor_key[] = { /* 16 random bytes */ };
struct Bin2ShellPayload { /* … */ };

// Build #2 — same command, fresh source
unsigned char _k8ib40s[] = { /* 16 different random bytes */ };
struct _b4a9wt { /* … */ };
```

Public symbols (`code_blob`, `code_blob_len`) stay stable so downstream consumers don't break. Need byte-identical reproducibility? `--seed 0xCAFE` pins the RNG.

→ [Full polymorphism reference](/bin2shell/polymorphism)

## Where Bin2Shell sits in Washmachine

| Property | Detail |
|---|---|
| **Upstream** | [github.com/0xhmza/bin2shell](https://github.com/0xhmza/bin2shell) |
| **Role inside Washmachine** | Invoked during `encode` whenever `--encoder`, `--envelope`, `--carrier`, or `--sgn` is set |
| **Runtime** | Python 3.10+ |
| **Provisioning** | `washmachine-cli provision` installs it; `washmachine-cli doctor` confirms the install |
| **Verification** | `washmachine-cli show encoders` lists what's loaded from `algos.yaml` |

## Requirements

| Component | Version | Notes |
|---|---|---|
| Python | 3.10+ | Required for all Bin2Shell operations |
| PyYAML | latest | Single Python dependency for catalog parsing |

::: tip GUI
The WinForms GUI ships as `bin2shell.exe` (~175 KB single-file) and runs alongside `main.py` and the `bin2shell/` package. Every CLI flag is exposed — including the Carrier dropdown, Polymorphism level, and Seed field.
:::

## Where to next

| Page | Topic |
|---|---|
| [Encoders & envelopes](/bin2shell/encoders) | Full catalog of the 11 encoders and 11 envelopes — algorithms, parameters, examples |
| [External carriers](/bin2shell/carriers) | PNG / BMP / ICO / INI file spoofing — how the wrap and runtime unwrap work |
| [Polymorphism](/bin2shell/polymorphism) | Per-run symbol renamer, `--seed`, and what stays stable in the public ABI |
| [Washmachine integration](/bin2shell/integration) | How Washmachine invokes Bin2Shell during the compile pipeline |
| [Web mode & security](/bin2shell/advanced) | Runtime HTTP fetch via WinHTTP / WinINet / URLMon, and the catalog trust model |
