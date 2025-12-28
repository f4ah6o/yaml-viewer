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
 * CSTからJavaScriptオブジェクトに変換
 */
function cstToJs(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // 文字列などのプリミティブ値
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  const yamlValue = value as YamlValue;

  // 配列: _0 がエントリの配列、_1 が trivia
  if (Array.isArray(yamlValue._0)) {
    const items = yamlValue._0 as unknown[];
    // 配列の中にエントリがあるかチェック
    if (items.length > 0 && typeof items[0] === "object" && items[0] !== null && "key" in items[0]) {
      // これはマッピング（オブジェクト）
      const result: Record<string, unknown> = {};
      for (const entry of items as YamlEntry[]) {
        const key = cstToJs(entry.key._0) as string;
        result[key] = cstToJs(entry.value);
      }
      return result;
    } else if (items.length > 0 && typeof items[0] === "object" && items[0] !== null && "_0" in items[0]) {
      // これは配列項目
      const result: unknown[] = [];
      for (const item of items) {
        const arrItem = item as YamlArrayItem;
        // 配列項目の _0 はエントリの配列（オブジェクトとして扱う）
        if (Array.isArray(arrItem._0)) {
          const obj: Record<string, unknown> = {};
          for (const entry of arrItem._0 as YamlEntry[]) {
            const key = cstToJs(entry.key._0) as string;
            obj[key] = cstToJs(entry.value);
          }
          result.push(obj);
        } else {
          result.push(cstToJs(arrItem._0));
        }
      }
      return result;
    }
    return items.map((v) => cstToJs(v));
  }

  // _0 が配列の場合（トップレベルのマッピングなど）
  if (Array.isArray(yamlValue._0)) {
    const result: Record<string, unknown> = {};
    for (const entry of yamlValue._0 as YamlEntry[]) {
      const key = cstToJs(entry.key._0) as string;
      result[key] = cstToJs(entry.value);
    }
    return result;
  }

  // プリミティブ値として _0 を返す
  if (typeof yamlValue._0 === "string" || typeof yamlValue._0 === "number" || typeof yamlValue._0 === "boolean") {
    return yamlValue._0;
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
