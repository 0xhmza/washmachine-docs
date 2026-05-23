# Polymorphism

Polymorphism is the per-run diversification layer that makes two builds of the same `bin2shell` command look like different source files. Combined with the random-key encoders (`rc4_random`, `xor_random`, `tea`, `xtea`, `chacha20`), every build produces fresh ciphertexts, fresh keys, and fresh symbol names — so static signatures based on identifier names or constants don't survive a rebuild.

## What gets renamed

The renamer walks the assembled C++ source and substitutes a whitelist of **internal** identifiers with fresh `_b<random>` / `_k<random>` names. Everything else (C++ keywords, Win32 API names, encoder algorithm constants) is left untouched.

| Category | Examples | Renamed? |
|---|---|---|
| **Public ABI** | `code_blob`, `code_blob_len` | **No** — downstream consumers depend on these |
| **Buffer state** | `enc_buf`, `enc_len`, `code_blob_text`, `code_blob_text_len`, `code_blob_expected[_len]` | Yes |
| **Bootstrap** | `Bin2ShellPayload` struct, `bin2shell_payload` instance | Yes |
| **Encoder keys** | Any identifier ending in `_key`, `_nonce`, `_iv`, `_salt`, `_round` (matching length companion `_len` follows) | Yes |
| **Loop counters / local vars** | `i`, `j`, `S[…]`, etc. | No (kept stable to keep the source readable) |

Public stability is a hard guarantee: Washmachine's `CompilerService` and any third-party consumer can keep assuming the `code_blob` / `code_blob_len` symbols at file scope.

## CLI

```text
python main.py [--poly L] [--seed N] …
```

| Flag | Default | Description |
|---|---|---|
| `--poly L` | `1` | Polymorphism level: `0` off, `1` rename internals, `2` + reorder (planned), `3` + junk locals (planned) |
| `--seed N` | random (`os.urandom`) | Seed the polymorphism RNG. Accepts decimal or `0x…` hex. Same seed ⇒ identical output. |

Every generated file starts with a comment line echoing the seed:

```cpp
// bin2shell — generated with seed 0x000000000000cafe
```

That comment is enough to reproduce a specific build from its source.

## Reproducible builds

Use `--seed` whenever you need byte-identical output — CI golden snapshots, signed releases, or debugging a specific run:

```powershell
# Pin the run
python main.py -e 10 -v 2 --seed 0xCAFE payload.bin -o loader.cpp

# Rebuild — same identifiers, same encoder keys, same bytes
python main.py -e 10 -v 2 --seed 0xCAFE payload.bin -o loader.cpp
diff loader.cpp loader.cpp.first  # empty
```

Without `--seed`, every run draws fresh randomness from `os.urandom(8)`.

## What a rename looks like

Before (raw template output):

```cpp
unsigned char xor_key[] = { 0xd6, 0x73, /* … */ };
unsigned int xor_key_len = 16;

struct Bin2ShellPayload {
    unsigned char* code_blob;
    unsigned int code_blob_len;
};

static Bin2ShellPayload bin2shell_payload = []() {
    // … decode into enc_buf, then …
    unsigned char* code_blob = enc_buf;
    unsigned int code_blob_len = enc_len;
    return Bin2ShellPayload{code_blob, code_blob_len};
}();

unsigned char* code_blob = bin2shell_payload.code_blob;
unsigned int code_blob_len = bin2shell_payload.code_blob_len;
```

After `--poly 1`:

```cpp
unsigned char _k8ib40s[] = { 0xd6, 0x73, /* … */ };
unsigned int _k8ib40s_len = 16;

struct _b4a9wt {
    unsigned char* code_blob;
    unsigned int code_blob_len;
};

static _b4a9wt _bq62oq = []() {
    // … decode into _b3diuh0cx, then …
    unsigned char* code_blob = _b3diuh0cx;
    unsigned int code_blob_len = _bffurev6n;
    return _b4a9wt{code_blob, code_blob_len};
}();

unsigned char* code_blob = _bq62oq.code_blob;
unsigned int code_blob_len = _bq62oq.code_blob_len;
```

Note that `code_blob` and `code_blob_len` are intact — the renamer rewrites the *struct* type, the *instance* name, and the buffer/length variables, but keeps the file-scope public symbols stable.

## How identifiers are generated

```python
def _new_ident(rng, prefix="_v"):
    return prefix + "".join(rng.choices(_IDENT_CHARS, k=rng.randint(5, 8)))
```

- Always starts with an underscore so the result can never collide with a C++ keyword or Win32 public name.
- `_b…` for buffer/struct symbols, `_k…` for key/nonce/iv/salt symbols (the prefix is purely cosmetic).
- Length is random within 5–8 characters of `[a-z0-9]`.
- The whole sequence is RNG-driven, so a given seed reproduces the entire mapping.

## What polymorphism does NOT do

Polymorphism is a *naming* layer, not a *semantic* one. Specifically:

- It does not modify the encoder algorithm or the envelope decoder.
- It does not change loop structure, instruction order, or control flow.
- It does not insert dead code or opaque predicates — that's the job of the [LLVM obfuscation backend](/internals/llvm-backend), which operates one layer down on LLVM IR.

If you want CFG-level diversification on top of the symbol-level diversification, combine `bin2shell --seed …` with Washmachine's `encode --backend llvm --llvm-pass bcf,…` to get both: a fresh source on every build, then a fresh IR on every compile.

## Implementation reference

| File | Role |
|---|---|
| `bin2shell/polymorphism.py` | `Polymorphism` dataclass + `_new_ident` + `rename_internals` post-pass |
| `bin2shell/cli.py` `_emit_native()` | Applies the rename pass after section rendering, prepends the seed banner |
