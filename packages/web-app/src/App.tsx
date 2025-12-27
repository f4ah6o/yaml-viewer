import { useState } from "react";
import { WorkflowGraph } from "@yamlviz/ui";
import { yamlToGraph } from "@yamlviz/core";

const SAMPLE_YAML = `name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run lint
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm deploy
`;

export function App() {
  const [yaml, setYaml] = useState(SAMPLE_YAML);
  const [error, setError] = useState<string | null>(null);

  const graph = yamlToGraph(yaml);

  const handleYamlChange = (value: string) => {
    setYaml(value);
    setError(null);
  };

  const handleFileLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYaml(content);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "12px 20px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", color: "#f1f5f9" }}>
          YAMLViz - GitHub Workflow Visualizer
        </h1>
        <label>
          <input
            type="file"
            accept=".yaml,.yml"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileLoad(file);
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Open YAML
          </button>
        </label>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            width: "400px",
            borderRight: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#0f172a",
              borderBottom: "1px solid #334155",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            YAML Input
          </div>
          <textarea
            value={yaml}
            onChange={(e) => handleYamlChange(e.target.value)}
            style={{
              flex: 1,
              padding: "16px",
              border: "none",
              background: "#0f172a",
              color: "#e2e8f0",
              fontFamily: "ui-monospace, monospace",
              fontSize: "13px",
              resize: "none",
              outline: "none",
            }}
            placeholder="Paste your GitHub Workflow YAML here..."
          />
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          {error ? (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "20px",
                background: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #ef4444",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          ) : graph && graph.nodes.length > 0 ? (
            <WorkflowGraph graph={graph} />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Enter a valid GitHub Workflow YAML to visualize
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
