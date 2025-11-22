import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:5175/:path*", // Proxy /api to Backend, also needed for Mocking because Mock works by intercepting outgoing requests
            },
        ];
    },
};

export default nextConfig;
