import fs from 'fs';

const packageJson = fs.readFileSync('./package.json', 'utf8');
const { version } = JSON.parse(packageJson);

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  
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