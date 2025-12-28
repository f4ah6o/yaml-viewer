# YAMLViz

GitHub Actions Workflow Visualizer - Visualize workflow YAML files as node graphs

[日本語](./README.ja.md)

## Features

### Core Visualization

* **Workflow Visualization**: Render GitHub Actions Workflows as DAG graphs
* **Top-Bottom Layout**: Automatic topological layout with dependency flow
* **Interactive Nodes**: Click to view job details and steps
* **Real-time Updates**: Graph updates instantly as you edit YAML

### YAML Editor

* **Syntax Highlight**: YAML input with syntax highlighting (powered by highlight.js)
* **File Loading**: Open and visualize local .yaml/.yml files
* **Sample Workflow**: Built-in example for quick start

### GitHub Integration

* **Action Metadata**: Fetch action details from GitHub (description, stars, version)
* **GitHub Token Support**: Set token for higher API rate limits (60/h -> 5000/h)
* **Action Caching**: Metadata cached to reduce API calls

### UI/UX

* **Solarized Theme**: Dark/Light themes with smooth transitions
* **Step Details Modal**: Click jobs to view detailed step information
* **Validation Panel**: Display workflow validation issues (wrkflw CLI integration)
* **Execution Panel**: Monitor workflow execution status

### VS Code Extension

* **Editor Commands**: Show graph, validate, and run workflows from editor
* **Context Menu Integration**: Right-click on .yaml files to access commands
* **wrkflw CLI Integration**: Validate and execute workflows locally

## Tech Stack

* **Frontend**: React 19.1.0 + Vite
* **Graph**: React Flow (@xyflow/react) v12.4.4
* **Parser**: yyjj (local linked package for YAML parsing)
* **Syntax Highlighting**: highlight.js
* **Formatter**: oxfmt
* **Linter**: oxlint
* **Test Runner**: vitest
* **Package Manager**: pnpm workspace

## Packages

```
packages/
├── core/              # YAML parser & graph transformation
├── ui/                # React Flow components
├── web-app/           # Standalone web app (GitHub Pages)
└── vscode-extension/  # VS Code extension
```

## Development

### Prerequisites

* Node.js 22+
* pnpm 9.15.0+
* yyjj library (linked from ../../../yyjj.mbt/)

### Installation

```bash
pnpm install
```

### Commands

```bash
# Format code
pnpm fmt

# Lint code
pnpm lint

# Run tests
pnpm test

# Dev server (web-app)
pnpm --filter @yamlviz/web-app dev

# Build (web-app)
pnpm --filter @yamlviz/web-app build
```

## Deployment

Web app is automatically deployed to GitHub Pages on push to main branch.

## License

MIT
