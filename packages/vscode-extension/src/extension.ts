/**
 * YAMLViz VS Code Extension
 *
 * .yamlファイルを開いたときにGitHub Workflowを可視化
 */

import * as vscode from "vscode";
import * as cp from "child_process";
import { promisify } from "util";

const execAsync = promisify(cp.exec);

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("YAMLViz extension is now active!");

  // コマンド登録: グラフ表示
  const showGraphCommand = vscode.commands.registerCommand(
    "yamlviz.showGraph",
    () => {
      showWorkflowGraph();
    },
  );

  // コマンド登録: ワークフロー検証
  const validateWorkflowCommand = vscode.commands.registerCommand(
    "yamlviz.validateWorkflow",
    async () => {
      await validateWorkflow();
    },
  );

  // コマンド登録: ワークフロー実行
  const runWorkflowCommand = vscode.commands.registerCommand(
    "yamlviz.runWorkflow",
    () => {
      runWorkflow();
    },
  );

  context.subscriptions.push(showGraphCommand);
  context.subscriptions.push(validateWorkflowCommand);
  context.subscriptions.push(runWorkflowCommand);

  // アクティブエディタが変更されたときに自動表示（オプション）
  const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor && isYamlFile(editor.document)) {
        // 必要に応じて自動表示を有効化
        // showWorkflowGraph();
      }
    },
  );

  context.subscriptions.push(editorChangeListener);
}

/**
 * .yamlファイルかどうかを判定（.ymlは除外）
 */
function isYamlFile(document: vscode.TextDocument): boolean {
  return document.fileName.endsWith(".yaml") &&
    document.languageId === "yaml";
}

/**
 * 現在のエディタのYAMLをグラフとして表示
 */
function showWorkflowGraph() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  if (!isYamlFile(editor.document)) {
    vscode.window.showWarningMessage(
      "YAMLViz only works with .yaml files (not .yml)",
    );
    return;
  }

  const yamlContent = editor.document.getText();

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    currentPanel.webview.postMessage({ type: "update", yaml: yamlContent });
    return;
  }

  // Webviewパネルを作成
  currentPanel = vscode.window.createWebviewPanel(
    "yamlviz",
    "Workflow Graph",
    { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );

  // WebviewのHTMLを設定
  currentPanel.webview.html = getWebviewContent();

  // メッセージハンドラー
  currentPanel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.type) {
        case "ready":
          currentPanel?.webview.postMessage({
            type: "update",
            yaml: yamlContent,
          });
          break;
      }
    },
    undefined,
  );

  // パネルが閉じられたときのクリーンアップ
  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}

/**
 * WebviewのHTMLコンテンツを生成
 */
function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline';">
  <title>YAMLViz</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #root { height: 100%; }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748b;
      font-size: 14px;
    }
    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #ef4444;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root"><div class="loading">Loading YAMLViz...</div></div>
  <script>
    // VS Code Extension API用の簡易実装
    // Webview内で直接グラフを描画

    const vscode = acquireVsCodeApi();

    // 簡易YAMLパーサー（Webview内用）
    function parseSimpleYaml(input) {
      const lines = input.split('\\n');
      const result = {};
      const stack = [{ obj: result, indent: -1 }];

      for (const line of lines) {
        const indent = line.search(/\\S/);
        if (indent === -1) continue;

        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }

        const current = stack[stack.length - 1].obj;
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex === -1) continue;

        const key = trimmed.slice(0, colonIndex).trim();
        const valuePart = trimmed.slice(colonIndex + 1).trim();

        if (valuePart === '') {
          const newObj = {};
          current[key] = newObj;
          stack.push({ obj: newObj, indent });
        } else {
          current[key] = valuePart;
        }
      }

      return result;
    }

    // グラフ描画
    function renderGraph(yaml) {
      const parsed = parseSimpleYaml(yaml);
      const jobs = parsed.jobs || {};
      const jobEntries = Object.entries(jobs);

      if (jobEntries.length === 0) {
        document.getElementById('root').innerHTML = '<div class="error">No jobs found in workflow</div>';
        return;
      }

      // ノードとエッジを構築
      const nodes = [];
      const edges = [];

      jobEntries.forEach(([jobId, job]) => {
        const needs = job.needs || [];
        const stepCount = job.steps ? job.steps.length : 0;
        const name = job.name || jobId;
        const runsOn = Array.isArray(job.runs_on) ? job.runs_on[0] : job.runs_on;

        nodes.push({ id: jobId, name, runsOn, stepCount, needs: needs.join(', ') });

        needs.forEach((neededJob) => {
          edges.push({ from: neededJob, to: jobId });
        });
      });

      // トポロジカルソートでレイアウト
      const inDegree = new Map();
      const adjacency = new Map();

      nodes.forEach(n => {
        inDegree.set(n.id, 0);
        adjacency.set(n.id, []);
      });

      edges.forEach(e => {
        adjacency.get(e.from)?.push(e.to);
        inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      });

      const layers = [];
      const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);

      while (queue.length > 0) {
        layers.push([...queue]);
        const nextLayer = [];

        queue.forEach(nodeId => {
          adjacency.get(nodeId)?.forEach(target => {
            const newDegree = (inDegree.get(target) ?? 0) - 1;
            inDegree.set(target, newDegree);
            if (newDegree === 0) nextLayer.push(target);
          });
        });

        queue.length = 0;
        queue.push(...nextLayer);
      }

      // SVGで描画
      const nodeWidth = 180;
      const nodeHeight = 80;
      const horizontalGap = 60;
      const verticalGap = 40;

      const positions = new Map();
      layers.forEach((layer, layerIndex) => {
        const x = layerIndex * (nodeWidth + horizontalGap) + 20;
        const startY = -(layer.length - 1) * (nodeHeight + verticalGap) / 2 + 150;

        layer.forEach((nodeId, i) => {
          positions.set(nodeId, { x, y: startY + i * (nodeHeight + verticalGap) });
        });
      });

      let svg = \`<svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
        <style>
          .node-rect { fill: #1e293b; stroke: #3b82f6; stroke-width: 2; rx: 8; }
          .node-title { fill: #e2e8f0; font-size: 12px; font-weight: 600; }
          .node-detail { fill: #94a3b8; font-size: 10px; }
          .edge { stroke: #3b82f6; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
          .edge-label { fill: #3b82f6; font-size: 10px; }
        </style>
      \`;

      // エッジ
      edges.forEach(edge => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (from && to) {
          const x1 = from.x + nodeWidth;
          const y1 = from.y + nodeHeight / 2;
          const x2 = to.x;
          const y2 = to.y + nodeHeight / 2;
          svg += \`<line class="edge" x1="\${x1}" y1="\${y1}" x2="\${x2}" y2="\${y2}" />\`;
        }
      });

      // ノード
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (pos) {
          svg += \`<g transform="translate(\${pos.x}, \${pos.y})">
            <rect class="node-rect" width="\${nodeWidth}" height="\${nodeHeight}" />
            <text x="12" y="20" class="node-title">\${node.name}</text>
            <text x="12" y="38" class="node-detail">runs-on: \${node.runsOn}</text>
            <text x="12" y="52" class="node-detail">steps: \${node.stepCount}</text>
          </g>\`;
        }
      });

      svg += '</svg>';
      document.getElementById('root').innerHTML = svg;
    }

    // メッセージ受信
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'update') {
        renderGraph(message.yaml);
      }
    });

    // 準備完了通知
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

/**
 * ワークフロー検証（wrkflw CLIを使用）
 */
async function validateWorkflow(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  const filePath = editor.document.fileName;

  if (!filePath.endsWith(".yaml")) {
    vscode.window.showWarningMessage("Please open a .yaml file to validate");
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Validating workflow...",
      cancellable: false,
    },
    async () => {
      try {
        const { stdout } = await execAsync(`wrkflw validate "${filePath}" --json`);
        const results = JSON.parse(stdout);

        if (Array.isArray(results) && results.length === 1) {
          const [result] = results;
          if (result.isValid) {
            vscode.window.showInformationMessage("✅ Workflow is valid!");
          } else {
            const issues = result.issues || [];
            const message = `❌ Validation failed: ${issues.length} issue(s)`;
            vscode.window.showErrorMessage(message);
            issues.forEach((issue: any) => {
              vscode.window.showWarningMessage(`  - ${issue.message}`);
            });
          }
        }
      } catch (error: any) {
        const errorMessage = error.stderr || error.message || "Unknown error";
        if (errorMessage.includes("command not found") || errorMessage.includes("not found")) {
          vscode.window.showErrorMessage(
            "wrkflw CLI not found. Please install wrkflw: https://github.com/fu2hito/wrkflw"
          );
        } else {
          vscode.window.showErrorMessage(`Validation failed: ${errorMessage}`);
        }
      }
    }
  );
}

/**
 * ワークフロー実行（wrkflw CLIを使用）
 */
function runWorkflow(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  const filePath = editor.document.fileName;

  if (!filePath.endsWith(".yaml")) {
    vscode.window.showWarningMessage("Please open a .yaml file to run");
    return;
  }

  // 統合ターミナルでwrkflwを実行
  const terminal = vscode.window.createTerminal("wrkflw");
  terminal.sendText(`wrkflw run "${filePath}"`);
  terminal.show();
}

export function deactivate() {
  currentPanel?.dispose();
}
