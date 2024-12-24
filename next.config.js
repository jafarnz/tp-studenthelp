/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'tp-connect-profile-pictures.s3.amazonaws.com',
      'api.dicebear.com',
      'tpstudyconnect.s3.ap-southeast-2.amazonaws.com'
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_AWS_REGION: process.env.AWS_REGION,
    NEXT_PUBLIC_AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  },
}

module.exports = nextConfig
