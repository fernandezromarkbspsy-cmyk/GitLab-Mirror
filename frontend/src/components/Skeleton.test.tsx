import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders the token-backed shimmer with reduced-motion support", () => {
    const markup = renderToStaticMarkup(<Skeleton />);

    expect(markup).toContain("--color-skeleton-base");
    expect(markup).toContain("--color-skeleton-highlight");
    expect(markup).toContain("skeleton-shimmer_1.8s_ease-in-out_infinite");
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

    expect(markup).toContain("opacity-[.72]");
    expect(markup).toContain("self-center");
    expect(markup).toContain("width:62%");
    expect(markup).toContain("height:18px");
    expect(markup).toContain("border-radius:9px");
  });
});
