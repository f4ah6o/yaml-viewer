/**
 * wrkflw-wasm (Rust) 統合レイヤー
 */

import init, {
  validateWorkflow,
  expandMatrix,
  formatCombinationName,
  initSync,
} from "wrkflw-wasm";
import type { ValidationResult, ValidationIssue } from "./types";

let wasmInitialized = false;

/**
 * WASMモジュールを初期化（アプリ起動時に1回呼び出し）
 */
export async function initWrkflw(): Promise<void> {
  if (!wasmInitialized) {
    if (typeof window === "undefined") {
      // Node.js 環境 - 動的インポートで Node.js モジュールを読み込み
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const { readFileSync } = await import("node:fs");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const wasmFilePath = join(__dirname, "../../../../wrkflw/crates/wasm/pkg/wrkflw_wasm_bg.wasm");
      const wasmBuffer = readFileSync(wasmFilePath);
      // initSync は同期だが、非同期関数内で呼ぶ
      initSync({ module: wasmBuffer });
    } else {
      // ブラウザ環境 - public フォルダから WASM を読み込み
      // base パス (/YAMLViz/) を考慮
      const wasmPath = new URL("/YAMLViz/wrkflw_wasm_bg.wasm", window.location.href);
      await init({ module_or_path: wasmPath });
    }
    wasmInitialized = true;
  }
}

/**
 * wrkflw-wasmの検証結果型 (wasm-bindgenはMapを返す)
 */
type WrkflwValidationResult = Map<string, unknown>;

/**
 * wrkflw-wasmのマトリックス展開結果型
 */
type WrkflwMatrixExpansion = Map<string, unknown> | Array<unknown>;

/**
 * wrkflwのマトリックス組み合わせ型
 */
export interface MatrixCombination {
  values: Record<string, unknown>;
  is_included?: boolean;
}

/**
 * ワークフローYAMLを検証
 */
export function validateWorkflowJson(workflowJson: string): ValidationResult {
  try {
    const result = validateWorkflow(workflowJson) as WrkflwValidationResult;

    const isValid = result.get("is_valid") as boolean;
    const issuesData = result.get("issues") as Array<unknown>;
    const issues: ValidationIssue[] = (issuesData || []).map((issue) => {
      const issueMap = issue as Map<string, string>;
      return {
        severity: issueMap.get("severity") === "error" ? "error" : "warning",
        message: issueMap.get("message") || "Unknown error",
      };
    });

    return {
      isValid,
      issues,
    };
  } catch (e) {
    return {
      isValid: false,
      issues: [
        {
          severity: "error",
          message: e instanceof Error ? e.message : "Validation failed",
        },
      ],
    };
  }
}

/**
 * マトリックス設定を展開
 */
export function expandMatrixConfig(matrixJson: string): MatrixCombination[] {
  try {
    const result = expandMatrix(matrixJson) as unknown;
    const combinations = result as Array<unknown>;

    return combinations.map((combo) => {
      const comboMap = combo as Map<string, unknown>;
      const valuesMap = comboMap.get("values") as Map<string, unknown>;
      const isIncluded = comboMap.get("is_included") as boolean | undefined;

      // Map を普通の JavaScript オブジェクトに変換
      const values: Record<string, unknown> = {};
      valuesMap.forEach((value, key) => {
        if (value instanceof Map) {
          // Map の Map は再帰的に変換
          const nested: Record<string, unknown> = {};
          value.forEach((v, k) => {
            nested[k] = v;
          });
          values[key] = nested;
        } else if (Array.isArray(value)) {
          values[key] = value;
        } else {
          values[key] = value;
        }
      });

      return {
        values,
        is_included: isIncluded ?? true,
      };
    });
  } catch (e) {
    console.error("Matrix expansion failed:", e);
    return [];
  }
}

/**
 * 組み合わせ名をフォーマット
 */
export function formatMatrixCombinationName(
  jobName: string,
  combinationJson: string
): string {
  try {
    return formatCombinationName(jobName, combinationJson);
  } catch {
    return jobName;
  }
}
