import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ApiDocsPage from "@/app/api-docs/page";

describe("Swagger API docs page", () => {
  it("renders a Swagger UI host wired to the OpenAPI endpoint", () => {
    const markup = renderToStaticMarkup(<ApiDocsPage />);

    expect(markup).toContain("Swagger API Docs");
    expect(markup).toContain("/api/openapi");
    expect(markup).toContain("swagger-ui");
    expect(markup).toContain("swagger-ui-bundle");
  });
});
