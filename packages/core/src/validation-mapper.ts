/**
 * 検証結果をグラフノードにマッピングするユーティリティ
 */

import type { ValidationIssue, WorkflowGraph } from "./types";

/**
 * ノードごとの検証ステータスを計算
 */
export function mapValidationToNodes(
  nodes: WorkflowGraph["nodes"],
  issues: ValidationIssue[]
): Map<string, { status: "valid" | "warning" | "error"; issues: ValidationIssue[] }> {
  const nodeValidation = new Map<string, { status: "valid" | "warning" | "error"; issues: ValidationIssue[] }>();

  // すべてのノードを有効として初期化
  for (const node of nodes) {
    nodeValidation.set(node.id, { status: "valid", issues: [] });
  }

  // jobIdでissuesをグループ化してマッピング
  for (const issue of issues) {
    if (issue.jobId) {
      const current = nodeValidation.get(issue.jobId);
      if (current) {
        current.issues.push(issue);
        // ステータスを更新: valid -> warning -> error
        if (issue.severity === "error") {
          current.status = "error";
        } else if (issue.severity === "warning" && current.status !== "error") {
          current.status = "warning";
        }
      }
    }
  }

  return nodeValidation;
}

/**
 * 検証結果をグラフに適用した新しいグラフを返す
 */
export function applyValidationToGraph(
  graph: WorkflowGraph,
  issues: ValidationIssue[]
): WorkflowGraph {
  const nodeValidation = mapValidationToNodes(graph.nodes, issues);

  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const validation = nodeValidation.get(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          validationStatus: validation?.status ?? "valid",
          validationIssues: validation?.issues ?? [],
        },
      };
    }),
  };
}
