/**
 * GitHub Pages（静的ホスティング）向け設定。
 * - output: "export" で静的書き出し（out/）
 * - basePath/assetPrefix はプロジェクトページ配下 /fii-global-english/ に合わせる
 * - dev（NODE_ENV!=production）では basePath 無しでローカル動作
 * NEXT_PUBLIC_BASE_PATH をクライアントにも渡し、生 <img> のパスを合わせる。
 */
const isProd = process.env.NODE_ENV === "production";
const repoBase = isProd ? "/fii-global-english" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: repoBase,
  assetPrefix: repoBase || undefined,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: repoBase },
};

export default nextConfig;
