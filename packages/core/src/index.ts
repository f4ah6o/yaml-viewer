/**
 * @yamlviz/core
 *
 * GitHub Workflow YAMLのパースとグラフ変換
 */

export * from "./types";
export { parseYaml } from "./parser";
export { transformWorkflowToGraph, calculateLayout } from "./transformer";

/**
 * YAML文字列からグラフを生成（ユーティリティ）
 */
import { parseYaml } from "./parser";
import { transformWorkflowToGraph, calculateLayout } from "./transformer";
import type { WorkflowGraph } from "./types";

export function yamlToGraph(yaml: string): WorkflowGraph | null {
  const result = parseYaml(yaml);
  if (!result.ok) return null;

  const graph = transformWorkflowToGraph(result.data);
  calculateLayout(graph);
  return graph;
}
