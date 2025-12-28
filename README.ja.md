# YAMLViz

GitHub Actions Workflow Visualizer - `.yaml`ファイルをノードグラフとして可視化するツール

[English](./README.md)

## 機能

### コア可視化

* **ワークフロー可視化**: GitHub Actions WorkflowをDAGグラフとしてレンダリング
* **トップボトムレイアウト**: 依存関係のフローに従った自動レイアウト
* **インタラクティブノード**: クリックでジョブ詳細とステップを表示
* **リアルタイム更新**: YAML編集時にグラフが即座に更新

### YAMLエディタ

* **シンタックスハイライト**: highlight.jsによるYAML入力の構文強調
* **ファイル読み込み**: ローカルの.yaml/.ymlファイルを開いて可視化
* **サンプルワークフロー**: クイックスタート用のビルトイン例

### GitHub連携

* **アクションメタデータ**: GitHubからアクション詳細を取得（説明、スター、バージョン）
* **GitHub Token対応**: トークン設定でAPIレート制限を緩和（60/時 → 5000/時）
* **アクションキャッシュ**: メタデータをキャッシュしてAPI呼び出しを削減

### UI/UX

* **Solarizedテーマ**: ダーク/ライトテーマをスムーズに切り替え
* **ステップ詳細モーダル**: ジョブクリックで詳細なステップ情報を表示
* **バリデーションパネル**: ワークフローの検証結果を表示（wrkflw CLI統合）
* **実行パネル**: ワークフロー実行状況をモニタリング

### VS Code拡張機能

* **エディタコマンド**: グラフ表示、検証、実行をエディタから実行
* **コンテキストメニュー統合**: .yamlファイルで右クリックしてコマンドにアクセス
* **wrkflw CLI統合**: ローカルでのワークフロー検証と実行

## 技術スタック

* **フロントエンド**: React 19.1.0 + Vite
* **グラフ**: React Flow (@xyflow/react) v12.4.4
* **パーサー**: yyjj (YAML解析用ローカルリンクパッケージ)
* **シンタックスハイライト**: highlight.js
* **フォーマッター**: oxfmt
* **リンター**: oxlint
* **テストランナー**: vitest
* **パッケージマネージャー**: pnpm workspace

## パッケージ構成

```
packages/
├── core/              # YAMLパーサー & グラフ変換
├── ui/                # React Flowコンポーネント
├── web-app/           # スタンドアロンWebアプリ（GitHub Pages）
└── vscode-extension/  # VS Code拡張機能
```

## 開発

### 前提条件

* Node.js 22+
* pnpm 9.15.0+
* yyjjライブラリ（../../../yyjj.mbt/からリンク）

### インストール

```bash
pnpm install
```

### コマンド

```bash
# コードフォーマット
pnpm fmt

# リント
pnpm lint

# テスト実行
pnpm test

# 開発サーバー（web-app）
pnpm --filter @yamlviz/web-app dev

# ビルド（web-app）
pnpm --filter @yamlviz/web-app build
```

## デプロイ

Webアプリはmainブランチへのプッシュ時にGitHub Pagesへ自動デプロイされます。

## ライセンス

MIT
