/**
 * YAMLパーサー - yyjjを使用
 */

import { parse_yaml } from "yyjj";
import type { Workflow, ParseResult, ParseError } from "./types";

interface YamlValue {
  _0: unknown;
  _1?: unknown;
  _2?: unknown;
  $tag?: string;
}

// yyjjのYMapping型を検出するタグ
const YMAPPING_TAG = "$64$f4ah6o$47$yyjj$47$yaml$46$YamlNode$YMapping";

interface YamlEntry {
  key: YamlValue;
  key_trivia: { leading: unknown[]; trailing: unknown[] };
  value: YamlValue;
}

interface YamlArrayItem {
  _0: YamlEntry[];
  _1: { leading: unknown[]; trailing: unknown[] };
}

/**
 * 値がエントリ型かチェック
 */
function isEntry(v: unknown): v is YamlEntry {
  return typeof v === "object" && v !== null && "key" in v && "value" in v;
}

/**
 * 値が配列項目型かチェック
 */
function isArrayItem(v: unknown): v is YamlArrayItem {
  if (typeof v !== "object" || v === null) return false;
  if (!("_0" in v) || !("_1" in v)) return false;

  const yamlValue = v as YamlArrayItem;
  if (!Array.isArray(yamlValue._0) || yamlValue._0.length === 0) return false;

  const first = yamlValue._0[0];
  return typeof first === "object" && first !== null && "key" in first;
}

/**
 * YYJJのパーサーのバグを回避して、誤って配置されたプロパティを修正
 * yyjjはネストされた構造（strategy.matrixなど）を持つジョブの
 * 一部プロパティ（steps, needsなど）をjobsレベルに誤って配置するバグがあります
 */
function fixMisplacedSteps(jobs: Record<string, unknown>): void {
  // 配列型のプロパティ（steps, needsが誤ってjobsレベルにある場合）を処理
  const misplacedKeys: string[] = [];

  for (const key of Object.keys(jobs)) {
    const value = jobs[key];
    // ジョブ名でないキーで、値が配列または文字列配列の場合
    if (
      key !== "steps" &&  // stepsは後で別途処理
      !isJobObject(value)  // ジョブオブジェクトでない
    ) {
      misplacedKeys.push(key);
    }
  }

  // jobsレベルにある配列型プロパティを適切なジョブに移動
  for (const key of misplacedKeys) {
    const value = jobs[key];

    // steps は配列、needs は文字列または文字列配列
    const isSteps = key === "steps" && Array.isArray(value);
    const isNeeds = key === "needs" && (typeof value === "string" || Array.isArray(value));

    if (isSteps || isNeeds) {
      // このプロパティを持たない最後のジョブを探す
      const jobKeys = Object.keys(jobs).filter((k) => k !== key && isJobObject(jobs[k]));
      for (let i = jobKeys.length - 1; i >= 0; i--) {
        const jobKey = jobKeys[i];
        const job = jobs[jobKey] as Record<string, unknown>;

        if (!(key in job)) {
          // このジョブにプロパティを追加
          job[key] = value;
          delete jobs[key];
          break;
        }
      }
    }
  }

  // steps 特別処理（既存のロジック）
  if ("steps" in jobs && Array.isArray(jobs.steps)) {
    const stepsValue = jobs.steps;
    const jobKeys = Object.keys(jobs).filter((k) => k !== "steps" && isJobObject(jobs[k]));

    for (let i = jobKeys.length - 1; i >= 0; i--) {
      const jobKey = jobKeys[i];
      const job = jobs[jobKey] as Record<string, unknown>;

      if (!("steps" in job)) {
        job.steps = stepsValue;
        delete jobs.steps;
        break;
      }
    }
  }

  // 孤児になったプロパティを削除
  for (const key of Object.keys(jobs)) {
    if (!isJobObject(jobs[key])) {
      delete jobs[key];
    }
  }
}

/**
 * 値がジョブオブジェクトかチェック
 * ジョブオブジェクトは runs-on, needs, strategy, steps 等のプロパティを持つ
 */
function isJobObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  // 既知のジョブプロパティのいずれかを持つ、または空のオブジェクト
  const keys = Object.keys(value as Record<string, unknown>);
  if (keys.length === 0) return true; // 空のオブジェクトもジョブとみなす
  // 既知のジョブプロパティ
  const jobProps = ["runs-on", "needs", "strategy", "steps", "uses", "run", "name", "permissions", "environment"];
  return keys.some((k) => jobProps.includes(k) || k.startsWith("_"));
}

/**
 * CSTからJavaScriptオブジェクトに変換（再帰的）
 */
function cstToJs(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // プリミティブ値
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  const yamlValue = value as YamlValue;

  // yyjjのYMapping型を検出した場合、その _0 をエントリ配列として処理
  // 構造ベースの判定：_0 が配列で、最初の要素がエントリ型なら YMapping とみなす
  const hasTag = typeof value === "object" && value !== null && "$tag" in value;

  // 通常の配列とYMappingを区別するためのチェック
  // YMappingは _0 がエントリの配列を持つ
  let isYMapping = false;
  if (yamlValue._0 && Array.isArray(yamlValue._0) && yamlValue._0.length > 0) {
    const first = yamlValue._0[0];
    // 最初の要素がエントリ構造を持っている場合 → YMapping
    if (isEntry(first)) {
      isYMapping = true;
    }
    // $tag がある場合も YMapping として処理（yyjjの型タグ）
    else if (hasTag) {
      isYMapping = true;
    }
  }

  if (isYMapping) {
    const items = yamlValue._0 as unknown[];

    // 空の配列
    if (items.length === 0) {
      return {};
    }

    const first = items[0];

    // マッピング（エントリの配列）
    if (isEntry(first)) {
      const obj: Record<string, unknown> = {};
      for (const entry of items as YamlEntry[]) {
        const key = cstToJs(entry.key._0, depth + 1) as string;
        obj[key] = cstToJs(entry.value, depth + 1);
      }
      return obj;
    }

    // 配列項目の配列（YAMLの `- ` で始まる配列）
    if (isArrayItem(first)) {
      const arr: unknown[] = [];
      for (const item of items as YamlArrayItem[]) {
        if (Array.isArray(item._0) && item._0.length > 0 && isEntry(item._0[0])) {
          const obj: Record<string, unknown> = {};
          for (const entry of item._0 as YamlEntry[]) {
            const key = cstToJs(entry.key._0, depth + 1) as string;
            obj[key] = cstToJs(entry.value, depth + 1);
          }
          arr.push(obj);
        } else {
          arr.push(cstToJs(item._0, depth + 1));
        }
      }
      return arr;
    }

    // その他の配列（数値の配列など）
    return items.map((v) => cstToJs(v, depth + 1));
  }

  // _0 がプリミティブの場合
  if (typeof yamlValue._0 === "string" || typeof yamlValue._0 === "number" || typeof yamlValue._0 === "boolean") {
    return yamlValue._0;
  }

  // _0 が配列の場合（マッピングまたは配列）
  if (Array.isArray(yamlValue._0)) {
    const items = yamlValue._0 as unknown[];

    // 空の配列
    if (items.length === 0) {
      return [];
    }

    const first = items[0];

    // マッピング（エントリの配列）
    if (isEntry(first)) {
      const obj: Record<string, unknown> = {};
      for (const entry of items as YamlEntry[]) {
        const key = cstToJs(entry.key._0, depth + 1) as string;
        obj[key] = cstToJs(entry.value, depth + 1);
      }
      return obj;
    }

    // 配列項目の配列（YAMLの `- ` で始まる配列）
    if (isArrayItem(first)) {
      const arr: unknown[] = [];
      for (const item of items as YamlArrayItem[]) {
        if (Array.isArray(item._0) && item._0.length > 0 && isEntry(item._0[0])) {
          const obj: Record<string, unknown> = {};
          for (const entry of item._0 as YamlEntry[]) {
            const key = cstToJs(entry.key._0, depth + 1) as string;
            obj[key] = cstToJs(entry.value, depth + 1);
          }
          arr.push(obj);
        } else {
          arr.push(cstToJs(item._0, depth + 1));
        }
      }
      return arr;
    }

    // その他の配列
    return items.map((v) => cstToJs(v, depth + 1));
  }

  return null;
}

/**
 * YAML文字列をパースしてJavaScriptオブジェクトに変換
 */
export function parseYaml(input: string): ParseResult<Workflow> {
  try {
    // yyjjでYAMLをCSTにパース
    const result = parse_yaml(input);

    // Result型のチェック ($tag: 1 = Ok, $tag: 0 = Err)
    if (result.$tag === 0) {
      const err = result._0;
      return {
        ok: false,
        error: {
          message: err.message ?? "Parse error",
        },
      };
    }

    // CSTをJavaScriptオブジェクトに変換
    const cst = result._0;
    const jsResult = cstToJs(cst) as Record<string, unknown>;

    // yyjjのバグを回避：stepsがjobsレベルにある場合、直前のジョブに移動
    if (jsResult.jobs && typeof jsResult.jobs === "object") {
      fixMisplacedSteps(jsResult.jobs as Record<string, unknown>);
    }

    if (jsResult.jobs && typeof jsResult.jobs === "object") {
      return { ok: true, data: jsResult as Workflow };
    }

    return {
      ok: false,
      error: { message: "Invalid GitHub Workflow YAML" },
    };
  } catch (e) {
    return {
      ok: false,
      error: { message: e instanceof Error ? e.message : String(e) },
    };
  }
}
