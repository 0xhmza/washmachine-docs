

# Washmachine Documentation

VitePress documentation for [Washmachine](https://github.com/0xhmza/washmachine).

## Local development

```bash
npm install
npm run docs:dev
```

## Build

```bash
npm run docs:build
npm run docs:preview
```

Build output is generated in `.vitepress/dist`.

## Structure

```text
.
├── .vitepress/
│   ├── config.mts
│   └── theme/
│       ├── index.ts
│       └── custom.css
├── index.md
├── guide/
│   ├── setup.md              # Prerequisites and installation
│   ├── first-compile.md      # Walk-through of your first build
│   ├── output.md             # Output paths and artifact reference
│   ├── testing.md            # Automated test harness usage
│   └── troubleshooting.md    # Common issues and solutions
├── cli/
│   ├── overview.md            # CLI quick-start and global options
│   ├── compile.md             # compile command reference
│   ├── analyze.md             # analyze command reference
│   ├── strip.md               # strip (shellcode extraction) reference
│   ├── backdoor.md            # backdoor (PE injection) reference
│   ├── list.md                # list runtime resources
│   ├── provision.md           # provision external tools (Bin2Shell)
│   └── test.md                # test harness command reference
├── internals/
│   ├── overview.md            # Architecture and project layout
│   ├── yaml-catalog.md        # YAML catalog schema and loading
│   ├── compile-pipeline.md    # End-to-end compilation pipeline
│   ├── pe-analysis.md         # PE analysis engine internals
│   ├── pe-injection.md        # PE injection methods
│   └── build.md               # Build scripts and packaging
├── bin2shell/
│   ├── overview.md            # Bin2Shell encoder/envelope overview
│   ├── integration.md         # Integration with Washmachine CLI
│   └── advanced.md            # Web mode and security considerations
├── public/
└── .github/workflows/
```
