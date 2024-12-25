
const nextConfig = {
  output:"export",
  reactStrictMode: true,
  compress: true,
  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         {
  //           key: "Access-Control-Allow-Methods",
  //           value: "GET, POST, PUT, DELETE",
  //         },
  //         {
  //           key: "Access-Control-Allow-Headers",
  //           value: "Origin, X-Requested-With, Content-Type, Accept",
  //         },
  //         {
  //           key: "X-XSS-Protection",
  //           value: "1; mode=block",
  //         },
  //         {
  //           key: "Access-Control-Allow-Origin",
  //           value: "*",
  //         },
  //         {
  //           key: "Content-Security-Policy",
  //           value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'; worker-src 'self'; prefetch-src 'self'; upgrade-insecure-requests; block-all-mixed-content; reflected-xss block; referrer no-referrer; require-sri-for script style; report-uri https://example.report-uri.com/r/d/csp/enforce;",
  //         },
  //       ],
  //     },
  //   ];
  // },

   // 處理 FFmpeg 和 Web Worker 問題
   webpack: (config, { isServer }) => {
    // 處理 @ffmpeg/ffmpeg Web Worker 模組解析問題
    config.module.rules.push({
      test: /@ffmpeg\/ffmpeg/,
      type: "javascript/auto", // 允許動態導入 Worker
    });

    // 修復 worker 解析問題
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: "worker-loader", options: { inline: "fallback" } },
    });

    // 禁用 server-side 相關 worker_threads，避免服務端解析錯誤
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
        fs: false, // 忽略 Node.js 的 fs 模組
      };
    }

    return config;
  },

  // images: {
  //   loader: 'custom',
  //   loaderFile: './loader/image.js',
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: '**'
  //     }
  //   ]
  // },
  async redirects () {
    return [
      {
        source: '/',
        destination: '/tc',
        permanent: true
      }
    ]
  }
};

module.exports = nextConfig;