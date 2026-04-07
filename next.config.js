/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
        config.externals = config.externals || []
        config.externals.push({
            puppeteer: 'commonjs puppeteer',
            'puppeteer-core': 'commonjs puppeteer-core',
            'puppeteer-extra': 'commonjs puppeteer-extra',
            'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
            'clone-deep': 'commonjs clone-deep',
            'merge-deep': 'commonjs merge-deep',
        })
        }
        return config
    },
    serverRuntimeConfig: {
        PROJECT_ROOT: __dirname,
    },
    images: {
        remotePatterns: [
            {
            protocol: 'https',
            hostname: '*.public.blob.vercel-storage.com',
            },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: [],
    },
}

module.exports = nextConfig