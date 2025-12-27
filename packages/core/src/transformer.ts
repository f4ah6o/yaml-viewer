/**
 * YAMLからグラフ構造への変換
 */

import type { Workflow, WorkflowGraph, GraphNode, GraphEdge, JobNodeData } from "./types";

/**
 * GitHub Workflow YAMLをグラフ構造に変換
 */
export function transformWorkflowToGraph(workflow: Workflow): WorkflowGraph {
  const jobs = workflow.jobs || {};
  const jobEntries = Object.entries(jobs);

  // ノード生成
  const nodes: GraphNode[] = jobEntries.map(([jobId, job]) => {
    const steps = job.steps || [];
    const stepCount = steps.length;
    const needs = normalizeNeeds(job.needs);

    const nodeData: JobNodeData = {
      name: job.name || jobId,
      runsOn: normalizeRunsOn(job.runsOn),
      needs,
      stepCount,
      steps,
    };

    return {
      id: jobId,
      type: "job",
      label: job.name || jobId,
      data: nodeData,
    };
  });

  // エッジ生成（needs依存関係）
  const edges: GraphEdge[] = [];
  jobEntries.forEach(([jobId, job]) => {
    const needs = normalizeNeeds(job.needs);
    needs.forEach((neededJob) => {
      edges.push({
        id: `${neededJob}-${jobId}`,
        source: neededJob,
        target: jobId,
        label: "needs",
      });
    });
  });

  return { nodes, edges };
}

/**
 * needsを正規化（文字列または配列から文字列配列へ）
 */
function normalizeNeeds(
  needs: string | string[] | undefined,
): string[] {
  if (needs === undefined || needs === null) {
    return [];
  }
  if (typeof needs === "string") {
    return [needs];
  }
  return needs;
}

/**
 * runs-onを正規化
 */
function normalizeRunsOn(
  runsOn: string | string[] | undefined,
): string | string[] | undefined {
  if (runsOn === undefined || runsOn === null) {
    return undefined;
  }
  if (typeof runsOn === "string") {
    return runsOn;
  }
  return runsOn;
}

/**
 * ノードの自動レイアウト位置を計算（DAG）
 */
export function calculateLayout(graph: WorkflowGraph): void {
  // トポロジカルソート用の依存グラフ構築
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // 初期化
  graph.nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  // エッジからグラフ構築
  graph.edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // トポロジカルソートでレイヤーを決定
  const layers: string[][] = [];
  const queue = graph.nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);

  while (queue.length > 0) {
    layers.push([...queue]);
    const nextLayer: string[] = [];

    queue.forEach((nodeId) => {
      adjacency.get(nodeId)?.forEach((target) => {
        const newDegree = (inDegree.get(target) ?? 0) - 1;
        inDegree.set(target, newDegree);
        if (newDegree === 0) {
          nextLayer.push(target);
        }
      });
    });

    queue.length = 0;
    queue.push(...nextLayer);
  }

  // レイヤーに基づいて位置を設定（縦方向Top-Bottom）
  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalGap = 40;
  const verticalGap = 80;

  layers.forEach((layer, layerIndex) => {
    const y = layerIndex * (nodeHeight + verticalGap) + 50;
    const startX = -(layer.length - 1) * (nodeWidth + horizontalGap) / 2;

    layer.forEach((nodeId, i) => {
      nodePositions.set(nodeId, {
        x: startX + i * (nodeWidth + horizontalGap),
        y,
      });
    });
  });

  // 位置をノードに適用
  graph.nodes.forEach((node) => {
    const pos = nodePositions.get(node.id);
    if (pos) {
      node.position = pos;
    } else {
      node.position = { x: 0, y: 0 };
    }
  });
}
