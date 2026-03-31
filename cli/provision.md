# `provision`

Download and install required external tools. Currently provisions the Bin2Shell Python tool from GitHub.

```text
washmachine-cli provision
```

The command downloads from `https://github.com/0xhmza/bin2shell`, extracts to `Tools/Bin2Shell/`, and patches algorithm descriptions into `algos.yaml` if missing. A progress bar displays download and installation status.

## Example

```powershell
washmachine-cli provision
```

After provisioning, verify:

```powershell
washmachine-cli list encoders
```
