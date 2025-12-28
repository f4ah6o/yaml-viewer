# YAMLViz

GitHub Actions Workflow Visualizer - `.yaml`ファイルをノードグラフとして可視化するツール

## Features

* **Workflow Visualization**: GitHub Actions WorkflowをDAGグラフとして可視化
* **Top-Bottom Layout**: 依存関係を上から下へレイアウト
* **Solarized Theme**: Dark/Lightテーマ切り替え（スムーズなトランジション）
* **Step Details**: クリックで各JobのStepsをモーダル表示
* **Syntax Highlight**: YAML入力にシンタックスハイライト

## Tech Stack

* **Parser**: 独自YAMLパーサー（将来的にyyjjへ移行予定）
* **Graph**: React Flow (@xyflow/react)
* **Formatter**: oxfmt
* **Linter**: oxlint
* **Build**: Vite (rolldown-vite)
* **Package Manager**: pnpm

## Packages

```
packages/
├── core/              # YAMLパーサー & グラフ変換
├── ui/                # React Flow コンポーネント
├── web-app/           # スタンドアロンWebアプリ
└── vscode-extension/  # VS Code拡張（.yamlのみアクティベート）
```

## Development

```bash
# Install
pnpm install

# Format
pnpm fmt

# Lint
pnpm lint

# Test
pnpm test

# Dev server (web-app)
pnpm --filter @yamlviz/web-app dev

# Build (web-app)
pnpm --filter @yamlviz/web-app build
```

## License

MIT
