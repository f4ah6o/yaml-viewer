/**
 * WorkflowGraph コンポーネント
 *
 * React Flowを使用してGitHub Workflowを可視化
 */

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { JobNode } from "./JobNode";
import type { WorkflowGraph } from "@yamlviz/core";
import "@xyflow/react/dist/style.css";

const nodeTypes = {
  job: JobNode,
};

interface WorkflowGraphProps {
  graph: WorkflowGraph;
  className?: string;
}

export function WorkflowGraph({ graph, className }: WorkflowGraphProps) {
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position || { x: 0, y: 0 },
    data: n.data,
  }));

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      className={className}
      style={{ background: "#0f172a" }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        color="#334155"
      />
      <Controls />
    </ReactFlow>
  );
}
