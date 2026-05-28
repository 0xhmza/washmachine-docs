# Setup

This guide covers installing Washmachine and validating the runtime environment with the new [`doctor`](/cli/doctor) preflight.

## Two ways to install

| Method | When to use |
|---|---|
| **MSI installer** | End-users + ship-to-customer scenarios. One-shot install that bundles LLVM + Bin2Shell next to the app. |
| **Build from source** | Contributors, custom playbooks, or anyone who wants to track `main`. |

## MSI installer

Grab `Washmachine-Setup-<version>.msi` from the Releases page. Double-click → next → next → done. The installer lays out:

```text
%ProgramFiles%\Washmachine\
├── washmachine.exe              GUI
├── washmachine-cli.exe          CLI
├── Assets\…                     Default playbook + LLVM pass plugins
└── Tools\
    ├── LLVM\bin\                clang++, clang-cl, lld-link, LLVM-C.dll
    └── Bin2Shell\               Python encoder/envelope/carrier engine
```

…plus two Start-Menu shortcuts. The installer is **perMachine** scope — you'll get a UAC prompt.

::: tip MSVC is not bundled
The MSI ships LLVM + Bin2Shell. MSVC's `cl.exe` (used by clang-cl as the sysroot) is the one prerequisite the installer doesn't carry — it's a 2 GB licence-sensitive download. `doctor` flags it as missing on first run and points you at [vs_BuildTools.exe](https://aka.ms/vs/17/release/vs_BuildTools.exe) with the *Desktop development with C++* workload selected.
:::

## Requirements

### CLI (`washmachine-cli`)

| Component | Version | Notes |
|---|---|---|
| OS | Windows 10 1809+ / Windows 11 | x64 only |
| .NET | 8.0 Runtime x64 | Required for CLI execution |
| **MSVC** | VS Build Tools 2019/2022 with C++ workload | Sysroot for clang-cl; checked by `doctor` |
| **LLVM** | 20+ (recommended 22+) | Bundled in the MSI; if installing from source, drop `clang++.exe` + `clang-cl.exe` under `Tools\LLVM\bin\` or onto PATH |
| Python | 3.10+ | Required for Bin2Shell encoding/envelope/carrier features |

### Desktop application (`washmachine`)

Same as the CLI, plus:

| Component | Version | Notes |
|---|---|---|
| .NET | 8.0 **Desktop** Runtime x64 | Required for WinUI 3 |
| Windows App SDK | 1.8 Runtime | Mica backdrop, NavigationView |

### LLVM version policy

Washmachine enforces a minimum LLVM major because the bundled obfuscation passes use new pass-manager APIs:

| Requirement | Value | Why |
|---|---|---|
| **Required minimum** | **20** | Bundled passes use new pass-manager APIs introduced in LLVM 16–20 |
| **Recommended** | **22** | Full obfuscation-pass API surface |

If you're below 20, `doctor` flags `INCOMPATIBLE` and the LLVM obfuscation backend is disabled. Other commands still work — see [LLVM Obfuscation Backend](/internals/llvm-backend) for full details.

## Build from source

```powershell
git clone https://github.com/0xhmza/washmachine.git
cd washmachine
.\build.ps1                    # Release build — clean by default
.\build.ps1 -SkipClean         # Incremental
.\build.ps1 -Launch            # Build + launch GUI
```

The solution builds three projects:

| Project | Output |
|---|---|
| `Washmachine.Core` | Shared class library (dependency of CLI and GUI) |
| `Washmachine.Cli` | `Output/Release/washmachine-cli.exe` |
| `washmachine` | `Output/Release/washmachine.exe` |

To ship: `.\publish.ps1 -Installer` builds the MSI under `Output/Release-Bundle/`. See [Build & Installer](/internals/build) for the full publish flow.

## Validate the installation

After installing, run the doctor:

```powershell
washmachine-cli doctor
```

You should see four `OK` rows. The same check runs at REPL startup with a condensed one-line summary.

::: tip Interactive REPL
Launch `washmachine-cli` without arguments to enter the interactive shell. The startup screen runs `provision → compiler discovery → doctor` before showing the banner, so you'll know immediately if anything is missing.
:::

Verify the playbook and discovered tools:

```powershell
washmachine-cli show templates
washmachine-cli show compilers
washmachine-cli show modules        # all snippet sections + items
washmachine-cli show encoders       # live from Bin2Shell
```

If `show compilers` is empty, fix MSVC; if `show encoders` is empty, run [`provision`](/cli/provision); if `doctor` says LLVM is `INCOMPATIBLE`, upgrade your LLVM install.
