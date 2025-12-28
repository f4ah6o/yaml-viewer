import type { ValidationIssue } from "@yamlviz/core";

interface ValidationPanelProps {
  issues: ValidationIssue[];
  isLoading: boolean;
  theme: "dark" | "light";
  onIssueClick?: (issue: ValidationIssue) => void;
}

export function ValidationPanel({
  issues,
  isLoading,
  theme,
  onIssueClick,
}: ValidationPanelProps) {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const styles = getStyles(theme);

  return (
    <div css={styles.container}>
      <div css={styles.header}>
        <span css={styles.headerTitle}>Validation</span>
        {isLoading ? (
          <span css={styles.loading}>Validating...</span>
        ) : (
          <span css={styles.summary}>
            {errors.length} error{errors.length !== 1 ? "s" : ""}, {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div css={styles.issuesList}>
        {issues.length === 0 && !isLoading ? (
          <div css={styles.noIssues}>No issues found</div>
        ) : null}
        {issues.map((issue, i) => (
          <div
            key={i}
            css={[styles.issue, styles[`issue-${issue.severity}`]]}
            onClick={() => onIssueClick?.(issue)}
          >
            <span css={styles.severityIcon}>
              {issue.severity === "error" ? "×" : "!"}
            </span>
            <span css={styles.message}>{issue.message}</span>
            {issue.jobId && <span css={styles.location}>Job: {issue.jobId}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const getStyles = (theme: "dark" | "light") => {
  const colors = theme === "dark" ? darkColors : lightColors;
  return {
    container: {
      backgroundColor: colors.panelBg,
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      padding: "12px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      paddingBottom: "8px",
      borderBottom: `1px solid ${colors.border}`,
    },
    headerTitle: {
      fontWeight: 600,
      color: colors.text,
    },
    summary: {
      fontSize: "12px",
      color: colors.textMuted,
    },
    loading: {
      fontSize: "12px",
      color: colors.textMuted,
      fontStyle: "italic",
    },
    issuesList: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    noIssues: {
      color: colors.success,
      padding: "8px 0",
      textAlign: "center" as const,
    },
    issue: {
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      padding: "6px 8px",
      borderRadius: "4px",
      cursor: onIssueClick => "pointer" : "default",
      transition: "background-color 0.15s ease",
      "&:hover": {
        backgroundColor: colors.hoverBg,
      },
    },
    "issue-error": {
      borderLeft: `3px solid ${colors.error}`,
    },
    "issue-warning": {
      borderLeft: `3px solid ${colors.warning}`,
    },
    severityIcon: {
      flexShrink: 0,
      width: "16px",
      height: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      fontWeight: "bold",
      fontSize: "12px",
    },
    "issue-error severityIcon": {
      backgroundColor: colors.error,
      color: "white",
    },
    "issue-warning severityIcon": {
      backgroundColor: colors.warning,
      color: colors.panelBg,
    },
    message: {
      flex: 1,
      color: colors.text,
      wordBreak: "break-word" as const,
    },
    location: {
      fontSize: "11px",
      color: colors.textMuted,
      flexShrink: 0,
    },
  };
};

const darkColors = {
  panelBg: "#1e1e1e",
  border: "#333",
  text: "#e0e0e0",
  textMuted: "#8b8b8b",
  success: "#4ec9b0",
  error: "#f14c4c",
  warning: "#ffab00",
  hoverBg: "#2a2a2a",
};

const lightColors = {
  panelBg: "#ffffff",
  border: "#e0e0e0",
  text: "#333333",
  textMuted: "#666666",
  success: "#2da44e",
  error: "#cf222e",
  warning: "#d29922",
  hoverBg: "#f6f8fa",
};
