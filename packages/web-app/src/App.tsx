import { useState, useEffect, useRef, useCallback } from "react";
import { WorkflowGraph } from "@yamlviz/ui";
import { yamlToGraph } from "@yamlviz/core";
import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/github.css";

hljs.registerLanguage("yaml", yaml);

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

function highlightYaml(code: string): string {
  return hljs.highlight(code, { language: "yaml" }).value;
}

export function App() {
  const [yaml, setYaml] = useState(SAMPLE_YAML);
  const [error, setError] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const graph = yamlToGraph(yaml);

  useEffect(() => {
    setHighlighted(highlightYaml(yaml));
  }, []);

  useEffect(() => {
    setHighlighted(highlightYaml(yaml));
  }, [yaml]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

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
          background: "#f6f8fa",
          borderBottom: "1px solid #d0d7de",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", color: "#24292f" }}>
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
              const input = document.querySelector(
                'input[type="file"]',
              ) as HTMLInputElement;
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
            borderRight: "1px solid #d0d7de",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#f6f8fa",
              borderBottom: "1px solid #d0d7de",
              fontSize: "12px",
              color: "#57606a",
            }}
          >
            YAML Input
          </div>
          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <pre
              ref={preRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 0,
                padding: "16px",
                background: "#ffffff",
                pointerEvents: "none",
                overflow: "auto",
              }}
            >
              <code
                style={{ fontFamily: "ui-monospace, monospace", fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
            <textarea
              ref={textareaRef}
              value={yaml}
              onChange={(e) => handleYamlChange(e.target.value)}
              onScroll={handleScroll}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                padding: "16px",
                border: "none",
                background: "transparent",
                color: "transparent",
                caretColor: "#24292f",
                fontFamily: "ui-monospace, monospace",
                fontSize: "13px",
                lineHeight: "1.5",
                resize: "none",
                outline: "none",
                overflow: "auto",
                whiteSpace: "pre",
              }}
              placeholder="Paste your GitHub Workflow YAML here..."
            />
          </div>
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
