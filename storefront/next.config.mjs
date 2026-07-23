/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev" },
    ],
  },
}
export default nextConfig
