import withMDX from '@next/mdx' 
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4000/api/:path*", // proxy to Express
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "*",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "media1.tenor.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },

  
};

export default nextConfig;