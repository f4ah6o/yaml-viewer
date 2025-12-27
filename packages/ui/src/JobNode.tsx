/**
 * Jobノードコンポーネント
 */

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

const SOLARIZED = {
  dark: {
    bg: "#073642",
    border: "#2aa198",
    text: "#839496",
    subtext: "#586e75",
    handle: "#2aa198",
  },
  light: {
    bg: "#eee8d5",
    border: "#268bd2",
    text: "#657b83",
    subtext: "#93a1a1",
    handle: "#268bd2",
  },
};

interface JobNodeData {
  name?: string;
  runsOn?: string | string[];
  needs: string[];
  stepCount: number;
  theme?: "dark" | "light";
}

export function JobNode({ data }: NodeProps<JobNodeData>) {
  const theme = data.theme || "dark";
  const colors = SOLARIZED[theme];

  return (
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
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: colors.handle }}
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
        {data.needs.length > 0 && (
          <div>
            needs: {data.needs.join(", ")}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: colors.handle }}
      />
    </div>
  );
}
