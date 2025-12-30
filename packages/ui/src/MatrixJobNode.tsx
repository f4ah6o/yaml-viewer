/**
 * MatrixJobNode - マトリックス展開されたジョブノード
 */

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

const SOLARIZED = {
  dark: {
    bg: "#073642",
    border: "#6c71c4",
    text: "#839496",
    subtext: "#586e75",
    handle: "#6c71c4",
    badgeBg: "#002b36",
  },
  light: {
    bg: "#eee8d5",
    border: "#6c71c4",
    text: "#657b83",
    subtext: "#93a1a1",
    handle: "#6c71c4",
    badgeBg: "#fdf6e3",
  },
};

const VALIDATION_COLORS = {
  valid: "#4ec9b0",
  warning: "#ffab00",
  error: "#f14c4c",
};

interface MatrixJobNodeData {
  name?: string;
  runsOn?: string | string[];
  needs: string[];
  stepCount: number;
  theme?: "dark" | "light";
  validationStatus?: "valid" | "warning" | "error";
  matrixCombination?: Record<string, unknown>;
}

export function MatrixJobNode({ data }: NodeProps<MatrixJobNodeData>) {
  const theme = data.theme || "dark";
  const colors = SOLARIZED[theme];

  const borderColor =
    data.validationStatus && VALIDATION_COLORS[data.validationStatus]
      ? VALIDATION_COLORS[data.validationStatus]
      : colors.border;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          border: `2px dashed ${borderColor}`,
          background: colors.bg,
          color: colors.text,
          minWidth: "160px",
          fontSize: "13px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          opacity: 0.95,
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: borderColor, width: 8, height: 8 }}
        />
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>{data.name}</div>
        <div style={{ fontSize: "11px", color: colors.subtext }}>
          {data.matrixCombination && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {Object.entries(data.matrixCombination).map(([k, v]) => (
                <span
                  key={k}
                  style={{
                    background: colors.badgeBg,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: borderColor, width: 8, height: 8 }}
        />
      </div>
    </div>
  );
}
