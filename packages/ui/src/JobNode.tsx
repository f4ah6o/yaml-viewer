/**
 * Jobノードコンポーネント
 */

import type { NodeProps } from "@xyflow/react";
import type { JobNodeData } from "@yamlviz/core";
import { Handle, Position } from "@xyflow/react";

export function JobNode({ data }: NodeProps<JobNodeData>) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "8px",
        border: "2px solid #3b82f6",
        background: "#1e293b",
        color: "#e2e8f0",
        minWidth: "180px",
        fontSize: "14px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600, marginBottom: "8px" }}>
        {data.name}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
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
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
