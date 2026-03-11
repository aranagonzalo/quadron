import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    serverExternalPackages: ["pdf.js-extract", "pdfjs-dist"],
    turbopack: {},
};

export default nextConfig;
