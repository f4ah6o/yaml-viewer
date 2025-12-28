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
  validationStatus?: "valid" | "warning" | "error";
  validationIssues?: ValidationIssue[];
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

/**
 * GitHub Action メタデータ
 */

export interface ActionMetadata {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  version?: string;
}

export interface ActionRef {
  owner: string;
  repo: string;
  version?: string;
}

/**
 * wrkflw 検証・実行関連の型
 */

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  line?: number;
  column?: number;
  jobId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionEvent {
  type: "workflow_start" | "workflow_complete" | "job_start" | "job_complete" | "step_complete";
  path?: string;
  runtime?: string;
  jobId?: string;
  stepIndex?: number;
  stepName?: string;
  status?: string;
  success?: boolean;
}
