# Washmachine Documentation

Modern VitePress documentation for [Washmachine](https://github.com/0xhmza/washmachine) - A CLI-first shellcode loader builder with WinUI 3 desktop app.

## Features

- 🎨 **Modern Cyberpunk Theme** - Neon colors, acrylic effects, and futuristic design
- 🚀 **VitePress Powered** - Fast, SEO-friendly static site generation
- 🔍 **Built-in Search** - Quick navigation through documentation
- 📱 **Fully Responsive** - Works perfectly on all devices
- ⚡ **Blazing Fast** - Optimized performance with Vite

## Development

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

The development server will be available at `http://localhost:5173`.

## Deployment

This documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

```bash
# Build the documentation
npm run docs:build

# The built files will be in docs/.vitepress/dist
```

## Documentation Structure

```
docs/
├── .vitepress/
│   ├── config.mts          # VitePress configuration
│   └── theme/
│       ├── index.ts        # Theme entry
│       └── custom.css      # Cyberpunk theme styles
├── index.md                # Home page
├── getting-started.md      # Installation and setup guide
├── cli-reference.md        # CLI command reference
└── architecture.md         # Architecture documentation
```

## Theme Customization

The cyberpunk theme features:

- **Neon color palette** - Cyan, pink, purple accents
- **Acrylic glass effects** - Frosted glass navigation and sidebar
- **Modern fonts** - Inter for UI, JetBrains Mono for code
- **Smooth animations** - Neon glow effects and transitions
- **Dark mode optimized** - Easy on the eyes

To customize the theme, edit `docs/.vitepress/theme/custom.css`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This documentation is part of the Washmachine project.

**For educational and authorized security testing purposes only.**
