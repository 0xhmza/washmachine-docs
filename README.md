

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
├── getting-started.md
├── cli-reference.md
├── architecture.md
└── .github/workflows/deploy.yml
```
