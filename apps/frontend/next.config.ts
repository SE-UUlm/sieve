import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                // Proxy /api from Frontend to /api in Backend, also needed for Mocking because Mock works by intercepting outgoing requests
                // Change the env variable only works in dev mode or at build time, not at runtime
                destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5175"}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
