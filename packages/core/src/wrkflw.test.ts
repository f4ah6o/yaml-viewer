/**
 * wrkflw-mbt integration tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  initWrkflw,
  validateWorkflowJson,
  expandMatrixConfig,
  formatMatrixCombinationName,
} from "./wrkflw";

describe("wrkflw-mbt integration", () => {
  beforeAll(async () => {
    await initWrkflw();
  });

  it("should initialize WASM module", async () => {
    // If we get here, initialization succeeded
    expect(true).toBe(true);
  });

  it("should validate a valid workflow", () => {
    const workflowJson = JSON.stringify({
      name: "Test Workflow",
      on: "push",
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [{ uses: "actions/checkout@v4" }],
        },
      },
    });

    const result = validateWorkflowJson(workflowJson);
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("should detect invalid workflow", () => {
    const workflowJson = JSON.stringify({
      name: "Invalid Workflow",
      on: "push",
      jobs: {
        // Missing job name
      },
    });

    const result = validateWorkflowJson(workflowJson);
    expect(result.isValid).toBe(false);
  });

  it("should expand matrix configuration", () => {
    // wrkflw の MatrixConfig は serde(flatten) を使用しているため、
    // パラメータはトップレベルに直接配置する
    const matrixJson = JSON.stringify({
      os: ["ubuntu-20.04", "ubuntu-22.04"],
      node: ["14", "16"],
    });

    const result = expandMatrixConfig(matrixJson);
    expect(result).toHaveLength(4); // 2 os × 2 node
    expect(result[0].values).toHaveProperty("os");
    expect(result[0].values).toHaveProperty("node");
  });

  it("should format combination name", () => {
    const comboJson = JSON.stringify({
      os: "ubuntu-20.04",
      node: "16",
    });

    const name = formatMatrixCombinationName("test", comboJson);
    expect(name).toContain("test");
    expect(name).toContain("ubuntu-20.04");
    expect(name).toContain("16");
  });
});
