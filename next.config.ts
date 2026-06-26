import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'zvsteels.com',
            },
            {
                protocol: 'https',
                hostname: 'user-images.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'www.napleshomes.com',
            }
        ],
    },
};

export default nextConfig;
