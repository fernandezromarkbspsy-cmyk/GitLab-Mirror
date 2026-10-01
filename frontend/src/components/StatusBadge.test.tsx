import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Status } from "../types";
import { StatusBadge } from "./StatusBadge";

function render(status: Status) {
  return renderToStaticMarkup(<StatusBadge status={status} />);
}

describe("StatusBadge", () => {
  it.each(["DOCKED"] as Status[])(
    "uses the success treatment for %s",
    (status) => {
      const markup = render(status);
      expect(markup).toContain("bg-status-success-surface");
      expect(markup).toContain("text-status-success-ink");
    },
  );

  it("uses the pending treatment for newly requested requests", () => {
    const markup = render("REQUESTED");
    expect(markup).toContain("bg-status-pending-surface");
    expect(markup).toContain("text-status-pending-ink");
  });

  it.each(["DOCKING", "ASSIGNED"] as Status[])(
    "uses the informational treatment for %s",
    (status) => {
      const markup = render(status);
      expect(markup).toContain("bg-status-info-surface");
      expect(markup).toContain("text-status-info-ink");
    },
  );

  it("uses the danger treatment for cancelled requests", () => {
    const markup = render("CANCELLED");
    expect(markup).toContain("bg-status-danger-surface");
    expect(markup).toContain("text-status-danger-ink");
  });

  it("uses the pending treatment for rerouted requests", () => {
    const markup = render("REROUTED");
    expect(markup).toContain("bg-status-pending-surface");
    expect(markup).toContain("text-status-pending-ink");
  });

  it("preserves the distinct pending border and readable labels", () => {
    const pending = render("PENDING");
    const rejected = render("CANCELLED");

    expect(pending).toContain("border-status-pending-line");
    expect(pending).toContain(">Pending</span>");
    expect(rejected).toContain(">Cancelled</span>");
  });

  it("can preserve uppercase presentation for operational request views", () => {
    const markup = renderToStaticMarkup(
      <StatusBadge status="DOCKING" uppercase />,
    );

    expect(markup).toContain(" uppercase");
    expect(markup).toContain(">Docking</span>");
  });
});
