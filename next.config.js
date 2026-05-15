/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async rewrites() {
    const apiCppUrl = process.env.API_URL    || 'http://api-cpp:8080'
    const apiPyUrl  = process.env.API_PY_URL || 'http://api:8000'
    return [
      // All API → C++ (search now uses libcurl for Meilisearch, no Python needed)
      { source: '/api/v1/:path*', destination: `${apiCppUrl}/api/v1/:path*` },
    ]
  },
}

module.exports = nextConfig
