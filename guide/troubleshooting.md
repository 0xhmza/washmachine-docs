# Troubleshooting

Common issues and their solutions.

## Compiler Not Found

**Symptom:** `washmachine-cli list compilers` returns empty or compile fails with "no compiler found."

**Cause:** MSVC or MinGW is not installed, or not discoverable on PATH.

**Solution:**
- Install Visual Studio 2022 with the **Desktop development with C++** workload, or
- Install MinGW-w64 and add its `bin/` directory to your system PATH
- Run `washmachine-cli list compilers` to verify detection

## YAML Catalog Missing

**Symptom:** Compile fails with a YAML-related error.

**Cause:** The `catalog.yaml` file is not in the expected location next to the executable.

**Solution:**
- Ensure `catalog.yaml` exists alongside `washmachine-cli.exe`
- If building from source, the build script copies it automatically — re-run `build.ps1`

## Bin2Shell Provision Failed

**Symptom:** `washmachine-cli provision` fails or encoders are unavailable.

**Cause:** Python 3.10+ not installed, no internet access, or permission issues.

**Solution:**
- Verify Python: `python --version` (must be 3.10+)
- Check internet connectivity (provision downloads from GitHub)
- Run as administrator if permission errors occur
- Re-run `washmachine-cli provision` after fixing

## Compilation Succeeds But Output Missing

**Symptom:** Compile reports success but no .exe found.

**Cause:** Output directory permissions or antivirus quarantine.

**Solution:**
- Check `%LOCALAPPDATA%\WashMachine\` for output files
- Check `build_log.txt` for compiler warnings
- Add the output directory to your antivirus exclusions
- See [Output & Artifacts](/guide/output) for directory details

## Backdoor Injection Fails

**Symptom:** Backdoor command exits with an error about code caves or sections.

**Cause:** The target PE doesn't have sufficient space for the chosen injection method.

**Solution:**
- Try a different method: `--method new-section` always works (adds a new section)
- Use `--method section-ext` as an alternative
- Run `analyze` first to check available code caves: `washmachine-cli analyze target.exe`
- See [Backdoor Reference](/cli/backdoor) for method details

## Test Harness Shows All Failures

**Symptom:** `test` command reports all samples as failed.

**Cause:** Samples are being detected/blocked by Windows Defender or other AV.

**Solution:**
- This is expected behavior for security testing — detections indicate the AV is working
- Disable real-time protection temporarily for controlled testing
- Use a dedicated VM for testing
- Review `test_results.json` for detailed per-sample results
