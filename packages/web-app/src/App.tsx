import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { WorkflowGraph, StepDetailPanel, ActionModal, ValidationPanel } from "@yamlviz/ui";
import { yamlToGraph, fetchActionMetadata, initWrkflw, validateWorkflowJson, parseYaml, applyValidationToGraph, type ValidationResult } from "@yamlviz/core";
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
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [16, 18, 20]
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // WASM & Validation 状態
  const [wasmReady, setWasmReady] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    issues: [],
  });
  const [isValidating, setIsValidating] = useState(false);
  // Action Modal 状態
  const [actionModal, setActionModal] = useState<{
    action: string;
    metadata: import("@yamlviz/core").ActionMetadata | null;
    loading: boolean;
    error: string | null;
  } | null>(null);
  // GitHub Token
  const [githubToken, setGithubToken] = useState<string>("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  // キャッシュ
  const actionCache = useRef<Map<string, import("@yamlviz/core").ActionMetadata>>(new Map());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const graph = yamlToGraph(yaml);
  const graphWithValidation = useMemo(() => {
    if (!graph) return null;
    return applyValidationToGraph(graph, validationResult.issues);
  }, [graph, validationResult]);
  const styles = THEME_STYLES[theme];

  // テーマ切り替え時にdocumentにクラスを追加
  useEffect(() => {
    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  // WASM初期化
  useEffect(() => {
    initWrkflw().then(() => setWasmReady(true)).catch(() => setWasmReady(false));
  }, []);

  // パース結果を取得
  const parseResult = useMemo(() => parseYaml(yaml), [yaml]);

  // 検証実行（デバウンス付き）
  useEffect(() => {
    if (!wasmReady || !parseResult.ok) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      try {
        const workflowJson = JSON.stringify(parseResult.data);
        const result = validateWorkflowJson(workflowJson);
        setValidationResult(result);
      } catch {
        setValidationResult({ isValid: true, issues: [] });
      } finally {
        setIsValidating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [parseResult, wasmReady]);

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

  const handleActionClick = useCallback(async (action: string) => {
    // キャッシュチェック
    const cached = actionCache.current.get(action);
    if (cached) {
      setActionModal({
        action,
        metadata: cached,
        loading: false,
        error: null,
      });
      return;
    }

    // モーダルを開く（ローディング状態）
    setActionModal({
      action,
      metadata: null,
      loading: true,
      error: null,
    });

    try {
      const metadata = await fetchActionMetadata(action, githubToken || undefined);
      if (metadata) {
        actionCache.current.set(action, metadata);
        setActionModal({
          action,
          metadata,
          loading: false,
          error: null,
        });
      } else {
        setActionModal({
          action,
          metadata: null,
          loading: false,
          error: "Action not found",
        });
      }
    } catch (e) {
      setActionModal({
        action,
        metadata: null,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to fetch action metadata",
      });
    }
  }, [githubToken]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const selectedNode = selectedNodeId
    ? graphWithValidation?.nodes.find((n) => n.id === selectedNodeId)
    : null;

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
            onClick={() => setShowTokenInput(!showTokenInput)}
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
            title="Set GitHub Token for higher rate limit"
          >
            🔑 Token
          </button>
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

      {/* GitHub Token Input */}
      {showTokenInput && (
        <div
          style={{
            padding: "8px 20px",
            background: styles.headerBg,
            borderBottom: `1px solid ${styles.border}`,
            display: "flex",
            gap: "8px",
            alignItems: "center",
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          <span style={{ color: styles.headerText, fontSize: "12px" }}>GitHub Token:</span>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_... (optional)"
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: `1px solid ${styles.border}`,
              background: styles.inputBg,
              color: styles.inputText,
              fontSize: "12px",
              flex: 1,
              maxWidth: "300px",
            }}
          />
          <span style={{ color: styles.subtext, fontSize: "11px" }}>
            {githubToken ? "5000 req/h" : "60 req/h"}
          </span>
        </div>
      )}

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
          {/* Validation Panel */}
          <ValidationPanel
            issues={validationResult.issues}
            isLoading={isValidating || !wasmReady}
            theme={theme}
            onIssueClick={(issue) => {
              // 行番号がある場合はスクロール
              if (issue.line && textareaRef.current) {
                const lines = yaml.split("\n");
                const lineHeight = 19.68; // font-size 13px * line-height 1.5
                const scrollTop = (issue.line - 1) * lineHeight;
                textareaRef.current.scrollTop = scrollTop;
                if (preRef.current) {
                  preRef.current.scrollTop = scrollTop;
                }
              }
            }}
          />
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
          ) : graphWithValidation && graphWithValidation.nodes.length > 0 ? (
            <WorkflowGraph graph={graphWithValidation} theme={theme} onNodeClick={handleNodeClick} />
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

      {/* モーダル */}
      {selectedNode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedNodeId(null)}
        >
          <div
            style={{
              background: styles.headerBg,
              borderRadius: "12px",
              border: `1px solid ${styles.border}`,
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${styles.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "border-color 0.3s ease",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: styles.headerText,
                  transition: "color 0.3s ease",
                }}
              >
                {selectedNode.data.name || selectedNode.id}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background: "transparent",
                  color: styles.headerText,
                  cursor: "pointer",
                  fontSize: "18px",
                  transition: "color 0.3s ease",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: styles.inputText,
                  transition: "color 0.3s ease",
                }}
              >
                <div>runs-on: {Array.isArray(selectedNode.data.runsOn) ? selectedNode.data.runsOn.join(", ") : selectedNode.data.runsOn}</div>
                {selectedNode.data.needs && selectedNode.data.needs.length > 0 && (
                  <div>needs: {selectedNode.data.needs.join(", ")}</div>
                )}
              </div>
              {selectedNode.data.steps && selectedNode.data.steps.length > 0 ? (
                <StepDetailPanel steps={selectedNode.data.steps} theme={theme} onActionClick={handleActionClick} />
              ) : (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: styles.inputBg,
                    color: styles.inputText,
                    fontSize: "14px",
                    transition: "background 0.3s ease, color 0.3s ease",
                  }}
                >
                  No steps
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          action={actionModal.action}
          metadata={actionModal.metadata}
          loading={actionModal.loading}
          error={actionModal.error}
          theme={theme}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
  );
}
