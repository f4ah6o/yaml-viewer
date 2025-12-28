/**
 * YAMLパーサー - yyjjを使用
 */

import { yaml_to_jsonc } from "yyjj";
import type { Workflow, ParseResult, ParseError } from "./types";

/**
 * YAML文字列をパースしてJavaScriptオブジェクトに変換
 */
export function parseYaml(input: string): ParseResult<Workflow> {
  try {
    // yyjjでYAMLをJSONCに変換
    const result = yaml_to_jsonc(input);

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

    const jsonc = result._0;
    const jsResult = JSON.parse(jsonc);

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
