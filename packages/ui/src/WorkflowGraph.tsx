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
  theme: "dark" | "light";
}

const SOLARIZED = {
  dark: {
    bg: "#002b36",
    dot: "#586e75",
    edge: "#2aa198",
  },
  light: {
    bg: "#fdf6e3",
    dot: "#93a1a1",
    edge: "#268bd2",
  },
};

export function WorkflowGraph({ graph, className, theme }: WorkflowGraphProps) {
  const colors = SOLARIZED[theme];

  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position || { x: 0, y: 0 },
    data: { ...n.data, theme },
  }));

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: colors.edge, strokeWidth: 2 },
    labelStyle: { fill: colors.edge, fontSize: 10 },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      className={className}
      style={{ background: colors.bg }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        color={colors.dot}
      />
      <Controls />
    </ReactFlow>
  );
}
