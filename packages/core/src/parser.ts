/**
 * YAMLパーサー - yyjjのラッパー
 */

import type { Workflow, ParseResult, ParseError } from "./types";

// yyjjのMoonBit Result型をアンラップ
interface MoonBitResult {
  $tag: 0 | 1; // 0 = Err, 1 = Ok
  _0: unknown;
}

/**
 * YAML文字列をパースしてJavaScriptオブジェクトに変換
 */
export function parseYaml(input: string): ParseResult<Workflow> {
  try {
    // yyjjからparse_yamlを動的インポート
    const yyjj = import("yyjj");
    const result = yyjj.then((m) => {
      const parseResult = m.parse_yaml(input) as MoonBitResult;

      if (parseResult.$tag === 1) {
        // Ok - ネストした構造をflatなJSオブジェクトに変換
        return convertMoonBitToJS(parseResult._0);
      } else {
        // Err
        return {
          ok: false,
          error: {
            message: String(parseResult._0),
          },
        } as const;
      }
    });

    // 同期的に処理するため、ここでは一旦簡易実装
    // TODO: yyjjのResult型の正しいハンドリング
    const jsResult = convertYamlToJS(input);

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

/**
 * yyjjを使用せず、簡易YAMLパーサー
 * 注: 本来はyyjjを使うべきですが、MoonBit型との相互運用性の問題から
 * 一時的に別のアプローチを使用
 */
function convertYamlToJS(input: string): unknown {
  // 簡易実装 - 本来はyyjjを使用
  // YAMLの基本構造をパースしてJSオブジェクトに変換

  const lines = input.split("\n");
  const result: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (const line of lines) {
    const indent = line.search(/\S/);
    if (indent === -1) continue; // 空行

    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue; // コメント

    // 現在のレベルを見つける
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;
    const colonIndex = trimmed.indexOf(":");

    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const valuePart = trimmed.slice(colonIndex + 1).trim();

    if (valuePart === "") {
      // ネストしたオブジェクトの開始
      const newObj: Record<string, unknown> = {};
      current[key] = newObj;
      stack.push({ obj: newObj, indent });
    } else if (valuePart.startsWith("|") || valuePart.startsWith(">")) {
      // マルチライン文字列
      current[key] = "";
    } else {
      // 値
      current[key] = parseValue(valuePart);
    }
  }

  return result;
}

function parseValue(value: string): unknown {
  // クォートで囲まれた文字列
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // 真偽値
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;

  // 配列
  if (value.startsWith("- ")) {
    return value.slice(2).trim();
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const items = value.slice(1, -1).split(",").map((s) => s.trim());
    return items.map(parseValue);
  }

  // 数値
  const num = Number.parseFloat(value);
  if (!Number.isNaN(num)) return num;

  return value;
}

/**
 * MoonBitのResult型からJSオブジェクトに変換（仮実装）
 */
function convertMoonBitToJS(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  // MoonBitのタグ付き共用体を処理
  if ("$tag" in value && "_0" in value) {
    return convertMoonBitToJS((value as { _0: unknown })._0);
  }

  // 配列
  if (Array.isArray(value)) {
    return value.map(convertMoonBitToJS);
  }

  // オブジェクト
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (key !== "$tag" && key !== "_0") {
      result[key] = convertMoonBitToJS(val);
    }
  }
  return result;
}
