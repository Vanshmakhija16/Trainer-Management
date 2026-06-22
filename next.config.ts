import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `adm-zip` reads files synchronously off disk in some code paths and
  // is best left external rather than bundled by webpack/Turbopack, which
  // is the standard recommendation for zip/archive libraries in Next.js
  // server code. `unpdf` (used for PDF text extraction) is pure JS with
  // zero native dependencies, so it does NOT need to be listed here —
  // bundling it normally is what makes it safe on Vercel's serverless
  // runtime in the first place.
  serverExternalPackages: ["adm-zip"],
};

export default nextConfig;
