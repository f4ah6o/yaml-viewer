/**
 * YAMLパーサー - 簡易実装
 *
 * 注: yyjjを使用する予定だが、型定義の問題で一時的に独自実装
 */

import type { Workflow, ParseResult, ParseError } from "./types";

interface YamlNode {
  key: string;
  value: string;
  indent: number;
  children: YamlNode[];
}

/**
 * YAML文字列をパースしてJavaScriptオブジェクトに変換
 */
export function parseYaml(input: string): ParseResult<Workflow> {
  try {
    const jsResult = parseYamlToJS(input);

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
 * YAML文字列をパースしてJavaScriptオブジェクトに変換
 */
function parseYamlToJS(input: string): unknown {
  const lines = input.split("\n");
  const root: Record<string, unknown> = {};
  const stack: Array<{ node: Record<string, unknown>; indent: number; isArray: boolean }> =
    [{ node: root, indent: -1, isArray: false }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S/);
    if (indent === -1) continue; // 空行

    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue; // コメント

    // 配列要素の場合
    if (trimmed.startsWith("- ")) {
      const content = trimmed.slice(2).trim();
      const currentFrame = stack[stack.length - 1];

      // 親が配列かどうか
      if (currentFrame.isArray) {
        // 親が配列の場合、現在のレベルに戻る
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
      }

      const parent = stack[stack.length - 1];

      if (content.includes(":")) {
        // オブジェクトを含む配列要素
        const newObj: Record<string, unknown> = {};
        addToArray(parent.node, newObj);
        stack.push({ node: newObj, indent, isArray: false });

        // コロンの後の値を処理
        const colonIndex = content.indexOf(":");
        const key = content.slice(0, colonIndex).trim();
        const valuePart = content.slice(colonIndex + 1).trim();

        if (valuePart && valuePart !== "") {
          newObj[key] = parseValue(valuePart);
        }
      } else {
        // プリミティブ値
        addToArray(parent.node, parseValue(content));
      }
      continue;
    }

    // 通常のキー: 値のペア
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const valuePart = trimmed.slice(colonIndex + 1).trim();

    // 現在のレベルを見つける
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].node;

    if (valuePart === "") {
      // ネストされた値 - 次の行のインデントを見て判断
      const nextIndent = i + 1 < lines.length ? lines[i + 1].search(/\S/) : -1;

      if (nextIndent > indent) {
        // 次の行が深くなっている -> オブジェクトまたは配列
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith("- ")) {
          // 配列
          const newArr: unknown[] = [];
          current[key] = newArr;
          stack.push({ node: newArr as unknown as Record<string, unknown>, indent, isArray: true });
        } else {
          // オブジェクト
          const newObj: Record<string, unknown> = {};
          current[key] = newObj;
          stack.push({ node: newObj, indent, isArray: false });
        }
      } else {
        // 値なし
        current[key] = null;
      }
    } else if (valuePart.startsWith("|") || valuePart.startsWith(">")) {
      // マルチライン文字列 - 今は空文字列として扱う
      current[key] = "";
    } else {
      // プリミティブ値
      current[key] = parseValue(valuePart);
    }
  }

  return root;
}

// 配列に要素を追加
function addToArray(parent: unknown, value: unknown): void {
  if (Array.isArray(parent)) {
    (parent as unknown[]).push(value);
  }
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
  if (value.startsWith("[") && value.endsWith("]")) {
    const items = value.slice(1, -1).split(",").map((s) => s.trim());
    return items.map(parseValue);
  }

  // 数値
  const num = Number.parseFloat(value);
  if (!Number.isNaN(num)) return num;

  return value;
}
