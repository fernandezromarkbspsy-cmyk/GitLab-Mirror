import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonRequestTable } from "./Skeleton";

describe("Skeleton", () => {
  it("renders the token-backed shimmer with reduced-motion support", () => {
    const markup = renderToStaticMarkup(<Skeleton />);

    expect(markup).toContain("--color-skeleton-base");
    expect(markup).toContain("--color-skeleton-highlight");
    expect(markup).toContain("animate-skeleton-shimmer");
    expect(markup).toContain("motion-reduce:animate-none");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("preserves dimensions, radius, variants, and extension classes", () => {
    const markup = renderToStaticMarkup(
      <Skeleton
        width="62%"
        height={18}
        radius={9}
        variant="subtle"
        className="self-center"
      />,
    );

    expect(markup).toContain("opacity-[.62]");
    expect(markup).toContain("self-center");
    expect(markup).toContain("width:62%");
    expect(markup).toContain("height:18px");
    expect(markup).toContain("border-radius:9px");
  });

  it("keeps request loading rows full-width and clipped to the table grid", () => {
    const markup = renderToStaticMarkup(
      <SkeletonRequestTable rows={1} columns={4} />,
    );

    expect(markup).toContain("col-span-full");
    expect(markup).toContain("min-w-0");
    expect(markup).toContain("overflow-hidden");
  });
});
