import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output:"standalone",
  reactStrictMode: true,
  compress: true,
  swcMinify: false,

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

  experimental: {},


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
        destination: '/zh',
        permanent: true
      }
    ]
  }
};

export default nextConfig;
