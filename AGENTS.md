# AGENTS.md - AI Agent Documentation

This document provides guidance for AI agents working on the YAMLViz project.

## Project Overview

YAMLViz is a GitHub Actions Workflow Visualizer built as a monorepo using pnpm workspaces. It visualizes `.yaml` workflow files as interactive DAG graphs.

## Architecture

### Monorepo Structure

```
yamlviz-monorepo/
├── packages/
│   ├── core/              # Business logic: parsing, transformation, API
│   ├── ui/                # Presentation: React Flow components
│   ├── web-app/           # Application: Main web interface
│   └── vscode-extension/  # Integration: VS Code extension
└── [config files]
```

### Key Dependencies

* **yyjj**: Local YAML parser (linked from `../../../yyjj.mbt/`)
* **@xyflow/react**: Graph visualization
* **React 19**: UI framework
* **highlight.js**: YAML syntax highlighting

### Data Flow

1. User inputs YAML -> `parseYaml()` (yyjj) -> CST
2. CST -> `cstToJs()` -> JavaScript objects
3. Objects -> `transformWorkflowToGraph()` -> Graph nodes/edges
4. Graph -> `calculateLayout()` -> Positioned nodes
5. Nodes -> `WorkflowGraph` component -> React Flow rendering

## Common Tasks

### Adding a New Feature

1. Core logic: Add to `packages/core/src/`
2. UI components: Add to `packages/ui/src/`
3. Update exports in `index.ts` files
4. Test in web-app before integration

### Modifying Graph Layout

* Edit `packages/core/src/transformer.ts` - `calculateLayout()`
* Current: Topological sort, vertical layering

### Adding New Step Types

* Edit `packages/core/src/types.ts` - extend `Step` interface
* Update `packages/ui/src/StepDetailPanel.tsx` for rendering

## Important Constraints

* VS Code extension only works with `.yaml` extension (not `.yml`)
* yyjj must be available locally for parsing
* GitHub Pages base path: `/YAMLViz/`
* React Flow requires specific node/edge structures

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @yamlviz/core test
```

## Building

```bash
# Web app
pnpm --filter @yamlviz/web-app build

# VS Code extension
pnpm --filter yamlviz build
```

## Integration Points

### wrkflw CLI

Used by VS Code extension for:
* Validation: `wrkflw validate <file> --json`
* Execution: `wrkflw run <file>`

### GitHub API

* Endpoint: `https://api.github.com/repos/{owner}/{repo}`
* Rate limit: 60/hour (unauthenticated), 5000/hour (with token)
* Used for: Action metadata (description, stars)

## File Conventions

* TypeScript: `.ts` / `.tsx`
* Styles: Inline `style` props (no CSS modules)
* Components: PascalCase function exports
* Constants: UPPER_SNAKE_CASE or `const` objects
