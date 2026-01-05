/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

/** @type {import("next").NextConfig} */
const config = {
    output: 'standalone',
    env: {
        // Embed environment variables at build time
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        CLERK_FRONTEND_API_URL: process.env.CLERK_FRONTEND_API_URL,
        CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
        NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com'
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com'
            },
            {
                protocol: 'https',
                hostname: '*.convex.cloud'
            },
            {
                protocol: 'https',
                hostname: '*.convex.site'
            }
        ]
    },
    // Performance optimizations
    experimental: {
        // Optimize package imports for smaller bundles
        optimizePackageImports: ['@clerk/nextjs', '@hugeicons/react', 'convex']
    },
    // Modern browser targets to reduce polyfills (~11 KiB savings)
    // Targets browsers with ES2020+ support
    compiler: {
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production'
    },
    // Reduce JavaScript bundle size
    modularizeImports: {
        '@hugeicons/react': {
            transform: '@hugeicons/react/{{member}}'
        }
    }
};

export default config;
