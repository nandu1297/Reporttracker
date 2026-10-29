export const REPORT_STATUSES = ["ASSIGNED", "UNDER_REVIEW", "READY_TO_SEND", "SENT"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_LABEL: Record<ReportStatus, string> = {
  ASSIGNED: "Assigned",
  UNDER_REVIEW: "Under review",
  READY_TO_SEND: "Ready to send",
  SENT: "Sent to client",
};
