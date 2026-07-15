/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the sandbox/preview host to load dev resources (HMR + client chunks).
  // Without this, Next.js blocks cross-origin dev requests and the client
  // bundle never loads, so no route hydrates.
  allowedDevOrigins: ['*.vercel.run'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
