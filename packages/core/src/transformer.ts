/**
 * YAMLからグラフ構造への変換
 */

import type { Workflow, WorkflowGraph, GraphNode, GraphEdge, JobNodeData, MatrixConfig } from "./types";
import { expandMatrixConfig, formatMatrixCombinationName } from "./wrkflw";

interface TransformOptions {
  expandMatrix?: boolean;
}

/**
 * GitHub Workflow YAMLをグラフ構造に変換
 */
export function transformWorkflowToGraph(
  workflow: Workflow,
  options: TransformOptions = {}
): WorkflowGraph {
  const { expandMatrix: shouldExpandMatrix = false } = options;  // デフォルトで展開しない
  const jobs = workflow.jobs || {};
  const jobEntries = Object.entries(jobs);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const [jobId, job] of jobEntries) {
    const steps = job.steps || [];
    const needs = normalizeNeeds(job.needs);

    // マトリックス設定をチェック
    const matrix = job.strategy?.matrix;

    if (matrix && shouldExpandMatrix && isExpandableMatrix(matrix)) {
      // マトリックスジョブを展開
      const matrixNodes = expandMatrixJob(jobId, job, matrix);
      nodes.push(...matrixNodes);

      // すべての展開ノードに対してneedsエッジを作成
      for (const matrixNode of matrixNodes) {
        for (const neededJob of needs) {
          edges.push({
            id: `${neededJob}-${matrixNode.id}`,
            source: neededJob,
            target: matrixNode.id,
            label: "needs",
          });
        }
      }
    } else {
      // 通常のジョブノード
      const nodeData: JobNodeData = {
        name: job.name || jobId,
        runsOn: normalizeRunsOn(job.runsOn),
        needs,
        stepCount: steps.length,
        steps,
        isMatrixJob: !!matrix,
      };

      nodes.push({
        id: jobId,
        type: "job",
        label: job.name || jobId,
        data: nodeData,
      });

      // needsエッジを作成
      for (const neededJob of needs) {
        edges.push({
          id: `${neededJob}-${jobId}`,
          source: neededJob,
          target: jobId,
          label: "needs",
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * マトリックスジョブを展開して複数ノードを生成
 */
function expandMatrixJob(
  jobId: string,
  job: import("./types").Job,
  matrix: MatrixConfig
): GraphNode[] {
  const nodes: GraphNode[] = [];

  // wrkflw形式に変換
  const wrkflwMatrix = convertToWrkflwMatrix(matrix);
  const matrixJson = JSON.stringify(wrkflwMatrix);

  try {
    const combinations = expandMatrixConfig(matrixJson);

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      const combinationJson = JSON.stringify(combination.values);
      const label = formatMatrixCombinationName(job.name || jobId, combinationJson);

      const nodeData: JobNodeData = {
        name: label,
        runsOn: normalizeRunsOn(job.runsOn),
        needs: normalizeNeeds(job.needs),
        stepCount: (job.steps || []).length,
        steps: job.steps,
        isMatrixJob: true,
        matrixCombination: combination.values,
        parentJobId: jobId,
      };

      nodes.push({
        id: `${jobId}-matrix-${i}`,
        type: "matrix-job",
        label,
        data: nodeData,
      });
    }
  } catch (e) {
    console.error("Matrix expansion failed:", e);
    // フォールバック: 単一ノード
    nodes.push({
      id: jobId,
      type: "job",
      label: job.name || jobId,
      data: {
        name: job.name || jobId,
        runsOn: normalizeRunsOn(job.runsOn),
        needs: normalizeNeeds(job.needs),
        stepCount: (job.steps || []).length,
        steps: job.steps,
        isMatrixJob: true,
      },
    });
  }

  return nodes;
}

/**
 * マトリックス設定が展開可能かチェック
 */
function isExpandableMatrix(matrix: MatrixConfig): boolean {
  // 少なくとも1つのパラメータ配列が存在するかチェック
  for (const [key, value] of Object.entries(matrix)) {
    if (key !== "include" && key !== "exclude" && Array.isArray(value) && value.length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * YAMLVizのMatrixConfigをwrkflw形式に変換
 */
function convertToWrkflwMatrix(matrix: MatrixConfig): Record<string, unknown> {
  const parameters: Record<string, unknown[]> = {};

  for (const [key, value] of Object.entries(matrix)) {
    if (key !== "include" && key !== "exclude" && Array.isArray(value)) {
      parameters[key] = value;
    }
  }

  const result: Record<string, unknown> = { parameters };
  if (matrix.include) result.include = matrix.include;
  if (matrix.exclude) result.exclude = matrix.exclude;

  return result;
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
