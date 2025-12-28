# YAMLViz - Development Guidelines

This file contains project-specific guidelines for YAMLViz development.

## Tech Stack Summary

* **Frontend**: React 19.1.0 + Vite 6.0.11
* **Graph**: @xyflow/react 12.4.4
* **YAML Parser**: yyjj (linked locally)
* **Package Manager**: pnpm workspace

## Commands

```bash
# Install dependencies
pnpm install

# Format (oxfmt)
pnpm fmt

# Lint (oxlint)
pnpm lint

# Test (vitest)
pnpm test

# Dev server
pnpm --filter @yamlviz/web-app dev

# Build
pnpm --filter @yamlviz/web-app build
```

## Project Structure

```
packages/
├── core/              # YAML parsing (yyjj), graph transformation, GitHub API
├── ui/                # React Flow components (JobNode, WorkflowGraph, panels)
├── web-app/           # Standalone app (main.tsx, App.tsx)
└── vscode-extension/  # VS Code integration (extension.ts)
```

## Important Notes

* yyjj library is linked from `../../../yyjj.mbt/` - ensure it exists before development
* VS Code extension only activates for `.yaml` files (not `.yml`)
* GitHub Pages deployment path: `/YAMLViz/` (configured in vite.config.ts)
