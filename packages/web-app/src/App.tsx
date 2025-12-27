import { useState, useEffect, useRef, useCallback } from "react";
import { WorkflowGraph } from "@yamlviz/ui";
import { yamlToGraph } from "@yamlviz/core";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/github-dark.css";
import "./App.css";

hljs.registerLanguage("yaml", yamlLang);

type Theme = "dark" | "light";

const THEME_STYLES = {
  dark: {
    bg: "#002b36",
    headerBg: "#073642",
    headerText: "#839496",
    border: "#586e75",
    inputBg: "#002b36",
    inputText: "#839496",
    caret: "#839496",
    placeholder: "#586e75",
  },
  light: {
    bg: "#fdf6e3",
    headerBg: "#eee8d5",
    headerText: "#657b83",
    border: "#93a1a1",
    inputBg: "#fdf6e3",
    inputText: "#657b83",
    caret: "#657b83",
    placeholder: "#93a1a1",
  },
};

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
  const [theme, setTheme] = useState<Theme>("dark");
  const [error, setError] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const graph = yamlToGraph(yaml);
  const styles = THEME_STYLES[theme];

  // テーマ切り替え時にdocumentにクラスを追加
  useEffect(() => {
    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: styles.bg, transition: "background 0.3s ease" }}>
      <header
        style={{
          padding: "12px 20px",
          background: styles.headerBg,
          borderBottom: `1px solid ${styles.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", color: styles.headerText, transition: "color 0.3s ease" }}>
          YAMLViz - GitHub Workflow Visualizer
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: `1px solid ${styles.border}`,
              background: styles.bg,
              color: styles.headerText,
              cursor: "pointer",
              fontSize: "14px",
              transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
            }}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
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
                background: theme === "dark" ? "#2aa198" : "#268bd2",
                color: theme === "dark" ? "#fdf6e3" : "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.3s ease",
              }}
            >
              Open YAML
            </button>
          </label>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            width: "400px",
            borderRight: `1px solid ${styles.border}`,
            display: "flex",
            flexDirection: "column",
            transition: "border-color 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: styles.headerBg,
              borderBottom: `1px solid ${styles.border}`,
              fontSize: "12px",
              color: styles.inputText,
              transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
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
                background: styles.inputBg,
                pointerEvents: "none",
                overflow: "auto",
                transition: "background 0.3s ease",
              }}
            >
              <code
                style={{ fontFamily: "ui-monospace, monospace", fontSize: "13px", color: styles.inputText }}
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
                caretColor: styles.caret,
                fontFamily: "ui-monospace, monospace",
                fontSize: "13px",
                lineHeight: "1.5",
                resize: "none",
                outline: "none",
                overflow: "auto",
                whiteSpace: "pre",
                transition: "caret-color 0.3s ease",
              }}
              placeholder="Paste your GitHub Workflow YAML here..."
            />
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", background: styles.bg, transition: "background 0.3s ease" }}>
          {error ? (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "20px",
                background: styles.headerBg,
                borderRadius: "8px",
                border: "1px solid #dc322f",
                color: "#dc322f",
                transition: "background 0.3s ease",
              }}
            >
              {error}
            </div>
          ) : graph && graph.nodes.length > 0 ? (
            <WorkflowGraph graph={graph} theme={theme} />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: styles.inputText,
                fontSize: "14px",
                transition: "color 0.3s ease",
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
