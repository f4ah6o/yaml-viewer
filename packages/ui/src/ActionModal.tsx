/**
 * ActionModal コンポーネント
 *
 * GitHub Actionのメタデータを表示するモーダル
 */

import type { ActionMetadata } from "@yamlviz/core";

const SOLARIZED = {
  dark: {
    bg: "#073642",
    border: "#586e75",
    text: "#839496",
    subtext: "#586e75",
    accent: "#2aa198",
    link: "#268bd2",
    modalBg: "rgba(0, 43, 54, 0.9)",
  },
  light: {
    bg: "#eee8d5",
    border: "#93a1a1",
    text: "#657b83",
    subtext: "#93a1a1",
    accent: "#268bd2",
    link: "#268bd2",
    modalBg: "rgba(253, 246, 227, 0.95)",
  },
};

interface ActionModalProps {
  action: string;
  metadata: ActionMetadata | null;
  loading: boolean;
  error: string | null;
  theme: "dark" | "light";
  onClose: () => void;
}

export function ActionModal({
  action,
  metadata,
  loading,
  error,
  theme,
  onClose,
}: ActionModalProps) {
  const colors = SOLARIZED[theme];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.bg,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "border-color 0.3s ease",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: colors.text,
              transition: "color 0.3s ease",
            }}
          >
            {action}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "none",
              background: "transparent",
              color: colors.text,
              cursor: "pointer",
              fontSize: "18px",
              transition: "color 0.3s ease",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {loading && (
            <div
              style={{
                textAlign: "center",
                color: colors.subtext,
                fontSize: "14px",
              }}
            >
              Loading...
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#dc322f",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {metadata && (
            <div>
              <div
                style={{
                  marginBottom: "16px",
                  color: colors.text,
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {metadata.description || "No description"}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "14px",
                  color: colors.subtext,
                }}
              >
                <div>by {metadata.owner}</div>
                <div>★ {metadata.stars.toLocaleString()}</div>
                {metadata.version && <div>{metadata.version}</div>}
              </div>

              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: colors.accent,
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "14px",
                  transition: "background 0.3s ease",
                }}
              >
                View on GitHub
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
