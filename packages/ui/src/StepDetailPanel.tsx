/**
 * StepDetailPanel コンポーネント
 *
 * JobのSteps一覧を表示するパネル
 */

import type { Step } from "@yamlviz/core";
import { isValidActionRef } from "@yamlviz/core";

const SOLARIZED = {
  dark: {
    bg: "#073642",
    border: "#586e75",
    text: "#839496",
    subtext: "#586e75",
    accent: "#2aa198",
    actionBg: "#002b36",
  },
  light: {
    bg: "#eee8d5",
    border: "#93a1a1",
    text: "#657b83",
    subtext: "#93a1a1",
    accent: "#268bd2",
    actionBg: "#fdf6e3",
  },
};

interface StepDetailPanelProps {
  steps: Step[];
  theme: "dark" | "light";
  onActionClick?: (action: string) => void;
}

// アクション名からアイコンを取得
function getActionIcon(uses: string): { icon: string; color: string } {
  if (uses.startsWith("actions/")) {
    return { icon: "", color: "#6366f1" }; // GitHub紫
  }
  if (uses.startsWith("docker/")) {
    return { icon: "", color: "#2496ed" }; // Docker青
  }
  if (uses.includes("checkout")) {
    return { icon: "", color: "#6366f1" };
  }
  return { icon: "", color: "#859900" }; // デフォルト緑
}

// アクション名を短縮表示
function shortenAction(uses: string): string {
  if (uses.startsWith("actions/")) {
    return uses.replace("actions/", "");
  }
  if (uses.startsWith("docker/")) {
    return uses.replace("docker/", "docker/");
  }
  const parts = uses.split("/");
  return parts[parts.length - 1] || uses;
}

// コマンドを短縮表示
function shortenCommand(run: string): string {
  const trimmed = run.trim();
  if (trimmed.length > 50) {
    return trimmed.slice(0, 50) + "...";
  }
  return trimmed;
}

export function StepDetailPanel({ steps, theme, onActionClick }: StepDetailPanelProps) {
  const colors = SOLARIZED[theme];

  if (!steps || steps.length === 0) {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: colors.bg,
          color: colors.text,
          fontSize: "12px",
          border: `1px solid ${colors.border}`,
        }}
      >
        No steps
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "8px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        fontSize: "12px",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          background: colors.actionBg,
          borderBottom: `1px solid ${colors.border}`,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        Steps ({steps.length})
      </div>
      <div style={{ padding: "8px" }}>
        {steps.map((step, index) => {
          if (step.uses) {
            const { color } = getActionIcon(step.uses);
            const isClickable = onActionClick && isValidActionRef(step.uses);
            return (
              <div
                key={step.id || index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  background: colors.actionBg,
                  marginBottom: index < steps.length - 1 ? "4px" : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: color,
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {step.uses.startsWith("actions/") && "G"}
                  {step.uses.startsWith("docker/") && "D"}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: colors.text,
                      fontWeight: 500,
                      cursor: isClickable ? "pointer" : undefined,
                    }}
                    onClick={() => isClickable && onActionClick!(step.uses!)}
                  >
                    {step.name || shortenAction(step.uses)}
                  </div>
                  <div style={{ color: colors.subtext, fontSize: "11px" }}>
                    {step.uses}
                  </div>
                </div>
              </div>
            );
          }

          if (step.run) {
            return (
              <div
                key={step.id || index}
                style={{
                  padding: "6px 8px",
                  borderRadius: "4px",
                  background: colors.actionBg,
                  marginBottom: index < steps.length - 1 ? "4px" : 0,
                }}
              >
                {step.name && (
                  <div style={{ color: colors.text, fontWeight: 500 }}>
                    {step.name}
                  </div>
                )}
                <div
                  style={{
                    color: colors.accent,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "11px",
                  }}
                >
                  $ {shortenCommand(step.run)}
                </div>
              </div>
            );
          }

          return (
            <div
              key={step.id || index}
              style={{
                padding: "6px 8px",
                borderRadius: "4px",
                background: colors.actionBg,
                marginBottom: index < steps.length - 1 ? "4px" : 0,
                color: colors.subtext,
              }}
            >
              (unknown step)
            </div>
          );
        })}
      </div>
    </div>
  );
}
