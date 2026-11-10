/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /** Basic security headers. No strict CSP: Monaco creates its workers from blob: URLs and Mermaid injects inline styles. */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },

  /** The routes used to be in Spanish: old bookmarks and shared links keep working (301). */
  async redirects() {
    return [
      { source: "/progreso", destination: "/progress", permanent: true },
      { source: "/perfil", destination: "/profile", permanent: true },
      { source: "/analysis/:id/imprimir", destination: "/analysis/:id/print", permanent: true },
      { source: "/c/:token/imprimir", destination: "/c/:token/print", permanent: true },
      { source: "/api/analysis/:id/exportar", destination: "/analysis/:id/export", permanent: true },
      { source: "/api/salud", destination: "/api/health", permanent: true },
    ];
  },
};

export default nextConfig;
