/**
 * GitHub Actions API
 */

import type { ActionRef, ActionMetadata } from "./types";

/**
 * アクション参照文字列をパース
 * @example
 * parseActionRef("actions/checkout@v3") // { owner: "actions", repo: "checkout", version: "v3" }
 * parseActionRef("docker/build-push") // { owner: "docker", repo: "build-push" }
 */
export function parseActionRef(ref: string): ActionRef | null {
  // owner/repo@version または owner/repo 形式
  const match = ref.match(/^([^/]+)\/([^@/]+)(?:@([^/]+))?$/);
  if (!match) return null;

  const [, owner, repo, version] = match;
  return { owner, repo, version };
}

/**
 * GitHub REST API からリポジトリ情報を取得
 */
async function fetchRepoInfo(
  owner: string,
  repo: string,
  token?: string
): Promise<{ description: string; stars: number } | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    description: data.description || "",
    stars: data.stargazers_count || 0,
  };
}

/**
 * アクションメタデータを取得
 */
export async function fetchActionMetadata(
  ref: string,
  token?: string
): Promise<ActionMetadata | null> {
  const actionRef = parseActionRef(ref);
  if (!actionRef) return null;

  const repoInfo = await fetchRepoInfo(actionRef.owner, actionRef.repo, token);
  if (!repoInfo) return null;

  return {
    name: actionRef.repo,
    owner: actionRef.owner,
    description: repoInfo.description,
    url: `https://github.com/${actionRef.owner}/${actionRef.repo}`,
    stars: repoInfo.stars,
    version: actionRef.version,
  };
}

/**
 * アクション参照が有効かチェック
 */
export function isValidActionRef(ref: string): boolean {
  return parseActionRef(ref) !== null;
}
