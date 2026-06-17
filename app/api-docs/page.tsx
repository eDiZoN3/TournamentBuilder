import type { Metadata } from "next";
import { LocalizedText } from "@/components/ui/LocalizedText";

export const metadata: Metadata = {
  title: "Swagger API Docs | Raro Volleyball Tournament",
  description: "Interactive Swagger UI documentation for the tournament API.",
};

const swaggerUiVersion = "5.17.14";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Loaded from a pinned CDN version. TODO: add an SRI `integrity` hash
          (sha384 of the pinned asset) once generated, for tamper protection. */}
      <link
        crossOrigin="anonymous"
        href={`https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui.css`}
        rel="stylesheet"
      />
      <section className="border-b border-slate-200 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <LocalizedText k="apiDocsTitle" />
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              <LocalizedText k="apiDocsDescription" />
            </p>
          </div>
          <a
            className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950"
            href="/api/openapi"
          >
            <LocalizedText k="openApiJson" />
          </a>
        </div>
      </section>
      <div id="swagger-ui" />
      <noscript>
        <p className="p-6 text-sm text-slate-700">
          <LocalizedText k="enableJavaScriptApiDocs" />
        </p>
      </noscript>
      <script
        async
        crossOrigin="anonymous"
        src={`https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui-bundle.js`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function mountSwaggerUi() {
            var host = document.getElementById("swagger-ui");
            if (!host || host.dataset.loaded === "true") {
              return;
            }

            if (!window.SwaggerUIBundle) {
              window.setTimeout(mountSwaggerUi, 50);
              return;
            }

            host.dataset.loaded = "true";
            window.SwaggerUIBundle({
              dom_id: "#swagger-ui",
              layout: "BaseLayout",
              presets: [window.SwaggerUIBundle.presets.apis],
              url: "/api/openapi"
            });
          })();
        `,
        }}
        id="swagger-ui-init"
      />
    </main>
  );
}
