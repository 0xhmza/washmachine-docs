# `provision`

Download and install the external tools Washmachine relies on.

```text
washmachine-cli provision [--core-only]
```

## Options

| Option | Description |
|---|---|
| `--core-only` | Only fetch required dependencies (Bin2Shell). Skip optional tools. |

## Tools provisioned

| Tool | Required | Source | Installed to |
|---|---|---|---|
| **Bin2Shell** | Yes | `github.com/0xhmza/bin2shell` (main/master branch zip) | `Tools/Bin2Shell/` |
| **SGN** | Optional | `github.com/EgeBalci/sgn` v2.0.1 release | `Tools/SGN/` |
| **Donut** | Optional | `github.com/TheWover/donut` v1.1 release | `Tools/Donut/` |

After Bin2Shell extraction the algorithm descriptions in `algos.yaml` are patched in-place if missing. A progress bar shows download and install status for each tool.

::: tip When to use `--core-only`
SGN and Donut are only needed for specific workflows:

- **SGN** — post-encoding shellcode obfuscation (Shikata Ga Nai) used by the GUI's payload encoding stage and the optional encoder pipeline.
- **Donut** — converting managed (.NET) assemblies to position-independent shellcode. The desktop client invokes donut automatically when a `.exe` source is detected as a managed assembly.

Use `--core-only` on cross-platform builds, in CI, or whenever you manage SGN/Donut yourself.
:::

## Re-provisioning

Running `provision` again overwrites any tool whose target directory already exists, using a rename-aside strategy that is safe even when files are held open by antivirus or the search indexer. Custom user data outside the `Tools/<name>/` directories is not touched.

## Error scenarios

| Scenario | Error message | Solution |
|---|---|---|
| Python not installed | `Python 3.10+ is required` | Install Python 3.10 or later and ensure `python` is on your PATH |
| Network failure | `Failed to download from GitHub` | Check internet connectivity; the command downloads release archives from GitHub |
| Permission denied | `Access denied` writing to `Tools/` | Run the command with elevated privileges or check folder permissions |
| Target directory locked | `Target directory is locked — falling back to in-place copy` | Close any process holding files in `Tools/<name>/` (often a running washmachine instance or AV scanner) and re-run |

## Verification

After provisioning, confirm success by listing available encoders:

```powershell
washmachine-cli list encoders
```

If encoders are listed, Bin2Shell is wired up correctly. If the list is empty, check:

1. The `Tools/Bin2Shell/` directory exists and contains Python files
2. Python 3.10+ is accessible: `python --version`
3. Re-run `washmachine-cli provision` and watch for error messages

## Examples

```powershell
# Full provision: Bin2Shell + SGN + Donut
washmachine-cli provision

# Required dependencies only (CI-friendly)
washmachine-cli provision --core-only
```

::: tip Bin2Shell details
For details on Bin2Shell capabilities, see [Bin2Shell Overview](/bin2shell/overview).
:::
