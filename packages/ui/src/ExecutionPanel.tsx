import type { ExecutionEvent } from "@yamlviz/core";

interface ExecutionStep {
  name: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  logs?: string[];
  duration?: number;
}

interface ExecutionJob {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "failed";
  steps: ExecutionStep[];
}

interface ExecutionPanelProps {
  jobs: ExecutionJob[];
  currentJob?: string;
  isRunning: boolean;
  theme: "dark" | "light";
  onStop?: () => void;
}

export function ExecutionPanel({
  jobs,
  currentJob,
  isRunning,
  theme,
  onStop,
}: ExecutionPanelProps) {
  const styles = getStyles(theme);

  return (
    <div css={styles.container}>
      <div css={styles.header}>
        <span css={styles.headerTitle}>Execution</span>
        <div css={styles.headerActions}>
          {isRunning && onStop && (
            <button css={styles.stopButton} onClick={onStop}>
              Stop
            </button>
          )}
          <span css={styles.status}>
            {isRunning ? "Running..." : "Completed"}
          </span>
        </div>
      </div>

      <div css={styles.jobsList}>
        {jobs.map((job) => (
          <div
            key={job.id}
            css={[
              styles.job,
              job.id === currentJob && styles.jobCurrent,
              styles[`job-${job.status}`],
            ]}
          >
            <div css={styles.jobHeader}>
              <span css={styles.jobName}>{job.name || job.id}</span>
              <span css={styles.jobStatus}>
                {getStatusIcon(job.status)}
              </span>
            </div>

            {job.steps.length > 0 && (
              <div css={styles.stepsList}>
                {job.steps.map((step, idx) => (
                  <div
                    key={idx}
                    css={[styles.step, styles[`step-${step.status}`]]}
                  >
                    <span css={styles.stepStatus}>
                      {getStatusIcon(step.status)}
                    </span>
                    <span css={styles.stepName}>{step.name}</span>
                    {step.duration && (
                      <span css={styles.stepDuration}>
                        {formatDuration(step.duration)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "success":
      return "✓";
    case "failed":
      return "×";
    case "running":
      return "⟳";
    case "skipped":
      return "⊘";
    default:
      return "○";
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
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
    headerActions: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    status: {
      fontSize: "12px",
      color: colors.textMuted,
    },
    stopButton: {
      padding: "4px 12px",
      fontSize: "12px",
      backgroundColor: colors.error,
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      "&:hover": {
        opacity: 0.9,
      },
    },
    jobsList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    job: {
      border: `1px solid ${colors.border}`,
      borderRadius: "4px",
      overflow: "hidden",
    },
    jobCurrent: {
      borderColor: colors.primary,
    },
    "job-pending": {
      opacity: 0.7,
    },
    "job-running": {
      borderColor: colors.running,
    },
    "job-success": {
      borderColor: colors.success,
    },
    "job-failed": {
      borderColor: colors.error,
    },
    jobHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 8px",
      backgroundColor: colors.jobHeaderBg,
    },
    jobName: {
      fontWeight: 500,
      color: colors.text,
    },
    jobStatus: {
      fontSize: "14px",
    },
    "job-success jobStatus": {
      color: colors.success,
    },
    "job-failed jobStatus": {
      color: colors.error,
    },
    "job-running jobStatus": {
      color: colors.running,
    },
    stepsList: {
      padding: "4px 0",
    },
    step: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 8px",
      fontSize: "12px",
    },
    "step-pending": {
      color: colors.textMuted,
    },
    "step-running": {
      color: colors.running,
    },
    "step-success": {
      color: colors.success,
    },
    "step-failed": {
      color: colors.error,
    },
    stepStatus: {
      fontSize: "10px",
    },
    stepName: {
      flex: 1,
      color: colors.text,
    },
    stepDuration: {
      fontSize: "11px",
      color: colors.textMuted,
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
  primary: "#007acc",
  running: "#ffab00",
  jobHeaderBg: "#2d2d2d",
};

const lightColors = {
  panelBg: "#ffffff",
  border: "#e0e0e0",
  text: "#333333",
  textMuted: "#666666",
  success: "#2da44e",
  error: "#cf222e",
  warning: "#d29922",
  primary: "#0969da",
  running: "#d29922",
  jobHeaderBg: "#f6f8fa",
};
