/**
 * Jobノードコンポーネント
 */

import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { StepDetailPanel } from "./StepDetailPanel";
import type { Step } from "@yamlviz/core";

const SOLARIZED = {
  dark: {
    bg: "#073642",
    border: "#2aa198",
    text: "#839496",
    subtext: "#586e75",
    handle: "#2aa198",
    panelBg: "#002b36",
  },
  light: {
    bg: "#eee8d5",
    border: "#268bd2",
    text: "#657b83",
    subtext: "#93a1a1",
    handle: "#268bd2",
    panelBg: "#fdf6e3",
  },
};

interface JobNodeData {
  name?: string;
  runsOn?: string | string[];
  needs: string[];
  stepCount: number;
  theme?: "dark" | "light";
  steps?: Step[];
}

// アクションのバッジを取得
function getActionBadges(steps: Step[] | undefined): Array<{ label: string; color: string }> {
  if (!steps) return [];

  const badges: Array<{ label: string; color: string }> = [];
  const actionCounts = new Map<string, number>();

  steps.forEach((step) => {
    if (step.uses) {
      if (step.uses.startsWith("actions/")) {
        actionCounts.set("GitHub", (actionCounts.get("GitHub") || 0) + 1);
      } else if (step.uses.startsWith("docker/")) {
        actionCounts.set("Docker", (actionCounts.get("Docker") || 0) + 1);
      }
    }
  });

  actionCounts.forEach((count, name) => {
    badges.push({ label: `${name} ${count}`, color: name === "GitHub" ? "#6366f1" : "#2496ed" });
  });

  return badges;
}

export function JobNode({ data }: NodeProps<JobNodeData>) {
  const [showSteps, setShowSteps] = useState(false);
  const theme = data.theme || "dark";
  const colors = SOLARIZED[theme];
  const badges = getActionBadges(data.steps);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShowSteps(true)}
      onMouseLeave={() => setShowSteps(false)}
    >
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          border: `2px solid ${colors.border}`,
          background: colors.bg,
          color: colors.text,
          minWidth: "180px",
          fontSize: "14px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
          cursor: "pointer",
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: colors.handle, transition: "background 0.3s ease" }}
        />
        <div style={{ fontWeight: 600, marginBottom: "8px" }}>
          {data.name}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: colors.subtext,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div>
            runs-on: {Array.isArray(data.runsOn) ? data.runsOn[0] : data.runsOn}
          </div>
          {data.stepCount > 0 && <div>steps: {data.stepCount}</div>}
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {badges.map((badge, i) => (
                <span
                  key={i}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: badge.color,
                    color: "#fff",
                    fontSize: "10px",
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          {data.needs.length > 0 && (
            <div>
              needs: {data.needs.join(", ")}
            </div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: colors.handle, transition: "background 0.3s ease" }}
        />
      </div>

      {/* Stepsパネル（ホバー時に表示） */}
      {showSteps && data.steps && data.steps.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: "100%",
            top: 0,
            marginLeft: "16px",
            zIndex: 1000,
            width: "300px",
          }}
        >
          <StepDetailPanel steps={data.steps} theme={theme} />
        </div>
      )}
    </div>
  );
}
