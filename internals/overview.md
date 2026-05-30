# How Washmachine works

Washmachine takes a raw `.bin` of shellcode and turns it into a hardened Windows executable. Between those two artifacts sits a six-stage pipeline you can dial in stage by stage — encoding, template rendering, compilation, and post-processing — all driven by a single YAML playbook.

This page is the conceptual map. It explains *what each stage does* and *why it exists*, then points you at the deep-dives.

## The pipeline

![Washmachine compilation pipeline — six stages from raw shellcode to a hardened executable](/pipeline.svg)

Every `encode` run flows through the same six stages. Each stage is **optional except rendering and compilation** — you can run a minimal build with nothing but a template and a compiler, or stack the full chain for maximum diversification.

| # | Stage | What it does | Why it matters |
|---|---|---|---|
| 1 | **Source resolution** | Read shellcode from file, hex, or URL; auto-route managed PEs through Donut | One CLI surface, three input modes — including runtime HTTP fetch for staged payloads |
| 2 | **Encoding** | Bin2Shell encoder + envelope + optional carrier or web bundle | Per-build random keys mean every artifact has fresh ciphertext, fresh keys, fresh symbol names |
| 3 | **Template render** | Resolve the chosen template, substitute every `{{PLACEHOLDER}}` with selected snippets | Compose anti-debug, persistence, injection, and execution like Lego blocks |
| 4 | **Compiler discovery** | Find MSVC, GCC, or Clang in a deterministic search order | No PATH wrestling — Washmachine finds the toolchain and reports what it chose |
| 5 | **Compile & link** | Build with size-optimized flags; optionally route through clang-cl + LLVM IR pass plugins | LLVM backend adds bogus CFG, flattening, instruction substitution, string encryption at IR level |
| 6 | **Post-process** | Hash-name the output, optionally clone PE metadata from a donor binary | Predictable artifacts, signed-looking metadata, full session logs for audit |

→ Each stage is documented in detail in [Compilation Flow](/internals/compile-pipeline).

## The four pillars

Washmachine is organized around four things that compose:

### 1. The playbook

A single YAML file — `Assets/default.yaml` — that declares **every** template, snippet, and configurable input the loader supports. Want a new persistence technique? Add a snippet. Want a new template layout? Drop one in. No recompilation, no plugin SDK, no rebuild of the host app.

You can ship multiple playbooks side by side and switch between them from the GUI Settings page or the CLI. The schema lives at `Assets/playbook.schema.json` for IDE autocomplete.

→ [Playbook reference](/internals/yaml-catalog) · [Templates & snippets](/internals/template-engine)

### 2. The snippet sections

Twelve sections, each mapping to one `{{PLACEHOLDER}}` token in the template. Most are multi-select — pick all the anti-debug techniques you want and they all get inlined.

| Section | What it does |
|---|---|
| **Anti Emulation** | Stall or confuse AV emulators before payload runs |
| **Anti Analysis** | Detect and terminate analysis tools, unhook NTDLL |
| **Anti Debugging** | Detect active debuggers via PEB, NtGlobalFlag, timing, hardware breakpoints |
| **Anti Sandbox/VM** | Detect virtual environments via CPUID, MAC prefixes, registry, processes |
| **Guardrails** | Environment checks — domain, date, env vars, file existence |
| **Decoy** | Distraction actions (open Notepad, show a dialog) |
| **UAC Bypass** | Re-launch elevated without a UAC prompt |
| **Installation** | Copy loader to a stable directory **before** persistence registers it |
| **Persistence** | Register the loader with the OS for re-execution |
| **Evasion** | Defender exclusions applied to every tracked path |
| **Process Injection** | Inject shellcode into a remote process |
| **Shellcode Execution** | Execute shellcode in the current process |

The ordering inside the template is intentional — installation runs **before** persistence so Run keys point at the stable path, evasion runs **before** execution so exclusions are in place before the shellcode hits memory.

### 3. The templates

Seven templates ship out of the box. Each one declares which snippet sections are active and in what order — pick the right template for the threat model:

| Template | Designed for |
|---|---|
| `minimal` | Bare-bones loader — shellcode source + installation + persistence + execution, no evasion |
| `minimal-dll` | Same as `minimal` but with a `DllMain` entry point |
| `default` | Full-featured — every section active, balanced for general use |
| `paranoid` | Defense-in-depth with a continuous watchdog thread polling for debuggers |
| `aggressive` | Actively terminates analysis tools and debuggers |
| `stealth` | Six-layer sequential defense with delayed execution |
| `sgncarrier` | Shikata Ga Nai carrier with RWX allocation |

### 4. The compilers

Washmachine auto-discovers a compiler at build time and picks the right one for the job:

```
Tools/  →  Visual Studio (2017–2022)  →  env vars  →  PATH
```

You see what it found with `washmachine-cli show compilers`. For the LLVM backend, set `--backend llvm` and Washmachine routes the build through `clang-cl` (using the MSVC sysroot) with pass plugins loaded via `-fpass-plugin`.

## Features that make a difference

### Bin2Shell — encoding that doesn't look like encoding

The encoding stage is a complete pipeline of its own: **encoder → envelope → (carrier | embed | web bundle)**. Every modern encoder mints fresh random keys per build, and the polymorphism pass renames every internal identifier — so two runs of the same command produce different-looking source files.

Carriers go further: the encoded payload lives in a *valid* PNG, BMP, ICO, or INI file that the loader opens at runtime. The image opens correctly in any viewer; the INI parses cleanly. The payload hides in plain sight.

→ [Bin2Shell overview](/bin2shell/overview) · [Encoders & envelopes](/bin2shell/encoders) · [External carriers](/bin2shell/carriers) · [Polymorphism](/bin2shell/polymorphism)

### LLVM obfuscation — defense at the IR layer

When you flip `--backend llvm`, Washmachine routes compilation through `clang-cl` with four IR-level pass plugins:

- **Bogus control flow** — every safe basic block gets a junk twin guarded by an opaque-true predicate
- **Control-flow flattening** — restructures the CFG into a single `while(switch)` dispatch loop
- **Instruction substitution** — replaces arithmetic with mathematically equivalent expressions
- **String obfuscation** — encrypts string literals; the decryptor runs on first use

These run **after** every Bin2Shell transformation, so static signatures that survived the source layer have to also survive a transformed IR. The bundled MSI ships LLVM 22 — `doctor` verifies the version on every run.

→ [LLVM obfuscation backend](/internals/llvm-backend)

### PE analysis & injection — surgical, not blind

The `analyze` command produces a structured report covering everything the IAT, sections, code caves, TLS callbacks, and security flags can tell you about a binary — including a composite 0–100 security score and a per-method injection feasibility assessment.

The `backdoor` command then injects with awareness of what `analyze` found: five methods (code-cave, new-section, section-extension, text-pad, TLS callback) × three execution modes (normal, silence, dropper). Register-safe carrier stubs preserve flags, shadow space, and the original entry-point flow so the host stays functional.

→ [PE analysis](/internals/pe-analysis) · [PE injection](/internals/pe-injection)

### Polymorphism — every build is unique

The Bin2Shell polymorphism layer rewrites every internal identifier in the generated source to fresh `_b…` / `_k…` names. Combined with random-key encoders, the result is that two builds of the same exact CLI command produce different ciphertexts, different keys, *and* different symbol names.

Need a reproducible build for a golden snapshot? `--seed 0xCAFE` pins the RNG and gives you byte-identical output every time.

→ [Polymorphism](/bin2shell/polymorphism)

## Two front-ends, one engine

Both `washmachine-cli` and `washmachine` produce **identical** binaries because they share the same C++ core, the same playbook loader, and the same compilation pipeline. Pick the interface that fits your workflow.

### `washmachine-cli`

- **One-shot mode** — pass every option on the command line, get a build, exit
- **Interactive REPL** — tab completion, command history, Metasploit-style sub-shells per command
- **JSON output** — every command takes `--json` for CI/CD pipelines

### `washmachine` (desktop)

WinUI 3 app with page-based navigation:

| Page | Purpose |
|---|---|
| **Main** | Shellcode source selection — file, hex, or URL. Auto-detects .NET and shows conversion options |
| **Compile** | Template, snippet, and compilation configuration. Full LLVM backend toggle |
| **Backdoor** | PE injection with all 5 methods and 3 execution modes |
| **Settings** | Application preferences, session logging, active playbook selection |

## Where your artifacts go

Every build writes to predictable locations:

| Path | Contents |
|---|---|
| `temp/cpp/Compiled Binaries/` | Output `.exe` / `.dll`, named `YYYYMMDD_HHMMSS-<hash>.exe` |
| `logging/session_<ts>/source.cpp` | Rendered C++ source before compilation |
| `logging/session_<ts>/build_log.txt` | Full compiler output (stdout + stderr) |
| `logging/session_<ts>/session.json` | Build metadata: template, snippets, shellcode hash, output path |

→ [Output & artifacts](/guide/output)

## Where to next

| You want to… | Read this |
|---|---|
| Build your first loader end-to-end | [Setup](/guide/setup) → [First compilation](/guide/first-compile) |
| Understand every pipeline stage | [Compilation flow](/internals/compile-pipeline) |
| Customize templates and snippets | [Templates & snippets](/internals/template-engine) |
| Add new techniques or build a custom playbook | [Playbook reference](/internals/yaml-catalog) |
| Add LLVM IR-level obfuscation | [LLVM backend](/internals/llvm-backend) |
| Analyze or backdoor an existing PE | [PE analysis](/internals/pe-analysis) · [PE injection](/internals/pe-injection) |
| Encode payloads with Bin2Shell | [Bin2Shell overview](/bin2shell/overview) |
