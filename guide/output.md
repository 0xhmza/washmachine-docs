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

## Settings

Application settings persist as JSON at `%LOCALAPPDATA%/washmachine/settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `sessionLoggingEnabled` | bool | `true` | Write session logs for compile/backdoor operations |
| `saveBinaryArtifact` | bool | `true` | Copy compiled binaries to session directory |
| `saveShellcodeCopy` | bool | `true` | Copy input shellcode to session directory |
| `verboseFileLogging` | bool | `false` | Include debug-level messages in file logs |
