/**
 * GitHub Workflow YAML データ構造
 */

export interface Workflow {
  name?: string;
  on?: string | string[] | Record<string, unknown>;
  jobs: Record<string, Job>;
}

export interface Step {
  name?: string;
  id?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
  if?: string;
  [key: string]: unknown;
}

export interface Job {
  name?: string;
  runsOn?: string | string[];
  needs?: string | string[];
  if?: string;
  steps?: Step[];
  permissions?: Record<string, unknown>;
  env?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  outputs?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * グラフ構造
 */

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: "job";
  label: string;
  data: JobNodeData;
}

export interface JobNodeData {
  name?: string;
  runsOn?: string | string[];
  needs: string[];
  stepCount: number;
  theme?: "dark" | "light";
  steps?: Step[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * エラー型
 */

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ParseError };
