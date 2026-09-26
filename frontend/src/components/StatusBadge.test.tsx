import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Status } from "../types";
import { StatusBadge } from "./StatusBadge";

function render(status: Status) {
  return renderToStaticMarkup(<StatusBadge status={status} />);
}

describe("StatusBadge", () => {
  it.each(["APPROVED", "CONFIRMED", "DOCKED"] as Status[])(
    "uses the success treatment for %s",
    (status) => {
      const markup = render(status);
      expect(markup).toContain("bg-status-success-surface");
      expect(markup).toContain("text-status-success-ink");
    },
  );

  it.each(["ASSIGNED", "FOR_DOCKING"] as Status[])(
    "uses the informational treatment for %s",
    (status) => {
      const markup = render(status);
      expect(markup).toContain("bg-status-info-surface");
      expect(markup).toContain("text-status-info-ink");
    },
  );

  it.each(["CANCELLED", "REJECTED_BY_MM"] as Status[])(
    "uses the danger treatment for %s",
    (status) => {
      const markup = render(status);
      expect(markup).toContain("bg-status-danger-surface");
      expect(markup).toContain("text-status-danger-ink");
    },
  );

  it("preserves the distinct pending border and readable labels", () => {
    const pending = render("PENDING");
    const rejected = render("REJECTED_BY_MM");

    expect(pending).toContain("border-status-pending-line");
    expect(pending).toContain(">Pending</span>");
    expect(rejected).toContain(">Rejected</span>");
  });

  it("can preserve uppercase presentation for operational request views", () => {
    const markup = renderToStaticMarkup(
      <StatusBadge status="FOR_DOCKING" uppercase />,
    );

    expect(markup).toContain(" uppercase");
    expect(markup).toContain(">For docking</span>");
  });
});
