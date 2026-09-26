import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Page } from "../types";
import { Pagination } from "./Pagination";

const page: Page<unknown> = {
  data: [],
  current_page: 2,
  last_page: 5,
  per_page: 20,
  from: 21,
  to: 40,
  total: 83,
};

describe("Pagination", () => {
  it("renders record context and accessible pagination controls", () => {
    const markup = renderToStaticMarkup(
      <Pagination
        page={page}
        perPage={20}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );

    expect(markup).toContain("21-40 of 83");
    expect(markup).toContain("Page 2 of 5");
    expect(markup).toContain('aria-label="Request table pagination"');
    expect(markup).toContain('aria-label="Rows per page"');
  });

  it("disables navigation while page data is unavailable", () => {
    const markup = renderToStaticMarkup(
      <Pagination
        perPage={20}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );

    expect(markup.match(/disabled=""/g)).toHaveLength(2);
    expect(markup).toContain("Loading records");
  });
});
