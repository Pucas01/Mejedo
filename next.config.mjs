import fs from 'fs';

// 1. Read the version from package.json using ES Module syntax
const packageJson = fs.readFileSync('./package.json', 'utf8');
const { version } = JSON.parse(packageJson);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 2. Add the version to the public environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  
  // Your existing configuration
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4000/api/:path*", // proxy to Express
      },
      // Client-side routing - rewrite all page routes to root
      {
        source: "/about",
        destination: "/",
      },
      {
        source: "/projects",
        destination: "/",
      },
      {
        source: "/guestbook",
        destination: "/",
      },
      {
        source: "/blog",
        destination: "/",
      },
      {
        source: "/shitposts",
        destination: "/",
      },
      {
        source: "/admin",
        destination: "/",
      },
      {
        source: "/collection",
        destination: "/",
      },
      {
        source: "/webring",
        destination: "/",
      },
      {
        source: "/buttons",
        destination: "/",
      },
      {
        source: "/ado",
        destination: "/",
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
        hostname: "**", 
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