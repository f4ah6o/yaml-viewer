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
  return typeof v === "object" && v !== null && "_0" in v && "_1" in v;
}

/**
 * 配列の中に「はみ出した」エントリがないかチェックして修正
 *
 * yyjjのCSTパーサーには、同じインデントレベルのマッピングエントリが
 * 配列の中にネストしてしまうバグがあります。
 * 例: jobs: の下の build, lint が同じ配列に入ってしまう
 */
function fixNestedEntries(
  items: unknown[],
  parentKey: string
): { fixed: unknown[]; extra: unknown[] } {
  const fixed: unknown[] = [];
  const extra: unknown[] = [];

  for (const item of items) {
    if (!isEntry(item)) {
      fixed.push(item);
      continue;
    }

    const key = item.key._0 as string;
    const value = item.value;

    // 値が配列の場合、その中に「はみ出した」エントリがないかチェック
    if (Array.isArray(value._0)) {
      const subItems = value._0;
      const lastIdx = subItems.length - 1;

      // 最後の要素がエントリ型で、かつ最初の要素と同じレベルに見える場合
      if (lastIdx >= 0 && isEntry(subItems[lastIdx])) {
        const lastEntry = subItems[lastIdx] as YamlEntry;
        const lastKey = lastEntry.key._0 as string;

        // jobsの特殊ケース: 値が配列項目型ではなく、値として配列を持つ場合は
        // 配列の最後のエントリは実は兄弟である可能性が高い
        if (parentKey === "jobs" && !isArrayItem(value)) {
          // 配列の最後のエントリを取り出して、extraに追加
          const newSubItems = subItems.slice(0, lastIdx);
          const newEntry = { ...item, value: { ...value, _0: newSubItems } };
          fixed.push(newEntry);
          extra.push(lastEntry);
          continue;
        }
      }
    }

    fixed.push(item);
  }

  return { fixed, extra };
}

/**
 * CSTからJavaScriptオブジェクトに変換（再帰的）
 */
function cstToJs(value: unknown, parentKey = ""): unknown {
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
    let items = yamlValue._0 as unknown[];

    // yyjjバグ修正: はみ出したエントリを分離
    const { fixed, extra } = fixNestedEntries(items, parentKey);
    items = fixed;

    // 空の配列
    if (items.length === 0) {
      // extraがある場合はそれをマッピングとして処理
      if (extra.length > 0) {
        const obj: Record<string, unknown> = {};
        for (const entry of extra as YamlEntry[]) {
          const key = cstToJs(entry.key._0) as string;
          obj[key] = cstToJs(entry.value, key);
        }
        return obj;
      }
      return [];
    }

    const first = items[0];

    // マッピング（エントリの配列）
    if (isEntry(first)) {
      const obj: Record<string, unknown> = {};
      for (const entry of items as YamlEntry[]) {
        const key = cstToJs(entry.key._0) as string;
        obj[key] = cstToJs(entry.value, key);
      }
      // extraを追加
      if (extra.length > 0) {
        for (const entry of extra as YamlEntry[]) {
          const key = cstToJs(entry.key._0) as string;
          obj[key] = cstToJs(entry.value, key);
        }
      }
      return obj;
    }

    // 配列項目の配列（YAMLの `- ` で始まる配列）
    if (isArrayItem(first)) {
      const arr: unknown[] = [];
      for (const item of items as YamlArrayItem[]) {
        if (Array.isArray(item._0)) {
          const obj: Record<string, unknown> = {};
          for (const entry of item._0 as YamlEntry[]) {
            const key = cstToJs(entry.key._0) as string;
            obj[key] = cstToJs(entry.value, key);
          }
          arr.push(obj);
        } else {
          arr.push(cstToJs(item._0, parentKey));
        }
      }
      return arr;
    }

    // その他の配列
    return items.map((v) => cstToJs(v, parentKey));
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
