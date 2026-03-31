# `provision`

Download and install required external tools. Currently provisions the Bin2Shell Python tool from GitHub.

```text
washmachine-cli provision
```

The command downloads from `https://github.com/0xhmza/bin2shell`, extracts to `Tools/Bin2Shell/`, and patches algorithm descriptions into `algos.yaml` if missing. A progress bar displays download and installation status.

## Re-provisioning

If Bin2Shell is already installed, running `provision` again will **overwrite** the existing installation with a fresh download. This is useful for updating to the latest version or repairing a broken install. Your custom configuration is not affected — only the `Tools/Bin2Shell/` directory is replaced.

## Error scenarios

| Scenario | Error message | Solution |
|---|---|---|
| Python not installed | `Python 3.10+ is required` | Install Python 3.10 or later and ensure `python` is on your PATH |
| Network failure | `Failed to download from GitHub` | Check internet connectivity; the command downloads a release archive from GitHub |
| Permission denied | `Access denied` writing to `Tools/` | Run the command with elevated privileges or check folder permissions |

## Verification

After provisioning, confirm success by listing available encoders:

```powershell
washmachine-cli list encoders
```

If encoders are listed, provisioning succeeded. If the list is empty, check:

1. The `Tools/Bin2Shell/` directory exists and contains Python files
2. Python 3.10+ is accessible: `python --version`
3. Re-run `washmachine-cli provision` and watch for error messages

## Example

```powershell
washmachine-cli provision
```

::: tip Bin2Shell details
For details on Bin2Shell capabilities, see [Bin2Shell Overview](/bin2shell/overview).
:::
