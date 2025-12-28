/**
 * YAMLパーサー - yyjjを使用
 */

import { parse_yaml } from "yyjj";
import type { Workflow, ParseResult, ParseError } from "./types";

interface YamlValue {
  _0: unknown;
  _1?: unknown;
  _2?: unknown;
}

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
  return typeof v === "object" && v !== null && "_0" in v && "_1" in v && "key" in (v._0?.[0] || {});
}

/**
 * CSTからJavaScriptオブジェクトに変換（再帰的）
 */
function cstToJs(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // プリミティブ値
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  const yamlValue = value as YamlValue;

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
        const key = cstToJs(entry.key._0) as string;
        obj[key] = cstToJs(entry.value);
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
            const key = cstToJs(entry.key._0) as string;
            obj[key] = cstToJs(entry.value);
          }
          arr.push(obj);
        } else {
          arr.push(cstToJs(item._0));
        }
      }
      return arr;
    }

    // その他の配列
    return items.map((v) => cstToJs(v));
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
