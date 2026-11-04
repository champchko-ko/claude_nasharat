import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // Restore uploads carry a whole backup in one action call. The client
      // refuses files above MAX_BACKUP_BYTES (10 MB, src/lib/backup/maxBackupBytes.ts);
      // this leaves room for the action envelope around that file.
      bodySizeLimit: "12mb",
    },
  },
  // The E2E gate builds with its own output directory so it never overwrites
  // the dev server's `.next` cache (and vice versa).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
      {
        // PDF and image previews are embedded only by this application's document dialog.
        // This narrow override retains clickjacking protection for every other API response.
        source: "/api/documents/:id/preview",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
