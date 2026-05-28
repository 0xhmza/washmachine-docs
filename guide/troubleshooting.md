# Troubleshooting

When something looks wrong, **start with `doctor`** — it's the single command that diagnoses every external-tool problem in one pass.

```powershell
washmachine-cli doctor
```

Four rows; anything that isn't `OK` has a remediation hint in the Detail column. See [doctor](/cli/doctor) for the full reference.

## `doctor` says LLVM is `INCOMPATIBLE`

**Symptom:** `LLVM clang++` row reads `Version 18.x is below the required minimum 20`.

**Cause:** The bundled obfuscation passes need pass-manager APIs introduced in LLVM 20.

**Solution:** Upgrade your LLVM install. Three convenient routes:

- **MSI install** — re-run the Washmachine installer; the bundle ships LLVM 22 under `Tools\LLVM\bin\`
- **Scoop** — `scoop install llvm` (ships dev headers + binaries)
- **Manual** — drop a recent `clang++.exe` + `clang-cl.exe` under `Tools\LLVM\bin\` next to the exe, or onto PATH

The LLVM obfuscation backend is the only feature that requires LLVM 20+. Everything else (analyze, strip, backdoor, encode-without-`--backend llvm`) continues to work below that minimum.

## `doctor` says MSVC is `MISSING`

**Symptom:** `MSVC cl.exe` row reads `Visual Studio Build Tools (cl.exe) not detected`.

**Cause:** Washmachine searched the VS installer, `VCToolsInstallDir`, and PATH but found nothing.

**Solution:** Install [vs_BuildTools.exe](https://aka.ms/vs/17/release/vs_BuildTools.exe) with the **Desktop development with C++** workload. Then re-run `doctor`.

The MSI doesn't bundle MSVC (~2 GB, licence-sensitive); this is the one prerequisite the installer leaves to you.

## `doctor` says Bin2Shell is `MISSING`

**Symptom:** `Bin2Shell` row reads `main.py not found at Tools\Bin2Shell\main.py`.

**Cause:** Bin2Shell hasn't been provisioned yet.

**Solution:**

```powershell
washmachine-cli provision
```

Provision downloads Bin2Shell from GitHub into `Tools\Bin2Shell\` and installs the algorithm catalog. If `provision` fails:

- Verify Python 3.10+: `python --version`
- Check internet connectivity (provision downloads release archives from GitHub)
- Re-run with elevated privileges if writing to `Tools\` fails

See [`provision`](/cli/provision) for the full reference.

## Playbook missing

**Symptom:** `encode` fails with `Playbook missing: 'Assets/default.yaml'`.

**Cause:** `Assets/default.yaml` is not in the expected location next to the executable.

**Solution:**

- Ensure `Assets/default.yaml` exists alongside `washmachine-cli.exe` / `washmachine.exe`
- If building from source, the build script copies it automatically — re-run `build.ps1`
- If using a custom playbook, drop it into `Assets/` and select it through the GUI Settings page

## Compilation succeeds but output missing

**Symptom:** Encode reports success but no `.exe` found.

**Cause:** Output directory permissions or antivirus quarantine.

**Solution:**

- Check `%LOCALAPPDATA%\WashMachine\` for output files
- Check `build_log.txt` in the session directory for compiler warnings
- Add the output directory to your antivirus exclusions
- See [Output & Artifacts](/guide/output) for directory details

## Backdoor injection fails

**Symptom:** `backdoor` exits with an error about code caves or sections.

**Cause:** The target PE doesn't have sufficient space for the chosen injection method.

**Solution:**

- Try a different method: `--method new-section` always works (adds a new section)
- Use `--method section-ext` or `--method text-pad` as alternatives
- `--method tls-callback` runs before `main()` (x64 only) and doesn't need cave space
- Run `analyze` first to check available code caves: `washmachine-cli analyze target.exe`
- See [Backdoor Reference](/cli/backdoor) for method details

## Carrier-mode loader can't find its file

**Symptom:** Bin2Shell-generated loader (built with `--carrier`) throws `Cannot open carrier file` at runtime.

**Cause:** The default `--carrier-runtime-path` is just the basename — the loader expects the carrier file to sit alongside it on disk.

**Solution:**

- Deploy the `.png` / `.bmp` / `.ico` / `.ini` carrier file next to the loader binary, or
- Re-build with an absolute path: `--carrier-runtime-path '"C:/ProgramData/MyApp/icon.png"'`

See [Carriers](/bin2shell/carriers) for details.

## Test harness shows all failures

**Symptom:** `test` command reports all samples as failed.

**Cause:** Samples are being detected/blocked by Windows Defender or other AV.

**Solution:**

- This is expected behavior for security testing — detections indicate the AV is working
- Disable real-time protection temporarily for controlled testing
- Use a dedicated VM for testing
- Review `test_results.json` for detailed per-sample results
