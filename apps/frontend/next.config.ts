import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:5175/api/:path*", // Proxy /api from Frontend to /api in Backend, also needed for Mocking because Mock works by intercepting outgoing requests
            },
        ];
    },
};

export default nextConfig;
