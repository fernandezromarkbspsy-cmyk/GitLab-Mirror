import type { Status } from "../types";

export const statuses: Array<Status | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED_BY_MM",
  "ASSIGNED",
  "FOR_DOCKING",
  "DOCKED",
  "CONFIRMED",
  "CANCELLED",
];
