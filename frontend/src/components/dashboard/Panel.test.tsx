import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
  it("renders token-backed card structure and content", () => {
    const markup = renderToStaticMarkup(
      <Panel
        kicker="Distribution"
        title="Truck mix"
        description="Selected date range"
      >
        <span>Panel content</span>
      </Panel>,
    );

    expect(markup).toContain("border-card-line");
    expect(markup).toContain("bg-card-surface");
    expect(markup).toContain("rounded-card");
    expect(markup).toContain("shadow-card");
    expect(markup).toContain(">Distribution</p>");
    expect(markup).toContain(">Truck mix</h2>");
    expect(markup).toContain(">Panel content</span>");
  });

  it("preserves extension classes and optional actions", () => {
    const markup = renderToStaticMarkup(
      <Panel
        kicker="Queue"
        title="Requests"
        description="Current activity"
        className="dashboard-list-panel"
        action={<button type="button">Open</button>}
      >
        Content
      </Panel>,
    );

    expect(markup).toContain("dashboard-list-panel");
    expect(markup).toContain('<button type="button">Open</button>');
  });
});
