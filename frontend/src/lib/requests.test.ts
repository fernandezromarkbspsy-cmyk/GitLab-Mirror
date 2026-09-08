import { describe, expect, it } from "vitest";
import {
  defaultRequestFilters,
  requestMetricsQueryString,
  requestQueryString,
} from "./requests";
import { getAppPath, getAppView } from "./routes";

describe("request query builders", () => {
  it("serializes the default request filters", () => {
    expect(requestQueryString(defaultRequestFilters)).toBe(
      "page=1&per_page=20&sort=created_at&direction=desc",
    );
  });

  it("omits the ALL status and encodes active filters", () => {
    const query = requestQueryString(defaultRequestFilters, {
      status: "PENDING",
      search: "North Hub",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-08",
      page: 2,
      perPage: 50,
    });

    expect(query).toBe(
      "page=2&per_page=50&sort=created_at&direction=desc&status=PENDING&search=North+Hub&date_from=2026-09-01&date_to=2026-09-08",
    );
  });

  it("builds metrics filters without pagination fields", () => {
    expect(
      requestMetricsQueryString({
        search: "Hub",
        dateFrom: "2026-09-01",
        dateTo: "",
      }),
    ).toBe("search=Hub&date_from=2026-09-01");
  });

  it("keeps application paths and views reversible", () => {
    expect(getAppView(getAppPath("truck-request"))).toBe("truck-request");
    expect(getAppView("/unknown")).toBe("overview");
  });
});
