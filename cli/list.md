# `show`

Browse the playbook and runtime resources in a Metasploit-style catalog view: templates, snippet modules, encoders, envelopes, and discovered compilers. `list` is accepted as an alias.

```text
washmachine-cli show <target> [category]
```

## Targets

| Target | Aliases | Description |
|---|---|---|
| `all` | | Show encoders, envelopes, and modules in one combined pass |
| `encoders` | `--encoders` | Bin2Shell encoders (live from `algos.yaml` via `bin2shell -h`) |
| `envelopes` | `--envelopes` | Bin2Shell envelopes (live from `algos.yaml`) |
| `modules [category]` | | Snippet sections/items from the active playbook. Optional category filter (e.g. `anti_analysis`, `persistence`) |
| `templates` | `--templates` | C++ loader templates declared in `Assets/default.yaml` |
| `compilers` | `--compilers` | C/C++ toolchains discovered on this machine |
| `snippets` | `--snippets` | Alias for `modules` (legacy) |
| `execution` | | Shellcode-execution-only filter on `modules` |

## Compiler discovery order

When listing compilers, the discovery engine searches:

1. **Manual candidates** — user-registered paths (from previous `Locate…` prompts)
2. **Bundled tools** — `<app>/Tools/` (MinGW or LLVM if present)
3. **Environment variables** — `VCToolsInstallDir`, `VCINSTALLDIR`, `VSINSTALLDIR`
4. **Visual Studio installations** — VS 2022/2019/2017 (BuildTools, Community, Professional, Enterprise) via `vswhere.exe`
5. **System PATH** — `cl.exe`, `g++.exe`, `clang++.exe`

## Examples

### Combined module browser

```powershell
washmachine-cli show all
```

Prints encoders, envelopes, and every snippet module in one pass — useful when you're constructing an `encode` command and need to remember IDs.

### Filter modules by category

```powershell
washmachine-cli show modules anti_analysis
washmachine-cli show modules persistence
washmachine-cli show modules uacb
```

The category argument matches the snippet section's `template` key (e.g. `antianalysis`, `persistence`, `uacb`).

### Listing templates

```powershell
washmachine-cli show templates
```

Example output:

```text
Templates (7):
  ID              Description
  ──────────────────────────────────────────────────────────────
  default         Full-featured loader (all evasion + persistence)
  minimal         Bare-bones: shellcode source + persistence + execution
  minimal-dll    DLL with DllMain entry point
  paranoid        Defense-in-depth + watchdog
  aggressive      Active anti-analysis countermeasures
  stealth         Six-layer sequential defense
  sgncarrier      Carrier for an SGN-encoded payload (RWX)
```

### Listing compilers

```powershell
washmachine-cli show compilers
```

Example output:

```text
Discovered Compilers (3):
  Kind          Version              Path
  ──────────────────────────────────────────────────────────────
  cl.exe        14.42.34433          C:\Program Files\Microsoft Visual Studio\…\cl.exe
  clang++.exe   22.1.4               C:\…\Tools\LLVM\bin\clang++.exe
  g++.exe       13.2.0               C:\mingw64\bin\g++.exe
```

### Listing encoders / envelopes

```powershell
washmachine-cli show encoders
washmachine-cli show envelopes
```

These read live from Bin2Shell's `algos.yaml`, so any encoder or envelope you add to the catalog appears here without rebuilding washmachine. If the list is empty, run [`provision`](/cli/provision) — it means Bin2Shell isn't installed yet.

---

::: tip Related
- See [`encode`](/cli/compile) to feed the IDs you discovered here into a build.
- See [`provision`](/cli/provision) if `show encoders` returns empty.
- See [`doctor`](/cli/doctor) if `show compilers` returns empty.
- See the [Bin2Shell catalog](/bin2shell/encoders) for the full algorithm reference.
:::
