# Output & Artifacts

After running compile or backdoor commands, artifacts are written to predictable locations.

## Output paths

| Path | Content |
|---|---|
| `temp/cpp/Compiled Binaries/` | Named output binaries (`YYYYMMDD_HHMMSS-<hash>.exe`) |
| `logging/session_<timestamp>_<guid>/source.cpp` | Final rendered C++ source code |
| `logging/session_<timestamp>_<guid>/build_log.txt` | Compiler stdout/stderr capture |
| `logging/backdoor_<timestamp>_<guid>/log.txt` | Full backdoor operation audit trail |
| `test_results.json` | Test harness summary |

## Understanding each artifact

### `source.cpp` — Generated C++ source

This file contains the fully rendered C++ code that was fed to the compiler. It includes all resolved template placeholders, snippet insertions, shellcode byte arrays, and `#include` directives. Reviewing this file is useful when you need to understand exactly what code was compiled — for example, to verify that a specific evasion snippet was applied or to debug compilation errors.

### `build_log.txt` — Compiler output

This file captures the complete stdout and stderr output from the compiler process (MSVC `cl.exe`, GCC `g++.exe`, or Clang `clang++.exe`). It contains compiler warnings, errors, and linker messages. When a compilation fails, this is the first file to check — it will show the exact error and line number in the generated source.

### Compiled `.exe` — Final binary

The output binary is named using a `YYYYMMDD_HHMMSS-<sha256[0:5]>.exe` pattern and placed in `temp/cpp/Compiled Binaries/`. This is the shellcode loader executable ready for deployment or testing. If the template uses `DllMain`, the output will be a `.dll` instead.

## Navigating to the output directory

On Windows, application data and settings are stored under the local app data folder. Open it with:

```powershell
explorer "%LOCALAPPDATA%\WashMachine\"
```

Or navigate manually: press <kbd>Win+R</kbd>, type `%LOCALAPPDATA%\WashMachine\`, and press Enter. The `logging/` subdirectory contains per-session artifacts, while compiled binaries are in `temp/cpp/Compiled Binaries/`.

## Settings

Application settings persist as JSON at `%LOCALAPPDATA%/washmachine/settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `sessionLoggingEnabled` | bool | `true` | Write session logs for compile/backdoor operations |
| `saveBinaryArtifact` | bool | `true` | Copy compiled binaries to session directory |
| `saveShellcodeCopy` | bool | `true` | Copy input shellcode to session directory |
| `verboseFileLogging` | bool | `false` | Include debug-level messages in file logs |

## Troubleshooting missing artifacts

If you expect output files but cannot find them:

1. **Compilation failed** — Check `build_log.txt` in the session directory for compiler errors. Common causes include missing libraries or syntax errors in custom snippets.
2. **Session logging disabled** — Verify that `sessionLoggingEnabled` is `true` in `settings.json`. When disabled, no session directory is created.
3. **Binary not saved** — If `saveBinaryArtifact` is `false`, the compiled binary is only in the `temp/cpp/Compiled Binaries/` directory and not copied to the session folder.
4. **Antivirus quarantine** — Windows Defender or other AV software may quarantine the output binary. Check your AV quarantine log and add the output directory to exclusions.
5. **Output directory permissions** — Ensure the current user has write access to `%LOCALAPPDATA%\WashMachine\`.

::: tip Next step
See [Testing](/guide/testing) for validating your compiled artifacts.
:::
