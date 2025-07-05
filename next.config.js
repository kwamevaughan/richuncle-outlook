module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vcmrqslmzrdyilgoglqm.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "barcode.tec-it.com",
      },
    ],
  },
  env: {
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
  },
  devIndicators: false,
  experimental: {
    optimizeCss: true,
  },
};
